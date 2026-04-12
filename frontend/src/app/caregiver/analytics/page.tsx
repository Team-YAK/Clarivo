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
  backgroundColor: 'var(--color-surface-container-highest)',
  color: 'var(--color-on-surface)',
  borderRadius: '16px',
  border: '1px solid var(--color-outline-variant)',
};
const tooltipItemStyle = { color: 'var(--color-on-surface)' };

export default function DeepAnalytics() {
  const [digest] = useState("Kishan's communication has stabilized significantly this week. There's a noticeable drop in distress during evening meal times, likely correlating with the new 'Favorites' context rule you added on Tuesday.");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Deep Insights</h1>
          <p className="text-on-surface-variant text-lg">Granular analytics mapping Kishan&apos;s behavioral and communication trends.</p>
        </div>
        <div className="flex bg-surface-container-low rounded-xl p-1 border border-outline-variant/30">
          <button className="px-4 py-2 text-sm font-bold bg-surface shadow-sm rounded-lg text-on-surface">30 Days</button>
          <button className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface">3 Months</button>
          <button className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface">1 Year</button>
        </div>
      </div>

      {/* AI Narrative Digest */}
      <div className="bg-primary-container/40 border border-primary/20 text-on-primary-container p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={24} weight="fill" className="text-primary" />
          <h3 className="font-bold uppercase tracking-wider text-sm text-primary">AI Narrative Summary</h3>
        </div>
        <p className="text-lg leading-relaxed font-medium">{digest}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Distress Triggers Radar */}
        <GlowCard customSize glowColor="red" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-on-surface">Distress Triggers</h3>
              <Info size={20} className="text-on-surface-variant cursor-help" />
            </div>
            <p className="text-sm text-on-surface-variant mb-6">Categorical distribution of high-frustration communication attempts over the selected period.</p>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                  <PolarGrid stroke="#d1d5db" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#1f2937', fontSize: 15, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Distress Volume" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.35} strokeWidth={2} />
                  <RechartsTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* AI Learning Efficacy */}
        <GlowCard customSize glowColor="green" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-on-surface">AI Learning Efficacy</h3>
              <TrendUp size={20} className="text-primary" />
            </div>
            <p className="text-sm text-on-surface-variant mb-6">Tracking successful independent sentence generations vs. times the AI had to ask for clarification.</p>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vocabularyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClarif" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="month" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area type="monotone" dataKey="verified" name="Verified Syntax" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVerified)" />
                  <Area type="monotone" dataKey="clarifications" name="Clarifications Required" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorClarif)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* NEW: AI Learning Over Time — Accuracy vs. Effort */}
        <GlowCard customSize glowColor="blue" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl xl:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                  <RocketLaunch size={20} className="text-secondary" weight="duotone" />
                  AI Learning Over Time — Accuracy vs. Effort
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  As the system learns Kishan&apos;s patterns, predictions improve while the steps needed to communicate decrease.
                </p>
              </div>
              <div className="flex items-center gap-6 text-xs font-bold shrink-0 ml-6">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Prediction Accuracy %</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 border-t-2 border-dashed border-amber-500 inline-block w-6" /> Avg Steps to Express</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                <p className="text-3xl font-headline font-black text-emerald-600">+53%</p>
                <p className="text-xs text-emerald-700 font-bold mt-1 uppercase tracking-wide">Accuracy Gain</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                <p className="text-3xl font-headline font-black text-amber-600">−52%</p>
                <p className="text-xs text-amber-700 font-bold mt-1 uppercase tracking-wide">Fewer Steps</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                <p className="text-3xl font-headline font-black text-blue-600">6 wks</p>
                <p className="text-xs text-blue-700 font-bold mt-1 uppercase tracking-wide">To Full Calibration</p>
              </div>
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={predictionAccuracyData} margin={{ top: 10, right: 40, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={[40, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" domain={[1, 6]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} steps`} />
                  <RechartsTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area yAxisId="left" type="monotone" dataKey="accuracy" name="Prediction Accuracy" stroke="#10b981" strokeWidth={3} fill="url(#colorAccuracy)" />
                  <Line yAxisId="right" type="monotone" dataKey="stepsToExpress" name="Avg Steps to Express" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Behavioral Heatmap */}
        <GlowCard customSize glowColor="orange" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl xl:col-span-2">
          <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-on-surface">365-Day High Distress Heatmap</h3>
              <p className="text-sm text-on-surface-variant mt-1">Daily aggregation of &apos;thumbs-down&apos; sequences or urgent alert triggers.</p>
            </div>
            <Heartbeat size={24} className="text-on-surface-variant" />
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="flex gap-1 min-w-max">
              {heatmapData.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((intensity, dIdx) => {
                    let color = 'bg-surface-variant/30';
                    if (intensity === 1) color = 'bg-red-200';
                    if (intensity === 2) color = 'bg-red-300';
                    if (intensity === 3) color = 'bg-red-500';
                    if (intensity === 4) color = 'bg-red-700';
                    return (
                      <div
                        key={dIdx}
                        className={`relative group w-3.5 h-3.5 rounded-sm ${color} transition-all hover:scale-125 hover:ring-2 hover:ring-outline hover:z-10`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-[10px] font-bold rounded-lg border border-outline-variant/30 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                          Intensity: {intensity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end items-center gap-2 mt-2 text-xs text-on-surface-variant font-medium">
            <span>Less</span>
            <div className="w-3 h-3 bg-surface-variant/30 rounded-sm" />
            <div className="w-3 h-3 bg-red-200 rounded-sm" />
            <div className="w-3 h-3 bg-red-300 rounded-sm" />
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <div className="w-3 h-3 bg-red-700 rounded-sm" />
            <span>More</span>
          </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
