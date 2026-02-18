
import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { blogDB, dataStore } from '../lib/db';

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [headerBg, setHeaderBg] = useState('https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=2000');

  useEffect(() => {
    document.title = "Blog | Jakub Minka - Fotograf a kameraman";
    const load = async () => {
      const savedPosts = await blogDB.getAll();
      const sorted = [...savedPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(sorted);

      const savedSettings = await dataStore.doc('web_settings').get();
      if (savedSettings && savedSettings.blogHeader) setHeaderBg(savedSettings.blogHeader);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Blog Header */}
      <div className="relative py-32 md:py-48 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <img src={headerBg} className="absolute inset-0 w-full h-full object-cover grayscale opacity-40" alt="Blog Header" />
        <div className="relative z-20">
          <span className="text-[#007BFF] font-black text-[10px] uppercase tracking-[0.8em] block mb-6 drop-shadow-lg">Pohled za oponu</span>
          <h1 className="text-6xl md:text-[90px] font-black tracking-tighter leading-none mb-10 uppercase text-white drop-shadow-2xl">BLOG</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {posts.map((post, idx) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col space-y-6"
              >
                <Link to={`/blog/${post.id}`} className="block aspect-[16/10] overflow-hidden bg-gray-100 relative">
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#007BFF] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 shadow-lg">
                      {post.tags[0] || 'BLOG'}
                    </span>
                  </div>
                </Link>

                <div className="space-y-4">
                  <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-2"><Calendar size={12} /> {new Date(post.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2"><User size={12} /> {post.author}</span>
                  </div>
                  
                  <Link to={`/blog/${post.id}`}>
                    <h2 className="text-2xl font-black uppercase tracking-tighter group-hover:text-[#007BFF] transition-colors leading-tight">
                      {post.title}
                    </h2>
                  </Link>
                  
                  <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-3 text-[#007BFF] text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                    Číst článek <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center">
            <h4 className="text-2xl font-black uppercase tracking-widest text-gray-950 opacity-40">Zatím tu nic není, ale pracuje se na tom!</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
