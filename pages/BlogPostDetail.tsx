
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BlogPost } from '../types';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import { blogDB } from '../lib/db';
import SEO from '../components/SEO';

const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      const posts = await blogDB.getAll();
      const found = posts.find((p: BlogPost) => p.id === id);
      if (found) {
        setPost(found);
        document.title = `${found.title} | Blog Jakub Minka`;
      } else {
        navigate('/blog');
      }
    };
    load();
  }, [id, navigate]);

  // Process content to convert standalone image URLs to img tags
  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    
    let content = post.content;

    // First, handle markdown image syntax: ![alt text](url)
    content = content.replace(
      /!\[([^\]]*)\]\((https?:\/\/[^\s)]+?\.(?:webp|jpg|jpeg|png|gif))\)/gi,
      (match, alt, url) => {
        const caption = alt.trim();
        if (caption) {
          return `<figure class="my-12"><img src="${url}" alt="${caption}" class="w-full max-w-3xl mx-auto shadow-2xl border border-gray-100 rounded-sm block" /><figcaption class="text-center text-gray-400 text-xs mt-3 font-medium">${caption}</figcaption></figure>`;
        }
        return `<img src="${url}" alt="" class="w-full max-w-3xl mx-auto my-8 shadow-2xl border border-gray-100 rounded-sm block" />`;
      }
    );

    // Then handle standalone image URLs (not already in tags)
    const parts = content.split(/(<[^>]+>)/g);
    const processed = parts.map(part => {
      if (part.startsWith('<')) {
        return part;
      }
      
      return part.replace(
        /https?:\/\/[^\s<>"]+?\.(?:webp|jpg|jpeg|png|gif)/gi,
        (url) => `<img src="${url}" alt="" class="w-full max-w-3xl mx-auto my-8 shadow-2xl border border-gray-100 rounded-sm block" />`
      );
    });

    return processed.join('');
  }, [post?.content]);

  if (!post) return null;

  return (
    <article className="min-h-screen bg-white">
      <SEO 
        title={post.seoTitle || `${post.title} | Blog Jakub Minka`}
        description={post.seoDescription || post.excerpt}
        keywords={post.seoKeywords || post.tags.join(', ')}
        ogImage={post.coverImage}
        ogType="article"
      />
      {/* Post Hero */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={post.coverImage} 
          className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale-[0.5]" 
          alt={post.title} 
        />
        
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
          <Link to="/blog" className="inline-flex items-center gap-3 text-white/50 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.4em] mb-12">
            <ArrowLeft size={16} /> Zpět na blog
          </Link>
          
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-[10px] font-black uppercase tracking-widest text-[#007BFF]">
             {post.tags.map(tag => (
               <span key={tag} className="bg-[#007BFF] text-white px-4 py-1.5 shadow-xl">{tag}</span>
             ))}
          </div>
          
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl">
            {post.title}
          </h1>
          
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/60 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(post.date).toLocaleDateString()}</span>
            <span className="flex items-center gap-2"><User size={14} /> {post.author}</span>
            <span className="flex items-center gap-2"><Clock size={14} /> 5 min čtení</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
        <div 
          className="prose prose-lg max-w-none text-gray-700 font-medium leading-relaxed
                     prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:text-black
                     prose-p:mb-8 prose-p:leading-relaxed
                     prose-strong:text-black prose-strong:font-black
                     prose-a:text-[#007BFF] prose-a:no-underline hover:prose-a:underline
                     prose-ul:list-disc prose-li:mb-2
                     [&_img]:w-full [&_img]:max-w-3xl [&_img]:mx-auto [&_img]:my-8 [&_img]:shadow-2xl [&_img]:border [&_img]:border-gray-100 [&_img]:rounded-sm [&_img]:block
                     [&_video]:w-full [&_video]:max-w-3xl [&_video]:mx-auto [&_video]:my-8 [&_video]:shadow-2xl [&_video]:rounded-sm [&_video]:block
                     [&_iframe]:w-full [&_iframe]:max-w-3xl [&_iframe]:mx-auto [&_iframe]:my-8 [&_iframe]:shadow-2xl [&_iframe]:rounded-sm [&_iframe]:block"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
        
        <div className="mt-24 pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center font-black text-[#007BFF] text-xl">JM</div>
             <div>
                <h4 className="font-black uppercase tracking-widest text-sm">Jakub Minka</h4>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Fotograf & Kameraman</p>
             </div>
          </div>
          
          <div className="flex gap-4">
             <Link to="/kontakt" className="bg-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#007BFF] transition-all">Poptat projekt</Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BlogPostDetail;
