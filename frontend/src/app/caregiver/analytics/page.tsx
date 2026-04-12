"use client";

import React, { useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  Area, AreaChart, XAxis, YAxis, CartesianGrid,
  ComposedChart, Line
} from 'recharts';
import { ChartLineUp, Brain, TrendUp, Info, Heartbeat, RocketLaunch } from '@phosphor-icons/react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { PageTransition } from '@/components/ui/page-transition';

const radarData = [
  { subject: 'Meals / Food', A: 80, fullMark: 100 },
  { subject: 'Physical Pain', A: 90, fullMark: 100 },
  { subject: 'Bathing', A: 40, fullMark: 100 },
  { subject: 'Sleep', A: 30, fullMark: 100 },
  { subject: 'Medication', A: 60, fullMark: 100 },
  { subject: 'Mobility', A: 50, fullMark: 100 },
];

const vocabularyData = [
  { month: 'Jan', verified: 120, clarifications: 80 },
  { month: 'Feb', verified: 150, clarifications: 60 },
  { month: 'Mar', verified: 210, clarifications: 40 },
  { month: 'Apr', verified: 290, clarifications: 25 },
];

const predictionAccuracyData = [
  { week: 'Week 1', accuracy: 58, stepsToExpress: 4.8 },
  { week: 'Week 2', accuracy: 64, stepsToExpress: 4.2 },
  { week: 'Week 3', accuracy: 71, stepsToExpress: 3.6 },
  { week: 'Week 4', accuracy: 78, stepsToExpress: 3.1 },
  { week: 'Week 5', accuracy: 84, stepsToExpress: 2.7 },
  { week: 'Week 6', accuracy: 89, stepsToExpress: 2.3 },
];

// Seeded PRNG to avoid hydration mismatch (Math.random differs server vs client)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// Heatmap generator for past 52 weeks x 7 days
const generateHeatmap = () => {
  const rng = seededRandom(42);
  const weeks = [];
  for (let w = 0; w < 52; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(Math.floor(rng() * 5)); // 0-4 intensity
    }
    weeks.push(days);
  }
  return weeks;
};
const heatmapData = generateHeatmap();

const tooltipStyle = {
  backgroundColor: 'rgba(5, 5, 5, 0.95)',
  color: '#ffffff',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
};
const tooltipItemStyle = { color: '#ffffff' };

