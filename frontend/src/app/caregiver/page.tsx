"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchCaregiverPanel, fetchInsights } from '@/utils/caregiverApi';
import { CaregiverPanel, InsightsResponse } from '../../../../shared/api-contract';
import { WarningCircle, Brain, Target, TrendUp, User, Lightning, ChatTeardrop, Pill, Moon, Heartbeat, Waveform, Sparkle, ChatCenteredText, Play, HandWaving, MicrophoneStage, Database, Info } from '@phosphor-icons/react';
import { GlowCard } from '@/components/ui/spotlight-card';
import { PageTransition } from '@/components/ui/page-transition';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { GlassTextarea } from '@/components/ui/glass-input';
import NeuralMap from '@/components/caregiver/NeuralMap';

// --- Animated SVG Voice Waveform ---
const VoiceMirror = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="relative w-full h-16 flex items-center justify-center overflow-hidden">
      <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none" fill="none" className="max-w-[300px]">
        <motion.path
          d="M0 30 Q 25 10, 50 30 T 100 30 T 150 30 T 200 30"
          stroke="#14F1D9"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{
            d: isActive 
              ? [
                  "M0 30 Q 25 10, 50 30 T 100 30 T 150 30 T 200 30",
                  "M0 30 Q 25 50, 50 30 T 100 30 T 150 30 T 200 30",
                  "M0 30 Q 25 10, 50 30 T 100 30 T 150 30 T 200 30"
                ]
              : "M0 30 Q 25 30, 50 30 T 100 30 T 150 30 T 200 30"
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.path
          d="M0 30 Q 25 20, 50 30 T 100 30 T 150 30 T 200 30"
          stroke="#6C5CE7"
          strokeWidth="2"
          opacity="0.5"
          strokeLinecap="round"
          animate={{
            d: isActive 
              ? [
                  "M0 30 Q 25 40, 50 30 T 100 30 T 150 30 T 200 30",
                  "M0 30 Q 25 20, 50 30 T 100 30 T 150 30 T 200 30",
                  "M0 30 Q 25 40, 50 30 T 100 30 T 150 30 T 200 30"
                ]
              : "M0 30 Q 25 30, 50 30 T 100 30 T 150 30 T 200 30"
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />
      </svg>
    </div>
  );
};


export default function CaregiverOverview() {
  const [panelData, setPanelData] = useState<CaregiverPanel | null>(null);
  const [timeOffset, setTimeOffset] = useState<number>(0); 
  const [partnerInput, setPartnerInput] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    fetchCaregiverPanel().then(setPanelData).catch(console.error);
  }, []);

  // --- Dynamic Mocks affected by Time-Travel Slider ---
  const currentKnowledge = Math.max(10, (panelData?.knowledge_score || 88) - (timeOffset * 14));
  
  const radarData = [
    { subject: 'Physical', A: Math.min(100, 30 + (timeOffset * 15)) }, // Higher distress in past
    { subject: 'Expressive', A: Math.max(10, 90 - (timeOffset * 15)) }, // Lower expression in past
    { subject: 'Routine', A: Math.max(10, 85 - (timeOffset * 10)) },
    { subject: 'Social', A: Math.max(10, 75 - (timeOffset * 12)) },
    { subject: 'Emergency', A: Math.min(100, 20 + (timeOffset * 20)) },
  ];

  const velocityData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      day: `Day ${i + 1}`,
      time: Math.max(2, 12 - i + (timeOffset * 2) + (Math.random() * 2)), // Sentences take longer in the past
    }));
  }, [timeOffset]);

  const handleTranslate = () => {
    if(!partnerInput) return;
    setIsTranslating(true);
    setTimeout(() => setIsTranslating(false), 1200);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-[#14F1D9]/30">
        <div className="max-w-[1400px] mx-auto space-y-8">
          
          {/* HEADER & TIME SLIDER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Command Center
              </h1>
              <p className="text-white/60 text-lg mt-1 font-medium tracking-wide flex items-center gap-2">
                <Target size={20} className="text-[#14F1D9]" /> System Accuracy & Recovery Metrics
              </p>
            </div>

            {/* Time Travel Slider */}
            <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl w-full md:w-[350px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#14F1D9]">Temporal Analysis</span>
                <span className="text-xs text-white/50">{timeOffset === 0 ? "Present Data" : `${timeOffset} Months Ago`}</span>
              </div>
              <input 
                type="range" min="0" max="5" step="1" 
                value={timeOffset} 
                onChange={(e) => setTimeOffset(parseInt(e.target.value))}
                className="w-full accent-[#14F1D9] h-1.5 bg-white/10 rounded-full appearance-none outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* ANOMALY ALERT */}
          {(timeOffset > 2 || panelData?.urgent) && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#FF2E63]/10 border border-[#FF2E63]/30 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(255,46,99,0.15)]"
            >
              <div className="p-2 bg-[#FF2E63]/20 rounded-full animate-pulse">
                <WarningCircle size={28} className="text-[#FF2E63]" weight="fill" />
              </div>
              <div>
                <h3 className="text-[#FF2E63] font-bold text-lg tracking-widest uppercase mb-0.5">Predictive Alert</h3>
                <p className="text-white/80 text-sm">Elevated struggle metrics detected in Physical expression paths. Consider updating medication schedules in Patient Context.</p>
              </div>
            </motion.div>
          )}

          {/* TOP ROW: RECOVERY HERO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Knowledge Score Pulse */}
            <GlowCard customSize glowColor="teal" className="!p-0 !grid-rows-[1fr] !shadow-[0_8px_48px_rgba(20,241,217,0.12)] bg-transparent border-white/5 rounded-3xl overflow-hidden liquid-glass-card">
              <div className="p-8 h-full flex flex-col justify-center relative items-center z-10">
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Brain size={20} className="text-[#14F1D9]" />
                  <span className="text-xs uppercase tracking-widest font-bold text-white/60">Knowledge Core</span>
                </div>
                
                <div className="relative w-40 h-40 flex items-center justify-center mt-6">
                  {/* Gauge Background */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <motion.circle 
                      cx="80" cy="80" r="70" fill="none" stroke="#14F1D9" strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0, 440" }}
                      animate={{ 
                        strokeDasharray: `${(440 * currentKnowledge) / 100}, 440`,
                        opacity: [0.8, 1, 0.8],
                        scale: [1, 1.02, 1]
                      }}
                      transition={{ 
                        strokeDasharray: { duration: 1.5, ease: "easeOut" },
                        opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="drop-shadow-[0_0_15px_rgba(20,241,217,0.5)]"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-5xl font-black font-headline tracking-tighter">{currentKnowledge}</span>
                    <span className="text-xl font-bold text-[#14F1D9]">%</span>
                  </div>
                </div>
              </div>
            </GlowCard>

            {/* Voice Mirror */}
            <GlowCard customSize glowColor="purple" className="!p-0 !grid-rows-[1fr] !shadow-[0_8px_48px_rgba(108,92,231,0.12)] bg-transparent border-white/5 rounded-3xl overflow-hidden liquid-glass-card">
              <div className="p-8 h-full flex flex-col justify-between z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MicrophoneStage size={20} className="text-[#6C5CE7]" />
                    <span className="text-xs uppercase tracking-widest font-bold text-white/60">Voice Synthesis</span>
                  </div>
                  <span className="px-2 py-1 bg-[#6C5CE7]/20 border border-[#6C5CE7]/40 rounded text-[10px] uppercase font-bold text-[#6C5CE7] tracking-widest animate-pulse">Live</span>
                </div>
                <div className="py-8 bg-black/40 rounded-2xl border border-white/5 mt-4 flex flex-col items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-[#6C5CE7]/5" />
                   <VoiceMirror isActive={true} />
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center px-1">
                  <span className="text-xs text-white/50">ElevenLabs Output Pipeline</span>
                  <span className="text-xs font-bold text-[#6C5CE7]">Active</span>
                </div>
              </div>
            </GlowCard>

            {/* Independence Metric Velocity */}
            <GlowCard customSize glowColor="blue" className="!p-0 !grid-rows-[1fr] !shadow-[0_8px_48px_rgba(56,189,248,0.12)] bg-transparent border-white/5 rounded-3xl overflow-hidden liquid-glass-card">
              <div className="p-6 h-full flex flex-col z-10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendUp size={20} className="text-[#14F1D9]" />
                  <span className="text-xs uppercase tracking-widest font-bold text-white/60">Expression Velocity</span>
                </div>
                <div className="flex-1 w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={velocityData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14F1D9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#14F1D9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis hide domain={['dataMin - 1', 'dataMax + 2']} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(5,5,5,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: '#14F1D9' }}
                        formatter={(value: any) => [`${Number(value).toFixed(1)}s`, 'Time to Express']}
                      />
                      <Area type="monotone" dataKey="time" stroke="#14F1D9" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-[#14F1D9] tracking-wider">Avg {velocityData[6].time.toFixed(1)}s per sentence</span>
                </div>
              </div>
            </GlowCard>
          </div>

          {/* MIDDLE ROW: NEURAL MAP & RADAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-[#050505]/60 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group liquid-glass-card">
              <div className="absolute inset-0 bg-gradient-to-br from-[#14F1D9]/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-6 z-10 relative">
                <div className="flex items-center gap-2">
                  <Database size={24} className="text-[#14F1D9]" />
                  <h2 className="text-xl font-bold tracking-tight">Context Constellation</h2>
                </div>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-white/50 border border-white/5">Nodes: {Math.max(2, 8 - Math.floor(timeOffset * 1.5))} Connected</span>
              </div>
              <p className="text-sm text-white/50 mb-6 z-10 relative">Visual representation of localized knowledge ingestion. AI builds these pathways from Caregiver Context.</p>
              
              <div className="z-10 relative">
                <NeuralMap timeOffset={timeOffset} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#050505]/60 border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden relative liquid-glass-card">
              <div className="col-span-1 md:col-span-1 relative h-[250px] md:h-full min-h-[250px] z-10">
                <div className="absolute top-0 left-0 flex items-center gap-2 z-10">
                  <Heartbeat size={24} className="text-[#FF2E63]" />
                  <h2 className="text-xl font-bold tracking-tight">Strain Radar</h2>
                </div>
                
                {/* Pulsing Glow for High Distress */}
                {radarData.find(d => d.subject === 'Physical')?.A! > 50 && (
                  <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      background: 'radial-gradient(circle at 50% 55%, rgba(255, 46, 99, 0.4) 0%, transparent 60%)',
                    }}
                  />
                )}

                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="55%" outerRadius="70%" data={radarData}>
                    <defs>
                      <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF2E63" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FF2E63" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, textAnchor: 'middle' }} />
                    <Radar 
                      name="Struggle Index" 
                      dataKey="A" 
                      stroke="#FF2E63" 
                      strokeWidth={3}
                      fill="url(#radarGrad)" 
                      fillOpacity={0.6}
                      dot={{ r: 4, fill: '#FF2E63', fillOpacity: 1 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="col-span-1 flex flex-col h-[280px] z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#14F1D9] mb-4 flex items-center gap-2">
                  <Sparkle weight="fill" /> Recent AI Observations
                </h3>
                <div className="flex-1 overflow-hidden relative rounded-xl border border-white/5 bg-black/40">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505] z-20 pointer-events-none" />
                  
                  {/* Scrolling Ticker */}
                  <div className="relative h-full overflow-hidden">
                    <motion.div 
                      className="p-4 space-y-4"
                      animate={{ y: [0, -400] }}
                      transition={{ 
                        duration: 20, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    >
                      {[1, 2].map((loop) => (
                        <React.Fragment key={loop}>
                          <div className="bg-white/5 rounded-lg p-3 border border-white/5 shadow-sm">
                            <span className="text-[10px] text-[#14F1D9] font-mono tracking-wider block mb-1">10:45 AM</span>
                            <p className="text-xs text-white/80 leading-relaxed"><strong className="text-white">Fused:</strong> "Sarah" dynamically linked to "Dog" context node.</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 border border-white/5 shadow-sm">
                            <span className="text-[10px] text-[#6C5CE7] font-mono tracking-wider block mb-1">09:15 AM</span>
                            <p className="text-xs text-white/80 leading-relaxed"><strong className="text-white">Shortcuted:</strong> Path Food → Breakfast optimized.</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 border border-[#FF2E63]/30 shadow-sm">
                            <span className="text-[10px] text-[#FF2E63] font-mono tracking-wider block mb-1">Yesterday</span>
                            <p className="text-xs text-[#FF2E63]/90 leading-relaxed"><strong className="text-[#FF2E63]">Anomaly:</strong> Redundant distress clicks suppressed by caching.</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 border border-white/5 shadow-sm">
                            <span className="text-[10px] text-[#14F1D9] font-mono tracking-wider block mb-1">Previous Day</span>
                            <p className="text-xs text-white/80 leading-relaxed"><strong className="text-white">Profile:</strong> Added "Takes Aspirin" to active generation injection.</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 border border-white/5 shadow-sm">
                            <span className="text-[10px] text-[#14F1D9] font-mono tracking-wider block mb-1">08:30 AM</span>
                            <p className="text-xs text-white/80 leading-relaxed"><strong className="text-white">Pattern:</strong> Morning routine variance decreased by 12%.</p>
                          </div>
                        </React.Fragment>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: INTERVENTION SUITE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            
            {/* Input Mirror */}
            <div className="lg:col-span-2 bg-[#050505]/60 border border-white/10 rounded-3xl p-6 shadow-2xl relative liquid-glass-card">
              <div className="flex justify-between items-center mb-6 z-10 relative">
                <div className="flex items-center gap-2">
                  <ChatCenteredText size={24} className="text-white" />
                  <h2 className="text-xl font-bold tracking-tight">Partner Input Mirror</h2>
                </div>
                <span className="text-xs font-mono text-white/40">Real-Time Cognitive Simplification</span>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mb-2 z-10 relative">
                <div className="flex-1">
                  <GlassTextarea 
                    value={partnerInput}
                    onChange={(e) => setPartnerInput(e.target.value)}
                    placeholder="Type complex instruction here (e.g., 'We have a doctor appointment at 2PM but we need lunch first')" 
                    className="w-full !border-white/10 !bg-white/5 !text-white focus:!border-[#14F1D9]/50 !rounded-2xl"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button 
                      onClick={handleTranslate}
                      disabled={!partnerInput || isTranslating}
                      className="px-6 py-2 bg-[#14F1D9] text-black font-bold tracking-wider uppercase text-sm rounded-xl hover:bg-[#14F1D9]/80 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(20,241,217,0.3)]"
                    >
                      {isTranslating ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Play weight="fill" />}
                      Process Iteration
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                   {partnerInput === "" ? (
                     <div className="text-white/30 italic flex flex-col items-center gap-2">
                        <HandWaving size={32} weight="duotone" className="text-[#14F1D9]"/>
                        <span className="text-sm font-medium">Awaiting translation matrix...</span>
                     </div>
                   ) : isTranslating ? (
                     <div className="flex items-center gap-3 w-full max-w-xs overflow-hidden">
                       <motion.div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                         <motion.div 
                            className="h-full bg-gradient-to-r from-[#14F1D9] to-[#6C5CE7]"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.2 }}
                         />
                       </motion.div>
                     </div>
                   ) : (
                     <div className="w-full text-left bg-[#14F1D9]/10 border border-[#14F1D9]/30 rounded-xl p-4">
                        <p className="text-white font-medium mb-3">Time for lunch 🍽️</p>
                        <p className="text-white font-medium">Doctor appointment later 👨‍⚕️</p>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Knowledge Gaps */}
            <div className="bg-[#050505]/60 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col liquid-glass-card">
              <div className="flex items-center gap-2 mb-6 text-yellow-400 z-10 relative">
                <Info size={24} weight="fill" />
                <h2 className="text-xl font-bold text-white tracking-tight">Intelligence Gaps</h2>
              </div>
              
              <div className="flex-1 space-y-4 z-10 relative">
                <div className="bg-yellow-400/5 hover:bg-yellow-400/10 transition-colors border border-yellow-400/20 rounded-xl p-4 flex gap-3 cursor-pointer group">
                  <div className="bg-yellow-400/20 p-2 rounded-lg h-fit text-yellow-400">
                    ?
                  </div>
                  <div>
                    <h4 className="text-sm font-bold tracking-wide text-white mb-1 group-hover:text-yellow-400 transition-colors">Identity Match Refused</h4>
                    <p className="text-xs text-white/60 leading-relaxed mb-3">AI could not conclusively link "Sarah" across 3 sessions. Define context.</p>
                    <Link href="/caregiver/context" className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 border border-yellow-400/30 px-3 py-1 rounded-full hover:bg-yellow-400 hover:text-black transition-colors">Resolve</Link>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-3 opacity-50">
                   <div className="bg-white/10 p-2 rounded-lg h-fit text-white/50">✓</div>
                   <div>
                      <h4 className="text-sm font-bold tracking-wide text-white/50 mb-1">Morning Routine Set</h4>
                      <p className="text-xs text-white/40 leading-relaxed">System acquired breakfast preferences. Accuracy bounded to +95%.</p>
                   </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
}
