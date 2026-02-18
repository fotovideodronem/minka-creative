
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react';
import { WebSettings } from '../types';

const NotFound: React.FC = () => {
  const [profilePic, setProfilePic] = useState('https://picsum.photos/id/64/800/800');

  useEffect(() => {
    document.title = "404 - Stránka nenalezena | Jakub Minka";
    const saved = localStorage.getItem('jakub_minka_web_settings');
    if (saved) {
      const settings: WebSettings = JSON.parse(saved);
      if (settings.profilePic) setProfilePic(settings.profilePic);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full space-y-12"
      >
        {/* 404 Visual */}
        <div className="relative inline-block">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-8 border-gray-50 shadow-2xl mx-auto">
            <img 
              src={profilePic} 
              className="w-full h-full object-cover grayscale" 
              alt="Jakub Minka" 
            />
          </div>
          <div className="absolute -bottom-4 -right-4 bg-[#007BFF] text-white px-6 py-3 font-black text-2xl md:text-4xl shadow-xl rotate-12">
            404
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-6">
          <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.8em] block">Chyba v navigaci</span>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none text-black">
            OOPS... TAHLE STRÁNKA <br /><span className="text-gray-300">NEEXISTUJE</span>
          </h1>
          <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed">
            Vypadá to, že jste se ztratili v expozici. Stránka, kterou hledáte, buď neexistuje, nebo byla přesunuta.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
          <Link 
            to="/" 
            className="w-full md:w-auto bg-black text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#007BFF] transition-all shadow-xl"
          >
            <ArrowLeft size={16} /> Zpět domů
          </Link>
          <Link 
            to="/kontakt" 
            className="w-full md:w-auto border-2 border-gray-100 text-black px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:border-black transition-all"
          >
            Napsat mi zprávu <MessageSquare size={16} />
          </Link>
        </div>
      </motion.div>

      {/* Background Accent */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 bg-[#007BFF]"></div>
    </div>
  );
};

export default NotFound;
