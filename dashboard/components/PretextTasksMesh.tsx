"use client";

import React, { useState, useEffect } from 'react';

/**
 * PRETEXT_TASKS_MESH — PHASE 93.9
 * 
 * High-density task management for the Pretext Shroud.
 * Achieves parity with the Flutter HUD.
 */

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
}

export default function PretextTasksMesh() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // TODO: Fetch from Node B /api/tasks
    setTasks([
      { id: '1', title: 'MATERIALIZE_OBSIDIAN_VAULT', isCompleted: true },
      { id: '2', title: 'SHORE_FLUTTER_ARTERY', isCompleted: true },
      { id: '3', title: 'EXECUTE_SINGULARITY_AUDIT', isCompleted: false },
    ]);
  }, []);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  return (
    <div className="flex flex-col h-full font-mono text-[11px] text-[#ebdbb2] bg-[#1d2021] p-4 overflow-y-auto">
      <div className="space-y-2">
        {tasks.map(t => (
          <div 
            key={t.id} 
            onClick={() => toggleTask(t.id)}
            className="flex items-center gap-4 p-2 border border-[#3c3836] bg-[#282828] hover:border-[#fe8019] cursor-pointer transition-all"
          >
            <div className={`w-3 h-3 border ${t.isCompleted ? 'bg-[#b8bb26] border-[#b8bb26]' : 'border-[#a89984]'}`} />
            <span className={t.isCompleted ? 'opacity-30 line-through' : ''}>
              {t.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
