# OpenClaw CPR — "The Red Trade" DLC
## Complete Implementation Proposal for Claude Code
### Drop this entire document into Claude Code CLI as your prompt

---

## What this is

A contraband run mission archetype that integrates fully into the existing
OpenClaw CPR module. New files live alongside existing ones in the same
module and server. No new server process. No new module.json.

The experience: accept a gig from a Fixer to move drugs or weapons across
Night City. Generate a cargo manifest from official CPR tables. Run the
Beat Chart. Manage the Heat Clock. Drop cargo to the buyer. Extract. Get
paid. Or get caught, lose everything, and start over from the street.

---

## What the PDFs actually say — ground rules for this build

Read these before touching any code. They override Grok's brief entirely.

**Drugs (Core p.318):** "Besides, you're in Night City. It's not part of
the United States anymore, choomba. Smoke 'em if ya got em." Drugs are
legal in Night City. NCPD does not patrol for personal amounts.

**The real threat is gangs, not cops.** Core pp.308–309: Voodoo Boys deal
"primarily non-synthetic drugs," Piranhas "take and deal drugs," 6th Street
moved into "extortion and smuggling." Large shipments cut into gang supply
chains. That's what gets you killed — not a beat cop.

**NCPD only appear at extreme heat levels** because they're corrupt,
underfunded, and understaffed (Core p.302, p.318). Even then Core's sidebar
says "a lot of security forces shoot first and fill out fatal incident
reports later" — not arrest you.

**MaxTac only appears for Black Lace in bulk** because Black Lace causes
2d6 Humanity Loss per dose (Core p.227) → bulk supply → area cyberpsychos
→ MaxTac trigger. No other drug causes this.

**Job payment (Core p.381):** Easy = 500eb, Typical = 1,000eb, Dangerous =
2,000eb per person. The Hustle table (100–600eb/week) is casual side income,
NOT what you pay edgerunners for dangerous jobs. Red Trade payments use
the Job table, not the Hustle table.

**Therapy restores Humanity, it does NOT cause it (Core p.230):**
- Addiction Therapy: 1,000eb, removes one addiction, DV15
- Standard Humanity Loss Therapy: 500eb, restores 2d6 Humanity
- Extreme Humanity Loss Therapy: 1,000eb, restores 4d6 Humanity
Braindance as prison punishment (Core p.318–319) is different — forced
sensory deprivation cryotank. That's the jail mechanic, not therapy.

**Housing (Core pp.377–380):** Monthly rent is a hard survival cost. Miss
a week, roll Death Saves. Full ladder: Street (0eb) → Street in Vehicle (0eb)
→ Cube Hotel (500eb/mo) → Cargo Container (1,000eb/mo) → Studio Apartment
(1,500eb/mo) → Two-Bedroom Apartment (2,500eb/mo) → Upscale Conapt
(7,500eb/mo) → Luxury Penthouse (15,000eb/mo). Non-Execs start at Cargo
Container at character generation. Housing is accumulated progress.

**Cody Pondsmith quote (SPM p.42):** "Hornet had this house in the suburbs...
When the Fourth Corporate War came and Hornet threw in with Arasaka, his
house got caught in the crossfire. Losing that house totally wrecked Hornet."
This is the design intent: housing loss is a major narrative consequence.

---

## Existing codebase — what NOT to rebuild

### Already in `random-tables.js` (do not duplicate):
- `MISSION_TYPES` — 50-entry 1d100 table (SPM p.72)
- `PLOT_TWISTS` — 50-entry 1d100 table (SPM pp.75–76)
- `BEAT_HOOKS`, `BEAT_CLIFFHANGERS`, `BEAT_DEVELOPMENTS`,
  `BEAT_CLIMAXES`, `BEAT_RESOLUTIONS` — complete official tables

### Already in `NightCityMap.js`:
- `DISTRICTS` — 19 districts each with `factions[]`, `threat`, `zone`
- `ZONES` — 5 zone types with threat ratings

### Already in `ClocksApp.js`:
- `ClocksApp.create(name, size, event)` — creates and persists a clock
- `ClocksApp.trigger(clockId)` — rolls pool, removes 1s, returns result
The Heat Clock IS a Solo Play Clock. Use `ClocksApp` directly.

### Already in `NarrativeDirector.ts`:
- `recordEvent(worldId, desc, type, impact, metadata)` — log + nudge
- `recordBeat(worldId, type, text)` — beat history + arc advance
- `getArcSummary(worldId)` — summary string for prompts
- `ArcState` lives in `cpr_arc_state.state` JSONB
- Beat history, arc phase, thread heat all tracked

### Already in `SoloModePanel.js`:
- `_prepareContext()` with `activeTab` from `game.settings`
- Tab switching pattern via `data-tab` attributes

### Already in `CPRRepository.ts`:
- `logEvent(worldId, eventType, desc, impact, metadata)` — exact signature
- `cpr_factions.heat` (0–10) — faction hostility already tracked

### Already in `ttta-integration.js`:
- `SimpleCalendar.api.currentDateTime()` + `formatDateTime()` pattern

### Already in `init.js`:
- Settings registration pattern — follow exactly

---

## File structure — new files only

```
foundry-module/scripts/
  apps/
    RedTradeApp.js          ← NEW: cargo UI, run management, jail handling
  data/
    red-trade-data.js       ← NEW: all drug/weapon/payment/heat/housing data
  hooks/
    red-trade-hooks.js      ← NEW: Foundry hooks, settings registration

server/src/modules/cyberpunk-red/
  application/
    RedTradeEngine.ts       ← NEW: cargo gen, heat logic, jail, payments
  delivery/trpc/
    router.ts               ← MODIFY: add redTrade sub-router

supabase/migrations/
  20250102000000_red_trade.sql  ← NEW: two targeted schema additions

foundry-module/
  scripts/module.js         ← MODIFY: import + boot redTradeHooks
  scripts/hooks/init.js     ← MODIFY: register 3 new settings
  scripts/apps/SoloModePanel.js  ← MODIFY: add Red Trade tab to context
  templates/panel-main.hbs  ← MODIFY: add Red Trade tab content
  styles/cpr-solo-mode.css  ← MODIFY: append Red Trade styles
```

**Do NOT modify:**
- `NarrativeDirector.ts` — call its public methods only
- `CPRWorldService.ts` — not needed
- `GMAgent.ts` — narrative context injected via events, not hardcoded
- `BeatChartEngine.ts` — called by RedTradeEngine, not modified
- `random-tables.js` — data already complete
- `chargen-data.js`, `CharGenApp.js` — untouched

---

## Task 1 — Supabase: `20250102000000_red_trade.sql`

Two targeted additions only. No new tables.

```sql
-- 1. Persistent criminal record on the world record
--    (replaces Grok's proposed separate cpr_records table)
ALTER TABLE cpr_worlds
  ADD COLUMN IF NOT EXISTS criminal_record jsonb NOT NULL DEFAULT '[]';

-- 2. Housing tier tracking — persists across sessions
--    Mirrors the Core p.378 housing ladder exactly
ALTER TABLE cpr_worlds
  ADD COLUMN IF NOT EXISTS housing_tier text NOT NULL DEFAULT 'cargo_container'
  CHECK (housing_tier IN (
    'street', 'street_vehicle', 'cube_hotel',
    'cargo_container', 'studio_apartment', 'two_bedroom_apartment',
    'upscale_conapt', 'luxury_penthouse',
    'corporate_conapt', 'beaverville_house', 'beaverville_mcmansion'
  ));

-- Street heat and active run state live inside the existing
-- cpr_arc_state.state JSONB as state.red_trade — no new table needed.
-- Criminal record stored on cpr_worlds.criminal_record (above).
```

---

## Task 2 — `foundry-module/scripts/data/red-trade-data.js` (NEW)

All data sourced directly from Core rulebook pages cited.
No invented mechanics. No numbers that contradict the books.

