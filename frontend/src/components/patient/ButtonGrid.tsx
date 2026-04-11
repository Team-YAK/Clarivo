"use client";

import React from 'react';
import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

export default function ButtonGrid() {
  return (
    <section className="h-full flex-1 min-w-0 bg-transparent flex flex-col p-8 overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Prediction Bar - Icons Only */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 mb-4 overflow-x-auto no-scrollbar pb-2 shrink-0"
      >
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm">
          <ForkKnife size={32} weight="fill" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm">
          <Drop size={32} weight="fill" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm">
          <Tree size={32} weight="fill" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm">
          <Moon size={28} weight="fill" />
        </motion.button>
      </motion.div>

      {/* Mode Toggle & Header - Icons Only */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-4 shrink-0"
      >
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all">
            <ArrowLeft className="text-primary" size={24} weight="bold" />
          </motion.button>
          <div className="flex items-center gap-2">
            <House className="text-outline-variant" size={24} weight="fill" />
            <div className="w-1.5 h-1.5 rounded-full bg-outline-variant"></div>
            <PersonArmsSpread className="text-primary" size={28} weight="fill" />
          </div>
        </div>

        <div className="bg-surface-container-low p-1 rounded-full flex shadow-sm border border-outline-variant/10">
          <button className="p-3 bg-primary-container text-on-primary-container rounded-full transition-all shadow-md">
            <SquaresFour size={24} weight="fill" />
          </button>
          <button className="p-3 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">
            <Keyboard size={24} weight="fill" />
          </button>
        </div>
      </motion.div>

      {/* Shortcut Bar - Icons Only */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-2 mb-4 shrink-0"
      >
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-12 h-12 flex items-center justify-center bg-tertiary-fixed text-tertiary-fixed-dim rounded-full border border-transparent shadow-sm">
          <Pill size={24} weight="fill" className="text-on-tertiary-fixed" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-12 h-12 flex items-center justify-center bg-secondary-fixed text-secondary-fixed-dim rounded-full border border-transparent shadow-sm">
          <Drop size={24} weight="fill" className="text-on-secondary-fixed" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-12 h-12 flex items-center justify-center bg-primary-fixed text-primary-fixed-dim rounded-full border border-transparent shadow-sm">
          <PhoneCall size={24} weight="fill" className="text-on-primary-fixed" />
        </motion.button>
      </motion.div>

      {/* Main Grid - Massive Icons, 0 Text */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 grid-rows-3 gap-3 flex-1 min-h-0 pb-4"
      >
        {/* Physical */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-teal-800 hover:bg-teal-700 transition-colors shadow-lg active:shadow-none border-b-4 border-teal-950">
          <PersonArmsSpread size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Emotional */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-red-600 hover:bg-red-500 transition-colors shadow-lg active:shadow-none border-b-4 border-red-800">
          <Smiley size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Environment */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-indigo-900 hover:bg-indigo-800 transition-colors shadow-lg active:shadow-none border-b-4 border-slate-950">
          <House size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Food */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg active:shadow-none border-b-4 border-amber-700">
          <ForkKnife size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Drink */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-sky-500 hover:bg-sky-400 transition-colors shadow-lg active:shadow-none border-b-4 border-sky-700">
          <Drop size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Sleep */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-purple-800 hover:bg-purple-700 transition-colors shadow-lg active:shadow-none border-b-4 border-purple-950">
          <Moon size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Social */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-pink-500 hover:bg-pink-400 transition-colors shadow-lg active:shadow-none border-b-4 border-pink-700">
          <Users size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Watch */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-600 hover:bg-slate-500 transition-colors shadow-lg active:shadow-none border-b-4 border-slate-800">
          <Eye size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Toilet */}
        <motion.button variants={itemVariants} whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} className="group flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-400 hover:bg-slate-300 transition-colors shadow-lg active:shadow-none border-b-4 border-slate-600">
          <Toilet size={48} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
        </motion.button>

      </motion.div>

      {/* Feedback Waveform */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 flex justify-center items-center h-8 gap-1.5 opacity-40 shrink-0"
      >
        <div className="w-1.5 h-4 bg-primary rounded-full animate-pulse"></div>
        <div className="w-1.5 h-8 bg-primary rounded-full animate-pulse delay-75"></div>
        <div className="w-1.5 h-12 bg-primary rounded-full animate-pulse delay-150"></div>
        <div className="w-1.5 h-8 bg-primary rounded-full animate-pulse delay-75"></div>
        <div className="w-1.5 h-4 bg-primary rounded-full animate-pulse"></div>
      </motion.div>
    </section>
  );
}
