/**
 * src/mcp/discord-chronicler/index.ts
 *
 * Stdio MCP server that exposes the `screamsheet_post` tool.
 * Attach to Crush CLI via .crush.json:
 *
 *   "discord-chronicler": {
 *     "type": "stdio",
 *     "command": "node",
 *     "args": ["dist/mcp/discord-chronicler/index.js"],
 *     "env": { "DISCORD_SCREAMSHEET_WEBHOOK": "https://discord.com/api/webhooks/..." }
 *   }
 *
 * ENV:
 *   DISCORD_SCREAMSHEET_WEBHOOK — required, the full Discord webhook URL.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DiscordChroniclerClient } from '../../core/discord-chronicler-client.js';
import type { ScreamsheetPersona } from '../../core/interfaces.js';

const webhookUrl = process.env['DISCORD_SCREAMSHEET_WEBHOOK'];
if (!webhookUrl) {
  console.error('[discord-chronicler] DISCORD_SCREAMSHEET_WEBHOOK is not set.');
  process.exit(1);
}

const client = new DiscordChroniclerClient(webhookUrl);

const server = new McpServer({ name: 'discord-chronicler', version: '1.0.0' });

const VALID_PERSONAS = ['Netwatch Alerts', 'NCPD Scanner', 'Street Rumor'] as const;

server.tool(
  'screamsheet_post',
  {
    content: z.string().min(1).describe('The screamsheet text to broadcast.'),
    persona: z
      .enum(VALID_PERSONAS)
      .describe('Narrative voice: "Netwatch Alerts" | "NCPD Scanner" | "Street Rumor".'),
  },
  async ({ content, persona }) => {
    await client.screamsheetPost(content, persona as ScreamsheetPersona);
    return {
      content: [{ type: 'text' as const, text: `✅ Screamsheet posted as "${persona}".` }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
