"use client";

import React, { useState } from 'react';
import { BellRinging, DeviceMobile, Envelope, PhoneCall, SlidersHorizontal, WarningCircle } from '@phosphor-icons/react';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <div>
        <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Real-Time Alert Console</h1>
        <p className="text-on-surface-variant text-lg">Configure how the system notifies you when Alex is experiencing acute distress.</p>
      </div>

      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
        <h2 className="text-2xl font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
          <SlidersHorizontal className="text-primary" /> Distress Thresholds
        </h2>
        
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
             <p className="font-bold text-lg mb-1">Trigger an Emergency Alert if...</p>
             <p className="text-sm text-on-surface-variant">The AI detects high-frustration sequences.</p>
          </div>
          <div className="flex items-center gap-4 text-xl font-headline font-bold">
            <input 
              type="number" 
              value={threshold} 
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-16 bg-surface p-2 rounded-xl border border-outline-variant text-center outline-none focus:border-primary"
            />
            <span className="text-on-surface-variant text-sm uppercase">sessions occur within</span>
            <input 
              type="number" 
              value={timeframe} 
              onChange={e => setTimeframe(Number(e.target.value))}
              className="w-16 bg-surface p-2 rounded-xl border border-outline-variant text-center outline-none focus:border-primary"
            />
            <span className="text-on-surface-variant text-sm uppercase">hours</span>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-4 p-4 bg-error/10 text-error rounded-2xl border border-error/20">
          <WarningCircle size={24} weight="fill" className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Under this configuration, if Alex taps <strong>"I am frustrated"</strong> or <strong>"Pain"</strong> {threshold} times within a {timeframe}-hour window, it will instantly ping your selected routing channels.</p>
        </div>
      </div>

      <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
        <h2 className="text-2xl font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
          <BellRinging className="text-tertiary" /> Notification Routing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => toggleRoute('ui')}
            className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${routes.ui ? 'border-tertiary bg-tertiary/10' : 'border-outline-variant/20 hover:border-outline-variant/50'}`}
          >
            <div className={`p-3 rounded-full ${routes.ui ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <BellRinging size={24} weight="fill"/>
            </div>
            <div>
              <h3 className="font-bold text-lg">In-App Banner</h3>
              <p className="text-sm text-on-surface-variant">Shows a red takeover screen on the Caregiver Panel.</p>
            </div>
          </button>

          <button 
            onClick={() => toggleRoute('sms')}
            className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${routes.sms ? 'border-tertiary bg-tertiary/10' : 'border-outline-variant/20 hover:border-outline-variant/50'}`}
          >
            <div className={`p-3 rounded-full ${routes.sms ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <DeviceMobile size={24} weight="fill"/>
            </div>
            <div>
              <h3 className="font-bold text-lg">SMS Text Message</h3>
              <p className="text-sm text-on-surface-variant">Sends an SMS to 555-0188.</p>
            </div>
          </button>

          <button 
            onClick={() => toggleRoute('email')}
            className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${routes.email ? 'border-tertiary bg-tertiary/10' : 'border-outline-variant/20 hover:border-outline-variant/50'}`}
          >
            <div className={`p-3 rounded-full ${routes.email ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <Envelope size={24} weight="fill"/>
            </div>
            <div>
              <h3 className="font-bold text-lg">Email Alert</h3>
              <p className="text-sm text-on-surface-variant">Emails yuki.care@clarivo.app.</p>
            </div>
          </button>

          <button 
            onClick={() => toggleRoute('call')}
            className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${routes.call ? 'border-tertiary bg-tertiary/10' : 'border-outline-variant/20 hover:border-outline-variant/50'}`}
          >
            <div className={`p-3 rounded-full ${routes.call ? 'bg-tertiary text-on-tertiary' : 'bg-surface-variant text-on-surface-variant'}`}>
              <PhoneCall size={24} weight="fill"/>
            </div>
            <div>
              <h3 className="font-bold text-lg">Automated Voice Call</h3>
              <p className="text-sm text-on-surface-variant">Requires Emergency plan upgrade.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
