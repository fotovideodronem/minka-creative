import { db, storage } from '../src/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject, getDownloadURL } from 'firebase/storage';

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

export const checkFirestoreConnection = async (): Promise<boolean> => {
  try {
    const testRef = doc(db, 'test', 'connection');
    await getDoc(testRef);
    return true;
  } catch (err) {
    console.warn('Firebase connection error:', err);
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
    const firebaseCollection = collection(db, tableName);

    return {
      getAll: async (options?: { force?: boolean; ttlMs?: number }): Promise<any[]> => {
        const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
        const cached = readCache(cacheKey, ttlMs, options?.force);
        if (cached) return cached;

        try {
          const snapshot = await getDocs(firebaseCollection);
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          writeCache(cacheKey, items);
          return items;
        } catch (err) {
          console.warn('Error fetching from Firestore:', err);
          const local = localStorage.getItem(cacheKey);
          return local ? JSON.parse(local) : [];
        }
      },
      save: async (item: any): Promise<void> => {
        try {
          if (item.id) {
            const docRef = doc(firebaseCollection, item.id);
            await updateDoc(docRef, item);
          } else {
            item.id = crypto.randomUUID?.() || Date.now().toString();
            await addDoc(firebaseCollection, item);
          }
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = [item, ...local.filter((i: any) => i.id !== item.id)];
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error('Error saving to Firestore:', err);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = [item, ...local.filter((i: any) => i.id !== item.id)];
          writeCache(cacheKey, updated);
        }
      },
      delete: async (id: string): Promise<void> => {
        try {
          const docRef = doc(firebaseCollection, id);
          await deleteDoc(docRef);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.filter((i: any) => i.id !== id);
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error('Error deleting from Firestore:', err);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.filter((i: any) => i.id !== id);
          writeCache(cacheKey, updated);
        }
      },
      update: async (id: string, data: any): Promise<void> => {
        try {
          const docRef = doc(firebaseCollection, id);
          await updateDoc(docRef, data);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.map((i: any) => i.id === id ? { ...i, ...data } : i);
          writeCache(cacheKey, updated);
          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error('Error updating Firestore:', err);
          const local = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          const updated = local.map((i: any) => i.id === id ? { ...i, ...data } : i);
          writeCache(cacheKey, updated);
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
