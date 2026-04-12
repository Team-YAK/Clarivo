"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCaregiverPanel } from '@/utils/caregiverApi';
import { CaregiverPanel } from '../../../../shared/api-contract';
import { Pulse, Brain, WarningCircle, CheckCircle, UserList, BookBookmark, Microphone, ArrowRight } from '@phosphor-icons/react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { PageTransition } from '@/components/ui/page-transition';

export default function CaregiverOverview() {
  const [panelData, setPanelData] = useState<CaregiverPanel | null>(null);

  useEffect(() => {
    fetchCaregiverPanel().then(setPanelData).catch(console.error);
  }, []);

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto py-8 px-4">
      <div>
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Welcome Back, Yuki</h1>
        <p className="text-on-surface-variant text-lg">Here is the current status of Kishan&apos;s communication system.</p>
      </div>

      {panelData?.urgent && (
        <div className="bg-error text-on-error p-6 rounded-3xl shadow-xl flex items-center gap-6">
          <div className="p-3 bg-white/20 rounded-full animate-pulse">
            <WarningCircle size={32} weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-1">Attention Required</h2>
            <p>Kishan has logged multiple distress signals in the past hour. Please check the Session Auditor.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlowCard customSize glowColor="green" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl">
          <div className="p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500" />
            <div className="relative z-10">
              <Brain size={32} className="text-primary mb-4 drop-shadow-sm" weight="duotone" />
              <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Knowledge Accuracy</h3>
              <p className="text-5xl font-headline font-black text-on-surface drop-shadow-sm">{panelData?.knowledge_score || 0}%</p>
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <p className="text-xs text-on-surface-variant"><span className="text-primary font-bold">↑ 2.4%</span> from last week</p>
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl">
          <div className="p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500" />
            <div className="relative z-10">
              <Pulse size={32} className="text-tertiary mb-4 drop-shadow-sm" weight="duotone" />
              <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Sessions Today</h3>
              <p className="text-5xl font-headline font-black text-on-surface drop-shadow-sm">14</p>
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <p className="text-xs text-on-surface-variant">Last session 12 mins ago</p>
              </div>
            </div>
          </div>
        </GlowCard>

        <GlowCard customSize glowColor="blue" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl">
          <div className="p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-125 duration-500" />
            <div className="relative z-10">
              <CheckCircle size={32} className="text-secondary mb-4 drop-shadow-sm" weight="duotone" />
              <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Active Rules</h3>
              <p className="text-5xl font-headline font-black text-on-surface drop-shadow-sm">8</p>
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <p className="text-xs text-on-surface-variant">4 Context rules, 4 Glossary rules</p>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      <div className="rounded-3xl overflow-hidden">
        <GlowCard customSize glowColor="blue" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold font-headline mb-2">Quick Setup Guide</h2>
            <p className="text-on-surface-variant text-sm mb-6">Complete these steps to get the best AI predictions for Kishan.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-6 flex flex-col hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <UserList size={20} weight="duotone" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-primary">Step 1</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-on-surface">Define Patient Context</h3>
                <p className="text-sm text-on-surface-variant mb-5 flex-1">Help the AI understand Kishan&apos;s daily routine, medical history, and emotional triggers to vastly improve prediction accuracy.</p>
                <Link href="/caregiver/context" className="flex items-center gap-2 text-sm font-bold text-primary hover:underline group">
                  Go to Context <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="bg-surface-container-low border border-secondary/20 rounded-2xl p-6 flex flex-col hover:border-secondary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <BookBookmark size={20} weight="duotone" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-secondary">Step 2</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-on-surface">Manage Glossary Rules</h3>
                <p className="text-sm text-on-surface-variant mb-5 flex-1">Hardcode specific nouns (e.g. &quot;Bobby&quot; = &quot;Dog&quot;) so the AI doesn&apos;t have to guess family member names or favorite foods.</p>
                <Link href="/caregiver/glossary" className="flex items-center gap-2 text-sm font-bold text-secondary hover:underline group">
                  Go to Glossary <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="bg-surface-container-low border border-tertiary/20 rounded-2xl p-6 flex flex-col hover:border-tertiary/40 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0">
                    <Microphone size={20} weight="duotone" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-tertiary">Step 3</span>
                </div>
                <h3 className="font-bold text-lg mb-2 text-on-surface">Clone Kishan&apos;s Voice</h3>
                <p className="text-sm text-on-surface-variant mb-5 flex-1">Record a voice sample directly in the browser. The AI will use Kishan&apos;s own voice when reading out generated sentences.</p>
                <Link href="/caregiver/voice" className="flex items-center gap-2 text-sm font-bold text-tertiary hover:underline group">
                  Go to Voice Studio <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>
          </div>
        </GlowCard>
      </div>
    </div>
    </PageTransition>
  );
}
