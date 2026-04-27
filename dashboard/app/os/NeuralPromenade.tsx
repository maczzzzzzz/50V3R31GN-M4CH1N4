'use client';

/**
 * NeuralPromenade.tsx — PHASE 95.2 (MemPalace Structural Refactor)
 * 
 * Replaces freeform graphs with a rigid mnemonic hierarchy: Wings -> Rooms -> Drawers.
 * Implements Temporal Fading and Spatial Clustering.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';

// ── Freshness Shader (Temporal Decay) ────────────────────────────────────────
const FRESHNESS_SHADER = {
  vertexShader: `
    varying float vFreshness;
    attribute float freshness;
    void main() {
      vFreshness = freshness;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying float vFreshness;
    uniform vec3 color;
    void main() {
      // Fade older shards (lower freshness)
      float alpha = clamp(vFreshness, 0.1, 1.0);
      gl_FragColor = vec4(color, alpha);
    }
  `
};

export default function NeuralPromenade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [activeWing, setActiveWing] = useState<string | null>(null);

  // ◈ Wing Coordinates
  const WINGS = useMemo(() => ({
    'NODE_A': { x: -200, y: 0, z: 0, color: 0xfb4934, label: 'KV_ARTERY' },
    'NODE_B': { x: 0, y: 0, z: 0, color: 0xb8bb26, label: 'DIRECTOR_CORE' },
    'NODE_C': { x: 200, y: 0, z: 0, color: 0x83a598, label: 'ORACLE_FARM' },
  }), []);

  useEffect(() => {
    fetch('/api/spatial')
      .then(res => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    const Graph = ForceGraph3D()(containerRef.current)
      .graphData(data)
      .backgroundColor('#000000')
      .showNavInfo(false)
      .nodeThreeObject((node: any) => {
        // 1. Determine Wing Affiliation
        const wingId = node.node_id?.toUpperCase() || 'NODE_B';
        const wing = (WINGS as any)[wingId] || WINGS.NODE_B;

        // 2. Mnemonic Shard (The Drawer)
        const geometry = node.table === 'npcs' 
          ? new THREE.DodecahedronGeometry(6)
          : new THREE.BoxGeometry(3, 3, 3);
          
        const material = new THREE.MeshLambertMaterial({ 
          color: node.color || wing.color,
          transparent: true,
          opacity: node.freshness || 0.8
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Add "Glow" for active selection
        if (node.id === activeWing) {
           mesh.scale.set(1.5, 1.5, 1.5);
        }

        return mesh;
      })
      .onNodeClick((node: any) => {
        setActiveWing(node.id);
        Graph.cameraPosition(
          { x: node.x * 1.5, y: node.y * 1.5, z: node.z * 1.5 },
          node,
          1000
        );
      });

    // ◈ Hierarchical Force Constrainment
    Graph.d3Force('x', (d: any) => {
      const wing = (WINGS as any)[d.node_id?.toUpperCase() || 'NODE_B'] || WINGS.NODE_B;
      return wing.x;
    });
    
    // Add Wing Bounding Boxes
    Object.entries(WINGS).forEach(([id, wing]) => {
      const boxGeom = new THREE.BoxGeometry(150, 150, 150);
      const boxMat = new THREE.MeshBasicMaterial({ 
        color: wing.color, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.05 
      });
      const box = new THREE.Mesh(boxGeom, boxMat);
      box.position.set(wing.x, wing.y, wing.z);
      Graph.scene().add(box);
      
      // ◈ Billboard Label for Wing
      // (Implementation requires THREE.Sprite for text labels)
    });

    graphRef.current = Graph;

    return () => {
      if (graphRef.current) graphRef.current._destructor();
    };
  }, [data, WINGS, activeWing]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      <div className="absolute top-4 left-4 z-10 p-3 bg-[#282828]/95 border border-[#3c3836] font-mono shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="text-[#fe8019] font-bold text-[10px] tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#fb4934] animate-pulse" />
          ◈ SOVEREIGN_MEMPALACE // v3.8.7
        </div>
        <div className="mt-2 text-[#a89984] text-[9px] grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="font-bold text-[#b8bb26]">WINGS:</span> <span>3_ACTIVE</span>
          <span className="font-bold text-[#b8bb26]">SHARDS:</span> <span>{data.nodes.length}</span>
          <span className="font-bold text-[#b8bb26]">FORMAT:</span> <span>DIATAXIS_STRUCT</span>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-full" />
      {/* ◈ Structural Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none border border-[#fb4934]/5 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
    </div>
  );
}
