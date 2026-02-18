
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Files, 
  Camera, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Star,
  Users,
  MessageCircle,
  Globe,
  TrendingUp,
  Eye,
  BarChart3,
  Award,
  Zap,
  ExternalLink,
  BookOpen,
  WifiOff,
  AlertTriangle,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FileManagerV2 from '../components/Admin/FileManagerV2';
import ReviewManager from '../components/Admin/ReviewManager';
import ProjectManagerV2 from '../components/Admin/ProjectManagerV2';
import BlogManagerV2 from '../components/Admin/BlogManagerV2';
import PartnerManager from '../components/Admin/PartnerManager';
import InquiryManager from '../components/Admin/InquiryManager';
import WebSettingsManager from '../components/Admin/WebSettingsManager';
import SystemManager from '../components/Admin/SystemManager';
import { SPECIALIZATIONS } from '../constants';
import { checkFirestoreConnection, getSupabaseLimitStatus } from '../lib/db';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'projects' | 'blog' | 'settings' | 'reviews' | 'partners' | 'inquiries' | 'web-settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [supabaseLimitReached, setSupabaseLimitReached] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('admin_auth');
    if (!isAuth) {
      navigate('/');
    }
    
    const loadData = async () => {
      const savedStats = localStorage.getItem('jakub_minka_stats');
      if (savedStats) setStats(JSON.parse(savedStats));
      
      const connection = await checkFirestoreConnection();
      setIsOnline(connection);
      
      setSupabaseLimitReached(getSupabaseLimitStatus());
    };

    loadData();
    const interval = setInterval(() => setSupabaseLimitReached(getSupabaseLimitStatus()), 2000);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      clearInterval(interval);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Přehled', icon: LayoutDashboard },
    { id: 'files', label: 'Soubory & Média', icon: Files },
    { id: 'projects', label: 'Zakázky', icon: Camera },
    { id: 'blog', label: 'Blog', icon: BookOpen },
    { id: 'inquiries', label: 'Dotazy', icon: MessageCircle },
    { id: 'web-settings', label: 'Obsah webu', icon: Globe },
    { id: 'partners', label: 'Partneři', icon: Users },
    { id: 'reviews', label: 'Recenze', icon: Star },
    { id: 'settings', label: 'Systém', icon: Settings },
  ];

  const today = new Date().toISOString().split('T')[0];
  const visitsToday = stats?.dailyVisits?.[today] || 0;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <aside className={`bg-black text-white transition-all duration-500 fixed h-full z-50 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center gap-4 border-b border-white/5">
            <div className="w-8 h-8 flex items-center justify-center bg-[#007BFF] rounded-sm shrink-0 shadow-lg shadow-[#007BFF]/20">
              <span className="font-black text-white">M</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest leading-none">JAKUB MINKA</span>
                <span className="text-[7px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1.5">ADMIN PANEL</span>
              </div>
            )}
          </div>

          <div className="p-4">
            <Link 
              to="/" 
              className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all bg-white/5 hover:bg-[#007BFF] text-white/60 hover:text-white group border border-white/5 mb-4`}
            >
              <ExternalLink size={20} strokeWidth={2.5} />
              {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">Prohlížet web</span>}
            </Link>
          </div>

          <nav className="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all group ${
                  activeTab === item.id 
                    ? 'bg-[#007BFF] text-white shadow-lg shadow-[#007BFF]/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} strokeWidth={2.5} />
                {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-sm text-red-400 hover:text-red-300 transition-all">
              <LogOut size={20} />
              {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">Odhlásit se</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className={`flex-grow transition-all duration-500 ${isSidebarOpen ? 'pl-72' : 'pl-20'}`}>
        <AnimatePresence>
          {isOnline === false && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500 text-white px-10 py-3 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <WifiOff size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Pozor: Supabase není aktivní. Aplikace běží v <span className="underline">offline režimu</span> (LocalStorage).
                </p>
              </div>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                className="text-[9px] font-black uppercase tracking-widest bg-black/20 px-4 py-1.5 hover:bg-black/40 transition-all flex items-center gap-2"
              >
                Aktivovat v Supabase <ExternalLink size={12} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
               <ChevronRight className={`transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />
             </button>
             <h1 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 ml-4">
               {menuItems.find(i => i.id === activeTab)?.label}
             </h1>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
               <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
               <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                 {isOnline ? 'Cloud Synchronizován' : 'Lokální Režim'}
               </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#007BFF] rounded-full flex items-center justify-center text-white font-black text-xs shadow-md">JM</div>
              <div className="hidden lg:block text-left">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Jakub Minka</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {supabaseLimitReached && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-10 mt-6 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-sm flex items-start gap-4"
          >
            <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={24} />
            <div className="flex-grow">
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-900 mb-2">Supabase Limit Dosažen</h3>
              <p className="text-xs text-yellow-800 leading-relaxed mb-3">
                Dosažli jste free tier limit v Supabase. Všechny úpravy se ukládají pouze lokálně v browseru.
                Po refreshi stránky se změny zobrazí, ale nebudou synchronizované do cloud.
              </p>
              <div className="flex gap-3">
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank"
                  className="text-[9px] font-black uppercase tracking-widest bg-yellow-600 text-white px-4 py-2 hover:bg-yellow-700 transition-all flex items-center gap-2"
                >
                  Upgrade Supabase <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        <div className="p-10">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeTab === 'files' && <FileManagerV2 />}
              {activeTab === 'reviews' && <ReviewManager />}
              {activeTab === 'projects' && <ProjectManagerV2 />}
              {activeTab === 'blog' && <BlogManagerV2 />}
              {activeTab === 'partners' && <PartnerManager />}
              {activeTab === 'inquiries' && <InquiryManager />}
              {activeTab === 'web-settings' && <WebSettingsManager />}
              {activeTab === 'settings' && <SystemManager />}
              
              {activeTab === 'dashboard' && (
                <div className="space-y-10">
                  {isOnline === false && (
                    <div className="bg-white p-8 border-l-4 border-l-amber-500 shadow-sm rounded-sm flex items-start gap-6">
                      <div className="p-4 bg-amber-50 text-amber-500 rounded-sm">
                        <AlertTriangle size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-black uppercase tracking-widest">Backend vyžaduje nastavení</h3>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          Váš Supabase kód v <code className="bg-gray-100 px-1 rounded text-black">src/supabaseClient.ts</code> není správně nakonfigurován.
                          Nyní používáte LocalStorage – data se ukládají pouze ve vašem prohlížeči a nejsou sdílena s ostatními uživateli.
                        </p>
                        <div className="flex gap-4 pt-2">
                           <button onClick={() => setActiveTab('settings')} className="text-[9px] font-black uppercase tracking-widest text-[#007BFF] hover:underline">Jak to opravit?</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-white p-8 border border-gray-100 shadow-sm rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-[#007BFF] rounded-sm"><Eye size={20} /></div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1"><TrendingUp size={10} /> Live</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Zobrazení dnes</p>
                      <p className="text-4xl font-black">{visitsToday}</p>
                    </div>
                    <div className="bg-white p-8 border border-gray-100 shadow-sm rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-500 rounded-sm"><BarChart3 size={20} /></div>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Návštěvy celkem</p>
                      <p className="text-4xl font-black">{stats?.totalVisits || 0}</p>
                    </div>
                    <div className="bg-white p-8 border border-gray-100 shadow-sm rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-sm"><MessageCircle size={20} /></div>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nové dotazy</p>
                      <p className="text-4xl font-black text-[#007BFF]">{(localStorage.getItem('jakub_minka_inquiries') ? JSON.parse(localStorage.getItem('jakub_minka_inquiries')!).filter((i:any) => i.status === 'new').length : 0)}</p>
                    </div>
                    <div className="bg-white p-8 border border-gray-100 shadow-sm rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-50 text-gray-900 rounded-sm"><Camera size={20} /></div>
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Celkem projektů</p>
                      <p className="text-4xl font-black">{(localStorage.getItem('jakub_minka_projects') ? JSON.parse(localStorage.getItem('jakub_minka_projects')!).length : 0)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-7 bg-white p-10 border border-gray-100 shadow-sm rounded-sm space-y-8">
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                         <Award size={18} className="text-[#007BFF]" /> Nejsledovanější specializace
                       </h3>
                       <div className="space-y-4">
                         {SPECIALIZATIONS.filter(s => !s.externalUrl).map(spec => {
                           const count = stats?.categoryVisits?.[spec.id] || 0;
                           const max = Math.max(...Object.values(stats?.categoryVisits || { a: 1 }) as number[]);
                           const percent = max > 0 ? (count / max) * 100 : 0;
                           
                           return (
                             <div key={spec.id} className="space-y-2">
                               <div className="flex justify-between items-end">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{spec.name}</span>
                                 <span className="text-[10px] font-bold text-[#007BFF]">{count}x</span>
                               </div>
                               <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${percent}%` }}
                                   transition={{ duration: 1, ease: "easeOut" }}
                                   className="h-full bg-[#007BFF]"
                                 />
                               </div>
                             </div>
                           );
                         })}
                       </div>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                       <div className="bg-black text-white p-10 rounded-sm space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#007BFF] opacity-20 blur-3xl"></div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-[#007BFF]">Data & Synchro</h3>
                          <p className="text-sm font-medium leading-relaxed opacity-70">
                            {isOnline ? 'Vaše data jsou bezpečně uložena v Supabase.' : 'Aplikace aktuálně ukládá data do LocalStorage vašeho prohlížeče. Pro trvalé uložení v cloudu nakonfigurujte Supabase.'}
                          </p>
                          <button onClick={() => setActiveTab('settings')} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-[#007BFF] transition-colors">
                            {isOnline ? 'Export dat' : 'Nastavení připojení'} <ChevronRight size={14} />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #007BFF; }`}</style>
    </div>
  );
};

export default AdminDashboard;
