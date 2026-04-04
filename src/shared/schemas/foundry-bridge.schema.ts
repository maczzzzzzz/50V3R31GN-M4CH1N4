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
 * Visual-only 3D dice trigger for immersion.
 * Uses Dice So Nice API to show a roll matching Node A's result.
 */
export const Show3dDicePayloadSchema = z.object({
  formula: z.string().min(1),
  /** The pre-calculated result from Node A to display visually. */
  result: z.number().int(),
  /** Optional speaker for the roll sound/effects. */
  speaker: z.object({ alias: z.string() }).optional(),
});

/**
 * Activate a Foundry scene (equivalent to game.scenes.get(id).activate()).
 */
export const SceneActivatePayloadSchema = z.object({
  /** The Foundry scene document id. */
  sceneId: z.string().min(1),
});

/**
 * A single item in the Afterlife Night Market storefront.
 * Mirrors MarketItem from NightMarketService, serialised for bridge transport.
 */
export const MarketItemPayloadSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  costEb: z.number().nonnegative(),
  costEagles: z.number().nonnegative(),
  vendor: z.string().min(1),
});

/**
 * Open the Afterlife Night Market storefront Dialog in Foundry.
 * Node B fetches inventory from NightMarketService and pushes the rendered list.
 */
export const OpenNightMarketPayloadSchema = z.object({
  /** The Foundry actor id for the purchasing player. */
  actorId: z.string().min(1),
  /** The vendor stall to open (e.g. "Mr. Connors"). */
  vendorName: z.string().min(1),
  /** Pre-fetched item list from NightMarketService. */
  items: z.array(MarketItemPayloadSchema),
});

/**
 * Create a new Foundry Actor document with Cyberpunk RED character data.
 * Used by the AI GM to materialise NPCs and player characters into the world.
 */
export const CreateActorPayloadSchema = z.object({
  /** Display name for the actor. */
  name: z.string().min(1),
  /** Cyberpunk RED role (e.g. "Solo", "Netrunner", "Rockerboy"). */
  role: z.string().min(1),
  /** Base stats — keys are uppercase abbreviations (INT, REF, DEX, TECH, COOL, WILL, LUCK, MOVE, BODY, EMP). */
  stats: z.record(z.number().int().min(1).max(10)),
  /** AI-generated backstory written to the Actor's journal. */
  bio: z.string(),
  /** Item names to seed from the world's items compendium on creation. */
  seedItems: z.array(z.string()),
});

/**
 * Trigger a GPU-accelerated screen glitch effect via FXMaster (Phase 15).
 * Falls back to CSS body class injection if FXMaster is unavailable.
 */
export const FxGlitchPayloadSchema = z.object({
  /** Glitch intensity scalar (0.0–3.0). Default 1.0. */
  intensity: z.number().min(0).max(3).default(1.0),
});

/**
 * A single action within a Sequencer sequence (Phase 15).
 * Only 'effect' type is currently supported.
 */
export const SequenceActionSchema = z.object({
  type: z.literal('effect'),
  /** Path to the effect file (relative to Foundry data root or URL). */
  file: z.string().min(1),
  /** Canvas coordinates for the effect anchor point. */
  location: z.object({ x: z.number(), y: z.number() }),
  /** Scale factor for the effect. Default 1.0. */
  scale: z.number().positive().optional(),
  /** Optional actor ID — used by the raw CDP fallback for token spawning. */
  actorId: z.string().optional(),
});

/**
 * Run an atomic Sequencer sequence (Phase 15).
 * Falls back to raw Architect Pass (CDP token/light spawn) if Sequencer is absent.
 */
export const RunSequencePayloadSchema = z.object({
  actions: z.array(SequenceActionSchema).min(1),
});

/**
 * Render a reactive, zero-reflow dynamic status overlay via Pretext (Phase 17).
 */
export const PretextOverlayPayloadSchema = z.object({
  targetId: z.string(),
  overlayType: z.enum(['critical_damage', 'death_state', 'drug_ingestion']),
  text: z.string(),
  color: z.string(),
  duration: z.number(),
  fxParams: z.object({
    shader: z.string(),
    intensity: z.number(),
    rgbSplit: z.number().optional()
  }).optional()
});

/**
 * Update a Foundry Actor document.
 */
export const UpdateActorPayloadSchema = z.object({
  /** The Foundry document id of the actor. */
  actorId: z.string().min(1),
  /** The updates to apply (e.g. { "system.wealth.eb": 100 }). */
  updates: z.record(z.unknown()),
});

/**
 * Queue a change for human (GM) approval.
 */
