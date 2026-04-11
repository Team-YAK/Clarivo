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
    <div className="flex h-screen bg-surface-container-lowest text-on-surface overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-surface-container shadow-xl flex flex-col border-r border-outline-variant/30 z-20 shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl text-on-primary shadow-lg shadow-primary/20">
            <FlowerLotus size={28} weight="fill" />
          </div>
          <div>
            <h1 className="font-headline font-black text-2xl tracking-tight text-primary">Clarivo</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Caregiver Portal</p>
          </div>
        </div>

        <div className="px-6 pb-2">
          <Link href="/patient" className="w-full flex items-center justify-center gap-2 py-3 bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface rounded-xl transition-all font-bold text-sm shadow-sm border border-outline-variant/10 group">
            <ArrowLeft size={18} weight="bold" className="group-hover:-translate-x-1 transition-transform" /> Back to Tablet
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/caregiver' && pathname.startsWith(link.href));
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-medium text-sm
                  ${isActive 
                    ? 'bg-primary text-on-primary shadow-md shadow-primary/10 tracking-wide font-bold' 
                    : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}
                `}
              >
                <div className={`${isActive ? 'text-on-primary' : 'text-primary'}`}>
                  {React.cloneElement(link.icon as React.ReactElement<any>, { weight: isActive ? 'fill' : 'regular' })}
                </div>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-outline-variant/30 mt-auto">
          <div className="bg-surface-container-highest rounded-2xl p-4 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-container text-primary font-bold flex items-center justify-center font-headline shadow-inner">
              YC
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate text-on-surface">Yuki Caregiver</p>
              <p className="text-xs text-on-surface-variant truncate">Caring for: Alex</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-3 text-error hover:bg-error-container hover:text-on-error-container rounded-xl transition-colors font-bold text-sm">
            <SignOut size={20} weight="bold" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-surface relative isolation-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-tertiary/5 pointer-events-none" />
        <div className="min-h-full p-8 lg:p-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
