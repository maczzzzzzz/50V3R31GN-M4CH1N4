/**
 * src/core/interfaces.ts
 *
 * ◈ Clean BASE Core Interfaces
 */

/** Structured logger for production observability. */
export interface ILogger {
  debug(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
  info(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
  warn(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
  error(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
}

export type SovereignProfile = 'SOVEREIGN_OS' | 'RESEARCHER';

// ── Configuration ─────────────────────────────────────────────────────────────

/**
 * Generic Reasoning Client for Node A.
 */
export interface INitroLogicClient {
  /**
   * Checks whether Node A's inference endpoint is reachable and responsive.
   */
  isHealthy(): Promise<boolean>;
  /** Perform graceful cleanup of connections. */
  stop(): Promise<void>;
  
  /**
   * Generic reasoning/completion call.
   */
  reason(prompt: string, context: string): Promise<{ answer: string; reasoning: string }>;
}

/**
 * Node C: Strategic Oracle (Qwen-9B / DeepSeek-V4).
 * Handles high-speed rule-checking and vision tasks.
 */
export interface StrategicOracleConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly timeoutMs: number;
  readonly host: string;
}

export interface ISovereignNarrativeClient {
  /**
   * Generate narrative prose from a directive prompt and context.
   */
  generateNarrative(prompt: string, context: string, systemContext?: string, temperature?: number, topP?: number): Promise<string>;
  /** Checks whether SovereignNarrative is reachable. */
  isHealthy(): Promise<boolean>;
  /** 
   * Perform graceful cleanup. 
   */
  stop(): Promise<void>;
  /** Switch the active profile. */
  setProfile(profile: SovereignProfile): void;
}

export interface IArchitectService {
  /**
   * Trigger a temporary visual glitch on the renderer.
   */
  triggerNeuralGlitch(intensity: number): Promise<void>;
}

export interface RagSearchParams {
  query: string;
  topK: number;
  namespace: string;
}

export interface HealthCheckResult {
  connected: boolean;
  latencyMs: number;
  pgvectorInstalled: boolean;
  timestamp: string;
}
