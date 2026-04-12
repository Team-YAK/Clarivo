"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FlowerLotus, DeviceMobileCamera, FirstAid } from "@phosphor-icons/react";

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-surface">
      {/* Ambient orbs */}
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-8rem] left-[-8rem] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10rem] right-[-8rem] w-[550px] h-[550px] rounded-full bg-tertiary/15 blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[90px] pointer-events-none"
      />

      {/* Center card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.2 }}
        className="relative z-10 w-full max-w-md mx-auto px-6"
      >
        <div className="glass-card rounded-[2.5rem] p-10 shadow-[0_32px_80px_rgba(0,0,0,0.25)] flex flex-col items-center text-center gap-6">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.4 }}
            className="p-5 rounded-[1.5rem] glass-card shadow-xl"
          >
            <FlowerLotus size={52} weight="fill" className="text-primary" />
          </motion.div>

          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <h1 className="text-5xl font-headline font-black tracking-tight bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent mb-2">
              Clarivo
            </h1>
            <p className="text-on-surface-variant text-base font-medium">
              Giving voice to every thought
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="w-24 h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent"
          />

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full flex flex-col gap-3"
          >
            <Link
              href="/patient"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-on-primary rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group"
            >
              <DeviceMobileCamera size={24} weight="fill" className="group-hover:scale-110 transition-transform" />
              Patient Mode
            </Link>
            <Link
              href="/caregiver"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 glass-card border border-outline-variant/30 text-on-surface rounded-2xl font-bold text-base hover:border-outline-variant/60 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <FirstAid size={22} weight="fill" className="text-tertiary group-hover:scale-110 transition-transform" />
              Caregiver Portal
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.1 }}
            className="text-xs text-on-surface-variant"
          >
            A Clarivo + Team YAK System
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
