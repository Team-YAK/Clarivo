"use client";

import React from 'react';
import VoiceCloneOnboarding from '@/components/caregiver/VoiceCloneOnboarding';

export default function VoiceStudio() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <div>
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Voice Studio</h1>
        <p className="text-on-surface-variant text-lg">Manage the audio identity the AI uses to speak on Alex's behalf.</p>
      </div>

      <VoiceCloneOnboarding />
    </div>
  );
}
