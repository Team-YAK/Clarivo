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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
      <div>
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Glossary & Strict Rules</h1>
        <p className="text-on-surface-variant text-lg">Hardcode semantic meaning to specific words or phrases to guarantee AI comprehension.</p>
      </div>

      {/* LLM Integration Banner */}
      <div className="flex items-start gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
        <CheckCircle size={22} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm mb-0.5">Active rules are injected into every AI generation</p>
          <p className="text-sm text-emerald-500/80 opacity-90">
            When Kishan selects a path containing a trigger word, the AI is guaranteed to use your enforced meaning — not its best guess. Inactive rules are ignored.
          </p>
        </div>
      </div>

      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
        <h2 className="text-2xl font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
          <BookBookmark className="text-secondary" /> Add New Translation Rule
        </h2>

        <form onSubmit={addRule} className="flex gap-4 items-end bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30">
          <div className="flex-1">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><TextAa /> When Patient Selects / Says:</label>
            <GlassInput
              value={newNoun}
              onChange={e => setNewNoun(e.target.value)}
              placeholder='e.g., "Mimi"'
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><Quotes /> AI Must Understand As:</label>
            <GlassInput
              value={newDef}
              onChange={e => setNewDef(e.target.value)}
              placeholder='e.g., "Grandmother Mary"'
            />
          </div>
          <button
            type="submit"
            disabled={!newNoun.trim() || !newDef.trim() || adding}
            className="bg-secondary text-on-secondary h-12 w-12 rounded-xl flex items-center justify-center font-bold hover:bg-secondary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {adding ? (
              <span className="w-4 h-4 border-2 border-on-secondary/40 border-t-on-secondary rounded-full animate-spin" />
            ) : (
              <Plus size={24} weight="bold" />
            )}
          </button>
        </form>
      </div>

      <div className="bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest border-b border-outline-variant/30">
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-on-surface-variant w-1/4">Trigger Word</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-on-surface-variant w-1/2">Enforced Meaning</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-on-surface-variant text-center w-24">Status</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className={`border-b border-outline-variant/10 transition-colors hover:bg-surface-container-high ${!rule.active ? 'opacity-50' : ''}`}>
                  <td className="p-4 font-bold font-headline text-on-surface">&quot;{rule.trigger_word}&quot;</td>
                  <td className="p-4 text-on-surface-variant">{rule.enforced_meaning}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-full w-20 transition-colors ${rule.active ? 'bg-secondary/20 text-secondary hover:bg-secondary/30' : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'}`}
                    >
                      {rule.active ? 'ACTIVE' : 'OFF'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => deleteRule(rule.id)} className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                      <Trash size={20} weight="fill" />
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center bg-surface-container-lowest">
                    <div className="flex flex-col items-center justify-center gap-4 animate-in zoom-in duration-500">
                      <div className="p-6 bg-surface-container rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                        <BookBookmark size={48} className="text-outline-variant" weight="duotone" />
                      </div>
                      <div>
                        <p className="font-headline font-black text-xl text-on-surface mb-1">Glossary is Empty</p>
                        <p className="text-on-surface-variant text-sm font-medium">Add semantic rules using the panel above to enforce AI comprehension.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
