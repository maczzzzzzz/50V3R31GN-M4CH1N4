// src/core/story-engine.ts
import type { StoryState } from '../shared/schemas/story.schema.js';
import type { ISovereignNarrativeClient } from './interfaces.js';
import type { SkillstoneService } from './skillstone-service.js';
import { ParseltongueCodec } from '../shared/parseltongue-codec.js';
import type { WorldCommand } from '../shared/schemas/world-commands.schema.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';
import { extractJsonObject } from '../shared/utils/json-extractor.js';

export interface BeatConfig {
  id: string;
  transitions: {
    to: string;
    condition: (state: StoryState, event: any) => boolean;
  }[];
}

export interface TransitionResult {
  transitioned: boolean;
  oldBeat?: string;
  newBeat?: string;
}

export interface OverlayParams {
  text: string;
  color?: string;
  duration?: number;
  fxParams?: {
    shader: string;
    intensity: number;
    rgbSplit?: number;
  };
}

export class StoryEngine {
  private beats: Map<string, BeatConfig> = new Map();

  constructor(
    private state: StoryState,
    private sovereignNarrative?: ISovereignNarrativeClient,
    private skillstoneService?: SkillstoneService,
    private foundryAdapter?: IFoundryAdapter,
  ) {}

  /**
   * Register a narrative beat with its transition guards.
   */
  registerBeat(config: BeatConfig): void {
    this.beats.set(config.id, config);
  }

  /**
   * Evaluate an event against the current beat's transition guards.
   */
  evaluateEvent(event: any): TransitionResult {
    const currentId = this.state.currentBeat;
    const currentConfig = this.beats.get(currentId);

    if (!currentConfig) {
      return { transitioned: false };
    }

    for (const transition of currentConfig.transitions) {
      if (transition.condition(this.state, event)) {
        // Capture completed beat count before push (= index of the new phase)
        const phaseIndex = this.state.completedBeats.length;
        this.state.currentBeat = transition.to;
        this.state.completedBeats.push(currentId);

        const result: TransitionResult = {
          transitioned: true,
          oldBeat: currentId,
          newBeat: transition.to,
        };

        // Trigger physical phase shift when a beat transitions
        if (this.foundryAdapter?.isConnected()) {
          this.foundryAdapter.advancePhase(null, phaseIndex).catch((err) => {
            console.warn('[StoryEngine] Phase shift failed:', err);
          });
        }

        return result;
      }
    }

    return { transitioned: false };
  }

  /**
   * Generate lore-accurate status overlay parameters using the LLM.
   * @param context Situation description for the overlay.
   * @param seedBias Optional latent seed bias string from SeedController.getPromptBias().
   *                 Injected into the system prompt to shift NPC atmospheric tone.
   * @param factionId Optional faction ID whose Skillstone is prepended to the prompt,
   *                  enabling the LLM to produce dialect-inflected overlay text.
   */
  async generateOverlayParams(context: string, seedBias?: string, factionId?: string): Promise<OverlayParams> {
    if (!this.sovereignNarrative) {
      return { text: context };
    }

    const biasClause = seedBias && seedBias.length > 0
      ? `\nATMOSPHERIC BIAS (apply to tone): ${seedBias}`
      : '';

    const skillstoneClause = factionId && this.skillstoneService
      ? this.buildSkillstoneClause(factionId)
      : '';

    const prompt = `${skillstoneClause}You are a Cyberpunk RED Biomonitor system.${biasClause}
Generate a lore-accurate, short (max 5 words), high-impact warning message for a status overlay.
Context: ${context}

Return ONLY a JSON object in this format:
{
  "text": "CRITICAL: SYNAPTIC OVERLOAD",
  "color": "#ff003c",
  "duration": 3000,
  "fxParams": { "shader": "chromatic_aberration", "intensity": 2.5 }
}`;

    try {
      const response = await this.sovereignNarrative.generateNarrative(prompt, context, 'Return valid JSON only.');
      const extracted = extractJsonObject<OverlayParams>(response);
      if (extracted) {
        return extracted;
      }
      return { text: response.trim() };
    } catch (err) {
      console.warn('[StoryEngine] Failed to generate overlay params:', err);
      return { text: 'SYSTEM ERROR: BIOMONITOR MALFUNCTION' };
    }
  }

  /**
   * Attach or replace the SkillstoneService at runtime (e.g. after lazy-loading
   * faction data from the database).
   */
  setSkillstoneService(svc: SkillstoneService): void {
    this.skillstoneService = svc;
  }

  /**
   * Attach or replace the IFoundryAdapter at runtime for phase shift triggering.
   */
  setFoundryAdapter(adapter: IFoundryAdapter): void {
    this.foundryAdapter = adapter;
  }

  getState(): StoryState {
    return this.state;
  }

  /**
   * Embed a WorldCommand mutation invisibly into a visible NPC bark.
   *
   * Uses ParseltongueCodec.cloakCommand() to append the mutation as invisible
   * Unicode Tag Block characters (U+E0000) after the visible bark text.
   * The returned string is safe to pass to Foundry as an atmospheric NPC dialogue
   * line — it looks identical to `bark` in all chat UIs but carries the covert
   * world-state instruction for ClawLink to extract and execute.
   *
   * @param bark     The visible narrative text produced by the LLM.
   * @param mutation A validated WorldCommand that should ride the bark.
   */
  embedMutation(bark: string, mutation: WorldCommand): string {
    return ParseltongueCodec.cloakCommand(bark, mutation);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private buildSkillstoneClause(factionId: string): string {
    const stone = this.skillstoneService?.getSkillstone(factionId);
    if (!stone) return '';
    return `--- SKILLSTONE (NPC DIALECT SPEC) ---\n${stone}\n--- END SKILLSTONE ---\n\n`;
  }
}
