
import React, { useState, useEffect } from 'react';
import { Mail, Search, X, MessageSquare, Calendar, User, Tag, CheckCircle2, Trash2, UserX, AlertTriangle, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inquiry } from '../../types';
import { dataStore } from '../../lib/db';

const InquiryManager: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Inquiry>>({});

  const loadData = async () => {
    const saved = await dataStore.collection('inquiries').getAll({ force: true });
    setInquiries(saved.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => { loadData(); }, []);

  const markAsRead = async (id: string) => {
    await dataStore.collection('inquiries').update(id, { status: 'read' });
  };

  const deleteInquiry = async (id: string) => {
    if (confirm('Smazat dotaz?')) {
      await dataStore.collection('inquiries').delete(id);
      setSelectedInquiry(null);
      loadData();
    }
  };

  const handleUpdate = async () => {
    if (!selectedInquiry) return;
    try {
      await dataStore.collection('inquiries').update(selectedInquiry.id, editData);
      setIsEditing(false);
      setSelectedInquiry({...selectedInquiry, ...editData} as Inquiry);
      loadData();
      alert('Dotaz byl upraven.');
    } catch (e) {
      alert('Chyba při ukládání: ' + e);
    }
  };

  const filtered = inquiries.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border flex justify-between items-center shadow-sm">
        <div className="relative flex-grow max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="HLEDAT DOTAZ..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full border p-3 pl-12 text-[10px] font-black uppercase" />
        </div>
        <div className="text-[10px] font-black uppercase text-gray-400">Položek: {filtered.length}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 bg-white border max-h-[70vh] overflow-y-auto">
          {filtered.map(i => (
            <div 
              key={i.id} 
              onClick={() => {setSelectedInquiry(i); setEditData(i); if(i.status==='new') markAsRead(i.id);}}
              className={`p-6 border-b cursor-pointer transition-all hover:bg-gray-50 ${selectedInquiry?.id === i.id ? 'bg-blue-50/50 border-l-4 border-l-[#007BFF]' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                 <h4 className="text-[11px] font-black uppercase truncate text-black">{i.name}</h4>
                 <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(i.date).toLocaleDateString()}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase truncate">{i.subject}</p>
              {i.status === 'new' && <div className="mt-2 w-2 h-2 bg-[#007BFF] rounded-full"></div>}
            </div>
          ))}
          {filtered.length === 0 && (
             <div className="p-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">Žádné dotazy</div>
          )}
        </div>

        <div className="lg:col-span-7">
           <AnimatePresence mode="wait">
             {selectedInquiry ? (
               <motion.div key={selectedInquiry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border p-10 space-y-8 min-h-[50vh] relative">
                  <div className="flex justify-between items-center border-b pb-8">
                     <div className="space-y-4 flex-grow pr-10">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <label className="text-[8px] font-black uppercase text-gray-400">Jméno</label>
                              <input type="text" value={editData.name} onChange={e=>setEditData({...editData, name:e.target.value})} className="border p-2 text-sm font-bold w-full"/>
                            </div>
                            <div>
                              <label className="text-[8px] font-black uppercase text-gray-400">Email</label>
                              <input type="text" value={editData.email} onChange={e=>setEditData({...editData, email:e.target.value})} className="border p-2 text-sm font-bold w-full"/>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-xl font-black uppercase text-black">{selectedInquiry.name}</h3>
                            <p className="text-xs font-black text-[#007BFF] uppercase">{selectedInquiry.email}</p>
                          </>
                        )}
                     </div>
                     <div className="flex gap-2 shrink-0">
                        {isEditing ? (
                          <div className="flex gap-2">
                             <button onClick={handleUpdate} className="p-3 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors"><Save size={18}/></button>
                             <button onClick={()=>setIsEditing(false)} className="p-3 bg-gray-100 text-gray-400 rounded-sm hover:text-black transition-colors"><X size={18}/></button>
                          </div>
                        ) : (
                          <button onClick={()=>setIsEditing(true)} className="p-3 bg-gray-50 text-gray-400 hover:text-black rounded-sm transition-colors"><Edit2 size={18}/></button>
                        )}
                        <button onClick={()=>deleteInquiry(selectedInquiry.id)} className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-sm transition-all"><Trash2 size={18}/></button>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-gray-400">Zpráva</label>
                    {isEditing ? (
                      <textarea value={editData.message} onChange={e=>setEditData({...editData, message:e.target.value})} className="w-full border p-6 h-64 text-sm font-medium outline-none focus:border-[#007BFF]"/>
                    ) : (
                      <div className="bg-gray-50 p-8 border text-sm leading-relaxed font-medium whitespace-pre-wrap">
                         {selectedInquiry.message}
                      </div>
                    )}
                  </div>

                  <div className="pt-8 flex justify-between items-center text-[9px] font-black text-gray-300 uppercase tracking-widest">
                     <span>ID: {selectedInquiry.id}</span>
                     <span>Datum: {new Date(selectedInquiry.date).toLocaleString()}</span>
                  </div>
               </motion.div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center bg-gray-50 border border-dashed p-20 text-center">
                  <MessageSquare size={48} className="text-gray-200 mb-6" />
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Vyberte dotaz pro zobrazení detailu</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InquiryManager;
