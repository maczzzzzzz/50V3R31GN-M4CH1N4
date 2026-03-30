/**
 * src/shared/schemas/foundry-bridge.schema.ts
 *
 * Zod contracts for the Foundry VTT v12 WebSocket bridge protocol.
 *
 * Architecture (Palantiri-style Reverse Proxy):
 *   - Node B runs a WebSocket SERVER (FoundryAdapter, port 3010)
 *   - The Foundry bridge module connects OUTBOUND to Node B
 *   - Node B PUSHES commands down that established channel
 *   - Foundry executes each command and replies with a response
 *
 * Command flow (Node B → Foundry):
 *   1. Node B sends a BridgeCommand JSON frame over the WS channel
 *   2. Foundry executes (ChatMessage.create, Actor.get, simple-phone flag, etc.)
 *   3. Foundry replies with a BridgeResponse JSON frame
 *
 * All frames are Zod-validated on BOTH ends.
 *
 * Phase 3 MVP commands (5 total):
 *   - chat_message    → ChatMessage.create()
 *   - read_actor      → game.actors.get(id).toObject()
 *   - simple_phone    → simple-phone / smartphone-widget flag payload
 *   - dice_roll       → game.dice (returns resolved numeric result)
 *   - scene_activate  → game.scenes.get(id).activate()
 */

import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

/**
 * 9-character alphanumeric requestId matching the Mistral-Nemo handshake spec.
 * Used to correlate BridgeCommands with their BridgeResponses.
 */
export const RequestIdSchema = z.string().regex(/^[a-z0-9]{9}$/, 'requestId must be 9 lowercase alphanumeric chars');

// ── Command payloads ──────────────────────────────────────────────────────────

/**
 * Push a message into the Foundry VTT chat log.
 * Mirrors the ChatMessage.create() data contract in v12.
 */
export const ChatMessagePayloadSchema = z.object({
  /** Chat content (HTML string or plain text). */
  content: z.string().min(1),
  /**
   * 0 = OTHER, 1 = OOC, 2 = IC, 3 = EMOTE.
   * Use type 1 (OOC) for GM system messages, type 2 (IC) for in-character prose.
   */
  type: z.number().int().min(0).max(3).default(1),
  /** Optional speaker override. Defaults to GM Assistant alias. */
  speaker: z.object({ alias: z.string() }).optional(),
  /** Flags forwarded to the ChatMessage document. */
  flags: z.record(z.unknown()).optional(),
});

/**
 * Read a Foundry Actor document and return its plain object representation.
 */
export const ReadActorPayloadSchema = z.object({
  /** The Foundry document id of the actor (16-char hex string in v12). */
  actorId: z.string().min(1),
});

/**
 * Trigger the `simple-phone` / `smartphone-widget` module to display a
 * Fixer phone call or text message in the Foundry UI.
 *
 * Follows the TttA `simple-phone` flag contract:
 *   - flags.smartphone-widget.isPhoneMessage = true
 *   - flags.smartphone-widget.senderNumber = canonical Fixer number
 */
export const SimplePhonePayloadSchema = z.object({
  /** Canonical Fixer phone number (e.g. "555-ROGUE"). */
  senderNumber: z.string().min(1),
  /** Message body — the Fixer's text. */
  body: z.string().min(1),
  /** "text" for SMS-style, "system" for system notification. */
  messageType: z.enum(['text', 'system']).default('text'),
  /** UI app that renders the message. */
  app: z.literal('messages').default('messages'),
});

/**
 * Execute a dice expression inside Foundry (uses game.dice / Roll.evaluate)
 * and return the total numeric result.
 */
export const DiceRollPayloadSchema = z.object({
  /** Standard Foundry Roll formula (e.g. "1d10", "3d6+2"). */
  formula: z.string().min(1),
});

/**
 * Activate a Foundry scene (equivalent to game.scenes.get(id).activate()).
 */
export const SceneActivatePayloadSchema = z.object({
  /** The Foundry scene document id. */
  sceneId: z.string().min(1),
});

// ── Command discriminated union ───────────────────────────────────────────────

export const ChatMessageCommandSchema = z.object({
  type: z.literal('chat_message'),
  requestId: RequestIdSchema,
  payload: ChatMessagePayloadSchema,
});

export const ReadActorCommandSchema = z.object({
  type: z.literal('read_actor'),
  requestId: RequestIdSchema,
  payload: ReadActorPayloadSchema,
});

export const SimplePhoneCommandSchema = z.object({
  type: z.literal('simple_phone'),
  requestId: RequestIdSchema,
  payload: SimplePhonePayloadSchema,
});

