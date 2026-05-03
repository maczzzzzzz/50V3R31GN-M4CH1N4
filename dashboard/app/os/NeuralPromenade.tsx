'use client';

/**
 * ◈ NEURAL_PROMENADE : SPATIAL_ARTERY — v3.8.25
 * 
 * 3D mnemonic hierarchy: Wings -> Rooms -> Shards.
 * Clinical visualization of the disaggregated memory core.
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
      float alpha = clamp(vFreshness, 0.15, 1.0);
      gl_FragColor = vec4(color, alpha);
    }
  `
};

export default function NeuralPromenade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [data, setData] = useState({ nodes: [], links: [] });
  const [activeWing, setActiveWing] = useState<string | null>(null);

  // ◈ Wing Coordinates : Clinical Quaternary Mapping
  const WINGS = useMemo(() => ({
    'NODE_A': { x: -250, y: 0, z: 0, color: 0xF36622, label: 'SYNAPSE_CACHE' },
    'NODE_B': { x: 0, y: 0, z: 0, color: 0xC7A87A, label: 'DIRECTOR_CORE' },
    'NODE_C': { x: 250, y: 0, z: 0, color: 0x8EC07C, label: 'ORACLE_FARM' },
    'NODE_D': { x: 0, y: 250, z: 0, color: 0x83A598, label: 'QUATERNARY_HEAVY' },
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
        const wingId = node.node_id?.toUpperCase() || 'NODE_B';
        const wing = (WINGS as any)[wingId] || WINGS.NODE_B;

        // ◈ Mnemonic Shard Geometry
        const geometry = node.is_core 
          ? new THREE.DodecahedronGeometry(5)
          : new THREE.BoxGeometry(3, 3, 3);
          
        const material = new THREE.MeshLambertMaterial({ 
          color: node.color || wing.color,
          transparent: true,
          opacity: node.freshness || 0.8
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        if (node.id === activeWing) {
           mesh.scale.set(2, 2, 2);
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

    Graph.d3Force('x', (d: any) => {
      const wing = (WINGS as any)[d.node_id?.toUpperCase() || 'NODE_B'] || WINGS.NODE_B;
      return wing.x;
    });

    Graph.d3Force('y', (d: any) => {
      const wing = (WINGS as any)[d.node_id?.toUpperCase() || 'NODE_B'] || WINGS.NODE_B;
      return wing.y;
    });
    
    // Add Wing Bounding Boxes
    Object.entries(WINGS).forEach(([id, wing]) => {
      const boxGeom = new THREE.BoxGeometry(200, 200, 200);
      const boxMat = new THREE.MeshBasicMaterial({ 
        color: wing.color, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.03 
      });
      const box = new THREE.Mesh(boxGeom, boxMat);
      box.position.set(wing.x, wing.y, wing.z);
      Graph.scene().add(box);
    });

    graphRef.current = Graph;

    return () => {
      if (graphRef.current) graphRef.current._destructor();
    };
  }, [data, WINGS, activeWing]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      <div className="absolute top-6 left-6 z-10 p-4 bg-[#111111]/95 border border-[#333333] font-sans shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="text-[#376374] font-black text-[11px] tracking-[0.3em] flex items-center gap-3 uppercase authority-text">
          <div className="w-2 h-2 bg-[#376374] animate-pulse" />
          ◈ NEURAL_PROMENADE // v3.8.25
        </div>
        <div className="mt-3 text-[#A3A3A3] text-[9px] grid grid-cols-2 gap-x-6 gap-y-1 font-black uppercase technical-data">
          <span className="text-[#836A46]">ACTIVE_WINGS:</span> <span>4_QUATERNARY</span>
          <span className="text-[#836A46]">MEM_SHARDS:</span> <span>{data.nodes.length}</span>
          <span className="text-[#836A46]">ARTERY_SYNC:</span> <span>NOMINAL</span>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none border border-[#376374]/5 shadow-[inset_0_0_150px_rgba(0,0,0,1)]" />
    </div>
  );
}
