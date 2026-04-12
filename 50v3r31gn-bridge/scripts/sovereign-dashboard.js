/**
 * sovereign-dashboard.js — 50V3R31GN-M4CH1N4 Dashboard Bridge
 *
 * Registers a Foundry VTT ApplicationV2 window that iframes the Shadow
 * Dashboard (http://localhost:3000) and handles the GH057_B007 trigger
 * which fires the existing easy-phasey boot sequence.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class SovereignDashboard extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "sovereign-dashboard",
    window: {
      title: "◈ 5H4D0W_D45HB04RD [50V3R31GN_MN7R]",
      resizable: true,
      minimizable: true,
    },
    position: {
      width: 900,
      height: 620,
      top: 60,
      left: 60,
    },
  };

  /** Render the iframe shell directly — no Handlebars template needed. */
  async _renderHTML(_context, _options) {
    const div = document.createElement("div");
    div.style.cssText = "width:100%;height:100%;margin:0;padding:0;overflow:hidden;background:#0a0a0a;";

    const iframe = document.createElement("iframe");
    iframe.src = "http://localhost:3000";
    iframe.style.cssText = "width:100%;height:100%;border:none;";
    iframe.allow = "autoplay";
    iframe.title = "Shadow Dashboard";

    div.appendChild(iframe);
    return div;
  }

  /** Replace the default content element with our rendered div. */
  _replaceHTML(result, content, _options) {
    content.replaceChildren(result);
  }
}

// ── GH057_B007 postMessage listener ──────────────────────────────────────────

/**
 * Fires the easy-phasey boot sequence (Phase 23 Ghost Protocol).
 * Dispatches a Foundry hook so other modules can react.
 */
function triggerGhostBoot() {
  console.log("[SOVEREIGN] GH057_B007 received — initiating boot glitch sequence");
  Hooks.callAll("sovereignGhostBoot");

  // Trigger the easy-phasey scene transition if socketlib is available
  try {
    if (typeof socketlib !== "undefined" && game.user?.isGM) {
      socketlib.system.executeAsGM("easyPhaseyBoot", {
        source: "ghost-dashboard",
        intensity: 1.0,
      });
    }
  } catch (e) {
    // Fallback: emit a direct game socket intent
    game.socket?.emit("module.50v3r31gn-bridge", {
      type: "GH057_B007",
      timestamp: Date.now(),
    });
  }
}

window.addEventListener("message", (event) => {
  // Accept messages from the localhost dashboard origin only
  if (event.origin !== "http://localhost:3000") return;
  const data = event.data;
  if (data?.type === "GH057_B007" && data?.source === "shadow-dashboard") {
    triggerGhostBoot();
  }
});

// ── Registration ──────────────────────────────────────────────────────────────

function registerDashboard() {
  if (game.sovereignDashboard) return;
  // Expose global instance for console access
  game.sovereignDashboard = new SovereignDashboard();
  console.log("[SOVEREIGN] Dashboard bridge registered — Ctrl+Shift+D to open");
}

if (game.ready) {
  registerDashboard();
} else {
  Hooks.once("ready", registerDashboard);
}
