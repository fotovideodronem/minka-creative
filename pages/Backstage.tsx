
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Layers, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { WebSettings, Project } from '../types';
import { dataStore, projectDB } from '../lib/db';
import { PROJECTS } from '../constants';

const Backstage: React.FC = () => {
  const [backstage, setBackstage] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<WebSettings>({
    backstage: [],
    homeHeader: '',
    profilePic: '',
    bio: '',
    ico: '',
    dic: '',
    address: '',
    phone: '',
    email: '',
    footerDescription: '',
    doc1Name: '',
    doc1Url: '',
    doc2Name: '',
    doc2Url: '',
    instagramUrl: '#',
    facebookUrl: '#',
    youtubeUrl: '#',
    linkedinUrl: '#',
    contactHeader: '',
    blogHeader: '',
    portfolioHeader: '',
    specializationHeaders: {},
    homeAboutTitle: '',
    homeAboutText: '',
    homeHeroTitle: '',
    homeHeroSubtitle: '',
    specificationsTitle: '',
    specificationsSubtitle: '',
    contactTitle: '',
    contactSubtitle: '',
    pricingTitle: '',
    pricingSubtitle: '',
    price1Title: '',
    price1Value: '',
    price1Desc: '',
    price2Title: '',
    price2Value: '',
    price2Desc: '',
    pricingCta: ''
  });

  useEffect(() => {
    document.title = "Jak Pracuji | Jakub Minka";
    const load = async () => {
      const saved = await dataStore.doc('web_settings').get();
      if (saved) {
        setSettings(prev => ({ ...prev, ...saved }));
        setBackstage(saved.backstage || []);
      }

      const dbProjects = await projectDB.getAll();
      if (dbProjects && dbProjects.length > 0) setProjects(dbProjects);
      else setProjects(PROJECTS);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <section className="relative py-32 md:py-48 px-6 overflow-hidden bg-[#0A192F] text-white">
        <div className="absolute inset-0 bg-[#0A192F]/80 z-10"></div>
        <div className="relative z-20 max-w-7xl mx-auto text-center">
          <span className="text-[#007BFF] font-black uppercase tracking-[0.8em] text-xs mb-6 block">Jak to celé funguje</span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
            Jak <span className="font-light text-[#007BFF]">Pracuji</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 font-medium max-w-3xl mx-auto">
            Podívejte se na zákulisí mé práce. Od přípravy přes produkci až po finální úpravu.
          </p>
        </div>
      </section>

      {/* Backstage Gallery */}
      {backstage.length > 0 ? (
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-20 text-center">
              <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block mb-4">Zákulisí</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black">Galerie produkce</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[300px]">
              {backstage.map((url, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="relative group overflow-hidden bg-black rounded-sm h-full"
                >
                  <img
                    src={url}
                    alt={`Backstage ${idx + 1}`}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Fotografia {idx + 1}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-32 bg-white text-center">
          <div className="max-w-2xl mx-auto px-6">
            <ImageIcon className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-400 mb-4">
              Žádné fotografie zatím
            </h2>
            <p className="text-gray-500 font-medium text-lg">
              V adminu si můžete přidat fotos a videa ze své produkce.
            </p>
          </div>
        </section>
      )}

      {/* Featured Projects */}
      <section className="py-32 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block mb-4">Realizované projekty</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black">Poslední práce</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.slice(0, 4).map((project) => (
              <Link key={project.id} to={`/projekt/${project.id}`} className="group relative aspect-square overflow-hidden bg-black rounded-sm">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <h4 className="text-white font-black uppercase tracking-tighter text-lg mb-2">{project.title}</h4>
                  <p className="text-[#007BFF] text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                    DETAIL <ArrowUpRight size={10} />
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Link to="/portfolio" className="inline-flex items-center gap-4 text-[#007BFF] text-[11px] font-black uppercase tracking-[0.4em] group border-b-4 border-[#007BFF] pb-2 hover:text-black hover:border-black transition-all">
              ZOBRAZIT VŠECHNY PROJEKTY <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Backstage;
