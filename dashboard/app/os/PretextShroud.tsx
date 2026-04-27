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
 * ◈ PRETEXT_SHROUD_V4 — PHASE 96.1
 * 
 * High-fidelity Web Dashboard.
 * Standardized on Gruvbox Material (sainnhe/gruvbox-material-vscode).
 * Features Floating UI components and Pretext Pure Arithmetic layout logic.
 */

const ContextRing = ({ progress, color, label }: { progress: number, color: string, label: string }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1 group">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="w-10 h-10 transform -rotate-90 absolute">
          <circle className="text-[#3c3836]" strokeWidth="3" stroke="currentColor" fill="transparent" r={radius} cx="20" cy="20" />
          <circle
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            strokeWidth="3" stroke={color} fill="transparent" r={radius} cx="20" cy="20"
          />
        </svg>
        <span className="text-[7px] font-bold text-[#ebdbb2] group-hover:text-white transition-colors">{progress}%</span>
      </div>
      <span className="text-[8px] text-[#a89984] font-bold tracking-tighter uppercase">{label}</span>
    </div>
  );
};

export default function PretextShroud() {
  const [layout, setLayout] = useState([
    { i: 'command-artery', x: 0, y: 0, w: 7, h: 14 },
    { i: 'vitals-rack', x: 7, y: 0, w: 5, h: 4 },
    { i: 'tasks-mesh', x: 7, y: 4, w: 5, h: 5 },
    { i: 'synapse-orbit', x: 7, y: 9, w: 5, h: 5 },
    { i: 'terminal-artery', x: 0, y: 14, w: 7, h: 6 },
    { i: 'red-trade-mesh', x: 7, y: 14, w: 5, h: 6 },
  ]);

  return (
    <div className="min-h-screen bg-[#282828] text-[#fbf1c7] font-mono selection:bg-[#fb4934] selection:text-black p-3 overflow-hidden">
      {/* ◈ TACTICAL_COMMAND_BAR */}
      <div className="flex items-stretch gap-3 mb-3 h-20">
        <div className="bg-[#32302f] border border-[#504945] flex-1 flex items-center justify-between px-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 border-2 border-[#fe8019] flex items-center justify-center rotate-45 hover:rotate-90 transition-all duration-500 cursor-pointer bg-black/20 group">
              <span className="text-[12px] font-bold text-[#fe8019] -rotate-45 group-hover:-rotate-90">Σ</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-[0.4em] text-[#fbf1c7] drop-shadow-[0_0_10px_rgba(251,241,199,0.2)]">50V3R31GN_M4CH1N4</h1>
              <div className="text-[10px] text-[#fb4934] font-bold tracking-[0.2em] flex gap-4">
                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#fb4934] animate-pulse" /> SYSTEM_ASCENDING</span>
                <span className="text-[#a89984]">RE-GROUNDED_v3.8.7</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-10">
            <ContextRing progress={85} color="#fb4934" label="NODE_A" />
            <ContextRing progress={42} color="#b8bb26" label="NODE_B" />
            <ContextRing progress={12} color="#83a598" label="NODE_C" />
          </div>
        </div>
        
        <div className="bg-[#32302f] border border-[#504945] w-72 flex flex-col justify-center px-5 shadow-xl relative overflow-hidden group">
          {/* ◈ FLUID_SMOKE EFFECT (CSS Placeholder) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#fb4934]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <span className="text-[8px] text-[#a89984] font-bold mb-1 uppercase tracking-widest relative z-10">Neural_Pulse_Encryption</span>
          <div className="text-[11px] text-[#fabd2f] font-bold bg-black/40 p-2 border border-[#504945] truncate relative z-10 font-mono tracking-tighter">
            9X2-VSB-G3MM4-0012-SINGULARITY
          </div>
        </div>
      </div>

      {/* ◈ MAIN_GRID (Modern Modular) */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        draggableHandle=".handle"
        margin={[10, 10]}
      >
        {/* COMMAND_ARTERY (Chat) */}
        <div key="command-artery" className="bg-[#32302f] border border-[#504945] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden group">
          <div className="handle h-10 border-b border-[#504945] flex items-center px-4 justify-between bg-[#282828] cursor-move group-hover:bg-[#3c3836] transition-colors">
            <span className="text-[10px] font-bold text-[#fe8019] tracking-widest uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#fe8019]" /> ◈ COGNITIVE_INGRESS
            </span>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#fb4934] animate-ping" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#b8bb26]" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-0.5">
            <PretextCommandArtery />
          </div>
        </div>

        {/* VITALS_RACK */}
        <div key="vitals-rack" className="bg-[#32302f] border border-[#504945] shadow-xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#504945] flex items-center px-4 bg-[#282828] cursor-move">
            <span className="text-[9px] font-bold text-[#b8bb26] tracking-[0.2em]">◈ VITALS_RACK</span>
          </div>
          <div className="flex-1 grid grid-cols-2 p-4 gap-4 bg-[#1d2021]/30">
             <div className="flex flex-col gap-1">
               <span className="text-[8px] text-[#a89984] uppercase font-bold">VRAM_Saturation</span>
               <div className="h-2 bg-[#3c3836] rounded-sm overflow-hidden"><div className="h-full bg-[#fb4934] w-[85%]" /></div>
             </div>
             <div className="flex flex-col gap-1">
               <span className="text-[8px] text-[#a89984] uppercase font-bold">Latency_Sync</span>
               <div className="text-[12px] font-bold text-[#b8bb26]">12ms</div>
             </div>
          </div>
        </div>

        {/* TASKS_MESH */}
        <div key="tasks-mesh" className="bg-[#32302f] border border-[#504945] shadow-xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#504945] flex items-center px-4 bg-[#282828] cursor-move">
            <span className="text-[9px] font-bold text-[#fabd2f] tracking-[0.2em]">◈ TASKS_MESH</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTasksMesh />
          </div>
        </div>

        {/* SYNAPSE_ORBIT (3D) */}
        <div key="synapse-orbit" className="bg-[#32302f] border border-[#504945] shadow-2xl flex flex-col overflow-hidden relative group">
          <div className="handle h-8 border-b border-[#504945] flex items-center px-4 bg-[#282828] cursor-move z-10 relative">
            <span className="text-[9px] font-bold text-[#83a598] tracking-[0.2em]">◈ SYNAPSE_ORBIT</span>
          </div>
          <div className="absolute inset-0 pt-8 bg-black">
            <NeuralPromenade />
          </div>
          {/* ◈ FBI REDACTOR OVERLAY */}
          <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 bg-[#fb4934] text-black text-[8px] font-bold hidden group-hover:block uppercase tracking-tighter animate-pulse">
            CLASSIFIED_LORE_LEAK_PROTECTION_ACTIVE
          </div>
        </div>

        {/* TERMINAL_ARTERY */}
        <div key="terminal-artery" className="bg-[#32302f] border border-[#504945] shadow-xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#504945] flex items-center px-4 bg-[#282828] cursor-move">
            <span className="text-[9px] font-bold text-[#d3869b] tracking-[0.2em]">◈ TERMINAL_ARTERY</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTerminalArtery />
          </div>
        </div>

        {/* RED_TRADE_MESH */}
        <div key="red-trade-mesh" className="bg-[#32302f] border border-[#504945] shadow-xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#504945] flex items-center px-4 bg-[#282828] cursor-move">
            <span className="text-[9px] font-bold text-[#fe8019] tracking-[0.2em]">◈ RED_TRADE_MESH</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextMarketArtery />
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
