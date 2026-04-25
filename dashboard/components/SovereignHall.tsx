import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { NucleusAgentStatus } from '../hooks/useNucleusWS';

/**
 * SOVEREIGN_HALL : v3.8.0
 * 
 * 2.5D Isometric Visualization of Agent Collaboration.
 * Pulsing nodes represent active agents in a meeting.
 */

const AgentNode = ({ agent, position }: { agent: NucleusAgentStatus, position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(time * 3) * 0.1;
    meshRef.current.scale.set(scale, scale, scale);
  });

  const color = agent.status === 'WORKING' ? '#fabd2f' : '#b8bb26';

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[0.5, 32, 32]}>
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={2} 
          transparent 
          opacity={0.8} 
        />
      </Sphere>
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.2}
        color="#ebdbb2"
        font="/fonts/VT323-Regular.ttf"
      >
        {agent.name}
      </Text>
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.15}
        color="#928374"
        font="/fonts/VT323-Regular.ttf"
        maxWidth={2}
        textAlign="center"
      >
        {agent.intent}
      </Text>
    </group>
  );
};

export const SovereignHall = ({ agents }: { agents: NucleusAgentStatus[] }) => {
  const nodePositions = useMemo(() => {
    return agents.map((_, i) => {
      const angle = (i / agents.length) * Math.PI * 2;
      const radius = 5;
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number];
    });
  }, [agents.length]);

  return (
    <div className="w-full h-full bg-[#1d2021] relative overflow-hidden rounded-lg border border-yellow-500/20">
      <div className="absolute top-4 left-4 z-10 font-mono text-[10px] text-yellow-500/60 uppercase tracking-widest">
        ◈ Sovereign_Hall // Thought_Artery_Visualizer
      </div>
      
      <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
        <color attach="background" args={['#1d2021']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <gridHelper args={[20, 20, '#3c3836', '#282828']} rotation={[0, 0, 0]} />
        
        {agents.map((agent, i) => (
          <React.Fragment key={agent.id}>
            <AgentNode agent={agent} position={nodePositions[i]} />
            {/* Connection to center (Shared Brain) */}
            <Line
              points={[[0, 0, 0], nodePositions[i]]}
              color="#fabd2f"
              lineWidth={1}
              transparent
              opacity={0.2}
            />
          </React.Fragment>
        ))}

        {/* Central Pillar (Shared Brain) */}
        <Sphere args={[0.2, 16, 16]}>
          <meshStandardMaterial color="#ebdbb2" emissive="#ebdbb2" emissiveIntensity={5} />
        </Sphere>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};
