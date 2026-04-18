/**
 * src/core/sentinel-monitor-service.ts
 *
 * SentinelMonitorService — Phase 56 Reactive Risk Monitor.
 *
 * Observes the Logger's log stream for critical patterns (503, VRAM exhaustion,
 * Timeouts) and executes automated recovery verdicts (LOG | BACKUP | REBOOT).
 *
 * Architecture: Hermes-style watch_patterns delegation.
 *   Pattern detected → Sovereign Judgment loop → Verdict executed locally.
 */

import { randomUUID } from 'node:crypto';
import type { Logger, LogEntry } from '../shared/logger.js';

// ── Verdict types ─────────────────────────────────────────────────────────────

export type SentinelVerdict = 'LOG' | 'BACKUP' | 'REBOOT' | 'VETO';

export interface WatchPattern {
  name: string;
  pattern: RegExp;
  verdict: SentinelVerdict;
  /** Minimum ms between repeated triggers for the same pattern. */
  cooldownMs: number;
}

// ── Default watch patterns ────────────────────────────────────────────────────

const DEFAULT_PATTERNS: WatchPattern[] = [
  {
    name: '503-Service-Unavailable',
    pattern: /HTTP 503|status.*503|503.*llama|service unavailable/i,
    verdict: 'LOG',
    cooldownMs: 10_000,
  },
  {
    name: 'VRAM-Exhaustion',
    pattern: /VRAM|out of memory|cuda.*alloc|vulkan.*OOM|llama.*alloc.*fail/i,
    verdict: 'BACKUP',
    cooldownMs: 30_000,
  },
  {
    name: 'Timeout-Critical',
    pattern: /timeout after \d+ms|VSB Timeout|generateNarrative timeout/i,
    verdict: 'LOG',
    cooldownMs: 5_000,
  },
  // Phase 64: Ouroboros v2 — semantic logic veto interception
  {
    name: 'Ouroboros-Logic-Veto',
    pattern: /VETO_LOGIC_FAIL/,
    verdict: 'VETO',
    cooldownMs: 0, // No cooldown — every veto must be acted upon
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

export class SentinelMonitorService {
  private readonly patterns: WatchPattern[];
  private readonly lastTriggered = new Map<string, number>();
  private readonly unsubscribeFns: Array<() => void> = [];

  constructor(
    private readonly logger: Logger,
    patterns: WatchPattern[] = DEFAULT_PATTERNS,
  ) {
    this.patterns = patterns;
  }

  /** Begin watching the log stream. */
  start(): void {
    for (const wp of this.patterns) {
      const unsub = this.logger.subscribe(wp.pattern, (entry) => this.onMatch(wp, entry));
      this.unsubscribeFns.push(unsub);
    }
    const traceId = randomUUID();
    this.logger.info('SentinelMonitor', traceId, `Reactive risk monitor ACTIVE — ${this.patterns.length} pattern(s) armed`);
  }

  /** Stop watching. */
  stop(): void {
    for (const fn of this.unsubscribeFns) fn();
    this.unsubscribeFns.length = 0;
  }

  private onMatch(wp: WatchPattern, entry: LogEntry): void {
    const now = Date.now();
    const last = this.lastTriggered.get(wp.name) ?? 0;
    if (now - last < wp.cooldownMs) return; // still in cooldown
    this.lastTriggered.set(wp.name, now);

    const traceId = randomUUID();
    this.logger.warn('SentinelMonitor', traceId, `[PATTERN MATCH] ${wp.name} — verdict: ${wp.verdict}`, {
      context: entry.context,
      message: entry.message,
      severity: entry.severity,
    });

    this.executeVerdict(wp.verdict, wp.name, traceId);
  }

  private executeVerdict(verdict: SentinelVerdict, patternName: string, traceId: string): void {
    switch (verdict) {
      case 'LOG':
        // Already logged above — structured record is sufficient
        this.logger.warn('SentinelMonitor', traceId, `[VERDICT:LOG] ${patternName} — logged for human review`);
        break;

      case 'BACKUP':
        // Signal that a state snapshot should be taken (non-destructive)
        this.logger.warn('SentinelMonitor', traceId, `[VERDICT:BACKUP] ${patternName} — requesting state backup`);
        this.triggerBackup(traceId);
        break;

      case 'REBOOT':
        // Request graceful restart via SIGTERM
        this.logger.error('SentinelMonitor', traceId, `[VERDICT:REBOOT] ${patternName} — issuing SIGTERM for graceful restart`);
        setTimeout(() => process.emit('SIGTERM'), 500);
        break;

      case 'VETO':
        // Phase 64: Ouroboros v2 — block materialization of the intent that triggered the veto.
        // The VETO_LOGIC_FAIL payload is emitted by RulesOracle (Rust) and surfaced via the log
        // stream. Here we record it as a structured audit event so the orchestrator can prevent
        // the Node B intent from proceeding.
        this.logger.error('SentinelMonitor', traceId, `[VERDICT:VETO] ${patternName} — intent BLOCKED by Ouroboros v2`);
        this.emitVetoSignal(traceId, patternName);
        break;
    }
  }

  /** Write a veto signal file that the orchestrator can poll to block pending intents. */
  private emitVetoSignal(traceId: string, patternName: string): void {
    import('node:fs').then(({ writeFileSync }) => {
      try {
        const payload = JSON.stringify({ traceId, pattern: patternName, timestamp: Date.now() });
        writeFileSync('./data/ouroboros_veto_signal', payload);
        this.logger.warn('SentinelMonitor', traceId, '[VETO] Ouroboros signal written: ./data/ouroboros_veto_signal');
      } catch (e) {
        this.logger.warn('SentinelMonitor', traceId, `[VETO] Failed to write signal: ${(e as Error).message}`);
      }
    }).catch(() => { /* non-fatal */ });
  }

  private triggerBackup(traceId: string): void {
    // Emit a signal that can be intercepted by VesperService or outer shell
    // Non-blocking: writes a sentinel flag file that the orchestrator can detect
    import('node:fs').then(({ writeFileSync }) => {
      try {
        writeFileSync('./data/sentinel_backup_requested', Date.now().toString());
        this.logger.info('SentinelMonitor', traceId, '[BACKUP] Sentinel flag written: ./data/sentinel_backup_requested');
      } catch (e) {
        this.logger.warn('SentinelMonitor', traceId, `[BACKUP] Failed to write flag: ${(e as Error).message}`);
      }
    }).catch(() => { /* non-fatal */ });
  }
}
