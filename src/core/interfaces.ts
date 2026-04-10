/**
 * src/core/interfaces.ts
 *
 * Contracts for Phase 2: Rules Authority Bridge (nitro-logic).
 * Phase 23: Ghost Object Protocol types imported from vsb_protocol.
 *
 * NitroLogicClient wraps Node A's Llama-3.2-3B-Instruct inference engine,
 * exposed via the OpenAI-compatible /v1/chat/completions endpoint from llama.cpp.
 *
 * All response types require a `reasoning` field — this is the Chain-of-Thought
 * scratchpad emitted by Llama-3.2-3B per the research mandate (Phase-2-3-Orchestration-Research §1.2).
 */

import type { GhostBlip } from '../shared/vsb_protocol.js';
export type { GhostBlip };

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
  /**
   * Optional ClawLink client for ZeroClaw RPC calls (e.g. ocr_analyze).
   * Required when ocrAnalyze() will be called.
   */
  readonly clawlinkClient?: {
    executeRpc<T>(method: string, params: Record<string, unknown>): Promise<T>;
  } | undefined;
  /**
   * Phase 34 — AAAK prefix prompt for llama-server KV cache residency.
   * When set, this string is prepended to every system message and
   * `cache_prompt: true` is sent so llama-server pre-computes and caches
   * the KV state for this common prefix (0ms latency on subsequent calls).
   */
  readonly aaakPrefix?: string | undefined;
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

export interface SecurityAuditParams {
  /** The raw JavaScript code to audit. */
  readonly code: string;
  /** Optional context about the script's intended purpose. */
  readonly context?: string;
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
 * `reasoning` contains the CoT scratchpad from Open-Reasoner-Zero-1.5B.
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

export interface SecurityAuditParams {
  /** The JavaScript snippet to audit. */
  readonly code: string;
  /** Optional context string describing the script's intended purpose. */
  readonly context?: string;
}

export interface SecurityAuditResult {
  /** True if the script is deemed safe to execute in the Foundry sandbox. */
  readonly passed: boolean;
  /** Description of the security violation, if any. */
  readonly issue: string | null;
  /** Chain-of-Thought explanation from Node A. */
  readonly reasoning: string;
}

// ── SovereignNarrative (Node B narrative) types ───────────────────────────────────────────

/**
 * Connection parameters for Node B's SovereignNarrative endpoint (Mistral-Nemo 12B).
 */
export interface SovereignNarrativeConfig {
  /** Base URL of Node B's llama-server OpenAI-compatible server. e.g. http://localhost:8080/v1 */  readonly baseUrl: string;
  /** Model identifier (e.g. "mistral-nemo:latest"). */
  readonly model: string;
  /** HTTP request timeout in milliseconds. */
  readonly timeoutMs: number;
  /** 
   * Optional: Number of layers to offload to GPU. 
   * If omitted, SovereignNarrative defaults to auto-detection (-1).
   */
  readonly num_gpu?: number | undefined;
}

export interface ISovereignNarrativeClient {
  /**
   * Generate narrative prose from a directive prompt and an optional
   * math/rules context string (e.g. serialised AttackResult).
   */
  generateNarrative(prompt: string, context: string, systemContext?: string, districtName?: string, temperature?: number, topP?: number): Promise<string>;
  /** Checks whether SovereignNarrative is reachable. Does not validate model accuracy. */
  isHealthy(): Promise<boolean>;
  /** 
   * Perform graceful cleanup. 
   * For SovereignNarrative, this unloads the model from VRAM.
   */
  stop(): Promise<void>;
}

// â”€â”€ Vision (Sidecar) types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type TacticalCategory = 'cover_high' | 'cover_partial' | 'hazard' | 'security';

export interface TacticalRegion {
  readonly category: TacticalCategory;
  /** Normalized coordinates [ymin, xmin, ymax, xmax] (0-1000). */
  readonly box2d: [number, number, number, number];
  readonly label: string;
}

export interface ISemanticPerceptionClient {
  /**
   * Perform semantic analysis on a map image to identify tactical regions.
   * Supports Falcon Perception or LLava Sidecars.
   */
  scanMap(imagePath: string): Promise<TacticalRegion[]>;
}

// â”€â”€ Architect (Phase 12+) types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface MaterializationResult {
  wallsCreated: number;
  lightsCreated: number;
  tokensCreated: number;
  executionMs: number;
}

export interface IArchitectService {
  /**
   * Batch-materialize world geometry and actors via Neural Painter (CDP).
   */
  batchCreateDocuments(sceneId: string, blueprint: any): Promise<MaterializationResult>;

  /**
   * Trigger a temporary visual glitch on the renderer for damage feedback.
   * Atmosphere First: Screen-space FX instead of decals.
   */
  triggerNeuralGlitch(intensity: number): Promise<void>;

  /**
   * Updates the lighting levels (darkness and global illumination).
   */
  setLighting(sceneId: string | null, darkness: number, globalLight: boolean): Promise<void>;

  /**
   * Manifest a single token on the canvas.
   */
  spawnToken(actorId: string | null, x: number, y: number): Promise<void>;

  /**
   * Seed SceneRegions in Foundry from Ghost Object Protocol blips.
   * Each blip becomes a SceneRegion at the corresponding normalised coordinates.
   */
  seedGhostBlips(sceneId: string | null, blips: GhostBlip[], sceneDimensions: { width: number; height: number }): Promise<void>;
}

// ── Client interface ──────────────────────────────────────────────────────────

/** A single entity detected by the Falcon OCR pass on a scene image. */
export interface DetectedEntity {
  /** OCR-extracted text label (e.g. room name, zone identifier). */
  text: string;
  /** Normalised X coordinate [0.0–1.0] relative to the source image width. */
  x: number;
  /** Normalised Y coordinate [0.0–1.0] relative to the source image height. */
  y: number;
  /** Confidence score from the Falcon model [0.0–1.0]. */
  confidence: number;
}

export interface NpcStatBlock {
  /** Reflexes stat (REF) — governs initiative and ranged combat */
  readonly ref: number;
  /** Dexterity stat (DEX) — governs melee and evasion */
  readonly dex: number;
  /** Body stat (BOD) — governs HP and melee damage bonus */
  readonly body: number;
  /** Combat skill level */
  readonly combatSkill: number;
  /** Hit points */
  readonly hp: number;
  /** Stopping Power of NPC armor */
  readonly sp: number;
  /** LLM reasoning for the stat choices */
  readonly reasoning: string;
}

export interface SoloSafeParams {
  /** Base64-encoded PNG/JPEG of the player's character sheet */
  readonly playerSheetBase64: string;
  /** Maximum allowed hit probability for NPC attacks (0–1). Default: 0.60 */
  readonly targetHitProbabilityCap?: number;
}

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
  /**
   * Run OCR analysis on a base64-encoded PNG image via the Falcon Sidecar on Node A.
   * Requires clawlinkClient in NitroLogicConfig.
   */
  ocrAnalyze(base64Image: string): Promise<DetectedEntity[]>;
  /**
   * Generate Solo-Safe NPC stats balanced against the player's sheet.
   * Uses ocrAnalyze to extract player stats then generates NPC stats
   * where hit probability is capped at targetHitProbabilityCap (default 0.60).
   */
  balanceNpcForSoloPlay(params: SoloSafeParams): Promise<NpcStatBlock>;
  /**
   * Perform a security audit on a JavaScript snippet using Node A's reasoning loop.
   * Identifies escape attempts, data exfiltration, or destructive commands.
   */
  auditScript(params: SecurityAuditParams): Promise<SecurityAuditResult>;
}
