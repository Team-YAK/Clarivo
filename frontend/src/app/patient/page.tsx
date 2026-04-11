"use client";

import React, { useState, useEffect } from 'react';
import ButtonGrid from '@/components/patient/ButtonGrid';
import CaregiverPanel from '@/components/caregiver/CaregiverPanel';
import { Sun, Moon, SidebarSimple, Desktop } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';


export default function PatientScreen() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-surface to-surface-container-low transition-colors duration-500">
      {/* Hyper Minimalist Top Navigation Bar */}
      <header className="fixed top-0 w-full h-16 flex items-center justify-between px-12 bg-transparent z-50">
        <div className="flex items-center gap-6">
          {/* Deliberately invisible or extremely subtle to prevent aphasia interface clutter */}
        </div>
        <div className="flex items-center gap-4 relative">
          <Link 
            href="/caregiver"
            className="flex items-center gap-2 p-2 px-4 rounded-full transition-all text-outline-variant hover:text-on-surface hover:bg-surface-container-high font-bold text-sm"
          >
            <Desktop size={24} weight="fill" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          
          <button 
            onClick={() => setIsSplitView(!isSplitView)}
            className={`p-3 rounded-full transition-all shadow-sm ${isSplitView ? 'bg-primary-container text-on-primary-container' : 'text-outline-variant hover:text-on-surface hover:bg-surface-container-high'}`}
          >
            <SidebarSimple size={24} weight="fill" />
          </button>
          
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 text-outline-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all"
            >
              {theme === 'dark' ? <Sun size={24} weight="fill" /> : <Moon size={24} weight="fill" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex w-full h-full pt-16 overflow-hidden">
        {/* Patient Area (Resizes dynamically based on split-view) */}
        <motion.div 
          layout
          className="flex-1 min-w-0 h-full relative bg-transparent overflow-hidden px-8 pb-8 pt-4"
        >
          <div className="absolute inset-0 max-w-7xl mx-auto flex flex-col pt-4">
            <ButtonGrid />
          </div>
        </motion.div>
        
        <AnimatePresence>
          {isSplitView && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "30%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex shrink-0 h-full"
            >
              {/* Vertical Separator */}
              <div className="w-2 h-full bg-surface-container-high shadow-inner shrink-0 relative transition-colors duration-500">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-outline-variant/40 rounded-full" />
              </div>
              
              {/* Caregiver Panel (Right) */}
              <aside className="min-w-[340px] max-w-[500px] w-full shrink-0 h-full relative overflow-hidden bg-surface-container shadow-[inset_1px_0_10px_rgba(0,0,0,0.05)] transition-colors duration-500">
                <div className="absolute inset-0 flex flex-col">
                  <CaregiverPanel />
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
