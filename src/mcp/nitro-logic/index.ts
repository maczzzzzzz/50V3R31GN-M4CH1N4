/**
 * nitro-logic MCP Server — The Rules Toolset
 *
 * Exposes deterministic Cyberpunk RED rules resolution tools that proxy to
 * Node A's Llama-3.2-3B-Instruct inference engine via OpenAI-compatible
 * /v1/chat/completions endpoint.
 *
 * Phase 2 Status: Tool schemas and server scaffolding are FULLY DEFINED.
 *   NitroLogicClient (the Node A HTTP client) is the Phase 2 implementation target.
 *   Tools return stub responses until NitroLogicClient is wired up.
 *
 * Transport:  stdio (process.stdin / process.stdout)
 * Config:     .crush.json → mcp.nitro-logic
 * Env vars:   NODE_A_LLAMA_URL (default: http://192.168.0.50:8080/v1)
 *
 * Mistral-Nemo Tool Handshake (CLAUDE.md §KNOWLEDGE_BASE §5):
 *   - id: 9 alphanumeric chars
 *   - type: "function"
 *   - arguments: stringified JSON
 *   - temperature: 0.3, parallel_tool_calls: false
 */

import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ── MCP-safe structured logger (stderr only — never pollutes stdio stream) ────

const logger = {
  info(context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'INFO', context, traceId, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
  warn(context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'WARN', context, traceId, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
  error(context: string, traceId: string, message: string, data?: Record<string, unknown>): void {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'ERROR', context, traceId, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
};

// ── ANSI helpers for Crush CLI / Glamour rendering ────────────────────────────

const ANSI = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

// ── Phase 2 stub response ─────────────────────────────────────────────────────

function stubResponse(toolName: string): { content: Array<{ type: 'text'; text: string }>; isError: boolean } {
  return {
    content: [{
      type: 'text' as const,
      text: [
        ANSI.yellow(`⚠️  nitro-logic: \`${toolName}\` is a Phase 2 stub`),
        ``,
        ANSI.dim('NitroLogicClient (Node A HTTP bridge) has not been implemented yet.'),
        `See **Phase 2 Implementation Target:** \`src/core/nitro-logic-client.ts\``,
        ``,
        `**Node A endpoint:** \`${process.env.NODE_A_LLAMA_URL ?? 'http://192.168.0.50:8080/v1'}\``,
      ].join('\n'),
    }],
    isError: false,
  };
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'nitro-logic',
  version: '0.3.0',
});

// ── Tool: resolve_attack ──────────────────────────────────────────────────────
//
// Resolves a Cyberpunk RED attack roll against the full combat matrix.
// Injects a CoT prompt into Node A: "Explain your math step-by-step before
// providing the final JSON result." (per Phase-1-2-Execution-Roadmap §5).

server.tool(
  'resolve_attack',
  'Resolve a Cyberpunk RED attack roll. Sends attacker stats + weapon + defender REF/SP to Node A (Llama-3.2-3B) with a Chain-of-Thought prompt. Returns hit/miss, damage after armor, and critical injury flag as styled Markdown.',
  {
    attackerSkill: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('Attacker\'s relevant combat skill rank (e.g., Handgun, Brawling)'),
    attackerRef: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe('Attacker\'s REF stat'),
    weaponDamage: z
      .string()
      .describe('Weapon damage dice string (e.g., "3d6", "2d6+1")'),
    weaponArmorPiercing: z
      .boolean()
      .default(false)
      .describe('True if the weapon has Armor Piercing (AP) — halves defender SP'),
    defenderRef: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe('Defender\'s REF stat (used to compute base DV)'),
    defenderSP: z
      .number()
      .int()
      .min(0)
      .describe('Defender\'s Stopping Power after any modifiers'),
    rangeBand: z
      .enum(['melee', 'close', 'medium', 'long', 'extreme'])
      .describe('Current engagement range band'),
    modifiers: z
      .number()
      .int()
      .default(0)
      .describe('Net situational modifier to the attack roll (positive = bonus, negative = penalty)'),
  },
  async (args) => {
    const traceId = randomUUID();
    logger.info('nitro-logic:resolve_attack', traceId, 'Tool called (Phase 2 stub)', args as Record<string, unknown>);
    return stubResponse('resolve_attack');
  },
);

// ── Tool: calculate_dv ───────────────────────────────────────────────────────
//
// Calculates Difficulty Values for skill checks and ranged attacks.
// Node A returns the canonical DV table lookup result.

server.tool(
  'calculate_dv',
  'Calculate the Difficulty Value (DV) for a Cyberpunk RED skill check or ranged attack. Looks up the DV table on Node A and returns the target number with modifier breakdown as styled Markdown.',
  {
    checkType: z
      .enum(['skill', 'ranged_attack', 'melee_attack', 'repair', 'facedown'])
      .describe('Category of check being resolved'),
    baseSkill: z
      .number()
      .int()
      .min(0)
      .max(10)
      .describe('Character\'s skill rank'),
    baseStat: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe('Governing STAT for this check'),
    rangeBand: z
      .enum(['melee', 'close', 'medium', 'long', 'extreme'])
      .optional()
      .describe('Range band (required for ranged_attack checks)'),
    situationalModifiers: z
      .number()
      .int()
      .default(0)
      .describe('Net situational modifiers (positive = easier, negative = harder)'),
    targetDifficulty: z
      .enum(['everyday', 'difficult', 'professional', 'heroic', 'superheroic', 'legendary'])
      .default('professional')
      .describe('Narrative difficulty label (maps to canonical DV table)'),
  },
  async (args) => {
    const traceId = randomUUID();
    logger.info('nitro-logic:calculate_dv', traceId, 'Tool called (Phase 2 stub)', args as Record<string, unknown>);
    return stubResponse('calculate_dv');
  },
);

// ── Tool: oracle_roll ────────────────────────────────────────────────────────
//
// Deterministic dice roller seeded by Node A's LLM for narrative purposes.
// Used for random encounter tables, loot generation, and morale checks.

server.tool(
  'oracle_roll',
  'Execute one or more Cyberpunk RED dice rolls via Node A with full chain-of-thought explainer. Used for random table lookups, morale checks, and loot rolls. Returns roll result, critical flag, and narrative context as styled Markdown.',
  {
    expression: z
      .string()
      .describe('Dice expression to evaluate (e.g., "1d10", "2d6+3", "1d10 LUCK")'),
    context: z
      .string()
      .optional()
      .describe('Narrative context injected into the CoT prompt (e.g., "Maximo is trying to bribe a bouncer")'),
    applyLuck: z
      .boolean()
      .default(false)
      .describe('If true and roll is a Critical Failure (1), spend 1 Luck point to reroll'),
    luckPoints: z
      .number()
      .int()
      .min(0)
      .max(10)
      .default(0)
      .describe('Current Luck pool (only relevant when applyLuck=true)'),
  },
  async (args) => {
    const traceId = randomUUID();
    logger.info('nitro-logic:oracle_roll', traceId, 'Tool called (Phase 2 stub)', args as Record<string, unknown>);
    return stubResponse('oracle_roll');
  },
);

// ── Startup ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const traceId = randomUUID();
  const llamaUrl = process.env.NODE_A_LLAMA_URL ?? 'http://192.168.0.50:8080/v1';

  logger.info('nitro-logic', traceId, 'nitro-logic MCP server starting (Phase 2 stub mode)', {
    llamaUrl,
    toolsRegistered: ['resolve_attack', 'calculate_dv', 'oracle_roll'],
    phase2Target: 'src/core/nitro-logic-client.ts',
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('nitro-logic', traceId, 'nitro-logic MCP server listening on stdio');
}

main().catch(err => {
  process.stderr.write(`[FATAL] nitro-logic startup failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
