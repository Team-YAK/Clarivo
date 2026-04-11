"use client";

import React, { useState } from 'react';
import { cloneVoice } from '@/utils/caregiverApi';
import { Microphone, UploadSimple, CheckCircle, SpinnerGap, Warning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceCloneOnboarding() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await cloneVoice(file);
      if (result.success) {
        setSuccess(true);
      } else {
        throw new Error('Upload failed');
      }
    } catch (e: any) {
      setError(e.message || "Failed to clone voice. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-surface rounded-3xl shadow-sm border border-outline-variant/20">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center">
          <Microphone size={24} weight="fill" />
        </div>
        <div>
          <h2 className="text-2xl font-headline font-bold text-on-surface">Voice Cloning Setup</h2>
          <p className="text-on-surface-variant text-sm mt-1">Preserve tone, identity, and comfort for the patient.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-surface-container-low p-5 rounded-2xl">
          <h3 className="font-bold text-on-surface mb-2">Instructions</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
            <li>Find a clear, high-quality audio recording of the patient&apos;s voice.</li>
            <li>Supported formats: .mp3, .wav, .m4a.</li>
            <li>At least 1 minute of clear speech without background noise is required for best results.</li>
          </ul>
        </div>

        {/* Upload Area */}
        <div className="relative">
          <label className={`
            flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors
            ${file ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface-container-lowest hover:border-primary/50'}
            ${success ? 'border-green-500 bg-green-50' : ''}
          `}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              {success ? (
                <CheckCircle size={48} className="text-green-500 mb-3" weight="fill" />
              ) : (
                <UploadSimple size={48} className={`mb-3 ${file ? 'text-primary' : 'text-on-surface-variant'}`} />
              )}
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={file ? 'has-file' : 'no-file'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {success ? (
                    <p className="text-green-700 font-bold font-headline mb-1">Voice Cloned Successfully!</p>
                  ) : file ? (
                    <p className="text-primary font-bold font-headline mb-1">{file.name}</p>
                  ) : (
                    <p className="mb-2 text-sm text-on-surface-variant">
                      <span className="font-bold text-primary">Click to upload</span> or drag and drop
                    </p>
                  )}
                  {!success && <p className="text-xs text-on-surface-variant">MP3, WAV, or M4A (Max: 10MB)</p>}
                </motion.div>
              </AnimatePresence>
            </div>
            <input type="file" className="hidden" accept=".mp3,.wav,.m4a,audio/*" onChange={handleFileChange} disabled={isUploading || success} />
          </label>
        </div>

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

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button 
            disabled={!file || isUploading || success}
            onClick={handleUpload}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-bold font-headline transition-all
              ${!file || success ? 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary/90 hover:-translate-y-1 hover:shadow-lg'}
            `}
          >
            {isUploading ? (
              <>
                <SpinnerGap size={20} className="animate-spin" /> Uploading & Processing...
              </>
            ) : success ? (
              'Complete'
            ) : (
              'Start Cloning Process'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
