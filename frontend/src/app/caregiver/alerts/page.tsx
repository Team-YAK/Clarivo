"use client";

import React, { useState } from 'react';
import { BellRinging, DeviceMobile, Envelope, PhoneCall, SlidersHorizontal, WarningCircle } from '@phosphor-icons/react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { PageTransition } from '@/components/ui/page-transition';

export default function AlertsConsole() {
  const [threshold, setThreshold] = useState(3);
  const [timeframe, setTimeframe] = useState(2);
  const [routes, setRoutes] = useState({
    ui: true,
    sms: false,
    email: true,
    call: false
  });

  const toggleRoute = (key: keyof typeof routes) => {
    setRoutes({ ...routes, [key]: !routes[key] });
  };

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl min-h-screen bg-[#050505] text-white p-4">
      <div>
        <h1 className="text-4xl md:text-5xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">Real-Time Alert Console</h1>
        <p className="text-white/60 text-lg">Configure how the system notifies you when Kishan is experiencing acute distress.</p>
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
              value={threshold} 
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-16 bg-white/5 p-2 rounded-xl border border-white/10 text-center outline-none focus:border-[#14F1D9] transition-colors"
            />
            <span className="text-white/40 text-sm uppercase tracking-widest">sessions within</span>
            <input 
              type="number" 
              value={timeframe} 
              onChange={e => setTimeframe(Number(e.target.value))}
              className="w-16 bg-white/5 p-2 rounded-xl border border-white/10 text-center outline-none focus:border-[#14F1D9] transition-colors"
            />
            <span className="text-white/40 text-sm uppercase tracking-widest">hours</span>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-4 p-4 bg-[#FF2E63]/10 text-[#FF2E63] rounded-2xl border border-[#FF2E63]/20 z-10 relative shadow-[0_0_20px_rgba(255,46,99,0.1)]">
          <WarningCircle size={24} weight="fill" className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Under this configuration, if Kishan taps <strong>"I am frustrated"</strong> or <strong>"Pain"</strong> {threshold} times within a {timeframe}-hour window, it will instantly ping your selected routing channels.</p>
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
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${routes.ui ? 'bg-[#6C5CE7]/10' : 'bg-white/5'}`}
            >
              <div className={`p-3 rounded-full ${routes.ui ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
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
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${routes.sms ? 'bg-[#6C5CE7]/10' : 'bg-white/5'}`}
            >
              <div className={`p-3 rounded-full ${routes.sms ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
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
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${routes.email ? 'bg-[#6C5CE7]/10' : 'bg-white/5'}`}
            >
              <div className={`p-3 rounded-full ${routes.email ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
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
              className={`w-full h-full p-6 rounded-2xl flex items-center gap-4 transition-all text-left z-10 relative ${routes.call ? 'bg-[#6C5CE7]/10' : 'bg-white/5'}`}
            >
              <div className={`p-3 rounded-full ${routes.call ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.5)]' : 'bg-white/10 text-white/40'}`}>
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
