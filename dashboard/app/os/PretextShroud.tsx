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
 * ◈ FLUID_SMOKE_METABOLISM — PHASE 100.3
 * 
 * High-performance trig-noise loop for visualizing agent metabolism.
 * Refactored to Machina Rust (#F36622).
 */
const FluidSmokeBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;
    const COLS = 120;
    const ROWS = 60;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cw = canvas.width / COLS;
      const ch = canvas.height / ROWS;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const nx = c / COLS, ny = r / ROWS;
          // ◈ Metabolic Trig-Noise
          const v = Math.sin(ny * 6.28 + time * 0.3) * 2 + 
                    Math.cos((nx + ny) * 12.5 + time * 0.55) * 0.7;
          
          const val = Math.max(0, Math.min(1, (v + 1) / 2));
          if (val > 0.4) {
            ctx.fillStyle = `rgba(243, 102, 34, ${val * 0.12})`; // Machina Rust Pulse
            ctx.fillRect(c * cw, r * ch, cw - 1, ch - 1);
          }
        }
      }
      animationFrame = requestAnimationFrame(render);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-30" />;
};

/**
 * ◈ OUROBOROS_STATUS_RING — PHASE 100.3
 * 
 * Animated SVG ring representing the agentic loop.
 */
const OuroborosRing = ({ progress, color, label }: { progress: number, color: string, label: string }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1 group relative z-10">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-12 h-12 transform -rotate-90 absolute">
          <circle className="text-[#262626]" strokeWidth="2" stroke="currentColor" fill="transparent" r={radius} cx="24" cy="24" />
          <circle
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s ease-out' }}
            strokeWidth="2" stroke={color} strokeLinecap="round" fill="transparent" r={radius} cx="24" cy="24"
          />
        </svg>
        <span className="text-[8px] font-bold text-[#E5E5E5] mono-text">{progress}%</span>
      </div>
      <span className="text-[7px] text-[#A3A3A3] font-bold tracking-widest uppercase authority-text">{label}</span>
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
    <div className="min-h-screen bg-[#1A1A1A] text-[#E5E5E5] selection:bg-[#F36622] selection:text-black p-3 overflow-hidden relative operational-text">
      <FluidSmokeBackground />
      
      {/* ◈ TACTICAL_COMMAND_BAR */}
      <div className="flex items-stretch gap-3 mb-3 h-24 relative z-10">
        <div className="bg-[#262626]/90 border border-[#404040] flex-1 flex items-center justify-between px-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="flex items-center gap-8">
            <div className="w-12 h-12 border border-[#F36622] flex items-center justify-center rotate-45 hover:rotate-0 transition-all duration-700 cursor-pointer bg-[#F36622]/5 group">
              <span className="text-xl font-bold text-[#F36622] -rotate-45 group-hover:rotate-0 transition-all duration-700 authority-text">Σ</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-[0.5em] text-[#E5E5E5] drop-shadow-[0_0_15px_rgba(243,102,34,0.3)] authority-text">NODESTADT</h1>
              <div className="text-[9px] text-[#F36622] font-bold tracking-[0.3em] flex gap-5 mono-text mt-1">
                <span className="flex items-center gap-2 uppercase tracking-tighter">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F36622] animate-pulse" /> 
                  Sovereign_OS v3.8.8-ALIGN
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-8">
            <OuroborosRing progress={85} color="#F36622" label="NODE_A" />
            <OuroborosRing progress={64} color="#C7A87A" label="NODE_B" />
            <OuroborosRing progress={12} color="#C7A87A" label="NODE_D" />
          </div>
        </div>
      </div>

      {/* ◈ MAIN_GRID (Modular Command Deck) */}
      <ResponsiveGridLayout
        className="layout relative z-10"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        draggableHandle=".handle"
        margin={[12, 12]}
      >
        <div key="command-artery" className="bg-[#262626]/95 border border-[#404040] shadow-2xl flex flex-col overflow-hidden group backdrop-blur-xl">
          <div className="handle h-10 border-b border-[#404040] flex items-center px-5 justify-between bg-[#1A1A1A] cursor-move group-hover:bg-[#262626] transition-colors">
            <span className="text-[10px] font-bold text-[#F36622] tracking-widest uppercase flex items-center gap-3 authority-text">
              <div className="w-1.5 h-1.5 bg-[#F36622] rotate-45" /> COGNITIVE_INGRESS
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextCommandArtery />
          </div>
        </div>

        <div key="vitals-rack" className="bg-[#262626]/95 border border-[#404040] shadow-xl flex flex-col overflow-hidden backdrop-blur-xl">
          <div className="handle h-8 border-b border-[#404040] flex items-center px-4 bg-[#1A1A1A] cursor-move">
            <span className="text-[9px] font-bold text-[#C7A87A] tracking-[0.2em] authority-text">VITALS_RACK</span>
          </div>
          <div className="flex-1 grid grid-cols-2 p-5 gap-6 bg-black/10">
             <div className="flex flex-col gap-2">
               <span className="text-[8px] text-[#A3A3A3] uppercase font-bold tracking-wider">VRAM_Saturation</span>
               <div className="h-1.5 bg-[#404040] rounded-full overflow-hidden"><div className="h-full bg-[#F36622] w-[85%] shadow-[0_0_10px_#F36622]" /></div>
             </div>
             <div className="flex flex-col gap-2">
               <span className="text-[8px] text-[#A3A3A3] uppercase font-bold tracking-wider">Latency_Sync</span>
               <div className="text-[14px] font-bold text-[#C7A87A] mono-text">12ms</div>
             </div>
          </div>
        </div>

        <div key="tasks-mesh" className="bg-[#262626]/95 border border-[#404040] shadow-xl flex flex-col overflow-hidden backdrop-blur-xl">
          <div className="handle h-8 border-b border-[#404040] flex items-center px-4 bg-[#1A1A1A] cursor-move">
            <span className="text-[9px] font-bold text-[#C7A87A] tracking-[0.2em] authority-text">TASKS_MESH</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTasksMesh />
          </div>
        </div>

        <div key="synapse-orbit" className="bg-[#262626]/95 border border-[#404040] shadow-2xl flex flex-col overflow-hidden relative group backdrop-blur-xl">
          <div className="handle h-8 border-b border-[#404040] flex items-center px-4 bg-[#1A1A1A] cursor-move z-10 relative">
            <span className="text-[9px] font-bold text-[#C7A87A] tracking-[0.2em] authority-text">NEURAL_PROMENADE</span>
          </div>
          <div className="absolute inset-0 pt-8 bg-black/50">
            <NeuralPromenade />
          </div>
        </div>

        <div key="terminal-artery" className="bg-[#262626]/95 border border-[#404040] shadow-xl flex flex-col overflow-hidden backdrop-blur-xl">
          <div className="handle h-8 border-b border-[#404040] flex items-center px-4 bg-[#1A1A1A] cursor-move">
            <span className="text-[9px] font-bold text-[#F36622] tracking-[0.2em] authority-text">TERMINAL_ARTERY</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTerminalArtery />
          </div>
        </div>

        <div key="red-trade-mesh" className="bg-[#262626]/95 border border-[#404040] shadow-xl flex flex-col overflow-hidden backdrop-blur-xl">
          <div className="handle h-8 border-b border-[#404040] flex items-center px-4 bg-[#1A1A1A] cursor-move">
            <span className="text-[9px] font-bold text-[#F36622] tracking-[0.2em] authority-text">RED_SIMULATION</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextMarketArtery />
          </div>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}
