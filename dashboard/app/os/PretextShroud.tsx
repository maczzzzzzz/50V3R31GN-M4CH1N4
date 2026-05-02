"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import NeuralPromenade from './NeuralPromenade';
import PretextCommandArtery from '@/components/PretextCommandArtery';
import PretextTasksMesh from '@/components/PretextTasksMesh';
import PretextTerminalArtery from '@/components/PretextTerminalArtery';
import SovereignIgnitionTrigger from '@/components/SovereignIgnitionTrigger';
import HermesProxy from '@/components/HermesProxy';
import KernelMonitor from '@/components/KernelMonitor';
import DirectorPulse from '@/components/DirectorPulse';
import VsbWaveform from '@/components/VsbWaveform';
import SynapsePanel from '@/components/SynapsePanel';
import { AgentSwarm } from '@/components/AgentSwarm';
import { useSovereignTelemetry } from "@/hooks/useSovereignTelemetry";
import { useNucleusWS } from "@/hooks/useNucleusWS";

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * ◈ PRETEXT_TEXT_GEOMETRY — v3.8.25
 * 
 * Official @chenglou/pretext alignment + METABOLIC_DISTORTION.
 * Renders agent thought-streams reacting to background heat.
 */
const PretextTextGeometry = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadPretext = async () => {
      const { prepareWithSegments, layoutWithLines } = await import("https://esm.sh/@chenglou/pretext@0.0.6");
      
      let animationFrame: number;
      const text = "◈ COGNITIVE_ARTERY: RELENTLESS CONSTRUCTION. ZERO-TRUST IDENTITY ENFORCED. ARTERY PULSE NOMINAL. PHYSICAL SOVEREIGNTY ACHIEVED. CLEAN BASE LOCK.";
      const font = "900 24px 'Space Grotesk'";
      const prepared = prepareWithSegments(text, font);
      
      let time = 0;

      const render = () => {
        time += 0.01;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const width = 450;
        const { lines } = layoutWithLines(prepared, width, 30);
        
        ctx.font = font;
        ctx.fillStyle = "#F36622"; 
        
        lines.forEach((line: any, i: number) => {
          const warp = Math.sin(time + i * 0.5) * 15;
          const x = 60 + warp;
          const y = 120 + i * 38;
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(243, 102, 34, 0.3)";
          ctx.fillText(line.text, x, y);
          ctx.shadowBlur = 0;
        });

        animationFrame = requestAnimationFrame(render);
      };

      render();
      return () => cancelAnimationFrame(animationFrame);
    };

    const cleanupPromise = loadPretext();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-20 opacity-30 mix-blend-screen" />;
};

/**
 * ◈ PRETEXT_GEOMETRIC_CANVAS — v3.8.25
 */
const PretextGeometricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;
    const points: { x: number; y: number; vx: number; vy: number }[] = [];

    for (let i = 0; i < 50; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
      });
    }

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      points.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        points.forEach((p2, j) => {
          if (i === j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 200) * 0.1;
            ctx.strokeStyle = `rgba(199, 168, 122, ${alpha})`; 
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#F36622"; 
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(render);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10 opacity-20" />;
};

/**
 * ◈ FLUID_SMOKE_METABOLISM — v3.8.25
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
    const COLS = 150;
    const ROWS = 75;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cw = canvas.width / COLS;
      const ch = canvas.height / ROWS;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const nx = c / COLS, ny = r / ROWS;
          const v = Math.sin(ny * 7 + time * 0.4) * 1.5 + 
                    Math.cos((nx + ny) * 10 + time * 0.6) * 1.2;
          
          const val = Math.max(0, Math.min(1, (v + 1) / 2));
          if (val > 0.45) {
            ctx.fillStyle = `rgba(243, 102, 34, ${val * 0.15})`; 
            ctx.fillRect(c * cw, r * ch, cw - 0.5, ch - 0.5);
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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-20" />;
};

/**
 * ◈ STATUS_RING — v3.8.25
 */
const StatusRing = ({ progress, color, label }: { progress: number, color: string, label: string }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1 group relative z-10">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-14 h-14 transform -rotate-90 absolute">
          <circle className="text-[#161616]" strokeWidth="3" stroke="currentColor" fill="transparent" r={radius} cx="28" cy="28" />
          <circle
            style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1s cubic-bezier(0.23, 1, 0.32, 1)' }}
            strokeWidth="3" stroke={color} strokeLinecap="square" fill="transparent" r={radius} cx="28" cy="28"
          />
        </svg>
        <span className="text-[9px] font-black text-[#E5E5E5] technical-data">{progress}%</span>
      </div>
      <span className="text-[8px] text-[#A3A3A3] font-black tracking-widest uppercase authority-text">{label}</span>
    </div>
  );
};

