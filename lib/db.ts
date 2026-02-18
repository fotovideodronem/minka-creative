
import { supabase } from '../src/supabaseClient';

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes - much longer to reduce Supabase reads

let supabaseLimitReached = false;

export const getSupabaseLimitStatus = () => supabaseLimitReached;
export const resetSupabaseLimitStatus = () => { supabaseLimitReached = false; };

const invalidateCache = (cacheKey: string) => {
  localStorage.removeItem(cacheKey);
  localStorage.removeItem(`${cacheKey}_ts`);
};

const checkSupabaseError = (error: any) => {
  if (error && (error.message?.includes('quota') || error.message?.includes('limit') || error.code === 'PGRST301')) {
    supabaseLimitReached = true;
    console.warn('⚠️ Supabase limit dosažen - používám pouze localStorage');
    return true;
  }
  return false;
};

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

// Check Supabase connection
export const checkFirestoreConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('blog').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};


// Image optimization for uploads
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
          // Only select necessary columns for API optimization
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000); // Prevent loading unbounded data
          
          if (error) throw error;
          
          const items = data || [];
          writeCache(cacheKey, items);
          return items;
        } catch (e) {
          console.warn(`Supabase (${tableName}) unavailable, using local cache.`);
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : [];
        }
      },

      save: async (item: any): Promise<void> => {
        try {
          // Optimistic update: update cache immediately
          const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updatedLocal = [item, ...localData.filter((i: any) => i.id !== item.id)];
          writeCache(cacheKey, updatedLocal);

          if (!supabaseLimitReached) {
            try {
              const { error } = await supabase
                .from(tableName)
                .upsert([{ ...item, updated_at: new Date().toISOString() }], { onConflict: 'id' });
              
              if (error) {
                checkSupabaseError(error);
                if (!supabaseLimitReached) throw error;
              }
            } catch (e: any) {
              checkSupabaseError(e);
              if (!supabaseLimitReached) {
                console.error(`Save error for ${tableName}:`, e);
              }
            }
          }
        } catch (e) {
          console.error("Save error:", e);
        }
        window.dispatchEvent(new Event('storage'));
      },

      delete: async (id: string): Promise<void> => {
        try {
          // Optimistic update: remove from cache immediately
          const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updatedLocal = localData.filter((i: any) => i.id !== id);
          writeCache(cacheKey, updatedLocal);

          if (!supabaseLimitReached) {
            try {
              const { error } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id);
              
              if (error) {
                checkSupabaseError(error);
                if (!supabaseLimitReached) throw error;
              }
            } catch (e: any) {
              checkSupabaseError(e);
              if (!supabaseLimitReached) {
                console.error(`Delete error for ${tableName}:`, e);
              }
            }
          }
        } catch (e) {
          console.error("Delete error:", e);
        }
        window.dispatchEvent(new Event('storage'));
      },

      update: async (id: string, data: any): Promise<void> => {
        try {
          // Optimistic update: update cache immediately
          const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updatedLocal = localData.map((i: any) => i.id === id ? { ...i, ...data } : i);
          writeCache(cacheKey, updatedLocal);

          if (!supabaseLimitReached) {
            try {
              const { error } = await supabase
                .from(tableName)
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id);
              
              if (error) {
                checkSupabaseError(error);
                if (!supabaseLimitReached) throw error;
              }
            } catch (e: any) {
              checkSupabaseError(e);
              if (!supabaseLimitReached) {
                console.error(`Update error for ${tableName}:`, e);
              }
            }
          }
        } catch (e) {
          console.error("Update error:", e);
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
            writeCache(cacheKey, data);
            return data;
          }
          throw new Error("Doc not found");
        } catch (e) {
          return JSON.parse(localStorage.getItem(cacheKey) || '{}');
        }
      },

      set: async (data: any) => {
        writeCache(cacheKey, data);
        if (!supabaseLimitReached) {
          try {
            const { error } = await supabase
              .from('web_settings')
              .upsert([{ id: docId, ...data, updated_at: new Date().toISOString() }], { onConflict: 'id' });
            
            if (error) {
              checkSupabaseError(error);
              if (!supabaseLimitReached) throw error;
            }
          } catch (e: any) {
            checkSupabaseError(e);
            if (!supabaseLimitReached) {
              console.error("Doc set error:", e);
            }
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

  // Convert camelCase to snake_case for database
  private toSnakeCase(item: any) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      size: item.size,
      url: item.url,
      parent_id: item.parentId || null,
      specialization_id: item.specializationId || null,
      updated_at: new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString()
    };
  }

  // Convert snake_case from database to camelCase for frontend
  private toCamelCase(item: any) {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      size: item.size,
      url: item.url,
      parentId: item.parent_id || null,
      specializationId: item.specialization_id,
      updated_at: item.updated_at,
      created_at: item.created_at
    };
  }

  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    if (cached) return cached;
    try {
      // Limit to 500 items and only select necessary columns
      const { data, error } = await supabase
        .from('media_meta')
        .select('id, name, type, url, parent_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      const items = (data || []).map(item => this.toCamelCase(item));
      writeCache(this.cacheKey, items);
      return items;
    } catch (e) {
      return JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    }
  }

  async save(item: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, [item, ...current.filter((i: any) => i.id !== item.id)]);
    
    if (!supabaseLimitReached) {
      try {
        const dbItem = this.toSnakeCase(item);
        const { error } = await supabase
          .from('media_meta')
          .upsert([dbItem], { onConflict: 'id' });
        
        if (error) {
          checkSupabaseError(error);
          if (!supabaseLimitReached) throw error;
        }
      } catch (e: any) {
        checkSupabaseError(e);
        if (!supabaseLimitReached) {
          console.error("Media save error:", e);
        }
      }
    }
    window.dispatchEvent(new Event('storage'));
  }

  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    const updated = current.filter((i: any) => i.id !== id);
    writeCache(this.cacheKey, updated);

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase
          .from('media_meta')
          .delete()
          .eq('id', id);
        
        if (error) {
          checkSupabaseError(error);
          if (!supabaseLimitReached) throw error;
        }
      } catch (e: any) {
        checkSupabaseError(e);
        if (!supabaseLimitReached) {
          console.error("Media delete error:", e);
        }
      }
    }
    window.dispatchEvent(new Event('storage'));
  }

  async update(id: string, data: any): Promise<any> {
    try {
      const dbData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Map camelCase to snake_case
      if (data.name !== undefined) dbData.name = data.name;
      if (data.type !== undefined) dbData.type = data.type;
      if (data.url !== undefined) dbData.url = data.url;
      if ('parentId' in data) dbData.parent_id = data.parentId;
      if ('specializationId' in data) dbData.specialization_id = data.specializationId;
      
      console.log('🔄 Updating media_meta in Supabase:', { id, dbData });
      
      const { error, data: response } = await supabase
        .from('media_meta')
        .update(dbData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Update error from Supabase:', error);
        throw new Error(`Supabase update failed: ${error.message}`);
      }
      
      console.log('✅ Update successful for id:', id, 'Raw response:', response);
      
      // Convert response to camelCase
      const camelCaseResponse = response ? response.map((item: any) => this.toCamelCase(item)) : [];
      
      // Update localStorage cache
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      const updated = current.map((i: any) => i.id === id ? camelCaseResponse[0] || i : i);
      writeCache(this.cacheKey, updated);
      
      window.dispatchEvent(new Event('storage'));
      return camelCaseResponse[0] || { id, ...data };
    } catch (e: any) {
      console.error("❌ Media update error:", e);
      throw e;
    }
  }
}

