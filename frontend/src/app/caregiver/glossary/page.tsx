"use client";

import React, { useState, useEffect } from 'react';
import { BookBookmark, Trash, Plus, TextAa, Quotes, CheckCircle, Info } from '@phosphor-icons/react';
import { fetchGlossaryRules, addGlossaryRule, deleteGlossaryRule, toggleGlossaryRule, GlossaryRule } from '@/utils/caregiverApi';
import { PageTransition } from '@/components/ui/page-transition';
import { GlassInput } from '@/components/ui/glass-input';

export default function GlossaryManager() {
  const [rules, setRules] = useState<GlossaryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoun, setNewNoun] = useState('');
  const [newDef, setNewDef] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchGlossaryRules().then(r => {
      setRules(r);
      setLoading(false);
    });
  }, []);

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoun.trim() || !newDef.trim()) return;
    setAdding(true);
    const rule = await addGlossaryRule(newNoun.trim(), newDef.trim());
    if (rule) {
      setRules(prev => [rule, ...prev]);
    }
    setNewNoun('');
    setNewDef('');
    setAdding(false);
  };

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    const newActive = !rule.active;
    // Optimistic update
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: newActive } : r));
    await toggleGlossaryRule(id, newActive);
  };

  const deleteRule = async (id: string) => {
    // Optimistic update
    setRules(prev => prev.filter(r => r.id !== id));
    await deleteGlossaryRule(id);
  };

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl min-h-screen bg-[#050505] text-white p-4">
      <div>
        <h1 className="text-4xl md:text-5xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">Glossary & Strict Rules</h1>
        <p className="text-white/60 text-lg">Hardcode semantic meaning to specific words or phrases to guarantee AI comprehension.</p>
      </div>

      {/* LLM Integration Banner */}
      <div className="flex items-start gap-4 p-6 bg-[#14F1D9]/10 border border-[#14F1D9]/20 rounded-3xl text-white shadow-2xl relative overflow-hidden liquid-glass-card">
        <CheckCircle size={28} weight="fill" className="text-[#14F1D9] shrink-0 mt-0.5" />
        <div className="z-10 relative">
          <p className="font-black uppercase tracking-widest text-xs text-[#14F1D9] mb-1">Neural Injection Pipeline</p>
          <p className="text-sm text-white/80 leading-relaxed">
            When Kishan selects a path containing a trigger word, the AI is guaranteed to use your enforced meaning — not its best guess. Inactive rules are ignored.
          </p>
        </div>
      </div>

      <div className="bg-[#050505]/60 rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden liquid-glass-card">
        <h2 className="text-2xl font-bold font-headline text-white mb-8 flex items-center gap-2 z-10 relative">
          <BookBookmark className="text-[#6C5CE7]" /> Add New Translation Rule
        </h2>

        <form onSubmit={addRule} className="flex flex-col md:flex-row gap-6 items-end bg-black/40 p-8 rounded-2xl border border-white/5 z-10 relative">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><TextAa weight="bold" /> When Patient Selects / Says:</label>
            <GlassInput
              value={newNoun}
              onChange={e => setNewNoun(e.target.value)}
              placeholder='e.g., "Mimi"'
              className="!bg-white/5 !border-white/10 focus:!border-[#14F1D9]"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Quotes weight="bold" /> AI Must Understand As:</label>
            <GlassInput
              value={newDef}
              onChange={e => setNewDef(e.target.value)}
              placeholder='e.g., "Grandmother Mary"'
              className="!bg-white/5 !border-white/10 focus:!border-[#14F1D9]"
            />
          </div>
          <button
            type="submit"
            disabled={!newNoun.trim() || !newDef.trim() || adding}
            className="bg-[#14F1D9] text-black h-14 w-14 rounded-2xl flex items-center justify-center font-bold hover:bg-[#14F1D9]/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(20,241,217,0.3)] hover:-translate-y-1 shrink-0"
          >
            {adding ? (
              <span className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Plus size={28} weight="bold" />
            )}
          </button>
        </form>
      </div>

      <div className="bg-[#050505]/60 rounded-3xl border border-white/10 shadow-2xl overflow-hidden liquid-glass-card">
        {loading ? (
          <div className="p-20 flex justify-center">
            <span className="w-10 h-10 border-4 border-white/10 border-t-[#14F1D9] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse z-10 relative">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40 w-1/4">Trigger Word</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40 w-1/2">Enforced Meaning</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40 text-center w-32">Status</th>
                  <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className={`border-b border-white/5 transition-all hover:bg-white/5 ${!rule.active ? 'opacity-40' : ''}`}>
                    <td className="p-6 font-bold font-headline text-white text-lg">&quot;{rule.trigger_word}&quot;</td>
                    <td className="p-6 text-white/70 font-medium">{rule.enforced_meaning}</td>
                    <td className="p-6 text-center">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`px-4 py-1.5 text-[10px] font-black tracking-widest rounded-full w-24 transition-all border ${rule.active ? 'bg-[#14F1D9]/10 text-[#14F1D9] border-[#14F1D9]/30 hover:bg-[#14F1D9]/20 shadow-[0_0_15px_rgba(20,241,217,0.1)]' : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'}`}
                      >
                        {rule.active ? 'ACTIVE' : 'OFF'}
                      </button>
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => deleteRule(rule.id)} className="p-3 text-white/30 hover:text-[#FF2E63] hover:bg-[#FF2E63]/10 rounded-xl transition-all">
                        <Trash size={24} weight="fill" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-500">
                        <div className="p-8 bg-white/5 rounded-full border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                          <BookBookmark size={64} className="text-white/10" weight="duotone" />
                        </div>
                        <div>
                          <p className="font-headline font-black text-2xl text-white mb-2 tracking-tight">Glossary is Empty</p>
                          <p className="text-white/30 text-sm font-medium uppercase tracking-widest">Add semantic rules to bridge comprehension gaps</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
