
import React, { useState, useEffect, useRef } from 'react';
import { Project, MediaType, FileItem, GalleryItem } from '../../types';
import { SPECIALIZATIONS } from '../../constants';
import { 
  Plus, Trash2, Edit2, X, Search, Youtube, HardDrive, ChevronRight, Folder, Upload, RefreshCw, Video, CheckSquare, Square,
  Bold, Italic, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, dataStore, optimizeImage } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';

const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'thumbnail' | 'gallery'>('thumbnail');
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  const [selectedInPicker, setSelectedInPicker] = useState<Set<string>>(new Set());
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{name: string, progress: number} | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '', description: '', shortDescription: '', categoryId: SPECIALIZATIONS[0].id,
    type: MediaType.BOTH, date: new Date().toISOString().split('T')[0],
    thumbnailUrl: '', thumbnailSource: 'pc', gallery: [], servicesDelivered: ''
  });

  const loadData = async () => {
    const saved = await dataStore.collection('projects').getAll({ force: true });
    setProjects(saved);
    const dbItems = await mediaDB.getAll({ force: true });
    setAllItems(dbItems);
  };

  useEffect(() => { loadData(); }, []);

  const handleEditorCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    setIsProcessing(true);
    const project: Project = {
      id: editingId || 'p-' + Math.random().toString(36).substr(2, 9),
      title: formData.title!,
      category: SPECIALIZATIONS.find(s => s.id === formData.categoryId)?.name || 'Ostatní',
      categoryId: formData.categoryId!,
      description: editorRef.current?.innerHTML || '',
      shortDescription: formData.shortDescription || '',
      thumbnailUrl: formData.thumbnailUrl || '',
      thumbnailSource: formData.thumbnailSource as any || 'pc',
      type: formData.type || MediaType.BOTH,
      date: formData.date || new Date().toISOString(),
      gallery: formData.gallery || [],
      servicesDelivered: formData.servicesDelivered || ''
    };
    await dataStore.collection('projects').save(project);
    setShowForm(false);
    setIsProcessing(false);
    loadData();
  };

  const handlePickSubmit = () => {
    const picked = allItems.filter(i => selectedInPicker.has(i.id));
    if (pickerTarget === 'thumbnail') {
      const first = picked[0];
      if (first) setFormData(p => ({...p, thumbnailUrl: first.url, thumbnailSource: 'storage'}));
    } else {
      const newItems: GalleryItem[] = picked.map(i => ({id: i.id, url: i.url!, type: i.type as any, source: 'storage'}));
      setFormData(p => ({...p, gallery: [...(p.gallery || []), ...newItems]}));
    }
    setShowPicker(false);
    setSelectedInPicker(new Set());
  };

  const handlePickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    setIsProcessing(true);
    const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');
    const fileList = Array.from(e.target.files) as File[];
    
    for (const file of fileList) {
      setUploadProgress({ name: file.name, progress: 0 });
      try {
        let fileToUpload: Blob | File = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await optimizeImage(file, quality / 100);
        }

        const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
        const storagePath = `uploads/${fileId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        
        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);

        setUploadProgress({ name: file.name, progress: 100 });

        const newItem: FileItem = { 
          id: fileId, name: file.name, 
          type: file.type.startsWith('image') ? 'image' : 'video', 
          url: publicUrl, parentId: pickerFolderId, updatedAt: new Date().toISOString() 
        };
        await mediaDB.save(newItem);
        setAllItems(prev => [...prev, newItem]);
      } catch (err) {
        console.error(err);
      }
    }
    setUploadProgress(null);
    setIsProcessing(false);
  };

  const addYoutube = () => {
    const url = prompt('YouTube URL:');
    if (!url) return;
    if (pickerTarget === 'thumbnail') setFormData(p => ({...p, thumbnailUrl: url, thumbnailSource: 'youtube'}));
    else setFormData(p => ({...p, gallery: [...(p.gallery || []), {id: Math.random().toString(), url, type: 'video', source: 'youtube'}]}));
  };

  const inputClass = "w-full border-2 border-gray-100 p-4 font-bold text-black outline-none focus:border-[#007BFF] transition-all bg-white";

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <button onClick={()=>{setEditingId(null); setFormData({title:'', gallery:[], categoryId:SPECIALIZATIONS[0].id}); setShowForm(true); setTimeout(() => {if(editorRef.current) editorRef.current.innerHTML=''}, 100)}} className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
          <Plus className="inline mr-2" size={16}/> PŘIDAT ZAKÁZKU
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="HLEDAT..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase bg-white text-black" />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border p-10 relative shadow-2xl">
            <button onClick={()=>setShowForm(false)} className="absolute top-8 right-8 text-black hover:text-[#007BFF]"><X size={32}/></button>
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-black">
               <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">Název zakázky</label>
                    <input type="text" required value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">Kategorie</label>
                    <select value={formData.categoryId} onChange={e=>setFormData({...formData, categoryId:e.target.value})} className={inputClass}>
                      {SPECIALIZATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">Popis projektu (WYSIWYG)</label>
                    <div className="border-2 border-gray-100 rounded-sm overflow-hidden">
                       <div className="bg-gray-100 border-b p-2 flex gap-2">
                          <button type="button" onClick={() => handleEditorCommand('bold')} className="p-1 hover:bg-white rounded"><Bold size={16}/></button>
                          <button type="button" onClick={() => handleEditorCommand('italic')} className="p-1 hover:bg-white rounded"><Italic size={16}/></button>
                          <button type="button" onClick={() => handleEditorCommand('insertUnorderedList')} className="p-1 hover:bg-white rounded"><List size={16}/></button>
                       </div>
                       <div ref={editorRef} contentEditable className="min-h-[250px] p-6 outline-none prose prose-sm max-w-none bg-white" dangerouslySetInnerHTML={{__html: formData.description || ''}} />
                    </div>
                  </div>
               </div>
               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase text-gray-400 block">Hlavní náhled (Thumbnail)</label>
                  <div className="aspect-video bg-gray-50 border-4 border-dashed border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group">
                     {formData.thumbnailUrl ? (
                        <div className="w-full h-full">
                          {formData.thumbnailSource === 'youtube' ? <iframe src={formData.thumbnailUrl} className="w-full h-full"/> : <img src={formData.thumbnailUrl} className="w-full h-full object-cover"/>}
                          <button type="button" onClick={()=>setFormData({...formData, thumbnailUrl:''})} className="absolute top-4 right-4 bg-red-600 text-white p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"><X size={20}/></button>
                        </div>
                     ) : (
                        <div className="flex gap-4">
                           <button type="button" onClick={()=>{setPickerTarget('thumbnail'); setShowPicker(true)}} className="bg-white p-6 border-2 border-gray-100 flex flex-col items-center gap-3 hover:border-[#007BFF] transition-all text-black font-black text-[9px] uppercase tracking-widest"><HardDrive size={32}/><br/>KNIHOVNA</button>
                           <button type="button" onClick={addYoutube} className="bg-white p-6 border-2 border-gray-100 flex flex-col items-center gap-3 hover:border-[#FF0000] transition-all text-black font-black text-[9px] uppercase tracking-widest"><Youtube size={32}/><br/>YOUTUBE</button>
                        </div>
                     )}
                  </div>
                  
                  <label className="text-[10px] font-black uppercase text-gray-400 block">Galerie projektu</label>
                  <div className="grid grid-cols-4 gap-2 bg-gray-50 p-4 min-h-[120px]">
                    {formData.gallery?.map((g,i) => (
                      <div key={i} className="aspect-square relative bg-white border border-gray-100 group">
                        <img src={g.source==='youtube' ? 'https://img.youtube.com/vi/'+g.url.split('/').pop()+'/0.jpg' : g.url} className="w-full h-full object-cover"/>
                        <button type="button" onClick={()=>setFormData({...formData, gallery: formData.gallery?.filter((_,idx)=>idx!==i)})} className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 size={20}/></button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>{setPickerTarget('gallery'); setShowPicker(true)}} className="aspect-square border-4 border-dashed border-gray-100 flex items-center justify-center text-gray-300 hover:text-[#007BFF] hover:border-[#007BFF] transition-all bg-white"><Plus size={32}/></button>
                  </div>
                  
                  <button disabled={isProcessing} className="w-full bg-black text-white py-6 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#007BFF] transition-all shadow-xl">
                    {isProcessing ? <RefreshCw className="animate-spin inline mr-2"/> : 'PUBLIKOVAT ZAKÁZKU'}
                  </button>
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
                  <h3 className="text-xl font-black uppercase">Výběr médií</h3>
                  <div className="flex gap-4">
                    <button onClick={addYoutube} className="flex items-center gap-2 px-4 py-2 border-2 border-[#FF0000] text-[#FF0000] text-[10px] font-black uppercase"><Youtube size={16}/> YouTube link</button>
                    <input type="file" multiple id="picker-upload-project" className="hidden" onChange={handlePickerUpload} />
                    <label htmlFor="picker-upload-project" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-black uppercase cursor-pointer hover:bg-[#007BFF] transition-all"><Upload size={16}/> Nahrát z PC</label>
                    <button onClick={()=>setShowPicker(false)} className="text-black hover:text-red-500"><X size={32}/></button>
                  </div>
               </div>
               
               <div className="p-10 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6 overflow-y-auto bg-gray-50/20">
                  {allItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {if(item.type==='folder') setPickerFolderId(item.id); else {const n=new Set(selectedInPicker); if(n.has(item.id)) n.delete(item.id); else n.add(item.id); setSelectedInPicker(n); }}}
                      className={`relative aspect-square border-2 transition-all p-2 cursor-pointer ${selectedInPicker.has(item.id) ? 'border-[#007BFF] bg-blue-50 shadow-lg' : 'border-transparent hover:border-gray-200 bg-white'}`}
                    >
                       <div className="w-full h-full flex items-center justify-center">
                          {item.type==='folder' ? <Folder size={48} className="text-[#007BFF]/20"/> : <img src={item.url} className="w-full h-full object-cover"/>}
                       </div>
                       {selectedInPicker.has(item.id) && <CheckSquare className="absolute top-1 right-1 text-[#007BFF] bg-white rounded-sm" size={18}/>}
                    </div>
                  ))}
               </div>
               <div className="p-8 border-t bg-gray-50 flex justify-end">
                  <button onClick={handlePickSubmit} className="bg-[#007BFF] text-white px-12 py-4 text-[11px] font-black uppercase hover:bg-black transition-all">POTVRDIT VÝBĚR ({selectedInPicker.size})</button>
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border shadow-sm">
        <table className="w-full text-left text-black">
           <thead className="bg-gray-50"><tr className="border-b"><th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Projekt</th><th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-right">Možnosti</th></tr></thead>
           <tbody>
             {projects.map(p => (
               <tr key={p.id} className="border-b hover:bg-gray-50">
                 <td className="px-8 py-5 font-black uppercase text-sm">{p.title}</td>
                 <td className="px-8 py-5 text-right flex justify-end gap-3">
                    <button onClick={()=>{setEditingId(p.id); setFormData(p); setShowForm(true)}} className="p-3 text-gray-400 hover:text-[#007BFF]"><Edit2 size={18}/></button>
                    <button onClick={async ()=>{if(confirm('Smazat?')){await dataStore.collection('projects').delete(p.id); loadData()}}} className="p-3 text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectManager;
