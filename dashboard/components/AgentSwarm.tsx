import React from 'react';
import { NucleusAgentStatus } from '../hooks/useNucleusWS';

/**
 * ◈ AGENT_SWARM_MONITOR : CLINICAL_REASONING — v3.8.25
 * 
 * Live view of active reasoning swarms in the quaternary mesh.
 */

interface AgentSwarmProps {
  agents: NucleusAgentStatus[];
}

export const AgentSwarm: React.FC<AgentSwarmProps> = ({ agents }) => {
  if (!agents || agents.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 w-84 bg-[#111111]/95 border border-[#333333] p-5 font-sans text-xs shadow-2xl backdrop-blur-xl z-[60]">
      <div className="flex items-center justify-between mb-5 border-b border-[#262626] pb-3">
        <span className="text-[#F36622] font-black tracking-[0.2em] uppercase authority-text">◈ REASONING_SWARMS</span>
        <span className="bg-[#F36622] text-[#0A0A0A] px-2 font-black animate-pulse technical-data">{agents.length} ACTIVE</span>
      </div>

      <div className="space-y-5">
        {agents.map((agent) => (
          <div key={agent.id} className="group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#C7A87A] font-black tracking-wide technical-data">{agent.name.toUpperCase()}</span>
              <span className={`text-[9px] font-black tracking-widest uppercase ${
                agent.status === 'WORKING' ? 'text-[#FABD2F]' : 'text-[#B8BB26]'
              }`}>
                [{agent.status}]
              </span>
            </div>
            
            <div className="text-[#A3A3A3] mb-3 truncate technical-data text-[10px]">
              {agent.intent || '::/AWAITING_REASONING_TARGET'}
            </div>

            <div className="w-full bg-[#1A1A1A] h-1.5 overflow-hidden border border-[#262626]">
              <div 
                className="bg-[#F36622] h-full transition-all duration-700 ease-out shadow-[0_0_10px_#F36622]"
                style={{ width: `${agent.progress || (agent.status === 'WORKING' ? 45 : 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 text-[9px] text-[#404040] font-black tracking-widest uppercase authority-text">
        ::/5Y573M-N071C3 : QUATERNARY_MESH_READY.
      </div>
    </div>
  );
};
