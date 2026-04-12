import React, { useState, useRef } from "react";
import { Trash, Spinner } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";

interface DrawingCanvasProps {
  onComplete: (data: { label: string; iconKey: string }) => void;
}

export default function DrawingCanvas({ onComplete }: DrawingCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get base64 from Tldraw
  const getBase64Image = async (): Promise<string | null> => {
    if (!editor) return null;
    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) return null;

    try {
      const result = await editor.toImage(shapeIds, {
        format: 'png',
        background: true,
        padding: 16
      });

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(result.blob);
      });
    } catch {
      return null;
    }
  };

  const handleClear = () => {
    if (editor) {
      editor.selectAll();
      editor.deleteShapes(editor.getSelectedShapeIds());
    }
  };

  const handleSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const base64Image = await getBase64Image();
      if (!base64Image) {
        setIsProcessing(false);
        return; // nothing drawn
      }

      const API_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8001';

      const res = await fetch(`${API_URL}/api/analyze-drawing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, user_id: "alex_demo" }),
      });

      if (!res.ok) throw new Error("Vision API failed!");

      const data = await res.json();
      onComplete({ label: data.label, iconKey: data.iconKey });
      handleClear();

    } catch (err) {
      console.error(err);
      onComplete({ label: "Question", iconKey: "Question" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-[#050505]/60 rounded-3xl overflow-hidden border border-white/5 p-4 liquid-glass-card shadow-2xl">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-headline font-black text-xl text-white">Draw to Communicate</h3>
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            disabled={isProcessing}
            className="px-4 py-2 rounded-2xl bg-[#FF2E63]/10 text-[#FF2E63] hover:bg-[#FF2E63]/20 active:scale-95 transition-all flex items-center justify-center border border-[#FF2E63]/20"
          >
            <Trash size={24} weight="fill" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-6 py-2 rounded-2xl bg-[#14F1D9] text-[#050505] hover:bg-[#14F1D9]/80 shadow-[0_0_20px_rgba(20,241,217,0.3)] active:scale-95 transition-all flex items-center justify-center font-bold"
          >
            {isProcessing ? <Spinner size={24} className="animate-spin" /> : "Complete"}
          </button>
        </div>
      </div>

      <div 
        className="flex-1 w-full min-h-0 bg-[#f8f9fa] rounded-2xl overflow-hidden shadow-inner border border-white/10 relative"
      >
        <div 
          className="absolute inset-0 p-1" 
          style={{ zIndex: 0 }}
          onPointerDown={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
          }}
          onPointerUp={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              handleSubmit();
            }, 2000);
          }}
        >
          <Tldraw
            onMount={setEditor}
            autoFocus
          />
        </div>

        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10"
            >
              <Spinner size={48} className="animate-spin text-[#14F1D9] mb-4" />
              <p className="text-[#14F1D9] font-bold tracking-widest uppercase text-sm animate-pulse">Analyzing Canvas...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
