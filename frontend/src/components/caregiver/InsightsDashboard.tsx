"use client";

import React, { useEffect, useState } from 'react';
import { fetchInsights, fetchDigest } from '@/utils/caregiverApi';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { ChartLineUp, Brain, Calendar, TrendUp } from '@phosphor-icons/react';

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
        <div className="h-24 bg-surface-variant rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-surface-variant rounded-xl" />
          <div className="h-64 bg-surface-variant rounded-xl" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-10 text-center text-on-surface-variant">
        Failed to load insights.
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
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

  return (
    <div className="flex flex-col gap-6 w-full p-6 bg-surface">
      <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
        <ChartLineUp size={28} className="text-primary" weight="bold" />
        <h2 className="text-2xl font-headline font-bold text-on-surface">Communication Insights</h2>
      </div>

      {/* Daily Digest */}
      <div className="bg-primary-container text-on-primary-container p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={24} weight="fill" className="text-secondary" />
          <h3 className="font-bold uppercase tracking-wider text-sm">AI Daily Summary</h3>
        </div>
        <p className="text-lg leading-relaxed">{digest}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Sessions by Day */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={20} className="text-tertiary" />
            <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Session Frequency</h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsByDayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="name" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="sessions" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time of Day */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl">
          <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider mb-6">Time of Day</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={periodData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {periodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Trend */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendUp size={20} className="text-error" />
            <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider">Mood / Distress Trend</h3>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insights.mood_log}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis dataKey="day" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 'dataMax']} />
                <Tooltip contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="distress" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Paths */}
        <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-2xl">
          <h3 className="font-bold text-on-surface text-sm uppercase tracking-wider mb-6">Top Phrases</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={insights.top_paths}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis type="number" hide />
                <YAxis dataKey="path" type="category" width={100} tick={{fill: '#6b7280', fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
