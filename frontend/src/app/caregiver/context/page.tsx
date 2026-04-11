"use client";

import React, { useState } from 'react';
import { UserList, Check, Plus, Tag, CloudArrowUp } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientContextManager() {
  const [saving, setSaving] = useState(false);
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

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Patient Context Manager</h1>
          <p className="text-on-surface-variant text-lg">Define Alex's routines and emotional baselines to grant the AI deeper predictive awareness.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold font-headline shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all w-40 justify-center"
        >
          {saving ? 'Saving...' : <><CloudArrowUp size={24} weight="bold" /> Sync AI</>}
        </button>
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
            className={`p-4 rounded-2xl text-left border-2 transition-all ${activeCategory === 'meds' ? 'border-error bg-error/5' : 'border-outline-variant/20 hover:border-outline-variant'}`}
          >
            <h3 className="font-bold mb-1 w-full flex justify-between">Medications {activeCategory === 'meds' && <Check className="text-error"/>}</h3>
            <p className="text-xs text-on-surface-variant">Prescriptions to cross-reference against requests.</p>
          </button>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
          <label className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2 pb-4 mb-4 border-b border-outline-variant/20">
            <Tag />
            Add new {activeCategory} tag
          </label>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={addTag}
            placeholder={`Type a rule and press Enter...`}
            className="w-full bg-surface-variant/30 border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container focus:bg-surface-container-lowest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder:text-on-surface-variant/50 focus:placeholder:text-transparent hover:bg-surface-variant/50"
          />

          <div className="mt-6 flex flex-wrap gap-2 min-h-[100px]">
             <AnimatePresence>
              {(activeCategory === 'needs' ? needs : activeCategory === 'meals' ? meals : meds).map((tag, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={`${tag}-${idx}`}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 group cursor-pointer
                    ${activeCategory === 'needs' ? 'bg-primary/10 text-primary-fixed-dim hover:bg-primary/20' : ''}
                    ${activeCategory === 'meals' ? 'bg-tertiary/10 text-tertiary-fixed-dim hover:bg-tertiary/20' : ''}
                    ${activeCategory === 'meds' ? 'bg-error/10 text-error hover:bg-error/20' : ''}
                  `}
                  onClick={() => removeTag(activeCategory, idx)}
                >
                  {tag}
                  <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity">×</span>
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
          <textarea 
            rows={5} 
            className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:border-outline-variant"
            defaultValue={"Wife: Sarah\nSon: Tommy\nDog: Bobby"}
          ></textarea>
        </div>
        <div>
          <label className="font-bold text-on-surface mb-2 block">Emergency Override Contacts</label>
          <textarea 
            rows={5} 
            className="w-full bg-surface-container border border-outline-variant/30 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:border-outline-variant"
            defaultValue={"Dr. Smith: 555-0199\nSarah Cell: 555-0188"}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
