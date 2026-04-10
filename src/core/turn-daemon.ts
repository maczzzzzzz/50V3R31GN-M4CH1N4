/**
 * src/core/turn-daemon.ts
 *
 * TurnDaemon — Phase 21, Task 1: Autonomous Turn State Machine
 *
 * Drives one NPC through a 4-stage autonomous turn:
 *   1. Reason  — Analyse sensory context + life-path history
 *   2. Intent  — Distil a high-level goal string
 *   3. Action  — Emit a strict JSON command (5 s hard timeout)
 *   4. Validate — Cross-check with ZeroClaw on Node A (fail-open)
 */

import { z } from 'zod';
import type { ISovereignNarrativeClient } from './interfaces.js';
import type { IClawLinkClient } from '../api/clawlink-client.js';
import type { LifePathService } from './life-path-service.js';
import type { NpcLog } from './life-path-service.js';

const CONTEXT = 'TurnDaemon';
const ACTION_TIMEOUT_MS = 5_000;

// ── NPC action union ──────────────────────────────────────────────────────────

export type NpcAction =
  | { type: 'move'; targetX: number; targetY: number }
  | { type: 'attack'; targetId: string; weaponId?: string }
  | { type: 'interact'; targetId: string; interaction: string }
  | { type: 'idle'; reason: string };

// ── Zod schema for LLM action output ─────────────────────────────────────────

const NpcActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('move'),
    targetX: z.number(),
    targetY: z.number(),
  }),
  z.object({
    type: z.literal('attack'),
    targetId: z.string().min(1),
    weaponId: z.string().optional(),
  }),
  z.object({
    type: z.literal('interact'),
    targetId: z.string().min(1),
    interaction: z.string().min(1),
  }),
  z.object({
    type: z.literal('idle'),
    reason: z.string().min(1),
  }),
]);

// ── Return type ───────────────────────────────────────────────────────────────

export interface TurnResult {
  npcId: string;
  reasoning: string;
  intent: string;
  action: NpcAction;
  validated: boolean;
  durationMs: number;
}

// ── Idle fallback factory ─────────────────────────────────────────────────────

function idleAction(reason: string): NpcAction {
  return { type: 'idle', reason };
}

// ── Structured JSON schema description injected into the action prompt ────────

const ACTION_SCHEMA_HINT = `
Respond with ONLY a single valid JSON object. No prose, no markdown fences.
The object MUST match exactly one of these shapes:
  { "type": "move",     "targetX": <number>, "targetY": <number> }
  { "type": "attack",   "targetId": "<string>", "weaponId": "<string|omit>" }
  { "type": "interact", "targetId": "<string>", "interaction": "<string>" }
  { "type": "idle",     "reason": "<string>" }
`.trim();

// ── TurnDaemon ────────────────────────────────────────────────────────────────

export class TurnDaemon {
  private readonly sovereignNarrative: ISovereignNarrativeClient;
  private readonly clawlink: IClawLinkClient;
  private readonly lifePathService: LifePathService;

