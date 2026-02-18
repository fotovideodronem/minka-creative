
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WebSettings } from '../types';
import { dataStore } from '../lib/db';

const TermsOfService: React.FC = () => {
  const [settings, setSettings] = useState<Partial<WebSettings>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Podmínky spolupráce | Jakub Minka";
    const load = async () => {
      const saved = await dataStore.doc('web_settings').get();
      if (saved) setSettings(saved);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white pb-32">
      <header className="bg-gray-50 py-24 md:py-32 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Link to="/" className="inline-flex items-center gap-2 text-[#007BFF] text-[10px] font-black uppercase tracking-widest mb-8 hover:gap-4 transition-all">
            <ArrowLeft size={14} /> Zpět na hlavní stranu
          </Link>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#007BFF] mx-auto shadow-sm border border-blue-100">
            <FileText size={32} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black">
            PODMÍNKY <br /><span className="text-[#007BFF]">SPOLUPRÁCE</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px]">Obchodní dokumentace</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20">
        {settings.termsContent ? (
          <div 
            className="prose prose-lg max-w-none text-gray-700 font-medium leading-relaxed
                       prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:text-black
                       prose-strong:text-black prose-strong:font-black"
            dangerouslySetInnerHTML={{ __html: settings.termsContent }}
          />
        ) : (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Dokument se připravuje...
          </div>
        )}
      </main>
    </div>
  );
};

export default TermsOfService;
