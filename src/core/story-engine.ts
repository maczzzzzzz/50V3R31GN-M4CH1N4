// src/core/story-engine.ts
import type { StoryState } from '../shared/schemas/story.schema.js';
import type { IOllamaClient } from './interfaces.js';

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

  constructor(private state: StoryState, private ollama?: IOllamaClient) {}

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
        this.state.currentBeat = transition.to;
        this.state.completedBeats.push(currentId);
        
        return {
          transitioned: true,
          oldBeat: currentId,
          newBeat: transition.to,
        };
      }
    }

    return { transitioned: false };
  }

  /**
   * Generate lore-accurate status overlay parameters using the LLM.
   */
  async generateOverlayParams(context: string): Promise<OverlayParams> {
    if (!this.ollama) {
      return { text: context };
    }

    const prompt = `You are a Cyberpunk RED Biomonitor system. 
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
      const response = await this.ollama.generateNarrative(prompt, context, 'Return valid JSON only.');
      // Extract JSON if model adds fluff
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { text: response.trim() };
    } catch (err) {
      console.warn('[StoryEngine] Failed to generate overlay params:', err);
      return { text: 'SYSTEM ERROR: BIOMONITOR MALFUNCTION' };
    }
  }

  getState(): StoryState {
    return this.state;
  }
}