```javascript
/**
 * red-trade-data.js — The Red Trade DLC Data
 *
 * All values sourced directly from:
 *   - Cyberpunk RED Core Rulebook pp.227–229 (drugs)
 *   - Core pp.318–319 (law, punishment, braindance)
 *   - Core pp.377–380 (housing ladder)
 *   - Core p.381 (job payment tiers: Easy 500eb, Typical 1000eb, Dangerous 2000eb)
 *   - Core pp.384–385 (Fixer/Nomad hustle — smuggling context)
 *   - SPM pp.24–26 (Solo Play Clocks — Heat Clock pattern)
 *   - SPM pp.32 (Oracle probability tiers)
 */

// ── Drug manifest (Core pp.227–229) ──────────────────────────────────────────
// Exact costs and DVs from the rulebook. Do not change these numbers.

export const DRUGS = [
  {
    id:               "black_lace",
    name:             "Black Lace",
    cost_per_dose:    50,         // Core p.227: 50eb (Costly)
    secondary_dv:     17,         // Core p.227: DV17
    effect_duration:  "24 hours",
    primary_effect:   "Ignores Seriously Wounded wound state for 24 hours. 2d6 Humanity Loss on dose (returned if no addiction).",
    secondary_effect: "Addicted. Humanity Loss permanent. Must use or take penalty to all actions.",
    heat_value:       3,          // Highest — bulk supply → area cyberpsychos → MaxTac adjacent
    maxtac_threshold: 50,         // 50+ doses in one shipment = MaxTac risk (cyberpsycho destabilisation)
    buyer_factions:   ["Maelstrom", "Red Chrome Legion", "Animals"],
    notes:            "Most dangerous drug in Night City. Bulk shipments destabilise areas.",
  },
  {
    id:               "blue_glass",
    name:             "Blue Glass",
    cost_per_dose:    20,         // Core p.228: 20eb (Everyday)
    secondary_dv:     15,         // Core p.228: DV15
    effect_duration:  "4 hours",
    primary_effect:   "GM will tell you when you are flashing out — lose your Action on that Turn.",
    secondary_effect: "Addicted. Flash out regularly even without the drug.",
    heat_value:       1,
    maxtac_threshold: null,
    buyer_factions:   ["Tyger Claws", "Bozos", "independent vendors"],
    notes:            "Common party drug. Low heat.",
  },
  {
    id:               "boost",
    name:             "Boost",
    cost_per_dose:    50,         // Core p.228: 50eb (Costly)
    secondary_dv:     17,         // Core p.228: DV17
    effect_duration:  "24 hours",
    primary_effect:   "INT +2 for 24 hours. Can exceed 8.",
    secondary_effect: "Addicted. INT -2 permanently while addicted.",
    heat_value:       1,
    maxtac_threshold: null,
    buyer_factions:   ["Netrunners", "Medtech community", "corpo workers"],
    notes:            "Cognitive enhancer. White-collar adjacent demand.",
  },
  {
    id:               "smash",
    name:             "Smash",
    cost_per_dose:    10,         // Core p.229: 10eb (Cheap)
    secondary_dv:     15,         // Core p.229: DV15
    effect_duration:  "4 hours",
    primary_effect:   "+2 to Dance, Contortionist, Conversation, Human Perception, Persuasion, Acting.",
    secondary_effect: "Addicted. -2 to same skills. Crave Smash regularly.",
    heat_value:       1,
    maxtac_threshold: null,
    buyer_factions:   ["Valentinos", "Piranhas", "street vendors", "Afterlife regulars"],
    notes:            "Yellow, foamy, sold in cans. Most common street drug.",
  },
  {
    id:               "synthcoke",
    name:             "Synthcoke",
    cost_per_dose:    20,         // Core p.229: 20eb (Everyday)
    secondary_dv:     15,         // Core p.229: DV15
    effect_duration:  "4 hours",
    primary_effect:   "REF +1 for 4 hours. Can exceed 8. Causes paranoid ideation.",
    secondary_effect: "Addicted. REF -2 while addicted.",
    heat_value:       1,
    maxtac_threshold: null,
    buyer_factions:   ["Solos", "gang fighters", "combat zone generally"],
    notes:            "Combat/performance enhancer. Wide demand.",
  },
];

// ── Cargo scale tiers ─────────────────────────────────────────────────────────
// Thresholds determine job type, payment tier, and primary threat.
// Payment calibrated to Core p.381 Job table — NOT the Hustle table.
// "The real way to get paid is to get a crew together to do a Job." — Core p.381

export const CARGO_TIERS = [
  {
    id:               "street_deal",
    label:            "Street Deal",
    dose_range:       [1, 9],
    job_type:         "easy",             // Core p.381: no armed resistance expected
    payment_min:      300,
    payment_max:      600,               // below Easy Job floor (500eb) — below proper job threshold
    primary_threat:   "none",
    notes:            "Personal amounts. No gang cares. Quick cash, minimal risk.",
  },
  {
    id:               "small_shipment",
    label:            "Small Shipment",  // Core Nomad Hustle: "Smuggled some small contraband"
    dose_range:       [10, 49],
    job_type:         "typical",         // Core p.381: armed resistance expected
    payment_min:      800,
    payment_max:      1200,              // Typical Job: ~1,000eb per person
    primary_threat:   "buyer_betrayal",  // At this scale, the buyer might just take it
    notes:            "Dealer-scale. Fixer vouches for the buyer — usually.",
  },
  {
    id:               "large_shipment",
    label:            "Large Shipment",  // Core Nomad Hustle: "Smuggled a huge shipment"
    dose_range:       [50, 149],
    job_type:         "dangerous",       // Core p.381: overwhelming resistance without prep
    payment_min:      1500,
    payment_max:      2500,              // Dangerous Job: ~2,000eb per person
    primary_threat:   "gang_territorial",// You're cutting into someone's supply chain
    notes:            "Distributor scale. Multiple gang factions now notice.",
  },
  {
    id:               "massive_shipment",
    label:            "Massive Shipment", // Core Fixer Hustle: "Brought in a rare, illegal, very hard to get item"
    dose_range:       [150, 9999],
    job_type:         "very_dangerous",
    payment_min:      3000,
    payment_max:      5000,              // Exceptional work, beyond standard table
    primary_threat:   "multiple_factions",
    notes:            "Supply chain level. All factions aware. Corporate interest possible.",
  },
];

// Weapons pay a 30% premium over equivalent drug tiers — cargo is more valuable.
// Core weapons cost: SMG 100eb, Assault Rifle 500eb, Grenade Launcher 500eb.
// A crate of 10 Assault Rifles = 5,000eb wholesale — Fixer margin is huge.
export const WEAPONS_PAYMENT_MULTIPLIER = 1.3;

// Black Lace commands a 50% premium at large scale due to MaxTac adjacency risk.
export const BLACK_LACE_PREMIUM_THRESHOLD = 50; // doses — above this, ×1.5 payment
export const BLACK_LACE_PAYMENT_MULTIPLIER = 1.5;

// ── Oracle probability modifiers ──────────────────────────────────────────────
// Maps street heat (0–5) to SPM Oracle probability tiers (p.32).
// The PRIMARY threat is always gang territorial, never NCPD at low heat.

export const HEAT_ORACLE_MODIFIERS = {
  // "Does NCPD notice us?" — baseline Impossible in Night City
  // Core p.318: drugs legal, cops underfunded, corrupt
  // Core p.302: "Lawman bribery is common and corruption the standard"
  ncpd_notice: {
    0: "Impossible",  // Night City — not the US, drugs are legal
    1: "Impossible",  // small amounts, nobody cares
    2: "Unlikely",    // medium volume — someone might have talked to a beat cop
    3: "Unlikely",    // large shipment — possible informant
    4: "50/50",       // very large — public incident during handoff likely
    5: "Likely",      // massive — firefight visibility draws response
  },

  // "Does the gang notice the handoff?" — the REAL threat at any scale
  // Core pp.308–309: gangs protect their supply chains violently
  gang_territorial: {
    0: "Unlikely",    // personal amounts — beneath gang notice
    1: "50/50",       // you're in their territory
    2: "Likely",      // large enough to cut into their business
    3: "Likely",      // you ARE the competition
    4: "Certain",     // undercutting a major supplier
    5: "Certain",     // all-out turf response
  },

  // "Is the buyer honest?" — scales with shipment value
  // Small amounts: Fixer vouched for them. Large amounts: too tempting.
  buyer_trustworthy: {
    0: "Likely",      // Fixer vouched, small stakes
    1: "Likely",
    2: "50/50",       // worth betraying at medium value
    3: "50/50",
    4: "Unlikely",    // large value — very tempting to just take it
    5: "Unlikely",    // enormous value — almost certainly a setup
  },

  // MaxTac — ONLY relevant for Black Lace in large quantities
  // Core p.227: Black Lace → 2d6 Humanity Loss per dose
  // Bulk supply → multiple cyberpsychos → MaxTac trigger
  // All other drugs: Impossible regardless of heat.
  maxtac_black_lace: {
    below_threshold: "Impossible",  // <50 doses
    above_threshold: {
      0: "Impossible",
      1: "Unlikely",    // 50–100 doses, dealer scale
      2: "50/50",       // 100–150 doses, distributor scale
      3: "Likely",      // 150+ doses, area destabilising
      4: "Certain",
      5: "Certain",
    },
  },
};

// ── Heat Clock sizing (SPM pp.24–26 Solo Play Clocks) ─────────────────────────
// Heat Clock runs in parallel with the Beat Chart.
// When it empties: NCPD/gang response triggers (Beat Chart pivots to Captured).
// Calibrated to SPM examples: 5d6 = "Beat-length suspense", 3d6 = "short-term".

export const HEAT_CLOCK_SIZES = {
  0: 5,  // 5d6 — clean record, standard run
  1: 5,  // still clean
  2: 4,  // 4d6 — known face in the area
  3: 4,
  4: 3,  // 3d6 — hot, they're looking
  5: 2,  // 2d6 — burning, running out of time
};

// Heat Clock triggers — when to roll the pool (SPM p.24)
export const HEAT_CLOCK_TRIGGERS = [
  "Combat breaks out in public during the run",
  "Oracle Complication result on any roll during handoff",
  "Beat Chart Cliffhanger beat where opposition is NCPD or gang",
  "Player fails a Stealth check in a contested area",
  "Oracle says 'Yes' to gang_territorial question",
];

// ── Street Heat accumulation rules ────────────────────────────────────────────
// Lives in cpr_arc_state.state.red_trade.street_heat (0–5)
// NOT a new table — stored in existing JSONB

export const HEAT_CHANGES = {
  run_started:          +1,  // every run adds baseline heat
  combat_in_public:     +1,  // firefight during a run
  captured_released:    +1,  // they know your face
  successful_extraction:-1,  // lay low after clean run
  monthly_decay:        -1,  // per in-game month via Simple Calendar
};

// ── Payment calculation ────────────────────────────────────────────────────────
// Final payment = tier base × multipliers
// Fixer takes 12% cut (stated in Core Fixer Hustle: "Got a Rocker a good Gig for your 12% fee")
// Player receives the remainder after Fixer fee

export function calculatePayment(cargoTier, cargoType, doses, fixerRank) {
  const tier = CARGO_TIERS.find(t =>
    doses >= t.dose_range[0] && doses <= t.dose_range[1]
  ) ?? CARGO_TIERS[0];

  let base = tier.payment_min +
    Math.floor(Math.random() * (tier.payment_max - tier.payment_min));

  // Weapon premium
  if (cargoType === "weapons") base = Math.floor(base * WEAPONS_PAYMENT_MULTIPLIER);

  // Black Lace premium at scale
  if (cargoType === "drugs" && doses >= BLACK_LACE_PREMIUM_THRESHOLD) {
    // Only if the cargo includes Black Lace
    base = Math.floor(base * BLACK_LACE_PAYMENT_MULTIPLIER);
  }

  // Fixer rank modifier — higher rank Fixers get better-paying jobs
  const rankBonus = Math.max(0, (fixerRank - 3) * 0.1); // +10% per rank above 3
  base = Math.floor(base * (1 + rankBonus));

  return base;
}

// ── Arrest & jail consequences ────────────────────────────────────────────────
// Sourced from Core pp.318–319.
// Sentence = 1d6 months, doubles per prior offense.
// Braindance = cryotank sensory deprivation — Core p.319.

export const SENTENCE_BASE_MONTHS_MIN = 1;
export const SENTENCE_BASE_MONTHS_MAX = 6;  // 1d6 months
export const SENTENCE_MULTIPLIER_PER_PRIOR = 2; // doubles each time

// What happens in jail
export const JAIL_CONSEQUENCES = {
  inventory_cleared: true,          // Core p.318: "lose all inventory on release"
  braindance_description:
    "Placed in a cryotank, wired to an interface loop program. " +
    "Continuous braindance creates a nightmare of unending, bland horror — " +
    "the thing cons fear most. The body is cooled; the mind is fully active. " +
    "— Core p.319",
  reputation_loss: 1,               // Core p.193: negative Reputation Level
  addiction_check_per_drug: true,   // WILL + Resist Torture/Drugs vs drug Secondary DV
  // Note: WILL stat comes from Foundry actor at time of arrest
};

// Addiction therapy available on release — Core p.230
export const ADDICTION_THERAPY = {
  cost:     1000,  // Core p.230: 1,000eb (Very Expensive)
  dv:       15,    // Core p.230: Medtech DV15
  duration: "1 week",
  effect:   "Removes one addiction. For 1 year after, automatically fail Secondary Effect rolls.",
};

// ── Housing loss by sentence length ──────────────────────────────────────────
// Core pp.377–380 housing ladder.
// Core p.377: "If you don't pay for your lifestyle at the start of a month,
//   you have one week to do so before you roll a Death Save at the start of
//   each day you don't."
// Extended jail = missed rent = eviction.
// Cody Pondsmith (SPM p.42): "Losing that house totally wrecked Hornet."

export const HOUSING_LOSS_BY_SENTENCE = [
  {
    months_min:     1,
    months_max:     1,
    housing_lost:   false,
    oracle_check:   true,
    oracle_question:"Did someone cover my rent or hold my place while I was inside?",
    oracle_prob:    "Likely",     // One month — contact might have covered it
    on_eviction:    "drop_one_tier",
    notes:          "Short stretch. Someone might have noticed. Fixer contact could have paid rent.",
  },
  {
    months_min:     2,
    months_max:     2,
    housing_lost:   false,
    oracle_check:   true,
    oracle_question:"Is my place still available after two missed months?",
    oracle_prob:    "Unlikely",   // Two months — landlord has almost certainly re-let
    on_eviction:    "drop_to_cargo_container",
    notes:          "Two months gone. Landlord probably re-let. Back to Cargo Container at best.",
  },
  {
    months_min:     3,
    months_max:     5,
    housing_lost:   true,
    oracle_check:   false,
    housing_floor:  "cube_hotel",  // 500eb/mo — minimum city housing
    notes:          "Three to five months. Evicted. Possessions seized or stolen. Cube Hotel floor.",
  },
  {
    months_min:     6,
    months_max:     11,
    housing_lost:   true,
    oracle_check:   false,
    housing_floor:  "street",      // Nothing. Sleep with DV15 Endurance or be fatigued.
    notes:          "Six months hard time. Released onto the street with nothing.",
  },
  {
    months_min:     12,
    months_max:     999,
    housing_lost:   true,
    oracle_check:   false,
    housing_floor:  "street",
    reputation_penalty: 2,         // Core p.193: Reputation Level for negative deeds
    notes:          "A year or more inside. Reputation hit. Everyone knew you were gone.",
  },
];

// ── Housing ladder (Core pp.378–380) for UI display ──────────────────────────
export const HOUSING_LADDER = [
  { id: "street",                monthly: 0,      desc: "Sleeping on the street. DV15 Endurance or fatigued every day." },
  { id: "street_vehicle",        monthly: 0,      desc: "Living in a vehicle. Limited security. Can't be in Corporate zones." },
  { id: "cube_hotel",            monthly: 500,    desc: "Single windowless room. Can't store possessions. Common bathroom." },
  { id: "cargo_container",       monthly: 1000,   desc: "Starting housing for all non-Exec edgerunners. Bed, fridge, lock." },
  { id: "studio_apartment",      monthly: 1500,   desc: "First private space. Own bathroom. Single parking space." },
  { id: "two_bedroom_apartment", monthly: 2500,   desc: "Comfortable. Two bedrooms, two parking spaces." },
  { id: "upscale_conapt",        monthly: 7500,   desc: "Two floors, master suite, three parking spaces." },
  { id: "luxury_penthouse",      monthly: 15000,  desc: "Top of building. Infinity pool, helipad, four parking spaces." },
];

// ── Narrative context builder ─────────────────────────────────────────────────
// Builds the description string for cpr_events.description
// NarrativeDirector picks this up via assessAndNudge() automatically.
// No modifications to NarrativeDirector needed.

export function buildRunEventDescription(eventType, cargo, streetHeat, extras = {}) {
  const heatDesc = ["clean","known face","flagged","hot","burning","on fire"][streetHeat] ?? "unknown";
  const cargoDesc = cargo.items?.map(i => `${i.quantity}x ${i.name}`).join(", ") ?? cargo.type;

  const base = `RED TRADE ${eventType.toUpperCase()}. ` +
    `Cargo: ${cargoDesc}. ` +
    `Buyer: ${cargo.buyer_name} (${cargo.buyer_faction}). ` +
    `Value: ${cargo.total_value}eb. ` +
    `Street Heat: ${streetHeat}/5 (${heatDesc}). `;

  const beatInstruction =
    `Beat Chart governs pacing — do not skip beats or resolve the run prematurely. ` +
    `Primary threat: ${cargo.primary_threat ?? "gang territorial"}, not NCPD. `;

  switch (eventType) {
    case "run_started":
      return base + beatInstruction +
        `Heat Clock: ${extras.clock_size ?? 5}d6 pool started. ` +
        `NCPD interest: ${HEAT_ORACLE_MODIFIERS.ncpd_notice[streetHeat]}. ` +
        `Gang interest: ${HEAT_ORACLE_MODIFIERS.gang_territorial[streetHeat]}.`;

    case "heat_tick":
      return base +
        `Heat Clock reduced. ${extras.remaining ?? 0}d6 remain. ` +
        (extras.remaining <= 1
          ? "CLOCK NEARLY EMPTY — imminent response incoming. Play Cliffhanger next."
          : "Pressure building.");

    case "clock_empty":
      return base +
        `HEAT CLOCK EMPTIED. Gang or NCPD response triggered. ` +
        `Beat Chart: pivot to Edgerunners Captured Resolution (Core p.407). ` +
        `Generate 1–3 Time Passed development beats before release.`;

    case "extraction":
      return base +
        `SUCCESSFUL EXTRACTION. Payment: ${extras.payment}eb. ` +
        `Street Heat -1. ` +
        `Beat Chart: play appropriate Resolution — Happy Ending or Pyrrhic Victory.`;

    case "arrested":
      return base +
        `ARRESTED. Sentence: ${extras.sentence_months} month(s) braindance. ` +
        `Inventory confiscated. Housing: ${extras.housing_outcome}. ` +
        `Beat Chart: Edgerunners Captured Resolution. ` +
        `Generate 1–3 Time Passed development beats for the sentence period.`;

    case "released":
      return base +
        `RELEASED from braindance sentence. ` +
        `Housing tier now: ${extras.new_housing_tier}. ` +
        `Prior offenses: ${extras.prior_count}. ` +
        `Addictions gained in jail: ${extras.addictions?.join(", ") || "none"}. ` +
        `Beat Chart: new Hook. This edgerunner is starting over.`;

    default:
      return base + beatInstruction;
  }
}
```

