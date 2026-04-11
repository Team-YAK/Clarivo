"use client";

import React from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import ButtonGrid from '@/components/patient/ButtonGrid';
import CaregiverPanel from '@/components/caregiver/CaregiverPanel';

export default function PatientScreen() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-950 font-sans">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={65} minSize={50}>
          <ButtonGrid />
        </Panel>
        
        <PanelResizeHandle className="w-2 relative bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-col-resize group flex items-center justify-center">
          {/* Drag Handle Indicator */}
          <div className="w-1 h-12 bg-zinc-600 rounded-full group-hover:bg-zinc-400 transition-colors" />
        </PanelResizeHandle>
        
        <Panel defaultSize={35} minSize={25} maxSize={50}>
          <CaregiverPanel />
        </Panel>
      </PanelGroup>
    </div>
  );
}
