import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIconComponent } from '@/utils/iconMap';
import { CheckCircle, Backspace } from '@phosphor-icons/react';
import SentenceOutput from './SentenceOutput';

const dummyIcons = [
  { name: 'PersonArmsSpread', label: 'I' },
  { name: 'Heart', label: 'Want' },
  { name: 'House', label: 'Home' },
  { name: 'Bed', label: 'Rest' },
  { name: 'ForkKnife', label: 'Eat' },
];

export default function IconComposer() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleAdd = (label: string) => {
    setSelected([...selected, label]);
  };

  const handleRemove = () => {
    setSelected(selected.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-low p-8 rounded-3xl">
      <h2 className="text-2xl font-headline font-bold text-on-surface mb-6">Icon Composer</h2>
      
      {/* Icon Grid */}
      <div className="grid grid-cols-5 gap-4 mb-auto">
        {dummyIcons.map(icon => {
          const IconComp = getIconComponent(icon.name);
          return (
            <motion.button
              key={icon.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAdd(icon.label)}
              className="flex flex-col items-center p-6 bg-surface rounded-2xl shadow-sm border border-outline-variant/20 hover:border-primary transition-all"
            >
              <IconComp size={48} className="text-primary mb-2" />
              <span className="font-bold text-sm text-on-surface-variant">{icon.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Sentence Tray */}
      <div className="flex items-center gap-4 bg-surface p-6 rounded-[2rem] shadow-[inset_0_4px_10px_rgba(0,0,0,0.05)] border border-outline-variant/10 mt-8 min-h-[120px]">
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          {selected.length === 0 ? (
            <span className="text-on-surface-variant/50 font-bold italic text-lg px-4">Select icons to build a sentence...</span>
          ) : (
            selected.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                key={i} 
                className="px-6 py-3 bg-primary-container text-on-primary-container font-black text-xl rounded-xl"
              >
                {item}
              </motion.div>
            ))
          )}
        </div>
        
        <button 
          onClick={handleRemove}
          disabled={selected.length === 0}
          className="p-4 text-error hover:bg-error/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
        >
          <Backspace size={32} weight="fill" />
        </button>

        <button 
          onClick={() => setIsSynthesizing(true)}
          disabled={selected.length === 0}
          className="bg-primary text-on-primary flex items-center justify-center gap-2 px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all font-bold text-xl disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-lg shrink-0"
        >
          <CheckCircle size={28} weight="bold" /> Generate
        </button>
      </div>

      <AnimatePresence>
        {isSynthesizing && (
          <SentenceOutput 
            path={selected}
            onClose={() => { setIsSynthesizing(false); setSelected([]); }}
            onSpeak={() => console.log('Speaking generated intent')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
