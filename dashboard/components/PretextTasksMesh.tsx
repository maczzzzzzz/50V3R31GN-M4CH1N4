"use client";

import React, { useState, useEffect } from 'react';

/**
 * ◈ PRETEXT_TASKS_MESH : IMPLEMENTATION_LATTICE — v3.8.25
 * 
 * High-density task management for the clinical HUD.
 * Industrial standard geometry with sharp-edge shards.
 */

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
}

export default function PretextTasksMesh() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks([
      { id: '1', title: 'MATERIALIZE_OBSIDIAN_VAULT', isCompleted: true },
      { id: '2', title: 'SHORE_FLUTTER_ARTERY', isCompleted: true },
      { id: '3', title: 'EXECUTE_SINGULARITY_AUDIT', isCompleted: false },
      { id: '4', title: 'CLEAN_BASE_HARDENING', isCompleted: true },
    ]);
  }, []);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  return (
    <div className="flex flex-col h-full font-sans text-[11px] text-[#E5E5E5] bg-[#0F0F0F] p-5 overflow-y-auto">
      <div className="space-y-3">
        {tasks.map(t => (
          <div 
            key={t.id} 
            onClick={() => toggleTask(t.id)}
            className="flex items-center gap-5 px-4 py-3 border border-[#262626] bg-[#161616] hover:border-[#F36622] hover:bg-[#1A1A1A] cursor-crosshair transition-all duration-300"
          >
            <div className={`w-3.5 h-3.5 border-2 ${t.isCompleted ? 'bg-[#F36622] border-[#F36622] shadow-[0_0_10px_#F36622]' : 'border-[#404040]'}`} />
            <span className={`technical-data tracking-wide font-black uppercase ${t.isCompleted ? 'opacity-20 line-through' : 'text-[#E5E5E5]'}`}>
              {t.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
