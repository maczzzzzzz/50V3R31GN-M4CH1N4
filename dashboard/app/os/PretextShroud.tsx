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
 * PRETEXT_SHROUD_MODERN — v3.8.7
 * 
 * Modular, grid-aligned command center.
 * Inspired by hermes-ui but hardened with Gruvbox physicality.
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
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.8s ease' }}
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
    <div className="min-h-screen bg-[#1d2021] text-[#ebdbb2] font-mono selection:bg-[#fb4934] selection:text-black p-2">
      {/* ◈ TOP_COMMAND_BAR */}
      <div className="flex items-stretch gap-2 mb-2 h-20">
        <div className="bg-[#282828] border border-[#3c3836] flex-1 flex items-center justify-between px-6 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 border-2 border-[#fb4934] flex items-center justify-center rotate-45 group hover:rotate-90 transition-transform cursor-pointer bg-black/20">
              <span className="text-[10px] font-bold text-[#fb4934] -rotate-45 group-hover:-rotate-90">S_OS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-[0.3em] text-[#ebdbb2]">50V3R31GN_M4CH1N4</h1>
              <div className="text-[9px] text-[#fb4934] font-bold tracking-widest flex gap-4">
                <span>:: STATUS_OPERATIONAL</span>
                <span className="text-[#a89984]">:: v3.8.7_SINGULARITY</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-8">
            <ContextRing progress={85} color="#fb4934" label="Node_A" />
            <ContextRing progress={42} color="#b8bb26" label="Node_B" />
            <ContextRing progress={12} color="#83a598" label="Node_C" />
          </div>
        </div>
        
        <div className="bg-[#282828] border border-[#3c3836] w-64 flex flex-col justify-center px-4 shadow-xl">
          <span className="text-[8px] text-[#a89984] font-bold mb-1 uppercase tracking-widest">Global_Access_Key</span>
          <div className="text-xs text-[#fabd2f] font-bold bg-black/40 p-2 border border-[#3c3836] truncate">
            7X8-VSB-MMAP-9923-TRINITY
          </div>
        </div>
      </div>

      {/* ◈ MAIN_MODULAR_GRID */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        draggableHandle=".handle"
        margin={[8, 8]}
      >
        {/* COMMAND_ARTERY */}
        <div key="command-artery" className="bg-[#282828] border border-[#3c3836] shadow-2xl flex flex-col overflow-hidden">
          <div className="handle h-10 border-b border-[#3c3836] flex items-center px-4 justify-between bg-[#1d2021]/50 cursor-move hover:bg-[#3c3836]/20 transition-colors">
            <span className="text-[10px] font-bold text-[#fe8019] tracking-widest">◈ COMMAND_ARTERY</span>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#fb4934] animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#b8bb26]" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-1">
            <PretextCommandArtery />
          </div>
        </div>

        {/* VITALS_RACK */}
        <div key="vitals-rack" className="bg-[#282828] border border-[#3c3836] shadow-2xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#3c3836] flex items-center px-4 bg-[#1d2021]/50 cursor-move">
            <span className="text-[9px] font-bold text-[#b8bb26] tracking-widest">◈ VITALS_RACK</span>
          </div>
          <div className="flex-1 grid grid-cols-2 p-4 gap-4">
             <div className="flex flex-col">
               <span className="text-[8px] text-[#a89984]">VRAM_PRESSURE</span>
               <div className="h-1.5 bg-[#3c3836] mt-1"><div className="h-full bg-[#fb4934] w-[85%]" /></div>
             </div>
             <div className="flex flex-col">
               <span className="text-[8px] text-[#a89984]">MMAP_SYNC</span>
               <div className="text-[10px] font-bold text-[#b8bb26] mt-1">NOMINAL</div>
             </div>
          </div>
        </div>

        {/* TASKS_MESH */}
        <div key="tasks-mesh" className="bg-[#282828] border border-[#3c3836] shadow-2xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#3c3836] flex items-center px-4 bg-[#1d2021]/50 cursor-move">
            <span className="text-[9px] font-bold text-[#fabd2f] tracking-widest">◈ TASKS_MESH</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTasksMesh />
          </div>
        </div>

        {/* SYNAPSE_ORBIT */}
        <div key="synapse-orbit" className="bg-[#282828] border border-[#3c3836] shadow-2xl flex flex-col overflow-hidden relative">
          <div className="handle h-8 border-b border-[#3c3836] flex items-center px-4 bg-[#1d2021]/50 cursor-move z-10">
            <span className="text-[9px] font-bold text-[#83a598] tracking-widest">◈ SYNAPSE_ORBIT</span>
          </div>
          <div className="absolute inset-0 pt-8 bg-black">
            <NeuralPromenade />
          </div>
        </div>

        {/* TERMINAL_ARTERY */}
        <div key="terminal-artery" className="bg-[#282828] border border-[#3c3836] shadow-2xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#3c3836] flex items-center px-4 bg-[#1d2021]/50 cursor-move">
            <span className="text-[9px] font-bold text-[#d3869b] tracking-widest">◈ TERMINAL_ARTERY</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTerminalArtery />
          </div>
        </div>

        {/* RED_TRADE_MESH */}
        <div key="red-trade-mesh" className="bg-[#282828] border border-[#3c3836] shadow-2xl flex flex-col overflow-hidden">
          <div className="handle h-8 border-b border-[#3c3836] flex items-center px-4 bg-[#1d2021]/50 cursor-move">
            <span className="text-[9px] font-bold text-[#fe8019] tracking-widest">◈ RED_TRADE_MESH</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextMarketArtery />
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
