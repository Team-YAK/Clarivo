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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Patient Context Manager</h1>
          <p className="text-on-surface-variant text-lg">Define Kishan&apos;s routines and emotional baselines to grant the AI deeper predictive awareness.</p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold font-headline shadow-lg transition-all text-base min-w-[180px] justify-center
              ${syncState === 'done' ? 'bg-emerald-500 text-white shadow-emerald-200' :
                syncState === 'error' ? 'bg-error text-on-error' :
                syncState === 'syncing' ? 'bg-primary/80 text-on-primary cursor-wait' :
                'bg-primary text-on-primary hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-xl'}`}
          >
            <ArrowsClockwise
              size={22}
              weight="bold"
              className={syncState === 'syncing' ? 'animate-spin' : ''}
            />
            {syncState === 'syncing' ? 'Syncing...' :
             syncState === 'done' ? 'Synced ✓' :
             syncState === 'error' ? 'Retry Sync' :
             'Sync AI'}
          </button>
          <p className="text-xs text-on-surface-variant text-right max-w-[180px] leading-snug">
            Clears prediction cache — next generations use fresh context
          </p>
        </div>
      </div>

      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
        <h2 className="text-2xl font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
          <UserList className="text-primary" /> Daily Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveCategory('needs')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${activeCategory === 'needs' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant'}`}
          >
            <h3 className="font-bold mb-1 w-full flex justify-between">Baselines / Needs {activeCategory === 'needs' && <Check className="text-primary"/>}</h3>
            <p className="text-xs text-on-surface-variant">General preferences and emotional triggers.</p>
          </button>
          <button
            onClick={() => setActiveCategory('meals')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${activeCategory === 'meals' ? 'border-tertiary bg-tertiary/5' : 'border-outline-variant/20 hover:border-outline-variant'}`}
          >
            <h3 className="font-bold mb-1 w-full flex justify-between">Meal Schedule {activeCategory === 'meals' && <Check className="text-tertiary"/>}</h3>
            <p className="text-xs text-on-surface-variant">Expected dietary hours and favorite foods.</p>
          </button>
          <button
            onClick={() => setActiveCategory('meds')}
            className={`p-4 rounded-2xl text-left border-2 transition-all ${activeCategory === 'meds' ? 'border-rose-400 bg-rose-500/10' : 'border-outline-variant/20 hover:border-outline-variant'}`}
          >
            <h3 className="font-bold mb-1 w-full flex justify-between">Medications {activeCategory === 'meds' && <Check className="text-rose-500"/>}</h3>
            <p className="text-xs text-on-surface-variant">Prescriptions to cross-reference against requests.</p>
          </button>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
          <label className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2 pb-4 mb-4 border-b border-outline-variant/20">
            <Tag />
            Add new {activeCategory} tag
          </label>
          <GlassInput
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={addTag}
            placeholder={`Type a rule and press Enter...`}
          />

          <div className="mt-6 flex flex-wrap gap-2 min-h-[100px]">
            <AnimatePresence>
              {(activeCategory === 'needs' ? needs : activeCategory === 'meals' ? meals : meds).map((tag, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={`${tag}-${idx}`}
                  onClick={() => removeTag(activeCategory, idx)}
                  className={`
                    px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 group cursor-pointer shadow-sm border transition-all
                    ${activeCategory === 'needs' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : ''}
                    ${activeCategory === 'meals' ? 'bg-tertiary/10 text-tertiary border-tertiary/20 hover:bg-tertiary/20' : ''}
                    ${activeCategory === 'meds' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' : ''}
                  `}
                >
                  {activeCategory === 'needs' && <Sparkle size={14} weight="fill" className="shrink-0" />}
                  {activeCategory === 'meals' && <ForkKnife size={14} weight="fill" className="shrink-0" />}
                  {activeCategory === 'meds' && <Pill size={14} weight="fill" className="shrink-0" />}
                  {tag}
                  <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity text-current">×</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {(activeCategory === 'needs' ? needs : activeCategory === 'meals' ? meals : meds).length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm italic py-4">
                No active rules in this category.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extraneous Form Fields */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className="font-bold text-on-surface mb-2 block">Caregiver Relationship Mapping</label>
          <GlassTextarea
            rows={5}
            defaultValue={"Wife: Sarah\nSon: Tommy\nDog: Bobby"}
          />
        </div>
        <div>
          <label className="font-bold text-on-surface mb-2 block">Emergency Override Contacts</label>
          <GlassTextarea
            rows={5}
            defaultValue={"Dr. Smith: 555-0199\nSarah Cell: 555-0188"}
          />
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
