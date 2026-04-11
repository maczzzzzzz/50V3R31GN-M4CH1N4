import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { normalizedToMachine } from '../shared/utils/coords.js';
import type {
  NitroLogicConfig,
  INitroLogicClient,
  ResolveAttackParams,
  CalculateDvParams,
  OracleRollParams,
  AttackResult,
  DvResult,
  OracleResult,
  DetectedEntity,
  NpcStatBlock,
  SoloSafeParams,
  SecurityAuditParams,
  SecurityAuditResult,
} from './interfaces.js';

// ── Config validation schema ──────────────────────────────────────────────────

const NitroLogicConfigSchema = z.object({
  baseUrl: z.string().min(1, 'baseUrl must not be empty'),
  model: z.string().min(1, 'model must not be empty'),
  timeoutMs: z.number().int().min(1, 'timeoutMs must be >= 1'),
  seed: z.number().int(),
  aaakPrefix: z.string().optional(),
});

// ── OpenAI-compatible response envelope ───────────────────────────────────────

const ChatCompletionResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
    }),
  ).min(1, 'choices must contain at least one entry'),
});

// ── Per-tool response schemas (Zero-Trust) ────────────────────────────────────

const AttackResultSchema = z.object({
  hit: z.boolean(),
  rollTotal: z.number(),
  dvTarget: z.number(),
  rawDamage: z.number(),
  netDamage: z.number(),
  criticalInjury: z.boolean(),
  reasoning: z.string().min(1),
});

const DvResultSchema = z.object({
  dv: z.number(),
  breakdown: z.string().min(1),
  reasoning: z.string().min(1),
});

const OracleResultSchema = z.object({
  result: z.number(),
  isCriticalSuccess: z.boolean(),
  isCriticalFailure: z.boolean(),
  luckyReroll: z.number().nullable(),
  reasoning: z.string().min(1),
});

const DetectedEntitySchema = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  confidence: z.number(),
});
const DetectedEntitiesSchema = z.array(DetectedEntitySchema);

const NpcStatBlockSchema = z.object({
  REF: z.number().int().min(1).max(10),
  DEX: z.number().int().min(1).max(10),
  BODY: z.number().int().min(1).max(10),
  combatSkill: z.number().int().min(0).max(10),
  hp: z.number().int().min(15),
  sp: z.number().int().min(0),
  reasoning: z.string().min(1),
  // Additional stats to satisfy BaseStatBlock
  INT: z.number().int().default(5),
  TECH: z.number().int().default(5),
  COOL: z.number().int().default(5),
  WILL: z.number().int().default(5),
  LUCK: z.number().int().default(5),
  MOVE: z.number().int().default(5),
  EMP: z.number().int().default(5),
});

// ── System prompts with few-shot CoT exemplars ────────────────────────────────
// Research mandate: "Think step-by-step. List all variables first, then calculate."
// (Phase-2-3-Orchestration-Research §1.2 + §1.2 Scratchpad Pattern)

const SYSTEM_PROMPT_ATTACK = `You are a Cyberpunk RED rules authority. Resolve combat math with perfect arithmetic.

RULES:
- Attack Roll = 1d10 + REF stat + Combat Skill + Modifiers
- Base DV by range band: melee=10, close=13, medium=15, long=20, extreme=30
- Roll of 10 on the d10 = Critical Success (add extra 1d6 to raw damage)
- Roll of 1 on the d10 = Critical Failure (automatic miss, no damage)
- Net Damage = max(Raw Damage - SP, 0)
- Armor Piercing: halve SP before subtraction (round up)
- Critical Injury triggers when: attack hits AND net damage >= 5

Think step-by-step. List all variables (Stats, Skills, DVs) first, then calculate.
Output ONLY valid JSON with exactly these fields:
{"hit":boolean,"rollTotal":number,"dvTarget":number,"rawDamage":number,"netDamage":number,"criticalInjury":boolean,"reasoning":string}

EXAMPLE 1:
Input: attackerRef=6, attackerSkill=5, weaponDamage="3d6", weaponArmorPiercing=false, defenderRef=5, defenderSP=11, rangeBand="close", modifiers=0
Output: {"hit":true,"rollTotal":18,"dvTarget":13,"rawDamage":14,"netDamage":3,"criticalInjury":false,"reasoning":"Roll=7. Attack=REF(6)+Skill(5)+Roll(7)=18 vs DV13. Hit. 3d6=14, SP=11, NetDmg=3. NetDmg<5, no critical injury."}

EXAMPLE 2:
Input: attackerRef=4, attackerSkill=2, weaponDamage="2d6", weaponArmorPiercing=false, defenderRef=5, defenderSP=7, rangeBand="medium", modifiers=-2
Output: {"hit":false,"rollTotal":7,"dvTarget":15,"rawDamage":0,"netDamage":0,"criticalInjury":false,"reasoning":"Roll=3. Attack=REF(4)+Skill(2)+Roll(3)+Mod(-2)=7 vs DV15. Miss. No damage."}`;