  /**
   * TurnDaemon is a stateless service — it holds no NPC-specific identity.
   * Pass the NPC ID per-call to `runTurn` so a single daemon instance can drive
   * any NPC in the session without producing mis-attributed life-path logs.
   */
  constructor(
    sovereignNarrative: ISovereignNarrativeClient,
    clawlink: IClawLinkClient,
    lifePathService: LifePathService,
  ) {
    this.sovereignNarrative = sovereignNarrative;
    this.clawlink = clawlink;
    this.lifePathService = lifePathService;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async runTurn(npcId: string, sensoryContext: string): Promise<TurnResult> {
    const startMs = Date.now();

    // Stage 1: Reason
    const reasoning = await this.stageReason(npcId, sensoryContext);

    // Stage 2: Intent
    const intent = await this.stageIntent(reasoning);

    // Stage 3: Action (hard timeout + Zod validation)
    const action = await this.stageAction(npcId, intent, reasoning, sensoryContext);

    // Stage 4: Validate with Node A
    const { action: finalAction, validated } = await this.stageValidate(npcId, action);

    return {
      npcId,
      reasoning,
      intent,
      action: finalAction,
      validated,
      durationMs: Date.now() - startMs,
    };
  }

  // ── Stage 1: Reason ─────────────────────────────────────────────────────────

  private async stageReason(npcId: string, sensoryContext: string): Promise<string> {
    const logs: NpcLog[] = this.lifePathService.getRecentLogs(npcId, 5);

    const historyBlock = logs.length > 0
      ? logs.map(l => `[${l.createdAt}] ${l.summary}`).join('\n')
      : '(no prior history)';

    const reasonPrompt =
      `You are an NPC with id "${npcId}" in a Cyberpunk RED tactical scenario.\n` +
      `Recent life-path history:\n${historyBlock}\n\n` +
      `Current sensory context: ${sensoryContext}\n\n` +
      `Analyse this situation. What is happening around you and why does it matter to your survival?`;

    const reasoning = await this.sovereignNarrative.generateNarrative(
      reasonPrompt,
      sensoryContext,
      undefined,
    );

    return reasoning;
  }

  // ── Stage 2: Intent ─────────────────────────────────────────────────────────

  private async stageIntent(reasoning: string): Promise<string> {
    const intentPrompt =
      `Based on the following tactical reasoning, state your single high-level goal ` +
      `in one short sentence (e.g. "Secure the perimeter", "Eliminate the threat", ` +
      `"Retreat to cover and radio backup").\n\n` +
      `Reasoning:\n${reasoning}`;

    const intent = await this.sovereignNarrative.generateNarrative(
      intentPrompt,
      reasoning,
      undefined,
    );

    return intent.trim();
  }

  // ── Stage 3: Action ─────────────────────────────────────────────────────────

  private async stageAction(
    npcId: string,
    intent: string,
    reasoning: string,
    sensoryContext: string,
  ): Promise<NpcAction> {
    const actionPrompt =
      `You are an NPC with goal: "${intent}".\n` +
      `Context: ${sensoryContext}\n` +
      `Reasoning: ${reasoning}\n\n` +
      `${ACTION_SCHEMA_HINT}`;

    // Race the LLM call against a 5 s hard timeout
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('action_timeout')), ACTION_TIMEOUT_MS);
    });

    let raw: string;
    try {
      raw = await Promise.race([
        this.sovereignNarrative.generateNarrative(actionPrompt, sensoryContext, undefined),
        timeoutPromise,
      ]);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'action_timeout';
      this.warn(npcId, `Stage 3 timed out or threw: ${reason}. Falling back to idle.`);
      return idleAction('action_timeout');
    }

    // Strip possible markdown fences
    const cleaned = raw
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .trim();

    // Extract the first JSON object in the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      this.warn(npcId, 'Stage 3: no JSON object found in LLM response. Falling back to idle.');
      return idleAction('parse_failure');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      this.warn(npcId, 'Stage 3: JSON.parse failed. Falling back to idle.');
      return idleAction('parse_failure');
    }

    const result = NpcActionSchema.safeParse(parsed);
    if (!result.success) {
      this.warn(npcId, `Stage 3: Zod validation failed — ${result.error.issues[0]?.message ?? 'unknown'}. Falling back to idle.`);
      return idleAction('validation_failure');
    }

    return result.data as NpcAction;
  }

  // ── Stage 4: Validate ───────────────────────────────────────────────────────

  private async stageValidate(
    npcId: string,
    action: NpcAction,
  ): Promise<{ action: NpcAction; validated: boolean }> {
    let rpcResult: { valid: boolean; reason?: string };

    try {
      rpcResult = await this.clawlink.executeRpc<{ valid: boolean; reason?: string }>(
        'validate_npc_action',
        { npcId, action },
      );
    } catch (err) {
      // Node A unreachable — fail-open
      const msg = err instanceof Error ? err.message : String(err);
      this.warn(npcId, `Stage 4: Node A unreachable (${msg}). Allowing action through (fail-open).`);
      return { action, validated: false };
    }

    if (!rpcResult.valid) {
      const fallbackReason = rpcResult.reason ?? 'rejected_by_rules_vault';
      this.warn(npcId, `Stage 4: Node A rejected action — "${fallbackReason}". Falling back to idle.`);
      return { action: idleAction(fallbackReason), validated: false };
    }

    return { action, validated: true };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private warn(npcId: string, message: string): void {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      severity: 'WARN',
      context: CONTEXT,
      npcId,
      message,
    }));
  }
}
