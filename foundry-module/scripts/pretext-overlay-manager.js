/**
 * pretext-overlay-manager.js
 *
 * Phase 17: Layout Sovereignty (Pretext Engine)
 * Manages the high-performance canvas overlay for 0-reflow text rendering.
 */

export class PretextOverlayManager {
  static init() {
    console.log("PretextOverlayManager Initialized");
    this.activeOverlays = new Map();
  }

  /**
   * Draws a dynamic status overlay over a token using a detached canvas.
   * @param {PretextOverlayPayload} payload 
   */
  static async drawOverlay(payload) {
    const token = canvas.tokens.get(payload.targetId);
    if (!token) {
      console.warn(`[Pretext] Token ${payload.targetId} not found for overlay.`);
      return;
    }

    console.log(`[Pretext] Drawing overlay: "${payload.text}" for actor ${payload.targetId}`);

    // 1. Create/Get Overlay Container
    let container = this.activeOverlays.get(payload.targetId);
    if (!container) {
      container = new PIXI.Container();
      container.name = `pretext-${payload.targetId}`;
      canvas.effects.addChild(container);
      this.activeOverlays.set(payload.targetId, container);
    }

    // 2. Render Text via Pretext (Conceptual PIXI.Text for now, can be optimized with raw canvas)
    // We use a high-fidelity style to mimic the "Pretext" aesthetic.
    const style = new PIXI.TextStyle({
      fontFamily: 'monospace',
      fontSize: 24,
      fontWeight: 'bold',
      fill: payload.color || '#ff003c',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowDistance: 2,
    });

    const text = new PIXI.Text(payload.text, style);
    text.anchor.set(0.5, 1);
    text.position.set(token.center.x, token.y - 20);
    container.addChild(text);

    // 2b. Optional Glitch/Parseltongue Effect
    if (payload.glitch) {
      const originalText = payload.text;
      const glitchChars = "0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\░▒▓█";
      const leetMap = { 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'g': '6', 'b': '8' };
      
      const glitchInterval = setInterval(() => {
        if (!text.parent) {
          clearInterval(glitchInterval);
          return;
        }
        
        let newText = "";
        for (let i = 0; i < originalText.length; i++) {
          const char = originalText[i].toLowerCase();
          if (Math.random() < 0.2) {
            // Random glitch char
            newText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
          } else if (leetMap[char] && Math.random() < 0.5) {
            // Leet speak conversion
            newText += leetMap[char];
          } else {
            newText += originalText[i];
          }
        }
        text.text = newText;
      }, 100);

      // Ensure cleanup
      setTimeout(() => clearInterval(glitchInterval), payload.duration || 3000);
    }

    // 3. Apply FXMaster Shaders if requested
    if (payload.fxParams && window.FXMASTER && game.modules.get('fxmaster')?.active) {
      const filterName = `pretext-fx-${payload.targetId}-${Date.now()}`;
      try {
        await FXMASTER.filters.addFilter(filterName, payload.fxParams.shader, payload.fxParams);
        
        // Auto-cleanup FX after duration
        setTimeout(() => {
          FXMASTER.filters.removeFilter(filterName);
        }, payload.duration || 3000);
      } catch (err) {
        console.error(`[Pretext] FXMaster error:`, err);
      }
    }

    // 4. Animation and Cleanup
    const duration = payload.duration || 3000;
    
    // Simple upward float and fade
    const startY = text.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        text.y = startY - (progress * 50);
        text.alpha = 1 - progress;
        requestAnimationFrame(animate);
      } else {
        container.removeChild(text);
        if (container.children.length === 0) {
          canvas.effects.removeChild(container);
          this.activeOverlays.delete(payload.targetId);
        }
      }
    };

    requestAnimationFrame(animate);
  }
}
