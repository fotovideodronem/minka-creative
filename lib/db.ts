import { supabase } from '../src/supabaseClient';

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

const writeCache = (cacheKey: string, items: any[]) => {
  localStorage.setItem(cacheKey, JSON.stringify(items));
  localStorage.setItem(`${cacheKey}_ts`, Date.now().toString());
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

export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('blog').select('id').limit(1);
    return !error;
  } catch (err) {
    console.warn('Supabase connection error:', err);
    return false;
  }
};
export const getSupabaseLimitStatus = () => false;
export const resetSupabaseLimitStatus = () => {};

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
          const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false });
          if (error) throw error;
          const result = data || [];
          writeCache(cacheKey, result);
          return result;
        } catch (err) {
          console.warn(`Error fetching from Supabase ${tableName}:`, err);
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : [];
        }
      },
      save: async (item: any): Promise<any> => {
        if (!item.id) item.id = crypto.randomUUID?.() || Date.now().toString();
        try {
          const { data, error } = await supabase.from(tableName).upsert({ ...item, id: item.id }, { onConflict: 'id', returning: 'representation' });
          if (error) throw error;
          const saved = data?.[0] || item;
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = [saved, ...local.filter((i: any) => i.id !== item.id)];
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
          return saved;
        } catch (err) {
          console.error(`Error saving to Supabase ${tableName}:`, err);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = [item, ...local.filter((i: any) => i.id !== item.id)];
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
          return item;
        }
      },
      delete: async (id: string): Promise<void> => {
        try {
          const { error } = await supabase.from(tableName).delete().eq('id', id);
          if (error) throw error;
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.filter((i: any) => i.id !== id);
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error(`Error deleting from Supabase ${tableName}:`, err);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.filter((i: any) => i.id !== id);
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
        }
      },
      update: async (id: string, data: any): Promise<any> => {
        try {
          const { data: updatedRows, error } = await supabase.from(tableName).update(data).eq('id', id).select();
          if (error) throw error;
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.map((i: any) => i.id === id ? { ...i, ...data } : i);
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
          return updatedRows?.[0] || updated.find((i: any) => i.id === id);
        } catch (err) {
          console.error(`Error updating Supabase ${tableName}:`, err);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.map((i: any) => i.id === id ? { ...i, ...data } : i);
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
          return updated.find((i: any) => i.id === id);
        }
      }
    };
  }
  doc(docId: string) {
    const cacheKey = `jakub_minka_settings_${docId}`;
    const docRef = doc(db, 'settings', docId);

    return {
      get: async () => {
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            localStorage.setItem(cacheKey, JSON.stringify(data));
            return data;
          }
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : {};
        } catch (err) {
          console.warn('Error getting Firestore doc:', err);
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : {};
        }
      },
      set: async (data: any) => {
        try {
          await updateDoc(docRef, data);
          localStorage.setItem(cacheKey, JSON.stringify({ id: docId, ...data }));
          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error('Error setting Firestore doc:', err);
          localStorage.setItem(cacheKey, JSON.stringify({ id: docId, ...data }));
        }
      }
    };
  }
}

export const dataStore = new DataStore();

export class MediaDB {
  private cacheKey = 'jakub_minka_media_cache';
  private firebaseCollection = collection(db, 'media');

  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    if (cached) return cached;

    try {
      const snapshot = await getDocs(this.firebaseCollection);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      writeCache(this.cacheKey, items);
      return items;
    } catch (err) {
      console.warn('Error fetching media:', err);
      const local = localStorage.getItem(this.cacheKey);
      return local ? JSON.parse(local) : [];
    }
  }

  async save(item: any): Promise<void> {
    try {
      if (!item.id) item.id = crypto.randomUUID?.() || Date.now().toString();
      if (item.id) {
        const docRef = doc(this.firebaseCollection, item.id);
        await updateDoc(docRef, item);
      } else {
        await addDoc(this.firebaseCollection, item);
      }
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      writeCache(this.cacheKey, [item, ...current.filter((i: any) => i.id !== item.id)]);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error saving media:', err);
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      writeCache(this.cacheKey, [item, ...current.filter((i: any) => i.id !== item.id)]);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(this.firebaseCollection, id);
      await deleteDoc(docRef);
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      writeCache(this.cacheKey, current.filter((i: any) => i.id !== id));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error deleting media:', err);
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      writeCache(this.cacheKey, current.filter((i: any) => i.id !== id));
    }
  }

  async update(id: string, data: any): Promise<any> {
    try {
      const docRef = doc(this.firebaseCollection, id);
      await updateDoc(docRef, data);
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      const updated = current.map((i: any) => i.id === id ? { ...i, ...data } : i);
      writeCache(this.cacheKey, updated);
      window.dispatchEvent(new Event('storage'));
      return updated.find((i: any) => i.id === id);
    } catch (err) {
      console.error('Error updating media:', err);
      const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      const updated = current.map((i: any) => i.id === id ? { ...i, ...data } : i);
      writeCache(this.cacheKey, updated);
      return updated.find((i: any) => i.id === id);
    }
  }
}

export const mediaDB = new MediaDB();

export class BlogDB {
  private cacheKey = 'jakub_minka_blog_cache';
  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    return cached || [];
  }
  async save(item: any): Promise<any> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    const updated = [item, ...current.filter((i: any) => i.id !== item.id)];
    writeCache(this.cacheKey, updated);
    window.dispatchEvent(new Event('storage'));
    return item;
  }
  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, current.filter((i: any) => i.id !== id));
    window.dispatchEvent(new Event('storage'));
  }
}

export const blogDB = new BlogDB();

export class ProjectDB {
  private cacheKey = 'jakub_minka_projects_cache';
  async getAll(options?: { force?: boolean; ttlMs?: number }): Promise<any[]> {
    const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    const cached = readCache(this.cacheKey, ttlMs, options?.force);
    return cached || [];
  }
  async save(item: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, [item, ...current.filter((i: any) => i.id !== item.id)]);
    window.dispatchEvent(new Event('storage'));
  }
  async delete(id: string): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, current.filter((i: any) => i.id !== id));
    window.dispatchEvent(new Event('storage'));
  }
  async update(id: string, data: any): Promise<void> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    writeCache(this.cacheKey, current.map((i: any) => i.id === id ? { ...i, ...data } : i));
    window.dispatchEvent(new Event('storage'));
  }
}

export const projectDB = new ProjectDB();
