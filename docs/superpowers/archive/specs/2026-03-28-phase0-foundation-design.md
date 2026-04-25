# Phase 0: Foundation & Core Scaffolding — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Scope:** Phase 4 MVP — No Creep Contract enforced
**Architecture:** Split-Node (Node A: Rules Authority | Node B: Orchestrator)

---

## Executive Summary

Scaffold a strictly typed ES2022 ESM TypeScript project with Zod schemas covering all six Foundry VTT document types (Actor, Item, Scene, JournalEntry, RollTable, plus embedded sub-documents), a PDF chunk schema for the rulebook ingestion pipeline, and Node A response schemas for zero-trust validation. Manual constructor-based dependency injection. Vitest harness validates schemas against real seed data from `docs/raw_data/`. No business logic.

---

## 1. Technology Stack

| Tool | Version | Justification |
|------|---------|---------------|
| Node.js | 24.x | Already installed. Native ESM support. |
| TypeScript | ~5.8 | ES2022 target, `moduleResolution: "Node16"`, all strict flags enabled. |
| Zod | ^3.24 | Runtime schema validation. Zero-trust contract with Node A (CLAUDE.md section 9). |
| Vitest | ^3.x | ESM-native test runner. No configuration friction. |
| tsx | ^4.x | Dev-time TypeScript execution without compilation step. |
| @modelcontextprotocol/sdk | latest | Installed in Phase 0, used in Phase 1+. |

### Not included in Phase 0

- ESLint — TypeScript strict mode is sufficient for Phase 0 correctness.
- DI container library — Manual constructor injection. No TSyringe or InversifyJS. Composition root added when services are wired in Phase 1.
- Prisma — Artery of Truth schemas are Phase 1.
- HTTP clients — Node A communication is Phase 2.

---

## 2. Project Structure

```
50v3r31gn-m4ch1n4/
├── package.json                      # "type": "module", ES2022 ESM
├── tsconfig.json                     # strict, Node16, ES2022, no implicit any
├── vitest.config.ts                  # Minimal Vitest configuration
├── src/
│   ├── api/
│   │   └── index.ts                  # Barrel export — populated in Phase 3
│   ├── core/
│   │   └── index.ts                  # Barrel export — populated in Phase 1+
│   ├── db/
│   │   └── index.ts                  # Barrel export — populated in Phase 1
│   ├── mcp/
│   │   └── index.ts                  # Barrel export — populated in Phase 2
│   └── shared/
│       ├── index.ts                  # Root barrel re-exporting schemas and types
│       ├── schemas/
│       │   ├── index.ts              # Schema barrel export
│       │   ├── common.schema.ts      # Shared sub-schemas used across all document types
│       │   ├── actor.schema.ts       # Foundry VTT Actor (character, mook)
│       │   ├── item.schema.ts        # Foundry VTT Item (gear, weapon, cyberware, armor, ammo, skill, vehicle)
│       │   ├── scene.schema.ts       # Foundry VTT Scene (maps, walls, lights, tiles, tokens, environment)
│       │   ├── journal.schema.ts     # Foundry VTT JournalEntry (pages with HTML content)
│       │   ├── roll-table.schema.ts  # Foundry VTT RollTable (formula, weighted results)
│       │   ├── pdf-chunk.schema.ts   # Ingestion pipeline chunk contract for pgvector
│       │   └── node-a.schema.ts      # Node A response validation (zero-trust)
│       └── types/
│           ├── index.ts              # Types barrel export
│           └── foundry.types.ts      # z.infer<> types derived from all Zod schemas
└── tests/
    └── shared/
        ├── actor.schema.test.ts      # Validates against real Actor JSONs
        ├── item.schema.test.ts       # Validates against real Item JSONs
        ├── scene.schema.test.ts      # Validates against real Scene JSONs
        ├── journal.schema.test.ts    # Validates against real JournalEntry JSONs
        ├── roll-table.schema.test.ts # Validates against real RollTable JSONs
        └── pdf-chunk.schema.test.ts  # Validates synthetic chunk shapes
```

### Directory conventions