---

## Task 3 — `server/src/modules/cyberpunk-red/application/RedTradeEngine.ts` (NEW)

Pure utility class — no constructor, no DI. Same pattern as BeatChartEngine.

```typescript
/**
 * RedTradeEngine.ts — Red Trade DLC Logic
 *
 * Handles cargo generation, street heat, jail processing, and payment.
 * Does NOT modify NarrativeDirector — events feed into it via CPRRepository.logEvent().
 * Does NOT import from random-tables.js — table data is passed from Foundry as JSON.
 */

import { logger } from "../../core/logging.js";

export type CargoType = "drugs" | "weapons" | "cyberware" | "data";
export type RunOutcome = "extracted" | "captured" | "clock_empty" | "aborted";

export interface CargoItem {
  id:         string;
  name:       string;
  quantity:   number;
  unit_value: number;
  is_drug:    boolean;
  drug_dv?:   number;  // Secondary Effect DV if drug — for addiction checks on arrest
}

export interface CargoManifest {
  type:             CargoType;
  tier:             string;       // from CARGO_TIERS
  items:            CargoItem[];
  total_value:      number;
  payment:          number;       // what the player gets paid
  heat_base:        number;       // 1–3
  primary_threat:   string;
  buyer_name:       string;
  buyer_faction:    string;
  pickup_district:  string;
  dropoff_district: string;
  run_id:           string;       // uuid
}

export interface RedTradeState {
  street_heat:     number;        // 0–5
  active_run?:     ActiveRun;
  records:         CriminalRecord[];
  total_runs:      number;
  successful_runs: number;
}

export interface ActiveRun {
  run_id:           string;
  cargo:            CargoManifest;
  heat_clock_id:    string;       // ClocksApp clock id
  heat_clock_size:  number;       // d6 remaining
  started_at:       string;
  beat_skeleton_id?: string;
}

export interface CriminalRecord {
  run_id:           string;
  arrest_date:      string;
  cargo_type:       CargoType;
  sentence_months:  number;
  addictions:       string[];
  housing_before:   string;
  housing_after:    string;
  release_date:     string;
}

export interface ArrestResult {
  sentence_months:  number;
  addictions:       string[];
  housing_before:   string;
  housing_after:    string;
  release_date:     string;
  calendar_advanced: boolean;
  narrative_event:  string;
}

export interface ExtractionResult {
  payment:         number;
  heat_change:     number;       // always -1
  narrative_event: string;
  ip_tier:         string;       // for display: "Typical Job", "Dangerous Job" etc
}

export class RedTradeEngine {

  // ── Cargo generation ────────────────────────────────────────────────────────
  // tableData passed from Foundry to avoid importing .js tables on server

  static generateCargo(options: {
    cargoType?:  CargoType;
    districtId?: string;
    fixerRank?:  number;
    doses?:      number;
  }, tableData: {
    drugs:       any[];
    districts:   Record<string, any>;
    fixerNames:  string[];
  }): CargoManifest {

    const runId = crypto.randomUUID();
    const type = options.cargoType ?? this.rollCargoType();
    const fixerRank = options.fixerRank ?? 3;

    // Select buyer district and faction
    const district = options.districtId
      ? tableData.districts[options.districtId]
      : this.rollDistrict(tableData.districts, type);

    const buyer = this.generateBuyer(district, tableData.fixerNames);

    // Generate items
    const doses  = options.doses ?? this.rollDoses(fixerRank);
    const items  = this.generateItems(type, doses, tableData.drugs);
    const value  = items.reduce((sum, i) => sum + i.quantity * i.unit_value, 0);
    const tier   = this.getTier(doses);
    const payment = this.calculatePayment(tier, type, doses, fixerRank, items);

    return {
      type,
      tier:            tier.id,
      items,
      total_value:     value,
      payment,
      heat_base:       this.getHeatBase(type, items),
      primary_threat:  tier.primary_threat,
      buyer_name:      buyer.name,
      buyer_faction:   buyer.faction,
      pickup_district: this.rollPickupDistrict(district, tableData.districts),
      dropoff_district: district.id,
      run_id:          runId,
    };
  }

  private static rollCargoType(): CargoType {
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll <= 2) return "drugs";
    if (roll <= 4) return "weapons";
    if (roll === 5) return "cyberware";
    return "data";
  }

  private static rollDoses(fixerRank: number): number {
    // Higher rank Fixer = bigger jobs
    const base = Math.floor(Math.random() * 30) + 5;
    const bonus = (fixerRank - 1) * 15;
    return base + bonus;
  }

  private static getTier(doses: number): any {
    // Import-free — uses the same tier breakpoints as CARGO_TIERS in red-trade-data.js
    if (doses < 10)  return { id: "street_deal",      primary_threat: "none",               payment_min: 300,  payment_max: 600  };
    if (doses < 50)  return { id: "small_shipment",   primary_threat: "buyer_betrayal",      payment_min: 800,  payment_max: 1200 };
    if (doses < 150) return { id: "large_shipment",   primary_threat: "gang_territorial",    payment_min: 1500, payment_max: 2500 };
    return             { id: "massive_shipment",       primary_threat: "multiple_factions",   payment_min: 3000, payment_max: 5000 };
  }

  private static generateItems(type: CargoType, doses: number, drugs: any[]): CargoItem[] {
    if (type === "drugs") {
      // Pick 1–2 drug types, split quantity between them
      const count = doses > 20 ? (Math.random() > 0.5 ? 2 : 1) : 1;
      const selected = this.sample(drugs, count);
      return selected.map(drug => ({
        id:         drug.id,
        name:       drug.name,
        quantity:   Math.floor(doses / count),
        unit_value: drug.cost_per_dose,
        is_drug:    true,
        drug_dv:    drug.secondary_dv,
      }));
    }
    // Weapons/cyberware/data — generate as flat cargo item
    return [{
      id:         `${type}_crate`,
      name:       `${type.charAt(0).toUpperCase() + type.slice(1)} Shipment`,
      quantity:   doses,
      unit_value: type === "weapons" ? 100 : 50,
      is_drug:    false,
    }];
  }

  private static calculatePayment(tier: any, type: CargoType, doses: number, fixerRank: number, items: CargoItem[]): number {
    let base = tier.payment_min + Math.floor(Math.random() * (tier.payment_max - tier.payment_min));

    if (type === "weapons")  base = Math.floor(base * 1.3);

    const hasBlackLace = items.some(i => i.id === "black_lace");
    if (hasBlackLace && doses >= 50) base = Math.floor(base * 1.5);

    const rankBonus = Math.max(0, (fixerRank - 3) * 0.1);
    return Math.floor(base * (1 + rankBonus));
  }

  private static getHeatBase(type: CargoType, items: CargoItem[]): number {
    if (type === "weapons") return 2;
    const hasBlackLace = items.some(i => i.id === "black_lace");
    if (hasBlackLace) return 3;
    return 1;
  }

  private static rollDistrict(districts: Record<string, any>, type: CargoType): any {
    const ids = Object.keys(districts);
    return districts[ids[Math.floor(Math.random() * ids.length)]];
  }

  private static rollPickupDistrict(dropDistrict: any, districts: Record<string, any>): string {
    const ids = Object.keys(districts).filter(id => id !== dropDistrict?.id);
    return ids[Math.floor(Math.random() * ids.length)] ?? "watson";
  }

  private static generateBuyer(district: any, fixerNames: string[]): { name: string; faction: string } {
    const factions = district?.factions ?? ["Independent Buyer"];
    const faction = factions[Math.floor(Math.random() * factions.length)];
    const name = fixerNames[Math.floor(Math.random() * fixerNames.length)] ?? "Anonymous";
    return { name, faction };
  }

  private static sample<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
  }

  // ── Arrest processing ────────────────────────────────────────────────────────

  static processArrest(params: {
    cargo:          CargoManifest;
    priorOffenses:  number;
    willStat:       number;       // from Foundry actor
    currentHousing: string;
    currentDate?:   string;
  }): ArrestResult {

    // Sentence: 1d6 months × 2^priorOffenses (Core p.318: "mandatory prison terms")
    const baseMonths = Math.floor(Math.random() * 6) + 1;
    const sentenceMonths = baseMonths * Math.pow(2, params.priorOffenses);

    // Addiction checks for each drug in cargo
    // WILL + Resist Torture/Drugs (no skill known = 0) vs drug Secondary DV
    const addictions: string[] = [];
    for (const item of params.cargo.items) {
      if (item.is_drug && item.drug_dv) {
        const roll = params.willStat + Math.floor(Math.random() * 10) + 1;
        if (roll < item.drug_dv) {
          addictions.push(item.name);
        }
      }
    }

    // Housing loss determination
    const housingLoss = this.determineHousingLoss(sentenceMonths);
    const housingAfter = housingLoss.housing_lost
      ? housingLoss.housing_floor
      : params.currentHousing;

    // Narrative event description
    const narrativeEvent = this.buildArrestNarrative(
      params.cargo, sentenceMonths, addictions, params.currentHousing, housingAfter
    );

    return {
      sentence_months:   sentenceMonths,
      addictions,
      housing_before:    params.currentHousing,
      housing_after:     housingAfter ?? "street",
      release_date:      this.advanceDate(params.currentDate, sentenceMonths),
      calendar_advanced: true,
      narrative_event:   narrativeEvent,
    };
  }

  private static determineHousingLoss(months: number): any {
    if (months <= 1) return { housing_lost: false, oracle_check: true,  housing_floor: null };
    if (months <= 2) return { housing_lost: false, oracle_check: true,  housing_floor: "cargo_container" };
    if (months <= 5) return { housing_lost: true,  oracle_check: false, housing_floor: "cube_hotel" };
    if (months <= 11)return { housing_lost: true,  oracle_check: false, housing_floor: "street" };
    return               { housing_lost: true,  oracle_check: false, housing_floor: "street", reputation_penalty: 2 };
  }

  private static advanceDate(currentDate: string | undefined, months: number): string {
    if (!currentDate) return `${months} months later`;
    // Parse "Month Year" format (e.g. "November 2045")
    // Simple increment for display purposes
    return `${months} months after ${currentDate}`;
  }

  private static buildArrestNarrative(
    cargo: CargoManifest, months: number, addictions: string[], housingBefore: string, housingAfter: string
  ): string {
    const housingChange = housingBefore !== housingAfter
      ? `Housing lost — ${housingBefore} → ${housingAfter}. `
      : "Housing held. ";

    const addictionStr = addictions.length
      ? `Addictions gained inside: ${addictions.join(", ")}. ` +
        `Addiction Therapy available: 1,000eb (Core p.230). `
      : "";

    return (
      `ARRESTED. ${cargo.type} run for ${cargo.buyer_name} failed. ` +
      `Sentence: ${months} month(s) braindance — cryotank, sensory deprivation (Core p.319). ` +
      `Inventory confiscated on arrest. ` +
      housingChange +
      addictionStr +
      `Beat Chart: Edgerunners Captured Resolution (Core p.407). ` +
      `Play 1–3 Time Passed Development beats to cover the sentence period, ` +
      `then a new Hook when released. This edgerunner is starting over.`
    );
  }

  // ── Extraction processing ────────────────────────────────────────────────────

  static processExtraction(cargo: CargoManifest, streetHeat: number): ExtractionResult {
    const ipTier = cargo.tier === "street_deal"    ? "Easy Job"
                 : cargo.tier === "small_shipment"  ? "Typical Job"
                 : cargo.tier === "large_shipment"  ? "Dangerous Job"
                 : "Very Dangerous Job";

    return {
      payment:    cargo.payment,
      heat_change: -1,
      ip_tier:    ipTier,
      narrative_event:
        `SUCCESSFUL EXTRACTION. Cargo delivered to ${cargo.buyer_name} (${cargo.buyer_faction}). ` +
        `Payment: ${cargo.payment}eb (${ipTier} tier — Core p.381). ` +
        `Street Heat -1 (lay low after clean run). ` +
        `Beat Chart: play appropriate Resolution — Happy Ending or Pyrrhic Victory.`,
    };
  }

  // ── Arc state helpers ────────────────────────────────────────────────────────

  static getRedTradeState(arcState: any): RedTradeState {
    return arcState?.red_trade ?? {
      street_heat:     0,
      records:         [],
      total_runs:      0,
      successful_runs: 0,
    };
  }

  static updateStreetHeat(state: RedTradeState, change: number): number {
    return Math.max(0, Math.min(5, state.street_heat + change));
  }
}
```

