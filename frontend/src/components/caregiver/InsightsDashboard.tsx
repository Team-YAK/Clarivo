"use client";

import React, { useEffect, useState } from 'react';
import { fetchInsights, fetchDigest } from '@/utils/caregiverApi';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { ChartLineUp, Brain, Calendar, TrendUp } from '@phosphor-icons/react';
import { GlowCard } from '@/components/ui/spotlight-card';

export default function InsightsDashboard() {
  const [insights, setInsights] = useState<any>(null);
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchInsights(), fetchDigest()]).then(([ins, dig]) => {
      setInsights(ins);
      setDigest(dig.summary);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 w-full animate-pulse">
        <div className="h-24 bg-white/5 rounded-xl border border-white/5" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-white/5 rounded-xl border border-white/5" />
          <div className="h-64 bg-white/5 rounded-xl border border-white/5" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-10 text-center text-white/40 font-bold uppercase tracking-widest text-xs">
        Failed to load neural insights.
      </div>
    );
  }

  // Formatting data for Recharts
  const sessionsByDayData = Object.keys(insights.sessions_by_day).map(key => ({
    name: key,
    sessions: insights.sessions_by_day[key]
  }));

  const periodData = Object.keys(insights.sessions_by_period).map(key => ({
    name: key,
    value: insights.sessions_by_period[key]
  }));
  const COLORS = ['#14F1D9', '#6C5CE7', '#FF2E63'];

  const chartTooltipStyle = {
    backgroundColor: 'rgba(5,5,5,0.9)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  return (
    <div className="flex flex-col gap-8 w-full p-8 bg-[#050505] min-h-full">
      <div className="flex items-center gap-3 border-b border-white/5 pb-6">
        <div className="p-2 bg-[#14F1D9]/10 rounded-lg">
          <ChartLineUp size={28} className="text-[#14F1D9]" weight="bold" />
        </div>
        <h2 className="text-3xl font-headline font-black text-white tracking-tighter">Communication Insights</h2>
      </div>

      {/* Daily Digest */}
      <div className="bg-[#14F1D9]/5 border border-[#14F1D9]/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden liquid-glass-card">
        <div className="absolute inset-0 bg-gradient-to-br from-[#14F1D9]/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 mb-4 z-10 relative">
          <Brain size={24} weight="fill" className="text-[#14F1D9]" />
          <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-[#14F1D9]">AI Neural Summary</h3>
        </div>
        <p className="text-xl leading-relaxed font-medium text-white/90 z-10 relative">{digest}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sessions by Day */}
        <GlowCard customSize glowColor="teal" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-2xl rounded-3xl liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 z-10 relative">
            <div className="flex items-center gap-2 mb-8">
              <Calendar size={20} className="text-[#14F1D9]" />
              <h3 className="font-black text-white/40 text-[10px] uppercase tracking-[0.2em]">Session Frequency</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionsByDayData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={chartTooltipStyle} />
                  <Bar dataKey="sessions" fill="#14F1D9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Time of Day */}
        <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-2xl rounded-3xl liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 z-10 relative">
            <h3 className="font-black text-white/40 text-[10px] uppercase tracking-[0.2em] mb-8">Temporal Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={periodData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                    {periodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Mood Trend */}
        <GlowCard customSize glowColor="red" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-2xl rounded-3xl liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 z-10 relative">
            <div className="flex items-center gap-2 mb-8">
              <TrendUp size={20} className="text-[#FF2E63]" />
              <h3 className="font-black text-white/40 text-[10px] uppercase tracking-[0.2em]">Frustration Gradient</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={insights.mood_log}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 'dataMax']} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="distress" stroke="#FF2E63" strokeWidth={4} dot={{r: 5, fill: '#FF2E63', strokeWidth: 0}} activeDot={{r: 8, stroke: '#050505', strokeWidth: 2}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Top Paths */}
        <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-2xl rounded-3xl liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 z-10 relative">
            <h3 className="font-black text-white/40 text-[10px] uppercase tracking-[0.2em] mb-8">High-Velocity Paths</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={insights.top_paths}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="path" type="category" width={100} tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#6C5CE7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
