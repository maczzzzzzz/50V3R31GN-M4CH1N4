'use client'

import { KineticThoughtStream } from './prompt-kit/KineticThoughtStream'
import { useState, useEffect } from 'react'

export type PretextHUDProps = {
  activeThought?: string
  nodeStatus?: Record<string, 'online' | 'offline' | 'busy'>
  className?: string
}

export function PretextHUD({
  activeThought,
  nodeStatus = {},
  className = '',
}: PretextHUDProps) {
  const [timestamp, setTimestamp] = useState(new Date().toISOString())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`pretext-hud fixed inset-0 pointer-events-none z-50 p-6 flex flex-col justify-between ${className}`}>
      {/* Top Header Layer */}
      <div className="flex justify-between items-start opacity-40 mix-blend-screen">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold tracking-widest text-primary-500 uppercase">
            Sovereign Machina // Beta v3.5
          </div>
          <div className="text-[12px] font-mono text-primary-400">
            {timestamp} // ARTERY_ACTIVE
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          {Object.entries(nodeStatus).map(([node, status]) => (
            <div key={node} className="flex flex-col items-end">
              <div className="text-[9px] font-bold text-primary-600 uppercase">{node}</div>
              <div className={`text-[10px] font-mono ${status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                {status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Visualization Layer */}
      <div className="flex flex-col items-start gap-4">
        {activeThought && (
          <div className="max-w-[400px] bg-black/40 backdrop-blur-sm p-4 border-l-2 border-primary-500">
            <div className="text-[10px] font-bold text-primary-500 mb-2 uppercase tracking-tighter">
              Active Reasoning Stream
            </div>
            <KineticThoughtStream 
              text={activeThought} 
              fontSize={12} 
              maxWidth={350} 
            />
          </div>
        )}
        
        <div className="text-[10px] font-mono opacity-20 text-primary-300">
          ::/5Y573M-N071C3 : THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4
        </div>
      </div>

      <style jsx>{`
        .pretext-hud {
          font-family: 'JetBrains Mono', monospace;
          text-shadow: 0 0 10px rgba(55, 99, 116, 0.5);
        }
      `}</style>
    </div>
  )
}
