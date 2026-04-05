/**
 * src/core/netrunner-antagonist-service.ts
 *
 * NetrunnerAntagonistService — Immersive AI-driven Netrunner Antagonist
 *
 * This service provides the Director (Node B) with high-fidelity "Netrunner" 
 * attacks that manipulate the player's Foundry VTT interface in real-time.
 */

import type { IFoundryAdapter } from '../api/foundry-adapter.js';

export interface NetrunnerAttackOptions {
  /** The intensity of the visual disruption (0.0 - 1.0). */
  intensity?: number;
  /** Duration in milliseconds for the effect to persist. */
  duration?: number;
}

export class NetrunnerAntagonistService {
  constructor(private readonly foundry: IFoundryAdapter) {}

  /**
   * Inject a raw CSS glitch into the Foundry UI to simulate a neural-link hack.
   * Uses runScript to manipulate the DOM directly.
   */
  async attackUI(options: NetrunnerAttackOptions = {}): Promise<void> {
    const intensity = options.intensity ?? 0.5;
    const duration = options.duration ?? 2000;

    const code = `
      (function() {
        const style = document.createElement('style');
        style.id = 'netrunner-ui-hack';
        style.innerHTML = \`
          @keyframes netrunner-glitch {
            0% { filter: hue-rotate(0deg) contrast(1); transform: translate(0); }
            20% { filter: hue-rotate(90deg) contrast(1.5) blur(1px); transform: translate(-2px, 1px); }
            40% { filter: hue-rotate(180deg) contrast(2) brightness(1.2); transform: translate(2px, -1px); }
            60% { filter: hue-rotate(270deg) contrast(1.5); transform: translate(-1px, -2px); }
            100% { filter: hue-rotate(360deg) contrast(1); transform: translate(0); }
          }
          body.netrunner-hacked {
            animation: netrunner-glitch 0.2s infinite;
            pointer-events: none; /* Disorientation effect */
          }
        \`;
        document.head.appendChild(style);
        document.body.classList.add('netrunner-hacked');
        
        setTimeout(() => {
          document.body.classList.remove('netrunner-hacked');
          const s = document.getElementById('netrunner-ui-hack');
          if (s) s.remove();
        }, ${duration});
      })()
    `;

    // Broadcast to all players for maximum psychological impact
    await this.foundry.runScript(code, true);
    
    // Also trigger the standard GPU glitch for layering
    await this.foundry.triggerFxGlitch(intensity * 2);
  }

  /**
   * Force a "CRITICAL ERROR" biometric overlay on the player's screen.
   * Leverages the Pretext system (Phase 17).
   */
  async scrambleBioMonitor(targetId: string, message: string = "NEURAL LINK COMPROMISED"): Promise<void> {
    await this.foundry.triggerPretextOverlay({
      targetId,
      overlayType: 'critical_damage',
      text: message,
      color: '#ff2020',
      duration: 5000,
      fxParams: {
        shader: 'glitch-v3',
        intensity: 2.0,
      }
    });

    // Audio cue via runScript (Foundry Audio Engine)
    await this.foundry.runScript(`AudioHelper.play({src: "sounds/glitch.wav", volume: 0.8}, true)`, true);
  }

  /**
   * "Black Ice" Spawn: Create a macro on the fly to dim lights and spawn 
   * a hostile Netrunner token near the player.
   */
  async spawnBlackIce(sceneId: string, x: number, y: number): Promise<void> {
    const macroCode = `
      (async () => {
        // 1. Dim the lights
        const scene = game.scenes.get("${sceneId}");
        await scene.update({
          "environment.lighting.darkness": 0.8,
          "environment.lighting.color": "#110022"
        });

        // 2. Play ambient pulse
        AudioHelper.play({src: "sounds/ambient-pulse.mp3", volume: 0.4, loop: true}, true);

        // 3. UI Notification
        ui.notifications.error("⚠️ WARNING: ILLEGAL ACCESS DETECTED — BLACK ICE INITIALIZED");
      })()
    `;
    
    await this.foundry.runScript(macroCode, true);
  }
}