- Every module directory (`api/`, `core/`, `db/`, `mcp/`, `shared/`) has a barrel `index.ts`.
- Placeholder barrels export nothing — they exist so the source tree matches CLAUDE.md section 3 and imports do not break as modules are built out.
- Schema files are named `<document-type>.schema.ts`.
- Test files mirror the schema structure under `tests/shared/`.

---

## 3. Data Models (Zod Schemas)

All schemas are derived from direct inspection of actual seed data in `docs/raw_data/`. Field optionality reflects what was observed in the real Foundry VTT v12 exports from `cyberpunk-red-core` v3.7.0.

### 3.1 `common.schema.ts` — Shared sub-structures

These sub-schemas are composed into every Foundry document schema.

```
FoundryStatsSchema
  coreVersion: string
  systemId: string
  systemVersion: string
  createdTime: number | null
  modifiedTime: number | null
  lastModifiedBy: string | null

FoundrySourceSchema
  book: string
  page: number

FoundryFlagsSchema = z.record(z.string(), z.unknown())

FoundryOwnershipSchema = z.record(z.string(), z.number())

FoundryBaseDocumentSchema
  name: string
  folder: string | null
  flags: FoundryFlagsSchema (optional)
  _stats: FoundryStatsSchema (optional)
  _id: string (optional)
```

### 3.2 `actor.schema.ts` — Character & Mook state

Modeled from edgerunner NPC and mook Actor exports.

```
StatValueSchema
  value: number

StatWithMaxSchema
  value: number
  max: number

TransactionSchema
  value: number
  (open record — Foundry tracks HP/humanity changes as transaction logs with variable fields per system version)

ActorStatsSchema
  int: StatValueSchema
  ref: StatValueSchema
  dex: StatValueSchema
  tech: StatValueSchema
  cool: StatValueSchema
  will: StatValueSchema
  luck: StatWithMaxSchema
  move: StatValueSchema
  body: StatValueSchema
  emp: StatWithMaxSchema

WoundState = z.enum([
  "notWounded",
  "lightlyWounded",
  "seriouslyWounded",
  "mortallyWounded",
  "dead"
])

DerivedStatsSchema
  hp: { value: number, max: number, transactions: TransactionSchema[] }
  humanity: { value: number, max: number, transactions: TransactionSchema[] }
  deathSave: { value: number, penalty: number, basePenalty: number }
  currentWoundState: WoundState
  seriouslyWounded: number
  walk: StatValueSchema
  run: StatValueSchema

ActorRoleInfoSchema
  activeRole: string
  activeNetRole: string

ActorInformationSchema
  alias: string
  description: string
  notes: string
  history: string

ActorSystemSchema
  stats: ActorStatsSchema
  derivedStats: DerivedStatsSchema
  roleInfo: ActorRoleInfoSchema
  information: ActorInformationSchema
  externalData: z.record(z.string(), z.unknown())
  reputation: z.unknown()
  installedItems: z.unknown()
  weapons: z.record(z.string(), z.unknown())

ActorSchema extends FoundryBaseDocumentSchema
  type: z.enum(["character", "mook"])
  img: string (optional)
  system: ActorSystemSchema
  items: z.array(z.unknown()) — embedded Item documents
  prototypeToken: z.unknown() (optional)
  effects: z.array(z.unknown())
```

### 3.3 `item.schema.ts` — All item subtypes

Modeled from gear, weapon, cyberware, ammo, skill, and vehicle Item exports.

```
ItemDescriptionSchema
  value: string (HTML)

ItemPriceSchema
  market: number

ItemConcealableSchema
  concealable: boolean
  isConcealed: boolean

ItemInstalledItemsSchema
  allowedTypes: string[]
  allowed: boolean
  list: z.array(z.unknown())
  usedSlots: number
  slots: number

BaseItemSystemSchema
  description: ItemDescriptionSchema
  source: FoundrySourceSchema
  favorite: boolean
  revealed: boolean (optional)

GearSystemSchema extends BaseItemSystemSchema
  usage: string
  isElectronic: boolean
  providesHardening: boolean
  equipped: string
  concealable: ItemConcealableSchema
  brand: string
  amount: number
  price: ItemPriceSchema
  installedItems: ItemInstalledItemsSchema

SkillSystemSchema extends BaseItemSystemSchema
  level: number
  stat: string
  category: string
  difficulty: string
  core: boolean
  basic: boolean
  skillType: string

ItemSchema extends FoundryBaseDocumentSchema
  type: string (gear, weapon, cyberware, armor, ammo, skill, clothing, drug, vehicle, itemUpgrade)
  img: string (optional)
  system: GearSystemSchema | SkillSystemSchema | z.object({}).passthrough()
  effects: z.array(z.unknown())
```

