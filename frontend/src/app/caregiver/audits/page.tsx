"use client";

import React, { useState, useEffect } from 'react';
import { fetchSessionHistory, exportSessionHistory } from '@/utils/caregiverApi';
import { Session } from '../../../../../shared/api-contract';
import { FileText, DownloadSimple, Funnel, CalendarBlank, MagnifyingGlass, ArrowsClockwise } from '@phosphor-icons/react';
import { PageTransition } from '@/components/ui/page-transition';
import { GlassInput } from '@/components/ui/glass-input';

export default function SessionAuditor() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSessionHistory().then(data => {
      setSessions(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    await exportSessionHistory();
    setExporting(false);
  };

  const filteredSessions = sessions.filter(s => 
    (s.sentence || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.path || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white/40 font-black uppercase tracking-widest gap-4">
        <ArrowsClockwise size={40} className="animate-spin text-[#14F1D9]" />
        Auditing Encrypted Logs...
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen bg-[#050505] text-white p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-2">Session Auditor</h1>
          <p className="text-white/60 text-lg">A complete, exportable ledger of all generative communication sequences.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-3 bg-[#14F1D9] text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(20,241,217,0.3)] hover:bg-[#14F1D9]/90 transition-all hover:-translate-y-1 disabled:opacity-50"
        >
          {exporting ? <ArrowsClockwise size={20} className="animate-spin" /> : <DownloadSimple size={20} weight="bold" />}
          {exporting ? 'Processing...' : 'Export Report'}
        </button>
      </div>

      <div className="bg-[#050505]/60 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[650px] relative liquid-glass-card">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row gap-4 z-10 relative">
          <div className="flex-1 relative">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" />
            <GlassInput
              type="text"
              placeholder="Search sentences or pathways..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 !bg-white/5 !border-white/10 focus:!border-[#14F1D9] !text-white"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white/5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <CalendarBlank size={18} /> Range
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-white/5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <Funnel size={18} /> Filters
            </button>
          </div>
        </div>

        {/* Table wrapper */}
        <div className="flex-1 overflow-auto no-scrollbar z-10 relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#050505] shadow-xl z-20">
              <tr>
                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40">Timestamp</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40">Generation Path</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40">Final Output Sentence</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40 text-center">Confidence</th>
                <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-white/40 text-center">Flagged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-white/5 transition-all group">
                  <td className="p-6 text-white/40 text-xs font-medium whitespace-nowrap">
                    {new Date(session.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </td>
                  <td className="p-6">
                    <div className="flex gap-1.5 items-center flex-wrap">
                      {(session.path || []).map((p: string, i: number) => (
                        <React.Fragment key={i}>
                          <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/60">{p}</span>
                          {i < (session.path || []).length - 1 && <span className="text-white/20 text-[10px]">▶</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="p-6 font-bold text-white text-lg tracking-tight">"{session.sentence}"</td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${session.confidence >= 90 ? 'bg-[#14F1D9]/10 text-[#14F1D9] border-[#14F1D9]/30' : session.confidence >= 70 ? 'bg-[#6C5CE7]/10 text-[#6C5CE7] border-[#6C5CE7]/30' : 'bg-[#FF2E63]/10 text-[#FF2E63] border-[#FF2E63]/30'}`}>
                      {session.confidence}%
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    {session.flagged ? (
                      <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#FF2E63] shadow-[0_0_15px_#FF2E63] animate-pulse" title="Distress Flagged"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-white/10"></span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-500">
                      <div className="p-8 bg-white/5 rounded-full border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
                         <MagnifyingGlass size={64} className="text-white/10" weight="duotone" />
                      </div>
                      <div>
                        <p className="font-headline font-black text-2xl text-white mb-2 tracking-tight">No Sessions Found</p>
                        <p className="text-white/30 text-sm font-medium uppercase tracking-widest">Adjust search criteria or remove filters</p>
                      </div>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-2 px-8 py-3 bg-white/5 text-[#14F1D9] font-black uppercase tracking-widest text-[10px] border border-[#14F1D9]/30 rounded-xl hover:bg-[#14F1D9]/10 transition-all"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-white/10 bg-white/5 text-[10px] text-white/30 text-center font-black uppercase tracking-[0.2em] z-10 relative">
          Showing {filteredSessions.length} total tracked sequences.
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
