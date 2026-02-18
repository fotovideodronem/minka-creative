
import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Upload, Zap, Lock, Eye, EyeOff, RefreshCw, CheckCircle2, ShieldCheck, ShieldAlert
} from 'lucide-react';

const SystemManager: React.FC = () => {
  const [compressionQuality, setCompressionQuality] = useState(85);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Security State
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passStatus, setPassStatus] = useState<'idle' | 'error' | 'success'>('idle');

  useEffect(() => {
    const savedQuality = localStorage.getItem('jakub_minka_compression_quality');
    if (savedQuality) setCompressionQuality(parseInt(savedQuality));
  }, []);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus('idle');

    if (newPass !== confirmPass) {
      setPassStatus('error');
      return;
    }
    if (newPass.length < 6) {
      alert('Heslo musí mít alespoň 6 znaků.');
      return;
    }

    localStorage.setItem('jakub_minka_admin_password', newPass);
    setPassStatus('success');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassStatus('idle'), 4000);
  };

  const handleExportData = () => {
    const data = {
      projects: JSON.parse(localStorage.getItem('jakub_minka_projects') || '[]'),
      settings: JSON.parse(localStorage.getItem('jakub_minka_web_settings') || '{}'),
      reviews: JSON.parse(localStorage.getItem('jakub_minka_reviews') || '[]'),
      partners: JSON.parse(localStorage.getItem('jakub_minka_partners') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minka_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const inputClass = "w-full bg-white text-black border border-gray-200 p-4 text-sm font-bold focus:border-[#007BFF] outline-none transition-all placeholder:text-gray-300";

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* ZMĚNA HESLA */}
        <section className="bg-white p-10 border border-gray-100 shadow-sm space-y-8">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 text-black">
            <Lock size={20} className="text-[#007BFF]" /> Zabezpečení administrace
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Nové heslo</label>
                <div className="relative">
                   <input type={showPass ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} required className={inputClass} placeholder="Nové heslo (min. 6 znaků)" />
                   <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Potvrzení hesla</label>
                <input type={showPass ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required className={inputClass} placeholder="Znovu zadejte heslo" />
             </div>
             
             {passStatus === 'error' && (
               <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-100">
                  <ShieldAlert size={16} /> Hesla se neshodují!
               </div>
             )}
             {passStatus === 'success' && (
               <div className="flex items-center gap-2 p-4 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">
                  <CheckCircle2 size={16} /> Heslo bylo úspěšně změněno!
               </div>
             )}

             <button type="submit" className="w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#007BFF] transition-all shadow-lg flex items-center justify-center gap-3">
               AKTUALIZOVAT PŘÍSTUP <ShieldCheck size={16} />
             </button>
          </form>
        </section>

        <section className="bg-white p-10 border border-gray-100 shadow-sm space-y-8">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 text-black">
            <Database size={20} className="text-[#007BFF]" /> Správa dat & Export
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleExportData} className="flex flex-col items-center justify-center gap-4 p-8 border border-gray-100 hover:border-[#007BFF] hover:bg-blue-50/50 transition-all group">
              <Download size={24} className="text-gray-300 group-hover:text-[#007BFF]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-black">Stáhnout zálohu webu</span>
            </button>
            <div className="p-8 border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-center">
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Databáze: IndexedDB</p>
               <p className="text-[11px] font-black text-black mt-2">AKTIVNÍ</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-10 border border-gray-100 shadow-sm space-y-8 lg:col-span-2">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 text-black">
            <Zap size={20} className="text-[#007BFF]" /> Globální optimalizace při nahrávání
          </h3>
          <div className="space-y-6 max-w-2xl">
            <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-gray-400">Kvalita komprese (JPEG)</label><span className="text-sm font-black text-[#007BFF]">{compressionQuality}%</span></div>
            <input type="range" min="50" max="100" value={compressionQuality} onChange={(e) => setCompressionQuality(parseInt(e.target.value))} className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#007BFF]" />
            <div className="flex items-center gap-2 text-orange-500 bg-orange-50 p-4 border border-orange-100">
               <ShieldAlert size={18} />
               <p className="text-[9px] font-bold uppercase tracking-widest">Obrázky budou při nahrávání automaticky zmenšeny na max 1920px (šířka/výška).</p>
            </div>
            <button onClick={() => { localStorage.setItem('jakub_minka_compression_quality', compressionQuality.toString()); alert('Kvalita uložena!'); }} className="bg-gray-900 text-white px-12 py-4 text-[10px] font-black uppercase hover:bg-[#007BFF] transition-all">ULOŽIT KONFIGURACI</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SystemManager;