Note: The schema uses a base system shape with `.passthrough()` for item subtypes not yet fully modeled (weapon, cyberware, armor). These will be tightened as Phase 1-2 implementation demands stricter validation. For Phase 0, the critical contract is that every Item JSON parses without error.

### 3.4 `scene.schema.ts` — Map/Scene state

Modeled from 41 scene exports including combat maps with walls/lights.

```
SceneBackgroundSchema
  src: string
  scaleX: number
  scaleY: number
  offsetX: number
  offsetY: number
  rotation: number
  anchorX: number (optional)
  anchorY: number (optional)
  fit: string
  tint: string
  alphaThreshold: number

SceneGridSchema
  type: number
  size: number
  color: string
  alpha: number
  distance: number
  units: string
  style: string
  thickness: number

SceneWallSchema
  c: z.tuple([number, number, number, number])
  _id: string
  light: number
  move: number
  sight: number
  sound: number
  dir: number
  door: number
  ds: number
  threshold: z.object({ light, sight, sound, attenuation }).passthrough()
  flags: FoundryFlagsSchema (optional)

SceneLightConfigSchema
  alpha: number
  angle: number
  bright: number
  dim: number
  color: string | null
  coloration: number
  luminosity: number
  saturation: number
  contrast: number
  shadows: number
  animation: { type: string, speed: number, intensity: number, reverse: boolean }
  darkness: { min: number, max: number }
  attenuation: number
  negative: boolean
  priority: number

SceneLightSchema
  _id: string
  x: number
  y: number
  rotation: number
  walls: boolean
  vision: boolean
  config: SceneLightConfigSchema
  hidden: boolean
  elevation: number
  flags: FoundryFlagsSchema (optional)

SceneTileTextureSchema
  src: string
  scaleX: number
  scaleY: number
  tint: string
  offsetX: number
  offsetY: number
  rotation: number
  anchorX: number
  anchorY: number
  fit: string
  alphaThreshold: number

SceneTileSchema
  texture: SceneTileTextureSchema
  x: number
  y: number
  width: number
  height: number
  rotation: number
  alpha: number
  occlusion: { mode: number, alpha: number }
  flags: FoundryFlagsSchema (optional)

SceneTokenSchema
  name: string
  x: number
  y: number
  actorId: string | null (optional)
  disposition: number (optional)
  flags: FoundryFlagsSchema (optional)
  (passthrough for remaining token fields)

SceneEnvironmentSchema
  globalLight: {
    luminosity: number
    enabled: boolean
    darkness: { max: number, min: number }
    alpha: number
    bright: boolean
    color: string | null
    coloration: number
    saturation: number
    contrast: number
    shadows: number
  }
  darknessLevel: number
  darknessLock: boolean
  cycle: boolean
  base: { hue, intensity, luminosity, saturation, shadows }
  dark: { hue, intensity, luminosity, saturation, shadows }

SceneFogSchema
  exploration: boolean
  reset: number | null
  overlay: string | null
  colors: { explored: string | null, unexplored: string | null }

SceneSchema extends FoundryBaseDocumentSchema
  navigation: boolean
  navOrder: number
  navName: string
  background: SceneBackgroundSchema
  foreground: string | null (optional)
  foregroundElevation: number
  width: number
  height: number
  padding: number
  initial: { x: number | null, y: number | null, scale: number | null }
  backgroundColor: string
  grid: SceneGridSchema
  tokenVision: boolean
  environment: SceneEnvironmentSchema
  fog: SceneFogSchema
  weather: string | null (optional)
  walls: SceneWallSchema[]
  lights: SceneLightSchema[]
  tiles: SceneTileSchema[]
  tokens: SceneTokenSchema[]
  drawings: z.array(z.unknown())
  sounds: z.array(z.unknown())
  notes: z.array(z.unknown())
  templates: z.array(z.unknown())
  regions: z.array(z.unknown())
  playlist: string | null (optional)
  playlistSound: string | null (optional)
  journal: string | null (optional)
  journalEntryPage: string | null (optional)
  thumb: string (optional)

```

