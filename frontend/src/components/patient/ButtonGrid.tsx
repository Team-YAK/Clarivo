"use client";

import React from 'react';

export default function ButtonGrid() {
  return (
    <div className="w-full h-full p-8 bg-zinc-950 text-zinc-100 flex flex-col">
      <h1 className="text-2xl font-semibold mb-6">Patient Mode</h1>
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
        {/* Mocking a 3x3 grid for now */}
        {Array.from({ length: 9 }).map((_, i) => (
          <button 
            key={i}
            className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 mb-4" />
            <span className="text-lg font-medium text-zinc-300">Option {i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
