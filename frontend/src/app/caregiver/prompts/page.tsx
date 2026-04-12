"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, Sparkle, MagicWand, HardDrive, CheckCircle, Warning, ArrowClockwise, Info } from '@phosphor-icons/react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { PageTransition } from '@/components/ui/page-transition';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';
const DATA_URL = process.env.NEXT_PUBLIC_DATA_URL || 'http://localhost:8002';
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || 'alex_demo';

interface Prompt {
  prompt_id: string;
  content: string;
  description: string;
  updated_at?: string;
}

const DEFAULT_PROMPTS = [
  {
    id: 'generation_sys',
    name: 'Generation System',
    description: 'Dictates the core logic for generating next-level navigation options.',
    default: 'You generate the next semantic navigation options for Clarivo, an aphasia communication system. Output JSON only with schema: {"quick_option":{"label":"...","concept":"...","key":"..."},"options":[{"label":"...","concept":"...","key":"..."}]}. Rules: labels must be 1 word, rarely 2 words max. Keys must be kebab-case semantic identifiers. No subtitles, no long phrases, no questions, no punctuation-heavy text. No canned AAC categories, no fixed menu sets, no resets to root, no generic top-level buckets unless the context truly demands them. Treat the current path as an evolving meaning sequence, not a tree hierarchy. Return 4-10 options that continue the current meaning.'
  },
  {
    id: 'generation_hu',
    name: 'Generation Human (Instructions)',
    description: 'Provides behavioral constraints and signal weighting for option selection.',
    default: 'Use only these signals, in this priority order:\n1) Current conversation utterances\n2) Current navigation path\n3) Past choices and preferences with lighter weight\n\nBehavior requirements:\n- Every option must feel like a semantic continuation of the current path.\n- Do not emit generic resets or hidden default menus.\n- The quick option should be the single most probable next concept.\n- Any concept can lead to any other concept if semantically relevant.'
  },
  {
    id: 'icon_sys',
    name: 'Icon/Emoji System',
    description: 'Guides the AI in picking the perfect, unique emoji combinations for concepts.',
    default: 'You are an expert Emoji Communicator for an aphasia communication app. Your critical goal is to convey the exact meaning of each concept to patients using ONLY emojis. Because patients with aphasia rely heavily on visual cues, your emoji combinations must be highly expressive, clear, and unmistakable.\nCRITICAL RULES:\n1. Each value MUST be exactly 1 to 3 emoji characters combined (no text, no spaces, no punctuation).\n2. ZERO duplicates allowed.\n3. COMBINE 2 to 3 emojis to create clearer meanings.'
  }
];

