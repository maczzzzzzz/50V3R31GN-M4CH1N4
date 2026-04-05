/**
 * nitro-logic MCP Server — The Rules Toolset
 *
 * Exposes deterministic Cyberpunk RED rules resolution tools backed by
 * Node A's Llama-3.2-3B-Instruct inference engine via OpenAI-compatible
 * /v1/chat/completions (llama.cpp).
 *
 * Transport:  stdio (process.stdin / process.stdout)
 * Config:     .crush.json → mcp.nitro-logic
 * Env vars:   NODE_A_LLAMA_URL (default: http://192.168.0.50:8080/v1)
 *             NODE_A_LLAMA_MODEL (default: local-llama)
 *             NODE_A_LLAMA_TIMEOUT_MS (default: 30000)
 *             NODE_A_LLAMA_SEED (default: 42)
 *
 * Mistral-Nemo Tool Handshake (KNOWLEDGE_BASE.md §5):
 *   - id: 9 alphanumeric chars
 *   - type: "function"
 *   - arguments: stringified JSON
 *   - temperature: 0.3, parallel_tool_calls: false
 */

import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { NitroLogicClient } from '../../core/nitro-logic-client.js';

// ── MCP-safe logger (stderr only) ─────────────────────────────────────────────

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

// ── Result formatters ─────────────────────────────────────────────────────────

function formatAttackResult(result: {
  hit: boolean; rollTotal: number; dvTarget: number;
  rawDamage: number; netDamage: number; criticalInjury: boolean; reasoning: string;
}): string {
  const hitLabel = result.hit
    ? ANSI.green('✅ HIT')
    : ANSI.red('❌ MISS');

  const critLabel = result.criticalInjury
    ? ANSI.red(' ⚠️  CRITICAL INJURY')
    : '';

  return [
    ANSI.bold('## nitro-logic · Attack Resolution'),
    '',
    `| Field           | Value |`,
    `|:----------------|------:|`,
    `| Result          | ${hitLabel}${critLabel} |`,
    `| Roll Total      | \`${result.rollTotal}\` |`,
    `| DV Target       | \`${result.dvTarget}\` |`,
    `| Raw Damage      | \`${result.rawDamage}\` |`,
    `| Net Damage      | ${ANSI.cyan(`\`${result.netDamage}\``)} |`,
    '',
    `**Chain of Thought:** ${ANSI.dim(result.reasoning)}`,
  ].join('\n');
}

function formatDvResult(result: { dv: number; breakdown: string; reasoning: string }): string {
  return [
    ANSI.bold('## nitro-logic · DV Calculation'),
    '',
    `| Field      | Value |`,
    `|:-----------|------:|`,
    `| Target DV  | ${ANSI.cyan(ANSI.bold(`\`${result.dv}\``))} |`,
    '',
    `**Breakdown:** ${result.breakdown}`,
    '',
    `**Chain of Thought:** ${ANSI.dim(result.reasoning)}`,
  ].join('\n');
}

function formatOracleResult(result: {
  result: number; isCriticalSuccess: boolean; isCriticalFailure: boolean;
  luckyReroll: number | null; reasoning: string;
}): string {
  let statusLabel: string;
  if (result.isCriticalSuccess) statusLabel = ANSI.green('🎲 CRITICAL SUCCESS (10)');
  else if (result.isCriticalFailure && result.luckyReroll === null) statusLabel = ANSI.red('💀 CRITICAL FAILURE (1)');
  else if (result.luckyReroll !== null) statusLabel = ANSI.yellow(`🍀 LUCKY REROLL (${result.luckyReroll})`);
  else statusLabel = `🎲 ${result.result}`;

  const rerollRow = result.luckyReroll !== null
    ? `| Lucky Reroll | \`${result.luckyReroll}\` |\n`
    : '';

  return [
    ANSI.bold('## nitro-logic · Oracle Roll'),
    '',
    `| Field   | Value |`,
    `|:--------|------:|`,
    `| Result  | ${statusLabel} |`,
    rerollRow.trimEnd(),
    '',
    `**Chain of Thought:** ${ANSI.dim(result.reasoning)}`,
  ].filter(Boolean).join('\n');
}

