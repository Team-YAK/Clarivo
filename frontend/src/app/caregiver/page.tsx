"use client";

import React, { useState, useEffect } from 'react';
import CaregiverPanel from '@/components/caregiver/CaregiverPanel';
import { fetchAnalytics, ChartData, fetchSessionHistory, Session } from '@/utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { SquaresFour, ChartLineUp, User, ClockCounterClockwise, SignOut, ArrowLeft } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function CaregiverDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'profile' | 'history'>('overview');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [history, setHistory] = useState<Session[]>([]);

  useEffect(() => {
    fetchAnalytics().then(setChartData);
    fetchSessionHistory().then(setHistory);
  }, []);

  return (
    <div className="flex h-screen bg-surface transition-colors duration-500">
      {/* Side Navigation */}
      <nav className="w-64 bg-surface-container-low border-r border-outline-variant/20 flex flex-col justify-between p-4 shadow-xl z-20 shrink-0">
        <div>
          <div className="mb-10 px-4 py-2">
            <h1 className="font-headline font-black text-2xl text-primary tracking-tight">Clarivo<span className="text-secondary font-bold text-sm ml-2">Care</span></h1>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'overview' ? 'bg-primary-container text-on-primary-container shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              <SquaresFour size={20} weight={activeTab === 'overview' ? "fill" : "regular"} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'analytics' ? 'bg-primary-container text-on-primary-container shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              <ChartLineUp size={20} weight={activeTab === 'analytics' ? "fill" : "regular"} /> Analytics
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'profile' ? 'bg-primary-container text-on-primary-container shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              <User size={20} weight={activeTab === 'profile' ? "fill" : "regular"} /> Patient Profile
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'history' ? 'bg-primary-container text-on-primary-container shadow-md' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              <ClockCounterClockwise size={20} weight={activeTab === 'history' ? "fill" : "regular"} /> Session History
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto border-t border-outline-variant/20 pt-4">
          <Link href="/patient" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-on-surface-variant hover:bg-surface-container">
            <ArrowLeft size={20} /> Back to Tablet
          </Link>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-error hover:bg-error-container hover:text-on-error-container">
            <SignOut size={20} /> Log out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-surface to-surface-container-low p-8 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="h-full w-full max-w-5xl mx-auto flex flex-col"
            >
              <h2 className="text-2xl font-bold font-headline mb-6 text-on-surface shrink-0">Dashboard Overview</h2>
              {/* Repurposing CaregiverPanel inside a wrapper that scales it to a dashboard view */}
              <div className="flex-1 min-h-0 bg-surface rounded-2xl overflow-hidden shadow-lg border border-outline-variant/10">
                <CaregiverPanel />
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="max-w-5xl mx-auto space-y-6"
            >
              <h2 className="text-2xl font-bold font-headline mb-6 text-on-surface">Communication Analytics</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Phrases Generated per Day</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.3} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--color-on-surface-variant)', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-on-surface-variant)', fontSize: 12}} />
                        <Tooltip cursor={{fill: 'var(--color-surface-container-high)', opacity: 0.5}} contentStyle={{backgroundColor: 'var(--color-surface-container-high)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--color-on-surface)'}} />
                        <Bar dataKey="phrases" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Distress Alerts</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.3} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--color-on-surface-variant)', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-on-surface-variant)', fontSize: 12}} />
                        <Tooltip contentStyle={{backgroundColor: 'var(--color-surface-container-high)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--color-on-surface)'}} />
                        <Line type="monotone" dataKey="distress" stroke="var(--color-error)" strokeWidth={3} dot={{r: 4, strokeWidth: 2, stroke: 'var(--color-error)'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <h2 className="text-2xl font-bold font-headline mb-6 text-on-surface">Patient Semantic Profile</h2>
              <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Patient Full Name</label>
                    <input type="text" defaultValue="Alexander Mercer" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Preferred Celebratory Dessert</label>
                    <input type="text" defaultValue="Chocolate Lava Cake" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Key Frustration Triggers</label>
                    <textarea defaultValue="Being rushed to answer. People finishing sentences incorrectly." className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 text-on-surface focus:ring-2 focus:ring-primary outline-none transition-shadow h-24 resize-none" />
                  </div>
                  <div className="pt-4 border-t border-outline-variant/20 flex justify-end">
                    <button className="bg-primary hover:bg-primary/90 text-on-primary px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md">
                      Save Profile Updates
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <h2 className="text-2xl font-bold font-headline mb-6 text-on-surface">Transcription Log</h2>
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high border-b border-outline-variant/20">
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Duration</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Summary</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((session, index) => (
                      <tr key={session.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                        <td className="p-4 font-medium text-on-surface">{session.date}</td>
                        <td className="p-4 text-on-surface-variant">{session.duration}</td>
                        <td className="p-4 text-on-surface">{session.summary}</td>
                        <td className="p-4">
                          {session.flags > 0 ? (
                            <span className="px-2.5 py-1 bg-error/10 text-error text-xs font-bold rounded-full">Distress Logged</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">Standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
