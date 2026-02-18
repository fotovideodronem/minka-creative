
import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useLocation, Link } from 'react-router-dom';
import { SPECIALIZATIONS, PROJECTS } from '../constants';
import { CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react';
import MasonryGrid from '../components/MasonryGrid';
import { motion } from 'framer-motion';
import { dataStore, projectDB } from '../lib/db';
import { WebSettings } from '../types';
import SEO from '../components/SEO';

const SpecializationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);
  const [projects, setProjects] = useState(PROJECTS);
  const spec = SPECIALIZATIONS.find(s => s.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (spec) {
      const seoSuffix = id === 'interiery' ? 'fotograf hotelů a interiérů' : 
                        id === 'eventy' ? 'fotograf eventů a akcí' : 
                        id === 'realitky' ? 'video pro reality a development' :
                        'fotograf a kameraman';
      document.title = `${spec.name} | ${seoSuffix} | Jakub Minka`;
    }
    
    const load = async () => {
      const savedProjects = await projectDB.getAll();
      if (savedProjects.length > 0) setProjects(savedProjects);

      const savedSettings: WebSettings = await dataStore.doc('web_settings').get();
      if (savedSettings && spec) {
        if (savedSettings.specializationHeaders && savedSettings.specializationHeaders[spec.id]) {
          setHeaderUrl(savedSettings.specializationHeaders[spec.id]);
        }
      }
    };
    load();
  }, [id, pathname, spec]);

  const scrollToPortfolio = () => {
    const section = document.getElementById('spec-portfolio');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!spec) {
    return <Navigate to="/" />;
  }

  const filteredProjects = projects.filter(p => p.categoryId === spec.id);

  return (
    <div className="w-full">
            <SEO 
              title={spec.seoTitle || `${spec.name} | Jakub Minka`}
              description={spec.seoDescription || spec.description}
              keywords={spec.seoKeywords || spec.name}
              ogImage={headerUrl || spec.image}
            />
      {/* Detail Header */}
      <header className="relative h-[70vh] bg-black text-white flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <motion.img 
          key={headerUrl || spec.image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          src={headerUrl || spec.image} 
          alt={spec.name} 
          className="absolute inset-0 w-full h-full object-cover grayscale" 
        />
        
        <div className="relative z-20 text-center px-6 w-full max-w-5xl flex flex-col items-center justify-center">
          <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.6em] block mb-6">Specializace</span>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter uppercase leading-tight w-full mb-10">
            {spec.name}
          </h1>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={scrollToPortfolio}
            className="flex items-center gap-4 bg-[#007BFF] text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm shadow-2xl hover:bg-white hover:text-black transition-all"
          >
            ZOBRAZIT VÝSLEDKY <ChevronDown size={14} className="animate-bounce" />
          </motion.button>
        </div>
      </header>

      {/* Description & Case Studies */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-8 space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Vizuální řešení pro váš obor</h2>
            <p className="text-xl md:text-2xl text-gray-600 leading-tight font-medium max-w-3xl">{spec.description}</p>
          </div>
          
          <div className="space-y-10">
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-gray-400">Co vše nabízím v této sekci</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {spec.caseStudies.map((caseStudy, idx) => (
                <div 
                  key={idx}
                  className="flex gap-4 items-start py-4 border-b border-gray-100 group hover:border-[#007BFF] transition-colors"
                >
                  <span className="text-[10px] font-black text-[#007BFF] mt-1 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                  <p className="text-gray-800 font-bold group-hover:text-[#007BFF] transition-colors text-sm md:text-base">{caseStudy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-4 h-fit lg:sticky lg:top-32">
          <div className="bg-gray-900 text-white p-12 space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#007BFF] opacity-10 blur-3xl"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-[#007BFF]">Proč si mě vybrat?</h3>
            <div className="space-y-12">
              {spec.values.map((val, idx) => (
                <div key={idx} className="space-y-3">
                  <p className="text-5xl font-black text-[#007BFF]/30 tracking-tighter">{String(idx + 1).padStart(2, '0')}</p>
                  <p className="text-lg md:text-xl font-bold uppercase tracking-widest">{val}</p>
                  <div className="w-12 h-1 bg-[#007BFF]"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="spec-portfolio" className="py-24 md:py-32 border-t border-gray-100 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
          <div>
            <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.5em] block mb-4">Výběr z realizací</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Ukázka mé práce</h2>
          </div>
          <div className="flex gap-4">
            <Link to={`/portfolio?spec=${spec.id}`} className="bg-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#007BFF] transition-all">Zobrazit celé portfolio</Link>
          </div>
        </div>
        
        <MasonryGrid projects={filteredProjects} showSpecialization={false} />
      </section>
    </div>
  );
};

export default SpecializationDetail;
