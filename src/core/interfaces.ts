/**
 * src/core/interfaces.ts
 *
 * Contracts for Phase 2: Rules Authority Bridge (nitro-logic).
 *
 * NitroLogicClient wraps Node A's Llama-3.2-3B-Instruct inference engine,
 * exposed via the OpenAI-compatible /v1/chat/completions endpoint from llama.cpp.
 *
 * All response types require a `reasoning` field — this is the Chain-of-Thought
 * scratchpad emitted by Llama-3.2-3B per the research mandate (Phase-2-3-Orchestration-Research §1.2).
 */

// ── Configuration ─────────────────────────────────────────────────────────────

/**
 * Connection and inference parameters for Node A's llama.cpp server.
 * All numeric inference params are mandatory to prevent non-deterministic output.
 */
export interface NitroLogicConfig {
  /** Base URL of Node A's OpenAI-compatible server. e.g. http://192.168.0.50:8080/v1 */
  readonly baseUrl: string;
  /** Model identifier passed to the /v1/chat/completions endpoint. */
  readonly model: string;
  /** HTTP request timeout in milliseconds. */
  readonly timeoutMs: number;
  /**
   * RNG seed for reproducible results. Node A must honour this via llama.cpp
   * `--seed` flag OR the `seed` request parameter.
   * Default: 42. Override per-tool call is not supported at the interface level.
   */
  readonly seed: number;
}

// ── Input parameter types ─────────────────────────────────────────────────────

export interface ResolveAttackParams {
  /** Unique ID of the target actor (optional, for Oracle state reconciliation). */
  readonly targetId?: string | undefined;
  readonly attackerSkill: number;
  readonly attackerRef: number;
  readonly weaponDamage: string;        // e.g. "3d6", "2d6+1"
  readonly weaponArmorPiercing: boolean;
  readonly defenderRef: number;
  readonly defenderSP: number;
  readonly rangeBand: RangeBand;
  readonly modifiers: number;
}

export interface CalculateDvParams {
  readonly checkType: CheckType;
  readonly baseSkill: number;
  readonly baseStat: number;
  readonly rangeBand?: RangeBand;
  readonly situationalModifiers: number;
  readonly targetDifficulty: DifficultyLabel;
}

export interface OracleRollParams {
  readonly expression: string;          // e.g. "1d10", "2d6+3"
  readonly context?: string;            // narrative context for CoT injection
  readonly applyLuck: boolean;
  readonly luckPoints: number;
}

// ── Shared value types ────────────────────────────────────────────────────────

export type RangeBand = 'melee' | 'close' | 'medium' | 'long' | 'extreme';

export type CheckType = 'skill' | 'ranged_attack' | 'melee_attack' | 'repair' | 'facedown';

export type DifficultyLabel =
  | 'everyday'
  | 'difficult'
  | 'professional'
  | 'heroic'
  | 'superheroic'
  | 'legendary';

// ── Response types ────────────────────────────────────────────────────────────

/**
 * Result of a complete attack resolution.
 * `reasoning` contains the CoT scratchpad from Llama-3.2-3B.
 */
export interface AttackResult {
  readonly hit: boolean;
  /** Attack roll total (d10 + REF + Skill + Modifiers). */
  readonly rollTotal: number;
  /** DV the attacker needed to reach. */
  readonly dvTarget: number;
  /** Weapon damage before SP reduction. */
  readonly rawDamage: number;
  /** Damage after SP reduction (min 0). */
  readonly netDamage: number;
  /** True if net damage ≥ 5 and the attack hit. */
  readonly criticalInjury: boolean;
  /** Chain-of-Thought explanation from Node A. */
  readonly reasoning: string;
}

/**
 * Result of a DV calculation for a skill check or attack.
 */
export interface DvResult {
  /** The final DV target number. */
  readonly dv: number;
  /** Human-readable formula breakdown (e.g. "Professional DV (15) + Long range (+5) = 20"). */
  readonly breakdown: string;
  /** Chain-of-Thought explanation from Node A. */
  readonly reasoning: string;
}

/**
 * Result of a dice oracle roll.
 */
export interface OracleResult {
  /** Final resolved dice result (after any luck reroll). */
  readonly result: number;
  /** True if the raw d10 result was 10 (Critical Success). */
  readonly isCriticalSuccess: boolean;
  /** True if the raw d10 result was 1 (Critical Failure). */
  readonly isCriticalFailure: boolean;
  /**
   * If luck was spent and a reroll occurred, this holds the reroll value.
   * Null otherwise.
   */
  readonly luckyReroll: number | null;
  /** Chain-of-Thought explanation from Node A. */
  readonly reasoning: string;
}

// ── Ollama (Node B narrative) types ───────────────────────────────────────────

/**
 * Connection parameters for Node B's Ollama endpoint (Mistral-Nemo 12B).
 */
export interface OllamaConfig {
  /** Base URL of Node B's Ollama OpenAI-compatible server. e.g. http://localhost:11434/v1 */
  readonly baseUrl: string;
  /** Model identifier (e.g. "mistral-nemo:latest"). */
  readonly model: string;
  /** HTTP request timeout in milliseconds. */
  readonly timeoutMs: number;
  /** 
   * Optional: Number of layers to offload to GPU. 
   * If omitted, Ollama defaults to auto-detection (-1).
   */
  readonly num_gpu?: number | undefined;
}

export interface IOllamaClient {
  /**
   * Generate narrative prose from a directive prompt and an optional
   * math/rules context string (e.g. serialised AttackResult).
   */
  generateNarrative(prompt: string, context: string, systemContext?: string): Promise<string>;
  /** Checks whether Ollama is reachable. Does not validate model accuracy. */
  isHealthy(): Promise<boolean>;
  /** 
   * Perform graceful cleanup. 
   * For Ollama, this unloads the model from VRAM.
   */
  stop(): Promise<void>;
}

// ── Discord Chronicler ────────────────────────────────────────────────────────

/** Narrative voice persona for Screamsheet broadcasts. */
export type ScreamsheetPersona = 'Netwatch Alerts' | 'NCPD Scanner' | 'Street Rumor';

export interface IDiscordChroniclerClient {
  /** Post a screamsheet bark to the configured Discord channel. Non-fatal. */
  screamsheetPost(content: string, persona: ScreamsheetPersona): Promise<void>;
}

// ── Client interface ──────────────────────────────────────────────────────────

export interface INitroLogicClient {
  /** Resolve a complete Cyberpunk RED attack roll against a defender. */
  resolveAttack(params: ResolveAttackParams): Promise<AttackResult>;
  /** Calculate the Difficulty Value for a skill check or combat action. */
  calculateDv(params: CalculateDvParams): Promise<DvResult>;
  /** Roll a dice expression with optional Luck point integration. */
  oracleRoll(params: OracleRollParams): Promise<OracleResult>;
  /**
   * Checks whether Node A's inference endpoint is reachable and responsive.
   * Does NOT validate model accuracy — only connectivity.
   */
  isHealthy(): Promise<boolean>;
  /** Perform graceful cleanup of connections. */
  stop(): Promise<void>;
}
