"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import NeuralPromenade from './NeuralPromenade';
import PretextMarketArtery from '@/components/PretextMarketArtery';
import PretextCommandArtery from '@/components/PretextCommandArtery';
import PretextTasksMesh from '@/components/PretextTasksMesh';
import PretextTerminalArtery from '@/components/PretextTerminalArtery';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * PRETEXT_SHROUD — PHASE 93.9 TOTAL_UNIFICATION
 * 
 * The monolithic, high-density UI baseline for the Sovereign Trinity.
 * Achieves 100% parity with the Flutter Mobile HUD.
 */

const ContextRing = ({ progress, color, label }: { progress: number, color: string, label: string }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          className="text-[#3c3836]"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="24"
          cy="24"
        />
        <circle
          style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }}
          strokeWidth="2"
          stroke={color}
          fill="transparent"
          r={radius}
          cx="24"
          cy="24"
        />
      </svg>
      <span className="text-[8px] text-[#a89984] font-bold">{label}</span>
    </div>
  );
};

export default function PretextShroud() {
  const [layout, setLayout] = useState([
    { i: 'command-artery', x: 0, y: 0, w: 6, h: 10 },
    { i: 'telemetry-pulse', x: 6, y: 0, w: 3, h: 4 },
    { i: 'tasks-mesh', x: 9, y: 0, w: 3, h: 4 },
    { i: 'synapse-orbit', x: 6, y: 4, w: 6, h: 6 },
    { i: 'terminal-artery', x: 0, y: 10, w: 6, h: 4 },
    { i: 'red-trade-mesh', x: 6, y: 10, w: 6, h: 4 },
  ]);

  useEffect(() => {
    // ◈ Hermes Singularity SSE Ingress
    const eventSource = new EventSource('http://localhost:3015/stream');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'LAYOUT_ADJUST') {
        setLayout(data.layout);
      }
    };
    return () => eventSource.close();
  }, []);

  const onLayoutChange = async (currentLayout: any) => {
    setLayout(currentLayout);
    console.log("::/HUD_LAYOUT_UPDATE");
  };

  return (
    <div className="min-h-screen bg-[#1d2021] text-[#ebdbb2] font-mono selection:bg-[#fb4934] selection:text-[#282828] overflow-hidden">
      {/* MONOLITHIC_HEADER */}
      <div className="border-b border-[#3c3836] p-4 flex items-center justify-between bg-[#282828] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#fe8019] flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(254,128,25,0.4)]">
            <span className="text-xs text-[#fe8019] font-bold text-[10px]">RNG</span>
          </div>
          <div>
            <h1 className="text-2xl tracking-[0.2em] font-bold text-[#fb4934]">
              50V3R31GN_M4CH1N4
            </h1>
            <div className="text-[10px] text-[#a89984] font-bold tracking-widest opacity-80">
              INTELLIGENCE_OS // HUD_V2 // THE_SINGULARITY
            </div>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <ContextRing progress={85} color="#fb4934" label="NODE_A" />
          <ContextRing progress={42} color="#b8bb26" label="NODE_B" />
          <ContextRing progress={12} color="#83a598" label="NODE_C" />
          <div className="h-10 w-[1px] bg-[#3c3836] mx-2" />
          <div className="flex flex-col text-[10px] text-[#a89984]">
            <span className="text-[#fe8019] font-bold">RADV_VULKAN</span>
            <span>AMDGPU_9060XT</span>
          </div>
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        draggableHandle=".handle"
        onLayoutChange={onLayoutChange}
      >
        {/* COMMAND_ARTERY */}
        <div key="command-artery" className="bg-[#282828] border border-[#3c3836] rounded shadow-inner flex flex-col overflow-hidden group">
          <div className="handle p-2 border-b border-[#3c3836] flex items-center justify-between cursor-move bg-[#282828] group-hover:bg-[#32302f] transition-colors">
            <span className="text-[10px] text-[#fe8019] font-bold tracking-widest">◈ COMMAND_ARTERY</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[#fb4934]" />
              <div className="w-2 h-2 rounded-full bg-[#b8bb26]" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden bg-[#1d2021]">
            <PretextCommandArtery />
          </div>
        </div>

        {/* TELEMETRY_PULSE */}
        <div key="telemetry-pulse" className="bg-[#282828] border border-[#3c3836] rounded shadow-inner overflow-hidden group">
          <div className="handle p-2 border-b border-[#3c3836] cursor-move bg-[#282828] group-hover:bg-[#32302f] transition-colors">
            <span className="text-[10px] text-[#b8bb26] font-bold tracking-widest">◈ TELEMETRY_PULSE</span>
          </div>
          <div className="p-4 h-full flex items-center justify-center bg-[#1d2021]">
             <div className="text-[10px] text-[#a89984] animate-pulse font-bold tracking-tighter">STREAMING_VITALS...</div>
          </div>
        </div>

        {/* TASKS_MESH */}
        <div key="tasks-mesh" className="bg-[#282828] border border-[#3c3836] rounded shadow-inner overflow-hidden group">
          <div className="handle p-2 border-b border-[#3c3836] cursor-move bg-[#282828] group-hover:bg-[#32302f] transition-colors">
            <span className="text-[10px] text-[#fabd2f] font-bold tracking-widest">◈ TASKS_MESH</span>
          </div>
          <div className="flex-1 h-full bg-[#1d2021] overflow-hidden">
            <PretextTasksMesh />
          </div>
        </div>

        {/* SYNAPSE_ORBIT */}
        <div key="synapse-orbit" className="bg-[#282828] border border-[#3c3836] rounded shadow-inner overflow-hidden relative group">
          <div className="handle p-2 border-b border-[#3c3836] cursor-move z-10 relative bg-[#282828] group-hover:bg-[#32302f] transition-colors">
            <span className="text-[10px] text-[#83a598] font-bold tracking-widest">◈ SYNAPSE_ORBIT</span>
          </div>
          <div className="absolute inset-0 pt-8 bg-black">
            <NeuralPromenade />
          </div>
        </div>

        {/* TERMINAL_ARTERY */}
        <div key="terminal-artery" className="bg-[#282828] border border-[#3c3836] rounded shadow-inner overflow-hidden group">
          <div className="handle p-2 border-b border-[#3c3836] cursor-move bg-[#282828] group-hover:bg-[#32302f] transition-colors">
            <span className="text-[10px] text-[#d3869b] font-bold tracking-widest">◈ TERMINAL_ARTERY</span>
          </div>
          <div className="h-full overflow-hidden bg-black">
            <PretextTerminalArtery />
          </div>
        </div>

        {/* RED_TRADE_MESH */}
        <div key="red-trade-mesh" className="bg-[#282828] border border-[#3c3836] rounded shadow-inner overflow-hidden group">
          <div className="handle p-2 border-b border-[#3c3836] cursor-move bg-[#282828] group-hover:bg-[#32302f] transition-colors">
            <span className="text-[10px] text-[#fe8019] font-bold tracking-widest">◈ RED_TRADE_MESH</span>
          </div>
          <div className="h-full overflow-hidden bg-[#1d2021]">
            <PretextMarketArtery />
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
