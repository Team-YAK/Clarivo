"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Node {
  id: number;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  type: 'person' | 'pet' | 'meds' | 'physical' | 'food' | 'activity';
  delay: number;
}

interface NeuralMapProps {
  timeOffset: number;
}

const NeuralMap: React.FC<NeuralMapProps> = ({ timeOffset }) => {
  const nodes: Node[] = useMemo(() => [
    { id: 1, label: "Sarah", x: 20, y: 30, type: 'person', delay: 0 },
    { id: 2, label: "Bobby", x: 75, y: 25, type: 'pet', delay: 0.2 },
    { id: 3, label: "Aspirin", x: 80, y: 70, type: 'meds', delay: 0.4 },
    { id: 4, label: "Knee Pain", x: 30, y: 80, type: 'physical', delay: 0.6 },
    { id: 5, label: "Oatmeal", x: 50, y: 50, type: 'food', delay: 0.3 },
    { id: 6, label: "Coffee", x: 15, y: 60, type: 'food', delay: 0.8 },
    { id: 7, label: "Walk", x: 60, y: 15, type: 'activity', delay: 1.0 },
    { id: 8, label: "Thirsty", x: 40, y: 25, type: 'physical', delay: 1.2 },
  ], []);

  // Filter nodes based on timeOffset (simulating history)
  // Higher timeOffset means further back in time (fewer nodes)
  const maxNodes = nodes.length;
  const visibleCount = Math.max(2, maxNodes - Math.floor(timeOffset * 1.5));
  const visibleNodes = nodes.slice(0, visibleCount);

  // Helper to get color based on type
  const getTypeColor = (type: Node['type']) => {
    switch (type) {
      case 'person': return '#14F1D9'; // Cyan
      case 'physical': return '#FF2E63'; // Red
      case 'meds': return '#FFD700'; // Gold
      case 'food': return '#6C5CE7'; // Purple
      case 'pet': return '#FFA502'; // Orange
      case 'activity': return '#2ECC71'; // Green
      default: return '#FFFFFF';
    }
  };

  // Generate connections between nodes
  const connections = useMemo(() => {
    const pairs: [Node, Node][] = [];
    for (let i = 0; i < visibleNodes.length; i++) {
      for (let j = i + 1; j < visibleNodes.length; j++) {
        const n1 = visibleNodes[i];
        const n2 = visibleNodes[j];
        // Only connect if they are relatively close or it's one of the first few nodes
        const dist = Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
        if (dist < 45 || (i < 3 && j < 5)) {
          pairs.push([n1, n2]);
        }
      }
    }
    return pairs;
  }, [visibleNodes]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-black/40 border border-white/5 mx-auto group">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px' 
        }} 
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14F1D9" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#6C5CE7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#14F1D9" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Connections */}
        <AnimatePresence>
          {connections.map(([n1, n2]) => (
            <motion.line
              key={`${n1.id}-${n2.id}`}
              x1={`${n1.x}%`}
              y1={`${n1.y}%`}
              x2={`${n2.x}%`}
              y2={`${n2.y}%`}
              stroke="url(#neuralGradient)"
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                ease: "easeInOut",
                delay: Math.max(n1.delay, n2.delay)
              }}
              style={{ filter: 'drop-shadow(0 0 2px rgba(20, 241, 217, 0.3))' }}
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* Nodes */}
      <AnimatePresence>
        {visibleNodes.map((n) => (
          <motion.div
            key={n.id}
            initial={{ scale: 0, opacity: 0, filter: 'brightness(2)' }}
            animate={{ scale: 1, opacity: 1, filter: 'brightness(1)' }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 15,
              delay: n.delay 
            }}
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            {/* The "Fusing" effect: outer ring that shrinks */}
            <motion.div
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: [0, 1, 0] }}
              transition={{ duration: 1, delay: n.delay }}
              className="absolute w-8 h-8 rounded-full border border-white/30"
              style={{ borderColor: getTypeColor(n.type) }}
            />

            {/* Core Node */}
            <motion.div 
              className="w-3 h-3 rounded-full relative"
              style={{ 
                backgroundColor: getTypeColor(n.type),
                boxShadow: `0 0 15px 2px ${getTypeColor(n.type)}`
              }}
              animate={{
                boxShadow: [
                  `0 0 10px 1px ${getTypeColor(n.type)}`,
                  `0 0 20px 4px ${getTypeColor(n.type)}`,
                  `0 0 10px 1px ${getTypeColor(n.type)}`
                ]
              }}
              transition={{
                duration: 2 + (n.id % 3),
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Inner dot */}
              <div className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full opacity-80" />
            </motion.div>

            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: n.delay + 0.3 }}
              className="mt-3 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md"
            >
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/90 whitespace-nowrap">
                {n.label}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Decorative center brain core glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#14F1D9]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Overlay Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40 pointer-events-none" />
    </div>
  );
};

export default NeuralMap;
