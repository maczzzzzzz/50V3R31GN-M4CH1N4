/**
 * src/core/hybrid-routing-controller.ts
 *
 * HybridRoutingController — Phase 3 Orchestration Loop
 */

import type {
  INitroLogicClient, ISovereignNarrativeClient, 
  AttackResult, DvResult, OracleResult,
  ResolveAttackParams, CalculateDvParams, OracleRollParams, IArchitectService,
} from './interfaces.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';
import type { FoundryEvent, BuyItemEvent, ApprovalResponseEvent, RedTradeTransitEvent, NpcTurnEvent } from '../shared/schemas/foundry-bridge.schema.js';
import type { TurnDaemon, TurnResult } from './turn-daemon.js';
import type { StoryEngine } from './story-engine.js';
import type { GmApprovalQueue } from './gm-approval-queue.js';
import type { NightMarketService } from './night-market-service.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { RedTradeService } from './red-trade-service.js';
import type { FrictionRollResult } from '../shared/schemas/red-trade.schema.js';
import { SpatialVisionService } from './spatial-vision-service.js';
import { VisualMonitorService } from './visual-monitor-service.js';
import { SharedMemoryService } from './shared-memory-service.js';
import { TaskRouterProxy } from './task-router-proxy.js';

import { 
  OnboardingController, type BuildType 
} from './onboarding-controller.js';
import { RulesGrepService } from './rules-grep-service.js';
import { MissionSwarmOrchestrator } from './mission-swarm-orchestrator.js';
import { SteganographyService } from './steganography-service.js';
import { AkashikVisualAuditor } from './akashik-visual-auditor.js';
import { VsbClient } from '../api/vsb-client.js';
import type { IClawLinkClient } from '../api/clawlink-client.js';
import type { SovereignProfile } from './interfaces.js';
import fs from 'node:fs';
import path from 'node:path';

import { randomUUID } from 'node:crypto';
import { SovereignJudge } from './sovereign-judge.js';
import type { ILogger } from '../db/interfaces.js';

// ── Constructor options ───────────────────────────────────────────────────────

export interface HybridRoutingControllerOptions {
  readonly nitroLogicClient: INitroLogicClient;
  readonly vsbClient?: VsbClient | undefined;
  readonly sovereignNarrativeClient: ISovereignNarrativeClient;
  readonly foundryAdapter: IFoundryAdapter;
  readonly storyEngine: StoryEngine;
  readonly gmApprovalQueue: GmApprovalQueue;
  readonly nightMarketService: NightMarketService;
  readonly unifiedOracle: UnifiedOracleClient;
  readonly redTradeService: RedTradeService;
  readonly spatialVision?: SpatialVisionService | undefined;
  readonly visualMonitor?: VisualMonitorService | undefined;
  readonly neuralUplink?: VisualMonitorService | undefined;
  readonly architect?: IArchitectService | undefined;
  readonly onboardingEnabled?: boolean | undefined;