---

## Task 4 — `server/src/modules/cyberpunk-red/delivery/trpc/router.ts` (MODIFY)

Read the file first. Add the `redTrade` sub-router after the existing
`chargen` sub-router. Follow the exact pattern of existing sub-routers.

```typescript
// Add import at top with other imports:
import { RedTradeEngine } from "../application/RedTradeEngine.js";

// Add sub-router inside cprRouter (after chargen sub-router):
redTrade: router({

  generateCargo: publicProcedure
    .input(z.object({
      world_id:   z.string().uuid(),
      cargo_type: z.enum(["drugs","weapons","cyberware","data"]).optional(),
      district_id:z.string().optional(),
      fixer_rank: z.number().min(1).max(10).default(3),
      doses:      z.number().optional(),
      // Table data passed from Foundry — keeps data layer in Foundry, not server
      drugs_table:    z.array(z.any()),
      districts_data: z.record(z.any()),
      fixer_names:    z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const repo = container.resolve<any>("ICPRRepository");

      const cargo = RedTradeEngine.generateCargo(
        {
          cargoType:  input.cargo_type as any,
          districtId: input.district_id,
          fixerRank:  input.fixer_rank,
          doses:      input.doses,
        },
        {
          drugs:      input.drugs_table,
          districts:  input.districts_data,
          fixerNames: input.fixer_names,
        }
      );

      // Get current arc state and update with new run
      const arcRow = await repo.getArcState(input.world_id);
      const arcState = arcRow?.state ?? {};
      const rtState = RedTradeEngine.getRedTradeState(arcState);

      const newHeat = RedTradeEngine.updateStreetHeat(rtState, 1); // +1 on run start
      const activeRun = {
        run_id:           cargo.run_id,
        cargo,
        heat_clock_id:    "",      // set by Foundry after ClocksApp.create()
        heat_clock_size:  [5,5,4,4,3,2][newHeat] ?? 5,
        started_at:       new Date().toISOString(),
      };

      await repo.saveArcState({
        ...arcState,
        red_trade: { ...rtState, street_heat: newHeat, active_run: activeRun, total_runs: rtState.total_runs + 1 }
      }, input.world_id);

      // Log as world event — NarrativeDirector picks this up automatically
      await repo.logEvent(
        input.world_id,
        "cpr.red_trade.run_started",
        `Red Trade run started — ${cargo.type} for ${cargo.buyer_name} (${cargo.buyer_faction}). ` +
        `Value: ${cargo.total_value}eb. Payment: ${cargo.payment}eb. ` +
        `Street Heat: ${newHeat}/5.`,
        "moderate",
        { cargo_type: cargo.type, tier: cargo.tier, payment: cargo.payment, heat: newHeat }
      );

      return { cargo, street_heat: newHeat, heat_clock_size: activeRun.heat_clock_size };
    }),

  processExtraction: publicProcedure
    .input(z.object({
      world_id: z.string().uuid(),
      run_id:   z.string(),
    }))
    .mutation(async ({ input }) => {
      const repo     = container.resolve<any>("ICPRRepository");
      const arcRow   = await repo.getArcState(input.world_id);
      const arcState = arcRow?.state ?? {};
      const rtState  = RedTradeEngine.getRedTradeState(arcState);

      if (!rtState.active_run || rtState.active_run.run_id !== input.run_id) {
        throw new Error("No matching active run found");
      }

      const result = RedTradeEngine.processExtraction(
        rtState.active_run.cargo, rtState.street_heat
      );
      const newHeat = RedTradeEngine.updateStreetHeat(rtState, result.heat_change);

      await repo.saveArcState({
        ...arcState,
        red_trade: {
          ...rtState,
          street_heat:     newHeat,
          active_run:      undefined,
          successful_runs: rtState.successful_runs + 1,
          total_runs:      rtState.total_runs,
        }
      }, input.world_id);

      await repo.logEvent(
        input.world_id,
        "cpr.red_trade.run_complete",
        result.narrative_event,
        "moderate",
        { payment: result.payment, heat_after: newHeat, ip_tier: result.ip_tier }
      );

      return { ...result, street_heat_after: newHeat };
    }),

  processArrest: publicProcedure
    .input(z.object({
      world_id:        z.string().uuid(),
      run_id:          z.string(),
      will_stat:       z.number().min(1).max(10),
      current_housing: z.string(),
      current_date:    z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const repo     = container.resolve<any>("ICPRRepository");
      const arcRow   = await repo.getArcState(input.world_id);
      const arcState = arcRow?.state ?? {};
      const rtState  = RedTradeEngine.getRedTradeState(arcState);

      if (!rtState.active_run) throw new Error("No active run to arrest");

      const priorOffenses = rtState.records.length;
      const result = RedTradeEngine.processArrest({
        cargo:          rtState.active_run.cargo,
        priorOffenses,
        willStat:       input.will_stat,
        currentHousing: input.current_housing,
        currentDate:    input.current_date,
      });

      const newRecord: CriminalRecord = {
        run_id:           input.run_id,
        arrest_date:      new Date().toISOString(),
        cargo_type:       rtState.active_run.cargo.type,
        sentence_months:  result.sentence_months,
        addictions:       result.addictions,
        housing_before:   result.housing_before,
        housing_after:    result.housing_after,
        release_date:     result.release_date,
      };

      const newHeat = RedTradeEngine.updateStreetHeat(rtState, 1); // +1 captured

      await repo.saveArcState({
        ...arcState,
        red_trade: {
          ...rtState,
          street_heat: newHeat,
          active_run:  undefined,
          records:     [...rtState.records, newRecord],
        }
      }, input.world_id);

      // Update housing tier and criminal record on world
      await repo.updateWorld(input.world_id, {
        criminal_record: [...(arcRow?.criminal_record ?? []), newRecord],
        housing_tier:    result.housing_after,
      } as any);

      await repo.logEvent(
        input.world_id,
        "cpr.red_trade.arrested",
        result.narrative_event,
        "major",
        { sentence_months: result.sentence_months, housing_after: result.housing_after }
      );

      return { ...result, street_heat_after: newHeat };
    }),

  getState: publicProcedure
    .input(z.object({ world_id: z.string().uuid() }))
    .query(async ({ input }) => {
      const repo     = container.resolve<any>("ICPRRepository");
      const arcRow   = await repo.getArcState(input.world_id);
      const arcState = arcRow?.state ?? {};
      const state    = RedTradeEngine.getRedTradeState(arcState);
      // Also get housing tier from world record
      const world    = await repo.getWorld(input.world_id);
      return { ...state, housing_tier: world?.housing_tier ?? "cargo_container" };
    }),
}),
```

