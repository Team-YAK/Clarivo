"use client";

import React, { useState } from 'react';
import { UserList, Check, Tag, CloudArrowUp, ArrowsClockwise, Pill, ForkKnife, Sparkle } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { syncAI } from '@/utils/caregiverApi';
import { PageTransition } from '@/components/ui/page-transition';
import { GlassInput, GlassTextarea } from '@/components/ui/glass-input';

export default function PatientContextManager() {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [needs, setNeeds] = useState(['Prefers quiet environments', 'Needs water with pills']);
  const [meals, setMeals] = useState(['Breakfast 8:00 AM', 'Lunch 12:30 PM']);
  const [meds, setMeds] = useState(['Ibuprofen prn', 'Aspirin daily']);
  const [inputValue, setInputValue] = useState('');
  const [activeCategory, setActiveCategory] = useState<'needs' | 'meals' | 'meds'>('needs');

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (activeCategory === 'needs') setNeeds([...needs, inputValue.trim()]);
      if (activeCategory === 'meals') setMeals([...meals, inputValue.trim()]);
      if (activeCategory === 'meds') setMeds([...meds, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (category: string, index: number) => {
    if (category === 'needs') setNeeds(needs.filter((_, i) => i !== index));
    if (category === 'meals') setMeals(meals.filter((_, i) => i !== index));
    if (category === 'meds') setMeds(meds.filter((_, i) => i !== index));
  };

  const handleSync = async () => {
    setSyncState('syncing');
    try {
      const result = await syncAI();
      if (result.success) {
        setSyncState('done');
        setTimeout(() => setSyncState('idle'), 2500);
      } else {
        setSyncState('error');
        setTimeout(() => setSyncState('idle'), 2500);
      }
    } catch {
      setSyncState('error');
      setTimeout(() => setSyncState('idle'), 2500);
    }
  };

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl min-h-screen bg-[#050505] text-white p-4">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">Patient Context</h1>
          <p className="text-white/60 text-lg">Define Kishan&apos;s routines and emotional baselines to grant the AI deeper predictive awareness.</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all min-w-[180px] justify-center
              ${syncState === 'done' ? 'bg-[#14F1D9] text-black shadow-[0_0_20px_rgba(20,241,217,0.4)]' :
                syncState === 'error' ? 'bg-[#FF2E63] text-white' :
                syncState === 'syncing' ? 'bg-white/10 text-white/40 cursor-wait' :
                'bg-[#6C5CE7] text-white hover:bg-[#6C5CE7]/90 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(108,92,231,0.4)]'}`}
          >
            <ArrowsClockwise
              size={20}
              weight="bold"
              className={syncState === 'syncing' ? 'animate-spin' : ''}
            />
            {syncState === 'syncing' ? 'Syncing...' :
             syncState === 'done' ? 'Synced ✓' :
             syncState === 'error' ? 'Retry' :
             'Sync AI'}
          </button>
          <p className="text-[10px] text-white/30 text-right max-w-[180px] font-bold uppercase tracking-tighter">
            Updates neural prediction cache
          </p>
        </div>
      </div>

      <div className="bg-[#050505]/60 rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden liquid-glass-card">
        <h2 className="text-2xl font-bold font-headline text-white mb-8 flex items-center gap-2 z-10 relative">
          <UserList className="text-[#14F1D9]" /> Daily Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 z-10 relative">
          <button
            onClick={() => setActiveCategory('needs')}
            className={`p-5 rounded-2xl text-left border transition-all ${activeCategory === 'needs' ? 'border-[#14F1D9] bg-[#14F1D9]/10 shadow-[0_0_20px_rgba(20,241,217,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
          >
            <h3 className="font-bold text-sm mb-2 w-full flex justify-between uppercase tracking-widest">Baselines {activeCategory === 'needs' && <Check className="text-[#14F1D9]"/>}</h3>
            <p className="text-xs text-white/40 leading-relaxed">General preferences and emotional triggers.</p>
          </button>
          <button
            onClick={() => setActiveCategory('meals')}
            className={`p-5 rounded-2xl text-left border transition-all ${activeCategory === 'meals' ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-[0_0_20px_rgba(108,92,231,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
          >
            <h3 className="font-bold text-sm mb-2 w-full flex justify-between uppercase tracking-widest">Meal Schedule {activeCategory === 'meals' && <Check className="text-[#6C5CE7]"/>}</h3>
            <p className="text-xs text-white/40 leading-relaxed">Expected dietary hours and favorite foods.</p>
          </button>
          <button
            onClick={() => setActiveCategory('meds')}
            className={`p-5 rounded-2xl text-left border transition-all ${activeCategory === 'meds' ? 'border-[#FF2E63] bg-[#FF2E63]/10 shadow-[0_0_20px_rgba(255,46,99,0.1)]' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
          >
            <h3 className="font-bold text-sm mb-2 w-full flex justify-between uppercase tracking-widest">Medications {activeCategory === 'meds' && <Check className="text-[#FF2E63]"/>}</h3>
            <p className="text-xs text-white/40 leading-relaxed">Prescriptions to cross-reference against requests.</p>
          </button>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-2xl p-8 z-10 relative">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 pb-4 mb-6 border-b border-white/5">
            <Tag weight="bold" />
            Add new {activeCategory} tag
          </label>
          <GlassInput
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={addTag}
            placeholder={`Type a rule and press Enter...`}
            className="!bg-white/5 !border-white/10 focus:!border-[#14F1D9] !text-white !py-4"
          />

          <div className="mt-8 flex flex-wrap gap-3 min-h-[120px]">
            <AnimatePresence>
              {(activeCategory === 'needs' ? needs : activeCategory === 'meals' ? meals : meds).map((tag, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={`${tag}-${idx}`}
                  onClick={() => removeTag(activeCategory, idx)}
                  className={`
                    px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-3 group cursor-pointer shadow-lg border transition-all
                    ${activeCategory === 'needs' ? 'bg-[#14F1D9]/10 text-[#14F1D9] border-[#14F1D9]/20 hover:bg-[#14F1D9]/20' : ''}
                    ${activeCategory === 'meals' ? 'bg-[#6C5CE7]/10 text-[#6C5CE7] border-[#6C5CE7]/20 hover:bg-[#6C5CE7]/20' : ''}
                    ${activeCategory === 'meds' ? 'bg-[#FF2E63]/10 text-[#FF2E63] border-[#FF2E63]/20 hover:bg-[#FF2E63]/20' : ''}
                  `}
                >
                  {activeCategory === 'needs' && <Sparkle size={16} weight="fill" className="shrink-0" />}
                  {activeCategory === 'meals' && <ForkKnife size={16} weight="fill" className="shrink-0" />}
                  {activeCategory === 'meds' && <Pill size={16} weight="fill" className="shrink-0" />}
                  <span className="tracking-tight">{tag}</span>
                  <span className="opacity-40 group-hover:opacity-100 font-black transition-opacity text-lg ml-1 leading-none">×</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {(activeCategory === 'needs' ? needs : activeCategory === 'meals' ? meals : meds).length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/20 text-sm py-8 gap-2">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10" />
                <span className="font-bold uppercase tracking-widest text-[10px]">No active rules</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extraneous Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#050505]/60 p-6 rounded-3xl border border-white/10 shadow-xl liquid-glass-card">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 block z-10 relative">Caregiver Relationship Mapping</label>
          <GlassTextarea
            rows={5}
            defaultValue={"Wife: Sarah\nSon: Tommy\nDog: Bobby"}
            className="!bg-black/40 !border-white/5 !text-white/80 z-10 relative"
          />
        </div>
        <div className="bg-[#050505]/60 p-6 rounded-3xl border border-white/10 shadow-xl liquid-glass-card">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 block z-10 relative">Emergency Override Contacts</label>
          <GlassTextarea
            rows={5}
            defaultValue={"Dr. Smith: 555-0199\nSarah Cell: 555-0188"}
            className="!bg-black/40 !border-white/5 !text-white/80 z-10 relative"
          />
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
