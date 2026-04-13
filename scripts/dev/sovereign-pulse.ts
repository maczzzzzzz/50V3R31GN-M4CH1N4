#!/usr/bin/env tsx
/**
 * sovereign-pulse.ts
 *
 * Phase 51.3: Sovereign Pulse — Hardware Telemetry Daemon
 *
 * Samples GPU (via rocm-smi / nvidia-smi), CPU (via /proc/stat), and VSB
 * bus status every 60 seconds. Writes a structured vitals log to
 * data/logs/vitals.log and a human-readable VITAL_SIGNS.md to the
 * Obsidian vault (if present).
 *
 * Lifecycle:
 *   - Spawned manually or via flake.nix shellHook
 *   - SIGTERM / SIGINT trigger graceful shutdown
 */

import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ── Paths ──────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.env['PROJECT_ROOT'] ?? process.cwd();
const VITALS_LOG   = path.join(PROJECT_ROOT, 'data/logs/vitals.log');
const OBSIDIAN_DIR = path.join(PROJECT_ROOT, 'data/obsidian');
const VITAL_SIGNS  = path.join(OBSIDIAN_DIR, 'VITAL_SIGNS.md');
const INTERVAL_MS  = 60_000;

// ── Helpers ────────────────────────────────────────────────────────────────────

function ensureDirs(): void {
  fs.mkdirSync(path.dirname(VITALS_LOG), { recursive: true });
  fs.mkdirSync(OBSIDIAN_DIR, { recursive: true });
}

async function sampleGpu(): Promise<{ label: string; util: string; temp: string; vram: string }> {
  // Try rocm-smi (Node B / AMD)
  try {
    const { stdout } = await execAsync('rocm-smi --showuse --showtemp --showmemuse --csv 2>/dev/null', { timeout: 5000 });
    const lines = stdout.trim().split('\n');
    if (lines.length >= 2) {
      const cols = lines[1]!.split(',');
      return {
        label: 'AMD (rocm-smi)',
        util:  (cols[1] ?? 'N/A').trim() + '%',
        temp:  (cols[2] ?? 'N/A').trim() + '°C',
        vram:  (cols[3] ?? 'N/A').trim() + '%',
      };
    }
  } catch { /* rocm-smi not available — try nvidia */ }

  // Try nvidia-smi (Node A / NVIDIA fallback)
  try {
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null',
      { timeout: 5000 },
    );
    const cols = stdout.trim().split(',');
    const memUsedMiB  = parseFloat(cols[2] ?? '0');
    const memTotalMiB = parseFloat(cols[3] ?? '1');
    const vramPct     = ((memUsedMiB / memTotalMiB) * 100).toFixed(1);
    return {
      label: 'NVIDIA (nvidia-smi)',
      util:  (cols[0] ?? 'N/A').trim() + '%',
      temp:  (cols[1] ?? 'N/A').trim() + '°C',
      vram:  vramPct + '%',
    };
  } catch { /* no GPU tools */ }

  return { label: 'UNKNOWN', util: 'N/A', temp: 'N/A', vram: 'N/A' };
}

async function sampleCpu(): Promise<{ usage: string }> {
  // Read /proc/stat twice with 100ms gap for accurate delta
  function readStat(): { idle: number; total: number } {
    try {
      const line = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0] ?? '';
      const nums = line.replace(/^cpu\s+/, '').split(/\s+/).map(Number);
      const idle  = (nums[3] ?? 0) + (nums[4] ?? 0);
      const total = nums.reduce((a, b) => a + b, 0);
      return { idle, total };
    } catch { return { idle: 0, total: 1 }; }
  }

  const s1 = readStat();
  await new Promise(r => setTimeout(r, 100));
  const s2 = readStat();

  const dTotal = s2.total - s1.total;
  const dIdle  = s2.idle  - s1.idle;
  const usage  = dTotal > 0 ? (((dTotal - dIdle) / dTotal) * 100).toFixed(1) : 'N/A';
  return { usage: usage + '%' };
}

