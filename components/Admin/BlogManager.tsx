
import React, { useState, useEffect, useRef } from 'react';
import { BlogPost, FileItem } from '../../types';
import { 
  Plus, Trash2, Edit2, X, Search, 
  Bold, Italic, List, 
  Image as LucideImage, Video as LucideVideo, CheckSquare, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, dataStore, optimizeImage } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';

const VIDEO_MAX_MB = 200;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'cover' | 'content'>('cover');
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '', content: '', excerpt: '', coverImage: '', date: new Date().toISOString().split('T')[0],
    author: 'Jakub Minka', tags: []
  });

  const loadPosts = async () => {
    const saved = await dataStore.collection('blog').getAll({ force: true });
    setPosts(saved);
    const dbItems = await mediaDB.getAll({ force: true });
    setAllItems(dbItems);
  };

  useEffect(() => { loadPosts(); }, []);

  // Fix: Add missing openPicker helper function to open the media library
  const openPicker = (mode: 'cover' | 'content') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const normalizeQuality = (raw: number) => (raw > 1 ? raw / 100 : raw);

  const insertHtml = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, html);
    document.execCommand('insertHTML', false, '<p><br></p>');
  };

  const handleEditorCommand = (command: string, value: string = '') => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (command === 'formatBlock') {
        document.execCommand(command, false, value);
      } else {
        document.execCommand(command, false, value);
      }
      setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
    }
  };

  const insertMedia = (item: FileItem) => {
    if (pickerMode === 'cover') {
      setFormData({ ...formData, coverImage: item.url });
    } else if (editorRef.current) {
      const html = item.type === 'video' 
        ? `<div class="my-8 w-full max-w-3xl mx-auto aspect-video"><video src="${item.url}" controls class="w-full h-full shadow-2xl rounded-sm"></video></div>`
        : `<img src="${item.url}" alt="" class="w-full max-w-3xl mx-auto my-8 shadow-2xl border border-gray-100 rounded-sm block" />`;
      insertHtml(html);
    }
    setShowPicker(false);
  };

  const insertYouTubeVideo = () => {
    if (!youtubeUrlInput.trim()) return;
    const videoId = getYouTubeVideoId(youtubeUrlInput.trim());
    if (!videoId) {
      alert('Neplatný YouTube odkaz.');
      return;
    }
    const html = `<div class="video-embed my-8 w-full max-w-3xl mx-auto aspect-video"><iframe src="${getYouTubeEmbedUrl(youtubeUrlInput.trim())}" class="w-full h-full" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
    insertHtml(html);
    setYoutubeUrlInput('');
    setShowPicker(false);
  };

  const uploadMediaFromPc = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files) as File[];
    const rawQuality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');
    const quality = normalizeQuality(rawQuality);

    for (const file of fileList) {
      const fileName = file.name.split('.')[0];
      const existingFile = allItems.find(i => i.name === fileName && i.type !== 'folder');
      if (existingFile) {
        alert(`❌ Soubor "${file.name}" už existuje v médiích. Duplicitní soubory nejsou povoleny.`);
        continue;
      }

      if (file.type.startsWith('video/')) {
        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
          alert(`❌ Nepodporovaný formát videa: ${file.type}.
Použijte prosím MP4 nebo WebM.`);
          continue;
        }
        const maxBytes = VIDEO_MAX_MB * 1024 * 1024;
        if (file.size > maxBytes) {
          alert(`❌ Video "${file.name}" je příliš velké (${(file.size / (1024 * 1024)).toFixed(0)} MB).
Maximální velikost je ${VIDEO_MAX_MB} MB. Doporučuji export do MP4 (H.264) a snížení bitrate.`);
          continue;
        }
      }

      setIsUploadingMedia(true);
      try {
        let fileToUpload: Blob | File = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await optimizeImage(file, quality);
        }

        const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `uploads/${fileId}_${safeName}`;

        const uploadResp = await supabase.storage
          .from('media')
          .upload(storagePath, fileToUpload, { cacheControl: '3600', upsert: true });

        if (uploadResp.error) {
          alert(`Chyba při uploadu: ${uploadResp.error.message}`);
          continue;
        }

        const publicResp = supabase.storage.from('media').getPublicUrl(storagePath);
        const publicUrl = publicResp.data?.publicUrl || '';

        const newItem: FileItem = {
          id: fileId,
          name: fileName,
          type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other',
          size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
          url: publicUrl,
          parentId: null,
          specializationId: storagePath,
          updatedAt: new Date().toISOString()
        };

        await mediaDB.save(newItem);
        setAllItems(prev => [newItem, ...prev]);
        insertMedia(newItem);
      } catch (err) {
        console.error('Upload error:', err);
        alert('Chyba při nahrávání souboru.');
      } finally {
        setIsUploadingMedia(false);
      }
    }

    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    setIsProcessing(true);
    const postData: BlogPost = {
      id: editingId || 'b-' + Math.random().toString(36).substr(2, 9),
      title: formData.title!,
      content: editorRef.current?.innerHTML || '',
      excerpt: formData.excerpt || '',
      coverImage: formData.coverImage || '',
      date: formData.date || new Date().toISOString(),
      author: formData.author || 'Jakub Minka',
      tags: formData.tags || [],
      seoTitle: formData.seoTitle || '',
      seoDescription: formData.seoDescription || '',
      seoKeywords: formData.seoKeywords || ''
    };
    await dataStore.collection('blog').save(postData);
    setIsProcessing(false);
    setShowForm(false);
    loadPosts();
  };

  const inputClass = "w-full border-2 border-gray-100 p-4 font-bold text-black outline-none focus:border-[#007BFF] transition-all bg-white placeholder:text-gray-300";

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <button onClick={()=>{setEditingId(null); setFormData({title:'', date:new Date().toISOString().split('T')[0], author: 'Jakub Minka'}); setShowForm(true); if(editorRef.current) editorRef.current.innerHTML=''}} className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
          <Plus size={16} className="mr-2 inline"/> NOVÝ ČLÁNEK
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="HLEDAT..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase text-black bg-white focus:border-[#007BFF] outline-none" />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border p-10 relative shadow-2xl text-black">
            <button onClick={()=>setShowForm(false)} className="absolute top-8 right-8 text-black hover:text-[#007BFF]"><X size={32}/></button>
            <form onSubmit={handleSave} className="space-y-10">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-6">
                     <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Název článku</label>
                     <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={`${inputClass} text-2xl uppercase`} placeholder="Zadejte název..." />
                     
                     <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Krátké shrnutí</label>
                     <textarea value={formData.excerpt} onChange={e=>setFormData({...formData, excerpt:e.target.value})} className={`${inputClass} h-20 resize-none`} placeholder="Úryvek pro náhled..." />
                     
                     <div className="border-4 border-gray-50 bg-white">
                        <div className="bg-gray-50 border-b p-3 flex flex-wrap gap-2 sticky top-0 z-10">
                           <button type="button" onClick={()=>handleEditorCommand('formatBlock', 'H2')} className="px-3 py-1 border bg-white font-black text-xs hover:bg-[#007BFF] hover:text-white">H2</button>
                           <button type="button" onClick={()=>handleEditorCommand('formatBlock', 'H3')} className="px-3 py-1 border bg-white font-black text-xs hover:bg-[#007BFF] hover:text-white">H3</button>
                           <button type="button" onClick={()=>handleEditorCommand('bold')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><Bold size={16}/></button>
                           <button type="button" onClick={()=>handleEditorCommand('italic')} className="p-2 border bg-white hover:bg-[#007BFF] hover:text-white"><Italic size={16}/></button>
                           <button type="button" onClick={()=>openPicker('content')} className="flex items-center gap-2 px-4 py-1 border-2 border-black bg-white font-black text-[10px] uppercase hover:bg-black hover:text-white"><LucideImage size={14}/> VLOŽIT MÉDIA</button>
                        </div>
                        <div ref={editorRef} contentEditable className="min-h-[500px] p-8 outline-none prose prose-lg max-w-none text-black bg-white" dangerouslySetInnerHTML={{__html: formData.content || ''}} />
                     </div>
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                     <div className="aspect-[16/10] bg-gray-50 border-4 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                        {formData.coverImage ? (
                           <>
                              <img src={formData.coverImage} className="w-full h-full object-cover" />
                              <button type="button" onClick={()=>setFormData({...formData, coverImage:''})} className="absolute top-4 right-4 bg-red-600 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                           </>
                        ) : (
                           <button type="button" onClick={()=>openPicker('cover')} className="bg-white p-6 border-2 border-gray-100 flex flex-col items-center gap-3 font-black text-[9px] uppercase hover:border-[#007BFF] transition-all"><LucideImage size={24}/> VYBRAT COVER</button>
                        )}
                     </div>
                     <input type="date" value={formData.date?.split('T')[0]} onChange={e=>setFormData({...formData, date:e.target.value})} className={inputClass} />
                     
                     {/* SEO Section */}
                     <div className="border-t pt-8 space-y-6">
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                           <Search size={14}/> SEO Nastavení
                        </h3>
                        <div className="space-y-4">
                           <label className="text-[9px] font-bold uppercase text-gray-500">SEO Titulek (max 60 znaků)</label>
                           <input 
                              type="text" 
                              value={formData.seoTitle || ''} 
                              onChange={e=>setFormData({...formData, seoTitle:e.target.value})} 
                              className={inputClass}
                              placeholder="Vlastní titulek pro Google (volitelné)"
                              maxLength={60}
                           />
                           <div className="text-xs text-gray-400">{(formData.seoTitle || '').length}/60</div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[9px] font-bold uppercase text-gray-500">SEO Popis (max 160 znaků)</label>
                           <textarea 
                              value={formData.seoDescription || ''} 
                              onChange={e=>setFormData({...formData, seoDescription:e.target.value})} 
                              className={`${inputClass} h-20 resize-none`}
                              placeholder="Vlastní popis pro Google (volitelné)"
                              maxLength={160}
                           />
                           <div className="text-xs text-gray-400">{(formData.seoDescription || '').length}/160</div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[9px] font-bold uppercase text-gray-500">SEO Klíčová slova</label>
                           <input 
                              type="text" 
                              value={formData.seoKeywords || ''} 
                              onChange={e=>setFormData({...formData, seoKeywords:e.target.value})} 
                              className={inputClass}
                              placeholder="slovo1, slovo2, slovo3"
                           />
                        </div>
                     </div>
                     
                     <button type="submit" disabled={isProcessing} className="w-full bg-[#007BFF] text-white py-6 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-black transition-all shadow-xl">
                        {isProcessing ? <RefreshCw className="animate-spin inline mr-2"/> : 'PUBLIKOVAT ČLÁNEK'}
                     </button>
                  </div>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-12" onClick={()=>setShowPicker(false)}>
            <div className="bg-white w-full max-w-6xl h-[85vh] flex flex-col rounded-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b flex justify-between items-center bg-gray-50 text-black">
                  <h3 className="text-xl font-black uppercase">Knihovna médií</h3>
                  <button onClick={()=>setShowPicker(false)} className="text-black hover:text-red-500"><X size={32}/></button>
               </div>
               <div className="p-6 border-b bg-white">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                   <div className="lg:col-span-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">YouTube odkaz</label>
                     <div className="flex gap-3">
                       <input
                         type="url"
                         value={youtubeUrlInput}
                         onChange={e => setYoutubeUrlInput(e.target.value)}
                         placeholder="https://www.youtube.com/watch?v=..."
                         className="flex-1 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#007BFF]"
                       />
                       <button
                         type="button"
                         onClick={insertYouTubeVideo}
                         className="bg-[#007BFF] text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                       >
                         Vložit video
                       </button>
                     </div>
                   </div>
                   <div className="flex justify-start lg:justify-end">
                     <input
                       ref={uploadInputRef}
                       type="file"
                       accept="image/*,video/*"
                       multiple
                       className="hidden"
                       onChange={(e) => uploadMediaFromPc(e.target.files)}
                     />
                     <button
                       type="button"
                       onClick={() => uploadInputRef.current?.click()}
                       disabled={isUploadingMedia}
                       className="border-2 border-[#007BFF] text-[#007BFF] px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 disabled:opacity-60"
                     >
                       {isUploadingMedia ? 'Nahrávám...' : 'Nahrát z PC'}
                     </button>
                   </div>
                 </div>
               </div>
               <div className="p-10 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6 overflow-y-auto bg-gray-50/20">
                  {allItems.filter(i => i.type !== 'folder').map(item => (
                    <div key={item.id} onClick={() => insertMedia(item)} className="relative aspect-square border-2 border-transparent hover:border-[#007BFF] transition-all p-1 cursor-pointer bg-white group shadow-sm">
                       {item.type === 'video' ? (
                         <video src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                       ) : (
                         <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/>
                       )}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white border border-gray-100 rounded-sm p-6 group hover:border-[#007BFF] transition-all shadow-sm">
            <h3 className="font-black uppercase tracking-tight text-sm mb-4 line-clamp-2 text-black">{post.title}</h3>
            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
              <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(post.date).toLocaleDateString()}</span>
              <div className="flex gap-2">
                <button onClick={()=>{setEditingId(post.id); setFormData(post); setShowForm(true)}} className="p-2 text-gray-300 hover:text-[#007BFF]"><Edit2 size={16}/></button>
                <button onClick={async ()=>{if(confirm('Smazat?')){await dataStore.collection('blog').delete(post.id); loadPosts()}}} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogManager;
