"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBar, 
  UserList, 
  BookBookmark, 
  BellRinging, 
  FileText, 
  Microphone, 
  SquaresFour,
  SignOut,
  FlowerLotus,
  ArrowLeft
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/caregiver', label: 'Overview', icon: <SquaresFour size={24} /> },
    { href: '/caregiver/analytics', label: 'Deep Insights', icon: <ChartBar size={24} /> },
    { href: '/caregiver/context', label: 'Patient Context', icon: <UserList size={24} /> },
    { href: '/caregiver/glossary', label: 'AI Glossary Rules', icon: <BookBookmark size={24} /> },
    { href: '/caregiver/alerts', label: 'Alert Console', icon: <BellRinging size={24} /> },
    { href: '/caregiver/audits', label: 'Session Auditor', icon: <FileText size={24} /> },
    { href: '/caregiver/voice', label: 'Voice Studio', icon: <Microphone size={24} /> },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-[#14F1D9]/30">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[#050505] flex flex-col border-r border-white/5 z-20 shrink-0 relative liquid-glass-card shadow-2xl">
        <div className="p-8 flex items-center gap-3 z-10 relative">
          <div className="bg-gradient-to-br from-[#14F1D9] to-[#14F1D9]/60 p-2.5 rounded-2xl text-black shadow-[0_0_25px_rgba(20,241,217,0.3)] ring-1 ring-white/20">
            <FlowerLotus size={28} weight="fill" />
          </div>
          <div>
            <h1 className="font-headline font-black text-2xl tracking-tighter text-white">Clarivo</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#14F1D9] opacity-80">Caregiver</p>
          </div>
        </div>

        <div className="px-6 pb-4 z-10 relative">
          <Link href="/patient" className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-[#14F1D9] hover:text-black text-white/60 rounded-xl transition-all font-black uppercase tracking-widest text-[10px] border border-white/5 group shadow-xl">
            <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" /> Tablet View
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar mt-4 z-10 relative">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/caregiver' && pathname.startsWith(link.href));
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className="relative block group"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#14F1D9]/10 rounded-2xl border border-[#14F1D9]/20 shadow-[0_0_20px_rgba(20,241,217,0.1)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                )}
                <div className={`relative flex items-center gap-4 px-5 py-3.5 transition-colors z-10 font-bold text-sm ${isActive ? 'text-[#14F1D9]' : 'text-white/40 hover:text-white'}`}>
                  <div className={`transition-all duration-300 ${isActive ? 'text-[#14F1D9] scale-110 drop-shadow-[0_0_8px_rgba(20,241,217,0.5)]' : 'group-hover:scale-110 group-hover:text-white'}`}>
                    {React.cloneElement(link.icon as React.ReactElement<any>, { weight: isActive ? 'fill' : 'regular' })}
                  </div>
                  <span className="tracking-tight">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 mt-auto z-10 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 flex-1 mr-2 shadow-xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#6C5CE7]/60 text-white font-black flex items-center justify-center font-headline text-xs shadow-lg shrink-0">
                YC
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate text-white">Yuki C.</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 truncate">Verified</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3 text-[#FF2E63]/60 hover:text-[#FF2E63] hover:bg-[#FF2E63]/5 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]">
            <SignOut size={18} weight="bold" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#050505] relative isolation-auto no-scrollbar">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,241,217,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(108,92,231,0.03),transparent_40%)] pointer-events-none" />
        <div className="min-h-full p-8 lg:p-12 max-w-7xl mx-auto z-10 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
