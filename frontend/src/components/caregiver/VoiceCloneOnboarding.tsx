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
    try {
      const file = new File([audioBlob], 'voice_sample.webm', { type: audioBlob.type });
      const result = await cloneVoice(file);
      if (result.success) {
        setState('done');
      } else {
        throw new Error('Upload failed');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to clone voice. Please try again.');
      setState('recorded');
    }
  };

  return (
    <GlowCard customSize glowColor="purple" className="!p-0 !gap-0 !grid-rows-[1fr] !shadow-none rounded-3xl w-full max-w-2xl mx-auto">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center">
            <Microphone size={24} weight="fill" />
          </div>
          <div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">Voice Cloning Setup</h2>
            <p className="text-on-surface-variant text-sm mt-1">Record directly in the browser — no file upload needed.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-surface-container-low p-5 rounded-2xl">
            <h3 className="font-bold text-on-surface mb-2">Instructions</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
              <li>Click <strong>Start Recording</strong> and speak naturally for at least 60 seconds.</li>
              <li>Use a quiet room and speak at a normal, clear pace.</li>
              <li>Read a passage, describe your day, or simply talk freely.</li>
            </ul>
          </div>

          {/* Recording Area */}
          <AnimatePresence mode="wait">

            {/* IDLE */}
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center gap-6 py-10"
              >
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                    <Microphone size={52} weight="fill" className="text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-on-surface font-bold text-lg mb-1">Ready to record</p>
                  <p className="text-on-surface-variant text-sm">Aim for 1–3 minutes of clear speech</p>
                </div>
                <button
                  onClick={startRecording}
                  className="flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold font-headline text-base hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg transition-all shadow-md"
                >
                  <Microphone size={22} weight="fill" /> Start Recording
                </button>
              </motion.div>
            )}

            {/* RECORDING */}
            {state === 'recording' && (
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center gap-6 py-10"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-error/20 animate-ping" />
                  <div className="absolute inset-[-8px] rounded-full bg-error/10 animate-pulse" />
                  <div className="relative w-28 h-28 rounded-full bg-error/15 flex items-center justify-center ring-4 ring-error/30">
                    <Microphone size={52} weight="fill" className="text-error" />
                  </div>
                </div>

                {/* Fake waveform */}
                <div className="flex items-center gap-0.5 h-10">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-error/70 rounded-full"
                      style={{
                        height: `${20 + Math.sin(i * 0.8) * 14 + Math.random() * 10}px`,
                        animationDelay: `${i * 0.05}s`,
                        animation: 'pulse 0.6s ease-in-out infinite alternate',
                      }}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-error font-black font-headline text-2xl tracking-wider">{formatDuration(duration)}</p>
                  <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-widest font-bold">Recording...</p>
                </div>

                <button
                  onClick={stopRecording}
                  className="flex items-center gap-3 px-8 py-4 bg-error text-on-error rounded-2xl font-bold font-headline text-base hover:bg-error/90 transition-all shadow-md"
                >
                  <Stop size={22} weight="fill" /> Stop Recording
                </button>
              </motion.div>
            )}

            {/* RECORDED */}
            {state === 'recorded' && (
              <motion.div
                key="recorded"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center gap-6 py-6"
              >
                <div className="w-full bg-surface-container-low rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Play size={18} weight="fill" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">Recording complete</p>
                      <p className="text-xs text-on-surface-variant">{formatDuration(duration)} recorded</p>
                    </div>
                  </div>
                  {audioUrl && (
                    <audio controls src={audioUrl} className="w-full h-10 rounded-xl" />
                  )}
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={reRecord}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                  >
                    <ArrowCounterClockwise size={18} weight="bold" /> Re-record
                  </button>
                  <button
                    onClick={submitVoice}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold font-headline hover:bg-primary/90 hover:-translate-y-0.5 transition-all shadow-md"
                  >
                    <Microphone size={18} weight="fill" /> Submit Voice Sample
                  </button>
                </div>
              </motion.div>
            )}

            {/* UPLOADING */}
            {state === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center gap-4 py-10"
              >
                <SpinnerGap size={52} className="text-primary animate-spin" />
                <p className="text-on-surface font-bold">Uploading & Processing...</p>
                <p className="text-on-surface-variant text-sm">This may take a few seconds</p>
              </motion.div>
            )}

            {/* DONE */}
            {state === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-10"
              >
                <CheckCircle size={64} className="text-emerald-500" weight="fill" />
                <div className="text-center">
                  <p className="text-emerald-700 font-black font-headline text-xl mb-1">Voice Cloned Successfully!</p>
                  <p className="text-on-surface-variant text-sm">Kishan&apos;s voice is now active. All generated sentences will use this voice profile.</p>
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
                className="bg-error-container text-on-error-container p-3 rounded-lg flex items-center gap-2 text-sm"
              >
                <Warning size={20} weight="fill" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GlowCard>
  );
}
