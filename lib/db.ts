import { supabase } from '../src/supabaseClient';

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

let supabaseLimitReached = false;

export const getSupabaseLimitStatus = () => supabaseLimitReached;
export const resetSupabaseLimitStatus = () => { supabaseLimitReached = false; };

const readCache = (cacheKey: string, ttlMs: number, force?: boolean): any[] | null => {
  if (force) return null;
  const cached = localStorage.getItem(cacheKey);
  const cachedTs = Number(localStorage.getItem(`${cacheKey}_ts`) || 0);
  if (cached && cachedTs && Date.now() - cachedTs < ttlMs) {
    return JSON.parse(cached);
  }
  return null;
};

const writeCache = (cacheKey: string, items: any[]) => {
  localStorage.setItem(cacheKey, JSON.stringify(items));
  localStorage.setItem(`${cacheKey}_ts`, Date.now().toString());
};

const checkSupabaseError = (error: any) => {
  if (error && (error.message?.includes('quota') || error.message?.includes('limit'))) {
    supabaseLimitReached = true;
    console.warn('⚠️ Supabase limit');
    return true;
  }
  return false;
};

export const checkFirestoreConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

export const optimizeImage = async (file: File, quality: number = 0.8, maxWidth: number = 2000): Promise<Blob> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
      };
    };
  });
};

class DataStore {
  collection(tableName: string) {
    const cacheKey = `jakub_minka_cache_${tableName}`;

    return {
      getAll: async (options?: { force?: boolean; ttlMs?: number }): Promise<any[]> => {
        const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
        const cached = readCache(cacheKey, ttlMs, options?.force);
        if (cached) return cached;
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          if (error) throw error;
          const items = data || [];
          writeCache(cacheKey, items);
          return items;
        } catch (e) {
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : [];
        }
      },

      save: async (item: any): Promise<void> => {
        const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        const updatedLocal = [item, ...localData.filter((i: any) => i.id !== item.id)];
        writeCache(cacheKey, updatedLocal);

        if (!supabaseLimitReached) {
          try {
            const { error } = await supabase
              .from(tableName)
              .upsert([{ ...item, updated_at: new Date().toISOString() }], { onConflict: 'id' });
            
            if (error) checkSupabaseError(error);
          } catch (e: any) {
            checkSupabaseError(e);
          }
        }
        window.dispatchEvent(new Event('storage'));
      },

      delete: async (id: string): Promise<void> => {
        const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        const updatedLocal = localData.filter((i: any) => i.id !== id);
        writeCache(cacheKey, updatedLocal);

        if (!supabaseLimitReached) {
          try {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) checkSupabaseError(error);
          } catch (e: any) {
            checkSupabaseError(e);
          }
        }
        window.dispatchEvent(new Event('storage'));
      },

      update: async (id: string, data: any): Promise<void> => {
        const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        const updatedLocal = localData.map((i: any) => i.id === id ? { ...i, ...data } : i);
        writeCache(cacheKey, updatedLocal);

        if (!supabaseLimitReached) {
          try {
            const { error } = await supabase
              .from(tableName)
              .update({ ...data, updated_at: new Date().toISOString() })
              .eq('id', id);
            if (error) checkSupabaseError(error);
          } catch (e: any) {
            checkSupabaseError(e);
          }
        }
        window.dispatchEvent(new Event('storage'));
      }
    };
  }

  doc(docId: string) {
    const cacheKey = `jakub_minka_settings_${docId}`;
    return {
      get: async () => {
        try {
          const { data, error } = await supabase
            .from('web_settings')
            .select('*')
            .eq('id', docId)
            .single();
          
          if (error) throw error;
          if (data) {
            writeCache(cacheKey, [data]);
            return data;
          }
        } catch (e) {
          const cached = localStorage.getItem(cacheKey);
          return cached ? JSON.parse(cached)[0] : {};
        }
      },

      set: async (data: any) => {
        writeCache(cacheKey, [data]);
        if (!supabaseLimitReached) {
          try {
            const { error } = await supabase
              .from('web_settings')
              .upsert([{ id: docId, ...data, updated_at: new Date().toISOString() }], { onConflict: 'id' });
            
            if (error) checkSupabaseError(error);
          } catch (e: any) {
            checkSupabaseError(e);
          }
        }
        window.dispatchEvent(new Event('storage'));
      }
    };
  }
}

export const dataStore = new DataStore();

export class MediaDB {
  private cacheKey = 'jakub_minka_media_cache';

  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('media_meta')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      writeCache(this.cacheKey, data || []);
      return data || [];
    } catch (e) {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  }

  async save(item: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, [item, ...current.filter((i: any) => i.id !== item.id)]);
    
    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('media_meta').upsert([item], { onConflict: 'id' });
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
  }

  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, current.filter((i: any) => i.id !== id));

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('media_meta').delete().eq('id', id);
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
  }

  async update(id: string, data: any): Promise<any> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    const updated = current.map((i: any) => i.id === id ? { ...i, ...data } : i);
    writeCache(this.cacheKey, updated);

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('media_meta').update(data).eq('id', id).select();
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
    return updated.find((i: any) => i.id === id);
  }
}

export const mediaDB = new MediaDB();

export class BlogDB {
  private cacheKey = 'jakub_minka_blog_cache';

  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('blog')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      writeCache(this.cacheKey, data || []);
      return data || [];
    } catch (e) {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  }

  async save(item: any): Promise<any> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    const updated = [item, ...current.filter((i: any) => i.id !== item.id)];
    writeCache(this.cacheKey, updated);

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('blog').upsert([item], { onConflict: 'id' });
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
    return item;
  }

  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, current.filter((i: any) => i.id !== id));

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('blog').delete().eq('id', id);
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
  }
}

export const blogDB = new BlogDB();

export class ProjectDB {
  private cacheKey = 'jakub_minka_projects_cache';

  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      writeCache(this.cacheKey, data || []);
      return data || [];
    } catch (e) {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  }

  async save(item: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, [item, ...current.filter((i: any) => i.id !== item.id)]);
    
    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('projects').upsert([item], { onConflict: 'id' });
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
  }

  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, current.filter((i: any) => i.id !== id));

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
  }

  async update(id: string, data: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, current.map((i: any) => i.id === id ? { ...i, ...data } : i));

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase.from('projects').update(data).eq('id', id);
        if (error) checkSupabaseError(error);
      } catch (e: any) {
        checkSupabaseError(e);
      }
    }
    window.dispatchEvent(new Event('storage'));
  }
}

export const projectDB = new ProjectDB();
