
import React, { useState, useEffect } from 'react';
import { Mail, Phone, Send, ExternalLink, CheckCircle2, ShieldCheck, RefreshCw, Shield, Instagram, Facebook, Youtube, Linkedin, Settings } from 'lucide-react';
import Logo from './Logo';
import { Link } from 'react-router-dom';
import HumanVerificationModal from './HumanVerificationModal';
import { WebSettings } from '../types';
import { dataStore } from '../lib/db';

const Footer: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [settings, setSettings] = useState<Partial<WebSettings>>({
    phone: '+420 777 888 999',
    email: 'info@minkastudio.cz',
    footerDescription: 'Profesionální vizuální storytelling pro firmy, architekturu a průmysl.',
    doc1Name: 'Ochrana soukromí',
    doc1Url: '/ochrana-soukromi',
    doc2Name: 'Podmínky spolupráce',
    doc2Url: '/podminky-spoluprace',
    instagramUrl: '#',
    facebookUrl: '#',
    youtubeUrl: '#',
    linkedinUrl: '#'
  });

  useEffect(() => {
    const load = async () => {
      const saved = await dataStore.doc('web_settings').get();
      if (saved) setSettings(saved);
    };
    load();
  }, []);

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleOpenVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerificationOpen(true);
  };

  const handleVerificationSuccess = () => {
    setIsVerificationOpen(false);
    setFormState('loading');
    setTimeout(async () => {
      const newInquiry = { 
        id: Math.random().toString(36).substr(2, 9), 
        ...formData, 
        date: new Date().toISOString(), 
        status: 'new' 
      };
      await dataStore.collection('inquiries').save(newInquiry);
      setFormState('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setFormState('idle'), 5000);
    }, 1000);
  };

  const triggerCookieSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new Event('reopen-cookie-settings'));
  };

  const ProjectLink: React.FC<{ url: string, name: string, subtitle: string, color?: string }> = ({ url, name, subtitle, color = "#007BFF" }) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
      <div className="w-8 h-8 bg-black flex items-center justify-center transition-transform duration-500 group-hover:scale-105 shrink-0">
        <span className="font-syne text-white text-base font-bold tracking-tighter">M</span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="font-syne text-[11px] font-light uppercase tracking-tight text-gray-950 leading-none group-hover:text-black transition-colors">
            Minka
          </span>
          <span className="font-syne text-[7px] font-extralight uppercase tracking-[0.2em] leading-none transition-colors" style={{ color }}>
            {name}
          </span>
        </div>
        <span className="text-[6px] text-gray-400 font-black uppercase tracking-[0.2em] leading-none mt-1">
          {subtitle}
        </span>
      </div>
    </a>
  );

  return (
    <footer id="contact-footer" className="bg-gray-50 pt-32 pb-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-5 space-y-16">
          <div>
            <Logo />
            <p className="mt-8 text-gray-500 max-w-sm leading-relaxed text-sm font-medium">{settings.footerDescription}</p>
            <div className="flex gap-4 mt-8">
               <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center rounded-full hover:bg-[#E1306C] hover:text-white transition-all"><Instagram size={18} /></a>
               <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center rounded-full hover:bg-[#1877F2] hover:text-white transition-all"><Facebook size={18} /></a>
               <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center rounded-full hover:bg-[#FF0000] hover:text-white transition-all"><Youtube size={18} /></a>
               <a href={settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center rounded-full hover:bg-[#0077B5] hover:text-white transition-all"><Linkedin size={18} /></a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-950">Navigace</h4>
              <nav className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                <Link to="/" className="hover:text-[#007BFF] transition-colors">Hlavní strana</Link>
                <Link to="/portfolio" className="hover:text-[#007BFF] transition-colors">Portfolio</Link>
                <Link to="/blog" className="hover:text-[#007BFF] transition-colors">Blog</Link>
                <Link to="/kontakt" className="hover:text-[#007BFF] transition-colors">Kontakt</Link>
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-950">Moje další projekty</h4>
              <nav className="flex flex-col gap-6">
                <ProjectLink 
                  url="https://www.jakubminka.cz" 
                  name="Weddings" 
                  subtitle="svatební kameraman" 
                  color="#E1306C"
                />
                <ProjectLink 
                  url="https://www.fotovideodronem.cz" 
                  name="Aerials" 
                  subtitle="fotografie a video dronem" 
                  color="#007BFF"
                />
              </nav>
            </div>
          </div>
          <div className="space-y-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 bg-white flex items-center justify-center text-[#007BFF] rounded-full shadow-sm group-hover:bg-[#007BFF] group-hover:text-white transition-all"><Phone size={18} /></div>
              <div><p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Telefon</p><p className="text-sm font-black tracking-widest text-black">{settings.phone}</p></div>
            </div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 bg-white flex items-center justify-center text-[#007BFF] rounded-full shadow-sm group-hover:bg-[#007BFF] group-hover:text-white transition-all"><Mail size={18} /></div>
              <div><p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Email</p><p className="text-sm font-black tracking-widest text-black">{settings.email}</p></div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="bg-white p-10 lg:p-16 shadow-2xl rounded-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-[#007BFF]"></div>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-12 text-black">Poptat <span className="text-[#007BFF]">Jakub Minka</span></h3>
            {formState === 'success' ? (
              <div className="py-20 text-center space-y-6">
                <div className="flex justify-center text-green-500 mb-6"><CheckCircle2 size={64} className="animate-bounce" /></div>
                <h4 className="text-2xl font-black uppercase tracking-widest text-black">Poptávka odeslána!</h4>
                <p className="text-gray-500 font-medium">Ozvu se vám co nejdříve s návrhem řešení.</p>
                <button onClick={() => setFormState('idle')} className="text-[#007BFF] font-black uppercase tracking-widest text-[10px] pt-10 underline decoration-2 underline-offset-8">Odeslat další zprávu</button>
              </div>
            ) : (
              <form className="space-y-8" onSubmit={handleOpenVerification}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Jméno a Příjmení</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-b border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors text-sm font-bold text-black" /></div>
                  <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Emailová adresa</label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-b border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors text-sm font-bold text-black" /></div>
                </div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Předmět / O co máte zájem?</label><input type="text" required placeholder="Např. Focení hotelu, firemní video..." value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-gray-50 border-b border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors text-sm font-bold text-black" /></div>
                <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Vaše zpráva</label><textarea rows={4} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-gray-50 border-b border-gray-100 py-4 px-2 focus:outline-none focus:border-[#007BFF] transition-colors resize-none text-sm font-medium text-black"></textarea></div>
                <button disabled={formState === 'loading'} className="w-full py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-xl hover:bg-[#007BFF] disabled:bg-gray-100 disabled:text-gray-400">{formState === 'loading' ? <RefreshCw className="animate-spin" size={18} /> : (<>Odeslat zprávu <Send size={18} /></>)}</button>
                <p className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Shield size={10} /> 
                  <Link to="/ochrana-soukromi" className="hover:text-black underline underline-offset-2">Odesláním souhlasíte se zpracováním osobních údajů.</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-32 pt-12 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
        <p>© {new Date().getFullYear()} Jakub Minka - Foto & Video. Všechna práva vyhrazena.</p>
        <div className="flex gap-12 mt-6 md:mt-0">
          <button onClick={triggerCookieSettings} className="hover:text-[#007BFF] transition-colors flex items-center gap-2 uppercase tracking-widest">
            <Settings size={12} /> Nastavení soukromí
          </button>
          <Link to="/ochrana-soukromi" className="hover:text-[#007BFF] transition-colors">Ochrana soukromí</Link>
          <Link to="/podminky-spoluprace" className="hover:text-[#007BFF] transition-colors">Podmínky spolupráce</Link>
        </div>
      </div>
      <HumanVerificationModal isOpen={isVerificationOpen} onClose={() => setIsVerificationOpen(false)} onSuccess={handleVerificationSuccess} />
    </footer>
  );
};

export default Footer;
