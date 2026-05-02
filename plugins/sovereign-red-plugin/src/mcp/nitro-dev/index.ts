/**
 * src/mcp/nitro-dev/index.ts
 *
 * Nitro-Dev MCP Server — Unified Mutation Engine (God Mode)
 *
 * Provides high-level surgical control over the 50V3R31GN-M4CH1N4 world engine.
 * Implements the "Unified State Mutation" pattern for clean agentic control.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { UnifiedOracleClient } from '../../db/unified-oracle-client.js';
import dotenv from 'dotenv';

dotenv.config();

const oracle = new UnifiedOracleClient({
  worldDbPath: process.env.WORLD_DB_PATH ?? './world.db',
  crushDbPath: process.env.CRUSH_DB_PATH ?? './.crush/crush.db',
});

const server = new Server(
  {
    name: 'nitro-dev',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'force_world_mutation',
    description: 'Unified tool for surgically mutating world state (God Mode). Bypasses standard simulation loops.',
    inputSchema: {
      type: 'object',
      properties: {
        mutationType: {
          type: 'string',
          enum: ['SET_HP_SP', 'ADD_CRITICAL', 'HL_BOMB', 'SET_MARKET_MULT', 'FORCE_PULSE'],
          description: 'The category of state to override.'
        },
        payload: {
          type: 'object',
          properties: {
            targetId: { type: 'string', description: 'ID of the NPC, Faction, or Item.' },
            value: { type: 'any', description: 'The value to force (number, string, or object).' },
            metadata: { type: 'string', description: 'Optional context (e.g. injury name).' }
          },
          required: ['targetId', 'value']
        }
      },
      required: ['mutationType', 'payload']
    },
  },
  {
    name: 'bypass_approval_queue',
    description: 'Toggle the GM approval queue state globally.',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
      },
      required: ['enabled'],
    },
  },
];

// ── Mutation Logic ────────────────────────────────────────────────────────────

async function handleMutation(type: string, payload: any): Promise<string> {
  if (!oracle.isConnected()) await oracle.connect();

  switch (type) {
    case 'SET_HP_SP': {
      // payload.value can be { hp: 50, sp: 10 }
      const data = typeof payload.value === 'object' ? payload.value : { hp: parseInt(payload.value, 10) };
      await oracle.executeCommand({
        action: 'UPDATE_NPC',
        target: payload.targetId,
        data
      });
      return `NPC ${payload.targetId} stats forced: ${JSON.stringify(data)}`;
    }

    case 'ADD_CRITICAL': {
      // payload.value is the injury name, e.g. "Broken Leg"
      await oracle.executeCommand({
        action: 'ADD_LORE',
        subject: payload.targetId,
        predicate: 'suffers_injury',
        object: payload.value
      });
      return `Critical Injury [${payload.value}] manually inflicted on ${payload.targetId}.`;
    }

    case 'HL_BOMB': {
      // payload.value is the loss amount
      const loss = parseInt(payload.value, 10);
      const [current] = oracle.query('SELECT humanity FROM npcs WHERE id = ?', [payload.targetId]);
      if (!current) throw new Error(`NPC ${payload.targetId} not found.`);
      
      const newHumanity = Math.max(0, current.humanity - loss);
      await oracle.executeCommand({
        action: 'UPDATE_NPC',
        target: payload.targetId,
        data: { humanity: newHumanity }
      });
      return `HL BOMB detonated on ${payload.targetId}: -${loss} Humanity (New Total: ${newHumanity}).`;
    }

    case 'SET_MARKET_MULT': {
      // Force economy multiplier for a vendor
      await oracle.executeCommand({
        action: 'ADD_LORE',
        subject: payload.targetId, // Vendor Name
        predicate: 'market_multiplier',
        object: payload.value.toString()
      });
      return `Vendor ${payload.targetId} price multiplier forced to x${payload.value}.`;
    }

    case 'FORCE_PULSE': {
      // Force faction strength shift
      oracle.execute(
        'UPDATE district_grid SET strength = ? WHERE faction_name = ? AND x=0 AND y=0',
        [parseInt(payload.value, 10), payload.targetId]
      );
      return `Pulse Event forced: ${payload.targetId} strength set to ${payload.value}.`;
    }

    default:
      throw new Error(`Unknown mutation type: ${type}`);
  }
}

// ── Request Handlers ──────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'force_world_mutation') {
      const { mutationType, payload } = z.object({
        mutationType: z.string(),
        payload: z.any(),
      }).parse(args);

      const result = await handleMutation(mutationType, payload);
      return { content: [{ type: 'text', text: `✅ GOD MODE: ${result}` }] };
    }

    if (name === 'bypass_approval_queue') {
      const { enabled } = z.object({ enabled: z.boolean() }).parse(args);
      // Implementation of global bypass flag (saved in session_memory)
      await oracle.executeCommand({
        action: 'ADD_LORE',
        subject: 'SYSTEM',
        predicate: 'bypass_approval',
        object: enabled ? 'TRUE' : 'FALSE'
      });
      return { content: [{ type: 'text', text: `✅ GOD MODE: Approval queue bypass set to ${enabled}.` }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `❌ ERROR: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in nitro-dev MCP server:', error);
  process.exit(1);
});
