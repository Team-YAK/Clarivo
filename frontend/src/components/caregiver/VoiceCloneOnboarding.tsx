"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cloneVoice } from '@/utils/caregiverApi';
import { Microphone, Stop, CheckCircle, SpinnerGap, Warning, ArrowCounterClockwise, Play } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowCard } from '@/components/ui/spotlight-card';

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'done';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VoiceCloneOnboarding() {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cloneNote, setCloneNote] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState('recorded');
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      setState('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (e: any) {
      setError('Microphone access denied. Please allow microphone permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const reRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    setState('idle');
  };

  const submitVoice = async () => {
    if (!audioBlob) return;
    setState('uploading');
    setError(null);
    setCloneNote(null);
    try {
      const file = new File([audioBlob], 'voice_sample.webm', { type: audioBlob.type });
      const result = await cloneVoice(file);
      if (result.success) {
        setState('done');
        if (result.note) {
          setCloneNote(result.note);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to clone voice. Please try again.');
      setState('recorded');
    }
  };

  return (
    <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-2xl rounded-3xl w-full max-w-2xl mx-auto liquid-glass-card bg-transparent border-white/5">
      <div className="p-8 z-10 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded-2xl flex items-center justify-center border border-[#6C5CE7]/20 shadow-[0_0_20px_rgba(108,92,231,0.2)]">
            <Microphone size={32} weight="fill" />
          </div>
          <div>
            <h2 className="text-2xl font-headline font-black text-white tracking-tight">Voice Cloning Setup</h2>
            <p className="text-white/50 text-sm mt-1">Record directly in the browser — no file upload needed.</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Instructions */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="font-bold text-[#14F1D9] mb-3 uppercase tracking-widest text-xs">Instructions</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex gap-3"><span className="text-[#14F1D9] font-bold">01.</span> <span>Click <strong>Start Recording</strong> and speak naturally for at least 60 seconds.</span></li>
              <li className="flex gap-3"><span className="text-[#14F1D9] font-bold">02.</span> <span>Use a quiet room and speak at a normal, clear pace.</span></li>
              <li className="flex gap-3"><span className="text-[#14F1D9] font-bold">03.</span> <span>Read a passage, describe your day, or simply talk freely.</span></li>
            </ul>
          </div>

          {/* Recording Area */}
          <AnimatePresence mode="wait">

            {/* IDLE */}
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center gap-8 py-10"
              >
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-[#14F1D9]/5 flex items-center justify-center border border-[#14F1D9]/10 shadow-[0_0_40px_rgba(20,241,217,0.05)]">
                    <Microphone size={64} weight="fill" className="text-[#14F1D9] drop-shadow-[0_0_15px_rgba(20,241,217,0.4)]" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl mb-2">Ready to record</p>
                  <p className="text-white/40 text-sm">Aim for 1–3 minutes of clear speech</p>
                </div>
                <button
                  onClick={startRecording}
                  className="flex items-center gap-3 px-10 py-5 bg-[#14F1D9] text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#14F1D9]/90 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(20,241,217,0.4)] transition-all"
                >
                  <Microphone size={24} weight="fill" /> Start Recording
                </button>
              </motion.div>
            )}

            {/* RECORDING */}
            {state === 'recording' && (
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center gap-8 py-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#FF2E63]/20 animate-ping" />
                  <div className="absolute inset-[-12px] rounded-full bg-[#FF2E63]/10 animate-pulse" />
                  <div className="relative w-32 h-32 rounded-full bg-[#FF2E63]/15 flex items-center justify-center ring-2 ring-[#FF2E63]/30 border border-[#FF2E63]/40">
                    <Microphone size={64} weight="fill" className="text-[#FF2E63] drop-shadow-[0_0_15px_#FF2E63]" />
                  </div>
                </div>

                {/* Fake waveform */}
                <div className="flex items-center gap-1 h-12">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-[#FF2E63]/70 rounded-full"
                      style={{
                        height: `${24 + Math.sin(i * 0.8) * 18 + Math.random() * 12}px`,
                        animationDelay: `${i * 0.05}s`,
                        animation: 'pulse 0.6s ease-in-out infinite alternate',
                      }}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-[#FF2E63] font-black font-headline text-4xl tracking-tighter drop-shadow-[0_0_15px_rgba(255,46,99,0.3)]">{formatDuration(duration)}</p>
                  <p className="text-white/40 text-[10px] mt-2 uppercase tracking-[0.3em] font-black">Active Stream</p>
                </div>

                <button
                  onClick={stopRecording}
                  className="flex items-center gap-3 px-10 py-5 bg-[#FF2E63] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#FF2E63]/90 transition-all shadow-[0_0_30px_rgba(255,46,99,0.4)]"
                >
                  <Stop size={24} weight="fill" /> Stop Recording
                </button>
              </motion.div>
            )}

            {/* RECORDED */}
            {state === 'recorded' && (
              <motion.div
                key="recorded"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center gap-8 py-6"
              >
                <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#14F1D9]/10 flex items-center justify-center text-[#14F1D9] shrink-0 border border-[#14F1D9]/20">
                      <Play size={24} weight="fill" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg tracking-tight">Recording complete</p>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold">{formatDuration(duration)} Captured</p>
                    </div>
                  </div>
                  {audioUrl && (
                    <audio controls src={audioUrl} className="w-full h-12 rounded-xl" />
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <button
                    onClick={reRecord}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <ArrowCounterClockwise size={20} weight="bold" /> Re-record
                  </button>
                  <button
                    onClick={submitVoice}
                    className="flex-[2] flex items-center justify-center gap-2 px-8 py-4 bg-[#6C5CE7] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#6C5CE7]/90 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(108,92,231,0.4)] transition-all"
                  >
                    <Microphone size={20} weight="fill" /> Submit Voice Sample
                  </button>
                </div>
              </motion.div>
            )}

            {/* UPLOADING */}
            {state === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center gap-6 py-10"
              >
                <SpinnerGap size={64} className="text-[#14F1D9] animate-spin" />
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Uploading & Processing...</p>
                  <p className="text-white/40 text-sm mt-1">Generating neural voice matrix</p>
                </div>
              </motion.div>
            )}

            {/* DONE */}
            {state === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-6 py-10"
              >
                <div className="w-20 h-20 rounded-full bg-[#14F1D9]/10 border border-[#14F1D9]/30 flex items-center justify-center shadow-[0_0_40px_rgba(20,241,217,0.2)]">
                  <CheckCircle size={48} className="text-[#14F1D9]" weight="fill" />
                </div>
                <div className="text-center">
                  <p className="text-white font-black font-headline text-2xl mb-2 tracking-tight">Voice Profile Active!</p>
                  <p className="text-white/50 text-sm max-w-sm mx-auto leading-relaxed">
                    {cloneNote
                      ? cloneNote
                      : "Kishan\u0027s voice has been cloned. All generated sentences will use this voice profile."}
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#FF2E63]/10 border border-[#FF2E63]/20 text-[#FF2E63] p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-[0_0_20px_rgba(255,46,99,0.1)]"
              >
                <Warning size={24} weight="fill" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlowCard>
  );
}