export const mediaDB = new MediaDB();

export class BlogDB {
  private cacheKey = 'jakub_minka_blog_cache';

  // Convert camelCase to snake_case for database
  private toSnakeCase(item: any) {
    return {
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      image_url: item.coverImage || item.image_url,
      author: item.author,
      // tags: Array.isArray(item.tags) ? item.tags : [], // Removed - column not in schema cache
      date: item.date,
      updated_at: new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString()
    };
  }

  // Convert snake_case from database to camelCase for frontend
  private toCamelCase(item: any) {
    return {
      id: item.id,
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      coverImage: item.image_url,
      author: item.author,
      tags: Array.isArray(item.tags) ? item.tags : [],
      date: item.date,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    if (cached) return cached;
    try {
      // Only fetch necessary columns to reduce egress
      const { data, error } = await supabase
        .from('blog')
        .select('id, title, excerpt, content, image_url, author, date, created_at')
        .order('date', { ascending: false })
        .limit(100); // Limit to recent blogs
      
      if (error) throw error;
      const items = (data || []).map(item => this.toCamelCase(item));
      writeCache(this.cacheKey, items);
      return items;
    } catch (e) {
      console.error('Blog load error:', e);
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  }

  async save(item: any): Promise<any> {
    try {
      // Optimistic update: update cache immediately
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      const updated = [item, ...current.filter((i: any) => i.id !== item.id)];
      writeCache(this.cacheKey, updated);

      if (!supabaseLimitReached) {
        const dbItem = this.toSnakeCase(item);
        console.log('📝 [BLOG SAVE] Original item:', item);
        console.log('📝 [BLOG SAVE] Converted to snake_case:', dbItem);
        
        // Try without .select() first to avoid column access issues
        const { error } = await supabase
          .from('blog')
          .upsert([dbItem], { onConflict: 'id' });
        
        if (error) {
          console.error('❌ [BLOG SAVE] Supabase error:', error);
          checkSupabaseError(error);
          if (!supabaseLimitReached) throw error;
        } else {
          console.log('✅ [BLOG SAVE] Success');
        }
      }
      
      window.dispatchEvent(new Event('storage'));
      return item;
    } catch (e: any) {
      checkSupabaseError(e);
      if (!supabaseLimitReached) {
        console.error('❌ [BLOG SAVE] Full error:', e);
        throw e;
      }
      return item; // Return item even if DB fails (we have it in cache)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      const updated = current.filter((i: any) => i.id !== id);
      writeCache(this.cacheKey, updated);

      if (!supabaseLimitReached) {
        const { error } = await supabase
          .from('blog')
          .delete()
          .eq('id', id);
        
        if (error) {
          checkSupabaseError(error);
          if (!supabaseLimitReached) throw error;
        }
      }
    } catch (e: any) {
      checkSupabaseError(e);
      if (!supabaseLimitReached) {
        console.error('Blog delete error:', e);
        throw e;
      }
    }
    window.dispatchEvent(new Event('storage'));
  }
}

export const blogDB = new BlogDB();

export class ProjectDB {
  private cacheKey = 'jakub_minka_projects_cache';

  // Convert camelCase to snake_case for database
  private toSnakeCase(item: any) {
    return {
      id: item.id,
      title: item.title,
      short_description: item.shortDescription,
      description: item.description,
      category: item.category,
      category_id: item.categoryId,
      type: item.type,
      date: item.date,
      thumbnail_url: item.thumbnailUrl,
      thumbnail_source: item.thumbnailSource,
      gallery: item.gallery,
      services_delivered: item.servicesDelivered,
      updated_at: new Date().toISOString(),
      created_at: item.created_at || new Date().toISOString()
    };
  }

  // Convert snake_case from database to camelCase for frontend
  private toCamelCase(item: any) {
    return {
      id: item.id,
      title: item.title,
      shortDescription: item.short_description,
      description: item.description,
      category: item.category,
      categoryId: item.category_id,
      type: item.type,
      date: item.date,
      thumbnailUrl: item.thumbnail_url,
      thumbnailSource: item.thumbnail_source,
      gallery: item.gallery,
      servicesDelivered: item.services_delivered,
      youtubeUrl: item.youtube_url,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    if (cached) return cached;
    try {
      // Only fetch necessary columns, limit to reduce egress
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, short_description, category, category_id, type, date, thumbnail_url, gallery, created_at')
        .order('date', { ascending: false })
        .limit(100); // Limit to recent projects
      
      if (error) throw error;
      const items = (data || []).map(item => this.toCamelCase(item));
      writeCache(this.cacheKey, items);
      return items;
    } catch (e) {
      console.error("Project getAll error:", e);
      return JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    }
  }

  async save(item: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    const updated = [item, ...current.filter((i: any) => i.id !== item.id)];
    writeCache(this.cacheKey, updated);
    
    if (!supabaseLimitReached) {
      try {
        const dbItem = this.toSnakeCase(item);
        console.log('Saving project to DB:', dbItem);
        const { error } = await supabase
          .from('projects')
          .upsert([dbItem], { onConflict: 'id' });
        
        if (error) {
          checkSupabaseError(error);
          if (!supabaseLimitReached) throw error;
        }
        // Project saved successfully
      } catch (e: any) {
        checkSupabaseError(e);
        if (!supabaseLimitReached) {
          console.error("Project save error:", e);
          throw e;
        }
      }
    }
    window.dispatchEvent(new Event('storage'));
  }

  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    const updated = current.filter((i: any) => i.id !== id);
    writeCache(this.cacheKey, updated);

    if (!supabaseLimitReached) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);
        
        if (error) {
          checkSupabaseError(error);
          if (!supabaseLimitReached) throw error;
        }
      } catch (e: any) {
        checkSupabaseError(e);
        if (!supabaseLimitReached) {
          console.error("Project delete error:", e);
          throw e;
        }
      }
    }
    window.dispatchEvent(new Event('storage'));
  }
}

export const projectDB = new ProjectDB();