---

## Task 5 — `foundry-module/scripts/data/red-trade-data.js` (NEW)

Create this file with all the data from Task 2 above.
This is the complete `DRUGS`, `CARGO_TIERS`, `HEAT_ORACLE_MODIFIERS`,
`HEAT_CLOCK_SIZES`, `HEAT_CLOCK_TRIGGERS`, `HEAT_CHANGES`,
`calculatePayment`, `SENTENCE_BASE_MONTHS_*`, `JAIL_CONSEQUENCES`,
`ADDICTION_THERAPY`, `HOUSING_LOSS_BY_SENTENCE`, `HOUSING_LADDER`,
and `buildRunEventDescription` — exactly as shown in Task 2.

Also add these Fixer name tables (for buyer name generation):

```javascript
// Canon Fixer names from Core pp.304–306 + SPM campaign example
export const CANON_FIXERS = [
  "Rogue", "Wakako Okada", "El Capitan", "Padre", "Regina Jones",
  "Fingers", "Garven Haakensen", "Hornet", "Rex Royale", "Fireman",
  "Mister Kernaghan", "Ms. Mynah", "Oscar the Bartender",
];

// Generic fixer handles for procedural generation
export const FIXER_HANDLES = [
  "Ghost", "Spider", "Wire", "Crow", "Viper", "Shade", "Chrome",
  "Static", "Diesel", "Cipher", "Nails", "Patch", "Vector", "Flux",
];
```

---

## Task 6 — `foundry-module/scripts/apps/RedTradeApp.js` (NEW)

Static utility class — same pattern as `MissionApp.js`.
No class constructor. All methods are `static async`.