export const QueueApprovalPayloadSchema = z.object({
  /** Unique ID for the proposal. */
  proposalId: z.string().min(1),
  /** Type of change (e.g. "item_addition", "state_transition"). */
  type: z.string().min(1),
  /** The proposed data. */
  data: z.unknown(),
  /** Optional Zod schema (as a string or object) to validate the edit. */
  schema: z.string().optional(),
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

export const FxGlitchCommandSchema = z.object({
  type: z.literal('fx_glitch'),
  requestId: RequestIdSchema,
  payload: FxGlitchPayloadSchema,
});

export const RunSequenceCommandSchema = z.object({
  type: z.literal('run_sequence'),
  requestId: RequestIdSchema,
  payload: RunSequencePayloadSchema,
});

export const PretextOverlayCommandSchema = z.object({
  type: z.literal('pretext_overlay'),
  requestId: RequestIdSchema,
  payload: PretextOverlayPayloadSchema,
});

export const UpdateActorCommandSchema = z.object({
  type: z.literal('update_actor'),
  requestId: RequestIdSchema,
  payload: UpdateActorPayloadSchema,
});

export const QueueApprovalCommandSchema = z.object({
  type: z.literal('queue_approval'),
  requestId: RequestIdSchema,
  payload: QueueApprovalPayloadSchema,
});

export const OpenNightMarketCommandSchema = z.object({
  type: z.literal('open_night_market'),
  requestId: RequestIdSchema,
  payload: OpenNightMarketPayloadSchema,
});

export const CreateActorCommandSchema = z.object({
  type: z.literal('create_actor'),
  requestId: RequestIdSchema,
  payload: CreateActorPayloadSchema,
});

export const Show3dDiceCommandSchema = z.object({
  type: z.literal('show_3d_dice'),
  requestId: RequestIdSchema,
  payload: Show3dDicePayloadSchema,
});

/** Query the list of available scenes in the world. */
export const QueryScenesPayloadSchema = z.object({
  /** Optional filter by name. */
  filter: z.string().optional(),
});

/** Dashboard synchronization payload for the Night City Sidebar. */
export const DashboardSyncPayloadSchema = z.object({
  actors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    hp: z.number().int(),
    sp: z.number().int(),
    humanity: z.number().int(),
    disposition: z.enum(['friendly', 'neutral', 'hostile']),
  })),
  factions: z.array(z.object({
    name: z.string(),
    strength: z.number().int(),
    relationship: z.number().int(),
  })),
  systemStatus: z.object({
    nodeA: z.boolean(),
    pulseActive: z.boolean(),
    authRequired: z.boolean(),
  }),
});

