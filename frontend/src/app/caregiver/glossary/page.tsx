"use client";

import React, { useState } from 'react';
import { BookBookmark, Trash, Plus, TextAa, Quotes } from '@phosphor-icons/react';

export default function GlossaryManager() {
  const [rules, setRules] = useState([
    { id: 1, noun: 'Bobby', definition: "Alex's Golden Retriever dog", active: true },
    { id: 2, pill: 'Blue Pill', definition: "Aspirin (taken at 8am)", active: true },
    { id: 3, place: 'The Lake', definition: "Lake Tahoe summer cabin", active: false },
  ]);

  const [newNoun, setNewNoun] = useState('');
  const [newDef, setNewDef] = useState('');

  const addRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoun && newDef) {
      setRules([{ id: Date.now(), noun: newNoun, definition: newDef, active: true }, ...rules]);
      setNewNoun('');
      setNewDef('');
    }
  };

  const toggleRule = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
      <div>
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Glossary & Strict Rules</h1>
        <p className="text-on-surface-variant text-lg">Hardcode semantic meaning to specific words or phrases to guarantee AI comprehension.</p>
      </div>

      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
         <h2 className="text-2xl font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
          <BookBookmark className="text-secondary" /> Add New Translation Rule
        </h2>

        <form onSubmit={addRule} className="flex gap-4 items-end bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30">
          <div className="flex-1">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><TextAa /> When Patient Selects / Says:</label>
            <input 
              value={newNoun}
              onChange={e => setNewNoun(e.target.value)}
              placeholder='e.g., "Mimi"' 
              className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-xl p-3 focus:ring-2 focus:ring-secondary outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2"><Quotes /> AI Must Understand As:</label>
            <input 
              value={newDef}
              onChange={e => setNewDef(e.target.value)}
              placeholder='e.g., "Grandmother Mary"' 
              className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-xl p-3 focus:ring-2 focus:ring-secondary outline-none"
            />
          </div>
          <button type="submit" disabled={!newNoun || !newDef} className="bg-secondary text-on-secondary h-12 w-12 rounded-xl flex items-center justify-center font-bold hover:bg-secondary/90 disabled:opacity-50 transition-colors">
            <Plus size={24} weight="bold"/>
          </button>
        </form>
      </div>

      <div className="bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
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
                <td className="p-4 font-bold font-headline text-on-surface">"{rule.noun || rule.pill || rule.place}"</td>
                <td className="p-4 text-on-surface-variant">{rule.definition}</td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => toggleRule(rule.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-full w-20 ${rule.active ? 'bg-secondary/20 text-secondary-fixed-dim' : 'bg-surface-variant text-on-surface-variant'}`}
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
                <td colSpan={4} className="p-8 text-center text-on-surface-variant italic">No glossary rules defined.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
