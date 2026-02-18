import React, { useState, useEffect } from 'react';
import { BlogPost, FileItem } from '../../types';
import { 
  Plus, Trash2, Edit2, X, Search, 
  Bold, Italic, List, Heading2, Heading3,
  Image as LucideImage, Video as LucideVideo, Link as LinkIcon, 
  Check, RefreshCw, Eye, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { blogDB, mediaDB } from '../../lib/db';
import { supabase } from '../../src/supabaseClient';
import EnhancedMediaPicker from './EnhancedMediaPicker';
import EnhancedBlogEditor from './EnhancedBlogEditor';

const BlogManagerV2: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [allItems, setAllItems] = useState<FileItem[]>([]);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    date: new Date().toISOString().split('T')[0],
    author: 'Jakub Minka',
    tags: []
  });

  const [contentHTML, setContentHTML] = useState('');

  const loadData = async () => {
    try {
      const saved = await blogDB.getAll({ force: true });
      setPosts(saved);
      
      const dbItems = await mediaDB.getAll({ force: true });
      setAllItems(dbItems.filter(i => i.type !== 'folder'));
    } catch (err) {
      console.error('Load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingId) {
      const post = posts.find(p => p.id === editingId);
      if (post) {
        setFormData({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          date: new Date(post.date).toISOString().split('T')[0],
          author: post.author,
          tags: post.tags
        });
        setContentHTML(post.content);
      }
    }
  }, [editingId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !contentHTML.trim()) {
      alert('Vyplň název a obsah článku');
      return;
    }

    setIsProcessing(true);
    try {
      const postData: BlogPost = {
        id: editingId || 'b-' + Math.random().toString(36).substr(2, 9),
        title: formData.title,
        excerpt: formData.excerpt || '',
        content: contentHTML,
        coverImage: formData.coverImage || '',
        date: editingId ? new Date().toISOString() : new Date(formData.date || new Date()).toISOString(),
        author: formData.author || 'Jakub Minka',
        tags: formData.tags || []
      };

      console.log('Saving blog post:', postData);
      await blogDB.save(postData);
      
      await loadData();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        coverImage: '',
        date: new Date().toISOString().split('T')[0],
        author: 'Jakub Minka',
        tags: []
      });
      setContentHTML('');
      alert('✓ Článek uložen');
    } catch (err) {
      console.error('Full error:', err);
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      alert('Chyba při uložení: ' + errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const insertImage = (item: FileItem) => {
    const markdown = `![${item.name}](${item.url})\n`;
    setContentHTML(contentHTML + markdown);
    setShowMediaPicker(false);
  };

  const insertVideo = (item: FileItem) => {
    const markdown = `<video src="${item.url}" controls style="width: 100%; margin: 1rem 0;" />\n`;
    setContentHTML(contentHTML + markdown);
    setShowMediaPicker(false);
  };

  const handleMediaPickerSelect = (item: FileItem) => {
    // If no cover image is set, use this as cover image
    if (!formData.coverImage && item.type === 'image') {
      setFormData({ ...formData, coverImage: item.url });
      setShowMediaPicker(false);
      alert('✓ Titulní fotka nastavena');
      return;
    }
    
    // Otherwise, insert into content
    if (item.type === 'image') {
      insertImage(item);
    } else if (item.type === 'video') {
      insertVideo(item);
    }
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 border flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              excerpt: '',
              content: '',
              coverImage: '',
              date: new Date().toISOString().split('T')[0],
              author: 'Jakub Minka',
              tags: []
            });
            setContentHTML('');
            setShowForm(true);
          }}
          className="bg-[#007BFF] text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Nový článek
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="HLEDAT..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-12 pr-6 py-3 border text-[10px] font-black w-64 uppercase text-black bg-white focus:border-[#007BFF] outline-none rounded"
          />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map(post => (
          <motion.div
            key={post.id}
            layout
            className="bg-white border border-gray-200 rounded overflow-hidden hover:border-[#007BFF] transition-all group"
          >
            {/* Cover Image */}
            {post.coverImage && (
              <div className="w-full h-40 overflow-hidden bg-gray-100">
                <img src={post.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">{new Date(post.date).toLocaleDateString('cs-CZ')}</p>
                <h3 className="text-lg font-black uppercase tracking-tight line-clamp-2">{post.title}</h3>
              </div>
              
              {post.excerpt && (
                <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[8px] bg-gray-100 px-2 py-1 rounded uppercase font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEditingId(post.id) || setShowForm(true)}
                  className="flex-1 p-2 text-[10px] font-black uppercase border border-[#007BFF] text-[#007BFF] hover:bg-[#007BFF] hover:text-white transition-all rounded flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Upravit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Smazat artikel?')) {
                      blogDB.delete(post.id).then(() => loadData());
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 transition-all rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPosts.length === 0 && !showForm && (
        <div className="py-20 text-center text-gray-400">
          <p className="text-[12px] font-black uppercase tracking-widest">Žádné články</p>
        </div>
      )}

      {/* Editor Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xl"
          >
            <div className="bg-gray-50 border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-widest">
                {editingId ? 'Upravit' : 'Nový'} článek
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Název článku
                    </label>
                    <input 
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="Zadej název..."
                      className="w-full px-4 py-3 border border-gray-200 rounded text-lg font-black uppercase focus:border-[#007BFF] outline-none"
                    />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Krátké shrnutí (SEO)
                    </label>
                    <textarea 
                      value={formData.excerpt || ''}
                      onChange={e => setFormData({...formData, excerpt: e.target.value})}
                      placeholder="160 znaků - vidí se v Google vyhledávání..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded resize-none focus:border-[#007BFF] outline-none"
                    />
                    <p className="text-[9px] text-gray-500 mt-1">{formData.excerpt?.length || 0} / 160 znaků</p>
                  </div>

                  {/* Editor Toolbar and Content */}
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <EnhancedBlogEditor
                      content={contentHTML}
                      coverImage={formData.coverImage || ''}
                      title={formData.title || ''}
                      onContentChange={setContentHTML}
                      onMediaClick={() => setShowMediaPicker(true)}
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Cover Image */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Titulní foto
                    </label>
                    <div className="aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-hidden relative group">
                      {formData.coverImage ? (
                        <>
                          <img src={formData.coverImage} alt="" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, coverImage: ''})}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setShowMediaPicker(true)}
                          className="flex flex-col items-center gap-2 text-gray-500 hover:text-[#007BFF] transition-colors"
                        >
                          <LucideImage size={24} />
                          <span className="text-[8px] font-black uppercase">Vybrat foto</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Datum publikace
                    </label>
                    <input 
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none"
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Autor
                    </label>
                    <input 
                      type="text"
                      value={formData.author || ''}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-600 tracking-widest mb-2">
                      Štítky
                    </label>
                    <input 
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={e => setFormData({
                        ...formData, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                      })}
                      placeholder="tag1, tag2, tag3"
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:border-[#007BFF] outline-none text-[10px]"
                    />
                  </div>

                  {/* Save Button */}
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-[#007BFF] text-white py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all disabled:opacity-50 rounded flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        PUBLIKUJI...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        PUBLIKOVAT
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Media Picker */}
      <EnhancedMediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaPickerSelect}
        allowMultiple={false}
        allowUpload={true}
        showFolders={true}
      />
    </div>
  );
};

export default BlogManagerV2;

