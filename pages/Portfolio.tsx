
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PROJECTS as DEFAULT_PROJECTS, SPECIALIZATIONS } from '../constants';
import { Project, MediaType } from '../types';
import { projectDB } from '../lib/db';
import MasonryGrid from '../components/MasonryGrid';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Video, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  Briefcase, 
  Home, 
  HardHat, 
  Calendar, 
  Trophy, 
  Map as MapIcon, 
  Compass, 
  Key, 
  Heart, 
  Navigation 
} from 'lucide-react';

const Portfolio: React.FC = () => {
  const [searchParams] = useSearchParams();
  const specParam = searchParams.get('spec');
  
  const [activeFilter, setActiveFilter] = useState(specParam || 'all');
  const [activeMediaType, setActiveMediaType] = useState<MediaType | 'all'>('all');
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [headerBg, setHeaderBg] = useState('https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=2000');

  useEffect(() => {
    const load = async () => {
      const dbProjects = await projectDB.getAll();
      if (dbProjects && dbProjects.length > 0) {
        setProjects(dbProjects);
      } else {
        setProjects(DEFAULT_PROJECTS);
      }
    };
    load();
    
    const savedSettings = localStorage.getItem('jakub_minka_web_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.portfolioHeader) setHeaderBg(settings.portfolioHeader);
    }
    
    if (specParam) {
      setActiveFilter(specParam);
    }
  }, [specParam]);

  const allowedSpecs = SPECIALIZATIONS.filter(s => s.id !== 'svatby' && s.id !== 'drony');

  // Mapa ikon pro specializace
  const specIcons: Record<string, React.ReactNode> = {
    'komercni': <Briefcase size={18} />,
    'interiery': <Home size={18} />,
    'stavebnictvi': <HardHat size={18} />,
    'eventy': <Calendar size={18} />,
    'sport': <Trophy size={18} />,
    'obce': <MapIcon size={18} />,
    'destinace': <Compass size={18} />,
    'realitky': <Key size={18} />,
    'svatby': <Heart size={18} />,
    'drony': <Navigation size={18} />
  };

  const filteredProjects = projects.filter(p => {
    const specMatch = activeFilter === 'all' || p.categoryId === activeFilter;
    const mediaMatch = activeMediaType === 'all' || p.type === activeMediaType;
    return specMatch && mediaMatch;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="relative py-32 md:py-40 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <img src={headerBg} className="absolute inset-0 w-full h-full object-cover grayscale opacity-50" alt="Portfolio Header" />
        <div className="relative z-20">
          <span className="text-[#007BFF] font-black text-[10px] uppercase tracking-[0.8em] block mb-6 drop-shadow-lg">Realizované projekty</span>
          <h1 className="text-6xl md:text-[90px] font-black tracking-tighter leading-none mb-10 uppercase text-white drop-shadow-2xl text-center">Portfolio</h1>
        </div>
      </div>

      <div className="w-full">
        {/* Compact Horizontal Specialization Strip */}
        <div className="w-full bg-gray-50 border-y border-gray-100 overflow-x-auto custom-scrollbar no-scrollbar scroll-smooth">
          <div className="flex min-w-max w-full">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-12 py-8 flex flex-col items-center justify-center gap-3 transition-all border-r border-gray-100 min-w-[160px] ${activeFilter === 'all' ? 'bg-[#007BFF] text-white' : 'bg-white hover:bg-gray-50 text-gray-400 hover:text-black'}`}
            >
              <Layers size={18} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-center">Vše</span>
            </button>
            
            {allowedSpecs.map(spec => (
              <button
                key={spec.id}
                onClick={() => setActiveFilter(spec.id)}
                className={`px-12 py-8 flex flex-col items-center justify-center gap-3 transition-all border-r border-gray-100 min-w-[180px] relative group overflow-hidden ${activeFilter === spec.id ? 'bg-[#007BFF] text-white' : 'bg-white text-gray-400'}`}
              >
                {/* Background Image on Hover */}
                <img 
                  src={spec.image} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-0 ${activeFilter !== spec.id ? 'group-hover:opacity-10' : ''}`} 
                  alt="" 
                />
                
                <div className={`transition-transform duration-500 ${activeFilter === spec.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                   {specIcons[spec.id] || <Camera size={18} />}
                </div>
                
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-center transition-colors duration-500 ${activeFilter === spec.id ? 'text-white' : 'group-hover:text-black'}`}>
                  {spec.name.split(' (')[0]}
                </span>
                
                {activeFilter === spec.id && (
                  <motion.div layoutId="activeSpec" className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Media Type Sub-Filter */}
        <div className="flex justify-center gap-8 py-10 bg-white">
          {[
            { id: 'all', label: 'Vše', icon: Layers },
            { id: MediaType.IMAGE, label: 'Foto', icon: Camera },
            { id: MediaType.VIDEO, label: 'Video', icon: Video },
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setActiveMediaType(type.id as any)}
              className={`flex items-center gap-3 px-6 py-2 text-[8px] font-black uppercase tracking-[0.3em] transition-all ${activeMediaType === type.id ? 'text-[#007BFF] border-b-2 border-[#007BFF]' : 'text-gray-300 hover:text-black border-b-2 border-transparent'}`}
            >
              <type.icon size={12} /> {type.label}
            </button>
          ))}
        </div>

        <div className="w-full">
          <MasonryGrid projects={filteredProjects} showSpecialization={true} />
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="py-40 text-center text-gray-300">
            <p className="text-2xl font-black uppercase tracking-widest italic opacity-20">Žádné zakázky neodpovídají filtrům.</p>
          </div>
        )}
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Portfolio;