export default function PromptArchitect() {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [status, setStatus] = useState<{ id: string, type: 'success' | 'error', msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState(DEFAULT_PROMPTS[0].id);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await fetch(`${DATA_URL}/api/prompts?user_id=${DEFAULT_USER_ID}`);
      const data = await res.json();
      const mapped: Record<string, string> = {};
      data.prompts?.forEach((p: Prompt) => {
        mapped[p.prompt_id] = p.content;
      });
      
      // Fill in defaults if missing
      const final: Record<string, string> = {};
      DEFAULT_PROMPTS.forEach(dp => {
        final[dp.id] = mapped[dp.id] || dp.default;
      });
      
      setPrompts(final);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    setStatus(null);
    try {
      const res = await fetch(`${DATA_URL}/api/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: DEFAULT_USER_ID,
          prompt_id: id,
          content: prompts[id]
        })
      });
      
      if (res.ok) {
        setStatus({ id, type: 'success', msg: 'Prompt persisted to Obsidian-Core' });
      } else {
        setStatus({ id, type: 'error', msg: 'Failed to update remote prompt' });
      }
    } catch (err) {
      setStatus({ id, type: 'error', msg: 'Network failure during persistence' });
    } finally {
      setSaving(null);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const activePrompt = DEFAULT_PROMPTS.find(p => p.id === activeTab);

  return (
    <PageTransition>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#14F1D9]/10 rounded-xl">
                <MagicWand className="text-[#14F1D9]" size={24} />
              </div>
              <h1 className="text-4xl md:text-5xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">Prompt Architect</h1>
            </div>
            <p className="text-white/60 text-lg max-w-2xl font-medium">Fine-tune the neural instructions that govern how Clarivo generates meaning for Kishan.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-[#14F1D9] to-blue-500 flex items-center justify-center text-[10px] font-black italic">GPT</div>
                ))}
             </div>
             <div className="text-[10px] uppercase tracking-widest font-black text-white/40">
                Connected to <span className="text-white">o1-preview</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-4 space-y-3">
            {DEFAULT_PROMPTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={cn(
                  "w-full text-left p-5 rounded-3xl transition-all duration-300 border group relative overflow-hidden",
                  activeTab === p.id 
                    ? "bg-white/10 border-[#14F1D9]/40 shadow-[0_0_30px_rgba(20,241,217,0.1)]" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                )}
              >
                {activeTab === p.id && (
                  <motion.div 
                    layoutId="active-bg"
                    className="absolute inset-0 bg-gradient-to-br from-[#14F1D9]/5 to-transparent pointer-events-none"
                  />
                )}
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "p-3 rounded-2xl transition-all duration-300",
                    activeTab === p.id ? "bg-[#14F1D9] text-black" : "bg-white/5 text-white/40 group-hover:text-white"
                  )}>
                    {p.id.includes('icon') ? <Sparkle size={22} weight="fill" /> : <Cpu size={22} weight="fill" />}
                  </div>
                  <div>
                    <h3 className={cn("font-bold text-sm tracking-tight", activeTab === p.id ? "text-white" : "text-white/60")}>{p.name}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">{p.id}</p>
                  </div>
                </div>
              </button>
            ))}

            <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-[#6C5CE7]/10 to-transparent border border-[#6C5CE7]/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Info size={120} weight="fill" />
               </div>
               <h4 className="font-bold text-[#6C5CE7] mb-2 flex items-center gap-2">
                 <Info size={20} /> Pro Tip
               </h4>
               <p className="text-sm text-white/50 leading-relaxed">
                 Use the **Instruction Prompt** to adjust how aggressive the AI is with session-specific context. For example, adding "Prioritize morning medications" will skew options during AM hours.
               </p>
            </div>
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GlowCard customSize className="!p-8 rounded-[40px] liquid-glass-card shadow-3xl min-h-[600px] flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-headline font-black text-white group flex items-center gap-2">
                        {activePrompt?.name}
                        <div className="w-2 h-2 rounded-full bg-[#14F1D9] animate-pulse" />
                      </h2>
                      <p className="text-white/40 text-sm mt-1">{activePrompt?.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                        onClick={() => fetchPrompts()}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-2xl transition-all border border-white/10"
                        title="Revert constant default"
                       >
                          <ArrowClockwise size={20} />
                       </button>
                       <button 
                         onClick={() => handleSave(activeTab)}
                         disabled={saving === activeTab}
                         className="flex items-center gap-3 px-8 py-3 bg-[#14F1D9] hover:bg-[#00d4bd] text-black font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(20,241,217,0.3)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                       >
                         {saving === activeTab ? <ArrowClockwise size={18} className="animate-spin" /> : <HardDrive size={18} weight="fill" />}
                         {saving === activeTab ? 'Committing...' : 'Persist Changes'}
                       </button>
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <textarea
                      value={prompts[activeTab] || ''}
                      onChange={(e) => setPrompts({ ...prompts, [activeTab]: e.target.value })}
                      className="w-full h-full min-h-[400px] bg-black/40 text-white/90 p-8 rounded-3xl border border-white/5 focus:border-[#14F1D9]/30 outline-none font-mono text-sm leading-relaxed resize-none shadow-inner"
                      placeholder="Enter system instructions..."
                    />
                    
                    <AnimatePresence>
                      {status && status.id === activeTab && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={cn(
                            "absolute bottom-4 right-4 px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-2xl backdrop-blur-2xl",
                            status.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                          )}
                        >
                          {status.type === 'success' ? <CheckCircle size={20} weight="fill" /> : <Warning size={20} weight="fill" />}
                          <span className="font-bold text-sm tracking-tight">{status.msg}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-8 flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <Sparkle size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">Token Estimate</p>
                          <p className="font-bold text-sm">~{(prompts[activeTab]?.length || 0) / 4} tokens</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] uppercase font-black text-[#14F1D9] tracking-widest leading-none mb-1">Status</p>
                       <p className="font-bold text-sm text-white/80">Live in Deployment</p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