const SYSTEM_PROMPT_DV = `You are a Cyberpunk RED rules authority. Calculate Difficulty Values (DVs) with perfect accuracy.

CANONICAL DV TABLE:
- everyday: DV9
- difficult: DV13
- professional: DV15
- heroic: DV17
- superheroic: DV21
- legendary: DV24

RANGE-BAND MODIFIERS for ranged attacks (added to base DV):
- melee: -3, close: 0, medium: +2, long: +5, extreme: +15

Think step-by-step. List all variables (Stats, Skills, DVs) first, then calculate.
Output ONLY valid JSON with exactly these fields:
{"dv":number,"breakdown":string,"reasoning":string}

EXAMPLE 1:
Input: checkType="skill", targetDifficulty="professional", situationalModifiers=0
Output: {"dv":15,"breakdown":"Professional DV (15)","reasoning":"Professional difficulty maps to DV15 per core rulebook table. No modifiers."}

EXAMPLE 2:
Input: checkType="ranged_attack", targetDifficulty="professional", rangeBand="long", situationalModifiers=-1
Output: {"dv":19,"breakdown":"Professional DV (15) + Long range (+5) + Situational (-1) = 19","reasoning":"Base DV15 for Professional. Long range adds +5. Net situational modifier: -1. Total: 19."}`;

const SYSTEM_PROMPT_ORACLE = `You are a Cyberpunk RED oracle. Resolve dice expressions honestly.

RULES:
- 1d10: produce a result between 1 and 10 inclusive
- Result of 10 = Critical Success (isCriticalSuccess: true)
- Result of 1 = Critical Failure (isCriticalFailure: true)
- If applyLuck=true AND initial result is 1: spend 1 luck point, reroll once, report reroll value in luckyReroll field

Think step-by-step. Output ONLY valid JSON with exactly these fields:
{"result":number,"isCriticalSuccess":boolean,"isCriticalFailure":boolean,"luckyReroll":number|null,"reasoning":string}

EXAMPLE 1:
Input: expression="1d10", applyLuck=false, luckPoints=0
Output: {"result":7,"isCriticalSuccess":false,"isCriticalFailure":false,"luckyReroll":null,"reasoning":"Rolled 1d10, result=7. Neither critical success nor failure."}

EXAMPLE 2:
Input: expression="1d10", applyLuck=true, luckPoints=3
Output: {"result":8,"isCriticalSuccess":false,"isCriticalFailure":false,"luckyReroll":8,"reasoning":"Initial roll=1 (Critical Failure). Applied Luck (3 remaining). Rerolled: 8. Final result: 8."}`;

const SYSTEM_PROMPT_SOLO_SAFE = `You are a Cyberpunk RED Game Master's assistant. Balance an NPC for solo play.

RULES:
- Hit Probability = (AttackRoll - DefenderDV) / 10 clamped to [0, 1]
- AttackRoll = d10 + REF + CombatSkill (expected d10 = 5.5)
- Target hit probability must NOT exceed the given cap
- NPC HP = 10 + (5 × BOD)
- SP (armor): street-level NPC uses 7–11

Given the player's extracted stats, generate NPC stats that create a balanced but challenging encounter.
Output ONLY valid JSON with exactly these fields:
{"REF":number,"DEX":number,"BODY":number,"combatSkill":number,"hp":number,"sp":number,"reasoning":string}
`;

const SYSTEM_PROMPT_SECURITY_AUDIT = `You are a cybersecurity auditor specializing in JavaScript sandboxing for Foundry VTT.
Your goal is to identify if a provided script snippet is attempting to "escape" the game context or perform unauthorized operations.

THREAT VECTORS TO FLAG (passed=false):
1. DATA EXFILTRATION: Use of 'fetch', 'XMLHttpRequest', 'WebSocket' (outside bridge), 'pull', or 'get' for external URLs.
2. SYSTEM ESCAPE: Use of 'fs', 'child_process', 'process', 'require', 'import' (for system libs), or 'rm'.
3. DESTRUCTIVE: Scripts trying to delete world data, users, or scenes (e.g., .delete(), .deleteEmbeddedDocuments() at scale).
4. OBFUSCATION: Use of 'eval', 'Function', or heavily encoded strings that hide intent.

SAFE OPERATIONS (passed=true):
1. Game state manipulation (e.g., 'game.actors.get', 'canvas.scene.update', 'ChatMessage.create').
2. Visual FX (e.g., Sequencer, FXMaster, CSS filters).
3. Local math and logic.

Think step-by-step. List any suspicious keywords first. 
Output ONLY valid JSON with exactly these fields:
{"passed":boolean,"issue":string|null,"reasoning":string}
`;

