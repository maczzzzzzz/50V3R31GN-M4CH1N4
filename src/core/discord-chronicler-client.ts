/**
 * src/core/discord-chronicler-client.ts
 *
 * Thin HTTP client that posts Screamsheet barks to a Discord webhook.
 * Used both by the `discord-chronicler` MCP server and wired directly
 * into the HybridRoutingController for automatic state-mutation events.
 *
 * Error policy: all failures are swallowed and logged — this subsystem
 * must never interrupt the main orchestration loop.
 */

import type { IDiscordChroniclerClient, ScreamsheetPersona } from './interfaces.js';

export class DiscordChroniclerClient implements IDiscordChroniclerClient {
  constructor(private readonly webhookUrl: string) {}

  async screamsheetPost(content: string, persona: ScreamsheetPersona): Promise<void> {
    const res = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, username: persona }),
    });
    if (!res.ok) {
      throw new Error(`Discord webhook responded ${res.status}: ${await res.text()}`);
    }
  }
}
