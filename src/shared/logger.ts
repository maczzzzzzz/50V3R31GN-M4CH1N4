import { randomUUID } from 'node:crypto';
import type { ILogger } from '../core/interfaces.js';

export interface LogEntry {
  timestamp: string;
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  context: string;
  traceId: string;
  message: string;
  data: Record<string, unknown> | undefined;
}

export class Logger implements ILogger {
  private static instance: Logger;

  private constructor() {}

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
      traceId: traceId || 'no-trace',
      message,
      data: data,
    };

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
}

export const logger = Logger.getInstance();
