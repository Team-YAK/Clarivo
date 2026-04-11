"use client";

import React from 'react';
import ButtonGrid from '@/components/patient/ButtonGrid';
import CaregiverPanel from '@/components/caregiver/CaregiverPanel';
import { Bell, UserCircle } from '@phosphor-icons/react';

export default function PatientScreen() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full h-16 flex items-center justify-between px-8 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm z-50">
        <div className="flex items-center gap-6">
          <span className="text-2xl font-black text-teal-900 dark:text-teal-100 tracking-tight font-headline">Clarivo</span>
          {/* Top nav intentionally hidden in Patient View to respect aphasia zero-text requirements */}
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:bg-teal-50 rounded-full transition-colors">
            <Bell size={24} weight="fill" />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-teal-50 rounded-full transition-colors">
            <UserCircle size={28} weight="fill" />
          </button>
        </div>
      </header>

      {/* Main Content Area w/ Exact 70/30 Fixed Flex Bounds */}
      <main className="flex w-full h-[calc(100vh-4rem)] pt-16 overflow-hidden">
        {/* Patient Area (Left) */}
        <div className="flex-1 min-w-0 h-full relative bg-surface overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            <ButtonGrid />
          </div>
        </div>
        
        {/* Vertical Separator */}
        <div className="w-2 h-full bg-surface-container shadow-inner shrink-0 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-outline-variant/40 rounded-full" />
        </div>
        
        {/* Caregiver Panel (Right) */}
        <aside className="w-[30%] min-w-[340px] max-w-[500px] shrink-0 h-full relative overflow-hidden bg-surface-container-low shadow-xl">
          <div className="absolute inset-0 flex flex-col">
            <CaregiverPanel />
          </div>
        </aside>
      </main>
    </div>
  );
}
