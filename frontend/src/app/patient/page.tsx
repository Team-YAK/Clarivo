"use client";

import React, { useState, useEffect } from 'react';
import ButtonGrid from '@/components/patient/ButtonGrid';
import CaregiverPanel from '@/components/caregiver/CaregiverPanel';
import { Bell, UserCircle, Sun, Moon, Gear, SignOut } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientScreen() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-surface to-surface-container-low transition-colors duration-500">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full h-16 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-xl shadow-sm z-50 transition-colors duration-500 border-b border-outline-variant/30">
        <div className="flex items-center gap-6">
          <span className="text-2xl font-black text-primary tracking-tight font-headline">Clarivo</span>
        </div>
        <div className="flex items-center gap-4 relative">
          
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-full transition-colors"
            >
              {theme === 'dark' ? <Sun size={24} weight="fill" /> : <Moon size={24} weight="fill" />}
            </button>
          )}

          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className={`p-2 rounded-full transition-colors ${showNotifications ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <Bell size={24} weight="fill" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 bg-surface-container-lowest border border-outline-variant/20 shadow-xl rounded-2xl p-4 origin-top-right overflow-hidden"
                >
                  <h4 className="font-headline font-bold text-on-surface mb-3">Notifications</h4>
                  <div className="flex flex-col gap-2">
                    <div className="p-3 bg-primary-container/20 rounded-xl">
                      <p className="text-sm font-medium text-on-surface">Alex's profile synced</p>
                      <p className="text-xs text-on-surface-variant">2 mins ago</p>
                    </div>
                    <div className="p-3 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors">
                      <p className="text-sm font-medium text-on-surface">New phrasing shortcuts available</p>
                      <p className="text-xs text-on-surface-variant">1 hour ago</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className={`p-2 rounded-full transition-colors ${showProfile ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              <UserCircle size={28} weight="fill" />
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-surface-container-lowest border border-outline-variant/20 shadow-xl rounded-2xl p-2 origin-top-right"
                >
                  <div className="p-3 border-b border-outline-variant/20 mb-1">
                    <p className="font-headline font-bold text-on-surface">Yuki Caregiver</p>
                    <p className="text-xs text-on-surface-variant">yuki@clarivo.app</p>
                  </div>
                  <button className="w-full flex items-center gap-3 p-3 text-sm font-medium text-on-surface hover:bg-surface-container-low rounded-xl transition-colors">
                    <Gear size={20} /> Settings
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-sm font-medium text-error hover:bg-error-container hover:text-on-error-container rounded-xl transition-colors mt-1">
                    <SignOut size={20} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area w/ Exact 70/30 Fixed Flex Bounds */}
      <main className="flex w-full h-[calc(100vh-4rem)] pt-16 overflow-hidden">
        {/* Patient Area (Left) */}
        <div className="flex-1 min-w-0 h-full relative bg-transparent overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            <ButtonGrid />
          </div>
        </div>
        
        {/* Vertical Separator */}
        <div className="w-2 h-full bg-surface-container-high shadow-inner shrink-0 relative transition-colors duration-500">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-outline-variant/40 rounded-full" />
        </div>
        
        {/* Caregiver Panel (Right) */}
        <aside className="w-[30%] min-w-[340px] max-w-[500px] shrink-0 h-full relative overflow-hidden bg-surface-container shadow-[inset_1px_0_10px_rgba(0,0,0,0.05)] transition-colors duration-500">
          <div className="absolute inset-0 flex flex-col">
            <CaregiverPanel />
          </div>
        </aside>
      </main>
    </div>
  );
}
