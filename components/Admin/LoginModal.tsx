
import React, { useState, useEffect } from 'react';
import { X, Lock, User, ShieldAlert, RefreshCw, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'login' | 'reset' | 'success'>('login');
  const [nick, setNick] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedAttempts = localStorage.getItem('login_attempts');
    if (savedAttempts && parseInt(savedAttempts) >= 5) {
      setIsLocked(true);
      setAttempts(parseInt(savedAttempts));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLocked) {
      setError('Účet je uzamčen. Příliš mnoho chybných pokusů.');
      return;
    }

    if (!isCaptchaVerified) {
      setError('Potvrďte prosím, že nejste robot.');
      return;
    }

    setLoading(true);

    // Načtení uživatelského hesla nebo výchozího
    const VALID_NICK = 'jakubminka';
    const VALID_PASS = localStorage.getItem('jakub_minka_admin_password') || 'minka2026!';

    setTimeout(() => {
      setLoading(false);
      
      if (nick === VALID_NICK && password === VALID_PASS) {
        localStorage.setItem('admin_auth', 'true');
        localStorage.removeItem('login_attempts');
        onClose();
        navigate('/admin');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('login_attempts', newAttempts.toString());

        if (newAttempts >= 5) {
          setIsLocked(true);
          setError('Účet byl zablokován z bezpečnostních důvodů.');
        } else {
          setError(`Chybné údaje. Zbývá ${5 - newAttempts} pokusů.`);
        }
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md overflow-hidden relative shadow-2xl rounded-sm">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
        <div className="p-10 lg:p-12">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-gray-50 flex items-center justify-center text-[#007BFF] rounded-full mb-6 mx-auto border border-gray-100">
              {isLocked ? <ShieldAlert size={32} /> : <Lock size={32} />}
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-black">Správa systému</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Zabezpečené přihlášení</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Uživatelské jméno</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={nick} onChange={e => setNick(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 py-3.5 pl-12 pr-4 text-sm font-bold text-black outline-none focus:border-[#007BFF]" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Heslo</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 py-3.5 pl-12 pr-12 text-sm font-bold text-black outline-none focus:border-[#007BFF]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsCaptchaVerified(!isCaptchaVerified)} className={`w-6 h-6 border-2 flex items-center justify-center ${isCaptchaVerified ? 'bg-[#007BFF] border-[#007BFF]' : 'bg-white border-gray-300'}`}>
                  {isCaptchaVerified && <CheckCircle2 size={16} className="text-white" />}
                </button>
                <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Nejsem robot</span>
              </div>
              <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" className="w-6 opacity-40" alt="reCAPTCHA" />
            </div>

            {error && <p className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 p-3 text-center">{error}</p>}

            <button disabled={loading || isLocked} className="w-full bg-black text-white py-4 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#007BFF] transition-all flex items-center justify-center gap-3">
              {loading ? <RefreshCw className="animate-spin" size={16} /> : 'VSTOUPIT DO SYSTÉMU'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginModal;
