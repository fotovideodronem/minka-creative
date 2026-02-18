
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Wallet, Zap, Info, ArrowUpRight, MessageSquare, ExternalLink, Star, Quote } from 'lucide-react';
import { PROJECTS as DEFAULT_PROJECTS, SPECIALIZATIONS } from '../constants';
import { Project, WebSettings, Review } from '../types';
import { Link } from 'react-router-dom';
import MasonryGrid from '../components/MasonryGrid';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { dataStore, projectDB } from '../lib/db';
import SEO from '../components/SEO';

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<{id: string, name: string}[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [shuffledReviews, setShuffledReviews] = useState<Review[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewDirection, setReviewDirection] = useState<1 | -1>(1);
  const [specCovers, setSpecCovers] = useState<Map<string, string>>(new Map());
  const [homePortfolioProjects, setHomePortfolioProjects] = useState<Project[]>([]);
  
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [settings, setSettings] = useState<WebSettings>({
    homeHeader: '', portfolioHeader: '', contactHeader: '', blogHeader: '', specializationHeaders: {},
    homeHeroTitle: 'VIZUÁLNÍ PŘÍBĚHY, KTERÉ PRODÁVAJÍ',
    homeHeroSubtitle: 'FOTOGRAF & KAMERAMAN',
    homeAboutTitle: 'O MNĚ',
    homeAboutText: 'Jsem fotograf a kameraman se zaměřením na komerční tvorbu, architekturu a průmysl. Mým cílem je zachytit podstatu vašeho projektu tak, aby oslovila ty správné lidi.',
    profilePic: '',
    specificationsTitle: 'SPECIALIZACE', specificationsSubtitle: 'CO PRO VÁS MOHU UDĚLAT',
    contactTitle: 'KONTAKT', contactSubtitle: 'POJĎME TVOŘIT',
    pricingTitle: 'Investice do vizuálu',
    pricingSubtitle: 'Cena není fixní',
    price1Title: 'Menší produkce',
    price1Value: 'od 5.000 Kč',
    price1Desc: 'Rychlé focení na sítě, menší interiéry, portréty...',
    price2Title: 'Větší kampaň',
    price2Value: 'od 15.000 Kč',
    price2Desc: 'Celodenní produkce, reklamní video, dron...',
    bio: '', ico: '', dic: '', address: '', phone: '', email: '', footerDescription: '', doc1Name: '', doc1Url: '', doc2Name: '', doc2Url: '', backstage: [], instagramUrl: '', facebookUrl: '', youtubeUrl: '', linkedinUrl: '', pricingCta: 'Poptat projekt →'
  });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cursorX = useSpring(mouseX, { damping: 30, stiffness: 250 });
  const cursorY = useSpring(mouseY, { damping: 30, stiffness: 250 });

  const mapReviewFromDb = (item: any): Review => {
    return {
      id: item.id,
      author: item.author || 'Anonymní klient',
      text: item.text || item.content || '',
      rating: typeof item.rating === 'number' ? item.rating : 5,
      platform: item.platform || item.company || 'manual',
      date: item.date || '',
      companyUrl: item.company_url || item.companyUrl || ''
    } as Review;
  };

  useEffect(() => {
    const load = async () => {
      const savedProjects = await projectDB.getAll();
      if (savedProjects.length > 0) {
        setProjects(savedProjects);
        
        // Generate random portfolio selection (once on load)
        setHomePortfolioProjects([...savedProjects].sort(() => Math.random() - 0.5).slice(0, 12));
        
        // Generate random covers for specializations (once on load)
        const coversMap = new Map<string, string>();
        SPECIALIZATIONS.forEach(spec => {
          const specProjects = savedProjects.filter(p => p.categoryId === spec.id);
          if (specProjects.length === 0) return;
          
          const project = specProjects[Math.floor(Math.random() * specProjects.length)];
          const galleryImages = (project.gallery || []).filter(item => item.type === 'image');
          if (galleryImages.length > 0) {
            const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
            coversMap.set(spec.id, randomImage.url);
            return;
          }
          if (project.youtubeCoverUrl) {
            coversMap.set(spec.id, project.youtubeCoverUrl);
            return;
          }
          if (project.thumbnailUrl) {
            coversMap.set(spec.id, project.thumbnailUrl);
          }
        });
        setSpecCovers(coversMap);
      } else {
        setProjects(DEFAULT_PROJECTS);
        setHomePortfolioProjects([...DEFAULT_PROJECTS].sort(() => Math.random() - 0.5).slice(0, 12));
      }
      
      const savedSettings = await dataStore.doc('web_settings').get();
      if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));

      const savedPartners = await dataStore.collection('partners').getAll();
      if (savedPartners) setPartners(savedPartners);

      // Load reviews with force refresh to ensure we get latest from DB
      const savedReviews = await dataStore.collection('reviews').getAll({ force: true });
      if (savedReviews && savedReviews.length > 0) {
        // Map from DB format (content/company) to UI format (text/platform)
        console.log('📖 Loaded reviews:', savedReviews.length);
        const mappedReviews = savedReviews.map(mapReviewFromDb);
        setReviews(mappedReviews);
        // Shuffle reviews once on load
        setShuffledReviews([...mappedReviews].sort(() => Math.random() - 0.5));
      } else {
        // Žádné recenze
        console.log('⚠️ No reviews found');
        setReviews([]);
        setShuffledReviews([]);
      }
      
      setIsDataLoaded(true);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  // Reset review index pokud je mimo rozsah
  useEffect(() => {
    if (currentReviewIndex >= shuffledReviews.length && shuffledReviews.length > 0) {
      setCurrentReviewIndex(0);
    }
  }, [shuffledReviews.length]);

  const heroProjects = useMemo(() => projects.slice(0, 5), [projects]);

  const getYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const pickProjectHeroMedia = (project: Project): { type: 'image' | 'video' | 'youtube'; url: string } => {
    const galleryVideo = (project.gallery || []).find(item => item.type === 'video');
    if (galleryVideo) {
      if (galleryVideo.source === 'youtube') {
        if (project.youtubeCoverUrl) {
          return { type: 'image', url: project.youtubeCoverUrl };
        }
        return { type: 'youtube', url: galleryVideo.url };
      }
      return { type: 'video', url: galleryVideo.url };
    }

    const galleryImages = (project.gallery || []).filter(item => item.type === 'image');
    if (galleryImages.length > 0) {
      const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
      return { type: 'image', url: randomImage.url };
    }
    return { type: 'image', url: project.thumbnailUrl };
  };

  const heroMedia = useMemo(() => {
    const map = new Map<string, { type: 'image' | 'video' | 'youtube'; url: string }>();
    heroProjects.forEach(project => {
      map.set(project.id, pickProjectHeroMedia(project));
    });
    return map;
  }, [heroProjects]);

  const maxReviewIndex = Math.max(shuffledReviews.length - 4, 0);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
    const width = window.innerWidth;
    if (e.clientX < width * 0.15) setHoverSide('left');
    else if (e.clientX > width * 0.85) setHoverSide('right');
    else setHoverSide(null);
  };

  const handleNext = () => setCurrentSlide((prev) => (prev + 1) % heroProjects.length);
  const handlePrev = () => setCurrentSlide((prev) => (prev - 1 + heroProjects.length) % heroProjects.length);

  useEffect(() => {
    if (heroProjects.length === 0) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [heroProjects.length]);

  const activeProject = heroProjects[currentSlide];

  const partnerList = partners.length > 0 ? partners : [
    {id: '1', name: 'Skoda Auto'}, {id: '2', name: 'Red Bull'}, {id: '3', name: 'STRABAG'}, 
    {id: '4', name: 'Metrostav'}, {id: '5', name: 'Volvo'}, {id: '6', name: 'Siemens'}
  ];

  return (
    <div className="w-full overflow-hidden bg-white">
      <SEO 
        title={settings.siteTitle || 'Jakub Minka - Profesionální Fotograf & Kameraman'}
        description={settings.siteDescription || 'Profesionální fotografie a video produkce pro firmy. Komerční tvorba, architektura, průmysl.'}
        keywords={settings.siteKeywords || 'fotograf praha, komerční fotografie, firemní video'}
        ogImage={settings.homeHeader || settings.portfolioHeader}
      />
      {/* 1. HERO SECTION */}
      <section 
        className={`relative h-[90vh] w-full overflow-hidden bg-[#0A192F] text-white ${hoverSide ? 'cursor-none' : 'cursor-default'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverSide(null)}
      >
        <AnimatePresence>
          {hoverSide && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ left: cursorX, top: cursorY }} className="fixed z-50 pointer-events-none flex flex-col items-center gap-3 -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                {hoverSide === 'left' ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="absolute inset-y-0 left-0 w-[15%] z-30 cursor-none" onClick={handlePrev}></div>
        <div className="absolute inset-y-0 right-0 w-[15%] z-30 cursor-none" onClick={handleNext}></div>

        <div className="absolute inset-0 z-0 h-full w-full">
          {heroProjects.length > 0 ? heroProjects.map((project, idx) => {
            const media = heroMedia.get(project.id);
            return (
              <div key={`bg-${project.id}`} className={`absolute inset-0 h-full w-full transition-opacity duration-[1500ms] ease-in-out ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 z-10"></div>
                {media?.type === 'video' ? (
                  <video
                    src={media.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : media?.type === 'youtube' ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <iframe
                      src={`${getYouTubeEmbedUrl(media.url)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(media.url)}&controls=0&showinfo=0&modestbranding=1&playsinline=1&fs=0&rel=0&iv_load_policy=3&disablekb=1`}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                        width: '177.77777778vh',
                        height: '56.25vw',
                        minHeight: '100%',
                        minWidth: '100%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none'
                      }}
                      allow="autoplay; encrypted-media"
                    />
                    <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}></div>
                  </div>
                ) : (
                  <img src={media?.url || project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            );
          }) : (
            <div className="absolute inset-0 h-full w-full">
              <div className="absolute inset-0 bg-black/50 z-10"></div>
              <img src={settings.homeHeader || 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=2000'} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div key={currentSlide} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="flex flex-col items-center">
              <span className="bg-[#007BFF] text-white font-black text-[9px] uppercase tracking-[0.5em] px-6 py-2.5 mb-8 shadow-xl">
                {activeProject?.category || settings.homeHeroSubtitle}
              </span>
              <h1 className="text-4xl md:text-8xl lg:text-[140px] font-black mb-14 tracking-tighter leading-[0.8] uppercase drop-shadow-2xl max-w-7xl">
                {activeProject?.title || settings.homeHeroTitle}
              </h1>
              <Link to={activeProject ? `/projekt/${activeProject.id}` : '/portfolio'} className="pointer-events-auto border-2 border-[#007BFF] px-14 py-5 text-[11px] font-black uppercase tracking-[0.6em] hover:bg-white hover:text-black transition-all bg-[#007BFF]/20 backdrop-blur-md">
                {activeProject ? 'DETAIL' : 'VSTOUPIT'}
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex gap-4">
          {heroProjects.map((_, i) => (
            <button 
              key={i} 
              onClick={() => {setCurrentSlide(i); return true;}} // Neresetuje timer, jen mění slide
              className={`h-2 transition-all duration-500 rounded-full ${currentSlide === i ? 'w-16 bg-[#007BFF]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* 2. O MNĚ */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative group">
            <div className="absolute -top-6 -left-6 w-32 h-32 border-l-4 border-t-4 border-[#007BFF] -z-10 group-hover:scale-110 transition-transform"></div>
            <img src={settings.profilePic} className="w-full aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl" alt="Jakub Minka" />
            <div className="absolute -bottom-8 -right-8 bg-white border border-gray-100 shadow-2xl p-10 hidden md:block">
              <p className="text-4xl font-black tracking-tighter uppercase leading-none text-black">PROFI</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#007BFF] mt-2">PŘÍSTUP K TVORBĚ</p>
            </div>
          </div>
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.6em] block">Představení</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase text-black">{settings.homeAboutTitle}</h2>
            </div>
            <div 
              className="prose prose-xl text-gray-600 font-medium leading-relaxed
                         prose-headings:font-black prose-headings:text-black prose-headings:uppercase prose-headings:tracking-tighter
                         prose-strong:text-black prose-strong:font-black
                         prose-ul:list-disc prose-li:mb-2"
              dangerouslySetInnerHTML={{ __html: settings.homeAboutText }}
            />
            <div className="pt-6">
              <Link to="/kontakt" className="inline-flex items-center gap-4 text-[#007BFF] text-[12px] font-black uppercase tracking-[0.4em] group border-b-4 border-[#007BFF] pb-2 hover:text-black hover:border-black transition-all">
                MÁM ZÁJEM O SPOLUPRÁCI <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MARQUEE */}
      <section className="py-24 bg-[#0A192F] border-y border-white/5 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-12 relative z-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#007BFF] italic">Spolupracoval jsem s</h3>
        </div>
        <div className="flex whitespace-nowrap overflow-hidden">
           <div className="flex items-center gap-24 animate-[marquee_30s_linear_infinite]">
              {[...partnerList, ...partnerList, ...partnerList].map((p, idx) => (
                <span key={`${p.id}-${idx}`} className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white/10 hover:text-white transition-colors duration-500 cursor-default">
                  {p.name}
                </span>
              ))}
           </div>
        </div>
      </section>

      {/* 4. SPECIALIZACE */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
             <div className="space-y-4">
               <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block">Služby na míru</span>
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-black uppercase">{settings.specificationsTitle}</h2>
             </div>
          </div>
        </div>
        <div className="max-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 bg-black">
           {SPECIALIZATIONS.map(spec => (
             <Link key={spec.id} to={spec.externalUrl ? '#' : `/specializace/${spec.id}`} onClick={e => spec.externalUrl && window.open(spec.externalUrl, '_blank')} className="group relative aspect-square overflow-hidden border border-white/5">
                <img src={settings.specializationHeaders?.[spec.id] || specCovers.get(spec.id) || spec.image} className="w-full h-full object-cover opacity-40 grayscale group-hover:scale-110 group-hover:opacity-60 group-hover:grayscale-0 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end z-20">
                   <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter group-hover:text-[#007BFF] transition-colors leading-tight">{spec.name}</h4>
                   <div className="h-0.5 w-0 bg-[#007BFF] group-hover:w-full transition-all duration-500 mt-4"></div>
                   <p className="text-[8px] font-black text-[#007BFF] uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                     ZOBRAZIT VÍCE
                   </p>
                </div>
                <div className="absolute top-8 right-8 text-white/20 group-hover:text-[#007BFF] transition-colors z-20">
                  {spec.externalUrl ? <ExternalLink size={24} /> : <ArrowUpRight size={24} />}
                </div>
             </Link>
           ))}
        </div>
      </section>

      {/* 5. PORTFOLIO */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 mb-20 text-center">
          <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block mb-6">Nejnovější projekty</span>
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-black uppercase">Portfolio</h2>
        </div>
        <MasonryGrid projects={homePortfolioProjects} showSpecialization={true} />
        <div className="mt-24 flex justify-center">
          <Link to="/portfolio" className="bg-[#007BFF] text-white px-20 py-5 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-black transition-all shadow-2xl">ZOBRAZIT VŠE</Link>
        </div>
      </section>

      {/* 6. CENÍK */}
      <section className="py-32 bg-blue-50/30 relative overflow-hidden border-y border-blue-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-24">
          <div className="lg:w-1/2 space-y-10">
            <div className="space-y-4">
              <span className="text-[#007BFF] font-black text-[11px] uppercase tracking-[0.8em] block">{settings.pricingSubtitle}</span>
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase text-black">{settings.pricingTitle}</h2>
            </div>
            <p className="text-gray-500 text-lg leading-relaxed max-w-xl font-medium">Investice do špičkového vizuálu je investicí do vnímání vaší značky. Každý projekt je unikátní a vyžaduje individuální nacenění.</p>
          </div>
          <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div className="bg-white border-2 border-gray-100 p-12 space-y-8 hover:border-[#007BFF] transition-all group shadow-sm">
              <Wallet className="text-[#007BFF]" size={40} />
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">{settings.price1Title}</h3>
                <p className="text-3xl font-black tracking-tighter text-black">{settings.price1Value}</p>
              </div>
              <div 
                className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed
                           prose-ul:list-disc prose-ul:ml-4 prose-li:mb-1"
                dangerouslySetInnerHTML={{ __html: settings.price1Desc }}
              />
            </div>
            <div className="bg-[#007BFF] p-12 space-y-8 hover:bg-black transition-all group shadow-2xl text-white">
              <Zap className="text-white" size={40} />
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/60">{settings.price2Title}</h3>
                <p className="text-3xl font-black tracking-tighter text-white">{settings.price2Value}</p>
              </div>
              <div 
                className="text-xs text-white/70 font-bold uppercase tracking-widest leading-relaxed group-hover:text-white
                           prose-ul:list-disc prose-ul:ml-4 prose-li:mb-1"
                dangerouslySetInnerHTML={{ __html: settings.price2Desc }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. RECENZE */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 text-center">
            <span className="text-[#007BFF] font-black text-xs uppercase tracking-[0.7em] block mb-4">Reference</span>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black">Zpětná vazba</h2>
          </div>
          
          {shuffledReviews.length > 0 ? (
            shuffledReviews.length <= 4 ? (
              // Grid layout for 4 or fewer reviews
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {shuffledReviews.map((review, idx) => (
                  <div
                    key={review.id || idx}
                    className="bg-gray-50 p-8 border border-gray-100 relative group hover:border-[#007BFF] transition-all duration-500 shadow-sm flex flex-col justify-between"
                  >
                    <Quote className="absolute top-4 right-4 text-[#007BFF]/5 group-hover:text-[#007BFF]/10 transition-colors" size={32} />
                    <div>
                      <div className="flex gap-1 mb-6">
                        {[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" className="text-[#007BFF]" />)}
                      </div>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed mb-6 group-hover:text-black transition-colors line-clamp-6">
                        "{review.text}"
                      </p>
                    </div>
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="font-black uppercase tracking-widest text-[10px] text-black">{review.author}</h4>
                      <span className="text-[8px] font-bold text-[#007BFF] uppercase tracking-widest mt-1 block">
                        {review.platform === 'google' ? 'GOOGLE MAPS' : review.platform === 'firmy' ? 'FIRMY.CZ' : 'OVĚŘENO'}
                      </span>
                      {review.companyUrl && (
                        <a
                          href={review.companyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-[#007BFF] hover:text-black"
                        >
                          <ExternalLink size={10} /> Web firmy
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Carousel for more than 4 reviews - show 4 at a time
              <div className="space-y-8">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentReviewIndex}
                      initial={{ opacity: 0, x: reviewDirection * 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -reviewDirection * 40 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                      {shuffledReviews.slice(currentReviewIndex, currentReviewIndex + 4).map((review, idx) => (
                        <motion.div
                          key={review.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.08 }}
                          className="bg-gray-50 p-8 border border-gray-100 relative group hover:border-[#007BFF] transition-all duration-500 shadow-sm flex flex-col justify-between"
                        >
                        <Quote className="absolute top-4 right-4 text-[#007BFF]/5 group-hover:text-[#007BFF]/10 transition-colors" size={32} />
                        <div>
                          <div className="flex gap-1 mb-6">
                            {[...Array(review.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" className="text-[#007BFF]" />)}
                          </div>
                          <p className="text-gray-600 text-sm font-medium leading-relaxed mb-6 group-hover:text-black transition-colors line-clamp-6">
                            "{review.text}"
                          </p>
                        </div>
                        <div className="pt-6 border-t border-gray-200">
                          <h4 className="font-black uppercase tracking-widest text-[10px] text-black">{review.author}</h4>
                          <span className="text-[8px] font-bold text-[#007BFF] uppercase tracking-widest mt-1 block">
                            {review.platform === 'google' ? 'GOOGLE MAPS' : review.platform === 'firmy' ? 'FIRMY.CZ' : 'OVĚŘENO'}
                          </span>
                          {review.companyUrl && (
                            <a
                              href={review.companyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-[#007BFF] hover:text-black"
                            >
                              <ExternalLink size={10} /> Web firmy
                            </a>
                          )}
                        </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {shuffledReviews.length > 4 && (
                    <>
                      <button
                        onClick={() => {
                          setReviewDirection(-1);
                          setCurrentReviewIndex((prev) => Math.max(0, prev - 1));
                        }}
                        disabled={currentReviewIndex === 0}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 md:-translate-x-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#007BFF] text-white hover:bg-black transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setReviewDirection(1);
                          setCurrentReviewIndex((prev) => Math.min(maxReviewIndex, prev + 1));
                        }}
                        disabled={currentReviewIndex >= maxReviewIndex}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 md:translate-x-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#007BFF] text-white hover:bg-black transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                {/* Breadcrumbs - dots for each possible position */}
                {shuffledReviews.length > 4 && (
                  <div className="flex justify-center gap-3">
                    {[...Array(maxReviewIndex + 1)].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setReviewDirection(idx > currentReviewIndex ? 1 : -1);
                          setCurrentReviewIndex(idx);
                        }}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          currentReviewIndex === idx
                            ? 'bg-[#007BFF] scale-125 shadow-lg'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Pozice ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">Zatím nejsou k dispozici žádné recenze</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
};

export default Home;