### 3.5 `journal.schema.ts` — Campaign narrative/lore

Modeled from 42 journal entries containing 179 pages of campaign content.

```
JournalPageTextSchema
  format: number
  content: string (HTML)

JournalPageSchema
  sort: number
  name: string
  type: z.enum(["text", "image", "video"])
  _id: string
  title: { show: boolean, level: number } (optional)
  text: JournalPageTextSchema (optional, present when type is "text")
  image: z.unknown() (optional)
  video: z.unknown() (optional)
  src: string | null (optional)
  system: z.unknown() (optional)
  ownership: FoundryOwnershipSchema (optional)
  flags: FoundryFlagsSchema (optional)
  _stats: FoundryStatsSchema (optional)

JournalEntrySchema extends FoundryBaseDocumentSchema
  pages: JournalPageSchema[]
```

### 3.6 `roll-table.schema.ts` — Strategic Oracle & random tables

Modeled from 49 roll tables (bounties, night markets, community events, autofire DVs).

```
RollTableResultSchema
  type: z.enum(["text", "document", "compendium"])
  weight: number
  range: z.tuple([number, number])
  drawn: boolean
  text: string
  _id: string
  documentId: string | null (optional)
  img: string (optional)
  flags: FoundryFlagsSchema (optional)

RollTableSchema extends FoundryBaseDocumentSchema
  formula: string
  description: string (optional)
  replacement: boolean
  displayRoll: boolean
  results: RollTableResultSchema[]
  img: string (optional)
```

### 3.7 `pdf-chunk.schema.ts` — Rulebook ingestion pipeline contract

Defines the output format of the Phase 1 PDF parsing pipeline. This is the contract between the parser and Node A's pgvector database.

```
NamespaceEnum = z.enum(["core_rules", "campaign_ttta", "entities_mooks"])

PdfChunkSchema
  sourceFile: string (e.g. "RTG-CPR-CyberpunkRedCore.pdf")
  namespace: NamespaceEnum
  sectionHeading: string (e.g. "Friday Night Firefight > Actions > Move Action")
  pageStart: number
  pageEnd: number
  content: string (cleaned plaintext, HTML stripped)
  chunkIndex: number (position within section, 0-based)
  tokenEstimate: number (for context window budgeting)
```

No embedding vector field. Vectors are computed by Node A during ingestion. This schema models what Node B sends to Node A.

### 3.8 `node-a.schema.ts` — Zero-trust Node A response validation

Per CLAUDE.md section 9: all Node A JSON payloads are treated as untrusted input.

```
RollResultSchema (nitro-logic responses)
  total: number
  rolls: number[]
  stat: string (optional)
  skill: string (optional)
  dv: number (optional)
  success: boolean
  margin: number
  reasoning: string (Chain of Thought output from 3B model)

RagMatchSchema (single RAG result)
  content: string
  namespace: NamespaceEnum
  sourceFile: string
  sectionHeading: string
  score: number
  pageStart: number
  pageEnd: number

RagQueryResultSchema (nitro-db responses)
  matches: RagMatchSchema[]
  query: string (echoed back for verification)

NodeAErrorSchema (standardized error for graceful degradation)
  error: boolean (literal true)
  code: string
  message: string
  timestamp: string (ISO 8601)
```

---

## 4. Rulebook Coverage Map (Phase 1 Target)

Phase 0 defines the chunk schema contract. Phase 1 implements the parser. The following is the exhaustive coverage target — every page of every book must be chunked with zero gaps.

### 4.1 Cyberpunk RED Core Rulebook (458 pages)