  readonly clawlinkClient?: IClawLinkClient | undefined;
  readonly sharedMemoryService?: SharedMemoryService | undefined;
  readonly missionSwarm?: MissionSwarmOrchestrator | undefined;
  readonly turnDaemon?: TurnDaemon | undefined;
  readonly auditor?: AkashikVisualAuditor | undefined;
  readonly logger?: ILogger | undefined | undefined;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class HybridRoutingController {
  private readonly nitroLogic: INitroLogicClient;
  private readonly sovereignNarrative: ISovereignNarrativeClient;
  private readonly foundry: IFoundryAdapter;
  private readonly clawlink: IClawLinkClient | undefined;
  private readonly storyEngine: StoryEngine;
  private readonly gmApprovalQueue: GmApprovalQueue;
  private readonly nightMarketService: NightMarketService;
  private readonly unifiedOracle: UnifiedOracleClient;
  private readonly redTradeService: RedTradeService;
  private readonly spatialVision: SpatialVisionService | undefined;
  private readonly visualMonitor: VisualMonitorService | undefined;
  private readonly neuralUplink: VisualMonitorService | undefined;
  private readonly architect: IArchitectService | undefined;
  private readonly onboardingEnabled: boolean;
  private readonly sharedMemory: SharedMemoryService | undefined;
  private readonly missionSwarm: MissionSwarmOrchestrator | undefined;
  private readonly turnDaemon: TurnDaemon | undefined;
  private readonly steganographyService: SteganographyService;
  private readonly taskRouter: TaskRouterProxy;
  private readonly vsb: VsbClient | undefined;
  private readonly auditor: AkashikVisualAuditor | undefined;
  private readonly sovereignJudge: SovereignJudge;
  private readonly logger?: ILogger | undefined;

  private activeProfile: SovereignProfile = 'SOVEREIGN_OS';
  private readonly redRulesConstitution: string;
  private readonly rulesGrep: RulesGrepService;

  constructor(options: HybridRoutingControllerOptions) {
    this.nitroLogic = options.nitroLogicClient;
    this.vsb = options.vsbClient;
    this.clawlink = options.clawlinkClient;
    this.sovereignNarrative = options.sovereignNarrativeClient;
    this.foundry = options.foundryAdapter;
    this.storyEngine = options.storyEngine;
    this.gmApprovalQueue = options.gmApprovalQueue;
    this.nightMarketService = options.nightMarketService;
    this.unifiedOracle = options.unifiedOracle;
    this.redTradeService = options.redTradeService;
    this.spatialVision = options.spatialVision;
    this.visualMonitor = options.visualMonitor;
    this.neuralUplink = options.neuralUplink ?? options.visualMonitor;
    this.architect = options.architect;
    this.onboardingEnabled = options.onboardingEnabled ?? false;
    this.sharedMemory = options.sharedMemoryService;
    this.missionSwarm = options.missionSwarm;
    this.turnDaemon = options.turnDaemon;
    this.steganographyService = new SteganographyService();
    this.taskRouter = new TaskRouterProxy();
    this.auditor = options.auditor;
    this.logger = options.logger;

    this.sovereignJudge = new SovereignJudge({
      nitroLogicClient: this.nitroLogic,
      sovereignNarrativeClient: this.sovereignNarrative,
      oracle: this.unifiedOracle,
      ...(this.clawlink !== undefined ? { clawlinkClient: this.clawlink } : {}),
      foundryAdapter: this.foundry,
    });

    this.rulesGrep = new RulesGrepService();
    try {
      this.redRulesConstitution = fs.readFileSync('plugins/sovereign-red-plugin/RED_RULES.md', 'utf8');
    } catch {
      this.redRulesConstitution = 'Rules Constitution Missing.';
    }

    // Initialize profile to OS mode
    this.setProfile('SOVEREIGN_OS');

    // ── Vitalik's 2-of-2 Authorization Model (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS) ───────────────────────
    if (this.unifiedOracle) {
      this.unifiedOracle.onAuthorize = async (commands) => {
        const traceId = randomUUID();
        this.logger?.info('HRC', traceId, 'AUTHORIZATION REQUIRED: Flush Gate Transaction Proposed', { commands });
        
        // If in an automated test environment, we auto-ACK
        if (process.env.NODE_ENV === 'test') return true;

        if (!this.sharedMemory) {
          this.logger?.warn('HRC', traceId, 'VSB SharedMemory not available. Auto-ACKing.');
          return true;
        }

        const proposalId = Math.floor(Math.random() * 1000000) + 1;
        const payload = commands.map(c => c.action).join(', ');
        this.sharedMemory.writeProposal(proposalId, 1, 0, payload);

        // Polling for ACK
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            const { id, status } = this.sharedMemory!.checkProposalStatus();
            if (id === proposalId || id === 0) {
              if (status === 1) { // StatusApproved
                clearInterval(interval);
                this.logger?.info('HRC', traceId, `Transaction ${proposalId} APPROVED via Mmap`);
                resolve(true);
              } else if (status === 2) { // StatusRejected
                clearInterval(interval);
                this.logger?.warn('HRC', traceId, `Transaction ${proposalId} REJECTED via Mmap`);
                resolve(false);
              }
            }
          }, 100);
        });
      };
    }

    // Unified Restore (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS): Automatically restore world-state on boot
    this.restoreSystemState().catch(err => {
      this.logger?.warn('HRC', 'restore', `System state auto-restore failed: ${err.message}`);
    });
  }

  public setProfile(profile: SovereignProfile): void {
    this.activeProfile = profile;
    if (typeof this.sovereignNarrative.setProfile === 'function') {
      this.sovereignNarrative.setProfile(profile);
    }
    this.sovereignJudge.setProfile(profile);
    this.logger?.info('HRC', 'profile', `Profile switched to: ${profile}`);
  }

  /**
   * Sovereign Highway (Phase 25): Fast-path for mechanical validation.
   */
  async validateMechanicalIntent(
    payload: string,
    actorIdHex: string = '00'.repeat(16),
    sessionIdHex: string = '00'.repeat(16)
  ): Promise<{ valid: boolean; code: number } | null> {
    if (!this.vsb) return null;
    const traceId = randomUUID();

    try {
      const sequenceId = Math.floor(Math.random() * 65535);
      const session = new Uint8Array(16);
      const actor = new Uint8Array(16);
      const payloadBuf = new Uint8Array(256);
      Buffer.from(payload.slice(0, 256)).copy(payloadBuf);

      const result = await this.vsb.sendSkillCheck(sequenceId, session, actor, payloadBuf);
      return {
        valid: result.status === 0,
        code: result.resultCode
      };
    } catch (err) {
      this.logger?.warn('HRC', traceId, `VSB fast-path failed, falling back to HTTP: ${(err as Error).message}`);
      return null;
    }
  }

  async evaluateIntentSwarm(context: string): Promise<{ tone: string, intensity: number }> {
    const traceId = randomUUID();
    this.logger?.debug('HRC', traceId, 'Evaluating Intent Swarm', { contextSnippet: context.slice(0, 100) });
    // Use TaskRouterProxy to dispatch concurrently
    const [toneTask, intensityTask] = await Promise.all([
      this.taskRouter.dispatch({ destination: 'NodeB', cost: 'HEAVY' }, async () => {
        return this.sovereignNarrative.generateNarrative('Determine emotional tone (1 word) of:', context, undefined, undefined, 0.7, 0.9);
      }),
      this.taskRouter.dispatch({ destination: 'NodeA', cost: 'LIGHT' }, async () => {
        const response = await this.nitroLogic.calculateDv({ checkType: 'skill', baseStat: 8, baseSkill: 6, targetDifficulty: 'professional', situationalModifiers: 0 });
        return response.dv > 15 ? 0.8 : 0.2; // Derived scalar
      })
    ]);
    
    return { tone: toneTask as string, intensity: intensityTask as number };
  }

  /** 
   * Reads system_state from Akashik.db and dispatches restoration commands.
   */
  private async restoreSystemState(): Promise<void> {
    if (!this.unifiedOracle?.isConnected()) return;
    
    const rows = this.unifiedOracle.query('SELECT value FROM system_state WHERE key = ?', ['last_active_scene']) as Array<{ value: string }>;
    if (rows.length > 0 && rows[0]?.value !== 'null') {
      const sceneId = rows[0]?.value;
      if (!sceneId) return;
      this.logger?.info('HRC', 'restore', `Found last active scene: ${sceneId}. Restoring...`);
      
      // We wrap in a short timeout to ensure all WebSocket/CDP links are primed
      setTimeout(async () => {
        try {
          await this.foundry.activateScene(sceneId);
          if (this.neuralUplink?.isConnected()) {
            await this.neuralUplink.restoreAtmosphere(sceneId);
          }
        } catch (err) {
          this.logger?.warn('HRC', 'restore', `Scene ${sceneId} restoration failed: ${(err as Error).message}`);
        }
      }, 3000);
    }
  }

  // ── Main dispatcher ─────────────────────────────────────────────────────────

  async handleFoundryEvent(event: any): Promise<unknown> {
    const traceId = randomUUID();
    const { type, payload } = event;
    this.logger?.debug('HRC', traceId, `Handling Foundry Event: ${type}`, { payload });

    if (type === 'audit_request') {
      return this.handleAuditRequest(event);
    }

    if (type === 'validate_move') {
      return this.handleMoveValidation(event);
    }

    switch (type as string) {
      case 'resolve_attack':
        return this.handleResolveAttack(payload, payload.spatial);
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
      case 'capabilities_update': {
        const p = event.payload;
        if (this.sharedMemory) {
          this.sharedMemory.writeCapabilities(p.actorId, p.capabilities);
        }
        return;
      }
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
      case 'hoverVendor':
        // Phase 40: Hovering over a vendor triggers the Night Market HUD
        return this.handleOpenNightMarket(event.payload.actorId, event.payload.vendorName);
      case 'red_trade_transit':
        return this.handleRedTradeTransit(event.payload);
      case 'generate_mission': {
        if (this.missionSwarm) {
          const district = (event.payload as { district?: string }).district ?? 'Watson';
          const blueprint = await this.missionSwarm.generateMission(district);
          await this.foundry.sendChatMessage(
            `🎯 **Mission Brief — ${blueprint.district}**\n` +
            `**Intel:** ${JSON.stringify(blueprint.rulesIntel)}\n` +
            `**Tactics:** ${blueprint.tacticalAnalysis}\n` +
            `**Lore Anchors:** ${blueprint.loreAnchors.join(', ') || 'None'}`,
          );
        }
        return;
      }
      case 'scene_activate': {
        const sceneId = (event.payload as { sceneId?: string }).sceneId;
        if (this.neuralUplink?.isConnected() && sceneId) {
          await this.neuralUplink.restoreAtmosphere(sceneId).catch((err: Error) => {
            this.logger?.warn('HRC', traceId, `Atmosphere restore failed for ${sceneId}: ${err.message}`);
          });
          // Phase 16: Clear stale perception data and trigger Falcon reground
          if (this.unifiedOracle?.isConnected()) {
            this.unifiedOracle.execute(
              'DELETE FROM scene_perception WHERE scene_id = ?',
              [sceneId]
            );
          }
          await this.neuralUplink.regroundScene(sceneId).catch((err: Error) => {
            this.logger?.warn('HRC', traceId, `regroundScene failed for ${sceneId}: ${err.message}`);
          });
        }
        return;
      }
      case 'apply_decal':
        // Decals are handled via the architect service
        if (this.architect) {
          await this.architect.triggerNeuralGlitch(event.payload.intensity ?? 1.0);
        }
        return;
      case 'system_heartbeat': {
        const p = event.payload;
        this.logger?.debug('HRC', traceId, `System Heartbeat: socketlib=${p.socketlib}, fxmaster=${p.fxmaster}, sequencer=${p.sequencer}, splatter=${p.splatter}`);
        return;
      }
      case 'reconnect_uplink': {
        if (this.neuralUplink) {
          await this.neuralUplink.reconnect();
        }
        return;
      }
      case 'file_extraction':
        return this.handleFileExtraction(event.payload);
      case 'decrypt_st3gg':
        return this.handleDecryptRequest(event.payload);
      case 'npc_turn':
        return this.handleNpcTurn(event.payload);
      case 'thought_stream':
        return this.handleThoughtStream(event.payload);
      case 'audit_library':
        return this.handleAuditLibrary(event.payload);
      case 'scene_dispatch':
        return this.handleSceneDispatch(event.payload as { sceneType: string; journalId: string });
      case 'set_profile': {
        const profile = (event.payload as { profile: SovereignProfile }).profile;
        this.setProfile(profile);
        return;
      }
      default: {
        this.logger?.error('HRC', traceId, `Unknown event type '${(event as any).type}'`);
        throw new Error(`HybridRoutingController: unknown event type '${(event as any).type}'`);
      }
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  private async handleResolveAttack(payload: ResolveAttackParams, spatial?: { sceneId: string, x: number, y: number }): Promise<AttackResult> {
    const traceId = randomUUID();
    const result = await this.nitroLogic.resolveAttack(payload);
    await this.foundry.show3dDice('1d10', result.rollTotal);

    const context = `hit=${result.hit}, rollTotal=${result.rollTotal}, dvTarget=${result.dvTarget}, netDamage=${result.netDamage}, criticalInjury=${result.criticalInjury}`;
    await this.pushNarrativeOrFallback(
      'Narrate the outcome of this Cyberpunk RED attack roll in 2-3 sentences.',
      context,
      this.formatAttackFallback(result),
      spatial,
      0.9, // High Violence Temperature
      0.95 // High Predictability TopP
    );

    if (payload.targetId && result.hit && result.netDamage > 0) {
      // Atmosphere First (Phase 14): Trigger neural screen glitch on damage
      if (this.neuralUplink?.isConnected()) {
        const intensity = result.criticalInjury ? 2.0 : Math.min(1.5, 0.5 + (result.netDamage / 10));
        this.neuralUplink.triggerNeuralGlitch(intensity).catch(() => {});
      }

      try {
        const [current] = this.unifiedOracle.query('SELECT hp FROM npcs WHERE id = ?', [payload.targetId]);
        if (current) {
          const newHp = Math.max(0, current.hp - result.netDamage);
          await this.unifiedOracle.executeTransaction([{
            action: 'UPDATE_NPC',
            target: payload.targetId,
            data: { hp: newHp }
          }]);

          // Task 3: Integrate LLM generation for pretext overlay text and FX
          if (result.netDamage >= 15 || newHp <= 1) {
            const overlayType = newHp <= 1 ? 'death_state' : 'critical_damage';
            const promptContext = `Target sustained ${result.netDamage} damage. Current HP: ${newHp}. Severity: ${overlayType}.`;
            const generatedOverlay = await this.storyEngine.generateOverlayParams(promptContext);

            await this.foundry.triggerPretextOverlay({
              targetId: payload.targetId,
              overlayType,
              text: generatedOverlay.text,
              color: generatedOverlay.color || '#ff003c',
              duration: generatedOverlay.duration || 3000,
              glitch: newHp <= 1, // Trigger parseltongue/glitch for death state
              fxParams: generatedOverlay.fxParams || { shader: 'chromatic_aberration', intensity: 2.5 }
            });
          }
        }
      } catch (err) {
        this.logger?.warn('HRC', traceId, `Failed to reconcile damage for target ${payload.targetId}: ${(err as Error).message}`);
      }
    }

    this.evaluateStoryEvent({ type: 'resolve_attack', result });
    await this.syncDashboard();
    return result;
  }


  private async handleCalculateDv(payload: CalculateDvParams, spatial?: { sceneId: string, x: number, y: number }): Promise<DvResult> {
    const result = await this.nitroLogic.calculateDv(payload);
    const summary = `**DV Calculation** — Target DV: **${result.dv}**\n${result.breakdown}`;
    await this.foundry.sendChatMessage(summary, { alias: 'nitro-logic' });
    return result;
  }

  private async handleOracleRoll(payload: OracleRollParams, spatial?: { sceneId: string, x: number, y: number }): Promise<OracleResult> {
    const result = await this.nitroLogic.oracleRoll(payload);
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
    this.evaluateStoryEvent({ type: 'oracle_roll', result });
    return result;
  }

  private async handleBuyItem(payload: BuyItemEvent['payload']): Promise<void> {
    const { actorId, costEb, itemId, vendor } = payload;
    const traceId = randomUUID();
    const actorData = await this.foundry.readActor(actorId) as any;
    const currentEb = actorData?.system?.wealth?.eb ?? 0;

    if (currentEb < costEb) {
      await this.foundry.sendChatMessage(`❌ **Transaction Failed**: Insufficient funds.`, { alias: vendor });
      this.logger?.warn('HRC', traceId, 'BuyItem: Insufficient funds', { actorId, currentEb, costEb });
      return;
    }

    const newEb = currentEb - costEb;
    await this.foundry.updateActor(actorId, { 'system.wealth.eb': newEb });

    try {
      await this.unifiedOracle.executeTransaction([{
        action: 'ADD_LORE',
        subject: itemId,
        predicate: 'owned_by',
        object: actorId,
      }]);
    } catch (err) {
      this.logger?.warn('HRC', traceId, `Failed to reconcile item ownership for ${itemId}: ${(err as Error).message}`);
    }

    const context = `vendor=${vendor}, item=${itemId}, costEb=${costEb}, newBalance=${newEb}`;
    await this.pushNarrativeOrFallback(
      'Narrate a short transaction in a Cyberpunk night market.',
      context,
      `You purchased an item from ${vendor} for ${costEb}eb.`,
      undefined,
      0.6, // Transaction Temperature
      0.8  // Medium Predictability TopP
    );
    this.evaluateStoryEvent({ type: 'buy_item', payload });
    await this.syncDashboard();
  }

  private async handleRedTradeTransit(payload: RedTradeTransitEvent['payload']): Promise<FrictionRollResult> {
    const traceId = randomUUID();
    const result = this.redTradeService.rollFriction(payload.currentFriction);
    const messages: Record<string, string> = {
      bark:   `🌆 *The streets feel tense...* Heat: ${result.total}`,
      gate:   `⚠️ **Decision Gate** — Heat rising. Roll: ${result.total}`,
      ambush: `🔴 **RIVAL INTERVENTION** — Ambush! Roll: ${result.total}`,
    };
    
    let mapTile: string | undefined;
    if (result.outcome === 'ambush') {
      // Fetch a relevant map tile for the district
      const district = payload.district ?? 'Watson';
      const maps = this.unifiedOracle.query(
        `SELECT file_path FROM map_assets WHERE biome LIKE ? LIMIT 1`,
        [`%${district}%`]
      ) as Array<{ file_path: string }>;
      mapTile = maps[0]?.file_path;
    }

    await this.foundry.sendChatMessage(
      messages[result.outcome] || `🌆 *Streets of Night City:* ${result.outcome}` + 
      (mapTile ? `\n📍 *Tactical Terrain Detected:* ${path.basename(mapTile)}` : ''), 
      { alias: 'Friction Engine' }
    );
    
    // Architect Pass (Phase 12): Materialize ambush tokens directly in the renderer
    if (result.outcome === 'ambush' && this.architect) {
      this.architect.spawnToken(null, 500, 500).catch(err => {
        this.logger?.warn('HRC', traceId, `Architect ambush manifestation failed: ${err.message}`);
      });
    }

    this.evaluateStoryEvent({ type: 'red_trade_transit', payload });
    await this.syncDashboard();
    return result;
  }

  private async handleOpenNightMarket(actorId: string, vendorName: string): Promise<void> {
    const traceId = randomUUID();
    this.logger?.info('HRC', traceId, `Opening Night Market for vendor: ${vendorName}`);
    const inventory = await this.nightMarketService.getVendorInventory(vendorName);
    
    // Phase 56: If a suggested map exists for this shop, we could optionally manifest it
    if (inventory.suggestedMap) {
      this.logger?.info('HRC', traceId, `Suggested shop map: ${inventory.suggestedMap}`);
      // In a real live-fire, we'd trigger a scene shift or tile manifestation here
    }

    await this.foundry.openNightMarket(actorId, vendorName, inventory.items);
  }

  private async handleSceneDispatch(payload: { sceneType: string; journalId: string }): Promise<void> {
    const traceId = randomUUID();
    const { sceneType, journalId } = payload;
    this.logger?.info('HRC', traceId, `scene_dispatch: type=${sceneType} journal=${journalId}`);

    switch (sceneType) {
      case 'night_market': {
        const inventory = await this.nightMarketService.getVendorInventory(journalId);
        const lines = inventory.items.slice(0, 10).map((item) => `• **${item.name}** — ${item.costEb}eb`).join('\n');
        await this.foundry.sendChatMessage(`🏪 **Night Market** — ${journalId}\n${lines || '_No stock found._'}`, { alias: 'Night Market' });
        break;
      }
      case 'red_trade': {
        const result = this.redTradeService.rollFriction(0);
        const messages: Record<string, string> = {
          bark:   `🌆 *Streets are quiet... for now.* Heat: ${result.total}`,
          gate:   `⚠️ **Decision Gate** — The broker wants proof. Roll: ${result.total}`,
          ambush: `🔴 **AMBUSH** — You've been made. Roll: ${result.total}`,
        };
        await this.foundry.sendChatMessage(messages[result.outcome] ?? `🌆 Red Trade: ${result.outcome}`, { alias: 'Red Trade' });
        break;
      }
      case 'character_creation': {
        await this.foundry.sendChatMessage(
          `🧬 **Character Creation Initiated**\nJournal: \`${journalId}\`\nGM: use \`/onboard <name> <role>\` to begin lifepath interview.`,
          { alias: '50V3R31GN' },
        );
        break;
      }
      default:
        this.logger?.warn('HRC', traceId, `scene_dispatch: unknown sceneType '${sceneType}'`);
    }
  }

  private evaluateStoryEvent(event: any): void {
    const result = this.storyEngine.evaluateEvent(event);
    if (result.transitioned) {
      this.foundry.sendChatMessage(`**Story Advance** — Transitioned from *${result.oldBeat}* to *${result.newBeat}*.`, { alias: 'Story Engine' }).catch(() => {});
    }
  }

  // ── Dashboard Sync Engine ───────────────────────────────────────────────────

  /**
   * Aggregates the latest world-state from the Oracle and pushes it
   * to the Night City Dashboard sidebar in Foundry.
   */
  private async syncDashboard(): Promise<void> {
    const traceId = randomUUID();
    try {
      // 1. Fetch NPC stats for the Bio-Monitor
      const npcs = this.unifiedOracle.query(
        'SELECT id, name, hp, sp, humanity, disposition FROM npcs LIMIT 10', 
        []
      );

      // 2. Fetch Faction influence for the Pulse Grid
      const factionData = this.unifiedOracle.query(
        'SELECT name, relationship_score FROM factions',
        []
      );
      const gridData = this.unifiedOracle.query(
        'SELECT SUM(strength) as total_strength, faction_name FROM district_grid GROUP BY faction_name',
        []
      );

      const factions = factionData.map(f => {
        const grid = gridData.find(g => g.faction_name === f.name);
        return {
          name: f.name,
          relationship: f.relationship_score,
          strength: grid?.total_strength ?? 0
        };
      });

      // 3. Check System Status
      const nodeAHealthy = await this.nitroLogic.isHealthy().catch(() => false);

      // 4. Push to Foundry
      await this.foundry.pushDashboardUpdate({
        actors: npcs.map((n: any) => ({
          id: n.id,
          name: n.name,
          hp: n.hp,
          sp: n.sp,
          humanity: n.humanity,
          disposition: n.disposition as 'friendly' | 'neutral' | 'hostile',
        })),
        factions,
        systemStatus: {
          nodeA: nodeAHealthy,
          pulseActive: true,
          authRequired: this.unifiedOracle.onAuthorize !== undefined,
        }
      });

      // 5. Write world-state blips to shared memory segment
      if (this.sharedMemory) {
        const blips = npcs.map((n: any) => ({
          id: String(n.id ?? ''),
          name: String(n.name ?? ''),
          x: 500,
          y: 500,
          hp: Number(n.hp ?? 0),
          actorType: 0 as const,
          faction: String(n.faction ?? ''),
        }));
        this.sharedMemory.writeWorldState(blips);
      }
    } catch (err) {
      this.logger?.warn('HRC', traceId, `Dashboard sync failed: ${(err as Error).message}`);
    }
  }

  async handleScan(): Promise<void> {
    const traceId = randomUUID();
    let visualBuffer: Buffer | undefined;
    
    // Attempt Neural Uplink (CDP) capture first
    if (this.visualMonitor) {
      try {
        const record = await this.visualMonitor.captureScreenshot();
        visualBuffer = Buffer.from(record.data, 'base64');
        this.logger?.info('HRC', traceId, '📡 Neural Uplink: Captured GPU screenshot via CDP.');
      } catch (err) {
        this.logger?.warn('HRC', traceId, `⚠️  Neural Uplink capture failed, falling back to legacy CV: ${(err as Error).message}`);
      }
    }

    if (!this.spatialVision) return;
    
    // If we have a CDP buffer, we would pass it to analysis. 
    // For now, we maintain the legacy capture logic if CDP fails.
    const visual = await this.spatialVision.captureAndAnalyze();
    const visualSummary = `Tokens: ${visual.tokenClusters.join(', ')}. Environment: ${visual.environmentalFeatures.join(', ')}.`;
    const groundedContext = await this.applyWorldPulseGrounding(visualSummary);
    const prompt = 'Describe the tactical situation on the battle map.';
    const narrative = await this.sovereignNarrative.generateNarrative(prompt, visualSummary, groundedContext);
    await this.foundry.sendChatMessage(narrative, { alias: 'Optical Bridge' });
  }

  async handleOnboard(playerName: string, role: string, buildType: BuildType = 'Standard'): Promise<void> {
    if (!this.onboardingEnabled) return;
    const traceId = randomUUID();
    this.logger?.info('HRC', traceId, `Starting onboarding for ${playerName} as ${role} (${buildType})`);
    const controller = new OnboardingController({
      nitroLogicClient: this.nitroLogic,
      sovereignNarrativeClient:     this.sovereignNarrative,
      unifiedOracle:    this.unifiedOracle,
    });
    await controller.startInterview();
    await controller.advanceToLifepath();
    const lifepath = await controller.rollLifepath();
    const statsResult = await controller.setStats(buildType);
    await controller.finalizeCharacter();
    const { actorId } = await this.foundry.createActor({
      name:  playerName,
      role,
      stats: statsResult.stats as unknown as Record<string, number>,
      bio:   lifepath.dialogue,
      seedItems: [],
    });
    await this.foundry.sendChatMessage(`✅ **${playerName}** created. Actor ID: \`${actorId}\``, { alias: 'Fixer Interview' });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async pushNarrativeOrFallback(prompt: string, context: string, fallback: string, spatial?: { sceneId: string, x: number, y: number }, temperature: number = 0.7, topP: number = 0.9): Promise<void> {
    let narrative: string;
    const traceId = randomUUID();
    try {
      const systemContext = await this.applyWorldPulseGrounding(prompt + ' ' + context, spatial);
      // We pass the scene's district name if available, for now undefined.
      const result = await this.sovereignJudge.evaluateNarrative(prompt, context, systemContext, undefined, temperature, topP);
      narrative = result.narrative;
    } catch (e) {
      this.logger?.error('HRC', traceId, 'pushNarrativeOrFallback Error:', { error: (e as Error).message });
      narrative = fallback;
    }
    await this.foundry.sendChatMessage(narrative, { alias: 'GM Assistant' });
  }

  private async applyWorldPulseGrounding(input: string, spatial?: { sceneId: string, x: number, y: number }): Promise<string | undefined> {
    if (!this.unifiedOracle?.isConnected() || !input) return undefined;
    const traceId = randomUUID();

    try {
      let pulse = 'WORLD PULSE (GROUNDED TRUTH):\n';

      // NPC grounding
      // Phase 41 Optimization: Filter NPCs by name existence in the input string at the DB level
      const npcs = this.unifiedOracle.query(
        "SELECT name, hp, faction, disposition FROM npcs WHERE ? LIKE '%' || name || '%'",
        [input]
      );

      for (const npc of npcs) {
        pulse += `- ${npc.name}: HP=${npc.hp}, Faction=${npc.faction}, Stance=${npc.disposition}\n`;
        const [lastMsg] = this.unifiedOracle.query(
          'SELECT content FROM session_memory.messages WHERE content LIKE ? ORDER BY rowid DESC LIMIT 1',
          [`%${npc.name}%`]
        );
        if (lastMsg && lastMsg.content) {
          const snippet = lastMsg.content.length > 40 ? lastMsg.content.slice(0, 40) : lastMsg.content;
          pulse += `  Context: "${snippet}..."\n`;
        }
      }

      // Precision Rules Extraction (Search-Extract Pattern)
      const ruleKeywords = ['DV', 'Pistol', 'Armor', 'Critical', 'Humanity'];
      for (const kw of ruleKeywords) {
        if (input.toLowerCase().includes(kw.toLowerCase())) {
          const ruleSnippet = await this.rulesGrep.search(kw, 1);
          if (ruleSnippet) pulse += `RULEBOOK REFERENCE:\n${ruleSnippet}\n\n`;
        }
      }

      pulse += `CONSTITUTION: ${this.redRulesConstitution}\n\n`;

      // Unified Cohesion (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS): Inject Live Radar Telemetry
      if (this.sharedMemory) {
        try {
          const radar = this.sharedMemory.readWorldState();
          if (radar && radar.length > 0) {
            pulse += 'LIVE RADAR (SHARED MEMORY):\n';
            radar.forEach((blip: any) => {
              pulse += `- BLIP: ${blip.name} | POS: {${Math.round(blip.x)}, ${Math.round(blip.y)}} | HP: ${blip.hp}\n`;
            });
            pulse += '\n';
          }
        } catch { /* ignore shmem read failures */ }
      }

      if (spatial) {
        const regions = this.unifiedOracle.query(
          `SELECT category, label FROM scene_regions
           WHERE scene_id = ?
           AND (ABS(json_extract(bounds_json, '$[1]') + json_extract(bounds_json, '$[3]'))/2 - ?) < 100
           AND (ABS(json_extract(bounds_json, '$[0]') + json_extract(bounds_json, '$[2]'))/2 - ?) < 100`,
          [spatial.sceneId, spatial.x, spatial.y]
        );
        for (const reg of regions) pulse += `- ${reg.label} (${reg.category.replace('_', ' ')})\n`;

        // Phase 16: Narrative Fusion — inject Falcon OCR map labels
        const perceptionRows = this.unifiedOracle.query('SELECT detected_entities_json FROM scene_perception WHERE scene_id = ?', [spatial.sceneId]) as Array<{ detected_entities_json: string }>;
        if (perceptionRows.length > 0) {
          try {
            const entities = JSON.parse(perceptionRows[0]!.detected_entities_json) as Array<{ text: string }>;
            if (entities.length > 0) {
              const labels = entities.map((e) => e.text).join(', ');
              pulse += `MAP LABELS (Falcon OCR): ${labels}\n`;
            }
          } catch { /* ignore malformed perception JSON */ }
        }
      }

      return pulse;
    } catch (err) {
      this.logger?.warn('HRC', traceId, `World Pulse grounding failed: ${(err as Error).message}`);
      return undefined;
    }
  }

  private formatAttackFallback(result: AttackResult): string {
    const hitLabel = result.hit ? '✅ HIT' : '❌ MISS';
    const critSuffix = result.criticalInjury ? ' ⚠️ CRITICAL INJURY' : '';
    return `**Attack Roll** — ${hitLabel}${critSuffix} | Roll: ${result.rollTotal} vs DV ${result.dvTarget} | Damage: ${result.netDamage} net`;
  }

  /**
   * Phase 30: Handle human intents from the crush proxy (Go).
   */
  async handleProxyIntent(intent: any): Promise<void> {
    this.logger?.info('HRC', 'debug', '[HRC] Received raw proxy intent object:', { intent });
    const { id, method, command, params } = intent;
    const effectiveMethod = method || command;
    if (!effectiveMethod) return;
    
    const traceId = randomUUID();

    this.logger?.info('HRC', traceId, `[HRC] Proxy Intent: ${effectiveMethod}`, { params, intent });

    let result: any = { status: 'GRANTED' };

    try {
      if (effectiveMethod === 'chat' || effectiveMethod === 'narrative_query') {
        const queryText = intent.text || params?.text || '';
        this.logger?.info('HRC', traceId, `[HRC] Director Query: ${queryText}`);

        // Broadcast to command log first
        this.clawlink?.publish(JSON.stringify({
          type: 'broadcast',
          payload: JSON.stringify({ type: 'log', content: `[query] ${queryText}` })
        }));

        // Generate narrative completion
        try {
          let sysContext = 'Clinical and objective OS response.';
          if (this.activeProfile === 'RED_DIRECTOR') {
            sysContext = 'Uncensored gritty GM response.';
          } else if (this.activeProfile === 'RESEARCHER') {
            sysContext = 'High-fidelity clinical research and architectural analysis.';
          }
          
          const narrative = await this.sovereignNarrative.generateNarrative(
            queryText, 
            'You are responding to a direct query from the operator terminal.', 
            sysContext
          );

          // Broadcast narrative to the dashboard
          this.clawlink?.publish(JSON.stringify({
            type: 'broadcast',
            payload: JSON.stringify({ type: 'narrative', content: narrative })
          }));

          // Also send to Foundry chat for legacy support
          let alias = 'Sovereign OS';
          if (this.activeProfile === 'RED_DIRECTOR') {
            alias = 'Sovereign Director';
          } else if (this.activeProfile === 'RESEARCHER') {
            alias = 'Sovereign Researcher';
          }
          await this.foundry.sendChatMessage(narrative, { alias });
        } catch (err) {
          this.logger?.error('HRC', traceId, `Narrative query failed: ${(err as Error).message}`);
        }
        return;
      }

      if (effectiveMethod === 'reason_audit') {
        const { action, target_id } = params;
        if (action === 'friction') {
          this.logger?.info('HRC', traceId, `[HRC] Triggering Friction Roll for ${target_id}`);
          const friction = await this.unifiedOracle.getFactionFriction(target_id);
          const rollRes = this.redTradeService.rollFriction(friction);
          const messages: Record<string, string> = {
            bark:   `🌆 *The streets feel tense...* Heat: ${rollRes.total}`,
            gate:   `⚠️ **Decision Gate** — Heat rising. Roll: ${rollRes.total}`,
            ambush: `🔴 **RIVAL INTERVENTION** — Ambush! Roll: ${rollRes.total}`,
          };
          await this.foundry.sendChatMessage(messages[rollRes.outcome] || `🌆 *Streets of Night City:* ${rollRes.outcome}`, { alias: 'Friction Engine' });
          
          if (rollRes.outcome === 'ambush' && this.architect) {
             this.architect.spawnToken(null, 500, 500).catch(() => {});
          }
          return;
        }
      }

      switch (effectiveMethod) {
        case 'scan':
          await this.handleScan();
          result.message = 'Scan complete.';
          break;
        case 'crop-scan':
          const cropData = await this.handleCropScan(params.x, params.y, params.size);
          result.message = 'Crop-scan complete.';
          result.data = cropData;
          break;
        case 'intent':
          const intentType = params?.type || intent.type;
          this.logger?.info('HRC', traceId, `[HRC] Intent Type: ${intentType}, neuralUplink defined: ${!!this.neuralUplink}`);
          if (intentType === 'heavy') {
            await this.neuralUplink?.setPhysicalLock(true);
            // Simulate heavy operation
            await new Promise(r => setTimeout(r, 4000));
            await this.neuralUplink?.setPhysicalLock(false);
            result.message = 'Heavy intent processed and shroud unlocked.';
          } else {
            result = { status: 'REJECTED', message: `Unknown intent type: ${intentType}` };
          }
          break;
        case 'hack':
          const hackRes = await this.handleHack(params.action, params.target);
          result = hackRes;
          break;
        case 'shut-down':
          this.logger?.info('HRC', traceId, '🔴 EMERGENCY SHUTDOWN RECEIVED FROM PROXY');
          process.emit('SIGTERM');
          result.message = 'Shutdown sequence initiated.';
          break;
        case 'switch-profile': {
          const profile = params.profile as SovereignProfile;
          this.setProfile(profile);
          result.message = `Profile switched to ${profile}`;
          break;
        }
        default:
          result = { status: 'REJECTED', message: `Unknown command: ${effectiveMethod}` };
      }
    } catch (err) {
      this.logger?.error('HRC', traceId, `Proxy Intent Failed: ${(err as Error).message}`);
      result = { status: 'REJECTED', message: (err as Error).message };
    }

    // Send response back via broadcast
    if (this.clawlink) {
      await this.clawlink.publish(JSON.stringify({ id, ...result }));
    }
  }

  private async handleCropScan(x: number, y: number, size: number): Promise<string> {
    if (!this.neuralUplink?.isConnected()) {
      throw new Error('Neural Uplink not connected');
    }
    return this.neuralUplink.captureCoordinateCrop(x, y, size);
  }

  private async handleHack(action: string, target: string): Promise<{ status: 'GRANTED' | 'REJECTED', message: string }> {
    // WSA Audit via Node A
    if (this.clawlink) {
      const audit = await this.clawlink.wsaAudit(action, target, 'Human crush-cli intent');
      if (audit.verdict === 'REJECTED') {
        return { status: 'REJECTED', message: audit.rationale };
      }
    }

    // Execute physical mutation
    if (action === 'unlock') {
      await this.foundry.updateActor(target, { 'system.locked': false });
    } else if (action === 'dim-lights') {
      // Direct lighting manipulation
      await this.foundry.runScript(`Canvas.layers.lighting.updateAll({darknessLevel: 0.8})`);
    }

    return { status: 'GRANTED', message: `${action} executed on ${target}` };
  }

  private async handleNpcTurn(payload: NpcTurnEvent['payload']): Promise<TurnResult> {
    const traceId = randomUUID();
    if (!this.turnDaemon) {
      this.logger?.error('HRC', traceId, 'npc_turn event received but no TurnDaemon is configured');
      throw new Error('HybridRoutingController: npc_turn event received but no TurnDaemon is configured');
    }
    const result = await this.turnDaemon.runTurn(payload.npcId, payload.sensoryContext);

    // Phase 40: Ambush Spawning
    if (result.action.type === 'attack' && this.architect) {
      this.architect.spawnToken(null, 500, 500).catch((err: Error) => {
        this.logger?.warn('HRC', traceId, `Architect hostile manifestation failed: ${err.message}`);
      });
    }

    return result;
  }

  private async handleThoughtStream(payload: { content: string }): Promise<void> {
    if (!this.clawlink) return;
    await this.foundry.streamThoughtTokens(payload.content, (token) => {
      this.clawlink?.publish(JSON.stringify({ type: 'token', token }));
    });
  }

  private async handleAuditLibrary(payload: { assetsDir?: string }): Promise<void> {
    const traceId = randomUUID();
    if (!this.auditor) {
      this.logger?.warn('HRC', traceId, 'audit_library received but AkashikVisualAuditor is not wired.');
      return;
    }
    this.logger?.info('HRC', traceId, 'Starting AkashikVisualAuditor global lore extraction pass...');
    const count = await this.auditor.runGlobalAudit(payload.assetsDir);
    this.logger?.info('HRC', traceId, `Visual audit complete. ${count} lore seeds extracted and saved to library.`);
    await this.foundry.sendChatMessage(
      `📚 **Akashik Audit Complete** — ${count} lore seed(s) extracted from visual assets and committed to the library.`
    );
  }

  private async handleFileExtraction(payload: { targetActorId: string, context: string }): Promise<void> {
    const traceId = randomUUID();
    // 1. Generate Contextual Secret (Node B GPU)
    const prompt = `Generate a short (max 15 words) secret password, data fragment, or lore clue found in a file related to: ${payload.context}`;
    const secret = await this.sovereignNarrative.generateNarrative(prompt, payload.context, 'Generate a short Cyberpunk secret.', undefined, 0.2, 0.5);

    // 2. Select Template & Encode (Node B CPU)
    // We assume templates exist in data/assets/st3gg_templates/
    const templatesDir = path.join(process.cwd(), 'data/assets/st3gg_templates');
    const dropsDir = path.join(process.cwd(), 'data/assets/st3gg_drops');
    
    // Ensure dirs exist
    if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });
    if (!fs.existsSync(dropsDir)) fs.mkdirSync(dropsDir, { recursive: true });

    // For now, if no templates exist, we can't encode.
    const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.png'));
    if (templates.length === 0) {
      this.logger?.warn('HRC', traceId, 'No st3gg templates found in data/assets/st3gg_templates/. Skipping drop.');
      return;
    }

    const templateName = templates[Math.floor(Math.random() * templates.length)]!;
    const templatePath = path.join(templatesDir, templateName);
    const outputFileName = `drop_${Date.now()}.png`;
    const outputPath = path.join(dropsDir, outputFileName);
    
    try {
      await this.steganographyService.encodeSecret(templatePath, outputPath, secret);

      // 3. Send Drop to Foundry
      // The path must be relative to the Foundry data root for the client to load it.
      // We assume data/assets is mapped correctly.
      const publicUrl = `assets/st3gg_drops/${outputFileName}`;
      await this.foundry.sendChatMessage(
        `<strong>[ST3GG] Data Fragment Extracted</strong><br/>` +
        `<img src="${publicUrl}" style="border:none; border-radius:4px; margin-top:8px;"/><br/>` +
        `<small>Encrypted data detected. Run Decryption Daemon to view.</small>`,
        { alias: 'System' }
      );
    } catch (err) {
      this.logger?.error('HRC', traceId, `Steganography encoding failed: ${(err as Error).message}`);
    }
  }

  private async handleDecryptRequest(payload: { imagePath: string }): Promise<{ secret: string }> {
    const traceId = randomUUID();
    // The imagePath from Foundry is likely relative, e.g. "assets/st3gg_drops/drop_123.png"
    // We need to map it back to the local filesystem.
    const localPath = path.join(process.cwd(), 'data', payload.imagePath);
    
    try {
      if (!fs.existsSync(localPath)) {
        return { secret: "ERROR: File not found on server." };
      }
      const secret = await this.steganographyService.decodeSecret(localPath);
      return { secret };
    } catch (err) {
      this.logger?.error('HRC', traceId, `Steganography decoding failed: ${(err as Error).message}`);
      return { secret: "ERROR: Data corruption. Decryption failed." };
    }
  }

  /**
   * Phase 31: Counter-Hacks (Active Defense)
   * Intercept token movement updates in Foundry and validate them via Node B.
   */
  private async handleMoveValidation(event: { requestId: string, payload: { actorId: string, tokenId: string, x: number, y: number }, respond: (res: any) => void }): Promise<void> {
    const { tokenId, x, y } = event.payload;
    const traceId = randomUUID();
    this.logger?.debug('HRC', traceId, `Validating Move for token: ${tokenId} to {${x}, ${y}}`);

    // 1. Basic "Active Defense" rule: Teleport Hack detection
    // We check against the last known position in Radar (Shared Memory or Oracle)
    let currentX = x;
    let currentY = y;
    let found = false;

    if (this.sharedMemory) {
      const radar = this.sharedMemory.readWorldState();
      const blip = radar.find((b: any) => b.id === tokenId);
      if (blip) {
        currentX = blip.x;
        currentY = blip.y;
        found = true;
      }
    }

    // Fallback to Oracle if not in Shared Memory
    if (!found && this.unifiedOracle?.isConnected()) {
      const rows = this.unifiedOracle.query('SELECT x, y FROM radar WHERE id = ?', [tokenId]) as any[];
      if (rows.length > 0) {
        currentX = rows[0].x;
        currentY = rows[0].y;
        found = true;
      }
    }

    if (found) {
      const dx = x - currentX;
      const dy = y - currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 1000) {
        this.logger?.warn('HRC', traceId, `Teleport Hack Detected: Movement of ${Math.round(distance)} units exceeds the 1000-unit limit.`, { tokenId, from: { x: currentX, y: currentY }, to: { x, y } });
        event.respond({
          verdict: 'INVALID',
          reason: `Teleport Hack Detected: Movement of ${Math.round(distance)} units exceeds the 1000-unit limit.`
        });
        return;
      }
    }

    // 2. Restricted Region check (Stub: x > 5000 is restricted)
    if (x > 5000) {
      this.logger?.warn('HRC', traceId, 'Restricted Region: Entry without authorization attempt', { tokenId, x, y });
      event.respond({
        verdict: 'INVALID',
        reason: 'Restricted Region: You do not have authorization to enter this sector.'
      });
      return;
    }

    // 3. Fallback to Node A mechanical validation if available
    if (this.vsb) {
      const payloadStr = JSON.stringify({
        action: 'validate_move',
        tokenId,
        target: { x, y },
        current: found ? { x: currentX, y: currentY } : null
      });

      const validation = await this.validateMechanicalIntent(payloadStr);
      if (validation && !validation.valid) {
        this.logger?.warn('HRC', traceId, `Sovereign Veto: Movement rejected by Node A Reasoner (Code ${validation.code})`, { tokenId, x, y });
        event.respond({
          verdict: 'INVALID',
          reason: `Sovereign Veto: Movement rejected by Node A Reasoner (Code ${validation.code}).`
        });
        return;
      }
    }

    event.respond({ verdict: 'VALID' });
  }

  /**
   * Phase 30: Handle Hook Interception Audit
   * Forwards intercepted intents to Node A for rules-veto.
   */
  private async handleAuditRequest(event: { requestId: string, payload: { event: string, data: any }, respond: (res: any) => void }): Promise<void> {
    const traceId = randomUUID();
    this.logger?.debug('HRC', traceId, `Auditing Intent: ${event.payload.event}`);

    // If Node A (VSB) is not available, allow by default
    if (!this.vsb) {
      event.respond({ verdict: 'VALID' });
      return;
    }

    try {
      // Fast-path: Send to Node A via UDP SkillCheck (repurposed for audit)
      // Node A 1.5B Reasoner is the authority here.
      const payloadStr = JSON.stringify({
        audit: true,
        event: event.payload.event,
        data: event.payload.data
      });

      const validation = await this.validateMechanicalIntent(payloadStr);
      
      if (validation && !validation.valid) {
        this.logger?.warn('HRC', traceId, `Mechanical Veto: Code ${validation.code} for event ${event.payload.event}`, { event: event.payload });
        event.respond({ 
          verdict: 'INVALID', 
          reason: `Mechanical Veto: Code ${validation.code}` 
        });
      } else {
        event.respond({ verdict: 'VALID' });
      }
    } catch (err) {
      this.logger?.error('HRC', traceId, `Audit error, allowing by default: ${(err as Error).message}`);
      event.respond({ verdict: 'VALID' });
    }
  }
}
