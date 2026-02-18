
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Camera, Video, ArrowRight, CheckCircle2, Shield, Info } from 'lucide-react';

interface HumanVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HumanVerificationModal: React.FC<HumanVerificationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'intro' | 'challenge' | 'verifying'>('intro');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const challenges = [
    { id: 1, icon: Camera, label: 'FOTOGRAFIE' },
    { id: 2, icon: Video, label: 'VIDEO' },
    { id: 3, icon: Shield, label: 'SOUKROMÍ' }
  ];

  const correctId = 1; // Challenge: "Vyberte ikonu fotoaparátu"

  useEffect(() => {
    if (!isOpen) {
      setStep('intro');
      setSelectedId(null);
    }
  }, [isOpen]);

  const handleVerify = () => {
    if (selectedId === correctId) {
      setStep('verifying');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      alert('Nesprávná volba. Zkuste to prosím znovu.');
      setSelectedId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md overflow-hidden relative shadow-2xl rounded-sm border border-white/10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors z-10">
          <X size={24} />
        </button>

        <div className="p-10 lg:p-12">
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8 text-center"
              >
                <div className="w-20 h-20 bg-blue-50 text-[#007BFF] rounded-full flex items-center justify-center mx-auto shadow-sm border border-blue-100">
                  <ShieldCheck size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900">Ověření člověka</h2>
                  <p className="text-[9px] font-black text-[#007BFF] uppercase tracking-[0.4em]">EU PRIVACY VERIFICATION v3.1</p>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  V rámci nejnovějších požadavků EU (GDPR & DSA) na ochranu soukromí a omezení automatizovaného trackování, prosíme o jednoduché ověření vaší identity.
                </p>
                <div className="pt-4">
                  <button 
                    onClick={() => setStep('challenge')}
                    className="w-full bg-black text-white py-4 text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-[#007BFF] transition-all"
                  >
                    Pokračovat k ověření <ArrowRight size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-300">
                   <Info size={12} />
                   <span className="text-[7px] font-black uppercase tracking-widest">Tato metoda neukládá sledovací soubory cookies.</span>
                </div>
              </motion.div>
            )}

            {step === 'challenge' && (
              <motion.div 
                key="challenge"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10 text-center"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-widest">Vizuální test</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Klikněte na ikonu představující <span className="text-[#007BFF]">FOTOAPARÁT</span></p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {challenges.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`aspect-square flex flex-col items-center justify-center gap-3 border transition-all ${selectedId === item.id ? 'border-[#007BFF] bg-blue-50 text-[#007BFF] shadow-lg scale-105' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'}`}
                    >
                      <item.icon size={32} />
                      <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </div>

                <button 
                  disabled={selectedId === null}
                  onClick={handleVerify}
                  className={`w-full py-4 text-[11px] font-black uppercase tracking-[0.4em] transition-all ${selectedId === null ? 'bg-gray-100 text-gray-400' : 'bg-[#007BFF] text-white hover:bg-black shadow-xl shadow-[#007BFF]/20'}`}
                >
                  Ověřit a odeslat zprávu
                </button>
              </motion.div>
            )}

            {step === 'verifying' && (
              <motion.div 
                key="verifying"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 space-y-10 text-center"
              >
                <div className="relative w-24 h-24 mx-auto">
                   <motion.div 
                     animate={{ rotate: 360 }} 
                     transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 border-4 border-[#007BFF] border-t-transparent rounded-full"
                   />
                   <div className="absolute inset-0 flex items-center justify-center text-[#007BFF]">
                      <Shield size={32} className="animate-pulse" />
                   </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-widest">Ověřování...</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Zabezpečené spojení se serverem</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-1.5 w-full bg-gradient-to-r from-[#007BFF] to-black"></div>
      </motion.div>
    </div>
  );
};

export default HumanVerificationModal;