| Section | Pages | Chunking notes |
|---------|-------|----------------|
| Never Fade Away (fiction) | 5-16 | Narrative lore chunks |
| View from the Edge | 17-26 | Setting primer, streetslang glossary |
| Soul and the New Machine (Roles) | 27-42 | 10 roles, lifepath tables, character creation |
| Tales from the Street (Lifepath) | 43-70 | Complete lifepath generation tables |
| Fitted for the Future (Stats) | 71-106 | 10 stats, skills list, weapons/armor tables, outfit |
| Putting the Cyber into the Punk | 107-120 | Cyberware tables, cyberpsychosis rules, humanity cost |
| The Fall of the Towers (fiction) | 121-124 | Narrative lore |
| Getting it Done (Skills) | 125-166 | Skill check mechanics, full skill list, role abilities, multiclassing |
| Friday Night Firefight (Combat) | 167-193 | Initiative, actions, ranged/melee, damage, armor, vehicle combat, reputation |
| Netrunning | 195-218 | NET actions, programs, cyberdecks, architecture building |
| Trauma Team (Medical) | 219-232 | Wound states, critical injuries table, stabilization, healing, drugs, therapy, cyberpsychosis treatment |
| Welcome to the Dark Future (History) | 233-256 | Timeline, 4th Corp War, world history |
| Time of the Red (Setting) | 257-282 | Current era, neocorps, corporate profiles |
| Welcome to Night City | 283-314 | City history, districts, gangs, key locations, NPCs |
| Everyday Life | 315-332 | Law, communication, transport, fashion, food, entertainment |
| The New Street Economy | 333-386 | Night markets, price lists, complete night market appendix (tables), making a living |
| Running Cyberpunk (GM tools) | 387-424 | Beat charts, IP/advancement, mooks/grunts, encounter tables |
| Screamsheets (Adventures) | 425-434 | Pre-built adventure hooks |
| Black Dog (Fiction) | 435-458 | Closing fiction |

### 4.2 Black Chrome (170 pages)

| Section | Pages | Chunking notes |
|---------|-------|----------------|
| Using Black Chrome | 5-10 | Introduction, how gear integrates |
| Apps | 11-14 | Software/app listings |
| Cyberware | 15-26 | Expanded cyberware catalog |
| Fashion and Armor | 27-38 | Clothing, armor types, SP values |
| General Goods and Gear | 39-50 | Equipment catalog |
| Linear Frames | 51-56 | Exoskeleton rules |
| Vehicles | 57-84 | Complete vehicle catalog with stats |
| Weapons | 85-124 | Complete weapon catalog with stats |
| Economics 101 | 125-130 | Economy rules, pricing |
| Night Markets | 131-156 | Expanded night market tables |
| Black Chrome Lists | 157-170 | Master reference tables |

### 4.3 Single Player Mode (106 pages)

| Section | Pages | Chunking notes |
|---------|-------|----------------|
| Going it Alone | 5-10 | Solo play introduction |
| Solo Play Core Tools | 11-26 | Strategic Oracle system, NPC reaction tables, scene generation |
| Missions and Campaigns | 27-90 | Mission generation, campaign structures, beat charts (includes embedded lists/tables throughout) |
| Blank Forms | 91-106 | Reference sheets and printable forms |

### 4.4 No Place Like Home DLC (8 pages)

All 8 pages chunked. HQ rules, room types, upgrade paths, morale.

### 4.5 Single Player Mode Plus DLC (6 pages)

All 6 pages chunked. Additional solo play rules and tables.

**Total: 748 pages. Zero skipped.**

### Phase 1 obligation

The Phase 1 ingestion pipeline must:
1. Extract text from every page of every PDF.
2. Detect section headings from the text structure.
3. Chunk by section with overlap for context continuity.
4. Validate every chunk through `PdfChunkSchema`.
5. Tag with `namespace: "core_rules"`.
6. Produce a coverage report confirming all pages are represented.

---

## 5. Testing Strategy

### Phase 0 tests

Each test file validates schemas against real seed data files from `docs/raw_data/`. No mocked fixtures.

