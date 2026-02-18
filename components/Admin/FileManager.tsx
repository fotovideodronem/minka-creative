import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, ImageIcon, Video as VideoIcon, Upload, Plus, ChevronRight, ChevronLeft,
  Trash2, Grid, List as ListIcon, Search, X, HardDrive, RefreshCw,
  Edit2, FolderPlus, MoreVertical, Move, FolderTree, CheckSquare, Square,
  Tag, Info, Settings, AlertCircle, CheckCircle2, Minus, Maximize2, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileItem } from '../../types';
import { mediaDB, optimizeImage } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';

interface UploadStatus {
  id: string;
  fileName: string;
  progress: number;
  status: 'optimizing' | 'uploading' | 'completed' | 'error' | 'canceled';
  error?: string;
  task?: any; 
}

const FileManager: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const [isQueueMinimized, setIsQueueMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    const dbItems = await mediaDB.getAll({ force: true });
    setItems(dbItems.map(i => ({...i, parentId: i.parentId || null})));
  };

  useEffect(() => {
    loadFiles();
    window.addEventListener('storage', loadFiles);
    return () => window.removeEventListener('storage', loadFiles);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');
    const fileList = Array.from(files) as File[];
    
    for (const file of fileList) {
      const uploadId = Math.random().toString(36).substr(2, 9);
      const initialStatus: UploadStatus = {
        id: uploadId, fileName: file.name, progress: 0,
        status: file.type.startsWith('image/') ? 'optimizing' : 'uploading'
      };
      
      setUploadQueue(prev => [initialStatus, ...prev]);
      setIsQueueMinimized(false);

      try {
        let fileToUpload: Blob | File = file;
        if (file.type.startsWith('image/')) {
          fileToUpload = await optimizeImage(file, quality / 100);
          setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'uploading' } : u));
        }

        const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
        const storagePath = `uploads/${fileId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        // Upload to Supabase Storage (log response for debugging)
        console.log('Uploading to Supabase:', { bucket: 'media', storagePath, fileToUpload });
        const uploadResp = await supabase.storage
          .from('media')
          .upload(storagePath, fileToUpload, {
            cacheControl: '3600',
            upsert: true
          });

        console.log('Supabase upload response:', uploadResp);

        if (uploadResp.error) {
          // show detailed error in UI console and queue
          console.error('Supabase upload error:', uploadResp.error);
          setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: uploadResp.error.message || 'Upload failed (400)' } : u));
          continue;
        }

        // Get public URL
        const publicResp = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);
        console.log('Supabase publicUrl response:', publicResp);
        const publicUrl = publicResp.data?.publicUrl || '';

        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 100, status: 'uploading' } : u));

        const newItem: FileItem = {
          id: fileId, name: file.name,
          type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other',
          size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
          updatedAt: new Date().toISOString(), url: publicUrl, parentId: currentFolderId, specializationId: storagePath
        };
        console.log('Saving metadata to mediaDB:', newItem);
        try {
          await mediaDB.save(newItem);
          console.log('Metadata saved successfully');
        } catch (dbErr) {
          console.error('Failed to save metadata:', dbErr);
          setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: 'Metadata save failed: ' + (dbErr instanceof Error ? dbErr.message : String(dbErr)) } : u));
          return;
        }
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u));
        loadFiles();
      } catch (err: any) {
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelUpload = (id: string) => {
    setUploadQueue(prev => prev.filter(u => u.id !== id));
  };

  const currentItems = useMemo(() => {
    return items.filter(item => item.parentId === currentFolderId && (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase())))
      .sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [items, currentFolderId, searchQuery]);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-sm min-h-[80vh] relative">
      <div className="p-6 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="bg-[#007BFF] text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
            <Upload size={14} /> NAHRÁT SOUBORY
          </button>
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleUpload} />
          <button onClick={() => {const n=prompt('Název složky:'); if(n) mediaDB.save({id:'f-'+Math.random().toString(36).substr(2,9), name:n, type:'folder', parentId:currentFolderId})}} className="border-2 border-[#007BFF] bg-white text-[#007BFF] px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <FolderPlus size={14} /> NOVÁ SLOŽKA
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="HLEDAT..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 border bg-white text-black text-[10px] font-black w-64 uppercase focus:border-[#007BFF] outline-none" />
        </div>
      </div>

      <div className="p-8 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 bg-white">
        {currentItems.map(item => (
          <div 
            key={item.id}
            className={`group relative flex flex-col items-center gap-3 p-4 border-2 transition-all cursor-pointer ${selectedIds.has(item.id) ? 'border-[#007BFF] bg-blue-50/30' : 'border-transparent hover:border-blue-50'}`}
            onClick={() => item.type === 'folder' ? setCurrentFolderId(item.id) : setPreviewItem(item)}
          >
            <div className="aspect-square w-full flex items-center justify-center overflow-hidden">
               {item.type === 'folder' ? <Folder size={48} className="text-[#007BFF]/30 group-hover:text-[#007BFF]" /> : <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />}
            </div>
            <p className="text-[9px] font-black uppercase truncate w-full text-center text-gray-500 group-hover:text-[#007BFF]">{item.name}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-8 right-8 z-[100] w-96 bg-white shadow-2xl border border-gray-200 rounded-sm overflow-hidden ${isQueueMinimized ? 'h-14' : 'max-h-[500px]'}`}
          >
            <div className="bg-black text-white p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsQueueMinimized(!isQueueMinimized)}>
              <div className="flex items-center gap-3">
                <RefreshCw size={14} className={`${uploadQueue.some(u => u.status === 'uploading') ? 'animate-spin text-[#007BFF]' : 'text-green-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Nahrávání ({uploadQueue.length})</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setUploadQueue([]); }} className="p-1 hover:text-red-500"><X size={16} /></button>
            </div>
            {!isQueueMinimized && (
              <div className="overflow-y-auto max-h-[400px] p-4 space-y-3 bg-white">
                {uploadQueue.map(upload => (
                  <div key={upload.id} className="space-y-2 border-b border-gray-50 pb-2">
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] font-black uppercase truncate text-black pr-4">{upload.fileName}</p>
                      <button onClick={() => cancelUpload(upload.id)} className="text-gray-300 hover:text-red-500"><Ban size={12} /></button>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-[#007BFF]" animate={{ width: `${upload.progress}%` }} />
                    </div>
                    {upload.error && <p className="text-[8px] font-bold text-red-500 mt-1">{upload.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileManager;
