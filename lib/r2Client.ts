/**
 * r2Client.ts
 * Helper pro upload/delete souborů přes Netlify Function → Cloudflare R2
 * Databáze (metadata) zůstává v Supabase, soubory jdou do R2.
 */

const UPLOAD_ENDPOINT = '/.netlify/functions/r2-upload';

export interface R2UploadResult {
  url: string;
  key: string;
}

/**
 * Převede File/Blob na base64 string
 */
function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Odstraň "data:...;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Komprese + WebP konverze obrázku na straně prohlížeče
 */
export function optimizeImage(file: File, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Max rozlišení 2400px na delší straně
      const MAX = 2400;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height / width) * MAX);
          width = MAX;
        } else {
          width = Math.round((width / height) * MAX);
          height = MAX;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          resolve(blob);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Nahraje soubor do R2 přes Netlify Function
 * Obrázky jsou automaticky převedeny na WebP a zmenšeny
 */
export async function uploadToR2(
  file: File,
  quality = 0.82,
  onProgress?: (progress: number) => void
): Promise<R2UploadResult> {
  let fileToUpload: Blob | File = file;
  let contentType = file.type;
  let fileName = file.name;

  // Optimalizace obrázků → WebP
  if (file.type.startsWith('image/')) {
    onProgress?.(10);
    try {
      fileToUpload = await optimizeImage(file, quality);
      contentType = 'image/webp';
      // Změň příponu na .webp
      fileName = file.name.replace(/\.[^.]+$/, '.webp');
    } catch (err) {
      console.warn('Optimalizace selhala, nahrávám originál:', err);
    }
  }

  onProgress?.(30);

  // Převod na base64 pro přenos přes Netlify Function
  const base64 = await fileToBase64(fileToUpload);

  onProgress?.(50);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileData: base64, contentType }),
  });

  onProgress?.(90);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload selhal' }));
    throw new Error(err.error || 'Upload selhal');
  }

  const result = await response.json();
  onProgress?.(100);

  return { url: result.url, key: result.key };
}

/**
 * Smaže soubor z R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const response = await fetch(UPLOAD_ENDPOINT, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Smazání selhalo' }));
    throw new Error(err.error || 'Smazání selhalo');
  }
}