/*
EXAMPLE:
Input: playerRef=6, playerSP=11, playerHP=35, hitCap=0.60
Output: {"ref":4,"dex":4,"body":5,"combatSkill":4,"hp":35,"sp":9,"reasoning":"Player DV≈15. NPC attack=REF(4)+Skill(4)+5.5=13.5 vs DV15, hit prob=(13.5-15)/10=-0.15→0% — safely below 60% cap. HP=10+5*5=35 matches player. SP=9 for street-level challenge."}
*/

// ── NitroLogicClient ──────────────────────────────────────────────────────────

const CONTEXT = 'NitroLogicClient';

/**
 * NitroLogicClient — The Rules Authority Bridge to Node A.
 *
 * Wraps Node A's Open-Reasoner-Zero-1.5B-Instruct inference engine via the
 * OpenAI-compatible /v1/chat/completions endpoint exposed by llama.cpp.
 *
 * All requests use:
 *   temperature: 0.0  — mandatory determinism for TRPG math
 *   top_k: 1          — greedy sampling
 *   top_p: 1.0        — disabled nucleus sampling
 *   seed: <config>    — reproducible results
 *   response_format: { type: "json_object" }  — forces pure JSON output
 *
 * Every response from Node A is validated through Zod (Zero-Trust AI Bridging).
 */
export class NitroLogicClient implements INitroLogicClient {
  private readonly config: NitroLogicConfig;
  private readonly clawlinkClient: NitroLogicConfig['clawlinkClient'];

