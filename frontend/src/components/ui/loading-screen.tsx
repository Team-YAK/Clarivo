"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlowerLotus } from "@phosphor-icons/react";

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface"
        >
          {/* Glow ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.6, 1.5], opacity: [0, 0.15, 0] }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="absolute w-48 h-48 rounded-full bg-primary"
          />

          {/* Logo icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative z-10 p-6 rounded-3xl glass-card shadow-2xl mb-6"
          >
            <FlowerLotus size={52} weight="fill" className="text-primary" />
          </motion.div>

          {/* Brand name */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-3xl font-headline font-black tracking-tight bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent"
          >
            Clarivo
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-sm text-on-surface-variant mt-2 font-medium tracking-wide"
          >
            Giving voice to every thought
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
