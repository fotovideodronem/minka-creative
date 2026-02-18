
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Image as ImageIcon, User, X, Layout, Wallet, Phone, Mail, 
  Globe, ChevronRight, Folder, MessageSquare, Instagram, Facebook, 
  Youtube, Linkedin, Info, Upload, Plus, FileText, Shield, 
  Bold, Italic, List, RefreshCw, CheckCircle2, Search, MapPin, 
  Monitor, Smartphone, Type, AlignLeft, Camera, Layers, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebSettings, FileItem } from '../../types';
import { mediaDB, dataStore } from '../../lib/db';
import { SPECIALIZATIONS } from '../../constants';

const WebSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<WebSettings>({
    homeHeader: '', portfolioHeader: '', contactHeader: '', blogHeader: '', specializationHeaders: {},
    homeHeroTitle: 'VIZUÁLNÍ PŘÍBĚHY, KTERÉ PRODÁVAJÍ',
    homeHeroSubtitle: 'FOTOGRAF & KAMERAMAN',
    homeAboutTitle: 'O MNĚ',
    homeAboutText: '',
    profilePic: '',
    specificationsTitle: 'SPECIALIZACE',
    specificationsSubtitle: 'CO PRO VÁS MOHU UDĚLAT',
    contactTitle: 'KONTAKT',
    contactSubtitle: 'POJĎME TVOŘIT',
    bio: '', ico: '', dic: '', address: '', phone: '', email: '', footerDescription: '',
    doc1Name: 'Ochrana soukromí', doc1Url: '#', doc2Name: 'Podmínky spolupráce', doc2Url: '#',
    backstage: [], instagramUrl: '', facebookUrl: '', youtubeUrl: '', linkedinUrl: '',
    pricingTitle: 'CENÍK SLUŽEB', pricingSubtitle: 'INVESTICE DO VIZUÁLU',
    price1Title: 'FOTO PRODUKCE', price1Value: 'od 5.000 Kč', price1Desc: '',
    price2Title: 'VIDEO PRODUKCE', price2Value: 'od 15.000 Kč', price2Desc: '',
    pricingCta: 'POPTAT PROJEKT',
    privacyContent: '',
    termsContent: ''
  });

  const [activeTab, setActiveTab] = useState<'home' | 'portfolio' | 'specs' | 'contact' | 'backstage' | 'footer' | 'legal' | 'seo'>('home');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{key: string, isSpec?: boolean} | null>(null);
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // WYSIWYG Refs for specific sections
  const refs = {
    homeAbout: useRef<HTMLDivElement>(null),
    price1: useRef<HTMLDivElement>(null),
    price2: useRef<HTMLDivElement>(null),
    privacy: useRef<HTMLDivElement>(null),
    terms: useRef<HTMLDivElement>(null),
    footerDesc: useRef<HTMLDivElement>(null)
  };
  
  const loadSettings = async () => {
    const saved = await dataStore.doc('web_settings').get();
    if (saved) {
      setSettings(prev => ({ ...prev, ...saved }));
      // Hydrate contentEditables
      setTimeout(() => {
        if (refs.homeAbout.current) refs.homeAbout.current.innerHTML = saved.homeAboutText || '';
        if (refs.price1.current) refs.price1.current.innerHTML = saved.price1Desc || '';
        if (refs.price2.current) refs.price2.current.innerHTML = saved.price2Desc || '';
        if (refs.privacy.current) refs.privacy.current.innerHTML = saved.privacyContent || '';
        if (refs.terms.current) refs.terms.current.innerHTML = saved.termsContent || '';
        if (refs.footerDesc.current) refs.footerDesc.current.innerHTML = saved.footerDescription || '';
      }, 200);
    }
    const dbItems = await mediaDB.getAll({ force: true });
    setAllItems(dbItems);
  };

  useEffect(() => { loadSettings(); }, []);

  const saveSettings = async () => {
    setIsSaving(true);
    const updatedSettings = {
      ...settings,
      homeAboutText: refs.homeAbout.current?.innerHTML || '',
      price1Desc: refs.price1.current?.innerHTML || '',
      price2Desc: refs.price2.current?.innerHTML || '',
      privacyContent: refs.privacy.current?.innerHTML || '',
      termsContent: refs.terms.current?.innerHTML || '',
      footerDescription: refs.footerDesc.current?.innerHTML || ''
    };
    await dataStore.doc('web_settings').set(updatedSettings);
    setIsSaving(false);
    alert('Všechny změny byly publikovány!');
  };

  const handleEditorCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const openPicker = (key: string, isSpec = false) => {
    setPickerTarget({ key, isSpec });
    setShowPicker(true);
  };

  const selectFromPicker = (url: string) => {
    if (!pickerTarget) return;
    
    // Handling for backstage gallery
    if (pickerTarget.key === 'backstage-add') {
      setSettings(prev => ({
        ...prev,
        backstage: [...(prev.backstage || []), url]
      }));
      setShowPicker(false);
      return;
    }
    
    // Handling for specialization headers
    if (pickerTarget.isSpec) {
      setSettings(prev => ({
        ...prev,
        specializationHeaders: { ...prev.specializationHeaders, [pickerTarget.key]: url }
      }));
    } else {
      setSettings(prev => ({ ...prev, [pickerTarget.key]: url }));
    }
    setShowPicker(false);
  };

  const inputClass = "w-full bg-gray-50 text-black border-2 border-gray-100 p-5 font-black uppercase text-xs tracking-widest focus:border-[#007BFF] outline-none transition-all placeholder:text-gray-300";
  
  const Toolbar = () => (
    <div className="bg-gray-100 border-b p-2 flex gap-1 flex-wrap sticky top-0 z-20">
      <button type="button" onClick={() => handleEditorCommand('bold')} className="p-2 hover:bg-white rounded transition-colors" title="Tučné"><Bold size={16}/></button>
      <button type="button" onClick={() => handleEditorCommand('italic')} className="p-2 hover:bg-white rounded transition-colors" title="Kurzíva"><Italic size={16}/></button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button type="button" onClick={() => handleEditorCommand('formatBlock', 'H3')} className="px-3 py-1 hover:bg-white rounded font-black text-[10px]">H3</button>
      <button type="button" onClick={() => handleEditorCommand('insertUnorderedList')} className="p-2 hover:bg-white rounded transition-colors" title="Seznam"><List size={16}/></button>
    </div>
  );

  const SectionTitle = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-4 mb-8">
      <div className="w-10 h-10 bg-[#007BFF]/10 text-[#007BFF] flex items-center justify-center rounded-sm"><Icon size={20}/></div>
      <h3 className="text-sm font-black uppercase tracking-[0.3em]">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-12 pb-32">
      {/* Visual Navigation Tabs */}
      <div className="flex bg-white border p-1 sticky top-0 z-[100] shadow-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'seo', label: 'SEO', icon: Search },
          { id: 'home', label: 'Úvodní stránka', icon: Layout },
          { id: 'portfolio', label: 'Portfolio', icon: Layers },
          { id: 'specs', label: 'Specializace', icon: Camera },
          { id: 'contact', label: 'Kontakt & Bio', icon: User },
          { id: 'backstage', label: 'Jak Pracuji', icon: Camera },
          { id: 'footer', label: 'Ceník & Patička', icon: Wallet },
          { id: 'legal', label: 'Dokumenty', icon: FileText }
        ].map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 min-w-[150px] py-5 px-4 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#007BFF] text-white shadow-lg' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }}
          className="bg-white p-10 lg:p-16 border shadow-sm space-y-20 max-w-6xl mx-auto"
        >
          {activeTab === 'seo' && (
            <div className="space-y-20">
              <section>
                <SectionTitle title="Globální SEO nastavení" icon={Search} />
                <div className="space-y-8 bg-blue-50/30 p-8 border border-blue-100 rounded-sm">
                  <div className="text-sm text-gray-600 mb-6 leading-relaxed">
                    <strong className="text-black">SEO (Search Engine Optimization)</strong> pomáhá vašim stránkám umístit se výše ve vyhledávání Google. 
                    Vyplňte následující pole s relevantními informacemi.
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                      Název webu (Site Title) 
                      <span className="text-[#007BFF] ml-2">📊 Důležité pro Google</span>
                    </label>
                    <input 
                      type="text" 
                      value={settings.siteTitle || ''} 
                      onChange={e=>setSettings({...settings, siteTitle:e.target.value})} 
                      className={inputClass} 
                      placeholder="např. Jakub Minka - Profesionální Fotograf & Kameraman Praha"
                      maxLength={60}
                    />
                    <div className="text-xs text-gray-500">
                      {(settings.siteTitle || '').length}/60 znaků • Zobrazuje se v záložce prohlížeče a ve výsledcích vyhledávání
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                      Popis webu (Meta Description)
                      <span className="text-[#007BFF] ml-2">📊 Důležité pro Google</span>
                    </label>
                    <textarea 
                      value={settings.siteDescription || ''} 
                      onChange={e=>setSettings({...settings, siteDescription:e.target.value})} 
                      className={`${inputClass} h-24 resize-none`}
                      placeholder="např. Profesionální fotografie a video produkce pro firmy. Komerční tvorba, architektura, průmysl. +420 XXX XXX XXX"
                      maxLength={160}
                    />
                    <div className="text-xs text-gray-500">
                      {(settings.siteDescription || '').length}/160 znaků • Zobrazuje se pod názvem ve výsledcích Google
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                      Klíčová slova (Keywords)
                      <span className="text-gray-400 ml-2">💡 Méně důležité, ale užitečné</span>
                    </label>
                    <input 
                      type="text" 
                      value={settings.siteKeywords || ''} 
                      onChange={e=>setSettings({...settings, siteKeywords:e.target.value})} 
                      className={inputClass}
                      placeholder="např. fotograf praha, komerční fotografie, firemní video, průmyslová fotografie"
                    />
                    <div className="text-xs text-gray-500">
                      Oddělujte čárkami • Používejte specifické fráze které lidé hledají
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <h4 className="font-black uppercase text-xs mb-3 flex items-center gap-2">
                    <Info size={16} /> SEO Tips pro lepší umístění
                  </h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="flex gap-2"><span>✓</span> <span>Používejte konkrétní lokaci (Praha, Brno...)</span></li>
                    <li className="flex gap-2"><span>✓</span> <span>Zahrňte vaši specializaci (komerční, průmyslová...)</span></li>
                    <li className="flex gap-2"><span>✓</span> <span>Každá stránka (blog, specializace) má vlastní SEO nastavení</span></li>
                    <li className="flex gap-2"><span>✓</span> <span>Obrázky pojmenovávejte smysluplně (ne IMG_1234.jpg)</span></li>
                    <li className="flex gap-2"><span>✓</span> <span>Vyplňte ALT text u všech obrázků v Media Gallery</span></li>
                  </ul>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'home' && (
            <div className="space-y-20">
              <section>
                <SectionTitle title="Hero Sekce (Záhlaví)" icon={Monitor} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400">Hlavní nadpis</label>
                      <input type="text" value={settings.homeHeroTitle} onChange={e=>setSettings({...settings, homeHeroTitle:e.target.value})} className={`${inputClass} text-2xl`} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400">Podnadpis / Profese</label>
                      <input type="text" value={settings.homeHeroSubtitle} onChange={e=>setSettings({...settings, homeHeroSubtitle:e.target.value})} className={inputClass} />
                   </div>
                   <div className="md:col-span-2 space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400">Pozadí úvodní sekce (Obrázek)</label>
                      <div className="flex gap-4">
                        <div className="w-24 h-16 bg-gray-100 border overflow-hidden shrink-0"><img src={settings.homeHeader} className="w-full h-full object-cover grayscale" /></div>
                        <input type="text" value={settings.homeHeader} onChange={e=>setSettings({...settings, homeHeader:e.target.value})} className={inputClass} placeholder="URL obrázku..." />
                        <button onClick={() => openPicker('homeHeader')} className="bg-black text-white px-8 shrink-0 hover:bg-[#007BFF] transition-all"><ImageIcon size={20}/></button>
                      </div>
                   </div>
                </div>
              </section>

              <section className="pt-20 border-t">
                <SectionTitle title="Sekce O mně" icon={User} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400">Portrétní foto</label>
                      <div className="aspect-[3/4] bg-gray-50 border overflow-hidden relative group">
                        <img src={settings.profilePic} className="w-full h-full object-cover grayscale" />
                        <button onClick={() => openPicker('profilePic')} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"><Plus size={32}/></button>
                      </div>
                   </div>
                   <div className="md:col-span-2 space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400">Nadpis bloku</label>
                        <input type="text" value={settings.homeAboutTitle} onChange={e=>setSettings({...settings, homeAboutTitle:e.target.value})} className={`${inputClass} text-xl`} />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400">Textový obsah (WYSIWYG)</label>
                        <div className="border-2 border-gray-100 rounded-sm overflow-hidden">
                           <Toolbar />
                           <div ref={refs.homeAbout} contentEditable className="min-h-[350px] p-10 outline-none prose prose-lg max-w-none text-black bg-white font-medium leading-relaxed" />
                        </div>
                      </div>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-16">
              <section>
                <SectionTitle title="Záhlaví Portfolia" icon={Layers} />
                <div className="space-y-6">
                  <div className="aspect-[21/9] bg-gray-50 border relative overflow-hidden group">
                    <img src={settings.portfolioHeader} className="w-full h-full object-cover grayscale" />
                    <button onClick={() => openPicker('portfolioHeader')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-[10px] tracking-widest uppercase transition-all">Změnit obrázek záhlaví</button>
                  </div>
                  <div className="flex gap-4">
                    <input type="text" value={settings.portfolioHeader} onChange={e=>setSettings({...settings, portfolioHeader:e.target.value})} className={inputClass} placeholder="URL..." />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-20">
              <section>
                <SectionTitle title="Záhlaví Specializací" icon={Camera} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400">Nadpis</label>
                      <input type="text" value={settings.specificationsTitle} onChange={e=>setSettings({...settings, specificationsTitle:e.target.value})} className={inputClass} />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-gray-400">Podnadpis</label>
                      <input type="text" value={settings.specificationsSubtitle} onChange={e=>setSettings({...settings, specificationsSubtitle:e.target.value})} className={inputClass} />
                   </div>
                </div>
              </section>

              <section className="pt-20 border-t">
                <SectionTitle title="Vlastní obrázky pro jednotlivé kategorie" icon={Plus} />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                   {SPECIALIZATIONS.map(spec => (
                     <div key={spec.id} className="space-y-3">
                        <div className="aspect-square bg-gray-50 border relative group overflow-hidden rounded-sm">
                           <img src={settings.specializationHeaders[spec.id] || spec.image} className="w-full h-full object-cover grayscale" />
                           <button onClick={() => openPicker(spec.id, true)} className="absolute inset-0 bg-[#007BFF]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all"><ImageIcon size={20}/></button>
                        </div>
                        <p className="text-[8px] font-black uppercase text-center text-gray-400 truncate">{spec.name}</p>
                     </div>
                   ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-20">
              <section>
                <SectionTitle title="Kontaktní informace" icon={Mail} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2"><label className="text-[9px] font-black text-gray-400">Email</label><input type="text" value={settings.email} onChange={e=>setSettings({...settings, email:e.target.value})} className={inputClass} /></div>
                  <div className="space-y-2"><label className="text-[9px] font-black text-gray-400">Telefon</label><input type="text" value={settings.phone} onChange={e=>setSettings({...settings, phone:e.target.value})} className={inputClass} /></div>
                  <div className="space-y-2"><label className="text-[9px] font-black text-gray-400">Adresa / Město</label><input type="text" value={settings.address} onChange={e=>setSettings({...settings, address:e.target.value})} className={inputClass} /></div>
                  <div className="space-y-2"><label className="text-[9px] font-black text-gray-400">IČO</label><input type="text" value={settings.ico} onChange={e=>setSettings({...settings, ico:e.target.value})} className={inputClass} /></div>
                  <div className="space-y-2"><label className="text-[9px] font-black text-gray-400">DIČ</label><input type="text" value={settings.dic} onChange={e=>setSettings({...settings, dic:e.target.value})} className={inputClass} /></div>
                </div>
              </section>

              <section className="pt-20 border-t">
                <SectionTitle title="Krátké BIO (Text pod portrétem)" icon={AlignLeft} />
                <textarea value={settings.bio} onChange={e=>setSettings({...settings, bio:e.target.value})} className={`${inputClass} h-40 resize-none normal-case font-medium text-sm leading-relaxed`} />
              </section>

              <section className="pt-20 border-t">
                 <SectionTitle title="Sociální sítě" icon={Globe} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex gap-4 items-center bg-gray-50 p-4 border"><Instagram className="text-[#E1306C]"/><input type="text" value={settings.instagramUrl} onChange={e=>setSettings({...settings, instagramUrl:e.target.value})} className="bg-transparent text-xs font-bold flex-grow outline-none" placeholder="Instagram URL" /></div>
                    <div className="flex gap-4 items-center bg-gray-50 p-4 border"><Facebook className="text-[#1877F2]"/><input type="text" value={settings.facebookUrl} onChange={e=>setSettings({...settings, facebookUrl:e.target.value})} className="bg-transparent text-xs font-bold flex-grow outline-none" placeholder="Facebook URL" /></div>
                    <div className="flex gap-4 items-center bg-gray-50 p-4 border"><Youtube className="text-[#FF0000]"/><input type="text" value={settings.youtubeUrl} onChange={e=>setSettings({...settings, youtubeUrl:e.target.value})} className="bg-transparent text-xs font-bold flex-grow outline-none" placeholder="Youtube URL" /></div>
                    <div className="flex gap-4 items-center bg-gray-50 p-4 border"><Linkedin className="text-[#0077B5]"/><input type="text" value={settings.linkedinUrl} onChange={e=>setSettings({...settings, linkedinUrl:e.target.value})} className="bg-transparent text-xs font-bold flex-grow outline-none" placeholder="Linkedin URL" /></div>
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'backstage' && (
            <div className="space-y-20">
              <section>
                <SectionTitle title="Backstage Galerie - Jak Pracuji" icon={Camera} />
                <div className="space-y-6">
                  <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded">
                    <div className="flex items-start gap-4">
                      <Info className="text-blue-600 shrink-0 mt-1" size={20} />
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase text-blue-900 tracking-wider">Informace o sekci</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Zde můžete spravovat fotky pro stránku <strong>"Jak Pracuji"</strong> (/jak-pracuji). 
                          Tyto obrázky zobrazují zákulisí vaší tvorby a proces práce.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Počet fotek v galerii: {settings.backstage?.length || 0}
                    </p>
                    <button 
                      onClick={() => {
                        setPickerTarget({ key: 'backstage-add' });
                        setShowPicker(true);
                      }}
                      className="bg-[#007BFF] text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3"
                    >
                      <Plus size={16} /> Přidat fotku
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-6">
                    {(settings.backstage || []).map((url, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 border group overflow-hidden">
                        <img src={url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={`Backstage ${index + 1}`} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <button
                            onClick={() => {
                              const newBackstage = settings.backstage?.filter((_, i) => i !== index);
                              setSettings({ ...settings, backstage: newBackstage });
                            }}
                            className="bg-red-500 text-white p-3 rounded-sm hover:bg-red-600 transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[8px] font-black px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                    
                    {(!settings.backstage || settings.backstage.length === 0) && (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <ImageIcon size={48} className="mb-4 opacity-30" />
                        <p className="text-xs font-black uppercase tracking-widest">Zatím žádné fotky</p>
                        <p className="text-[10px] mt-2">Klikněte na tlačítko "Přidat fotku" výše</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-20">
              <section>
                <SectionTitle title="Ceník v úvodu webu" icon={Wallet} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6 bg-gray-50 p-8 border">
                      <input type="text" value={settings.price1Title} onChange={e=>setSettings({...settings, price1Title:e.target.value})} className={inputClass} placeholder="Název balíčku 1" />
                      <input type="text" value={settings.price1Value} onChange={e=>setSettings({...settings, price1Value:e.target.value})} className={inputClass} placeholder="Cena balíčku 1" />
                      <div className="bg-white border-2 border-gray-100 overflow-hidden">
                        <Toolbar />
                        <div ref={refs.price1} contentEditable className="min-h-[150px] p-6 outline-none text-xs font-bold uppercase tracking-widest text-gray-500" />
                      </div>
                   </div>
                   <div className="space-y-6 bg-gray-50 p-8 border">
                      <input type="text" value={settings.price2Title} onChange={e=>setSettings({...settings, price2Title:e.target.value})} className={inputClass} placeholder="Název balíčku 2" />
                      <input type="text" value={settings.price2Value} onChange={e=>setSettings({...settings, price2Value:e.target.value})} className={inputClass} placeholder="Cena balíčku 2" />
                      <div className="bg-white border-2 border-gray-100 overflow-hidden">
                        <Toolbar />
                        <div ref={refs.price2} contentEditable className="min-h-[150px] p-6 outline-none text-xs font-bold uppercase tracking-widest text-gray-500" />
                      </div>
                   </div>
                </div>
              </section>

              <section className="pt-20 border-t">
                <SectionTitle title="Patička (Footer)" icon={AlignLeft} />
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase text-gray-400">Popis v patičce (Pod logem)</label>
                   <div className="border-2 border-gray-100 overflow-hidden">
                      <Toolbar />
                      <div ref={refs.footerDesc} contentEditable className="min-h-[120px] p-6 outline-none text-sm font-medium leading-relaxed" />
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-20">
               <section>
                 <SectionTitle title="Ochrana soukromí (GDPR)" icon={Shield} />
                 <div className="border-2 border-gray-100 overflow-hidden">
                    <Toolbar />
                    <div ref={refs.privacy} contentEditable className="min-h-[400px] p-12 outline-none prose prose-sm max-w-none bg-white text-black font-medium leading-relaxed" />
                 </div>
               </section>
               <section className="pt-20 border-t">
                 <SectionTitle title="Obchodní podmínky" icon={FileText} />
                 <div className="border-2 border-gray-100 overflow-hidden">
                    <Toolbar />
                    <div ref={refs.terms} contentEditable className="min-h-[400px] p-12 outline-none prose prose-sm max-w-none bg-white text-black font-medium leading-relaxed" />
                 </div>
               </section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-10 right-10 z-[200] flex flex-col items-end gap-4">
        <button onClick={saveSettings} disabled={isSaving} className="bg-[#007BFF] text-white px-16 py-6 text-[11px] font-black uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(0,123,255,0.4)] hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-4">
          {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
          PUBLIKOVAT VŠE
        </button>
      </div>

      {/* Media Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <div className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-12" onClick={()=>setShowPicker(false)}>
            <div className="bg-white w-full max-w-6xl h-[85vh] flex flex-col rounded-sm overflow-hidden" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b flex justify-between items-center bg-gray-50 text-black">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-widest">Knihovna médií</h3>
                    <p className="text-[9px] font-black text-[#007BFF] uppercase tracking-[0.3em]">Vyberte obrázek pro: {pickerTarget?.key}</p>
                  </div>
                  <button onClick={()=>setShowPicker(false)} className="text-black hover:text-red-500 transition-colors"><X size={32}/></button>
               </div>
               <div className="p-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 overflow-y-auto bg-gray-50/30 flex-grow">
                  {allItems.filter(i => i.type !== 'folder').map(item => (
                    <div key={item.id} onClick={() => selectFromPicker(item.url!)} className="relative aspect-square border-2 border-transparent hover:border-[#007BFF] transition-all p-1 cursor-pointer bg-white group shadow-sm">
                       <img src={item.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/>
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <CheckCircle2 className="text-[#007BFF]" size={32}/>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-6 border-t bg-gray-50 flex justify-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kliknutím na obrázek jej okamžitě vyberete</p>
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebSettingsManager;
