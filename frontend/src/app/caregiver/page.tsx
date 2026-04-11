"use client";

import React, { useEffect, useState } from 'react';
import { fetchCaregiverPanel } from '@/utils/caregiverApi';
import { CaregiverPanel } from '../../../../shared/api-contract';
import { Pulse, Brain, WarningCircle, CheckCircle } from '@phosphor-icons/react';

export default function CaregiverOverview() {
  const [panelData, setPanelData] = useState<CaregiverPanel | null>(null);

  useEffect(() => {
    fetchCaregiverPanel().then(setPanelData).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Welcome Back, Yuki</h1>
        <p className="text-on-surface-variant text-lg">Here is the current status of Alex's communication system.</p>
      </div>

      {panelData?.urgent && (
        <div className="bg-error text-on-error p-6 rounded-3xl shadow-xl flex items-center gap-6">
          <div className="p-3 bg-white/20 rounded-full animate-pulse">
            <WarningCircle size={32} weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider mb-1">Attention Required</h2>
            <p>Alex has logged multiple distress signals in the past hour. Please check the Session Auditor.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <Brain size={32} className="text-primary mb-4" weight="duotone" />
          <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Knowledge Accuracy</h3>
          <p className="text-5xl font-headline font-black text-on-surface">{panelData?.knowledge_score || 0}%</p>
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <p className="text-xs text-on-surface-variant"><span className="text-green-600 font-bold">↑ 2.4%</span> from last week</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <Pulse size={32} className="text-tertiary mb-4" weight="duotone" />
          <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Sessions Today</h3>
          <p className="text-5xl font-headline font-black text-on-surface">14</p>
           <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <p className="text-xs text-on-surface-variant">Last session 12 mins ago</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <CheckCircle size={32} className="text-secondary mb-4" weight="duotone" />
          <h3 className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Active Rules</h3>
          <p className="text-5xl font-headline font-black text-on-surface">8</p>
           <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <p className="text-xs text-on-surface-variant">4 Context rules, 4 Glossary rules</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/20">
        <h2 className="text-2xl font-bold font-headline mb-4">Quick Setup Guide</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface-container-highest p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">1. Define Patient Context</h3>
            <p className="text-sm text-on-surface-variant mb-4">Help the AI understand Alex's daily routine, medical history, and emotional triggers to vastly improve prediction accuracy.</p>
          </div>
          <div className="bg-surface-container-highest p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-2">2. Manage Glossary</h3>
            <p className="text-sm text-on-surface-variant mb-4">Hardcode specific nouns (e.g. "Bobby" = "Dog") so the AI doesn't have to guess family member names or favorite foods.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
