
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Instagram, Facebook, Youtube, Linkedin, MessageSquare, Menu, X, 
  ChevronDown, ExternalLink, Shield, LayoutDashboard, Home,
  Briefcase, BookOpen, Mail
} from 'lucide-react';
import Logo from './Logo';
import { SPECIALIZATIONS } from '../constants';
import LoginModal from './Admin/LoginModal';
import { motion, AnimatePresence } from 'framer-motion';
import { WebSettings } from '../types';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSpecOpen, setIsSpecOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [settings, setSettings] = useState<Partial<WebSettings>>({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadSettings = () => {
      setIsUserAdmin(localStorage.getItem('admin_auth') === 'true');
      const saved = localStorage.getItem('jakub_minka_web_settings');
      if (saved) setSettings(JSON.parse(saved));
    };
    loadSettings();
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  const handleSpecClick = (spec: typeof SPECIALIZATIONS[0]) => {
    if (spec.externalUrl) {
      window.open(spec.externalUrl, '_blank');
    } else {
      navigate(`/specializace/${spec.id}`);
    }
    setIsMenuOpen(false);
    setIsSpecOpen(false);
  };

  const scrollToFooter = () => {
    if (location.pathname === '/kontakt') {
      const form = document.getElementById('contact-form-anchor');
      if (form) form.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/kontakt');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
    <Link to={to} className={`flex items-center gap-2 transition-all relative group py-2 ${isActive(to) ? 'text-[#007BFF]' : 'text-gray-400 hover:text-black'}`}>
      <span className={`${isActive(to) ? 'text-[#007BFF]' : 'text-gray-300 group-hover:text-[#007BFF]'} transition-colors`}>{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
      {isActive(to) && <motion.div layoutId="nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#007BFF] rounded-full" />}
    </Link>
  );

  return (
    <>
      <AnimatePresence>
        {isUserAdmin && (
          <motion.div 
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            className="bg-[#007BFF] text-white py-2 px-6 flex items-center justify-between z-[60] relative"
          >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Shield size={10} fill="white" /> Režim správce aktivní
                </span>
              </div>
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-1.5 transition-all rounded-sm"
              >
                <LayoutDashboard size={10} /> Zpět do administrace
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 h-24 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between gap-4">
          <Logo />

          {/* Desktop Menu */}
          <div className="hidden xl:flex items-center gap-6 font-black text-[9px] tracking-[0.15em] uppercase">
            <NavLink to="/" icon={<Home size={14} />} label="Domů" />
            
            <div 
              className="relative h-full flex items-center group cursor-pointer"
              onMouseEnter={() => setIsSpecOpen(true)}
              onMouseLeave={() => setIsSpecOpen(false)}
            >
              <span className={`flex items-center gap-2 transition-all py-2 ${location.pathname.includes('/specializace/') ? 'text-[#007BFF]' : 'text-gray-400 group-hover:text-black'}`}>
                <Briefcase size={14} className={`${location.pathname.includes('/specializace/') ? 'text-[#007BFF]' : 'text-gray-300 group-hover:text-[#007BFF]'}`} /> 
                SPECIALIZACE 
                <ChevronDown size={12} className={`transition-transform duration-500 ${isSpecOpen ? 'rotate-180' : ''}`} />
              </span>
              {isSpecOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white border border-gray-100 shadow-2xl w-64 py-4 flex flex-col animate-in fade-in slide-in-from-top-4 duration-500">
                  {SPECIALIZATIONS.map(spec => (
                    <button
                      key={spec.id}
                      onClick={() => handleSpecClick(spec)}
                      className={`px-6 py-3 text-left hover:bg-gray-50 hover:text-[#007BFF] text-[9px] font-black tracking-[0.1em] transition-all flex items-center justify-between group/item border-l-0 hover:border-l-4 border-[#007BFF] ${location.pathname === `/specializace/${spec.id}` ? 'text-[#007BFF] border-l-4' : ''}`}
                    >
                      {spec.name.toUpperCase()}
                      {spec.externalUrl && <ExternalLink size={10} className="opacity-40 group-hover/item:opacity-100 text-[#007BFF]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NavLink to="/portfolio" icon={<LayoutDashboard size={14} />} label="Portfolio" />
            <NavLink to="/blog" icon={<BookOpen size={14} />} label="Blog" />
            <NavLink to="/kontakt" icon={<Mail size={14} />} label="Kontakt" />
          </div>

          {/* Socials & Actions with Clear Separators */}
          <div className="hidden lg:flex items-center gap-5 text-gray-500">
            {/* Social Separator */}
            <div className="w-px h-8 bg-gray-100 mx-2"></div>
            
            <div className="flex items-center gap-4">
              <a href={settings.linkedinUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-[#0077B5] transition-colors"><Linkedin size={16} /></a>
              <a href={settings.instagramUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-[#E1306C] transition-colors"><Instagram size={16} /></a>
              <a href={settings.facebookUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-[#1877F2] transition-colors"><Facebook size={16} /></a>
              <a href={settings.youtubeUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF0000] transition-colors"><Youtube size={16} /></a>
            </div>
            
            {/* Actions Separator */}
            <div className="w-px h-8 bg-gray-100 mx-2"></div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={scrollToFooter}
                className={`w-11 h-11 flex items-center justify-center rounded-full shadow-lg transition-all transform hover:scale-105 ${location.pathname === '/kontakt' ? 'bg-black text-white' : 'bg-[#007BFF] text-white hover:bg-black'}`}
                title="Poptat projekt"
              >
                <MessageSquare size={18} strokeWidth={2.5} />
              </button>
              
              <button 
                onClick={() => isUserAdmin ? navigate('/admin') : setIsAdminOpen(true)}
                className={`w-11 h-11 flex items-center justify-center rounded-full shadow-md transition-all ${isUserAdmin ? 'bg-gray-100 text-[#007BFF] border border-blue-100' : 'bg-gray-900 text-white hover:bg-black'}`}
                title={isUserAdmin ? "Administrace" : "Přihlášení"}
              >
                <Shield size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="lg:hidden p-2 text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-[96px] bg-white z-40 p-8 flex flex-col gap-6 lg:hidden overflow-y-auto animate-in fade-in slide-in-from-right duration-500">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-black tracking-tight border-b border-gray-50 pb-4 flex items-center gap-4 text-gray-950"><Home size={20} /> DOMŮ</Link>
            <Link to="/portfolio" onClick={() => setIsMenuOpen(false)} className="text-xl font-black tracking-tight border-b border-gray-50 pb-4 flex items-center gap-4 text-gray-950"><LayoutDashboard size={20} /> PORTFOLIO</Link>
            <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-xl font-black tracking-tight border-b border-gray-50 pb-4 flex items-center gap-4 text-gray-950"><BookOpen size={20} /> BLOG</Link>
            <Link to="/kontakt" onClick={() => setIsMenuOpen(false)} className="text-xl font-black tracking-tight border-b border-gray-50 pb-4 flex items-center gap-4 text-gray-950"><Mail size={20} /> KONTAKT</Link>
          </div>
        )}
      </nav>

      <LoginModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </>
  );
};

export default Navbar;
