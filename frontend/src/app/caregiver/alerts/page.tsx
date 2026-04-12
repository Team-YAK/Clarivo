"use client";

import React, { useState, useEffect } from 'react';
import { BellRinging, DeviceMobile, Envelope, PhoneCall, SlidersHorizontal, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { PageTransition } from '@/components/ui/page-transition';
import { fetchAlertSettings, updateAlertSettings } from '@/utils/caregiverApi';
import { AlertSettings } from '../../../../../shared/api-contract';

export default function AlertsConsole() {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchAlertSettings().then(setSettings).catch(console.error);
  }, []);

  const toggleRoute = (key: keyof AlertSettings['routes']) => {
    if (!settings) return;
    setSettings({
      ...settings,
      routes: { ...settings.routes, [key]: !settings.routes[key] }
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await updateAlertSettings(settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-full" />
          <div className="text-white/40 font-bold uppercase tracking-widest text-xs">Syncing Alert Matrix...</div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl min-h-screen bg-[#050505] text-white p-4 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">Real-Time Alert Console</h1>
          <p className="text-white/60 text-lg">Configure how the system notifies you when Kishan is experiencing acute distress.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center gap-3 ${
            saveStatus === 'success' ? 'bg-emerald-500 text-white' :
            saveStatus === 'error' ? 'bg-red-500 text-white' :
            'bg-[#14F1D9] text-black hover:scale-105 active:scale-95'
          }`}
        >
          {saveStatus === 'saving' ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle size={20} weight="fill" />
          ) : null}
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Configuration Saved' : 'Save Configuration'}
        </button>
      </div>

      <div className="bg-[#050505]/60 rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden liquid-glass-card">
        <h2 className="text-2xl font-bold font-headline text-white mb-6 flex items-center gap-2 z-10 relative">
          <SlidersHorizontal className="text-[#14F1D9]" /> Distress Thresholds
        </h2>
        
        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div>
             <p className="font-bold text-lg mb-1">Trigger an Emergency Alert if...</p>
             <p className="text-sm text-white/50">The AI detects high-frustration sequences.</p>
          </div>
          <div className="flex items-center gap-4 text-xl font-headline font-bold">
            <input 
              type="number" 
              value={settings.threshold} 
              onChange={e => setSettings({...settings, threshold: Number(e.target.value)})}
              className="w-16 bg-white/5 p-2 rounded-xl border border-white/10 text-center outline-none focus:border-[#14F1D9] transition-colors"
            />
            <span className="text-white/40 text-sm uppercase tracking-widest">sessions within</span>
            <input 
              type="number" 
              value={settings.timeframe} 
              onChange={e => setSettings({...settings, timeframe: Number(e.target.value)})}
              className="w-16 bg-white/5 p-2 rounded-xl border border-white/10 text-center outline-none focus:border-[#14F1D9] transition-colors"
            />
            <span className="text-white/40 text-sm uppercase tracking-widest">hours</span>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-4 p-4 bg-[#FF2E63]/10 text-[#FF2E63] rounded-2xl border border-[#FF2E63]/20 z-10 relative shadow-[0_0_20px_rgba(255,46,99,0.15)]">
          <WarningCircle size={24} weight="fill" className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Under this configuration, if Kishan taps <strong>"I am frustrated"</strong> or <strong>"Pain"</strong> {settings.threshold} times within a {settings.timeframe}-hour window, it will instantly ping your selected routing channels.</p>
        </div>
      </div>

      <div className="bg-[#050505]/60 rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden liquid-glass-card">
        <h2 className="text-2xl font-bold font-headline text-white mb-6 flex items-center gap-2 z-10 relative">
          <BellRinging className="text-[#6C5CE7]" /> Notification Routing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10 relative">
          <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-2xl liquid-glass-card bg-transparent border-white/5">
            <button 
              onClick={() => toggleRoute('ui')}
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${settings.routes.ui ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/30' : 'bg-white/5 border-transparent'}`}
            >
              <div className={`p-3 rounded-full ${settings.routes.ui ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
                <BellRinging size={24} weight="fill"/>
              </div>
              <div>
                <h3 className="font-bold text-lg">In-App Banner</h3>
                <p className="text-sm text-white/50">Shows a red takeover screen on the Caregiver Panel.</p>
              </div>
            </button>
          </GlowCard>

          <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-2xl liquid-glass-card bg-transparent border-white/5">
            <button 
              onClick={() => toggleRoute('sms')}
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${settings.routes.sms ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/30' : 'bg-white/5 border-transparent'}`}
            >
              <div className={`p-3 rounded-full ${settings.routes.sms ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
                <DeviceMobile size={24} weight="fill"/>
              </div>
              <div>
                <h3 className="font-bold text-lg">SMS Text Message</h3>
                <p className="text-sm text-white/50">Sends an SMS to 555-0188.</p>
              </div>
            </button>
          </GlowCard>

          <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-2xl liquid-glass-card bg-transparent border-white/5">
            <button 
              onClick={() => toggleRoute('email')}
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${settings.routes.email ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/30' : 'bg-white/5 border-transparent'}`}
            >
              <div className={`p-3 rounded-full ${settings.routes.email ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
                <Envelope size={24} weight="fill"/>
              </div>
              <div>
                <h3 className="font-bold text-lg">Email Alert</h3>
                <p className="text-sm text-white/50">Emails yuki.care@clarivo.app.</p>
              </div>
            </button>
          </GlowCard>

          <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-2xl liquid-glass-card bg-transparent border-white/5">
            <button 
              onClick={() => toggleRoute('call')}
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${settings.routes.call ? 'bg-[#6C5CE7]/10 border-[#6C5CE7]/30' : 'bg-white/5 border-transparent'}`}
            >
              <div className={`p-3 rounded-full ${settings.routes.call ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
                <PhoneCall size={24} weight="fill"/>
              </div>
              <div>
                <h3 className="font-bold text-lg">Automated Voice Call</h3>
                <p className="text-sm text-white/50">Automated call to your emergency contact on trigger.</p>
              </div>
            </button>
          </GlowCard>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
