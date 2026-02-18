import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Folder, ImageIcon, Video as VideoIcon, Upload, Plus, ChevronRight, ChevronLeft,
  Trash2, Grid, List as ListIcon, Search, X, HardDrive, RefreshCw,
  Edit2, FolderPlus, MoreVertical, Move, FolderTree, CheckSquare, Square,
  Tag, Info, Settings, AlertCircle, CheckCircle2, Minus, Maximize2, Ban, Copy,
  Eye, Download, FileText, Calendar, HardDriveIcon
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
}

interface Folder {
  id: string;
  name: string;
  itemCount: number;
}

interface ContextMenu {
  x: number;
  y: number;
  itemId: string;
}

const VIDEO_MAX_MB = 200;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const FileManagerV2: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  const [isQueueMinimized, setIsQueueMinimized] = useState(false);
  const [editingItem, setEditingItem] = useState<FileItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showMetadataEditor, setShowMetadataEditor] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [moveToFolderId, setMoveToFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    console.log('📂 [LOAD] Loading files from database...');
    const dbItems = await mediaDB.getAll({ force: true });
    console.log('📂 [LOAD] Loaded', dbItems.length, 'items from DB');
    console.log('📂 [LOAD] Sample items:', dbItems.slice(0, 3).map(i => ({ name: i.name, parentId: i.parentId, type: typeof i.parentId })));
    const mappedItems = dbItems.map(i => ({...i, parentId: i.parentId || null}));
    console.log('📂 [LOAD] After || null mapping:', mappedItems.slice(0, 3).map(i => ({ name: i.name, parentId: i.parentId, type: typeof i.parentId })));
    setItems(mappedItems);
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
    
    console.log('📤 [UPLOAD] Started:', { 
      filesCount: fileList.length, 
      currentFolderId, 
      currentFolderName: currentFolderId ? items.find(i => i.id === currentFolderId)?.name : 'kořen',
      itemsInDB: items.length
    });
    
    for (const file of fileList) {
      // Kontrola duplikátů - GLOBÁLNĚ (ve všech složkách)
      const fileName = file.name.split('.')[0];
      const existingFile = items.find(i => 
        i.name === fileName && 
        i.type !== 'folder'
      );
      
      if (existingFile) {
        const folderName = existingFile.parentId ? items.find(f => f.id === existingFile.parentId)?.name || 'neznámá složka' : 'kořen';
        alert(`❌ Soubor "${file.name}" již existuje v systému (složka: ${folderName}). Duplicitní soubory nejsou povoleny.`);
        continue; // Skip this file
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

        const uploadResp = await supabase.storage
          .from('media')
          .upload(storagePath, fileToUpload, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadResp.error) {
          setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: uploadResp.error.message || 'Upload failed' } : u));
          continue;
        }

        const publicResp = supabase.storage
          .from('media')
          .getPublicUrl(storagePath);
        const publicUrl = publicResp.data?.publicUrl || '';

        const newItem: FileItem = {
          id: fileId, 
          name: file.name.split('.')[0],
          type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other',
          size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
          url: publicUrl, 
          parentId: currentFolderId, 
          specializationId: storagePath,
          updatedAt: new Date().toISOString()
        };

        console.log('💾 [UPLOAD] Saving to database:', { 
          name: newItem.name, 
          parentId: newItem.parentId,
          folderName: newItem.parentId ? items.find(i => i.id === newItem.parentId)?.name : 'kořen'
        });

        // Save and verify
        await mediaDB.save(newItem);
        
        // Verify it was saved with correct parentId
        const savedItem = (await mediaDB.getAll({ force: true })).find(i => i.id === newItem.id);
        console.log('✅ [UPLOAD] File saved, verified in DB:', { 
          name: savedItem?.name, 
          savedParentId: savedItem?.parentId,
          expectedParentId: newItem.parentId,
          match: savedItem?.parentId === newItem.parentId
        });
        
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'completed', progress: 100 } : u));
        
        // Reload and verify
        console.log('[UPLOAD] Reloading files after save...');
        await loadFiles();
      } catch (err: any) {
        setUploadQueue(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: err.message || 'Upload failed' } : u));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      // Delete from storage if it's a file
      if (item.type !== 'folder' && item.specializationId) {
        const { error: deleteError } = await supabase.storage
          .from('media')
          .remove([item.specializationId]);
        
        if (deleteError && !deleteError.message.includes('not found')) {
          throw deleteError;
        }
      }

      // Delete from database
      await mediaDB.delete(id);
      
      // Clear cache to ensure fresh data
      localStorage.removeItem('jakub_minka_cache_media_meta');
      localStorage.removeItem('jakub_minka_cache_media_meta_ts');
      
      setDeleteConfirm(null);
      await loadFiles();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Chyba při mazání: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      let errorMessages: string[] = [];

      for (const id of selectedIds) {
        const item = items.find(i => i.id === id);
        if (!item) continue;

        try {
          // Delete from storage if it's a file
          if (item.type !== 'folder' && item.specializationId) {
            const { error: deleteError } = await supabase.storage
              .from('media')
              .remove([item.specializationId]);
            
            if (deleteError && !deleteError.message.includes('not found')) {
              console.warn(`Storage delete warning for ${item.name}:`, deleteError);
            }
          }

          // Delete from database
          await mediaDB.delete(id);
        } catch (err) {
          console.error(`Error deleting ${item.name}:`, err);
          errorMessages.push(item.name);
        }
      }

      setShowBulkDelete(false);
      setSelectedIds(new Set());
      loadFiles();

      if (errorMessages.length > 0) {
        alert(`Některé položky nebylo možné smazat: ${errorMessages.join(', ')}`);
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      alert('Chyba při hromadném mazání: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    }
  };

  const handleBulkMove = async (targetFolderId: string | null) => {
    if (selectedIds.size === 0) return;

    try {
      console.log('🔄 [BULK MOVE] Moving', selectedIds.size, 'items to folder:', targetFolderId);
      let errorMessages: string[] = [];

      for (const id of selectedIds) {
        const item = items.find(i => i.id === id);
        if (!item) continue;

        try {
          await mediaDB.update(id, { parentId: targetFolderId });
          console.log('✅ [BULK MOVE] Moved:', item.name);
        } catch (err) {
          console.error(`❌ [BULK MOVE] Error moving ${item.name}:`, err);
          errorMessages.push(item.name);
        }
      }

      setMoveToFolderId(null);
      setSelectedIds(new Set());
      
      // Reload all files
      const refreshedFiles = await mediaDB.getAll({ force: true });
      setItems(refreshedFiles.map(i => ({...i, parentId: i.parentId || null})));

      const targetName = targetFolderId
        ? refreshedFiles.find(i => i.id === targetFolderId)?.name || 'složka'
        : 'kořen';
      
      if (errorMessages.length === 0) {
        alert(`✓ Přesunuto ${selectedIds.size} položek do "${targetName}"`);
      } else {
        alert(`Částečně dokončeno. Některé položky se nepodařilo přesunout: ${errorMessages.join(', ')}`);
      }
    } catch (err) {
      console.error('❌ [BULK MOVE] Bulk move error:', err);
      alert('Chyba při hromadném přesouvání: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', itemId);
    }
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    setDragOverId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const itemId = draggedItem || e.dataTransfer?.getData('text/plain');
    if (itemId && itemId !== targetFolderId) {
      await handleMoveToFolder(itemId, targetFolderId);
    }
    
    setDragOverId(null);
    setDraggedItem(null);
  };

  const handleRename = async (id: string, newName: string, alt?: string, description?: string) => {
    if (!newName.trim()) return;
    
    const item = items.find(i => i.id === id);
    if (!item) return;

    try {
      const updates: Partial<FileItem> = { name: newName };
      if (alt !== undefined) updates.alt = alt;
      if (description !== undefined) updates.description = description;
      
      await mediaDB.update(id, updates);
      setEditingItem(null);
      setEditName('');
      setEditAlt('');
      setEditDescription('');
      loadFiles();
    } catch (err) {
      console.error('Update error:', err);
      alert('Chyba při ukládání');
    }
  };

  const handleMoveToFolder = async (itemId: string, targetFolderId: string | null) => {
    console.log('🔄 [MOVE] Starting move:', { itemId, targetFolderId, timestamp: new Date().toISOString() });
    
    try {
      const moveItem = items.find(i => i.id === itemId);
      if (!moveItem) {
        console.error('❌ [MOVE] Item not found in current items:', itemId);
        throw new Error('Item not found');
      }
      
      console.log('📦 [MOVE] Item to move:', { name: moveItem.name, currentParentId: moveItem.parentId, targetParentId: targetFolderId });
      
      // Update in database
      console.log('💾 [MOVE] Updating database with parentId =', targetFolderId);
      const result = await mediaDB.update(itemId, { parentId: targetFolderId });
      console.log('✅ [MOVE] Database update response:', result);
      
      if (!result || !result.id) {
        throw new Error('Database update failed - no valid response');
      }
      
      // Verify the update in database
      console.log('🔍 [MOVE] Verifying DB update...');
      const verifyItem = await mediaDB.getAll({ force: true }).then(items => items.find(i => i.id === itemId));
      if (!verifyItem) {
        throw new Error('Item disappeared from database after move');
      }
      console.log('✅ [MOVE] Verified in DB:', { name: verifyItem.name, parentId: verifyItem.parentId });
      
      // Close modal immediately
      setMoveToFolderId(null);
      setDraggedItem(null);
      setDragOverId(null);
      
      // Reload files from database
      console.log('🔄 [MOVE] Reloading all items from database...');
      const refreshedFiles = await mediaDB.getAll({ force: true });
      const refreshedItem = refreshedFiles.find(i => i.id === itemId);
      console.log('🔄 [MOVE] Reloaded complete:', { totalItems: refreshedFiles.length, movedItemParentId: refreshedItem?.parentId });
      
      setItems(refreshedFiles.map(i => ({
        ...i,
        parentId: i.parentId || null
      })));
      
      // Show success message
      const targetName = targetFolderId
        ? refreshedFiles.find(i => i.id === targetFolderId)?.name || 'složka'
        : 'kořen';
      console.log('✅ [MOVE] Move completed successfully:', { from: moveItem.name, to: targetName });
      alert(`✓ "${moveItem.name}" přesunuto do "${targetName}"`);
      
    } catch (err) {
      console.error('❌ [MOVE] Move failed:', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        itemId,
        targetFolderId
      });
      setMoveToFolderId(null);
      alert('❌ Chyba při přesunutí: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId
    });
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Název nové složky:');
    if (!folderName?.trim()) return;

    try {
      const folderId = 'f-' + Math.random().toString(36).substr(2, 9);
      const folderItem: FileItem = {
        id: folderId,
        name: folderName,
        type: 'folder',
        parentId: currentFolderId,
        size: '—',
        url: '',
        updatedAt: new Date().toISOString(),
        specializationId: ''
      };
      
      await mediaDB.save(folderItem);
      loadFiles();
    } catch (err) {
      console.error('Create folder error:', err);
      alert('Chyba při vytváření složky');
    }
  };

  const currentItems = useMemo(() => {
    console.log('\n🔍 [FILTER] ============ FILTERING ITEMS ============');
    console.log('🔍 [FILTER] Current folder:', currentFolderId);
    console.log('🔍 [FILTER] Total items:', items.length);
    console.log('🔍 [FILTER] All items parentIds:', items.map(i => ({ name: i.name, parentId: i.parentId, type: i.type })));
    
    let filtered = items.filter(item => {
      const match = item.parentId === currentFolderId;
      console.log(`🔍 [FILTER] "${item.name}" - parentId: "${item.parentId}" ${typeof item.parentId}, currentFolderId: "${currentFolderId}" ${typeof currentFolderId}, match: ${match}`);
      return match && (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    });
    console.log('✅ [FILTER] Filtered to', filtered.length, 'items:', filtered.map(i => i.name));
    console.log('🔍 [FILTER] ========================================\n');

    // Sorting
    filtered.sort((a, b) => {
      let compareVal = 0;
      if (sortBy === 'name') {
        compareVal = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        compareVal = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'type') {
        compareVal = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? compareVal : -compareVal;
    });

    // Move folders to top
    return filtered.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return 0;
    });
  }, [items, currentFolderId, searchQuery, sortBy, sortOrder]);

  const previewItems = useMemo(() => {
    return currentItems.filter(item => item.type !== 'folder');
  }, [currentItems]);

  const folderPath = useMemo(() => {
    let current = currentFolderId;
    const path: Folder[] = [];
    
    while (current) {
      const folder = items.find(i => i.id === current && i.type === 'folder');
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name, itemCount: items.filter(i => i.parentId === current && i.type !== 'folder').length });
      current = folder.parentId || null;
    }
    
    return path;
  }, [items, currentFolderId]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder size={32} className="text-[#007BFF]" />;
      case 'image': return <ImageIcon size={32} className="text-purple-500" />;
      case 'video': return <VideoIcon size={32} className="text-red-500" />;
      default: return <FileText size={32} className="text-gray-500" />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('cs-CZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-sm min-h-[80vh]">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black uppercase tracking-widest text-black">Správce médií</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-200 rounded"
              title={`Přepnout na ${viewMode === 'grid' ? 'seznam' : 'mřížku'}`}
            >
              {viewMode === 'grid' ? <ListIcon size={18} /> : <Grid size={18} />}
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-500 mb-4">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className={`hover:text-[#007BFF] transition-colors ${!currentFolderId ? 'text-[#007BFF]' : ''}`}
          >
            Kořen
          </button>
          {folderPath.map(folder => (
            <div key={folder.id} className="flex items-center gap-2">
              <ChevronRight size={14} className="text-gray-300" />
              <button 
                onClick={() => {
                  console.log('📁 Breadcrumb folder clicked:', folder.name, 'id:', folder.id);
                  setCurrentFolderId(folder.id);
                }}
                className="hover:text-[#007BFF] transition-colors"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3 flex-wrap items-center">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="bg-[#007BFF] text-white px-6 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all rounded"
          >
            <Upload size={14} /> Nahrát
          </button>
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleUpload} />
          
          <button 
            onClick={handleCreateFolder}
            className="border-2 border-[#007BFF] bg-white text-[#007BFF] px-6 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 rounded hover:bg-blue-50 transition-all"
          >
            <FolderPlus size={14} /> Nová složka
          </button>

          <div className="relative flex-1 min-w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="HLEDAT..." 
              value={searchQuery} 
              onChange={e=>setSearchQuery(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-white text-black text-[10px] font-black uppercase rounded focus:border-[#007BFF] outline-none"
            />
          </div>

          {/* Sort Controls */}
          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'name' | 'date' | 'type')}
            className="px-4 py-2 border border-gray-200 rounded text-[10px] font-black uppercase bg-white hover:border-[#007BFF] cursor-pointer"
          >
            <option value="name">Seřadit: Název</option>
            <option value="date">Seřadit: Datum</option>
            <option value="type">Seřadit: Typ</option>
          </select>

          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-200 rounded text-[10px] font-black uppercase bg-white hover:bg-gray-50"
            title={sortOrder === 'asc' ? 'Vzestupně' : 'Sestupně'}
          >
            {sortOrder === 'asc' ? '▲' : '▼'}
          </button>

          {/* Bulk Actions */}
          {selectedIds.size === 0 ? (
            <button 
              onClick={() => setSelectedIds(new Set(currentItems.map(i => i.id)))}
              className="px-6 py-2 border-2 border-gray-300 text-gray-600 text-[10px] font-black uppercase rounded hover:border-[#007BFF] hover:text-[#007BFF] transition-all flex items-center gap-2"
              title="Vybrat vše v aktuální složce"
            >
              <CheckSquare size={14} /> Vybrat vše
            </button>
          ) : (
            <>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-6 py-2 border-2 border-gray-300 text-gray-600 text-[10px] font-black uppercase rounded hover:border-orange-500 hover:text-orange-500 transition-all flex items-center gap-2"
              >
                <Square size={14} /> Odznačit ({selectedIds.size})
              </button>
              <button 
                onClick={() => setMoveToFolderId('__select__')}
                className="px-6 py-2 bg-[#007BFF] text-white text-[10px] font-black uppercase rounded hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Move size={14} /> Přesunout {selectedIds.size}
              </button>
              <button 
                onClick={() => setShowBulkDelete(true)}
                className="px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase rounded hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <Trash2 size={14} /> Smazat {selectedIds.size}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Grid/List */}
      {viewMode === 'grid' ? (
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 flex-1 overflow-auto bg-white">
          {currentItems.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400">
              <HardDrive size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-[11px] font-black uppercase tracking-widest">Složka je prázdná</p>
            </div>
          ) : (
            currentItems.map(item => (
              <motion.div 
                key={item.id}
                layout
                className="relative group"
              >
                <div 
                  className={`relative flex flex-col items-center gap-3 p-3 border-2 rounded hover:border-[#007BFF] transition-all cursor-pointer bg-gray-50 hover:bg-white h-full ${
                    dragOverId === item.id && item.type === 'folder' ? 'border-[#007BFF] bg-blue-50' : 'border-gray-100'
                  }`}
                  onClick={() => {
                    if (item.type === 'folder') {
                      console.log('📁 Grid folder clicked:', item.name, 'id:', item.id);
                      setCurrentFolderId(item.id);
                    } else {
                      setPreviewIndex(previewItems.findIndex(pi => pi.id === item.id));
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                  draggable={item.type !== 'folder'}
                  onDragStart={(e) => item.type !== 'folder' && handleDragStart(e, item.id)}
                  onDragOver={(e) => item.type === 'folder' && handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => item.type === 'folder' && handleDropOnFolder(e, item.id)}
                >
                  {/* Type specific display */}
                  <div className={`w-full aspect-square flex items-center justify-center overflow-hidden rounded bg-white transition-all ${dragOverId === item.id && item.type === 'folder' ? 'ring-2 ring-[#007BFF]' : ''}`}>
                    {item.type === 'folder' ? (
                      <div className={`transition-all ${dragOverId === item.id ? 'scale-110 text-[#007BFF]' : 'text-[#007BFF]/40'}`}>
                        <Folder size={48} />
                      </div>
                    ) : item.type === 'image' && item.url ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    ) : (
                      getFileIcon(item.type)
                    )}
                  </div>
                  
                  <p className="text-[9px] font-black uppercase truncate w-full text-center text-gray-600 group-hover:text-[#007BFF]">{item.name}</p>
                  
                  {item.type !== 'folder' && <p className="text-[8px] text-gray-400">{item.size}</p>}

                  {/* Select Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.id)) {
                            newSet.delete(item.id);
                          } else {
                            newSet.add(item.id);
                          }
                          return newSet;
                        });
                      }}
                      className={`p-2 rounded transition-all ${selectedIds.has(item.id) ? 'bg-[#007BFF] text-white' : 'bg-white/80 text-gray-400 group-hover:text-gray-600'}`}
                    >
                      {selectedIds.has(item.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded flex items-center justify-center gap-2">
                    {item.type !== 'folder' && (
                      <>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const idx = previewItems.findIndex(pi => pi.id === item.id);
                            if (idx >= 0) setPreviewIndex(idx);
                          }}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded text-white backdrop-blur"
                          title="Náhled"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowMetadataEditor(item); }}
                          className="p-2 bg-white/20 hover:bg-white/40 rounded text-white backdrop-blur"
                          title="Metadata"
                        >
                          <Tag size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingItem(item); setEditName(item.name); }}
                      className="p-2 bg-white/20 hover:bg-white/40 rounded text-white backdrop-blur"
                      title="Přejmenovat"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id); }}
                      className="p-2 bg-red-500/40 hover:bg-red-500/60 rounded text-white backdrop-blur"
                      title="Smazat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px] font-black uppercase tracking-widest">
            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center w-12">
                  <button
                    onClick={() => {
                      if (selectedIds.size === currentItems.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(currentItems.map(i => i.id)));
                      }
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {selectedIds.size === currentItems.length && currentItems.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">Název</th>
                <th className="px-6 py-3 text-left">Typ</th>
                <th className="px-6 py-3 text-left">Velikost</th>
                <th className="px-6 py-3 text-left">Datum</th>
                <th className="px-6 py-3 text-center">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.map(item => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-50 transition-all ${selectedIds.has(item.id) ? 'bg-blue-50' : ''} ${dragOverId === item.id && item.type === 'folder' ? 'bg-blue-100 ring-1 ring-[#007BFF]' : ''}`}
                  draggable={item.type !== 'folder'}
                  onDragStart={(e) => item.type !== 'folder' && handleDragStart(e, item.id)}
                  onDragOver={(e) => item.type === 'folder' && handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => item.type === 'folder' && handleDropOnFolder(e, item.id)}
                >
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.id)) {
                            newSet.delete(item.id);
                          } else {
                            newSet.add(item.id);
                          }
                          return newSet;
                        });
                      }}
                      className="text-gray-600 hover:text-[#007BFF]"
                    >
                      {selectedIds.has(item.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  </td>
                  <td className="px-6 py-3 flex items-center gap-3">
                    {item.type === 'folder' ? (
                      <div className={`transition-all ${dragOverId === item.id ? 'text-[#007BFF] scale-110' : 'text-gray-600'}`}>
                        <Folder size={16} />
                      </div>
                    ) : (
                      getFileIcon(item.type)
                    )}
                    <span className="truncate">{item.name}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {item.type === 'folder' ? '📁 Složka' : item.type === 'image' ? '🖼️ Foto' : item.type === 'video' ? '🎬 Video' : '📄 Soubor'}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{item.size || '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(item.updatedAt)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      {item.type !== 'folder' && (
                        <>
                          <button 
                            onClick={() => setPreviewIndex(previewItems.findIndex(pi => pi.id === item.id))}
                            className="p-1 hover:text-[#007BFF]"
                            title="Náhled"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setShowMetadataEditor(item);
                              setEditName(item.name);
                              setEditAlt(item.alt || '');
                              setEditDescription(item.description || '');
                            }}
                            className="p-1 hover:text-[#007BFF]"
                            title="Metadata"
                          >
                            <Tag size={14} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => { setEditingItem(item); setEditName(item.name); }}
                        className="p-1 hover:text-[#007BFF]"
                        title="Přejmenovat"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(item.id)}
                        className="p-1 hover:text-red-500"
                        title="Smazat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enhanced File Preview Modal with Navigation */}
      <AnimatePresence>
        {previewIndex !== null && previewItems[previewIndex] && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setPreviewIndex(null)}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-black rounded flex flex-col h-full max-h-[95vh] w-full max-w-7xl"
            >
              {/* Header */}
              <div className="border-b border-gray-700 p-4 flex justify-between items-center bg-gray-900">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    {previewIndex + 1} z {previewItems.length}
                  </p>
                  <h3 className="text-lg font-black uppercase tracking-widest text-white max-w-sm truncate">{previewItems[previewIndex]?.name}</h3>
                </div>
                <button onClick={() => setPreviewIndex(null)} className="p-2 hover:bg-gray-800 rounded text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Main Preview Area */}
              <div className="flex-1 overflow-hidden flex">
                {/* Left Navigation */}
                <button 
                  onClick={() => setPreviewIndex(previewIndex > 0 ? previewIndex - 1 : previewItems.length - 1)}
                  className="p-4 hover:bg-gray-800/50 transition-all text-white flex items-center justify-center"
                  title="Předchozí"
                >
                  <ChevronLeft size={32} />
                </button>

                {/* Media Display */}
                <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
                  {previewItems[previewIndex]?.type === 'image' && previewItems[previewIndex]?.url && (
                    <img 
                      src={previewItems[previewIndex].url} 
                      alt={previewItems[previewIndex].name} 
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                  {previewItems[previewIndex]?.type === 'video' && previewItems[previewIndex]?.url && (
                    <video 
                      src={previewItems[previewIndex].url} 
                      controls 
                      className="max-w-full max-h-full object-contain"
                      autoPlay
                    />
                  )}
                </div>

                {/* Right Navigation */}
                <button 
                  onClick={() => setPreviewIndex(previewIndex < previewItems.length - 1 ? previewIndex + 1 : 0)}
                  className="p-4 hover:bg-gray-800/50 transition-all text-white flex items-center justify-center"
                  title="Další"
                >
                  <ChevronRight size={32} />
                </button>
              </div>

              {/* Metadata Footer */}
              <div className="border-t border-gray-700 bg-gray-900 p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Typ</p>
                  <p className="text-white">{previewItems[previewIndex]?.type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Velikost</p>
                  <p className="text-white">{previewItems[previewIndex]?.size || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Vytvořeno</p>
                  <p className="text-white text-sm">{formatDate(previewItems[previewIndex]?.updatedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setShowMetadataEditor(previewItems[previewIndex]);
                      setPreviewIndex(null);
                    }}
                    className="flex-1 px-3 py-2 bg-[#007BFF] text-white rounded text-[9px] font-black uppercase hover:bg-blue-700 transition-all"
                  >
                    Metadata
                  </button>
                  <button 
                    onClick={() => {
                      setDeleteConfirm(previewItems[previewIndex]?.id || null);
                      setPreviewIndex(null);
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded text-[9px] font-black uppercase hover:bg-red-700 transition-all"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metadata Editor Modal */}
      <AnimatePresence>
        {showMetadataEditor && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowMetadataEditor(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded p-8 max-w-lg w-full space-y-6 my-8"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-2">Metadata</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{showMetadataEditor.name}</p>
                </div>
                <button onClick={() => setShowMetadataEditor(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 text-[11px] font-black uppercase tracking-widest">
                {/* Thumbnail Preview */}
                <div className="flex items-center justify-center w-full h-40 bg-gray-50 rounded border border-gray-200">
                  {showMetadataEditor.type === 'image' && showMetadataEditor.url && (
                    <img src={showMetadataEditor.url} alt="" className="max-w-full max-h-full object-contain" />
                  )}
                  {showMetadataEditor.type === 'video' && (
                    <VideoIcon size={48} className="text-gray-300" />
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-gray-600 mb-2">Název</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-600 mb-2">Popis</label>
                  <textarea 
                    placeholder="Přidej popis souboru..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px] resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-gray-600 mb-2">Štítky</label>
                  <input 
                    type="text" 
                    placeholder="Odděluj čárkami: tag1, tag2, tag3"
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px]"
                  />
                </div>

                {/* File Info */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-gray-500 mb-1">Typ</p>
                    <p className="text-gray-800">{showMetadataEditor.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Velikost</p>
                    <p className="text-gray-800">{showMetadataEditor.size || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Vytvořeno</p>
                    <p className="text-gray-800">{formatDate(showMetadataEditor.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">ID</p>
                    <p className="text-gray-800 text-[9px] font-mono break-all">{showMetadataEditor.id}</p>
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="block text-gray-600 mb-2">URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={showMetadataEditor.url}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-200 rounded bg-gray-50 text-[9px] font-mono"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(showMetadataEditor.url);
                        alert('URL zkopírován');
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-[9px]"
                    >
                      Kopírovat
                    </button>
                  </div>
                </div>

                {/* ALT Text */}
                <div>
                  <label className="block text-gray-600 mb-2">ALT text (popis obrázku pro SEO)</label>
                  <input 
                    type="text" 
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    placeholder="Krátký popis obrázku pro vyhledávače a čtečky..."
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-[#007BFF] text-[10px]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-600 mb-2">Popis / poznámky</label>
                  <textarea 
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Volitelný delší popis nebo poznámky k souboru..."
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-[#007BFF] text-[10px] min-h-[80px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      handleRename(showMetadataEditor.id, editName, editAlt, editDescription);
                      setShowMetadataEditor(null);
                    }}
                    className="flex-1 bg-[#007BFF] text-white px-4 py-3 rounded hover:bg-blue-700 transition-all text-[10px] font-black"
                  >
                    Uložit metadata
                  </button>
                  <button 
                    onClick={() => setShowMetadataEditor(null)}
                    className="px-4 py-3 border border-gray-200 rounded hover:bg-gray-50 transition-all text-[10px] font-black"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest mb-2">Smazat?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Opravdu chceš smazat: <strong>{items.find(i => i.id === deleteConfirm)?.name}</strong>?
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-all text-[10px] font-black uppercase"
                >
                  Zrušit
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-[10px] font-black uppercase"
                >
                  Smazat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Bulk Delete Modal */}
        {showBulkDelete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setShowBulkDelete(false)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-start gap-4">
                <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest mb-2">Smazat vybrané?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Opravdu chceš smazat <strong>{selectedIds.size}</strong> vybraných položek?
                  </p>
                  <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto text-xs space-y-1 mb-4">
                    {Array.from(selectedIds).map(id => {
                      const item = items.find(i => i.id === id);
                      return item ? (
                        <div key={id} className="text-gray-700 truncate">
                          • {item.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBulkDelete(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-all text-[10px] font-black uppercase"
                >
                  Zrušit
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-[10px] font-black uppercase"
                >
                  Smazat všechny
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setEditingItem(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded p-6 max-w-sm w-full space-y-4"
            >
              <h3 className="text-lg font-black uppercase tracking-widest">Přejmenovat</h3>
              
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(editingItem.id, editName);
                  if (e.key === 'Escape') setEditingItem(null);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[11px] font-black uppercase"
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 transition-all text-[10px] font-black uppercase"
                >
                  Zrušit
                </button>
                <button 
                  onClick={() => handleRename(editingItem.id, editName)}
                  className="flex-1 px-4 py-2 bg-[#007BFF] text-white rounded hover:bg-blue-700 transition-all text-[10px] font-black uppercase"
                >
                  Uložit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className={`fixed bottom-8 right-8 z-[100] w-96 bg-white shadow-2xl border border-gray-200 rounded overflow-hidden ${isQueueMinimized ? 'h-14' : 'max-h-[500px]'}`}
          >
            <div 
              className="bg-black text-white p-4 flex justify-between items-center cursor-pointer hover:bg-gray-900 transition-all" 
              onClick={() => setIsQueueMinimized(!isQueueMinimized)}
            >
              <div className="flex items-center gap-3">
                <RefreshCw size={14} className={`${uploadQueue.some(u => u.status === 'uploading') ? 'animate-spin text-[#007BFF]' : 'text-green-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">Nahrávání ({uploadQueue.length})</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setUploadQueue([]); }} 
                className="p-1 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {!isQueueMinimized && (
              <div className="overflow-y-auto max-h-[400px] p-4 space-y-3 bg-white">
                {uploadQueue.map(upload => (
                  <div key={upload.id} className="space-y-2 border-b border-gray-50 pb-2">
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] font-black uppercase truncate text-black pr-4">{upload.fileName}</p>
                      <span className={`text-[8px] font-black uppercase ${
                        upload.status === 'completed' ? 'text-green-500' : 
                        upload.status === 'error' ? 'text-red-500' : 
                        'text-[#007BFF]'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className={`h-full ${
                        upload.status === 'completed' ? 'bg-green-500' :
                        upload.status === 'error' ? 'bg-red-500' :
                        'bg-[#007BFF]'
                      }`} animate={{ width: `${upload.progress}%` }} />
                    </div>
                    {upload.error && <p className="text-[8px] font-bold text-red-500">{upload.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Context Menu */}
      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999
          }}
          className="bg-white border border-gray-200 rounded shadow-xl overflow-hidden w-48"
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
        >
          <div className="py-1">
            {/* Rename */}
            <button
              onClick={() => {
                const item = items.find(i => i.id === contextMenu.itemId);
                if (item) {
                  setEditingItem(item);
                  setEditName(item.name);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-blue-50 flex items-center gap-2 transition-colors"
            >
              <Edit2 size={14} /> Přejmenovat
            </button>

            {/* Move to Folder */}
            {items.find(i => i.id === contextMenu.itemId)?.type !== 'folder' && (
              <button
                onClick={() => {
                  setMoveToFolderId(contextMenu.itemId);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-blue-50 flex items-center gap-2 transition-colors"
              >
                <Move size={14} /> Přesunout do složky
              </button>
            )}

            {/* Metadata */}
            {items.find(i => i.id === contextMenu.itemId)?.type !== 'folder' && (
              <button
                onClick={() => {
                  const item = items.find(i => i.id === contextMenu.itemId);
                  if (item) {
                    setShowMetadataEditor(item);
                    setEditName(item.name);
                  }
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-blue-50 flex items-center gap-2 transition-colors"
              >
                <Tag size={14} /> Metadata
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-gray-200 my-1"></div>

            {/* Delete */}
            <button
              onClick={() => {
                setDeleteConfirm(contextMenu.itemId);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> Smazat
            </button>
          </div>
        </motion.div>
      )}

      {/* Move to Folder Modal */}
      <AnimatePresence>
        {moveToFolderId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoveToFolderId(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-md w-full space-y-4"
            >
              <h3 className="text-lg font-black uppercase tracking-widest">
                {moveToFolderId === '__select__' ? `Přesunout ${selectedIds.size} položek` : 'Přesunout do složky'}
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {/* Root */}
                <button
                  onClick={() => {
                    if (moveToFolderId === '__select__') {
                      handleBulkMove(null);
                    } else {
                      handleMoveToFolder(moveToFolderId, null);
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded text-[10px] font-black uppercase flex items-center gap-2"
                >
                  <FolderPlus size={14} /> Kořen
                </button>

                {/* Folders */}
                {items.filter(i => i.type === 'folder').map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      if (moveToFolderId === '__select__') {
                        handleBulkMove(folder.id);
                      } else {
                        handleMoveToFolder(moveToFolderId, folder.id);
                      }
                    }}
                    className="w-full text-left px-4 py-2 pl-8 hover:bg-blue-50 rounded text-[10px] font-black uppercase"
                  >
                    {folder.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMoveToFolderId(null)}
                className="w-full px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-[10px] font-black uppercase"
              >
                Zrušit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Context Menu Closer */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setContextMenu(null)}
          onContextMenu={e => e.preventDefault()}
        />
      )}
    </div>
  );
};

export default FileManagerV2;