| Test file | What it validates | Source data |
|-----------|-------------------|-------------|
| `actor.schema.test.ts` | Actor schema parses real mook and NPC data | Edgerunner NPC Actor + cover object Actor |
| `item.schema.test.ts` | Item schema parses gear, skill, and upgrade items | Eagle item + embedded skill from actor |
| `scene.schema.test.ts` | Scene schema parses maps with walls, lights, tiles | Afterlife Exterior + 6th Street Shootout |
| `journal.schema.test.ts` | JournalEntry schema parses multi-page journals | Afterlife services journal + intro journal |
| `roll-table.schema.test.ts` | RollTable schema parses weighted result tables | TttA bounty employer table |
| `pdf-chunk.schema.test.ts` | PdfChunk schema validates and rejects shapes | Synthetic valid chunks + malformed rejects |

### Phase 0 success criteria

- `npx vitest run` passes all tests.
- `npx tsc --noEmit` compiles with zero errors.
- All real seed data files parse through their corresponding schemas without `.passthrough()` masking structural mismatches on modeled fields.

---

## 6. Seed Data Inventory

Verified counts from `docs/raw_data/`:

| Category | Count | Format |
|----------|-------|--------|
| Actor documents | 155 | JSON |
| Item documents | 191 | JSON |
| Scene documents | 41 | JSON |
| JournalEntry documents | 42 (179 pages, ~849KB content) | JSON |
| RollTable documents | 49 | JSON |
| Pre-extracted journal text | 136 | TXT |
| Rulebook PDFs | 5 (748 total pages) | PDF |
| Image assets | 178 | WEBP/PNG/JPEG |
| Audio assets | 1 | MP3 |

---

## 7. Decisions Log

| Decision | Rationale | Alternatives rejected |
|----------|-----------|----------------------|
| Manual constructor DI | Zero compatibility risk with ESM. Project size doesn't warrant a container yet. | TSyringe (decorator issues with ESM), InversifyJS (reflect-metadata overhead) |
| No ESLint in Phase 0 | TypeScript strict mode covers correctness. Avoids config churn before code exists. | Adding ESLint now (premature, no code to lint) |
| `.passthrough()` on partially-modeled item subtypes | Ensures all Item JSONs parse in Phase 0 without blocking on weapon/cyberware field enumeration. Tightened in Phase 1-2 as those schemas are consumed. | Strict modeling of all subtypes now (would require reading every item variant, delays Phase 0) |
| Separate `pdf-chunk.schema.ts` from `node-a.schema.ts` | Chunks are the input to ingestion. Node A responses are the output of queries. Different lifecycle, different validation concerns. | Single schema file (conflates concerns) |
| Tests read real files, not fixtures | Proves schemas match actual Foundry VTT export format. Catches drift immediately. | Copied fixture files (stale risk, duplication) |

---

## 8. Scope Boundaries (No Creep)

Phase 0 produces ONLY:
- Configuration files (`package.json`, `tsconfig.json`, `vitest.config.ts`)
- Empty barrel exports for `api/`, `core/`, `db/`, `mcp/`
- Zod schema definitions in `src/shared/schemas/`
- Inferred TypeScript types in `src/shared/types/`
- Tests in `tests/shared/`

Phase 0 does NOT produce:
- Business logic, controllers, or routing
- PDF parsing code (only the chunk schema contract)
- HTTP clients or MCP server implementations
- Artery of Truth connections, Prisma schemas, or migrations
- Foundry VTT module manifests
- DI container or service registry
- ESLint, Prettier, or other tooling config

---

## 9. Open Items for Future Phases

| Item | Phase | Notes |
|------|-------|-------|
| Full 748-page PDF audit | Phase 1 | Every page extracted, section-headed, chunked, coverage report generated. Zero gaps. |
| Tighten weapon/cyberware/armor item schemas | Phase 1-2 | Replace `.passthrough()` with strict field modeling as those subtypes are consumed. |
| DI composition root | Phase 1 | Wire service instantiation when first real services exist. |
| ESLint + Prettier | Phase 1 | Add once there is code to lint. |
| Foundry VTT module manifest | Phase 3 | Required when building the Foundry integration. |


---
**LINKS:** [[OS_CORE]]
