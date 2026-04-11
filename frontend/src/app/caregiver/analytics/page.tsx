"use client";

import React, { useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts';
import { ChartLineUp, Brain, TrendUp, Info, Heartbeat } from '@phosphor-icons/react';
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

// Heatmap generator for past 52 weeks x 7 days
const generateHeatmap = () => {
  const weeks = [];
  for (let w = 0; w < 52; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(Math.floor(Math.random() * 5)); // 0-4 intensity
    }
    weeks.push(days);
  }
  return weeks;
};
const heatmapData = generateHeatmap();

export default function DeepAnalytics() {
  const [digest] = useState("Alex's communication has stabilized significantly this week. There’s a noticeable drop in distress during evening meal times, likely correlating with the new 'Favorites' context rule you added on Tuesday.");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Deep Insights</h1>
          <p className="text-on-surface-variant text-lg">Granular analytics mapping Alex's behavioral and communication trends.</p>
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
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Distress Volume" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface)', borderRadius: '16px', border: '1px solid var(--color-outline-variant)' }} itemStyle={{ color: 'var(--color-on-surface)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlowCard>

        {/* Vocabulary Efficiency */}
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
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface-container-highest)', color: 'var(--color-on-surface)', borderRadius: '16px', border: '1px solid var(--color-outline-variant)' }} itemStyle={{ color: 'var(--color-on-surface)' }} />
                  <Area type="monotone" dataKey="verified" name="Verified Syntax" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVerified)" />
                  <Area type="monotone" dataKey="clarifications" name="Clarifications Required" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorClarif)" />
                </AreaChart>
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
              <p className="text-sm text-on-surface-variant mt-1">Daily aggregation of 'thumbs-down' sequences or urgent alert triggers.</p>
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
