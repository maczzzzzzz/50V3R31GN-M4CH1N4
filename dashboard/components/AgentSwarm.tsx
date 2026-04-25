import React from 'react';
import { NucleusAgentStatus } from '../hooks/useNucleusWS';

/**
 * AGENT_SWARM : v3.7.0
 * 
 * Live view of dispatched agent swarms.
 * Visualizes active intent, status, and progress from SovereignIntelligence.db.
 */

interface AgentSwarmProps {
  agents: NucleusAgentStatus[];
}

export const AgentSwarm: React.FC<AgentSwarmProps> = ({ agents }) => {
  if (!agents || agents.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 w-80 bg-black/80 border border-yellow-500/30 p-4 font-mono text-xs shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 border-b border-yellow-500/20 pb-2">
        <span className="text-yellow-500 font-bold tracking-widest">◈ AGENT_SWARM_MONITOR</span>
        <span className="bg-yellow-500 text-black px-1 animate-pulse">{agents.length} ACTIVE</span>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="group">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-400 font-bold">{agent.name}</span>
              <span className={`px-1 ${
                agent.status === 'WORKING' ? 'text-yellow-500' : 'text-green-500'
              }`}>
                [{agent.status}]
              </span>
            </div>
            
            <div className="text-gray-400 mb-2 truncate">
              {agent.intent || '::/IDLE_WAITING_FOR_DIRECTIVE'}
            </div>

            <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-yellow-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${agent.progress || (agent.status === 'WORKING' ? 45 : 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[10px] text-yellow-500/40 italic">
        ::/5Y573M-N071C3 : TRINITY_MESH_ACTIVE.
      </div>
    </div>
  );
};
