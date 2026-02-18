
import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MapPin, Instagram, Facebook, Youtube, Linkedin, 
  Briefcase, Info, ArrowUpRight, Send, CheckCircle2, 
  Shield, RefreshCw, FileText, Globe, Building2, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { WebSettings } from '../types';
import HumanVerificationModal from '../components/HumanVerificationModal';
import { dataStore } from '../lib/db';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  
  const [settings, setSettings] = useState<WebSettings>({
    contactHeader: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&q=80&w=2000',
    blogHeader: '',
    homeHeader: '',
    profilePic: 'https://picsum.photos/id/64/800/800',
    bio: 'Profesionální fotograf a kameraman se smyslem pro detail a unikátní vizuální vyprávění.',
    ico: '',
    dic: '',
    address: 'Praha, Česká republika',
    phone: '',
    email: '',
    backstage: [],
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
    footerDescription: '',
    doc1Name: 'Ochrana soukromí',
    doc1Url: '/ochrana-soukromi',
    doc2Name: 'Podmínky spolupráce',
    doc2Url: '/podminky-spoluprace',
    instagramUrl: '#',
    facebookUrl: '#',
    youtubeUrl: '#',
    linkedinUrl: '#',
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
    document.title = "Kontakt | Jakub Minka";
    const load = async () => {
      const saved = await dataStore.doc('web_settings').get();
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
    };
    load();
  }, []);

  const handleOpenVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerificationOpen(true);
  };

  const handleVerificationSuccess = () => {
    setIsVerificationOpen(false);
    setFormState('loading');
    setTimeout(async () => {
      try {
        const newInquiry = { 
          id: Math.random().toString(36).substr(2, 9), 
          name: formData.name,
          email: formData.email,
          message: `${formData.subject}\n\n${formData.message}`,
          date: new Date().toISOString(), 
          status: 'new' 
        };
        console.log('Sending inquiry:', newInquiry);
        const result = await dataStore.collection('inquiries').save(newInquiry);
        console.log('Save result:', result);
        setFormState('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setFormState('idle'), 5000);
      } catch (error) {
        console.error('Error sending inquiry:', error);
        alert('Chyba: ' + (error instanceof Error ? error.message : 'Neznámá chyba'));
        setFormState('idle');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Header - Blue Background */}
      <section className="relative py-24 md:py-48 px-6 overflow-hidden bg-[#0A192F] text-white">
        <div className="absolute inset-0 bg-[#0A192F]/80 z-10"></div>
        <img src={settings.contactHeader} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30" alt="" />
        <div className="relative z-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
            className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-8 border-[#007BFF]/20 shadow-2xl shrink-0"
          >
            <img src={settings.profilePic} className="w-full h-full object-cover grayscale" alt="Jakub Minka" />
          </motion.div>
          <div className="space-y-6 text-center md:text-left">
            <span className="text-[#007BFF] font-black uppercase tracking-[0.8em] text-xs">Osobní profil</span>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">
              Jakub <span className="font-light text-[#007BFF]">Minka</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-medium leading-tight max-w-2xl">{settings.bio}</p>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-12 gap-24">
        <div className="lg:col-span-5 space-y-20">
          <div className="space-y-10">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#007BFF]">Přímé spojení</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-blue-50 text-[#007BFF] rounded-full flex items-center justify-center group-hover:bg-[#007BFF] group-hover:text-white transition-all shadow-sm"><Phone size={22} /></div>
                <div><p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Telefon</p><p className="text-xl font-black tracking-widest">{settings.phone}</p></div>
              </div>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-blue-50 text-[#007BFF] rounded-full flex items-center justify-center group-hover:bg-[#007BFF] group-hover:text-white transition-all shadow-sm"><Mail size={22} /></div>
                <div><p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Emailová adresa</p><p className="text-xl font-black tracking-widest">{settings.email}</p></div>
              </a>
              <div className="flex items-center gap-6 group">
                <div className="w-14 h-14 bg-blue-50 text-[#007BFF] rounded-full flex items-center justify-center group-hover:bg-[#007BFF] group-hover:text-white transition-all shadow-sm"><MapPin size={22} /></div>
                <div><p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Místo působení</p><p className="text-xl font-black tracking-widest text-black">{settings.address}</p></div>
              </div>
            </div>
          </div>

          <div className="space-y-10 pt-16 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#007BFF] flex items-center gap-3"><Globe size={16} /> Sociální sítě</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Instagram, label: 'Instagram', url: settings.instagramUrl },
                { icon: Facebook, label: 'Facebook', url: settings.facebookUrl },
                { icon: Youtube, label: 'YouTube', url: settings.youtubeUrl },
                { icon: Linkedin, label: 'LinkedIn', url: settings.linkedinUrl }
              ].map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-16 bg-blue-50 text-[#007BFF] rounded-sm hover:bg-[#007BFF] hover:text-white transition-all shadow-sm group"
                  >
                    <Icon size={24} className="group-hover:scale-110 transition-transform" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="space-y-10 pt-16 border-t border-gray-100">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#007BFF] flex items-center gap-3"><Building2 size={16} /> Obchodní údaje</h3>
            <div className="grid grid-cols-2 gap-10">
              <div><span className="text-[8px] font-black uppercase text-gray-400">IČO</span><p className="text-lg font-black">{settings.ico}</p></div>
              <div><span className="text-[8px] font-black uppercase text-gray-400">DIČ</span><p className="text-lg font-black">{settings.dic || 'Není plátce DPH'}</p></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white p-10 lg:p-20 shadow-2xl border border-blue-50 relative overflow-hidden rounded-sm">
            <div className="absolute top-0 right-0 w-3 h-full bg-[#007BFF]"></div>
            <h3 className="text-4xl font-black uppercase tracking-tighter mb-16">Poptávka <span className="text-[#007BFF]">služeb</span></h3>
            
            {formState === 'success' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-8">
                <div className="flex justify-center text-green-500"><CheckCircle2 size={80} className="animate-bounce" /></div>
                <h4 className="text-3xl font-black uppercase tracking-widest">Děkuji za zájem!</h4>
                <p className="text-gray-500 font-medium text-lg">Zprávu jsem obdržel a ozvu se vám co nejdříve.</p>
                <button onClick={() => setFormState('idle')} className="text-[#007BFF] font-black uppercase tracking-[0.4em] text-[10px] pt-12 underline decoration-2 underline-offset-8">Poslat další dotaz</button>
              </motion.div>
            ) : (
              <form className="space-y-12" onSubmit={handleOpenVerification}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Celé jméno</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-blue-50/20 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors text-base font-bold text-black" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">E-mail</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-blue-50/20 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors text-base font-bold text-black" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Předmět poptávky</label>
                  <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-blue-50/20 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors text-base font-bold text-black" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detaily projektu</label>
                  <textarea rows={6} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-blue-50/20 border-b-2 border-gray-100 py-5 px-4 focus:outline-none focus:border-[#007BFF] transition-colors resize-none text-base font-medium text-black"></textarea>
                </div>
                <button disabled={formState === 'loading'} className="w-full py-6 bg-black text-white text-[11px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 transition-all shadow-xl hover:bg-[#007BFF] disabled:bg-gray-100">
                  {formState === 'loading' ? <RefreshCw className="animate-spin" size={20} /> : (<>ODESLAT POPTÁVKU <Send size={20} /></>)}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Jak Pracuji CTA */}
      <section className="py-24 md:py-32 bg-[#007BFF] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
            Chcete vidět naši práci?
          </h2>
          <p className="text-xl md:text-2xl text-white/80 font-medium mb-12 max-w-3xl mx-auto">
            Podívejte se na zákulisí naší produkce. Fotografie, videa a příběhy z našich projektů.
          </p>
          <Link to="/jak-pracuji" className="inline-flex items-center gap-4 bg-white text-[#007BFF] px-16 py-5 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-black hover:text-white transition-all shadow-xl">
            JAK PRACUJI <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>

      <HumanVerificationModal isOpen={isVerificationOpen} onClose={() => setIsVerificationOpen(false)} onSuccess={handleVerificationSuccess} />
    </div>
  );
};

export default Contact;