export const DiceRollCommandSchema = z.object({
  type: z.literal('dice_roll'),
  requestId: RequestIdSchema,
  payload: DiceRollPayloadSchema,
});

export const SceneActivateCommandSchema = z.object({
  type: z.literal('scene_activate'),
  requestId: RequestIdSchema,
  payload: SceneActivatePayloadSchema,
});

/** All valid commands from Node B → Foundry. */
export const BridgeCommandSchema = z.discriminatedUnion('type', [
  ChatMessageCommandSchema,
  ReadActorCommandSchema,
  SimplePhoneCommandSchema,
  DiceRollCommandSchema,
  SceneActivateCommandSchema,
]);

// ── Response schemas ──────────────────────────────────────────────────────────

export const SuccessResponseSchema = z.object({
  type: z.literal('success'),
  requestId: RequestIdSchema,
  /** Optional data payload — present for read_actor and dice_roll responses. */
  data: z.unknown().nullable().default(null),
});

export const ErrorResponseSchema = z.object({
  type: z.literal('error'),
  requestId: RequestIdSchema,
  message: z.string().min(1),
});

/** All valid responses from Foundry → Node B. */
export const BridgeResponseSchema = z.discriminatedUnion('type', [
  SuccessResponseSchema,
  ErrorResponseSchema,
]);

// ── Foundry → Node B event schemas (inbound events from Foundry) ──────────────
// These are events that the Foundry client pushes UP to Node B (e.g. player
// action triggers). Node B's HybridRoutingController handles these.

export const ResolveAttackEventSchema = z.object({
  type: z.literal('resolve_attack'),
  payload: z.object({
    attackerSkill: z.number().int().min(0).max(10),
    attackerRef: z.number().int().min(1).max(10),
    weaponDamage: z.string(),
    weaponArmorPiercing: z.boolean(),
    defenderRef: z.number().int().min(1).max(10),
    defenderSP: z.number().int().min(0),
    rangeBand: z.enum(['melee', 'close', 'medium', 'long', 'extreme']),
    modifiers: z.number().int().default(0),
  }),
});

export const CalculateDvEventSchema = z.object({
  type: z.literal('calculate_dv'),
  payload: z.object({
    checkType: z.enum(['skill', 'ranged_attack', 'melee_attack', 'repair', 'facedown']),
    baseSkill: z.number().int().min(0).max(10),
    baseStat: z.number().int().min(1).max(10),
    rangeBand: z.enum(['melee', 'close', 'medium', 'long', 'extreme']).optional(),
    situationalModifiers: z.number().int().default(0),
    targetDifficulty: z.enum(['everyday', 'difficult', 'professional', 'heroic', 'superheroic', 'legendary']).default('professional'),
  }),
});

export const OracleRollEventSchema = z.object({
  type: z.literal('oracle_roll'),
  payload: z.object({
    expression: z.string().min(1),
    context: z.string().optional(),
    applyLuck: z.boolean().default(false),
    luckPoints: z.number().int().min(0).max(10).default(0),
  }),
});

export const ReadActorEventSchema = z.object({
  type: z.literal('read_actor'),
  payload: z.object({
    actorId: z.string().min(1),
  }),
});

/** All valid inbound events from Foundry → Node B (HybridRoutingController input). */
export const FoundryEventSchema = z.discriminatedUnion('type', [
  ResolveAttackEventSchema,
  CalculateDvEventSchema,
  OracleRollEventSchema,
  ReadActorEventSchema,
]);

// ── Inferred TypeScript types ─────────────────────────────────────────────────

export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;
export type ReadActorPayload = z.infer<typeof ReadActorPayloadSchema>;
export type SimplePhonePayload = z.infer<typeof SimplePhonePayloadSchema>;
export type DiceRollPayload = z.infer<typeof DiceRollPayloadSchema>;
export type SceneActivatePayload = z.infer<typeof SceneActivatePayloadSchema>;

export type ChatMessageCommand = z.infer<typeof ChatMessageCommandSchema>;
export type ReadActorCommand = z.infer<typeof ReadActorCommandSchema>;
export type SimplePhoneCommand = z.infer<typeof SimplePhoneCommandSchema>;
export type DiceRollCommand = z.infer<typeof DiceRollCommandSchema>;
export type SceneActivateCommand = z.infer<typeof SceneActivateCommandSchema>;
export type BridgeCommand = z.infer<typeof BridgeCommandSchema>;

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type BridgeResponse = z.infer<typeof BridgeResponseSchema>;

export type FoundryEvent = z.infer<typeof FoundryEventSchema>;