```javascript
/**
 * RedTradeApp.js — Red Trade DLC Foundry Application
 *
 * Handles cargo generation UI, Heat Clock management via ClocksApp,
 * cargo handoff to buyer actors, jail time skips via Simple Calendar,
 * and journal export via MissionApp pattern.
 *
 * Server offline: cargo generation still works from local tables.
 * All server calls are wrapped in try/catch with silent fallback.
 */

import { ClocksApp }      from "./ClocksApp.js";
import { MissionApp }     from "./MissionApp.js";
import {
  DRUGS, CARGO_TIERS, HEAT_ORACLE_MODIFIERS, HEAT_CLOCK_SIZES,
  HEAT_CHANGES, CANON_FIXERS, FIXER_HANDLES,
  HOUSING_LADDER, HOUSING_LOSS_BY_SENTENCE,
  JAIL_CONSEQUENCES, ADDICTION_THERAPY,
  calculatePayment, buildRunEventDescription,
} from "../data/red-trade-data.js";
import { DISTRICTS }      from "../data/NightCityMap.js";

const MOD = "openclaw-cpr";

export class RedTradeApp {

  // ── Cargo generation ─────────────────────────────────────────────────────────

  static async generateCargo(options = {}) {
    const serverUrl = game.settings.get(MOD, "serverUrl") || "";
    const worldId   = game.settings.get(MOD, "worldId")   || "";

    if (serverUrl && worldId) {
      try {
        const res = await fetch(`${serverUrl}/api/cpr/redTrade/generateCargo`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            world_id:      worldId,
            cargo_type:    options.cargoType ?? null,
            district_id:   options.districtId ?? null,
            fixer_rank:    options.fixerRank ?? 3,
            doses:         options.doses ?? null,
            drugs_table:   DRUGS,
            districts_data:DISTRICTS,
            fixer_names:   [...CANON_FIXERS, ...FIXER_HANDLES],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          await game.settings.set(MOD, "redTradeActiveRun", JSON.stringify(data));
          return data;
        }
      } catch { /* fall through to local generation */ }
    }

    // Offline fallback — generate locally
    return this._generateCargoLocally(options);
  }

  static _generateCargoLocally(options = {}) {
    // Local generation mirrors RedTradeEngine logic without TypeScript
    const type = options.cargoType ?? (["drugs","drugs","weapons","cyberware"][Math.floor(Math.random()*4)]);
    const doses = options.doses ?? (Math.floor(Math.random() * 40) + 10);
    const tier  = CARGO_TIERS.find(t => doses >= t.dose_range[0] && doses <= t.dose_range[1]) ?? CARGO_TIERS[1];

    const drugs = type === "drugs"
      ? [DRUGS[Math.floor(Math.random() * DRUGS.length)]]
      : [];

    const items = drugs.length
      ? drugs.map(d => ({ id: d.id, name: d.name, quantity: doses, unit_value: d.cost_per_dose, is_drug: true, drug_dv: d.secondary_dv }))
      : [{ id: `${type}_crate`, name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Shipment`, quantity: doses, unit_value: type === "weapons" ? 100 : 50, is_drug: false }];

    const districtKeys = Object.keys(DISTRICTS);
    const distKey = options.districtId ?? districtKeys[Math.floor(Math.random() * districtKeys.length)];
    const district = DISTRICTS[distKey];
    const factions = district?.factions ?? ["Independent Buyer"];
    const faction  = factions[Math.floor(Math.random() * factions.length)];
    const fixerName= [...CANON_FIXERS, ...FIXER_HANDLES][Math.floor(Math.random() * (CANON_FIXERS.length + FIXER_HANDLES.length))];

    const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_value, 0);
    const payment    = calculatePayment(tier, type, doses, options.fixerRank ?? 3);

    return {
      cargo: {
        type, tier: tier.id, items, total_value: totalValue, payment,
        heat_base: type === "weapons" ? 2 : (drugs.some(d => d.id === "black_lace") ? 3 : 1),
        primary_threat: tier.primary_threat,
        buyer_name: fixerName, buyer_faction: faction,
        pickup_district: districtKeys[Math.floor(Math.random() * districtKeys.length)],
        dropoff_district: distKey,
        run_id: crypto.randomUUID(),
      },
      street_heat: 0,
      heat_clock_size: 5,
    };
  }

  // ── Heat Clock ────────────────────────────────────────────────────────────────
  // Uses ClocksApp — the Heat Clock IS a Solo Play Clock

  static async startHeatClock(runId, clockSize) {
    const clock = await ClocksApp.create(
      `Heat Clock — Run ${runId.slice(0, 6)}`,
      clockSize,
      "Gang/NCPD response triggered when clock empties."
    );
    // Store clock id in run state
    const runState = JSON.parse(game.settings.get(MOD, "redTradeActiveRun") || "{}");
    if (runState.cargo) {
      runState.heat_clock_id = clock.id;
      await game.settings.set(MOD, "redTradeActiveRun", JSON.stringify(runState));
    }
    return clock;
  }

  static async rollHeatClock() {
    const runState = JSON.parse(game.settings.get(MOD, "redTradeActiveRun") || "{}");
    if (!runState.heat_clock_id) return null;

    const result = await ClocksApp.trigger(runState.heat_clock_id);
    if (result.triggered) {
      // Clock emptied — gang/NCPD response incoming
      ui.notifications.warn("Heat Clock emptied — response incoming! The Beat Chart pivots to Captured.");
      await this._postHeatClockChat(result, true);
    } else {
      await this._postHeatClockChat(result, false);
    }
    return result;
  }

  static async _postHeatClockChat(result, triggered) {
    const colour = triggered ? "#cc2222" : "#cc8800";
    ChatMessage.create({
      content: `
<div style="font-family:'Jost',sans-serif;border-left:3px solid ${colour};padding:4px 8px;background:var(--cpr-background-row-even,#f5f5f5);">
  <strong style="color:${colour};">Heat Clock</strong> — 
  Rolled ${result.diceRolled}d6, removed ${result.diceRemoved}.
  <strong>${result.clock.remaining}d6 remaining.</strong>
  ${triggered ? "<br><em>Clock empty — response triggered.</em>" : ""}
</div>`,
      whisper: [game.user.id],
      speaker: { alias: "Red Trade" }
    });
  }

  // ── Cargo handoff ─────────────────────────────────────────────────────────────
  // Win condition: drop cargo to buyer actor + extract

  static async dropCargoToActor(cargo, targetActorId) {
    const actor = game.actors.get(targetActorId);
    if (!actor) {
      ui.notifications.error("Buyer actor not found.");
      return false;
    }

    // Create item documents on buyer actor
    const itemDocs = cargo.items.map(item => ({
      name:   item.name,
      type:   "gear",
      img:    "icons/consumables/potions/bottle-round-green.webp",
      system: { description: { value: `${item.quantity}× delivered by Red Trade run.` } }
    }));

    try {
      await actor.createEmbeddedDocuments("Item", itemDocs);
      ui.notifications.info(`Cargo delivered to ${actor.name}. Extract to collect payment.`);
      return true;
    } catch (err) {
      ui.notifications.error("Failed to transfer cargo to buyer.");
      console.error("[Red Trade] Cargo drop failed:", err);
      return false;
    }
  }

  // ── Extraction ────────────────────────────────────────────────────────────────

  static async processExtraction() {
    const serverUrl = game.settings.get(MOD, "serverUrl") || "";
    const worldId   = game.settings.get(MOD, "worldId")   || "";
    const runState  = JSON.parse(game.settings.get(MOD, "redTradeActiveRun") || "{}");

    if (!runState.cargo) { ui.notifications.warn("No active run."); return; }

    let result = {
      payment:          runState.cargo.payment,
      heat_change:      -1,
      street_heat_after: 0,
      ip_tier:          "Typical Job",
    };

    if (serverUrl && worldId) {
      try {
        const res = await fetch(`${serverUrl}/api/cpr/redTrade/processExtraction`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ world_id: worldId, run_id: runState.cargo.run_id }),
        });
        if (res.ok) result = { ...result, ...await res.json() };
      } catch { /* use local result */ }
    }

    await game.settings.set(MOD, "redTradeActiveRun", "");

    // Post payment chat card
    ChatMessage.create({
      content: `
<div style="font-family:'Jost',sans-serif;border-left:3px solid #44cc88;padding:6px 10px;background:var(--cpr-background-row-even,#f5f5f5);">
  <div style="font-family:'Rubik',font-variant:small-caps;font-weight:800;color:#44cc88;">Run Complete</div>
  <strong>${runState.cargo.buyer_name}</strong> (${runState.cargo.buyer_faction})<br>
  Payment: <strong>${result.payment}eb</strong> · ${result.ip_tier}<br>
  Street Heat: ${result.street_heat_after}/5
</div>`,
      whisper: [game.user.id],
      speaker: { alias: "Red Trade" }
    });

    Hooks.call("cprRedTrade.runComplete", result);
    return result;
  }

  // ── Arrest / jail ─────────────────────────────────────────────────────────────

  static async processArrest() {
    const serverUrl = game.settings.get(MOD, "serverUrl") || "";
    const worldId   = game.settings.get(MOD, "worldId")   || "";
    const runState  = JSON.parse(game.settings.get(MOD, "redTradeActiveRun") || "{}");

    if (!runState.cargo) { ui.notifications.warn("No active run."); return; }

    // Get player actor for WILL stat
    const actorId = game.settings.get(MOD, "playerActorId");
    const actor   = actorId ? game.actors.get(actorId) : null;
    const willStat= actor?.system?.stats?.will?.value ?? 5;

    const currentHousing = game.settings.get(MOD, "playerHousingTier") || "cargo_container";

    let result = null;

    if (serverUrl && worldId) {
      try {
        const res = await fetch(`${serverUrl}/api/cpr/redTrade/processArrest`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            world_id: worldId, run_id: runState.cargo.run_id,
            will_stat: willStat, current_housing: currentHousing,
          }),
        });
        if (res.ok) result = await res.json();
      } catch { /* fall through to local */ }
    }

    if (!result) {
      // Local fallback
      const months   = Math.floor(Math.random() * 6) + 1;
      const addictions = runState.cargo.items
        .filter(i => i.is_drug)
        .filter(i => (willStat + Math.floor(Math.random()*10)+1) < i.drug_dv)
        .map(i => i.name);
      result = { sentence_months: months, addictions, housing_before: currentHousing, housing_after: currentHousing };
    }

    await game.settings.set(MOD, "redTradeActiveRun", "");
    await game.settings.set(MOD, "playerHousingTier", result.housing_after);

    // Advance Simple Calendar if available
    if (result.sentence_months > 0) {
      try {
        const sc = game.modules.get("foundryvtt-simple-calendar");
        if (sc?.active && window.SimpleCalendar?.api) {
          SimpleCalendar.api.addDays(result.sentence_months * 30);
          ui.notifications.info(`Calendar advanced ${result.sentence_months * 30} days (braindance sentence).`);
        }
      } catch { /* Simple Calendar not installed */ }
    }

    // Post arrest consequence card
    this._postArrestCard(result, runState.cargo);

    // IMPORTANT: inventory clearing requires user confirmation (prohibited automated action)
    // Notify player to clear inventory manually
    if (JAIL_CONSEQUENCES.inventory_cleared) {
      ui.notifications.warn(
        `Arrested. Clear your inventory manually — everything was confiscated on arrest. ` +
        `Sentence: ${result.sentence_months} month(s).`
      );
      Dialog.prompt({
        title: "Inventory Confiscated",
        content: `<p>Your character was arrested. Per Core p.318, all inventory is confiscated.</p>
          <p>Please manually clear your character sheet items.</p>
          <p>Housing: ${result.housing_before} → <strong>${result.housing_after}</strong></p>
          ${result.addictions?.length ? `<p>Addictions gained in jail: <strong>${result.addictions.join(", ")}</strong><br>Addiction Therapy: 1,000eb (Core p.230)</p>` : ""}`,
        label: "Understood",
        callback: () => {},
      });
    }

    Hooks.call("cprRedTrade.arrested", result);
    return result;
  }

  static _postArrestCard(result, cargo) {
    ChatMessage.create({
      content: `
<div style="font-family:'Jost',sans-serif;border-left:3px solid #cc2222;padding:6px 10px;background:var(--cpr-background-row-even,#f5f5f5);">
  <div style="font-family:'Rubik',font-variant:small-caps;font-weight:800;color:#cc2222;">Arrested</div>
  Sentence: <strong>${result.sentence_months} month(s)</strong> — braindance cryotank<br>
  ${result.addictions?.length ? `Addictions: <strong>${result.addictions.join(", ")}</strong><br>` : ""}
  Housing: ${result.housing_before} → <strong>${result.housing_after}</strong><br>
  <em style="font-size:0.7rem;color:#888;">Clear inventory manually. Addiction Therapy: 1,000eb.</em>
</div>`,
      whisper: [game.user.id],
      speaker: { alias: "Red Trade" }
    });
  }

  // ── State ─────────────────────────────────────────────────────────────────────

  static getActiveRun() {
    const raw = game.settings.get(MOD, "redTradeActiveRun") || "";
    return raw ? JSON.parse(raw) : null;
  }

  static async getStreetHeat() {
    try {
      const serverUrl = game.settings.get(MOD, "serverUrl") || "";
      const worldId   = game.settings.get(MOD, "worldId")   || "";
      if (serverUrl && worldId) {
        const res = await fetch(`${serverUrl}/api/cpr/redTrade/getState?input=${encodeURIComponent(JSON.stringify({ world_id: worldId }))}`);
        if (res.ok) { const d = await res.json(); return d.street_heat ?? 0; }
      }
    } catch {}
    return 0;
  }

  // ── Journal export ────────────────────────────────────────────────────────────

  static async exportRunToJournal(cargo, outcome) {
    // Reuse the existing MissionApp journal folder
    const folderName = "OpenClaw — Red Trade";
    let folder = game.folders.find(f => f.name === folderName && f.type === "JournalEntry");
    if (!folder) folder = await Folder.create({ name: folderName, type: "JournalEntry", color: "#cc2222" });

    const statusColour = outcome === "extracted" ? "#44cc88" : "#cc2222";
    const statusLabel  = outcome === "extracted" ? "EXTRACTED" : "CAPTURED";

    const html = `
<div style="font-family:'Jost',sans-serif;color:var(--cpr-text-normal);">
  <h2 style="font-family:'Rubik';font-variant:small-caps;background:${statusColour};color:#fff;padding:3px 8px;margin:0 0 8px;">
    Red Trade — ${cargo.type.toUpperCase()} — ${statusLabel}
  </h2>
  <p><strong>Buyer:</strong> ${cargo.buyer_name} (${cargo.buyer_faction})</p>
  <p><strong>Pickup:</strong> ${cargo.pickup_district} → <strong>Dropoff:</strong> ${cargo.dropoff_district}</p>
  <p><strong>Cargo:</strong> ${cargo.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}</p>
  <p><strong>Value:</strong> ${cargo.total_value}eb &nbsp;·&nbsp; <strong>Payment:</strong> ${cargo.payment}eb</p>
  <hr>
  <p style="font-size:0.75rem;color:var(--cpr-text-icon-dimmed);">
    Run ID: ${cargo.run_id.slice(0, 8)}
  </p>
</div>`;

    const entry = await JournalEntry.create({
      name:    `Run — ${cargo.type} — ${new Date().toLocaleDateString()}`,
      folder:  folder.id,
      ownership: { default: 2 },
    });
    await entry.createEmbeddedDocuments("JournalEntryPage", [{
      name: "Run Report", type: "text",
      text: { content: html, format: 1 }
    }]);
    entry.sheet.render(true);
    return entry;
  }
}
```

---

## Task 7 — `foundry-module/scripts/hooks/red-trade-hooks.js` (NEW)

```javascript
/**
 * red-trade-hooks.js — Red Trade DLC Foundry Hooks
 */

