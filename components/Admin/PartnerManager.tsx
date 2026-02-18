
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search, Briefcase, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataStore } from '../../lib/db';

interface Partner {
  id: string;
  name: string;
}

const PartnerManager: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    // Try to migrate from old localStorage key
    const oldData = localStorage.getItem('jakub_minka_partners');
    if (oldData) {
      const oldPartners = JSON.parse(oldData);
      for (const partner of oldPartners) {
        await dataStore.collection('partners').save(partner);
      }
      localStorage.removeItem('jakub_minka_partners'); // Remove old data
    }

    // Load from dataStore
    const saved = await dataStore.collection('partners').getAll({ force: true });
    if (saved && saved.length > 0) {
      setPartners(saved.sort((a:any, b:any) => a.name.localeCompare(b.name)));
    }
  };

  useEffect(() => { loadData(); }, []);

  const savePartner = async (partner: Partner) => {
    await dataStore.collection('partners').save(partner);
    await loadData();
  };

  const deletePartner = async (id: string) => {
    await dataStore.collection('partners').delete(id);
    await loadData();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const deleteBulk = async () => {
    if (!confirm('Smazat vybrané partnery?')) return;
    for (const id of Array.from(selectedIds)) {
      await dataStore.collection('partners').delete(id);
    }
    setSelectedIds(new Set());
    await loadData();
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName) {
      await savePartner({
        id: Math.random().toString(),
        name: newName
      });
      setNewName('');
    }
  };

  const handleUpdate = async (id: string, name: string) => {
    const partner = partners.find(p => p.id === id);
    if (partner) {
      await savePartner({ ...partner, name });
      setIsEditing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Smazat tohoto partnera?')) {
      await deletePartner(id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 border flex flex-wrap items-center justify-between gap-6">
        <form onSubmit={handleAddPartner} className="flex-grow max-w-xl flex gap-4">
           <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Název partnera..." className="flex-grow border-2 border-gray-100 p-4 text-sm font-bold" />
           <button type="submit" className="bg-[#007BFF] text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest"><Plus size={16} className="inline mr-2"/> Přidat</button>
        </form>
        {selectedIds.size > 0 && (
          <button onClick={deleteBulk} className="bg-red-600 text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest"><Trash2 size={16} className="inline mr-2"/> Smazat vybrané ({selectedIds.size})</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {partners.map(p => (
          <div key={p.id} className="bg-white p-6 border border-gray-100 flex items-center justify-between group hover:border-[#007BFF] transition-all relative">
            <div className="flex items-center gap-4">
               <button onClick={()=>toggleSelect(p.id)}>{selectedIds.has(p.id) ? <CheckSquare className="text-[#007BFF]" size={18}/> : <Square className="text-gray-200" size={18}/>}</button>
               {isEditing === p.id ? (
                 <input type="text" defaultValue={p.name} autoFocus onBlur={(e)=>{handleUpdate(p.id, e.target.value);}} className="font-bold border-b-2 border-[#007BFF] outline-none text-sm w-32 uppercase" />
               ) : (
                 <span className="text-sm font-black uppercase tracking-tight text-black">{p.name}</span>
               )}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={()=>setIsEditing(p.id)} className="p-2 text-gray-300 hover:text-[#007BFF]"><Edit2 size={16}/></button>
               <button onClick={()=>handleDelete(p.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerManager;
