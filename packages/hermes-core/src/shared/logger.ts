import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ILogger } from '../core/interfaces.js';

/**
 * ◈ SOVEREIGN_LOGGER — v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS RE-GROUNDED
 * 
 * Enforces structured Trace-ID propagation across the Trinity.
 * Persistence: JSON Stream (data/logs/artery.json) + SQLite (decision_audit).
 */

export interface LogEntry {
  timestamp: string;
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'VETO';
  context: string;
  traceId: string;
  message: string;
  data?: Record<string, unknown>;
  nodeId: string;
  stack?: string;
}

export interface AuditLogEntry {
  phaseId: number | string;
  phaseName: string;
  block: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: Record<string, unknown>;
  durationMs?: number;
}

const NODE_ID = process.env['NODE_ID'] || 'NODE-B';
const LOG_DIR = './data/logs';
const LOG_FILE = join(LOG_DIR, 'artery.json');

export class Logger implements ILogger {
  private static instance: Logger;
  private readonly patternSubscribers: Array<{ pattern: RegExp; handler: (entry: LogEntry) => void }> = [];

  private constructor() {
    try {
      mkdirSync(LOG_DIR, { recursive: true });
    } catch { /* exists */ }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(severity: LogEntry['severity'], context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      context,
      traceId: traceId || 'root-kernel',
      message,
      nodeId: NODE_ID,
    };

    if (data) entry.data = data;
    if (severity === 'ERROR' || severity === 'VETO') {
      const stack = new Error().stack;
      if (stack) entry.stack = stack;
    }

    const logLine = JSON.stringify(entry);

    if (process.env['NODE_ENV'] !== 'test') {
      // 1. Terminal Output
      this.printToConsole(severity, logLine);

      // 2. Physical Persistence (JSON Stream)
      try {
        appendFileSync(LOG_FILE, logLine + '\n');
        appendFileSync(SESSION_LOG_FILE, logLine + '\n');
      } catch (e) {
        console.error(`::/LOG_WRITE_FAILURE : ${e}`);
      }
    }

    // 3. Dispatch to subscribers (e.g. Pretext HUD via SSE)
    this.dispatchToSubscribers(entry, context, message);
  }

  private printToConsole(severity: string, line: string) {
    switch (severity) {
      case 'DEBUG': console.debug(line); break;
      case 'INFO': console.info(line); break;
      case 'WARN': console.warn(line); break;
      case 'ERROR':
      case 'VETO': console.error(line); break;
    }
  }

  private dispatchToSubscribers(entry: LogEntry, context: string, message: string) {
    if (this.patternSubscribers.length > 0) {
      const combined = `${context} ${message}`;
      for (const sub of this.patternSubscribers) {
        if (sub.pattern.test(combined)) {
          try { sub.handler(entry); } catch { /* non-fatal */ }
        }
      }
    }
  }

  // ◈ API Implementation
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
  
  /** Triggers a physical audit engravement for critical decisions. */
  veto(context: string, traceId: string, rationale: string, data?: Record<string, unknown>): void {
    this.log('VETO', context, traceId, rationale, data);
    // TODO: Direct SQL injection to decision_audit via better-sqlite3
  }

  audit(result: AuditLogEntry): void {
    const severityMap: Record<AuditLogEntry['status'], LogEntry['severity']> = {
      PASS: 'INFO', WARN: 'WARN', FAIL: 'ERROR', SKIP: 'DEBUG',
    };
    this.log(severityMap[result.status], `GAUNTLET::${result.block}`, `phase-${result.phaseId}`, result.message, {
      phaseId: result.phaseId,
      status: result.status,
      durationMs: result.durationMs ?? 0,
      ...result.details,
    });
  }

  subscribe(pattern: RegExp, handler: (entry: LogEntry) => void): () => void {
    const sub = { pattern, handler };
    this.patternSubscribers.push(sub);
    return () => {
      const idx = this.patternSubscribers.indexOf(sub);
      if (idx !== -1) this.patternSubscribers.splice(idx, 1);
    };
  }
}

export const logger = Logger.getInstance();
cribers.indexOf(sub);
      if (idx !== -1) this.patternSubscribers.splice(idx, 1);
    };
  }
}

export const logger = Logger.getInstance();
