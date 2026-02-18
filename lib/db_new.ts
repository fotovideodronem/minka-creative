// Pure localStorage-based data store (No Supabase!)

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

export const checkFirestoreConnection = async (): Promise<boolean> => true;
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
        const local = localStorage.getItem(cacheKey);
        const items = local ? JSON.parse(local) : [];
        writeCache(cacheKey, items);
        return items;
      },
      save: async (item: any): Promise<void> => {
        const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        const updatedLocal = [item, ...localData.filter((i: any) => i.id !== item.id)];
        writeCache(cacheKey, updatedLocal);
        window.dispatchEvent(new Event('storage'));
      },
      delete: async (id: string): Promise<void> => {
        const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        const updatedLocal = localData.filter((i: any) => i.id !== id);
        writeCache(cacheKey, updatedLocal);
        window.dispatchEvent(new Event('storage'));
      },
      update: async (id: string, data: any): Promise<void> => {
        const localData = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        const updatedLocal = localData.map((i: any) => i.id === id ? { ...i, ...data } : i);
        writeCache(cacheKey, updatedLocal);
        window.dispatchEvent(new Event('storage'));
      }
    };
  }
  doc(docId: string) {
    const cacheKey = `jakub_minka_settings_${docId}`;
    return {
      get: async () => {
        const data = localStorage.getItem(cacheKey);
        return data ? JSON.parse(data) : {};
      },
      set: async (data: any) => {
        localStorage.setItem(cacheKey, JSON.stringify(data));
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
  async update(id: string, data: any): Promise<any> {
    const current = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
    const updated = current.map((i: any) => i.id === id ? { ...i, ...data } : i);
    writeCache(this.cacheKey, updated);
    return updated.find((i: any) => i.id === id);
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
