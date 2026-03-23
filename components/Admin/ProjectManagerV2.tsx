import React, { useState, useEffect, useRef } from 'react';
import { Project, MediaType, FileItem, GalleryItem } from '../../types';
import { SPECIALIZATIONS } from '../../constants';
import { 
  Plus, Trash2, Edit2, X, Search, Youtube, Upload, RefreshCw, CheckSquare, Square,
  GripVertical, ExternalLink, Eye, Download, Grid3x3, List, Filter, SortAsc
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mediaDB, dataStore, projectDB, optimizeImage } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';
import EnhancedMediaPicker from './EnhancedMediaPicker';

const ProjectManagerV2: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploads, setUploads] = useState<{id: string, name: string, progress: number}[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [allMediaItems, setAllMediaItems] = useState<FileItem[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'gallery' | 'youtubeCover'>('gallery');
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  
  const draggedGalleryItem = useRef<number | null>(null);

  // Form state - všechny fieldy v jednom objektu
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    shortDescription: '',
    description: '',
    categoryId: SPECIALIZATIONS[0].id,
    type: MediaType.BOTH,
    date: new Date().toISOString().split('T')[0],
    thumbnailUrl: '',
    thumbnailSource: 'pc',
    gallery: [],
    servicesDelivered: '',
    youtubeUrl: '',
    websiteUrl: '',
    websiteLabel: '',
    youtubeCoverUrl: ''
  });
  
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);

  // Load projects and media
  useEffect(() => {
    const load = async () => {
      const savedProjects = await projectDB.getAll({ force: true });
      setProjects(savedProjects);
      const savedMedia = await mediaDB.getAll({ force: true });
      setAllMediaItems(savedMedia);
    };
    load();
  }, []);

  // Image to WebP conversion with compression
  const convertToWebP = async (file: File, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large
          const maxWidth = 2000;
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP if browser supports it
          canvas.toBlob((blob) => resolve(blob || file), 'image/webp', quality);
        };
      };
    });
  };

  // Upload file to Supabase Storage
  const uploadFileToStorage = async (file: Blob | File, fileName: string): Promise<string> => {
    const fileId = 'm-' + Math.random().toString(36).substr(2, 9);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^/.]+$/, '.webp');
    const storagePath = `uploads/${fileId}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('media').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  // Handle gallery uploads
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files) as File[];
    
    // GLOBÁLNÍ kontrola duplicit - prohledat všechna média v databázi
    const duplicatesInSystem: string[] = [];
    const filesToUpload: File[] = [];
    
    for (const file of files) {
      const fileBaseName = file.name.split('.')[0];
      
      // Check if file exists ANYWHERE in the media database
      const existsInSystem = allMediaItems.some(item => 
        item.name === fileBaseName && item.type !== 'folder'
      );
      
      if (existsInSystem) {
        duplicatesInSystem.push(file.name);
      } else {
        filesToUpload.push(file);
      }
    }
    
    // Show error if duplicates found anywhere in system
    if (duplicatesInSystem.length > 0) {
      alert(`❌ Následující soubory již existují v systému:\n${duplicatesInSystem.join('\n')}\n\nDuplicitní soubory nejsou povoleny.`);
    }
    
    // If no new files to upload, we're done
    if (filesToUpload.length === 0) {
      return;
    }
    
    setIsProcessing(true);
    const quality = parseFloat(localStorage.getItem('jakub_minka_compression_quality') || '0.8');

    for (const file of filesToUpload) {
      const uploadId = Math.random().toString(36).substr(2, 9);
      const fileBaseName = file.name.split('.')[0];
      
      setUploads(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }]);

      try {
        const webpBlob = await convertToWebP(file, quality);
        const url = await uploadFileToStorage(webpBlob, file.name);

        // Add to media gallery
        const mediaItem: FileItem = {
          id: 'm-' + uploadId,
          name: fileBaseName,
          type: 'image',
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          url,
          parent_id: null,
          specialization_id: '',
          updated_at: new Date().toISOString()
        };
        await mediaDB.save(mediaItem);
        console.log('✅ Gallery image added to media gallery:', mediaItem.name);

        const galleryItem: GalleryItem = {
          id: 'g-' + uploadId,
          url,
          type: 'image',
          source: 'storage'
        };

        setFormData(p => ({
          ...p,
          gallery: [...(p.gallery || []), galleryItem]
        }));

        setUploads(prev => prev.filter(u => u.id !== uploadId));
      } catch (err) {
        console.error('Gallery upload error:', err);
        setUploads(prev => prev.filter(u => u.id !== uploadId));
      }
    }
    setIsProcessing(false);
  };

  // Callback for media picker - single selection (thumbnail)
  const handleMediaPickerSelect = (item: FileItem) => {
    if (pickerMode === 'youtubeCover') {
      setFormData(p => ({ ...p, youtubeCoverUrl: item.url }));
    }
    setShowMediaPicker(false);
  };

  // Callback for media picker - multiple selection (gallery)
  const handleMediaPickerMultiSelect = (items: FileItem[]) => {
    const currentGalleryUrls = (formData.gallery || []).map(item => item.url);
    const duplicates: string[] = [];
    const newItems: FileItem[] = [];
    
    // Filter out duplicates
    items.forEach(item => {
      if (currentGalleryUrls.includes(item.url)) {
        duplicates.push(item.name);
      } else {
        newItems.push(item);
      }
    });
    
    // Show warning if duplicates found
    if (duplicates.length > 0) {
      alert(`❌ Následující položky již jsou v galerii projektu:\n${duplicates.join('\n')}\n\nNebudou přidány.`);
    }
    
    // Add only new items
    if (newItems.length > 0) {
      const newGalleryItems = newItems.map(m => ({
        id: m.id,
        url: m.url,
        type: m.type as any,
        source: 'storage' as const
      }));
      setFormData(p => ({ ...p, gallery: [...(p.gallery || []), ...newGalleryItems] }));
    }
    
    setShowMediaPicker(false);
  };

  // Add from existing media library (legacy - keep for compatibility)
  const handleAddFromLibrary = () => {
    const picked = Array.from(selectedMedia.values())
      .map(id => allMediaItems.find(m => m.id === id))
      .filter(Boolean) as FileItem[];

    const currentGalleryUrls = (formData.gallery || []).map(item => item.url);
    const duplicates: string[] = [];
    const newItems: FileItem[] = [];
    
    // Filter out duplicates
    picked.forEach(item => {
      if (currentGalleryUrls.includes(item.url)) {
        duplicates.push(item.name);
      } else {
        newItems.push(item);
      }
    });
    
    // Show warning if duplicates found
    if (duplicates.length > 0) {
      alert(`❌ Následující položky již jsou v galerii projektu:\n${duplicates.join('\n')}\n\nNebudou přidány.`);
    }
    
    // Add only new items
    if (newItems.length > 0) {
      const newGalleryItems = newItems.map(m => ({
        id: m.id,
        url: m.url,
        type: m.type as any,
        source: 'storage' as const
      }));
      setFormData(p => ({ ...p, gallery: [...(p.gallery || []), ...newGalleryItems] }));
    }
    
    setShowMediaPicker(false);
    setSelectedMedia(new Set());
  };

  // Remove gallery item
  const removeGalleryItem = (index: number) => {
    setFormData(p => ({
      ...p,
      gallery: ((p.gallery || []).filter((_, i) => i !== index))
    }));
  };

  // Reorder gallery via drag
  const handleGalleryDragStart = (index: number) => {
    draggedGalleryItem.current = index;
  };

  const handleGalleryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGalleryDrop = (targetIndex: number) => {
    if (draggedGalleryItem.current === null) return;
    const gallery = [...(formData.gallery || [])];
    const [moved] = gallery.splice(draggedGalleryItem.current, 1);
    gallery.splice(targetIndex, 0, moved);
    setFormData(p => ({ ...p, gallery }));
    draggedGalleryItem.current = null;
  };

  // Save project
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Zadejte název projektu');
      return;
    }
    
    // Auto-select random thumbnail from gallery if gallery has images
    let thumbnailUrl = formData.thumbnailUrl || '';
    const galleryImages = (formData.gallery || []).filter(item => item.type === 'image');
    
    if (!thumbnailUrl && galleryImages.length > 0) {
      const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
      thumbnailUrl = randomImage.url;
      console.log('🎲 Auto-selected random thumbnail from gallery:', randomImage.url);
    } else if (!thumbnailUrl && galleryImages.length === 0 && youtubeUrls.length > 0) {
      // If no images but has YouTube videos, use first YouTube thumbnail
      const firstYoutubeUrl = youtubeUrls[0];
      const videoId = firstYoutubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        console.log('🎬 Auto-selected YouTube thumbnail:', thumbnailUrl);
      }
    }
    
    setIsProcessing(true);

    try {
      // Add YouTube URLs to gallery as GalleryItem objects
      const youtubeGalleryItems: GalleryItem[] = youtubeUrls
        .filter(url => url.trim())
        .map(url => ({
          id: 'yt-' + Math.random().toString(36).substr(2, 9),
          type: 'video' as const,
          url: url.trim(),
          source: 'youtube' as const
        }));
      
      // Combine existing gallery items (from storage/uploads) with YouTube items
      const combinedGallery = [...(formData.gallery || []), ...youtubeGalleryItems];
      
      const project: Project = {
        id: editingId || 'p-' + Math.random().toString(36).substr(2, 9),
        title: formData.title,
        shortDescription: formData.shortDescription || '',
        description: formData.description || '',
        category: SPECIALIZATIONS.find(s => s.id === formData.categoryId)?.name || 'Ostatní',
        categoryId: formData.categoryId!,
        type: formData.type || MediaType.BOTH,
        date: formData.date || new Date().toISOString(),
        thumbnailUrl,
        thumbnailSource: 'storage',
        gallery: combinedGallery,
        servicesDelivered: formData.servicesDelivered || '',
        websiteUrl: formData.websiteUrl || '',
        websiteLabel: formData.websiteLabel || '',
          youtubeCoverUrl: formData.youtubeCoverUrl || '',
        youtubeUrl: '' // Keep for backward compatibility but not used
      };

      await projectDB.save(project);
      console.log('Project saved, reloading list...');
      const updated = await projectDB.getAll({ force: true });
      console.log('Projects loaded:', updated);
      setProjects(updated);
      setShowForm(false);
      resetForm();
    } catch (err) {
      let errorMsg = 'Neznámá chyba';
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMsg = JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      console.error('Save error:', err);
      alert('Chyba při ukládání: ' + errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      shortDescription: '',
      description: '',
      categoryId: SPECIALIZATIONS[0].id,
      type: MediaType.BOTH,
      date: new Date().toISOString().split('T')[0],
      thumbnailUrl: '',
      thumbnailSource: 'pc',
      gallery: [],
      servicesDelivered: '',
      websiteUrl: '',
      websiteLabel: '',
      youtubeCoverUrl: ''
    });
    setYoutubeUrls([]);
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    
    // Extract YouTube videos from gallery
    const youtubeItems = (project.gallery || []).filter(item => item.source === 'youtube');
    const nonYoutubeItems = (project.gallery || []).filter(item => item.source !== 'youtube');
    
    // Set YouTube URLs state
    setYoutubeUrls(youtubeItems.map(item => item.url));
    
    // Set form data with non-YouTube gallery items only
    setFormData({
      ...project,
      gallery: nonYoutubeItems
    });
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat projekt?')) return;
    try {
      await projectDB.delete(id);
      const updated = await projectDB.getAll({ force: true });
      setProjects(updated);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting project');
    }
  };

  const filteredProjects = projects
    .filter(p =>
      (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterCategory === 'all' || p.categoryId === filterCategory)
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 border shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-[#007BFF] text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
          >
            <Plus className="inline mr-2" size={16} /> PŘIDAT ZAKÁZKU
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="HLEDAT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase bg-white text-black"
            />
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#007BFF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title="Mřížka"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#007BFF] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title="Seznam"
            >
              <List size={18} />
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border px-3 py-2 text-[10px] font-black uppercase bg-white text-black rounded"
            >
              <option value="all">Všechny kategorie</option>
              {SPECIALIZATIONS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <SortAsc size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="border px-3 py-2 text-[10px] font-black uppercase bg-white text-black rounded"
            >
              <option value="date">Datum (nejnovější)</option>
              <option value="title">Název (A-Z)</option>
              <option value="category">Kategorie</option>
            </select>
          </div>

          {/* Count */}
          <div className="ml-auto text-[10px] font-black uppercase text-gray-400 tracking-widest">
            {filteredProjects.length} / {projects.length} zakázek
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-black text-white p-6 flex justify-between items-center">
                <h2 className="text-lg font-black uppercase">
                  {editingId ? 'Upravit zakázku' : 'Nová zakázka'}
                </h2>
                <button onClick={() => setShowForm(false)} className="hover:text-red-500">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-8">
                {/* Title & Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Název projektu *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      required
                      placeholder="Vynikající projekt"
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Datum projektu
                    </label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    />
                  </div>
                </div>

                {/* Category & Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Specializace
                    </label>
                    <select
                      value={formData.categoryId || SPECIALIZATIONS[0].id}
                      onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    >
                      {SPECIALIZATIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                      Typ média
                    </label>
                    <select
                      value={formData.type || MediaType.BOTH}
                      onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
                      className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                    >
                      <option value={MediaType.BOTH}>Obrázky a video</option>
                      <option value={MediaType.IMAGE}>Jen obrázky</option>
                      <option value={MediaType.VIDEO}>Jen video</option>
                    </select>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Krátký popis
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription || ''}
                    onChange={e => setFormData(p => ({ ...p, shortDescription: e.target.value }))}
                    placeholder="Jeden řádek popisu"
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                  />
                </div>

                {/* Full Description */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Popis projektu
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Detailní popis projektu..."
                    rows={6}
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF] resize-none"
                  />
                </div>

                {/* Services Delivered */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Poskytnuté služby
                  </label>
                  <input
                    type="text"
                    value={formData.servicesDelivered || ''}
                    onChange={e => setFormData(p => ({ ...p, servicesDelivered: e.target.value }))}
                    placeholder="Fotografie, editace, produkce, atd..."
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                  />
                </div>

                {/* Client Website */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Odkaz na web klienta (volitelné)
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl || ''}
                    onChange={e => setFormData(p => ({ ...p, websiteUrl: e.target.value }))}
                    placeholder="https://www.klient.cz"
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Text tlačítka (volitelné)
                  </label>
                  <input
                    type="text"
                    value={formData.websiteLabel || ''}
                    onChange={e => setFormData(p => ({ ...p, websiteLabel: e.target.value }))}
                    placeholder="Navštívit web"
                    className="w-full border-2 border-gray-200 p-4 font-bold text-black outline-none focus:border-[#007BFF]"
                  />
                </div>

                {/* YouTube URLs */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 flex items-center justify-between">
                    <span>YouTube videa (volitelné)</span>
                    <button
                      type="button"
                      onClick={() => setYoutubeUrls([...youtubeUrls, ''])}
                      className="bg-[#007BFF] text-white px-3 py-1 text-[8px] font-black uppercase rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Plus size={12} /> Přidat video
                    </button>
                  </label>
                  <div className="space-y-2">
                    {youtubeUrls.length === 0 && (
                      <p className="text-xs text-gray-400 italic">Žádná YouTube videa</p>
                    )}
                    {youtubeUrls.map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={e => {
                            const newUrls = [...youtubeUrls];
                            newUrls[idx] = e.target.value;
                            setYoutubeUrls(newUrls);
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1 border-2 border-gray-200 p-3 font-bold text-sm text-black outline-none focus:border-[#007BFF]"
                        />
                        <button
                          type="button"
                          onClick={() => setYoutubeUrls(youtubeUrls.filter((_, i) => i !== idx))}
                          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                          title="Odebrat"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* YouTube Cover */}
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                    Vlastni cover pro YouTube (volitelne)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={formData.youtubeCoverUrl || ''}
                      onChange={e => setFormData(p => ({ ...p, youtubeCoverUrl: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1 border-2 border-gray-200 p-3 font-bold text-sm text-black outline-none focus:border-[#007BFF]"
                    />
                    <button
                      type="button"
                      onClick={() => { setPickerMode('youtubeCover'); setShowMediaPicker(true); }}
                      className="border-2 border-[#007BFF] text-[#007BFF] px-4 py-2 text-[10px] font-black uppercase hover:bg-blue-50"
                    >
                      Vybrat
                    </button>
                  </div>
                </div>

                {/* Gallery Section */}
                <div className="border-t pt-8">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    Galerie projektů
                    <span className="text-xs text-gray-400 font-normal">(Náhodný obrázek bude automaticky použit jako thumbnail)</span>
                  </h3>
                  <div className="flex gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = 'image/*,video/*';
                        input.onchange = (e) => {
                          const event = e as any;
                          handleGalleryUpload({ target: { files: event.target.files } } as any);
                        };
                        input.click();
                      }}
                      className="bg-[#007BFF] text-white px-6 py-2 text-[10px] font-black uppercase hover:bg-black transition-all"
                    >
                      <Upload size={14} className="inline mr-2" /> Přidat soubory
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPickerMode('gallery'); setShowMediaPicker(true); }}
                      className="border-2 border-[#007BFF] text-[#007BFF] px-6 py-2 text-[10px] font-black uppercase hover:bg-blue-50"
                    >
                      📚 Z knihovny
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(formData.gallery || []).map((item, idx) => (
                      <motion.div
                        key={idx}
                        draggable
                        onDragStart={() => handleGalleryDragStart(idx)}
                        onDragOver={handleGalleryDragOver}
                        onDrop={() => handleGalleryDrop(idx)}
                        className="relative group cursor-move border-2 border-dashed border-gray-300 rounded overflow-hidden aspect-square bg-gray-50"
                      >
                        {item.type === 'image' ? (
                          <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                        ) : (
                          <video src={item.url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                          <GripVertical size={16} className="text-white opacity-0 group-hover:opacity-100" />
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(idx)}
                            className="bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-600"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Upload Progress */}
                  {uploads.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {uploads.map(u => (
                        <div key={u.id}>
                          <p className="text-[9px] font-black uppercase text-gray-500">{u.name}</p>
                          <div className="h-1 bg-gray-200 rounded overflow-hidden">
                            <motion.div
                              className="h-full bg-[#007BFF]"
                              animate={{ width: `${u.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-8 border-t">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-black text-white py-4 text-[10px] font-black uppercase hover:bg-[#007BFF] disabled:bg-gray-400"
                  >
                    {isProcessing ? <RefreshCw className="animate-spin inline mr-2" size={16} /> : '✓'}
                    ULOŽIT PROJEKT
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 py-4 border-2 border-gray-200 text-[10px] font-black uppercase hover:border-red-500 text-gray-600 hover:text-red-500"
                  >
                    Zrušit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Media Picker */}
      <EnhancedMediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaPickerSelect}
        onMultiSelect={pickerMode === 'gallery' ? handleMediaPickerMultiSelect : undefined}
        allowMultiple={pickerMode === 'gallery'}
        allowUpload={true}
        showFolders={true}
      />

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400">
              <p className="text-[12px] font-black uppercase tracking-widest">Žádné projekty</p>
            </div>
          ) : (
            filteredProjects.map(project => (
              <motion.div
                key={project.id}
                layout
                className="bg-white border border-gray-200 rounded overflow-hidden group hover:shadow-xl transition-all"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {project.thumbnailUrl ? (
                    <img 
                      src={project.thumbnailUrl} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      Bez obrázku
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 bg-white/90 hover:bg-[#007BFF] hover:text-white rounded shadow-lg transition-all"
                      title="Upravit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 bg-white/90 hover:bg-red-500 hover:text-white rounded shadow-lg transition-all"
                      title="Smazat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-black uppercase tracking-wider mb-1 line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                    {project.category}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                    {project.shortDescription || project.description?.substring(0, 80)}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-gray-400 uppercase tracking-widest">
                    <span>{new Date(project.date).toLocaleDateString('cs-CZ')}</span>
                    {project.gallery && (
                      <span>📸 {project.gallery.length}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-[12px] font-black uppercase tracking-widest">Žádné projekty</p>
            </div>
          ) : (
            filteredProjects.map(project => (
              <motion.div
                key={project.id}
                layout
                className="bg-white border border-gray-200 p-6 flex gap-6 items-start hover:shadow-lg transition-shadow"
              >
                <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                  {project.thumbnailUrl ? (
                    <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Bez obrázku</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-1">{project.title}</h3>
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">
                    {project.category} • {new Date(project.date).toLocaleDateString('cs-CZ')}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.shortDescription || project.description?.substring(0, 100)}
                  </p>
                  {project.gallery && (
                    <p className="text-[10px] text-gray-400 mt-2">📸 {project.gallery.length} položek v galerii</p>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 hover:bg-blue-100 rounded text-[#007BFF]"
                    title="Upravit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 hover:bg-red-100 rounded text-red-500"
                    title="Smazat"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectManagerV2;
