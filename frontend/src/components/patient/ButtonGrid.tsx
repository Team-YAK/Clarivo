"use client";

import React from 'react';
import {
  PersonArmsSpread,
  Smiley,
  House,
  ForkKnife,
  Drop,
  Moon,
  Users,
  Eye,
  Toilet,
  ArrowLeft,
  SquaresFour,
  Keyboard,
  Tree,
  Sun,
  Pill,
  PhoneCall
} from '@phosphor-icons/react';

export default function ButtonGrid() {
  return (
    <section className="h-full flex-1 min-w-0 bg-surface flex flex-col p-8 overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Prediction Bar - Icons Only */}
      <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar pb-2 shrink-0">
        <button className="bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm">
          <ForkKnife size={32} weight="fill" />
        </button>
        <button className="bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm">
          <Drop size={32} weight="fill" />
        </button>
        <button className="bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm">
          <Tree size={32} weight="fill" />
        </button>
        <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm">
          <Moon size={28} weight="fill" />
        </button>
      </div>

      {/* Mode Toggle & Header - Icons Only */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <button className="p-3 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all">
            <ArrowLeft className="text-primary" size={24} weight="bold" />
          </button>
          <div className="flex items-center gap-2">
            {/* Instead of breadcrumbs, we just show spatial icon context */}
            <House className="text-outline-variant" size={24} weight="fill" />
            <div className="w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
            <PersonArmsSpread className="text-primary" size={28} weight="fill" />
          </div>
        </div>

        <div className="bg-surface-container-low p-1 rounded-full flex">
          <button className="p-3 bg-primary text-on-primary rounded-full transition-all shadow-md">
            <SquaresFour size={24} weight="fill" />
          </button>
          <button className="p-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">
            <Keyboard size={24} weight="fill" />
          </button>
        </div>
      </div>

      {/* Shortcut Bar - Icons Only */}
      <div className="flex gap-2 mb-4 shrink-0">
        <button className="w-12 h-12 flex items-center justify-center bg-tertiary-fixed text-tertiary rounded-full border-2 border-transparent hover:border-tertiary transition-all">
          <Pill size={24} weight="fill" />
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-secondary-fixed text-secondary rounded-full border-2 border-transparent hover:border-secondary transition-all">
          <Drop size={24} weight="fill" />
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-primary-fixed text-primary rounded-full border-2 border-transparent hover:border-primary transition-all">
          <PhoneCall size={24} weight="fill" />
        </button>
      </div>

      {/* Main Grid - Massive Icons, 0 Text */}
      <div className="grid grid-cols-3 grid-rows-3 gap-2 flex-1 min-h-0 pb-4">

        {/* Physical: Deep Teal */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-teal-800 hover:bg-teal-700 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-teal-950">
          <PersonArmsSpread size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Emotional: Warm Red */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-red-600 hover:bg-red-500 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-red-800">
          <Smiley size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Environment: Indigo/Navy */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-indigo-900 hover:bg-indigo-800 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-slate-950">
          <House size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Food: Golden Yellow */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-500 hover:bg-amber-400 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-amber-700">
          <ForkKnife size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Drink: Sky Blue */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-sky-500 hover:bg-sky-400 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-sky-700">
          <Drop size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Sleep: Deep Purple */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-purple-800 hover:bg-purple-700 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-purple-950">
          <Moon size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Social: Soft Pink */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-pink-500 hover:bg-pink-400 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-pink-700">
          <Users size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Watch: Slate/Grey */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-600 hover:bg-slate-500 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-slate-800">
          <Eye size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
        </button>

        {/* Toilet: Light Blue/Grey */}
        <button className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-400 hover:bg-slate-300 transition-all shadow-[0_4px_10px_rgb(0,0,0,0.1)] active:scale-95 border-b-4 border-slate-600">
          <Toilet size={48} weight="fill" className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />

        </button>

      </div>

      {/* Feedback Waveform */}
      <div className="mt-4 flex justify-center items-center h-8 gap-1.5 opacity-40 shrink-0">
        <div className="w-1.5 h-4 bg-primary-container rounded-full animate-pulse"></div>
        <div className="w-1.5 h-8 bg-primary-container rounded-full animate-pulse delay-75"></div>
        <div className="w-1.5 h-12 bg-primary-container rounded-full animate-pulse delay-150"></div>
        <div className="w-1.5 h-8 bg-primary-container rounded-full animate-pulse delay-75"></div>
        <div className="w-1.5 h-4 bg-primary-container rounded-full animate-pulse"></div>
      </div>
    </section>
  );
}
