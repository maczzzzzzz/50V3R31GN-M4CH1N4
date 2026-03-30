/**
 * src/core/hybrid-routing-controller.ts
 *
 * HybridRoutingController — Phase 3 Orchestration Loop
 *
 * The central dispatcher that implements the Split-Node routing contract:
 *
 *   Foundry VTT event
 *       │
 *       ▼
 *   HybridRoutingController.handleFoundryEvent()
 *       │
 *       ├─ Math/Rules events (resolve_attack, calculate_dv, oracle_roll)
 *       │     → NitroLogicClient (Node A: Llama-3.2-3B, deterministic)
 *       │     → OllamaClient (Node B: Mistral-Nemo 12B, narrative prose)
 *       │     → FoundryAdapter.sendChatMessage() (push to Foundry chat)
 *       │
 *       └─ Data events (read_actor)
 *             → FoundryAdapter.readActor() (direct Foundry query)
 *             → return raw actor data (no narrative synthesis needed)
 *
 * Error handling strategy:
 *   - NitroLogicClient errors propagate (caller must handle Node A failures)
 *   - OllamaClient errors are caught: a fallback plain-text summary is pushed
 *     to Foundry chat instead (Immersion Mandate: never leave Foundry silent)
 */

import type {
  INitroLogicClient, IOllamaClient,
  AttackResult, DvResult, OracleResult,
  ResolveAttackParams, CalculateDvParams, OracleRollParams,
} from './interfaces.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';
import type { FoundryEvent } from '../shared/schemas/foundry-bridge.schema.js';

// ── Constructor options ───────────────────────────────────────────────────────

export interface HybridRoutingControllerOptions {
  readonly nitroLogicClient: INitroLogicClient;
  readonly ollamaClient: IOllamaClient;
  readonly foundryAdapter: IFoundryAdapter;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class HybridRoutingController {
  private readonly nitroLogic: INitroLogicClient;
  private readonly ollama: IOllamaClient;
  private readonly foundry: IFoundryAdapter;

  constructor({ nitroLogicClient, ollamaClient, foundryAdapter }: HybridRoutingControllerOptions) {
    this.nitroLogic = nitroLogicClient;
    this.ollama = ollamaClient;
    this.foundry = foundryAdapter;
  }

  // ── Main dispatcher ─────────────────────────────────────────────────────────

  async handleFoundryEvent(event: FoundryEvent): Promise<unknown> {
    switch (event.type) {
      case 'resolve_attack':
        return this.handleResolveAttack(event.payload);
      case 'calculate_dv': {
        const p = event.payload;
        return this.handleCalculateDv({
          checkType: p.checkType,
          baseSkill: p.baseSkill,
          baseStat: p.baseStat,
          ...(p.rangeBand !== undefined ? { rangeBand: p.rangeBand } : {}),
          situationalModifiers: p.situationalModifiers,
          targetDifficulty: p.targetDifficulty,
        });
      }
      case 'oracle_roll': {
        const p = event.payload;
        return this.handleOracleRoll({
          expression: p.expression,
          ...(p.context !== undefined ? { context: p.context } : {}),
          applyLuck: p.applyLuck,
          luckPoints: p.luckPoints,
        });
      }
      case 'read_actor':
        return this.foundry.readActor(event.payload.actorId);
      default: {
        // TypeScript exhaustiveness check
        const exhaustiveCheck: never = event;
        throw new Error(`HybridRoutingController: unknown event type '${(exhaustiveCheck as FoundryEvent).type}'`);
      }
    }
  }

  // ── resolve_attack ──────────────────────────────────────────────────────────

  private async handleResolveAttack(payload: ResolveAttackParams): Promise<AttackResult> {
    // Node A: deterministic math
    const result = await this.nitroLogic.resolveAttack(payload);

    // Node B: narrative synthesis (non-fatal if Ollama is down)
    const context = `hit=${result.hit}, rollTotal=${result.rollTotal}, dvTarget=${result.dvTarget}, rawDamage=${result.rawDamage}, netDamage=${result.netDamage}, criticalInjury=${result.criticalInjury}`;
    await this.pushNarrativeOrFallback(
      'Narrate the outcome of this Cyberpunk RED attack roll in 2-3 sentences.',
      context,
      this.formatAttackFallback(result),
    );

    return result;
  }

  // ── calculate_dv ────────────────────────────────────────────────────────────

  private async handleCalculateDv(payload: CalculateDvParams): Promise<DvResult> {
    const result = await this.nitroLogic.calculateDv(payload);

    const summary = `**DV Calculation** — Target DV: **${result.dv}**\n${result.breakdown}`;
    await this.foundry.sendChatMessage(summary, { alias: 'nitro-logic' });

    return result;
  }

  // ── oracle_roll ─────────────────────────────────────────────────────────────

  private async handleOracleRoll(payload: OracleRollParams): Promise<OracleResult> {
    const result = await this.nitroLogic.oracleRoll(payload);

    const label = result.isCriticalSuccess
      ? '🎲 **CRITICAL SUCCESS**'
      : result.isCriticalFailure && result.luckyReroll === null
        ? '💀 **CRITICAL FAILURE**'
        : result.luckyReroll !== null
          ? `🍀 **LUCKY REROLL** (${result.luckyReroll})`
          : `🎲 **${result.result}**`;

    const summary = `**Oracle Roll** — ${label}`;
    await this.foundry.sendChatMessage(summary, { alias: 'nitro-logic' });

    return result;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Attempts to generate and push Ollama narrative prose.
   * Falls back to a plain-text summary on OllamaClient failure.
   * Never throws — Immersion Mandate: Foundry chat must always receive something.
   */
  private async pushNarrativeOrFallback(prompt: string, context: string, fallback: string): Promise<void> {
    let narrative: string;
    try {
      narrative = await this.ollama.generateNarrative(prompt, context);
    } catch {
      narrative = fallback;
    }
    await this.foundry.sendChatMessage(narrative, { alias: 'GM Assistant' });
  }

  private formatAttackFallback(result: AttackResult): string {
    const hitLabel = result.hit ? '✅ HIT' : '❌ MISS';
    const critSuffix = result.criticalInjury ? ' ⚠️ CRITICAL INJURY' : '';
    return `**Attack Roll** — ${hitLabel}${critSuffix} | Roll: ${result.rollTotal} vs DV ${result.dvTarget} | Damage: ${result.netDamage} net`;
  }
}
