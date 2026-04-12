// scripts/gauntlet/types.ts
// Core type definitions for the Sovereign Manifest Engine

import type { Browser, Page } from 'playwright-core';
import type Database from 'better-sqlite3';
import type { VisionClient } from './vision-client.js';

export interface GauntletContext {
  /** Active Foundry VTT page via CDP (null until recursivePageHunt resolves) */
  page: Page | null;
  browser: Browser | null;
  /** SQLite world.db connection */
  db: Database.Database | null;
  /** Dual-Node vision API */
  vision: VisionClient;
  /** Resolved CDP WebSocket endpoint */
  cdpEndpoint: string;
  /** Structured logger */
  logger: {
    info: (msg: string, data?: unknown) => void;
    error: (msg: string, data?: unknown) => void;
  };
  /** Wait for the system to settle */
  stabilize: (ms?: number) => Promise<void>;
  /** Dispatch a visible error overlay into Foundry via the bridge */
  manifestError: (msg: string) => Promise<void>;
}

export type AuditStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIP';

export interface AuditResult {
  phaseId: number;
  phaseName: string;
  block: 'DATA' | 'MECHANICAL' | 'ORCHESTRATION' | 'VISUAL' | 'NARRATIVE';
  status: AuditStatus;
  message: string;
  details?: Record<string, unknown>;
  durationMs?: number;
}

export interface SovereignShard {
  metadata: {
    id: number;
    name: string;
    block: 'DATA' | 'MECHANICAL' | 'ORCHESTRATION' | 'VISUAL' | 'NARRATIVE';
  };

  /** Proof of Life — verifies the feature exists and is healthy */
  audit: (ctx: GauntletContext) => Promise<AuditResult>;

  /** Programmatic Control — forces the environment to match intent */
  manifest: (ctx: GauntletContext, intent: unknown) => Promise<void>;

  /** Self-Healing — background monitoring for state drift */
  onDrift: (ctx: GauntletContext, current: unknown, expected: unknown) => Promise<void>;
}

export type BlockType = 'DATA' | 'MECHANICAL' | 'ORCHESTRATION' | 'VISUAL' | 'NARRATIVE';

/**
 * PhaseShard — implementation-plan shard contract (verify/execute pattern).
 * Coexists with SovereignShard (audit/manifest/onDrift). Engine handles both.
 */
export interface PhaseShard {
  metadata: {
    id: number;
    name: string;
    block: BlockType;
  };
  /** Returns true if this phase is healthy */
  verify: (ctx: GauntletContext) => Promise<boolean>;
  /** Programmatic execution / self-healing */
  execute: (ctx: GauntletContext, params?: unknown) => Promise<unknown>;
}

export interface GauntletReport {
  timestamp: string;
  totalPhases: number;
  passed: number;
  failed: number;
  warned: number;
  skipped: number;
  results: AuditResult[];
  durationMs: number;
}
