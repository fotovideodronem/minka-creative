import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../../types';
import { 
  X, Upload, Folder, Image as LucideImage, Video as LucideVideo, 
  FileText, HardDrive, ChevronRight, Plus, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, optimizeImage } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';

interface EnhancedMediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: FileItem) => void; // Single selection callback
  onMultiSelect?: (items: FileItem[]) => void; // Multiple selection callback
  allowMultiple?: boolean;
  allowUpload?: boolean;
  showFolders?: boolean;
}

interface UploadStatus {
  id: string;
  fileName: string;
  progress: number;
  status: 'optimizing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const EnhancedMediaPicker: React.FC<EnhancedMediaPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  onMultiSelect,
  allowMultiple = false,
  allowUpload = true,
  showFolders = true
}) => {
  const [items, setItems] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const [isUploadingRef, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen]);

  const loadItems = async () => {
    try {
      const dbItems = await mediaDB.getAll({ force: true });
      setItems(dbItems.map(i => ({...i, parentId: i.parentId || null})));
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  const currentItems = items.filter(i => {
    if (currentFolderId) {
      return i.parentId === currentFolderId;
    } else {
      return !i.parentId;
    }
  });

  const folders = currentItems.filter(i => i.type === 'folder');
  const files = currentItems.filter(i => i.type !== 'folder');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <LucideImage size={12} />;
      case 'video': return <LucideVideo size={12} />;
      case 'folder': return <Folder size={12} />;
      default: return <FileText size={12} />;
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileList = Array.from(files) as File[];

    for (const file of fileList) {
      const fileName = file.name.split('.')[0];
      const existingFile = items.find(i => i.name === fileName && i.type !== 'folder');

      if (existingFile) {
        const uploadId = Math.random().toString(36).substr(2, 9);
        setUploadQueue(prev => [...prev, {
          id: uploadId,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: `Soubor "${file.name}" již existuje`
        }]);
        continue;
      }

      const uploadId = Math.random().toString(36).substr(2, 9);
      setUploadQueue(prev => [
        {
          id: uploadId,
          fileName: file.name,
          progress: 0,
          status: file.type.startsWith('image/') ? 'optimizing' : 'uploading'
        },
        ...prev
      ]);

      try {
        let fileToUpload: Blob | File = file;
        const storagePath = uploadId + '_' + file.name.replace(/\s+/g, '_').toLowerCase();

        // Image optimization
        if (file.type.startsWith('image/')) {
          try {
            fileToUpload = await optimizeImage(file, quality);
          } catch (err) {
            console.warn('Image optimization failed:', err);
          }
        }

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(storagePath, fileToUpload, { upsert: false });

        if (uploadError) throw uploadError;

        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'uploading', progress: 50 } : u));

        // Get public URL
        const publicResp = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);
        const publicUrl = publicResp.data?.publicUrl || '';

        const newItem: FileItem = {
          id: uploadId,
          name: file.name.split('.')[0],
          type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other',
          size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
          url: publicUrl,
          parentId: currentFolderId,
          specializationId: storagePath,
          updatedAt: new Date().toISOString()
        };

        await mediaDB.save(newItem);
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u));
        await loadItems();
      } catch (err: any) {
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u));
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsUploading(false);
  };

  const handleSelectItem = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id);
    } else {
      if (allowMultiple) {
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
            newSet.delete(item.id);
          } else {
            newSet.add(item.id);
          }
          return newSet;
        });
      } else {
        onSelect(item);
        onClose();
      }
    }
  };

  const handleConfirmMultiple = () => {
    if (onMultiSelect) {
      const selected = items.filter(i => selectedItems.has(i.id));
      onMultiSelect(selected);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-lg overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gray-50 border-b p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest">Knihovna médií</h3>
            <p className="text-[10px] text-gray-500 uppercase mt-1">
              {currentFolderId ? '📁 V otevřené složce' : '🏠 Kořenová složka'} 
              {allowMultiple && ` • Vybrány: ${selectedItems.size}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        {/* Breadcrumb */}
        {currentFolderId && (
          <div className="bg-gray-100 px-6 py-2 flex items-center gap-2 text-[10px] font-black uppercase text-gray-600 border-b">
            <button onClick={() => setCurrentFolderId(null)} className="hover:text-[#007BFF]">
              🏠 Kořen
            </button>
            <ChevronRight size={12} />
            <span className="text-[#007BFF]">{items.find(i => i.id === currentFolderId)?.name || 'Složka'}</span>
          </div>
        )}

        {/* Upload Section */}
        {allowUpload && (
          <div className="bg-blue-50 border-b px-6 py-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingRef}
              className="flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white rounded hover:bg-blue-700 disabled:opacity-50 text-[10px] font-black uppercase"
            >
              <Upload size={14} /> Nahrát soubory
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleGalleryUpload}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
        )}

        {/* Upload Queue */}
        <AnimatePresence>
          {uploadQueue.length > 0 && (
            <div className="bg-gray-50 border-b px-6 py-4 space-y-2 max-h-24 overflow-y-auto">
              {uploadQueue.map(upload => (
                <div key={upload.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-bold uppercase truncate">{upload.fileName}</span>
                    <span className={`font-black px-2 py-0.5 rounded ${
                      upload.status === 'completed' ? 'bg-green-100 text-green-700' :
                      upload.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {upload.status === 'completed' ? '✓' : upload.status === 'error' ? '✗' : `${upload.progress}%`}
                    </span>
                  </div>
                  {upload.error && <p className="text-[8px] text-red-600">{upload.error}</p>}
                  <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                    <div className="h-full bg-[#007BFF] transition-all" style={{ width: `${upload.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Content Grid */}
        <div className="flex-1 overflow-auto p-6">
          {folders.length === 0 && files.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-center">
              <div>
                <HardDrive size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-[12px] font-black uppercase">Prázdná složka</p>
                {allowUpload && (
                  <p className="text-[10px] text-gray-500 mt-2">Přidej fotky nebo videa pomocí tlačítka Nahrát</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Folders First */}
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleSelectItem(folder)}
                  className="group relative aspect-square border-2 border-gray-200 rounded hover:border-[#007BFF] transition-all overflow-hidden bg-gray-50 flex flex-col items-center justify-center gap-2"
                >
                  <Folder size={24} className="text-blue-500" />
                  <span className="text-[8px] font-black uppercase text-center px-1 truncate">{folder.name}</span>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronRight size={20} className="text-white" />
                  </div>
                </button>
              ))}

              {/* Then Files */}
              {files.map(file => (
                <button
                  key={file.id}
                  onClick={() => handleSelectItem(file)}
                  className={`group relative aspect-square border-2 rounded transition-all overflow-hidden bg-gray-50 flex items-center justify-center ${
                    selectedItems.has(file.id)
                      ? 'border-[#007BFF] bg-blue-50'
                      : 'border-gray-200 hover:border-[#007BFF]'
                  }`}
                >
                  {file.type === 'image' && file.url ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      {getFileIcon(file.type)}
                      <span className="text-[8px] uppercase font-black">{file.type}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-white text-[10px] font-black uppercase">
                      {allowMultiple && selectedItems.has(file.id) ? '✓' : 'Vybrat'}
                    </span>
                  </div>
                  {allowMultiple && selectedItems.has(file.id) && (
                    <div className="absolute top-2 right-2 bg-[#007BFF] text-white rounded-full p-1">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {allowMultiple && (
          <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 text-[10px] font-black uppercase transition-all"
            >
              Zrušit
            </button>
            <button
              onClick={handleConfirmMultiple}
              disabled={selectedItems.size === 0}
              className="px-6 py-2 bg-[#007BFF] text-white rounded hover:bg-blue-700 disabled:opacity-50 text-[10px] font-black uppercase transition-all"
            >
              Vybrat ({selectedItems.size})
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EnhancedMediaPicker;
