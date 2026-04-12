"use client";

import React, { useState } from 'react';
import { fetchSessionHistory } from '@/utils/caregiverApi';
import { Session } from '../../../../../shared/api-contract';
import { FileText, DownloadSimple, Funnel, CalendarBlank, MagnifyingGlass } from '@phosphor-icons/react';
import { PageTransition } from '@/components/ui/page-transition';
import { GlassInput } from '@/components/ui/glass-input';

// Mock expanded sessions
const MOCK_AUDIT_SESSIONS = [
  ...Array(15).fill(null).map((_, i) => ({
    id: `session-${i}`,
    user_id: 'alex_demo',
    path: ['Needs', 'Medical', 'Pain'],
    path_key: 'needs_medical_pain',
    input_mode: 'tree' as const,
    sentence: `I am experiencing pain in my ${i % 2 === 0 ? 'head' : 'stomach'}.`,
    confidence: Math.floor(Math.random() * 40) + 60,
    is_first_occurrence: false,
    flagged: i % 4 === 0,
    status: 'confirmed' as const,
    timestamp: new Date(Date.now() - i * 3600000).toISOString()
  }))
];

export default function SessionAuditor() {
  const [sessions] = useState<Session[]>(MOCK_AUDIT_SESSIONS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter(s => 
    s.sentence.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.path.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageTransition>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Session Auditor</h1>
          <p className="text-on-surface-variant text-lg">A complete, exportable ledger of all generative communication sequences.</p>
        </div>
        <button className="flex items-center gap-2 bg-surface-container-highest text-on-surface border border-outline-variant/30 px-6 py-3 rounded-xl font-bold hover:bg-outline-variant/20 transition-colors">
          <DownloadSimple size={20} weight="bold" /> Export Report for Doctor
        </button>
      </div>

      <div className="bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" />
            <GlassInput
              type="text"
              placeholder="Search sentences or pathways..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
            <CalendarBlank size={18} /> Date Range
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors">
            <Funnel size={18} /> Filters
          </button>
        </div>

        {/* Table wrapper */}
        <div className="flex-1 overflow-auto bg-surface-container-lowest">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-surface-container-high shadow-sm z-10">
              <tr>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Timestamp</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Generation Path</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant">Final Output Sentence</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-center">Confidence</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider text-on-surface-variant text-center">Flagged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="p-4 text-on-surface-variant whitespace-nowrap">
                    {new Date(session.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 items-center flex-wrap">
                      {session.path.map((p: string, i: number) => (
                        <React.Fragment key={i}>
                          <span className="px-2 py-0.5 bg-surface-variant/30 rounded text-xs font-medium text-on-surface-variant">{p}</span>
                          {i < session.path.length - 1 && <span className="text-outline-variant/50 text-[10px]">▶</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-on-surface text-base">"{session.sentence}"</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${session.confidence >= 90 ? 'bg-green-500/15 text-green-500' : session.confidence >= 70 ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
                      {session.confidence}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {session.flagged ? (
                      <span className="inline-block w-3 h-3 rounded-full bg-error ring-4 ring-error/20" title="Distress Flagged"></span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-outline-variant/30"></span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center bg-surface-container-lowest">
                    <div className="flex flex-col items-center justify-center gap-4 animate-in zoom-in duration-500">
                      <div className="p-6 bg-surface-container rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                         <MagnifyingGlass size={48} className="text-outline-variant" weight="duotone" />
                      </div>
                      <div>
                        <p className="font-headline font-black text-xl text-on-surface mb-1">No Sessions Found</p>
                        <p className="text-on-surface-variant text-sm font-medium">Try adjusting your search criteria or removing filters.</p>
                      </div>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-2 px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors"
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
        
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-highest text-xs text-on-surface-variant text-center font-bold">
          Showing {filteredSessions.length} out of 1,204 total tracked sequences.
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