export default function PretextShroud() {
  const { telemetry, connected, packetRate } = useSovereignTelemetry("ws://localhost:9090/ws");
  const { state: nucleusState } = useNucleusWS("ws://localhost:3030/ws");

  const [layout, setLayout] = useState([
    { i: 'command-artery', x: 0, y: 0, w: 7, h: 14 },
    { i: 'vitals-rack', x: 7, y: 0, w: 5, h: 4 },
    { i: 'tasks-mesh', x: 7, y: 4, w: 5, h: 5 },
    { i: 'synapse-orbit', x: 7, y: 9, w: 5, h: 5 },
    { i: 'terminal-artery', x: 0, y: 14, w: 7, h: 6 },
    { i: 'kernel-monitor', x: 7, y: 14, w: 5, h: 6 },
    { i: 'director-pulse', x: 0, y: 20, w: 6, h: 6 },
    { i: 'vsb-highway', x: 6, y: 20, w: 6, h: 4 },
    { i: 'synapse-graph', x: 6, y: 24, w: 6, h: 6 },
  ]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] selection:bg-[#F36622] selection:text-black p-4 overflow-x-hidden overflow-y-auto relative font-sans">
      <FluidSmokeBackground />
      <PretextGeometricCanvas />
      <PretextTextGeometry />
      <AgentSwarm agents={nucleusState?.activeAgents || []} />
      
      {/* ◈ CLINICAL_COMMAND_BAR */}
      <div className="flex items-stretch gap-4 mb-4 h-28 relative z-10">
        <div className="bg-[#161616]/95 border border-[#333333] flex-1 flex items-center justify-between px-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center gap-10">
            <div className="w-14 h-14 border-2 border-[#F36622] flex items-center justify-center transition-all duration-500 cursor-pointer bg-[#F36622]/5 hover:bg-[#F36622]/10 group">
              <span className="text-2xl font-black text-[#F36622] authority-text">Σ</span>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-[0.4em] text-[#E5E5E5] authority-text">NODESTADT</h1>
              <div className="text-[10px] text-[#F36622] font-black tracking-[0.3em] flex gap-6 mt-1 technical-data">
                <span className="flex items-center gap-2 uppercase">
                  <div className="w-2 h-2 bg-[#F36622] animate-pulse" /> 
                  Sovereign_OS v3.8.25-CLINICAL
                </span>
                <span className={`flex items-center gap-2 uppercase ${connected ? "text-[#B8BB26]" : "text-[#404040]"}`}>
                   {connected ? "● VSB_LINK_ACTIVE" : "○ LINK_OFFLINE"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-10">
            <StatusRing progress={100} color="#F36622" label="IDENTITY" />
            <StatusRing progress={100} color="#F36622" label="SYNAPSE" />
            <StatusRing progress={100} color="#F36622" label="PERCEPTION" />
          </div>
        </div>
      </div>

      {/* ◈ ASYMMETRIC_COMMAND_DECK */}
      <ResponsiveGridLayout
        className="layout relative z-10"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        draggableHandle=".handle"
        margin={[16, 16]}
      >
        <div key="command-artery" className="floating-module bg-[#161616]/98 border border-[#333333] shadow-2xl flex flex-col overflow-hidden group backdrop-blur-2xl">
          <div className="handle h-12 border-b border-[#333333] flex items-center px-6 justify-between bg-[#111111] cursor-move group-hover:bg-[#1A1A1A] transition-colors">
            <span className="text-[11px] font-black text-[#F36622] tracking-widest uppercase flex items-center gap-3 authority-text">
              <div className="w-2 h-2 bg-[#F36622] rotate-45" /> COGNITIVE_INGRESS
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextCommandArtery />
          </div>
        </div>

        <div key="vitals-rack" className="floating-module bg-[#161616]/98 border border-[#333333] shadow-xl flex flex-col overflow-hidden backdrop-blur-2xl">
          <div className="handle h-10 border-b border-[#333333] flex items-center px-5 bg-[#111111] cursor-move">
            <span className="text-[10px] font-black text-[#C7A87A] tracking-[0.2em] authority-text">VITALS_RACK</span>
          </div>
          <div className="flex-1 grid grid-cols-2 p-6 gap-8 bg-black/20">
             <div className="flex flex-col gap-3">
               <span className="text-[9px] text-[#A3A3A3] uppercase font-black tracking-widest authority-text">V2F_Status</span>
               <div className="h-2 bg-[#333333] overflow-hidden"><div className="h-full bg-[#F36622] w-[100%] shadow-[0_0_15px_#F36622]" /></div>
             </div>
             <div className="flex flex-col gap-3">
               <span className="text-[9px] text-[#A3A3A3] uppercase font-black tracking-widest authority-text">SPIFFE_Handshake</span>
               <div className="text-[15px] font-black text-[#C7A87A] technical-data">VERIFIED</div>
             </div>
          </div>
        </div>

        <div key="tasks-mesh" className="floating-module bg-[#161616]/98 border border-[#333333] shadow-xl flex flex-col overflow-hidden backdrop-blur-2xl">
          <div className="handle h-10 border-b border-[#333333] flex items-center px-5 bg-[#111111] cursor-move">
            <span className="text-[10px] font-black text-[#C7A87A] tracking-[0.2em] authority-text">TASKS_MESH</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTasksMesh />
          </div>
        </div>

        <div key="synapse-orbit" className="floating-module bg-[#161616]/98 border border-[#333333] shadow-2xl flex flex-col overflow-hidden relative group backdrop-blur-2xl">
          <div className="handle h-10 border-b border-[#333333] flex items-center px-5 bg-[#111111] cursor-move z-10 relative">
            <span className="text-[10px] font-black text-[#C7A87A] tracking-[0.2em] authority-text">NEURAL_PROMENADE</span>
          </div>
          <div className="absolute inset-0 pt-10 bg-black/60">
            <NeuralPromenade />
          </div>
        </div>

        <div key="terminal-artery" className="floating-module bg-[#161616]/98 border border-[#333333] shadow-xl flex flex-col overflow-hidden backdrop-blur-2xl">
          <div className="handle h-10 border-b border-[#333333] flex items-center px-5 bg-[#111111] cursor-move">
            <span className="text-[10px] font-black text-[#F36622] tracking-[0.2em] authority-text">TERMINAL_ARTERY</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <PretextTerminalArtery />
          </div>
        </div>

        <div key="kernel-monitor" className="floating-module">
          <KernelMonitor telemetry={telemetry} />
        </div>

        <div key="director-pulse" className="floating-module">
          <DirectorPulse telemetry={telemetry} />
        </div>

        <div key="vsb-highway" className="floating-module">
          <VsbWaveform packetRate={packetRate} />
        </div>

        <div key="synapse-graph" className="floating-module">
          <SynapsePanel />
        </div>
      </ResponsiveGridLayout>

      <div className="flex justify-center mt-12 mb-20">
         <SovereignIgnitionTrigger />
      </div>

      <div className="lg:col-span-2 mb-12">
        <HermesProxy />
      </div>
    </div>
  );
}