export default function DeepAnalytics() {
  const [digest] = useState("Kishan's communication has stabilized significantly this week. There's a noticeable drop in distress during evening meal times, likely correlating with the new 'Favorites' context rule you added on Tuesday.");

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen bg-[#050505] text-white p-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">Deep Insights</h1>
          <p className="text-white/60 text-lg">Granular analytics mapping Kishan&apos;s behavioral and communication trends.</p>
        </div>
        <div className="flex bg-white/5 backdrop-blur-xl rounded-xl p-1 border border-white/10">
          <button className="px-4 py-2 text-sm font-bold bg-[#14F1D9] text-black shadow-sm rounded-lg">30 Days</button>
          <button className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white transition-colors">3 Months</button>
          <button className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white transition-colors">1 Year</button>
        </div>
      </div>

      {/* AI Narrative Digest */}
      <div className="bg-[#14F1D9]/5 border border-[#14F1D9]/20 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden liquid-glass-card">
        <div className="absolute inset-0 bg-gradient-to-br from-[#14F1D9]/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 mb-3 z-10 relative">
          <Brain size={24} weight="fill" className="text-[#14F1D9]" />
          <h3 className="font-bold uppercase tracking-widest text-xs text-[#14F1D9]">AI Narrative Summary</h3>
        </div>
        <p className="text-lg leading-relaxed font-medium z-10 relative">{digest}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Distress Triggers Radar */}
        <GlowCard customSize glowColor="red" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 flex flex-col h-full z-10 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">Distress Triggers</h3>
              <Info size={20} className="text-white/40 cursor-help" />
            </div>
            <p className="text-sm text-white/60 mb-6">Categorical distribution of high-frustration communication attempts over the selected period.</p>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Distress Volume" dataKey="A" stroke="#FF2E63" fill="#FF2E63" fillOpacity={0.4} strokeWidth={3} />
                  <RechartsTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* AI Learning Efficacy */}
        <GlowCard customSize glowColor="teal" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 flex flex-col h-full z-10 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-white">AI Learning Efficacy</h3>
              <TrendUp size={20} className="text-[#14F1D9]" />
            </div>
            <p className="text-sm text-white/60 mb-6">Tracking successful independent sentence generations vs. times the AI had to ask for clarification.</p>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vocabularyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14F1D9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#14F1D9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClarif" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" opacity={0.4} />
                  <XAxis dataKey="month" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 12}} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area type="monotone" dataKey="verified" name="Verified Syntax" stroke="#14F1D9" strokeWidth={3} fillOpacity={1} fill="url(#colorVerified)" />
                  <Area type="monotone" dataKey="clarifications" name="Clarifications Required" stroke="#6C5CE7" strokeWidth={3} fillOpacity={1} fill="url(#colorClarif)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* NEW: AI Learning Over Time — Accuracy vs. Effort */}
        <GlowCard customSize glowColor="blue" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl xl:col-span-2 liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 z-10 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <RocketLaunch size={20} className="text-[#14F1D9]" weight="duotone" />
                  AI Learning Over Time — Accuracy vs. Effort
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  As the system learns Kishan&apos;s patterns, predictions improve while the steps needed to communicate decrease.
                </p>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-bold shrink-0 uppercase tracking-widest text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#14F1D9] inline-block shadow-[0_0_8px_#14F1D9]" /> Accuracy %</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#6C5CE7] inline-block shadow-[0_0_8px_#6C5CE7]" /> Steps</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#14F1D9]/5 border border-[#14F1D9]/20 rounded-2xl p-4 text-center backdrop-blur-md">
                <p className="text-3xl font-headline font-black text-[#14F1D9] drop-shadow-[0_0_10px_rgba(20,241,217,0.3)]">+53%</p>
                <p className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-widest">Accuracy Gain</p>
              </div>
              <div className="bg-[#6C5CE7]/5 border border-[#6C5CE7]/20 rounded-2xl p-4 text-center backdrop-blur-md">
                <p className="text-3xl font-headline font-black text-[#6C5CE7] drop-shadow-[0_0_10px_rgba(108,92,231,0.3)]">−52%</p>
                <p className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-widest">Fewer Steps</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center backdrop-blur-md">
                <p className="text-3xl font-headline font-black text-white">6 wks</p>
                <p className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-widest">To Calibration</p>
              </div>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={predictionAccuracyData} margin={{ top: 10, right: 40, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14F1D9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14F1D9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" opacity={0.4} />
                  <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={[40, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" domain={[1, 6]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} steps`} />
                  <RechartsTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area yAxisId="left" type="monotone" dataKey="accuracy" name="Prediction Accuracy" stroke="#14F1D9" strokeWidth={3} fill="url(#colorAccuracy)" />
                  <Line yAxisId="right" type="monotone" dataKey="stepsToExpress" name="Avg Steps to Express" stroke="#6C5CE7" strokeWidth={3} strokeDasharray="6 3" dot={{ fill: '#6C5CE7', r: 5, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Behavioral Heatmap */}
        <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl xl:col-span-2 liquid-glass-card bg-transparent border-white/5">
          <div className="p-6 z-10 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-white">365-Day High Distress Heatmap</h3>
              <p className="text-sm text-white/60 mt-1">Daily aggregation of &apos;thumbs-down&apos; sequences or urgent alert triggers.</p>
            </div>
            <Heartbeat size={24} className="text-[#FF2E63]" />
          </div>

          <div className="overflow-x-auto pb-4 no-scrollbar">
            <div className="flex gap-1 min-w-max">
              {heatmapData.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((intensity, dIdx) => {
                    let color = 'rgba(255,255,255,0.05)';
                    if (intensity === 1) color = 'rgba(255,46,99,0.2)';
                    if (intensity === 2) color = 'rgba(255,46,99,0.4)';
                    if (intensity === 3) color = 'rgba(255,46,99,0.7)';
                    if (intensity === 4) color = 'rgba(255,46,99,1.0)';
                    return (
                      <div
                        key={dIdx}
                        className={`relative group w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 hover:ring-2 hover:ring-[#FF2E63] hover:z-10`}
                        style={{ backgroundColor: color }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-[10px] font-bold rounded-lg border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity backdrop-blur-md">
                          Intensity: {intensity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end items-center gap-2 mt-2 text-xs text-white/40 font-medium">
            <span>Less</span>
            <div className="w-3 h-3 bg-white/5 rounded-sm" />
            <div className="w-3 h-3 bg-[#FF2E63]/20 rounded-sm" />
            <div className="w-3 h-3 bg-[#FF2E63]/40 rounded-sm" />
            <div className="w-3 h-3 bg-[#FF2E63]/70 rounded-sm" />
            <div className="w-3 h-3 bg-[#FF2E63] rounded-sm" />
            <span>More</span>
          </div>
          </div>
        </GlowCard>
      </div>
    </div>
    </PageTransition>
  );
}