function checkVsb(): { status: string } {
  // Probe heartbeat.mem as a proxy for VSB bus health
  const hbPath = path.join(PROJECT_ROOT, 'data/heartbeat.mem');
  try {
    const buf = fs.readFileSync(hbPath);
    if (buf.length < 16) return { status: 'DEGRADED (heartbeat.mem too small)' };
    const atlasTsMs     = Number(buf.readBigUInt64LE(0));
    const cyberdeckTsMs = Number(buf.readBigUInt64LE(8));
    const now           = Date.now();
    const atlasDelta     = now - atlasTsMs;
    const cyberdeckDelta = now - cyberdeckTsMs;
    if (atlasDelta < 500 && cyberdeckDelta < 500) return { status: 'NOMINAL' };
    if (atlasTsMs === 0 && cyberdeckTsMs === 0)   return { status: 'OFFLINE (no heartbeat)' };
    return { status: `DEGRADED (atlas+${atlasDelta}ms, deck+${cyberdeckDelta}ms)` };
  } catch {
    return { status: 'OFFLINE (heartbeat.mem missing)' };
  }
}

function writeVitals(entry: {
  ts: string;
  cpu: string;
  gpuUtil: string;
  gpuTemp: string;
  gpuVram: string;
  gpuLabel: string;
  vsb: string;
}): void {
  const line = `[${entry.ts}] CPU=${entry.cpu} GPU(${entry.gpuLabel})=${entry.gpuUtil} T=${entry.gpuTemp} VRAM=${entry.gpuVram} VSB=${entry.vsb}\n`;
  fs.appendFileSync(VITALS_LOG, line);

  // Human-readable VITAL_SIGNS.md in Obsidian vault
  const md = `# :/VITAL_SIGNS //

> Last sampled: **${entry.ts}**

| Metric | Value |
|--------|-------|
| CPU Usage | ${entry.cpu} |
| GPU (${entry.gpuLabel}) Util | ${entry.gpuUtil} |
| GPU Temperature | ${entry.gpuTemp} |
| GPU VRAM Usage | ${entry.gpuVram} |
| VSB Bus Status | ${entry.vsb} |

*Auto-generated by sovereign-pulse.ts — Phase 51.3*
`;
  fs.writeFileSync(VITAL_SIGNS, md);
}

// ── Main loop ──────────────────────────────────────────────────────────────────

async function sample(): Promise<void> {
  const [gpu, cpu, vsb] = await Promise.all([sampleGpu(), sampleCpu(), Promise.resolve(checkVsb())]);
  const ts = new Date().toISOString();
  writeVitals({
    ts,
    cpu:      cpu.usage,
    gpuUtil:  gpu.util,
    gpuTemp:  gpu.temp,
    gpuVram:  gpu.vram,
    gpuLabel: gpu.label,
    vsb:      vsb.status,
  });
  console.log(`[PULSE] ${ts} CPU=${cpu.usage} GPU=${gpu.util} T=${gpu.temp} VRAM=${gpu.vram} VSB=${vsb.status}`);
}

async function main(): Promise<void> {
  ensureDirs();
  console.log('[PULSE] Sovereign Pulse daemon started — interval=60s');
  console.log(`[PULSE] Vitals log: ${VITALS_LOG}`);
  console.log(`[PULSE] Vital signs: ${VITAL_SIGNS}`);

  // First sample immediately
  await sample();

  // Then on interval
  const timer = setInterval(() => { sample().catch(e => console.error('[PULSE] Sample error:', e)); }, INTERVAL_MS);

  process.on('SIGTERM', () => { clearInterval(timer); process.exit(0); });
  process.on('SIGINT',  () => { clearInterval(timer); process.exit(0); });
}

main().catch(e => { console.error('[PULSE] Fatal:', e); process.exit(1); });
