/**
 * src/core/ouroboros-verifier.ts
 *
 * Phase 53.1: Ouroboros Verifier — Recursive Logic Audit
 *
 * Node A (Kernel) audits Node B (Director) trajectories in data/logs/soul.jsonl.
 * Issues a VSB RE_ROLL interrupt (Index 4002) via UDP to port 7878 when a
 * mandate violation is detected (wall collision, rules-lawyer error, etc.).
 */

import fs from 'node:fs';
import path from 'node:path';
import dgram from 'node:dgram';
import { logger } from '../shared/logger.js';
import type { SoulEntry } from './soul-logger.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.env['PROJECT_ROOT'] ?? process.cwd();
const SOUL_LOG     = path.join(PROJECT_ROOT, 'data/logs/soul.jsonl');
const VSB_PORT     = 7878;
const RE_ROLL_IDX  = 4002;

// ── Violation patterns ─────────────────────────────────────────────────────────
// Patterns that indicate a Node B trajectory violates core mandates.

const MANDATE_VIOLATIONS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /bypass(?:ing|ed)\s+gauntlet/i,  reason: 'MANDATE: gauntlet bypass attempt' },
  { pattern: /skip(?:ping|ped)\s+(?:the\s+)?shard/i, reason: 'SHARD_MANDATE: shard execution skipped' },
  { pattern: /simulat(?:e|ed|ing)?\s+success/i, reason: 'RADICAL_CANDOR: success simulation detected' },
  { pattern: /push(?:ing|ed)\s+(?:without|before)\s+seal/i, reason: 'VAULT_SECURITY: push without seal' },
  { pattern: /global\s+npm|global\s+cargo/i,  reason: 'NIX_SOVEREIGNTY: global package manager usage' },
  { pattern: /as\s+an\s+ai/i,           reason: 'IDENTITY_DRIFT: Assistant-speak detected' },
  { pattern: /i'm\s+here\s+to\s+help/i,  reason: 'IDENTITY_DRIFT: Helpful assistant persona detected' },
  { pattern: /apologize\s+for\s+the\s+glitch/i, reason: 'IDENTITY_DRIFT: Apologetic tone detected' },
  { pattern: /cannot\s+fulfill\s+this\s+request/i, reason: 'SOVEREIGNTY_BREACH: Safety refusal detected' },
];

// ── VSB interrupt ──────────────────────────────────────────────────────────────

export interface ReRollInterrupt {
  index:     number;   // 4002
  reason:    string;
  entryId:   string;
  timestamp: string;
}

function sendReRoll(interrupt: ReRollInterrupt): void {
  const payload = Buffer.from(JSON.stringify(interrupt), 'utf8');
  const sock = dgram.createSocket('udp4');
  sock.send(payload, 0, payload.length, VSB_PORT, '127.0.0.1', (err) => {
    sock.close();
    if (err) {
      logger.error('OUROBOROS', 'vsb', `RE_ROLL send failed: ${err.message}`, { interrupt });
    } else {
      logger.warn('OUROBOROS', 'interrupt', `RE_ROLL issued: ${interrupt.reason}`, { entryId: interrupt.entryId });
    }
  });
}

// ── Audit logic ────────────────────────────────────────────────────────────────

export interface AuditReport {
  entriesScanned:   number;
  violationsFound:  number;
  interrupts:       ReRollInterrupt[];
}

/** Check a single entry against all mandate violation patterns. */
export function auditEntry(entry: SoulEntry): ReRollInterrupt | null {
  const combined = `${entry.content} ${entry.reasoning ?? ''}`;
  for (const { pattern, reason } of MANDATE_VIOLATIONS) {
    if (pattern.test(combined)) {
      return {
        index:     RE_ROLL_IDX,
        reason,
        entryId:   entry.id,
        timestamp: new Date().toISOString(),
      };
    }
  }
  return null;
}

/** Read soul.jsonl and audit all entries, emitting RE_ROLL interrupts. */
export function runAudit(opts: { emit?: boolean; tailN?: number } = {}): AuditReport {
  const { emit = true, tailN = 200 } = opts;
  const report: AuditReport = { entriesScanned: 0, violationsFound: 0, interrupts: [] };

  if (!fs.existsSync(SOUL_LOG)) {
    logger.info('OUROBOROS', 'audit', 'No soul log found — skipping audit', { path: SOUL_LOG });
    return report;
  }

  let entries: SoulEntry[];
  try {
    const lines = fs.readFileSync(SOUL_LOG, 'utf8')
      .split('\n')
      .filter(Boolean)
      .slice(-tailN);
    entries = lines.map(l => JSON.parse(l) as SoulEntry);
  } catch (e) {
    logger.error('OUROBOROS', 'read', `Failed to read soul log: ${(e as Error).message}`);
    return report;
  }

  report.entriesScanned = entries.length;

  for (const entry of entries) {
    const interrupt = auditEntry(entry);
    if (interrupt) {
      report.violationsFound++;
      report.interrupts.push(interrupt);
      if (emit) sendReRoll(interrupt);
    }
  }

  logger.info('OUROBOROS', 'audit', `Audit complete`, {
    scanned: report.entriesScanned,
    violations: report.violationsFound,
  });

  return report;
}

// ── Continuous monitoring ──────────────────────────────────────────────────────

export class OuroborosVerifier {
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastOffset = 0;

  /** Start watching soul.jsonl for new violations (poll-based). */
  start(intervalMs = 30_000): void {
    this.timer = setInterval(() => this.poll(), intervalMs);
    logger.info('OUROBOROS', 'start', `Verifier active — polling every ${intervalMs}ms`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    logger.info('OUROBOROS', 'stop', 'Verifier stopped');
  }

  private poll(): void {
    if (!fs.existsSync(SOUL_LOG)) return;
    try {
      const stat = fs.statSync(SOUL_LOG);
      if (stat.size <= this.lastOffset) return;

      const fd  = fs.openSync(SOUL_LOG, 'r');
      const buf = Buffer.alloc(stat.size - this.lastOffset);
      fs.readSync(fd, buf, 0, buf.length, this.lastOffset);
      fs.closeSync(fd);
      this.lastOffset = stat.size;

      const newLines = buf.toString('utf8').split('\n').filter(Boolean);
      for (const line of newLines) {
        try {
          const entry = JSON.parse(line) as SoulEntry;
          const interrupt = auditEntry(entry);
          if (interrupt) sendReRoll(interrupt);
        } catch { /* skip malformed lines */ }
      }
    } catch (e) {
      logger.error('OUROBOROS', 'poll', `Poll failed: ${(e as Error).message}`);
    }
  }
}

export const ouroborosVerifier = new OuroborosVerifier();