/** All valid commands from Node B → Foundry. */
export const BridgeCommandSchema = z.discriminatedUnion('type', [
  ChatMessageCommandSchema,
  ReadActorCommandSchema,
  SimplePhoneCommandSchema,
  DiceRollCommandSchema,
  SceneActivateCommandSchema,
  UpdateActorCommandSchema,
  QueueApprovalCommandSchema,
  OpenNightMarketCommandSchema,
  CreateActorCommandSchema,
  Show3dDiceCommandSchema,
  FxGlitchCommandSchema,
  RunSequenceCommandSchema,
  PretextOverlayCommandSchema,
  z.object({ type: z.literal('query_scenes'), requestId: RequestIdSchema, payload: z.object({ filter: z.string().optional() }) }),
  z.object({ type: z.literal('dashboard_sync'), requestId: RequestIdSchema, payload: DashboardSyncPayloadSchema }),
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

export const SpatialContextSchema = z.object({
  sceneId: z.string().min(1),
  /** Normalized X coordinate (0-1000). */
  x: z.number().min(0).max(1000),
  /** Normalized Y coordinate (0-1000). */
  y: z.number().min(0).max(1000),
});

export const ResolveAttackEventSchema = z.object({
  type: z.literal('resolve_attack'),
  payload: z.object({
    /** Unique ID of the target actor (required for Oracle synchronization). */
    targetId: z.string().min(1).optional(),
    attackerSkill: z.number().int().min(0).max(10),
    attackerRef: z.number().int().min(1).max(10),
    weaponDamage: z.string(),
    weaponArmorPiercing: z.boolean(),
    defenderRef: z.number().int().min(1).max(10),
    defenderSP: z.number().int().min(0),
    rangeBand: z.enum(['melee', 'close', 'medium', 'long', 'extreme']),
    modifiers: z.number().int().default(0),
    /** Optional spatial context for narrative grounding. */
    spatial: SpatialContextSchema.optional(),
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
    spatial: SpatialContextSchema.optional(),
  }),
});

export const OracleRollEventSchema = z.object({
  type: z.literal('oracle_roll'),
  payload: z.object({
    expression: z.string().min(1),
    context: z.string().optional(),
    applyLuck: z.boolean().default(false),
    luckPoints: z.number().int().min(0).max(10).default(0),
    spatial: SpatialContextSchema.optional(),
  }),
});

export const ReadActorEventSchema = z.object({
  type: z.literal('read_actor'),
  payload: z.object({
    actorId: z.string().min(1),
  }),
});

export const BuyItemEventSchema = z.object({
  type: z.literal('buy_item'),
  payload: z.object({
    itemId: z.string().min(1),
    costEb: z.number().nonnegative(),
    costEagles: z.number().nonnegative(),
    vendor: z.string().min(1),
    actorId: z.string().min(1),
  }),
});

export const ApprovalResponseEventSchema = z.object({
  type: z.literal('approval_response'),
  payload: z.object({
    proposalId: z.string().min(1),
    status: z.enum(['approved', 'denied', 'edited']),
    editedData: z.unknown().optional(),
  }),
});

/**
 * Request from Foundry to open the Night Market UI for a specific vendor.
 * Node B will fetch inventory and push an open_night_market command back.
 */
export const OpenNightMarketEventSchema = z.object({
  type: z.literal('open_night_market'),
  payload: z.object({
    actorId: z.string().min(1),
    vendorName: z.string().min(1),
  }),
});

/**
 * Trigger a Friction Engine tick during a Red Trade transit.
 * Node B rolls 1d10 + currentFriction and pushes the outcome to Foundry chat.
 */
export const RedTradeTransitEventSchema = z.object({
  type: z.literal('red_trade_transit'),
  payload: z.object({
    /** The faction being transited through (used for world-state lookup). */
    factionId: z.string().min(1),
    /** Current friction_pool value for this faction (0–10). */
    currentFriction: z.number().int().min(0).max(10),
  }),
});

/**
 * Request a full Mission Blueprint for a given Night City district.
 * Triggers the MissionSwarmOrchestrator (Phase 13).
 */
export const GenerateMissionEventSchema = z.object({
  type: z.literal('generate_mission'),
  payload: z.object({
    /** Night City district name (e.g. "Watson", "Heywood", "Pacifica"). */
    district: z.string().optional(),
  }),
});

/**
 * Stamp a damage decal onto the Foundry canvas via CDP DrawingDocument.create.
 * Neural Decal Injector (Phase 14, Task 2).
 */
export const ApplyDecalEventSchema = z.object({
  type: z.literal('apply_decal'),
  payload: z.object({
    sceneId: z.string().optional(),
    type: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    scale: z.number().optional(),
    intensity: z.number().optional(),
  }),
});

/**
 * Notify Node B that a scene has been activated in Foundry.
 * Triggers Latent Atmosphere Persistence auto-restore (Phase 14, Task 3).
 */
export const SceneActivateEventSchema = z.object({
  type: z.literal('scene_activate'),
  payload: z.object({ sceneId: z.string().optional() }),
});

/**
 * Triggered when a player extracts a file (Phase 17).
 * Node B will generate a steganographic image drop.
 */
export const FileExtractionEventSchema = z.object({
  type: z.literal('file_extraction'),
  payload: z.object({
    targetActorId: z.string(),
    context: z.string(),
  }),
});

/**
 * Request to decrypt an ST3GG image (Phase 17).
 */
export const DecryptSt3ggEventSchema = z.object({
  type: z.literal('decrypt_st3gg'),
  payload: z.object({
    imagePath: z.string(),
  }),
});

/**
 * Trigger an autonomous NPC turn (Phase 21).
 * Foundry pushes this when it is an NPC's turn in combat.
 * Node B runs the TurnDaemon 4-stage state machine and returns a TurnResult.
 */
export const NpcTurnEventSchema = z.object({
  type: z.literal('npc_turn'),
  payload: z.object({
    /** The NPC's Foundry actor id. */
    npcId: z.string().min(1),
    /**
     * A natural-language summary of what the NPC can currently perceive
     * (visible tokens, zone names, recent events, etc.).
     */
    sensoryContext: z.string().min(1),
  }),
});

/**
 * System heartbeat from the Foundry bridge module to Node B (Phase 15).
 * Reports which optional modules are currently active so Node B can
 * select the correct resiliency tier (Elite / Baseline / Degraded).
 */
export const SystemHeartbeatEventSchema = z.object({
  type: z.literal('system_heartbeat'),
  payload: z.object({
    socketlib: z.boolean(),
    fxmaster: z.boolean(),
    sequencer: z.boolean(),
    splatter: z.boolean(),
  }),
});

/** All valid inbound events from Foundry → Node B (HybridRoutingController input). */
export const FoundryEventSchema = z.discriminatedUnion('type', [
  ResolveAttackEventSchema,
  CalculateDvEventSchema,
  OracleRollEventSchema,
  ReadActorEventSchema,
  BuyItemEventSchema,
  ApprovalResponseEventSchema,
  OpenNightMarketEventSchema,
  RedTradeTransitEventSchema,
  GenerateMissionEventSchema,
  ApplyDecalEventSchema,
  SceneActivateEventSchema,
  FileExtractionEventSchema,
  DecryptSt3ggEventSchema,
  SystemHeartbeatEventSchema,
  NpcTurnEventSchema,
]);

/**
 * Evaluate the narrative intent of an incoming context string.
 * Triggers the Intent Swarm (tone + intensity) on Node B.
 */
export const EvaluateIntentEventSchema = z.object({
  type: z.literal('evaluate_intent'),
  payload: z.object({
    context: z.string(),
  }),
});

// ── Inferred TypeScript types ─────────────────────────────────────────────────

export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;
export type CreateActorPayload = z.infer<typeof CreateActorPayloadSchema>;
export type ReadActorPayload = z.infer<typeof ReadActorPayloadSchema>;
export type SimplePhonePayload = z.infer<typeof SimplePhonePayloadSchema>;
export type DiceRollPayload = z.infer<typeof DiceRollPayloadSchema>;
export type SceneActivatePayload = z.infer<typeof SceneActivatePayloadSchema>;
export type UpdateActorPayload = z.infer<typeof UpdateActorPayloadSchema>;
export type QueueApprovalPayload = z.infer<typeof QueueApprovalPayloadSchema>;

export type ChatMessageCommand = z.infer<typeof ChatMessageCommandSchema>;
export type ReadActorCommand = z.infer<typeof ReadActorCommandSchema>;
export type SimplePhoneCommand = z.infer<typeof SimplePhoneCommandSchema>;
export type DiceRollCommand = z.infer<typeof DiceRollCommandSchema>;
export type SceneActivateCommand = z.infer<typeof SceneActivateCommandSchema>;
export type UpdateActorCommand = z.infer<typeof UpdateActorCommandSchema>;
export type QueueApprovalCommand = z.infer<typeof QueueApprovalCommandSchema>;
export type CreateActorCommand = z.infer<typeof CreateActorCommandSchema>;
export type BridgeCommand = z.infer<typeof BridgeCommandSchema>;

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type BridgeResponse = z.infer<typeof BridgeResponseSchema>;

export type FoundryEvent = z.infer<typeof FoundryEventSchema>;
export type BuyItemEvent = z.infer<typeof BuyItemEventSchema>;
export type ApprovalResponseEvent = z.infer<typeof ApprovalResponseEventSchema>;
export type OpenNightMarketEvent = z.infer<typeof OpenNightMarketEventSchema>;
export type MarketItemPayload = z.infer<typeof MarketItemPayloadSchema>;
export type OpenNightMarketPayload = z.infer<typeof OpenNightMarketPayloadSchema>;
export type OpenNightMarketCommand = z.infer<typeof OpenNightMarketCommandSchema>;
export type RedTradeTransitEvent = z.infer<typeof RedTradeTransitEventSchema>;
export type GenerateMissionEvent = z.infer<typeof GenerateMissionEventSchema>;
export type ApplyDecalEvent = z.infer<typeof ApplyDecalEventSchema>;
export type SceneActivateEvent = z.infer<typeof SceneActivateEventSchema>;
export type SystemHeartbeatEvent = z.infer<typeof SystemHeartbeatEventSchema>;
export type FileExtractionEvent = z.infer<typeof FileExtractionEventSchema>;
export type DecryptSt3ggEvent = z.infer<typeof DecryptSt3ggEventSchema>;
export type NpcTurnEvent = z.infer<typeof NpcTurnEventSchema>;
export type EvaluateIntentEvent = z.infer<typeof EvaluateIntentEventSchema>;
export type SequenceAction = z.infer<typeof SequenceActionSchema>;
export type FxGlitchPayload = z.infer<typeof FxGlitchPayloadSchema>;
export type RunSequencePayload = z.infer<typeof RunSequencePayloadSchema>;
export type PretextOverlayPayload = z.infer<typeof PretextOverlayPayloadSchema>;
export type PretextOverlayCommand = z.infer<typeof PretextOverlayCommandSchema>;

export const IntentSwarmResultSchema = z.object({
  tone: z.string(),
  intensity: z.number(),
});
export type IntentSwarmResult = z.infer<typeof IntentSwarmResultSchema>;
