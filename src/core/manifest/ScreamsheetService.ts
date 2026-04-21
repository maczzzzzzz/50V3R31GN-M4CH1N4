/**
 * src/core/manifest/ScreamsheetService.ts
 *
 * Phase 64 — Screamsheet Factory (Data Mesh)
 *
 * Subscribes to WORLD_EVENT emitter, packages event data into an
 * Architect prompt, calls the Director (Node B) to generate an SVG
 * Night Market flyer, then relays the result to Foundry VTT via
 * the `render_screamsheet` VSB command through the 50v3r31gn-bridge.
 *
 * SVG layout invariants (from screamsheet-architect.md skill):
 *   - 600×800px canvas, dark background #0d0d0d
 *   - Five bento-grid segments: header, body, stats, image, footer
 *   - VT323 font, #00ff88 primary, #ff2233 accent
 *   - GLSL-inspired scanline filter overlay
 */

import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

// ---------------------------------------------------------------------------
// World event types
// ---------------------------------------------------------------------------

export interface WorldEvent {
  type: 'NIGHT_MARKET' | 'COMBAT_RESULT' | 'FACTION_UPDATE' | 'CUSTOM';
  location: string;
  title: string;
  body: string;
  stats?: Record<string, string | number>;
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// VSB relay interface
// ---------------------------------------------------------------------------

export interface VsbRelay {
  sendCommand(type: string, payload: Record<string, unknown>): Promise<void>;
}

// ---------------------------------------------------------------------------
// Director client (Node B inference)
// ---------------------------------------------------------------------------

const DIRECTOR_URL =
  process.env.NODE_B_DIRECTOR_URL ?? 'http://10.0.0.20:7339/v1';

async function generateSvg(event: WorldEvent): Promise<string> {
  const statsBlock = event.stats
    ? Object.entries(event.stats).map(([k, v]) => `${k}: ${v}`).join(' | ')
    : '';

  const prompt = [
    `You are the Screamsheet Architect — generate a Night Market SVG broadcast flyer.`,
    `Event: ${event.title}`,
    `Location: ${event.location}`,
    `Body: ${event.body}`,
    statsBlock ? `Stats: ${statsBlock}` : '',
    ``,
    `Output ONLY a complete SVG string (600×800px). Rules:`,
    `- Background: #0d0d0d`,
    `- Font: VT323 (Google Fonts import or system fallback)`,
    `- Primary color: #00ff88. Accent: #ff2233.`,
    `- Five bento segments: header (title), body (news text), stats bar, image placeholder rect, footer (timestamp).`,
    `- Include a <filter id="scanlines"> with feTurbulence + feComposite for CRT effect.`,
    `- No external image refs. All content inline.`,
  ].filter(Boolean).join('\n');

  const res = await fetch(`${DIRECTOR_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'local-director',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) throw new Error(`Director SVG generation failed: ${res.status}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  const content = data.choices[0]?.message?.content ?? '';

  // Extract SVG block if Director wraps it in markdown
  const svgMatch = content.match(/<svg[\s\S]*<\/svg>/i);
  return svgMatch ? svgMatch[0] : content;
}

// ---------------------------------------------------------------------------
// ScreamsheetService
// ---------------------------------------------------------------------------

export class ScreamsheetService {
  private emitter: EventEmitter;
  private relay: VsbRelay;
  private processing = false;

  constructor(emitter: EventEmitter, relay: VsbRelay) {
    this.emitter = emitter;
    this.relay   = relay;
    this._bindListeners();
  }

  private _bindListeners(): void {
    this.emitter.on('WORLD_EVENT', (event: WorldEvent) => {
      void this._handleWorldEvent(event);
    });
  }

  private async _handleWorldEvent(event: WorldEvent): Promise<void> {
    if (this.processing) return; // one screamsheet at a time
    this.processing = true;

    const traceId = randomUUID();
    try {
      process.stderr.write(`[screamsheet:${traceId}] Generating SVG for "${event.title}"…\n`);
      const svg = await generateSvg(event);

      await this.relay.sendCommand('render_screamsheet', {
        svg,
        title: `SCREAMSHEET_${event.title.toUpperCase().replace(/\s+/g, '_')}`,
        traceId,
      });

      process.stderr.write(`[screamsheet:${traceId}] SVG relayed to Foundry (${svg.length} bytes)\n`);
    } catch (err) {
      process.stderr.write(`[screamsheet:${traceId}] ERROR: ${err instanceof Error ? err.message : String(err)}\n`);
    } finally {
      this.processing = false;
    }
  }

  /** Manually trigger a screamsheet for testing */
  async trigger(event: WorldEvent): Promise<void> {
    await this._handleWorldEvent(event);
  }
}
