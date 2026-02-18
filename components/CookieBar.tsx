
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, ChevronRight, Settings, Check, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [view, setView] = useState<'basic' | 'settings'>('basic');
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Basic initialization
    const consent = localStorage.getItem('minka_cookie_consent_v2');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setPrefs(JSON.parse(consent));
    }
  }, []);

  // Listen for the custom event to force-reopen the bar
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setView('settings');
      // Ensure scrolling is possible if needed, but the bar is fixed
    };
    
    window.addEventListener('reopen-cookie-settings', handleReopen);
    return () => window.removeEventListener('reopen-cookie-settings', handleReopen);
  }, []);

  const handleSave = (finalPrefs: CookiePreferences) => {
    localStorage.setItem('minka_cookie_consent_v2', JSON.stringify(finalPrefs));
    setIsVisible(false);
    if (finalPrefs.analytics) window.dispatchEvent(new Event('cookies-analytics-enabled'));
  };

  const acceptAll = () => {
    const allIn = { necessary: true, analytics: true, marketing: true };
    setPrefs(allIn);
    handleSave(allIn);
  };

  const rejectAll = () => {
    const min = { necessary: true, analytics: false, marketing: false };
    setPrefs(min);
    handleSave(min);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[300] p-6 flex justify-center pointer-events-none"
        >
          <div className="bg-black/95 backdrop-blur-2xl text-white shadow-2xl border border-white/10 pointer-events-auto max-w-5xl w-full overflow-hidden rounded-sm">
            <div className="flex flex-col">
              <div className="h-1 w-full bg-[#007BFF]"></div>
              
              <div className="p-8 md:p-10">
                <AnimatePresence mode="wait">
                  {view === 'basic' ? (
                    <motion.div 
                      key="basic"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex flex-col lg:flex-row items-center gap-10"
                    >
                      <div className="flex items-start gap-6 flex-grow">
                        <div className="w-14 h-14 rounded-full bg-[#007BFF]/10 flex items-center justify-center text-[#007BFF] shrink-0 border border-[#007BFF]/20">
                          <Shield size={28} />
                        </div>
                        <div className="space-y-4 text-center lg:text-left">
                          <h3 className="text-sm font-black uppercase tracking-[0.3em]">Ochrana soukromí a Cookies</h3>
                          <p className="text-[11px] font-medium leading-relaxed text-gray-400 max-w-2xl">
                            Tento web používá soubory cookies k zajištění funkčnosti a analýze návštěvnosti. 
                            Prostřednictvím poptávkového formuláře také zpracováváme Vaše jméno a e-mail výhradně za účelem vyřízení dotazu. 
                            Kliknutím na „Přijmout vše“ souhlasíte s kompletním nastavením, nebo si jej <button onClick={() => setView('settings')} className="text-[#007BFF] underline underline-offset-4 font-black">přizpůsobte</button>.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
                        <button 
                          onClick={rejectAll}
                          className="w-full sm:w-auto px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 hover:border-white transition-all text-white"
                        >
                          Odmítnout vše
                        </button>
                        <button 
                          onClick={acceptAll}
                          className="w-full sm:w-auto bg-[#007BFF] hover:bg-white hover:text-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#007BFF]/20"
                        >
                          Přijmout vše
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="settings"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-10"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-6">
                        <div className="flex items-center gap-4">
                          <Settings size={20} className="text-[#007BFF]" />
                          <h3 className="text-sm font-black uppercase tracking-[0.3em]">Nastavení cookies a dat</h3>
                        </div>
                        <button onClick={() => setIsVisible(false)} className="text-gray-500 hover:text-white transition-colors">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white/5 border border-white/5 rounded-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest">Nezbytné & Dotazy</span>
                            <div className="text-green-500 flex items-center gap-2 text-[9px] font-black uppercase">
                              <Check size={14} /> Aktivní
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                            Zahrnuje chod webu a uložení dat z formuláře pro naši komunikaci.
                          </p>
                        </div>

                        <button 
                          onClick={() => setPrefs({...prefs, analytics: !prefs.analytics})}
                          className={`p-6 border rounded-sm space-y-4 text-left transition-all ${prefs.analytics ? 'bg-[#007BFF]/10 border-[#007BFF]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest">Analytické</span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${prefs.analytics ? 'bg-[#007BFF]' : 'bg-gray-700'}`}>
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.analytics ? 'left-6' : 'left-1'}`}></div>
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                            Sledujeme anonymní statistiky návštěvnosti (Google Analytics).
                          </p>
                        </button>

                        <button 
                          onClick={() => setPrefs({...prefs, marketing: !prefs.marketing})}
                          className={`p-6 border rounded-sm space-y-4 text-left transition-all ${prefs.marketing ? 'bg-[#007BFF]/10 border-[#007BFF]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest">Marketing</span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${prefs.marketing ? 'bg-[#007BFF]' : 'bg-gray-700'}`}>
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${prefs.marketing ? 'left-6' : 'left-1'}`}></div>
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">
                            Umožňuje přehrávání YouTube videí přímo na našem webu.
                          </p>
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
                        <Link to="/ochrana-soukromi" className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                          <Info size={14} /> Kompletní zásady ochrany soukromí
                        </Link>
                        <div className="flex gap-4 w-full sm:w-auto">
                           <button onClick={() => setView('basic')} className="flex-1 sm:flex-none px-8 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white">Zpět</button>
                           <button onClick={() => handleSave(prefs)} className="flex-1 sm:flex-none bg-white text-black px-12 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-[#007BFF] hover:text-white transition-all">Uložit nastavení</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBar;
