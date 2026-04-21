import { randomUUID } from 'node:crypto';
import type { ILogger } from '../core/interfaces.js';

export interface LogEntry {
  timestamp: string;
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  context: string;
  traceId: string;
  message: string;
  data?: Record<string, unknown>;
  nodeId: string;
  stack?: string;
}

/** Structured gauntlet audit result — mirrors AuditResult from gauntlet/types.ts */
export interface AuditLogEntry {
  phaseId: number;
  phaseName: string;
  block: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: Record<string, unknown>;
  durationMs?: number;
}

const NODE_ID = process.env['NODE_ID'] || (process.env['USER'] === 'maczz' ? 'NODE-A' : 'NODE-B');

export class Logger implements ILogger {
  private static instance: Logger;
  private readonly patternSubscribers: Array<{ pattern: RegExp; handler: (entry: LogEntry) => void }> = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Subscribe to log entries matching a pattern.
   * Returns an unsubscribe function.
   */
  subscribe(pattern: RegExp, handler: (entry: LogEntry) => void): () => void {
    const sub = { pattern, handler };
    this.patternSubscribers.push(sub);
    return () => {
      const idx = this.patternSubscribers.indexOf(sub);
      if (idx !== -1) this.patternSubscribers.splice(idx, 1);
    };
  }

  private log(severity: LogEntry['severity'], context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      context,
      traceId: traceId ?? 'no-trace',
      message,
      nodeId: NODE_ID,
    };

    if (data) {
      entry.data = data;
    }

    if (severity === 'ERROR') {
      const stack = new Error().stack;
      if (stack) entry.stack = stack;
    }

    const logStr = JSON.stringify(entry);

    switch (severity) {
      case 'DEBUG':
        console.debug(logStr);
        break;
      case 'INFO':
        console.info(logStr);
        break;
      case 'WARN':
        console.warn(logStr);
        break;
      case 'ERROR':
        console.error(logStr);
        break;
    }

    // Dispatch to pattern subscribers (non-blocking)
    if (this.patternSubscribers.length > 0) {
      const combined = `${context} ${message}`;
      for (const sub of this.patternSubscribers) {
        if (sub.pattern.test(combined)) {
          try { sub.handler(entry); } catch { /* non-fatal */ }
        }
      }
    }
  }

  debug(context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    this.log('DEBUG', context, traceId, message, data);
  }

  info(context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    this.log('INFO', context, traceId, message, data);
  }

  warn(context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    this.log('WARN', context, traceId, message, data);
  }

  error(context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    this.log('ERROR', context, traceId, message, data);
  }

  /** Log a structured gauntlet audit result. Severity maps PASS→INFO, WARN→WARN, FAIL/SKIP→ERROR/DEBUG. */
  audit(result: AuditLogEntry): void {
    const severityMap: Record<AuditLogEntry['status'], LogEntry['severity']> = {
      PASS: 'INFO',
      WARN: 'WARN',
      FAIL: 'ERROR',
      SKIP: 'DEBUG',
    };
    const severity = severityMap[result.status];
    const traceId = `phase-${result.phaseId}`;
    this.log(severity, `GAUNTLET::${result.block}`, traceId, `[${result.status}] ${result.phaseName}: ${result.message}`, {
      phaseId: result.phaseId,
      status: result.status,
      durationMs: result.durationMs ?? 0,
      ...(result.details || {}),
    });
  }

  /** Log a shard manifest() control event. */
  manifest(phaseId: number, status: string, data?: Record<string, unknown>): void {
    this.log('INFO', 'GAUNTLET::MANIFEST', `phase-${phaseId}`, `[MANIFEST] Phase ${phaseId}: ${status}`, data);
  }
}

export const logger = Logger.getInstance();
