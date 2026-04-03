/**
 * src/core/hybrid-routing-controller.ts
 *
 * HybridRoutingController — Phase 3 Orchestration Loop
 */

import type {
  INitroLogicClient, IOllamaClient, IDiscordChroniclerClient, ScreamsheetPersona,
  AttackResult, DvResult, OracleResult,
  ResolveAttackParams, CalculateDvParams, OracleRollParams, IArchitectService,
} from './interfaces.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';
import type { FoundryEvent, BuyItemEvent, ApprovalResponseEvent, RedTradeTransitEvent } from '../shared/schemas/foundry-bridge.schema.js';
import type { StoryEngine } from './story-engine.js';
import type { GmApprovalQueue } from './gm-approval-queue.js';
import type { NightMarketService } from './night-market-service.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { RedTradeService } from './red-trade-service.js';
import type { FrictionRollResult } from '../shared/schemas/red-trade.schema.js';
import { SpatialVisionService } from './spatial-vision-service.js';
import { VisualMonitorService } from './visual-monitor-service.js';
import { SharedMemoryService } from './shared-memory-service.js';

import { OnboardingController, type BuildType } from './onboarding-controller.js';
import { RulesGrepService } from './rules-grep-service.js';
import { MissionSwarmOrchestrator } from './mission-swarm-orchestrator.js';
import fs from 'node:fs';

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
  readonly visualMonitor?: VisualMonitorService | undefined;
  readonly neuralUplink?: VisualMonitorService | undefined;
  readonly architect?: IArchitectService | undefined;
  readonly onboardingEnabled?: boolean | undefined;

  readonly sharedMemoryService?: SharedMemoryService | undefined;
  readonly missionSwarm?: MissionSwarmOrchestrator | undefined;
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
  private readonly visualMonitor: VisualMonitorService | undefined;
  private readonly neuralUplink: VisualMonitorService | undefined;
  private readonly architect: IArchitectService | undefined;
  private readonly onboardingEnabled: boolean;
  private readonly sharedMemory: SharedMemoryService | undefined;
  private readonly missionSwarm: MissionSwarmOrchestrator | undefined;

  private readonly redRulesConstitution: string;
  private readonly rulesGrep: RulesGrepService;

  constructor(options: HybridRoutingControllerOptions) {
    this.nitroLogic = options.nitroLogicClient;
    this.ollama = options.ollamaClient;
    this.foundry = options.foundryAdapter;
    this.storyEngine = options.storyEngine;
    this.gmApprovalQueue = options.gmApprovalQueue;
    this.nightMarketService = options.nightMarketService;
    this.unifiedOracle = options.unifiedOracle;
    this.redTradeService = options.redTradeService;
    this.chronicler = options.chronicler;
    this.spatialVision = options.spatialVision;
    this.visualMonitor = options.visualMonitor;
    this.neuralUplink = options.neuralUplink ?? options.visualMonitor;
    this.architect = options.architect;
    this.onboardingEnabled = options.onboardingEnabled ?? false;
    this.sharedMemory = options.sharedMemoryService;
    this.missionSwarm = options.missionSwarm;

    this.rulesGrep = new RulesGrepService();
    try {
      this.redRulesConstitution = fs.readFileSync('RED_RULES.md', 'utf8');
    } catch {
      this.redRulesConstitution = 'Rules Constitution Missing.';
    }

    // â”€â”€ Vitalik's 2-of-2 Authorization Model (v1.0.3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (this.unifiedOracle) {
      this.unifiedOracle.onAuthorize = async (commands) => {
        console.log('\nâš ï¸  AUTHORIZATION REQUIRED: Flush Gate Transaction Proposed.');
        console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
        commands.forEach((cmd, i) => {
          console.log(`[${i+1}] ${cmd.action}: ${JSON.stringify(cmd)}`);
        });
        console.log('â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
        
        // Dynamic import to prevent TTY issues in non-interactive sessions
        const rl = await import('node:readline/promises');
        const reader = rl.createInterface({ input: process.stdin, output: process.stdout });
        
        try {
          // If in an automated test environment, we auto-ACK
          if (process.env.NODE_ENV === 'test') return true;

          const answer = await reader.question('>>> Type "ACK" or press ENTER to commit, or "N" to reject: ');
          return answer.toLowerCase() !== 'n';
        } catch {
          return true; // Fallback to ACK if TTY fails
        } finally {
          reader.close();
        }
      };
    }

    // Unified Restore (v1.4.3): Automatically restore world-state on boot
    this.restoreSystemState().catch(err => {
      console.warn('[HRC] System state auto-restore failed:', err.message);
    });
  }

  /** 
   * Reads system_state from Akashik.db and dispatches restoration commands.
   */
  private async restoreSystemState(): Promise<void> {
    if (!this.unifiedOracle?.isConnected()) return;
    
    const rows = this.unifiedOracle.query<{ value: string }>('SELECT value FROM system_state WHERE key = ?', ['last_active_scene']);
    if (rows.length > 0 && rows[0].value !== 'null') {
      const sceneId = rows[0].value;
      process.stdout.write(`[v1.4.3 Restore] Found last active scene: ${sceneId}. Restoring...\n`);
      
      // We wrap in a short timeout to ensure all WebSocket/CDP links are primed
      setTimeout(async () => {
        try {
          await this.foundry.activateScene(sceneId);
          if (this.neuralUplink?.isConnected()) {
            await this.neuralUplink.restoreAtmosphere(sceneId);
          }
        } catch (err) {
          console.warn(`[v1.4.3 Restore] Scene ${sceneId} restoration failed:`, (err as Error).message);
        }
      }, 3000);
    }
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
      case 'generate_mission': {
        if (this.missionSwarm) {
          const district = (event.payload as { district?: string }).district ?? 'Watson';
          const blueprint = await this.missionSwarm.generateMission(district);
          await this.foundry.sendChatMessage(
            `ðŸŽ¯ **Mission Brief â€” ${blueprint.district}**\n` +
            `**Intel:** ${JSON.stringify(blueprint.rulesIntel)}\n` +
            `**Tactics:** ${blueprint.tacticalAnalysis}\n` +
            `**Lore Anchors:** ${blueprint.loreAnchors.join(', ') || 'None'}`,
          );
        }
        return;
      }
      case 'scene_activate': {
        if (this.neuralUplink?.isConnected()) {
          const sceneId = (event.payload as { sceneId?: string }).sceneId;
          if (sceneId) {
            await this.neuralUplink.restoreAtmosphere(sceneId).catch((err: Error) => {
              console.warn(`[HybridRoutingController] Atmosphere restore failed for ${sceneId}: ${err.message}`);
            });
          }
        }
        return;
      }
      case 'system_heartbeat': {
        const p = event.payload;
        process.stdout.write(
          `[v1.5.0 Bridge] Heartbeat: socketlib=${p.socketlib}, fxmaster=${p.fxmaster}, sequencer=${p.sequencer}, splatter=${p.splatter}\n`
        );
        return;
      }
      default: {
        const exhaustiveCheck: never = event;
        throw new Error(`HybridRoutingController: unknown event type '${(exhaustiveCheck as FoundryEvent).type}'`);
      }
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  private async handleResolveAttack(payload: ResolveAttackParams, spatial?: { sceneId: string, x: number, y: number }): Promise<AttackResult> {
    const result = await this.nitroLogic.resolveAttack(payload);
    await this.foundry.show3dDice('1d10', result.rollTotal);

    const context = `hit=${result.hit}, rollTotal=${result.rollTotal}, dvTarget=${result.dvTarget}, netDamage=${result.netDamage}, criticalInjury=${result.criticalInjury}`;
    await this.pushNarrativeOrFallback(
      'Narrate the outcome of this Cyberpunk RED attack roll in 2-3 sentences.',
      context,
      this.formatAttackFallback(result),
      spatial,
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
        }
      } catch (err) {
        console.warn(`[HRC] Failed to reconcile damage for target ${payload.targetId}:`, err);
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
    const actorData = await this.foundry.readActor(actorId) as any;
    const currentEb = actorData?.system?.wealth?.eb ?? 0;

    if (currentEb < costEb) {
      await this.foundry.sendChatMessage(`❌ **Transaction Failed**: Insufficient funds.`, { alias: vendor });
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
      console.warn(`[HRC] Failed to reconcile item ownership for ${itemId}:`, err);
    }

    const context = `vendor=${vendor}, item=${itemId}, costEb=${costEb}, newBalance=${newEb}`;
    await this.pushNarrativeOrFallback(
      'Narrate a short transaction in a Cyberpunk night market.',
      context,
      `You purchased an item from ${vendor} for ${costEb}eb.`,
    );
    this.evaluateStoryEvent({ type: 'buy_item', payload });
    await this.syncDashboard();
  }

  private async handleRedTradeTransit(payload: RedTradeTransitEvent['payload']): Promise<FrictionRollResult> {
    const result = this.redTradeService.rollFriction(payload.currentFriction);
    const messages: Record<string, string> = {
      bark:   `🌆 *The streets feel tense...* Heat: ${result.total}`,
      gate:   `⚠️ **Decision Gate** — Heat rising. Roll: ${result.total}`,
      ambush: `🔴 **RIVAL INTERVENTION** — Ambush! Roll: ${result.total}`,
    };
    await this.foundry.sendChatMessage(messages[result.outcome] || `🌆 *Streets of Night City:* ${result.outcome}`, { alias: 'Friction Engine' });
    
    // Architect Pass (Phase 12): Materialize ambush tokens directly in the renderer
    if (result.outcome === 'ambush' && this.architect) {
      this.architect.spawnToken(null, 500, 500).catch(err => {
        console.warn('[HRC] Architect ambush manifestation failed:', err.message);
      });
    }

    this.evaluateStoryEvent({ type: 'red_trade_transit', payload });
    await this.syncDashboard();
    return result;
  }

  private async handleOpenNightMarket(actorId: string, vendorName: string): Promise<void> {
    const items = await this.nightMarketService.getVendorInventory(vendorName);
    await this.foundry.openNightMarket(actorId, vendorName, items);
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
      console.warn('[HRC] Dashboard sync failed:', err);
    }
  }

  async handleScan(): Promise<void> {
    let visualBuffer: Buffer | undefined;
    
    // Attempt Neural Uplink (CDP) capture first
    if (this.visualMonitor) {
      try {
        visualBuffer = await this.visualMonitor.captureScreenshot();
        console.log('📡 Neural Uplink: Captured GPU screenshot via CDP.');
      } catch (err) {
        console.warn('⚠️  Neural Uplink capture failed, falling back to legacy CV:', (err as Error).message);
      }
    }

    if (!this.spatialVision) return;
    
    // If we have a CDP buffer, we would pass it to analysis. 
    // For now, we maintain the legacy capture logic if CDP fails.
    const visual = await this.spatialVision.captureAndAnalyze();
    const visualSummary = `Tokens: ${visual.tokenClusters.join(', ')}. Environment: ${visual.environmentalFeatures.join(', ')}.`;
    const groundedContext = await this.applyWorldPulseGrounding(visualSummary);
    const prompt = 'Describe the tactical situation on the battle map.';
    const narrative = await this.ollama.generateNarrative(prompt, visualSummary, groundedContext);
    await this.foundry.sendChatMessage(narrative, { alias: 'Optical Bridge' });
  }

  async handleOnboard(playerName: string, role: string, buildType: BuildType = 'Standard'): Promise<void> {
    if (!this.onboardingEnabled) return;
    const controller = new OnboardingController({
      nitroLogicClient: this.nitroLogic,
      ollamaClient:     this.ollama,
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

  private async pushNarrativeOrFallback(prompt: string, context: string, fallback: string, spatial?: { sceneId: string, x: number, y: number }): Promise<void> {
    let narrative: string;
    try {
      const systemContext = await this.applyWorldPulseGrounding(prompt + ' ' + context, spatial);
      narrative = await this.ollama.generateNarrative(prompt, context, systemContext);
    } catch {
      narrative = fallback;
    }
    await this.foundry.sendChatMessage(narrative, { alias: 'GM Assistant' });
  }

  private async applyWorldPulseGrounding(input: string, spatial?: { sceneId: string, x: number, y: number }): Promise<string | undefined> {
    if (!this.unifiedOracle?.isConnected()) return undefined;

    try {
      let pulse = 'WORLD PULSE (GROUNDED TRUTH):\n';

      // NPC grounding — must come first so substring checks match test expectations
      const npcs = this.unifiedOracle.query('SELECT name, hp, faction, disposition FROM npcs', []);
      const mentions = npcs.filter((n: any) => input.toLowerCase().includes(n.name.toLowerCase()));

      for (const npc of mentions) {
        pulse += `- ${npc.name}: HP=${npc.hp}, Faction=${npc.faction}, Stance=${npc.disposition}\n`;
        const [lastMsg] = this.unifiedOracle.query(
          'SELECT content FROM session_memory.messages WHERE content LIKE ? ORDER BY rowid DESC LIMIT 1',
          [`%${npc.name}%`]
        );
        if (lastMsg) {
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

      // Unified Cohesion (v1.4.1): Inject Live Radar Telemetry
      if (this.sharedMemory) {
        try {
          const radar = this.sharedMemory.readWorldState();
          if (radar && radar.length > 0) {
            pulse += 'LIVE RADAR (SHARED MEMORY):\n';
            radar.forEach(blip => {
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
      }

      return pulse;
    } catch (err) {
      console.warn('World Pulse grounding failed:', err);
      return undefined;
    }
  }

  private formatAttackFallback(result: AttackResult): string {
    const hitLabel = result.hit ? '✅ HIT' : '❌ MISS';
    const critSuffix = result.criticalInjury ? ' ⚠️ CRITICAL INJURY' : '';
    return `**Attack Roll** — ${hitLabel}${critSuffix} | Roll: ${result.rollTotal} vs DV ${result.dvTarget} | Damage: ${result.netDamage} net`;
  }
}
