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
import type { FoundryEvent, BuyItemEvent, ApprovalResponseEvent } from '../shared/schemas/foundry-bridge.schema.js';
import type { StoryEngine } from './story-engine.js';
import type { GmApprovalQueue } from './gm-approval-queue.js';
import type { NightMarketService } from './night-market-service.js';

// ── Constructor options ───────────────────────────────────────────────────────

export interface HybridRoutingControllerOptions {
  readonly nitroLogicClient: INitroLogicClient;
  readonly ollamaClient: IOllamaClient;
  readonly foundryAdapter: IFoundryAdapter;
  readonly storyEngine: StoryEngine;
  readonly gmApprovalQueue: GmApprovalQueue;
  readonly nightMarketService: NightMarketService;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class HybridRoutingController {
  private readonly nitroLogic: INitroLogicClient;
  private readonly ollama: IOllamaClient;
  private readonly foundry: IFoundryAdapter;
  private readonly storyEngine: StoryEngine;
  private readonly gmApprovalQueue: GmApprovalQueue;
  private readonly nightMarketService: NightMarketService;

  constructor({ nitroLogicClient, ollamaClient, foundryAdapter, storyEngine, gmApprovalQueue, nightMarketService }: HybridRoutingControllerOptions) {
    this.nitroLogic = nitroLogicClient;
    this.ollama = ollamaClient;
    this.foundry = foundryAdapter;
    this.storyEngine = storyEngine;
    this.gmApprovalQueue = gmApprovalQueue;
    this.nightMarketService = nightMarketService;
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
      case 'buy_item':
        return this.handleBuyItem(event.payload);
      case 'approval_response':
        return this.gmApprovalQueue.handleResponse(
          event.payload.proposalId,
          event.payload.status,
          event.payload.editedData,
        );
      case 'open_night_market':
        return this.handleOpenNightMarket(event.payload.actorId, event.payload.vendorName);
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

    // Evaluate Story Transitions
    this.evaluateStoryEvent({ type: 'resolve_attack', result });

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

    // Evaluate Story Transitions
    this.evaluateStoryEvent({ type: 'oracle_roll', result });

    return result;
  }

  // ── handle_buy_item ─────────────────────────────────────────────────────────

  private async handleBuyItem(payload: BuyItemEvent['payload']): Promise<void> {
    const { actorId, costEb, itemId, vendor } = payload;

    // 1. Validate Funds
    const actorData = await this.foundry.readActor(actorId) as any;
    const currentEb = actorData?.system?.wealth?.eb ?? 0;

    if (currentEb < costEb) {
      await this.foundry.sendChatMessage(`❌ **Transaction Failed**: Insufficient funds (Current: ${currentEb}eb, Need: ${costEb}eb).`, { alias: vendor });
      return;
    }

    // 2. Deduct Funds
    const newEb = currentEb - costEb;
    await this.foundry.updateActor(actorId, { 'system.wealth.eb': newEb });

    // 3. Narrative Synthesis
    const context = `vendor=${vendor}, item=${itemId}, costEb=${costEb}, newBalance=${newEb}`;
    await this.pushNarrativeOrFallback(
      'Narrate a short transaction in a Cyberpunk night market.',
      context,
      `You purchased an item from ${vendor} for ${costEb}eb. Remaining balance: ${newEb}eb.`,
    );

    // 4. Evaluate Story Transitions
    this.evaluateStoryEvent({ type: 'buy_item', payload });
  }

  // ── open_night_market ───────────────────────────────────────────────────────

  private async handleOpenNightMarket(actorId: string, vendorName: string): Promise<void> {
    const items = await this.nightMarketService.getVendorInventory(vendorName);
    await this.foundry.openNightMarket(actorId, vendorName, items);
  }

  private evaluateStoryEvent(event: any): void {
    const result = this.storyEngine.evaluateEvent(event);
    if (result.transitioned) {
      const narrative = `**Story Advance** — Transitioned from *${result.oldBeat}* to *${result.newBeat}*.`;
      this.foundry.sendChatMessage(narrative, { alias: 'Story Engine' }).catch(() => {});
    }
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