function formatError(toolName: string, message: string): { content: Array<{ type: 'text'; text: string }>; isError: boolean } {
  return {
    content: [{
      type: 'text' as const,
      text: `${ANSI.red(`❌ nitro-logic: \`${toolName}\` failed`)}\n\n**Error:** ${message}`,
    }],
    isError: true,
  };
}

// ── Configuration ─────────────────────────────────────────────────────────────

const llamaBaseUrl = process.env.NODE_A_LLAMA_URL ?? 'http://192.168.0.50:8080/v1';

const logicClient = new NitroLogicClient({
  baseUrl: llamaBaseUrl,
  model: process.env.NODE_A_LLAMA_MODEL ?? 'local-llama',
  timeoutMs: parseInt(process.env.NODE_A_LLAMA_TIMEOUT_MS ?? '30000', 10),
  seed: parseInt(process.env.NODE_A_LLAMA_SEED ?? '42', 10),
});

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'nitro-logic',
  version: '0.8.3',
});


// ── Tool: resolve_attack ──────────────────────────────────────────────────────

server.tool(
  'resolve_attack',
  'Resolve a Cyberpunk RED attack roll. Sends attacker stats + weapon + defender REF/SP to Node A (Open-Reasoner-Zero-1.5B) with a Chain-of-Thought prompt. Returns hit/miss, damage after armor, and critical injury flag as styled Markdown.',
  {
    attackerSkill: z.number().int().min(0).max(10).describe('Attacker\'s relevant combat skill rank'),
    attackerRef: z.number().int().min(1).max(10).describe('Attacker\'s REF stat'),
    weaponDamage: z.string().describe('Weapon damage dice string (e.g., "3d6", "2d6+1")'),
    weaponArmorPiercing: z.boolean().default(false).describe('True if weapon has Armor Piercing (AP)'),
    defenderRef: z.number().int().min(1).max(10).describe('Defender\'s REF stat'),
    defenderSP: z.number().int().min(0).describe('Defender\'s Stopping Power'),
    rangeBand: z.enum(['melee', 'close', 'medium', 'long', 'extreme']).describe('Current engagement range band'),
    modifiers: z.number().int().default(0).describe('Net situational modifier to the attack roll'),
  },
  async (args) => {
    const traceId = randomUUID();
    logger.info('nitro-logic:resolve_attack', traceId, 'Tool called', args as Record<string, unknown>);

    try {
      const result = await logicClient.resolveAttack(args);
      logger.info('nitro-logic:resolve_attack', traceId, `Resolved: hit=${result.hit}, netDmg=${result.netDamage}`);
      return { content: [{ type: 'text' as const, text: formatAttackResult(result) }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('nitro-logic:resolve_attack', traceId, `Failed: ${message}`);
      return formatError('resolve_attack', message);
    }
  },
);

// ── Tool: calculate_dv ────────────────────────────────────────────────────────

server.tool(
  'calculate_dv',
  'Calculate the Difficulty Value (DV) for a Cyberpunk RED skill check or ranged attack. Looks up the DV table on Node A and returns the target number with modifier breakdown as styled Markdown.',
  {
    checkType: z.enum(['skill', 'ranged_attack', 'melee_attack', 'repair', 'facedown']).describe('Category of check being resolved'),
    baseSkill: z.number().int().min(0).max(10).describe('Character\'s skill rank'),
    baseStat: z.number().int().min(1).max(10).describe('Governing STAT for this check'),
    rangeBand: z.enum(['melee', 'close', 'medium', 'long', 'extreme']).optional().describe('Range band (required for ranged_attack checks)'),
    situationalModifiers: z.number().int().default(0).describe('Net situational modifiers'),
    targetDifficulty: z.enum(['everyday', 'difficult', 'professional', 'heroic', 'superheroic', 'legendary']).default('professional').describe('Narrative difficulty label'),
  },
  async (args) => {
    const traceId = randomUUID();
    logger.info('nitro-logic:calculate_dv', traceId, 'Tool called', args as Record<string, unknown>);

    try {
      const result = await logicClient.calculateDv({
        checkType: args.checkType,
        baseSkill: args.baseSkill,
        baseStat: args.baseStat,
        ...(args.rangeBand !== undefined ? { rangeBand: args.rangeBand } : {}),
        situationalModifiers: args.situationalModifiers,
        targetDifficulty: args.targetDifficulty,
      });
      logger.info('nitro-logic:calculate_dv', traceId, `DV=${result.dv}`);
      return { content: [{ type: 'text' as const, text: formatDvResult(result) }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('nitro-logic:calculate_dv', traceId, `Failed: ${message}`);
      return formatError('calculate_dv', message);
    }
  },
);

// ── Tool: oracle_roll ─────────────────────────────────────────────────────────

server.tool(
  'oracle_roll',
  'Execute one or more Cyberpunk RED dice rolls via Node A with full chain-of-thought explainer. Used for random table lookups, morale checks, and loot rolls. Returns roll result, critical flag, and narrative context as styled Markdown.',
  {
    expression: z.string().describe('Dice expression (e.g., "1d10", "2d6+3")'),
    context: z.string().optional().describe('Narrative context injected into the CoT prompt'),
    applyLuck: z.boolean().default(false).describe('If true and roll is Critical Failure, spend 1 Luck to reroll'),
    luckPoints: z.number().int().min(0).max(10).default(0).describe('Current Luck pool'),
  },
  async (args) => {
    const traceId = randomUUID();
    logger.info('nitro-logic:oracle_roll', traceId, 'Tool called', args as Record<string, unknown>);

    try {
      const result = await logicClient.oracleRoll({
        expression: args.expression,
        ...(args.context !== undefined ? { context: args.context } : {}),
        applyLuck: args.applyLuck,
        luckPoints: args.luckPoints,
      });
      logger.info('nitro-logic:oracle_roll', traceId, `Result=${result.result}, crit=${result.isCriticalSuccess}, fumble=${result.isCriticalFailure}`);
      return { content: [{ type: 'text' as const, text: formatOracleResult(result) }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('nitro-logic:oracle_roll', traceId, `Failed: ${message}`);
      return formatError('oracle_roll', message);
    }
  },
);

// ── Startup ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const traceId = randomUUID();

  logger.info('nitro-logic', traceId, 'nitro-logic MCP server starting', {
    llamaBaseUrl,
    tools: ['resolve_attack', 'calculate_dv', 'oracle_roll'],
  });

  // Non-fatal health check on startup — tools handle connection errors per-call
  const healthy = await logicClient.isHealthy();
  if (healthy) {
    logger.info('nitro-logic', traceId, 'Node A health check passed — ready');
  } else {
    logger.warn('nitro-logic', traceId, 'Node A unreachable at startup — tools will error until Node A is available', { llamaBaseUrl });
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('nitro-logic', traceId, 'nitro-logic MCP server listening on stdio');
}

main().catch(err => {
  process.stderr.write(`[FATAL] nitro-logic startup failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
