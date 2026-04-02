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
  INitroLogicClient, IOllamaClient, IDiscordChroniclerClient, ScreamsheetPersona,
  AttackResult, DvResult, OracleResult,
  ResolveAttackParams, CalculateDvParams, OracleRollParams,
} from './interfaces.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';
import type { FoundryEvent, BuyItemEvent, ApprovalResponseEvent, RedTradeTransitEvent } from '../shared/schemas/foundry-bridge.schema.js';
import type { StoryEngine } from './story-engine.js';
import type { GmApprovalQueue } from './gm-approval-queue.js';
import type { NightMarketService } from './night-market-service.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { RedTradeService } from './red-trade-service.js';
import type { FrictionRollResult } from '../shared/schemas/red-trade.schema.js';
import type { SpatialVisionService } from './spatial-vision-service.js';
import { OnboardingController, type BuildType } from './onboarding-controller.js';

// ── Constructor options ───────────────────────────────────────────────────────

export interface HybridRoutingControllerOptions {
  readonly nitroLogicClient: INitroLogicClient;
  readonly ollamaClient: IOllamaClient;
  readonly foundryAdapter: IFoundryAdapter;
  readonly storyEngine: StoryEngine;
  readonly gmApprovalQueue: GmApprovalQueue;
  readonly nightMarketService: NightMarketService;
  readonly unifiedOracle: UnifiedOracleClient;
  readonly redTradeService: RedTradeService;
  readonly chronicler?: IDiscordChroniclerClient | undefined;
  readonly spatialVision?: SpatialVisionService | undefined;
  /** Optional — if omitted, /onboard will report the service as offline. */
  readonly onboardingEnabled?: boolean | undefined;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class HybridRoutingController {
  private readonly nitroLogic: INitroLogicClient;
  private readonly ollama: IOllamaClient;
  private readonly foundry: IFoundryAdapter;
  private readonly storyEngine: StoryEngine;
  private readonly gmApprovalQueue: GmApprovalQueue;
  private readonly nightMarketService: NightMarketService;
  private readonly unifiedOracle: UnifiedOracleClient;
  private readonly redTradeService: RedTradeService;
  private readonly chronicler: IDiscordChroniclerClient | undefined;
  private readonly spatialVision: SpatialVisionService | undefined;
  private readonly onboardingEnabled: boolean;

  constructor({ nitroLogicClient, ollamaClient, foundryAdapter, storyEngine, gmApprovalQueue, nightMarketService, unifiedOracle, redTradeService, chronicler, spatialVision, onboardingEnabled }: HybridRoutingControllerOptions) {
    this.nitroLogic = nitroLogicClient;
    this.ollama = ollamaClient;
    this.foundry = foundryAdapter;
    this.storyEngine = storyEngine;
    this.gmApprovalQueue = gmApprovalQueue;
    this.nightMarketService = nightMarketService;
    this.unifiedOracle = unifiedOracle;
    this.redTradeService = redTradeService;
    this.chronicler = chronicler;
    this.spatialVision = spatialVision;
    this.onboardingEnabled = onboardingEnabled ?? false;
  }

  // ── Main dispatcher ─────────────────────────────────────────────────────────

  async handleFoundryEvent(event: FoundryEvent): Promise<unknown> {
    switch (event.type) {
      case 'resolve_attack':
        return this.handleResolveAttack(event.payload, event.payload.spatial);
      case 'calculate_dv': {
        const p = event.payload;
        return this.handleCalculateDv({
          checkType: p.checkType,
          baseSkill: p.baseSkill,
          baseStat: p.baseStat,
          ...(p.rangeBand !== undefined ? { rangeBand: p.rangeBand } : {}),
          situationalModifiers: p.situationalModifiers,
          targetDifficulty: p.targetDifficulty,
        }, p.spatial);
      }
      case 'oracle_roll': {
        const p = event.payload;
        return this.handleOracleRoll({
          expression: p.expression,
          ...(p.context !== undefined ? { context: p.context } : {}),
          applyLuck: p.applyLuck,
          luckPoints: p.luckPoints,
        }, p.spatial);
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
      case 'red_trade_transit':
        return this.handleRedTradeTransit(event.payload);
      default: {
        // TypeScript exhaustiveness check
        const exhaustiveCheck: never = event;
        throw new Error(`HybridRoutingController: unknown event type '${(exhaustiveCheck as FoundryEvent).type}'`);
      }
    }
  }

  // ── resolve_attack ──────────────────────────────────────────────────────────

  private async handleResolveAttack(payload: ResolveAttackParams, spatial?: { sceneId: string, x: number, y: number }): Promise<AttackResult> {
    // Node A: deterministic math
    const result = await this.nitroLogic.resolveAttack(payload);

    // ── Immersion: Show 3D Dice (Foundry UI) ─────────────────────────────────
    // We show a 1d10 for the attack roll result
    await this.foundry.show3dDice('1d10', result.rollTotal);

    // Node B: narrative synthesis (non-fatal if Ollama is down)
    const context = `hit=${result.hit}, rollTotal=${result.rollTotal}, dvTarget=${result.dvTarget}, rawDamage=${result.rawDamage}, netDamage=${result.netDamage}, criticalInjury=${result.criticalInjury}`;
    await this.pushNarrativeOrFallback(
      'Narrate the outcome of this Cyberpunk RED attack roll in 2-3 sentences.',
      context,
      this.formatAttackFallback(result),
      spatial,
    );

    // ── State Reconciliation Hook ────────────────────────────────────────────
    // If we have a targetId and it was a hit, update the Oracle RKG
    if (payload.targetId && result.hit && result.netDamage > 0) {
      try {
        const [current] = this.unifiedOracle.query('SELECT hp FROM npcs WHERE id = ?', [payload.targetId]);
        if (current) {
          const newHp = Math.max(0, current.hp - result.netDamage);
          await this.unifiedOracle.executeCommand({
            action: 'UPDATE_NPC',
            target: payload.targetId,
            data: { hp: newHp }
          });
        }
      } catch (err) {
        console.warn(`[HRC] Failed to reconcile damage for target ${payload.targetId}:`, err);
      }
    }

    // Evaluate Story Transitions
    this.evaluateStoryEvent({ type: 'resolve_attack', result });

    return result;
  }

  // ── calculate_dv ────────────────────────────────────────────────────────────

  private async handleCalculateDv(payload: CalculateDvParams, spatial?: { sceneId: string, x: number, y: number }): Promise<DvResult> {
    const result = await this.nitroLogic.calculateDv(payload);

    const summary = `**DV Calculation** — Target DV: **${result.dv}**\n${result.breakdown}`;
    await this.foundry.sendChatMessage(summary, { alias: 'nitro-logic' });

    return result;
  }

  // ── oracle_roll ─────────────────────────────────────────────────────────────

  private async handleOracleRoll(payload: OracleRollParams, spatial?: { sceneId: string, x: number, y: number }): Promise<OracleResult> {
    const result = await this.nitroLogic.oracleRoll(payload);

    // ── Immersion: Show 3D Dice (Foundry UI) ─────────────────────────────────
    // We show a 1d10 for the oracle roll result
    await this.foundry.show3dDice('1d10', result.result);

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

    // 3. ── State Reconciliation Hook ──────────────────────────────────────────
    // Synchronize ownership to the SQLite Oracle RKG
    try {
      await this.unifiedOracle.executeCommand({
        action: 'TRANSFER_ITEM',
        itemId: itemId,
        fromId: vendor,
        toId: actorId
      });
    } catch (err) {
      // Fallback if item wasn't in structured inventory: use ADD_LORE
      try {
        await this.unifiedOracle.executeCommand({
          action: 'ADD_LORE',
          subject: itemId,
          predicate: 'owned_by',
          object: actorId
        });
      } catch (innerErr) {
        console.warn(`[HRC] Failed to reconcile item ownership for ${itemId}:`, innerErr);
      }
    }

    // 4. Narrative Synthesis
    const context = `vendor=${vendor}, item=${itemId}, costEb=${costEb}, newBalance=${newEb}`;
    await this.pushNarrativeOrFallback(
      'Narrate a short transaction in a Cyberpunk night market.',
      context,
      `You purchased an item from ${vendor} for ${costEb}eb. Remaining balance: ${newEb}eb.`,
    );

    // 4. Chronicle the transaction
    this.postScreamsheet(
      `🛒 **Night Market Transaction** — ${itemId} acquired from ${vendor} for ${costEb}eb. New balance: ${newEb}eb.`,
      'NCPD Scanner',
    );

    // 5. Evaluate Story Transitions
    this.evaluateStoryEvent({ type: 'buy_item', payload });
  }

  // ── red_trade_transit ───────────────────────────────────────────────────────

  private async handleRedTradeTransit(payload: RedTradeTransitEvent['payload']): Promise<FrictionRollResult> {
    const result = this.redTradeService.rollFriction(payload.currentFriction);

    const messages: Record<string, string> = {
      bark:   `🌆 *The streets feel tense...* Heat: ${result.total} (${result.roll} + ${result.friction})`,
      gate:   `⚠️ **Decision Gate** — Heat rising. Roll: ${result.total} (${result.roll} + ${result.friction})`,
      ambush: `🔴 **RIVAL INTERVENTION** — Ambush! Roll: ${result.total} (${result.roll} + ${result.friction})`,
    };

    await this.foundry.sendChatMessage(messages[result.outcome] || `🌆 *Streets of Night City:* ${result.outcome}`, { alias: 'Friction Engine' });

    // Chronicle high-tension outcomes
    if (result.outcome === 'ambush' || result.outcome === 'gate') {
      this.postScreamsheet(
        `⚠️ **Red Trade Alert** — ${result.outcome === 'ambush' ? 'Rival crew spotted on transit route!' : 'Checkpoint decision gate triggered.'} Heat: ${result.total}`,
        'NCPD Scanner',
      );
    }

    // Evaluate Story Transitions — first transit tick advances Beat 1 → Beat 2
    this.evaluateStoryEvent({ type: 'red_trade_transit', payload });

    return result;
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
      this.postScreamsheet(
        `📡 **Street Wire** — Sources confirm a shift in Night City's balance of power. The arc moves forward.`,
        'Street Rumor',
      );
    }
  }

  // ── /scan command ───────────────────────────────────────────────────────────

  /**
   * Orchestrate the Optical Bridge pipeline:
   *   Playwright capture → Llava analysis → RKG grounding → Foundry chat output.
   *
   * Called by the `/scan` Z-Command in Crush CLI or directly by the player.
   * Non-fatal if SpatialVisionService is not configured.
   */
  async handleScan(): Promise<void> {
    if (!this.spatialVision) {
      await this.foundry.sendChatMessage(
        '⚠️ **Optical Bridge offline.** No SpatialVisionService configured.',
        { alias: 'Optical Bridge' },
      );
      return;
    }

    // Step 1: Playwright → Llava
    const visual = await this.spatialVision.captureAndAnalyze();

    // Step 2: RKG grounding — inject faction/NPC context from the Oracle
    const visualSummary =
      `Tokens: ${visual.tokenClusters.join(', ') || 'none detected'}. ` +
      `Environment: ${visual.environmentalFeatures.join(', ') || 'none detected'}.`;

    const groundedContext = await this.applyWorldPulseGrounding(visualSummary);

    // Step 3: Mistral-Nemo narrates the tactical beat
    const prompt =
      'You are a Cyberpunk RED GM. Describe the tactical situation on the battle map ' +
      'in 2–3 vivid sentences using the visual data and grounded world context below.';

    let narrative: string;
    try {
      narrative = await this.ollama.generateNarrative(prompt, visualSummary, groundedContext);
    } catch {
      narrative = `**Tactical Scan** — ${visual.rawDescription || visualSummary}`;
    }

    // Step 4: Push to Foundry chat
    await this.foundry.sendChatMessage(narrative, { alias: 'Optical Bridge' });
  }

  // ── /onboard command ────────────────────────────────────────────────────────

  /**
   * Run the full Fixer Interview pipeline and materialize a new Foundry Actor.
   *
   * Called by the `/onboard` Z-Command in Crush CLI.
   *
   * Flow:
   *   OnboardingController (state machine)
   *     → nitro-logic (Lifepath 1d10 rolls)
   *     → Mistral-Nemo (interview dialogue)
   *     → UnifiedOracleClient (NPC persistence)
   *     → FoundryAdapter.createActor()
   *     → Discord Chronicler (Street Rumor broadcast)
   */
  async handleOnboard(
    playerName: string,
    role: string,
    buildType: BuildType = 'Standard',
  ): Promise<void> {
    if (!this.onboardingEnabled) {
      await this.foundry.sendChatMessage(
        '⚠️ **Onboarding offline.** Enable via `onboardingEnabled: true` in HRC options.',
        { alias: 'Fixer Interview' },
      );
      return;
    }

    // Step 1: Create a fresh session for this player
    const controller = new OnboardingController({
      nitroLogicClient: this.nitroLogic,
      ollamaClient:     this.ollama,
      unifiedOracle:    this.unifiedOracle,
    });

    await this.foundry.sendChatMessage(
      `📋 **Fixer Interview started for ${playerName}** — Role: ${role}, Build: ${buildType}`,
      { alias: 'Fixer Interview' },
    );

    // Step 2: INITIAL → VIBE_CHECK → LIFEPATH
    await controller.startInterview();
    await controller.advanceToLifepath();

    // Step 3: Roll all Lifepath tables + generate dialogue
    const lifepath = await controller.rollLifepath();

    await this.foundry.sendChatMessage(
      [
        `**Lifepath Report — ${playerName}**`,
        `> Background: ${lifepath.familyBackground}`,
        `> Tragedy: ${lifepath.familyTragedy}`,
        `> Ally: ${lifepath.friend} | Enemy: ${lifepath.enemy}`,
        `> *"${lifepath.dialogue}"*`,
      ].join('\n'),
      { alias: lifepath.interviewNPC },
    );

    // Step 4: LIFEPATH → STATS → REVIEW → FINALIZED
    const statsResult = await controller.setStats(buildType);
    const session     = await controller.finalizeCharacter();

    // Step 5: Build the actor bio from the lifepath narrative
    const bio =
      `Background: ${lifepath.familyBackground}. ${lifepath.familyTragedy}. ` +
      `Known allies: ${lifepath.friend}. Known enemies: ${lifepath.enemy}. ` +
      `Interview: ${lifepath.dialogue}`;

    // Step 6: Materialize in Foundry VTT
    const { actorId } = await this.foundry.createActor({
      name:  playerName,
      role,
      stats: statsResult.stats as unknown as Record<string, number>,
      bio,
      seedItems: [],   // Gear seeding deferred to GM approval flow post-creation
    });

    await this.foundry.sendChatMessage(
      `✅ **${playerName}** created in Foundry (${role}, ${buildType}). Actor ID: \`${actorId}\``,
      { alias: 'Fixer Interview' },
    );

    // Step 7: Chronicle the new edgerunner
    this.postScreamsheet(
      `📡 **Street Wire** — New face in Night City. ${playerName}, ${role}. Background: ${lifepath.familyBackground}. Watch this one.`,
      'Street Rumor',
    );

    void session; // session data available for caller inspection if needed
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Attempts to generate and push Ollama narrative prose.
   * Falls back to a plain-text summary on OllamaClient failure.
   * Never throws — Immersion Mandate: Foundry chat must always receive something.
   */
  private async pushNarrativeOrFallback(prompt: string, context: string, fallback: string, spatial?: { sceneId: string, x: number, y: number }): Promise<void> {
    let narrative: string;
    try {
      // ── Step 1: World Pulse Grounding ──────────────────────────────────────
      const systemContext = await this.applyWorldPulseGrounding(prompt + ' ' + context, spatial);

      narrative = await this.ollama.generateNarrative(prompt, context, systemContext);
    } catch {
      narrative = fallback;
    }
    await this.foundry.sendChatMessage(narrative, { alias: 'GM Assistant' });
  }

  /**
   * Scours the prompt for NPC/Location mentions and fetches their current
   * state from the Unified Oracle (RKG) + recent history from Crush.
   * Also fetches tactical regions within proximity if spatial context is provided.
   */
  private async applyWorldPulseGrounding(input: string, spatial?: { sceneId: string, x: number, y: number }): Promise<string | undefined> {
    if (!this.unifiedOracle?.isConnected()) return undefined;

    try {
      let pulse = 'WORLD PULSE (GROUNDED TRUTH):\n';
      let hasGrounding = false;

      // 1. NPC Mentions Grounding
      const npcs = this.unifiedOracle.query('SELECT name, hp, faction, disposition FROM npcs', []);
      const mentions = npcs.filter((n: any) => input.toLowerCase().includes(n.name.toLowerCase()));

      if (mentions.length > 0) {
        hasGrounding = true;
        for (const npc of mentions) {
          pulse += `- ${npc.name}: HP=${npc.hp}, Faction=${npc.faction}, Stance=${npc.disposition}\n`;
          
          const history = this.unifiedOracle.query(
            'SELECT content FROM session_memory.messages WHERE content LIKE ? ORDER BY id DESC LIMIT 1',
            [`%${npc.name}%`]
          );
          if (history.length > 0) {
            pulse += `  Context: "${history[0].content.substring(0, 100)}..."\n`;
          }
        }
      }

      // 2. Spatial Tactical Grounding (Phase 6)
      if (spatial) {
        // Query regions in the current scene. 
        // Note: Distance check uses normalized 0-1000 coordinates. 10% radius = 100 units.
        const regions = this.unifiedOracle.query(
          `SELECT category, label FROM scene_regions 
           WHERE scene_id = ? 
           AND (ABS(json_extract(bounds_json, '$[1]') + json_extract(bounds_json, '$[3]'))/2 - ?) < 100
           AND (ABS(json_extract(bounds_json, '$[0]') + json_extract(bounds_json, '$[2]'))/2 - ?) < 100`,
          [spatial.sceneId, spatial.x, spatial.y]
        );

        if (regions.length > 0) {
          hasGrounding = true;
          pulse += 'TACTICAL REGIONS IN PROXIMITY:\n';
          for (const reg of regions) {
            pulse += `- ${reg.label} (${reg.category.replace('_', ' ')})\n`;
          }
        }
      }

      return hasGrounding ? pulse : undefined;
    } catch (err) {
      console.warn('World Pulse grounding failed:', err);
      return undefined;
    }
  }

  /**
   * Fire-and-forget Screamsheet broadcast. Never throws — the Chronicler is
   * a non-critical subsystem that must not interrupt the main loop.
   */
  private postScreamsheet(content: string, persona: ScreamsheetPersona): void {
    if (!this.chronicler) return;
    this.chronicler.screamsheetPost(content, persona).catch((err: unknown) => {
      console.warn('[HRC] Chronicler post failed:', err);
    });
  }

  private formatAttackFallback(result: AttackResult): string {
    const hitLabel = result.hit ? '✅ HIT' : '❌ MISS';
    const critSuffix = result.criticalInjury ? ' ⚠️ CRITICAL INJURY' : '';
    return `**Attack Roll** — ${hitLabel}${critSuffix} | Roll: ${result.rollTotal} vs DV ${result.dvTarget} | Damage: ${result.netDamage} net`;
  }
}
