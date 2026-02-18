import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Admin() {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('architecture');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      // 1. Nahrajeme soubor do Storage (Bucket 'media')
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Získáme veřejnou URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // 3. Uložíme záznam do tabulky 'portfolio'
      const { error: dbError } = await supabase
        .from('portfolio')
        .insert([
          { 
            title, 
            category, 
            url: publicUrl, 
            type: file.type.startsWith('video') ? 'video' : 'image' 
          }
        ]);

      if (dbError) throw dbError;

      alert('Nahráno úspěšně!');
      setTitle('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-lg rounded-xl mt-10">
      <h1 className="text-2xl font-syne font-bold mb-6">Správa Portfolia</h1>
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Název projektu" 
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select 
          className="w-full p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="architecture">Architecture</option>
          <option value="events">Events</option>
          <option value="commercial">Commercial</option>
          <option value="video">Video</option>
        </select>
        <div className="border-2 border-dashed p-4 text-center">
          <input 
            type="file" 
            accept="image/*,video/*" 
            onChange={handleUpload} 
            disabled={uploading || !title}
          />
          <p className="text-sm text-gray-500 mt-2">
            {uploading ? 'Nahrávám...' : 'Nejdřív napiš název, pak vyber soubor'}
          </p>
        </div>
      </div>
    </div>
  );
}