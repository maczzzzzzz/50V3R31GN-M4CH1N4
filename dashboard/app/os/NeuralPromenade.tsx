'use client';

/**
 * NeuralPromenade.tsx — Phase 82 (Neural Promenade)
 * 
 * 3D Force-Directed Graph visualization of the Sovereign Synapse.
 * Implements room-scale context loading and spatial memory synthesis.
 */

import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';

// ── Static Storm Shader ───────────────────────────────────────────────────────
const STORM_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    varying float vNoise;
    uniform float time;
    
    // Brownian Noise approximation
    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float noise(vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f*f*(3.0-2.0*f);
      float n = p.x + p.y*57.0 + 113.0*p.z;
      return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                     mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                 mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                     mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
    }

    void main() {
      vUv = uv;
      vNoise = noise(position * 10.0 + time * 5.0);
      vec3 newPosition = position + normal * vNoise * 2.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying float vNoise;
    uniform vec3 color;
    void main() {
      gl_FragColor = vec4(color * (0.5 + vNoise * 0.5), 1.0);
    }
  `
};

export default function NeuralPromenade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [data, setData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    fetch('/api/spatial')
      .then(res => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    const Graph = ForceGraph3D()(containerRef.current)
      .graphData(data)
      .nodeLabel('label')
      .nodeAutoColorBy('table')
      .backgroundColor('#080810')
      .nodeThreeObject((node: any) => {
        // Task 3: Static Storm for deadlocks (mocked via source_id pattern for now)
        if (node.source_id.includes('deadlock') || Math.random() > 0.98) {
          const geometry = new THREE.SphereGeometry(3);
          const material = new THREE.ShaderMaterial({
            uniforms: {
              time: { value: 0 },
              color: { value: new THREE.Color(0xff003c) }
            },
            vertexShader: STORM_SHADER.vertexShader,
            fragmentShader: STORM_SHADER.fragmentShader
          });
          const mesh = new THREE.Mesh(geometry, material);
          
          // Animate time uniform
          const animate = () => {
            material.uniforms.time.value += 0.05;
            requestAnimationFrame(animate);
          };
          animate();
          
          return mesh;
        }
        
        // Standard node
        const sphere = new THREE.SphereGeometry(2);
        const mat = new THREE.MeshLambertMaterial({ 
          color: node.color || '#fabd2f',
          transparent: true,
          opacity: 0.8
        });
        return new THREE.Mesh(sphere, mat);
      })
      .onNodeClick((node: any) => {
        // Proximity Context Loading
        console.log(`>> SPATIAL FOCUS: ${node.label} at (${node.x}, ${node.y}, ${node.z})`);
        Graph.cameraPosition(
          { x: node.x * 2, y: node.y * 2, z: node.z * 2 },
          { x: node.x, y: node.y, z: node.z },
          2000
        );
      });

    graphRef.current = Graph;

    return () => {
      if (graphRef.current) graphRef.current._destructor();
    };
  }, [data]);

  return (
    <div className="relative w-full h-full bg-black border border-primary overflow-hidden">
      <div className="absolute top-4 left-4 z-10 p-2 bg-black/80 border border-primary font-mono text-primary text-xs">
        ◈ NEURAL_PROMENADE // SPATIAL_MEMORY_SYNTHESIS
        <div className="mt-1 opacity-60">Nodes Shored: {data.nodes.length}</div>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