import { RedTradeApp } from "../apps/RedTradeApp.js";

const MOD = "openclaw-cpr";

export function redTradeHooks() {
  // Settings are registered in init.js (Task 9)

  // Hook: targeted token during active run = buyer check
  Hooks.on("targetToken", (user, token, targeted) => {
    if (!targeted || user.id !== game.user.id) return;
    const run = RedTradeApp.getActiveRun();
    if (!run?.cargo) return;

    const actorName  = token.actor?.name?.toLowerCase() ?? "";
    const buyerName  = run.cargo.buyer_name.toLowerCase();
    const buyerFaction = run.cargo.buyer_faction.toLowerCase();

    const isMatch = actorName.includes(buyerName) ||
      (token.actor?.system?.roleInfo?.role ?? "").toLowerCase().includes(buyerFaction);

    if (isMatch) {
      Dialog.confirm({
        title:   "Deliver Cargo?",
        content: `<p>Drop cargo to <strong>${token.actor.name}</strong> (${run.cargo.buyer_faction})?</p>
          <p>${run.cargo.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}</p>`,
        yes: async () => {
          const ok = await RedTradeApp.dropCargoToActor(run.cargo, token.actor.id);
          if (ok) {
            Dialog.confirm({
              title:   "Extract?",
              content: `<p>Cargo delivered. Reach the extraction point and confirm payment of <strong>${run.cargo.payment}eb</strong>.</p>`,
              yes: () => RedTradeApp.processExtraction(),
              no:  () => {},
            });
          }
        },
        no: () => {},
      });
    }
  });

  // Hook: clock triggered externally → check if it's a Heat Clock
  Hooks.on("cprSoloMode.clockTriggered", async (clock) => {
    const run = RedTradeApp.getActiveRun();
    if (!run) return;
    if (run.heat_clock_id !== clock.id) return;
    // Heat Clock emptied — gang/NCPD response
    ui.notifications.warn("Heat Clock empty — Beat Chart pivots to Edgerunners Captured.");
    const confirm = await Dialog.confirm({
      title:   "Heat Clock Empty",
      content: `<p>The Heat Clock has emptied. Your cover is blown.</p>
        <p>Beat Chart: Resolution — Edgerunners Captured (Core p.407).</p>
        <p>Process arrest? This will calculate your sentence and housing consequences.</p>`,
      yes: () => true, no: () => false,
    });
    if (confirm) await RedTradeApp.processArrest();
  });
}
```

---

## Task 8 — `foundry-module/scripts/hooks/init.js` (MODIFY)

Add these three settings inside the existing `Hooks.once("init")` callback,
after the existing settings:

```javascript
// Red Trade DLC settings
game.settings.register(MOD, "redTradeEnabled", {
  name:    "Enable Red Trade Operations",
  hint:    "Adds the Red Trade tab. Drug/weapons run missions with Heat and Jail systems.",
  scope:   "world",
  config:  true,
  type:    Boolean,
  default: true,
});

game.settings.register(MOD, "redTradeActiveRun", {
  scope:   "world",
  config:  false,
  type:    String,
  default: "",
});

game.settings.register(MOD, "playerHousingTier", {
  scope:   "world",
  config:  true,
  name:    "Player Housing Tier",
  hint:    "Current housing (Core pp.377-380). Updated automatically on arrest.",
  type:    String,
  default: "cargo_container",
  choices: {
    street:                "Street (0eb/mo — Fatigue daily)",
    street_vehicle:        "Street — Vehicle (0eb/mo)",
    cube_hotel:            "Cube Hotel (500eb/mo)",
    cargo_container:       "Cargo Container (1,000eb/mo) — starting housing",
    studio_apartment:      "Studio Apartment (1,500eb/mo)",
    two_bedroom_apartment: "Two-Bedroom Apartment (2,500eb/mo)",
    upscale_conapt:        "Upscale Conapt (7,500eb/mo)",
    luxury_penthouse:      "Luxury Penthouse (15,000eb/mo)",
  },
});
```

---

## Task 9 — `foundry-module/scripts/module.js` (MODIFY)

Add import and boot call. Read the file first:

```javascript
// Add import after chargenHooks import:
import { redTradeHooks } from "./hooks/red-trade-hooks.js";

// Add boot call after chargenHooks():
redTradeHooks();
```

---

## Task 10 — `foundry-module/scripts/apps/SoloModePanel.js` (MODIFY)

Read the file first. In `_prepareContext()`:

```javascript
// Add import at top of file:
import { RedTradeApp }  from "./RedTradeApp.js";
import { HOUSING_LADDER, HEAT_ORACLE_MODIFIERS } from "../data/red-trade-data.js";
import { DISTRICTS }   from "../data/NightCityMap.js";

// Add to the returned context object in _prepareContext():
redTradeEnabled: game.settings.get("openclaw-cpr", "redTradeEnabled"),
redTradeRun:     RedTradeApp.getActiveRun(),
playerHousing:   game.settings.get("openclaw-cpr", "playerHousingTier"),
housingLadder:   HOUSING_LADDER,
districts:       Object.entries(DISTRICTS).map(([id, d]) => ({ id, name: d.name ?? id })),
// Street heat loaded async — use 0 as default, update after render
streetHeat:      0,
```

In `_onRender()`, add after existing event listeners:

```javascript
// Red Trade tab handlers
html.querySelector("#spm-rt-start-btn")?.addEventListener("click", async () => {
  const cargoType  = html.querySelector("#spm-rt-cargo-type")?.value || null;
  const districtId = html.querySelector("#spm-rt-district")?.value   || null;
  const result     = await RedTradeApp.generateCargo({ cargoType, districtId });
  if (result?.cargo) {
    await RedTradeApp.startHeatClock(result.cargo.run_id, result.heat_clock_size);
    this.render({ force: true });
  }
});

html.querySelector("#spm-rt-roll-heat")?.addEventListener("click", async () => {
  await RedTradeApp.rollHeatClock();
});

html.querySelector("#spm-rt-abort")?.addEventListener("click", async () => {
  const ok = await Dialog.confirm({
    title:   "Abort Run?",
    content: "<p>Abort this run? The cargo is lost but no arrest will be processed.</p>",
    yes: () => true, no: () => false,
  });
  if (ok) {
    await game.settings.set("openclaw-cpr", "redTradeActiveRun", "");
    this.render({ force: true });
  }
});

html.querySelector("#spm-rt-arrest-btn")?.addEventListener("click", async () => {
  await RedTradeApp.processArrest();
  this.render({ force: true });
});