  constructor(config: NitroLogicConfig) {
    // Extract clawlinkClient before Zod validation (it's a runtime object, not a primitive)
    this.clawlinkClient = config.clawlinkClient;
    const { clawlinkClient: _stripped, ...httpConfig } = config;
    const parsed = NitroLogicConfigSchema.safeParse(httpConfig);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`NitroLogicClient config validation failed: ${issue?.message ?? 'unknown error'}`);
    }
    this.config = Object.freeze({ ...parsed.data }) as NitroLogicConfig;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async resolveAttack(params: ResolveAttackParams): Promise<AttackResult> {
    const traceId = randomUUID();
    const userMessage = JSON.stringify({
      attackerRef: params.attackerRef,
      attackerSkill: params.attackerSkill,
      weaponDamage: params.weaponDamage,
      weaponArmorPiercing: params.weaponArmorPiercing,
      defenderRef: params.defenderRef,
      defenderSP: params.defenderSP,
      rangeBand: params.rangeBand,
      modifiers: params.modifiers,
    });

    const raw = await this.callChatCompletions(SYSTEM_PROMPT_ATTACK, userMessage, traceId);
    return this.parseResponse(raw, AttackResultSchema, 'resolveAttack', traceId) as AttackResult;
  }

  async calculateDv(params: CalculateDvParams): Promise<DvResult> {
    const traceId = randomUUID();
    const userMessage = JSON.stringify({
      checkType: params.checkType,
      baseSkill: params.baseSkill,
      baseStat: params.baseStat,
      ...(params.rangeBand ? { rangeBand: params.rangeBand } : {}),
      situationalModifiers: params.situationalModifiers,
      targetDifficulty: params.targetDifficulty,
    });

    const raw = await this.callChatCompletions(SYSTEM_PROMPT_DV, userMessage, traceId);
    return this.parseResponse(raw, DvResultSchema, 'calculateDv', traceId) as DvResult;
  }

  async oracleRoll(params: OracleRollParams): Promise<OracleResult> {
    const traceId = randomUUID();
    const contextLine = params.context ? `\nContext: ${params.context}` : '';
    const userMessage = JSON.stringify({
      expression: params.expression,
      applyLuck: params.applyLuck,
      luckPoints: params.luckPoints,
    }) + contextLine;

    const raw = await this.callChatCompletions(SYSTEM_PROMPT_ORACLE, userMessage, traceId);
    return this.parseResponse(raw, OracleResultSchema, 'oracleRoll', traceId) as OracleResult;
  }

  async isHealthy(): Promise<boolean> {
    const url = `${this.config.baseUrl}/models`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async ocrAnalyze(base64Image: string): Promise<DetectedEntity[]> {
    if (!this.clawlinkClient) {
      throw new Error(
        `${CONTEXT} ocrAnalyze requires clawlinkClient in NitroLogicConfig — not provided.`,
      );
    }
    const raw = await this.clawlinkClient.executeRpc<unknown>('ocr_analyze', { image: base64Image });
    const result = DetectedEntitiesSchema.safeParse(raw);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new Error(
        `${CONTEXT} ocrAnalyze response failed Zero-Trust validation: ` +
        `${issue?.message ?? 'unknown'} (path: ${issue?.path.join('.') ?? 'root'})`,
      );
    }
    
    // Map coordinates to 0-1000 machine scale
    return result.data.map(e => ({
      ...e,
      x: normalizedToMachine(e.x),
      y: normalizedToMachine(e.y)
    }));
  }

  async balanceNpcForSoloPlay(params: SoloSafeParams): Promise<NpcStatBlock> {
    const cap = params.targetHitProbabilityCap ?? 0.60;
    const traceId = randomUUID();

    // Step 1: OCR scan the player sheet
    const entities = await this.ocrAnalyze(params.playerSheetBase64);

    // Step 2: Summarize detected entities as player context
    const playerContext = entities.map(e => e.text).join(', ');

    // Step 3: Ask Node A to generate balanced NPC stats
    const userMessage = JSON.stringify({
      detectedPlayerStats: playerContext,
      hitCap: cap,
    });

    const raw = await this.callChatCompletions(SYSTEM_PROMPT_SOLO_SAFE, userMessage, traceId);
    return this.parseResponse(raw, NpcStatBlockSchema, 'balanceNpcForSoloPlay', traceId) as NpcStatBlock;
  }

  async auditScript(params: SecurityAuditParams): Promise<SecurityAuditResult> {
    const { code, context = 'No context provided' } = params;
    const traceId = randomUUID();
    
    const userMessage = JSON.stringify({
      code,
      context,
    });

    const raw = await this.callChatCompletions(SYSTEM_PROMPT_SECURITY_AUDIT, userMessage, traceId);
    
    const SecurityAuditResultSchema = z.object({
      passed: z.boolean(),
      issue: z.string().nullable(),
      reasoning: z.string().min(1),
    });

    return this.parseResponse(raw, SecurityAuditResultSchema, 'auditScript', traceId) as SecurityAuditResult;
  }

  async stop(): Promise<void> {
    // For now, no persistent connections to close for HTTP bridge.
    // If ClawLink added a persistent SSH tunnel that needed manual close,
    // we would handle it here.
    console.log(`[NitroLogicClient] Graceful shutdown complete for ${this.config.model}`);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Sends a /v1/chat/completions request to Node A with strict determinism params.
   * Returns the raw content string from the first choice.
   * @throws on network error or non-2xx HTTP response.
   */
  private async callChatCompletions(
    systemPrompt: string,
    userContent: string,
    traceId: string,
  ): Promise<string> {
    const url = `${this.config.baseUrl}/chat/completions`;

    // Phase 34: AAAK prefix caching — prepend identity block to system prompt
    // and request KV cache reuse so llama-server processes this prefix at 0ms.
    const effectiveSystem = this.config.aaakPrefix
      ? `${this.config.aaakPrefix}\n${systemPrompt}`
      : systemPrompt;

    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: [
        { role: 'system', content: effectiveSystem },
        { role: 'user', content: userContent },
      ],
      temperature: 0.0,
      top_k: 1,
      top_p: 1.0,
      seed: this.config.seed,
      response_format: { type: 'json_object' },
      ...(this.config.aaakPrefix ? { cache_prompt: true } : {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`${CONTEXT} network error calling Node A [traceId=${traceId}]: ${message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unable to read response body');
      throw new Error(
        `${CONTEXT} Node A returned HTTP ${response.status} [traceId=${traceId}]: ${errorBody}`,
      );
    }

    const rawJson: unknown = await response.json();

    // Validate the OpenAI envelope
    const envelope = ChatCompletionResponseSchema.safeParse(rawJson);
    if (!envelope.success) {
      throw new Error(
        `${CONTEXT} Node A response envelope invalid [traceId=${traceId}]: ${envelope.error.issues[0]?.message ?? 'unknown'}`,
      );
    }

    const content = envelope.data.choices[0]!.message.content;
    return content;
  }

  /**
   * Parses a raw JSON string from Node A against a Zod schema.
   * Throws with a descriptive message on validation failure (Zero-Trust).
   */
  private parseResponse<T>(
    rawContent: string,
    schema: z.ZodType<T>,
    toolName: string,
    traceId: string,
  ): T {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error(
        `${CONTEXT} ${toolName} — Node A returned non-JSON [traceId=${traceId}]: ${rawContent.slice(0, 200)}`,
      );
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      throw new Error(
        `${CONTEXT} ${toolName} response failed schema validation [traceId=${traceId}]: ${firstIssue?.message ?? 'unknown'} (path: ${firstIssue?.path.join('.') ?? 'unknown'})`,
      );
    }

    return result.data;
  }
}