// Load street heat async and update meter
RedTradeApp.getStreetHeat().then(heat => {
  const pips = html.querySelectorAll(".spm-heat-pip");
  pips.forEach((pip, i) => {
    pip.classList.toggle("active", i < heat);
    pip.classList.toggle("hot",    i < heat && heat >= 4);
  });
});
```

---

## Task 11 — `foundry-module/templates/panel-main.hbs` (MODIFY)

Read the file first. Add after the IP tab button in the nav:

```handlebars
{{#if redTradeEnabled}}
<button class="spm-tab-btn {{#if (eq activeTab 'redtrade')}}active{{/if}}"
        data-tab="redtrade">
  <i class="fas fa-box-open"></i> Red Trade
</button>
{{/if}}
```

Add after the IP tab section (before closing `</div>`):

```handlebars
{{#if redTradeEnabled}}
<section class="spm-tab-content {{#if (eq activeTab 'redtrade')}}active{{/if}}"
         data-tab="redtrade">

  {{!-- Street Heat meter --}}
  <div class="spm-section">
    <h3>Street Heat
      <span class="spm-hint" style="font-size:0.65rem;font-weight:400;">
        Gang threat threshold — not NCPD (Core p.302)
      </span>
    </h3>
    <div class="spm-heat-meter">
      <div class="spm-heat-pip" data-heat="0" title="Clean — Impossible for NCPD">0</div>
      <div class="spm-heat-pip" data-heat="1" title="Known face — Gangs at 50/50">1</div>
      <div class="spm-heat-pip" data-heat="2" title="Flagged — Gangs Likely">2</div>
      <div class="spm-heat-pip" data-heat="3" title="Hot — Heat Clock starts at 4d6">3</div>
      <div class="spm-heat-pip" data-heat="4" title="Burning — NCPD now 50/50">4</div>
      <div class="spm-heat-pip" data-heat="5" title="On Fire — Heat Clock 2d6, NCPD Likely">5</div>
    </div>
  </div>

  {{!-- Housing tier --}}
  <div class="spm-section">
    <h3>Housing — {{playerHousing}}</h3>
    <div class="spm-housing-ladder">
      {{#each housingLadder}}
      <div class="spm-housing-rung {{#if (eq this.id ../playerHousing)}}current{{/if}}">
        <span class="spm-housing-name">{{this.id}}</span>
        <span class="spm-housing-cost">{{this.monthly}}eb/mo</span>
      </div>
      {{/each}}
    </div>
  </div>

  {{!-- Active run --}}
  {{#if redTradeRun.cargo}}
  <div class="spm-section">
    <h3>Active Run — {{redTradeRun.cargo.type}}</h3>
    <div class="spm-run-target">
      <strong>{{redTradeRun.cargo.buyer_name}}</strong>
      ({{redTradeRun.cargo.buyer_faction}})
    </div>
    <ul class="spm-cargo-manifest">
      {{#each redTradeRun.cargo.items}}
      <li class="spm-cargo-item">
        {{this.quantity}}× {{this.name}}
        ({{this.unit_value}}eb ea.)
        {{#if this.is_drug}}
          <span class="cg-hint-inline">Secondary DV{{this.drug_dv}}</span>
        {{/if}}
      </li>
      {{/each}}
    </ul>
    <div class="spm-run-payment">Payment on extraction: <strong>{{redTradeRun.cargo.payment}}eb</strong></div>
    <div class="spm-mactions">
      <button id="spm-rt-roll-heat" class="spm-btn spm-dice-btn">🎲 Roll Heat Clock</button>
      <button id="spm-rt-arrest-btn" class="spm-btn spm-btn-danger">🚔 Process Arrest</button>
      <button id="spm-rt-abort" class="spm-btn spm-btn-danger" style="opacity:0.7;">Abort Run</button>
    </div>
  </div>
  {{else}}
  <div class="spm-section">
    <h3>Start a Run</h3>
    <div class="spm-mrow" style="gap:0.313rem;flex-wrap:wrap;">
      <select id="spm-rt-cargo-type" class="spm-select">
        <option value="">— Random cargo —</option>
        <option value="drugs">Drugs</option>
        <option value="weapons">Weapons</option>
        <option value="cyberware">Cyberware</option>
        <option value="data">Data</option>
      </select>
      <select id="spm-rt-district" class="spm-select">
        <option value="">— Any district —</option>
        {{#each districts}}
        <option value="{{this.id}}">{{this.name}}</option>
        {{/each}}
      </select>
      <button id="spm-rt-start-btn" class="spm-btn spm-btn-primary">
        Start Red Trade Run
      </button>
    </div>
    <p class="spm-hint">Generates cargo, buyer, and Heat Clock. Beat Chart generated automatically.</p>
  </div>
  {{/if}}

</section>
{{/if}}
```

---

## Task 12 — `foundry-module/styles/cpr-solo-mode.css` (APPEND)

Add to the end of the file:

```css
/* ── Red Trade DLC ─────────────────────────────────────────────────────────── */

.spm-heat-meter {
  display: flex;
  gap: 0.188rem;
  padding: 0.25rem 0;
}

.spm-heat-pip {
  flex: 1;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--cpr-font-smallest, 0.6rem);
  font-variant: small-caps;
  font-weight: 700;
  background: var(--oc-bg-tab-off);
  border: 0.125rem solid var(--oc-border-faint);
  color: var(--oc-text-muted);
  cursor: default;
}
.spm-heat-pip.active { background: #b8860b; color: #fff; border-color: #b8860b; }
.spm-heat-pip.hot    { background: var(--oc-red); color: var(--oc-text-header); border-color: var(--oc-red); }

.spm-housing-ladder {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.spm-housing-rung {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: var(--cpr-font-smaller, 0.7rem);
  background: var(--oc-bg-row-even);
  border: 0.063rem solid var(--oc-border-faint);
  color: var(--oc-text-muted);
}
.spm-housing-rung.current {
  background: var(--oc-bg-dark);
  color: var(--oc-text-header);
  border-color: var(--oc-border);
  font-weight: 700;
}
.spm-housing-name { font-variant: small-caps; }
.spm-housing-cost { font-size: var(--cpr-font-smallest, 0.6rem); }

.spm-cargo-manifest {
  list-style: none;
  margin: 0.25rem 0;
  padding: 0;
  border: 0.063rem solid var(--oc-border-faint);
}
.spm-cargo-item {
  padding: 0.188rem 0.5rem;
  font-size: var(--cpr-font-smaller, 0.7rem);
  color: var(--oc-text);
  border-bottom: 0.063rem solid var(--oc-border-faint);
}
.spm-cargo-item:nth-child(even) { background: var(--oc-bg-row-odd); }

.spm-run-target {
  padding: 0.25rem 0.5rem;
  background: var(--oc-bg-dark);
  color: var(--oc-text-header);
  font-size: var(--cpr-font-smaller, 0.7rem);
  font-variant: small-caps;
  margin-bottom: 0.25rem;
}
.spm-run-target strong { color: #b8860b; }

.spm-run-payment {
  font-size: var(--cpr-font-smaller, 0.7rem);
  color: var(--oc-text-muted);
  padding: 0.188rem 0.5rem;
  text-align: right;
}
.spm-run-payment strong { color: #44cc88; }
```

---

## Verification checklist

- [ ] Drug costs match Core exactly: Smash 10eb, Blue/Synthcoke 20eb, Black Lace/Boost 50eb
- [ ] Drug Secondary DVs: Smash/Blue Glass/Synthcoke = 15, Black Lace/Boost = 17
- [ ] NCPD Oracle: Heat 0–1 = Impossible, Heat 2–3 = Unlikely, Heat 4–5 = 50/50+
- [ ] Gang Oracle: Heat 0 = Unlikely, Heat 1–2 = 50/50, Heat 3+ = Likely/Certain
- [ ] MaxTac: only triggered by Black Lace at 50+ doses
- [ ] Payment tiers from Job table: street deal 300–600, small 800–1,200, large 1,500–2,500, massive 3,000–5,000
- [ ] Weapons run pays 30% more than drug run at same tier
- [ ] Black Lace 50+ doses pays 50% premium
- [ ] Sentence = 1d6 × 2^(prior offenses)
- [ ] 1 month: Oracle check (Likely) for housing survival
- [ ] 2 months: Oracle check (Unlikely) for housing survival
- [ ] 3–5 months: housing floor = cube_hotel (500eb/mo)
- [ ] 6–11 months: housing floor = street (0eb, daily DV15 Endurance)
- [ ] 12+ months: housing floor = street + Reputation penalty
- [ ] Therapy RESTORES Humanity — never causes it (Core p.230)
- [ ] Addiction check uses WILL stat + 1d10 vs drug Secondary DV
- [ ] Addiction Therapy available on release: 1,000eb, DV15, removes addiction
- [ ] Inventory clearing prompts user — never automated
- [ ] Heat Clock uses ClocksApp.create() + ClocksApp.trigger()
- [ ] NarrativeDirector NOT modified — events flow via repo.logEvent()
- [ ] Server offline: cargo generation works from local DRUGS + DISTRICTS tables
- [ ] redTradeEnabled setting = off means zero Red Trade UI visible
- [ ] Housing tier persists via game.settings "playerHousingTier"
- [ ] Journal export uses same folder+style pattern as MissionApp.exportToJournal()

---

## Source references

- Core p.227–229: Black Lace, Blue Glass, Boost, Smash, Synthcoke (exact costs and DVs)
- Core p.229–230: Addiction Therapy 1,000eb DV15 — RESTORES Humanity, does NOT cause it
- Core p.302: NCPD underfunded, corrupt, bribery standard
- Core p.308–309: Gang descriptions — Voodoo Boys deal drugs, Piranhas use and deal
- Core p.318: Drugs legal in Night City ("Smoke 'em if ya got em")
- Core p.318–319: Punishment — braindance cryotank, inventory loss, prison description
- Core pp.377–380: Complete housing ladder with exact monthly costs
- Core p.381: Job payment table — Easy 500eb, Typical 1,000eb, Dangerous 2,000eb
- Core pp.383–384: Fixer/Nomad Hustle — smuggling context, 12% Fixer fee
- SPM pp.24–26: Solo Play Clocks — Heat Clock pattern
- SPM p.32: Oracle probability tiers (Certain/Likely/50-50/Unlikely/Impossible)
- SPM p.42: Cody Pondsmith on Hornet's house — design intent for housing loss
