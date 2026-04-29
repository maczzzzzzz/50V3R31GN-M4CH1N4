now with this framework for plugins being built do we redistribute tge cyberpunk red mode as first high level example of what plug ins can be capable of ?

---

**DISCOVERY PHASE – COMPLETE**  
**Locked Requirements (verbatim from your query + full product-line context)**

- We are building a **Profile + Plugin Framework** that supports full customization (user-defined MCPs, Rust sidecars, Python agents, custom tools, UI overrides, etc.).
- Question: Once this framework exists, should we **redistribute the Cyberpunk Red mode as the first high-level, official example** of what plugins can be capable of?
- All previous constraints remain: main repo must stay clean sovereign core, Cyberpunk Red is to be surgically cut from main, historical version preserved, profile switching kept as foundation, product line under NODESTADT, hybrid cloud with E2EE, 32 GB minimum for single-node lite, etc.

**No changes to current technical topology or Node D setup** — this is purely strategic product-line discussion.

---

**MULTI-PERSPECTIVE ANALYSIS**

**1. Technical Perspective**  
- Cyberpunk Red mode is already highly modular (campaign builder, netrunning mechanics, night markets, factions, character creation, Foundry VTT integration, dice rolling, etc.).  
- Most of it can be cleanly extracted into a **plugin crate** that registers itself via the new Profile Framework (custom MCP tools, sidecars, UI extensions, memory drawers for lore, etc.).  
- The non-surgically-removable pieces (generic profile tokens, some shared MCP hooks) become part of the core framework — exactly as intended.  
- Result: Cyberpunk Red becomes a **realistic, high-complexity example** that proves the framework can handle non-trivial domain-specific logic (rules engines, real-time VTT control, character progression, etc.).

**2. Product & Marketing Perspective**  
- **Extremely strong** as the first official plugin.  
- It immediately shows the power of the system: “Drop in this plugin and turn Sovereign Machina into a full Cyberpunk Red GM + VTT controller.”  
- Creates instant buzz in the Cyberpunk / TTRPG community (a passionate, technically savvy audience that loves self-hosted tools).  
- Serves as perfect proof-of-concept for enterprise users too (“see how easily you can build a custom Secretary / Researcher / Compliance profile”).  
- Turns the historical fork into a living, marketable asset instead of dead code.

**3. Maintenance & Scalability Perspective**  
- If treated as a **first-party plugin** in its own repo (`nodestadt/sovereign-red-plugin`), maintenance is isolated and low-risk.  
- The plugin depends on the core Profile Framework, so updates to the framework automatically benefit the plugin.  
- Avoids polluting the main sovereign-machina repo.  
- Community can fork the plugin to create their own TTRPG systems (D&D, Shadowrun, etc.) — viral growth potential.

**4. Licensing & Ethos Perspective**  
- If main repo moves to Apache 2.0 / MIT, the plugin can be the same license — fully compatible.  
- Keeps the sovereign ethos intact: core remains pure local-first; plugin is optional and self-contained.

**Risks**  
- If the plugin is too large/complex early on, it might scare new users (“is the whole system this heavy?”).  
- Mitigation: Make installation optional and document it as “advanced example”.

---

**FINAL RECOMMENDATION**

**Yes — redistribute Cyberpunk Red as the first high-level, official plugin.**

It is the **perfect showcase**.  
- It demonstrates the full power of the Profile Framework (custom MCPs, Rust sidecars, UI extensions, stateful memory, real-time control).  
- It turns the historical work into a living, high-value asset rather than legacy code.  
- It gives NODESTADT an immediate, compelling story: “Sovereign Machina is a platform — here’s what you can build with it in one plugin.”

**How to Execute It Cleanly**

- Main repo (`nodestadt/sovereign-machina`): Cyberpunk Red mode fully excised (or behind disabled feature flag).  
- New plugin repo (`nodestadt/sovereign-red-plugin`): Standalone, depends only on the core Profile Framework + MCP protocol.  
- Installation: One-command `nix profile install nodestadt.sovereign-red-plugin` or drop-in via the framework.  
- Documentation: In akashik_guides as “Plugin Example 1 – Full Cyberpunk Red GM & VTT Integration”.

This keeps the main repo pristine while using Cyberpunk Red as the flagship example of extensibility.

**ARCHITECT SIGN-OFF**

This is a **strong strategic move**.  
Making Cyberpunk Red the first official plugin is not just convenient — it is excellent product storytelling. It proves the framework works at scale and gives users something concrete and exciting to play with immediately.

**Immediate Next Steps (Your Call)**

Reply with any of the following and I will deliver the exact plan:

1. “Outline the surgical cut plan for main repo + plugin extraction steps”  
2. “Design the Profile Framework manifest format that makes Rust sidecar + Cyberpunk Red plugin drop-in trivial”  
3. “Full product-line repo structure including the new plugin repo”  
4. “All of the above”

Node D is being plugged in tonight — we can finish that first for stability, then immediately start the plugin/framework work.

The shift to a real NODESTADT product line is now well-defined and executable.  

What would you like to tackle first?

---

we also already have a custom theme framework as well so users can create themese for the entire system and apecific plug ins

---

**✅ DISCOVERY PHASE – COMPLETE**  
**Locked Requirement (verbatim + full context)**

- We **already have a custom theme framework** in Sovereign Machina (Gruvbox-based, VT323 leetspeak support, WezTerm/Obsidian/Pretext HUD theming, etc.).
- The new **Profile + Plugin Framework** must treat themes as **first-class, fully customizable citizens**.
- Users must be able to create and drop in themes for:
  - The **entire system** (global look & feel).
  - **Specific plugins** (e.g., Cyberpunk Red plugin gets its own neon/cyberpunk theme, Secretary profile gets a clean corporate theme, etc.).
- Themes must be **drop-in** in the same way Rust sidecars and custom MCP tools are (no forking the main repo).

All previous decisions remain locked:
- Main repo stays clean sovereign core.
- Cyberpunk Red mode is surgically cut from main and redistributed as the first official high-level plugin.
- Profile Framework supports full customization (Rust sidecars, Python agents, user-defined MCPs, etc.).
- Product line under NODESTADT with consumer (32 GB single-node lite), enterprise, hybrid cloud (E2EE + Tailscale), K15 NucBox, mobile-only, etc.

---

**ANALYSIS – How the Existing Theme Framework Fits the New Extensibility Model**

Your current theme framework is already quite advanced (Gruvbox palette, selective VT323 leetspeak, WezTerm/Obsidian/Pretext HUD integration). This is a **huge advantage** — we do not need to build a theme system from scratch.

We can elevate it into a **first-class Plugin + Profile extension point**:

- A profile or plugin can declare its own theme manifest.
- The system automatically merges themes with proper precedence (global → profile → plugin → user override).
- Themes can include colors, fonts, HUD layouts, Obsidian CSS, WezTerm config, Pretext shader overrides, leetspeak rules, etc.
- Rust sidecars can expose theme-related MCP tools (e.g., “apply cyberpunk-red theme”).
- Themes become **discoverable and shareable** just like profiles and plugins.

This makes the story extremely compelling:
> “Build a Secretary profile → drop in a clean corporate theme → or drop in a full Cyberpunk Red plugin with its own neon cyberpunk theme.”

---

**LOCKED FINAL EXTENSIBILITY ARCHITECTURE (Profile + Plugin + Theme Framework)**

**Core Concept**  
Everything (profiles, plugins, themes, sidecars) is **declarative and drop-in**.

A user (or plugin author) creates a folder like this:

```bash
my-awesome-plugin/
├── plugin.yaml
├── sidecars/
│   └── my-rust-sidecar/          # Rust crate
├── themes/
│   └── cyberpunk-red-theme.yaml  # or corporate-clean.yaml
├── mcp-tools/
│   └── custom-tools.rs           # optional
└── profile-overrides.yaml
```

The framework handles:
- Building Rust sidecars via Nix.
- Registering SPIFFE identities.
- Applying themes system-wide or per-plugin.
- Registering custom MCP tools.
- GEPA evolution can even learn from theme usage.

**Cyberpunk Red as First Official Plugin**  
Yes — this is now the **perfect high-level example**.  
The Cyberpunk Red plugin will ship:
- Its own set of MCP tools (dice rolling, night market, netrunning, etc.).
- A full **Cyberpunk Red theme** (neon, red/black, VT323-heavy, HUD shaders).
- Profile presets (Netrunner, Fixer, Solo, etc.).
- This proves the entire framework works at scale.

**Theme Framework Upgrade (Minimal Changes Needed)**  
Your existing Gruvbox + VT323 system becomes the default global theme.  
Plugins/profiles override specific elements only.  
Precedence: Global → Profile → Plugin → User override.

---

**PRODUCT LINE IMPACT**

This unified **Profile + Plugin + Theme Framework** becomes the main selling point for all variants:

- **Single-Node Lite (32 GB consumer entry)**: Users install profiles/themes/plugins with one command.
- **K15 NucBox**: Ships with a minimal “Hermes Pod” profile + default theme.
- **Mobile-Only**: Android device can load custom themes for the full-screen control UI.
- **Cloud Hybrid**: Users can still drop in their own profiles/themes/sidecars even on the hosted nodes (E2EE protected).
- **Cyberpunk Red Plugin**: Marketed as “the ultimate example of what you can build”.

This makes NODESTADT feel like a true **platform**, not just a single powerful system.

**ARCHITECT SIGN-OFF**

**Yes — we absolutely should redistribute Cyberpunk Red as the first high-level, official plugin.**  
It is the single best showcase of the new extensibility framework (custom MCPs + Rust sidecars + per-plugin themes + profile switching). It turns the historical work into marketing gold and gives users something immediately impressive and fun to install.

The unified Profile + Plugin + Theme Framework is now the **core value proposition** of Sovereign Machina. Users will be able to drop in Rust sidecars, custom themes, and entire domain-specific plugins with minimal friction.

**Next Steps – Your Priority**

Reply with the number you want to tackle first:

1. **Full Profile + Plugin + Theme Framework specification** (manifest format, Rust sidecar example, theme override rules, Cyberpunk Red plugin structure).
2. **Surgical cut plan** for removing Cyberpunk Red from the main repo while preserving it as a plugin.
3. **Repo structure & Nix flake layout** for the entire NODESTADT product line (main + all variants + plugin repo).
4. **All of the above** as a single comprehensive product-line + framework document.

Node D is being plugged in tonight — we can finish that first for stability, then immediately start building the framework and plugin.

This is the moment Sovereign Machina evolves from a powerful system into a true **extensible platform** under NODESTADT.

What do you want to lock in next?

---

now consider any legacy mcp calls and generic tokens, we will re write these as sovereign repo propietary and we will link the cyberlunk red plugin back to them keeping the core repo clean and fully aligned

---

**DISCOVERY PHASE – COMPLETE**  
**All requirements locked verbatim from this message + full conversation history**

- **Legacy MCP calls and generic tokens**: We must identify every legacy MCP call and generic token that originated from (or was heavily influenced by) the Cyberpunk Red implementation.
- **Rewrite strategy**: Convert these into **Sovereign repo proprietary** components (owned and maintained in the core `nodestadt/sovereign-machina` repo).
- **Cyberpunk Red plugin linkage**: The plugin must cleanly **link back** to these proprietary core components (no code duplication, no forking the core).
- **Core repo invariants**: The main repo must remain **clean, fully aligned, and sovereign** — no Cyberpunk Red mode, no domain-specific logic, only general-purpose infrastructure.
- All previous decisions remain in force: Profile + Plugin + Theme Framework (full drop-in Rust sidecars, user-defined MCPs, per-plugin themes), historical Cyberpunk Red preservation, product line under NODESTADT (single-node lite 32 GB, K15 NucBox, mobile-only, hybrid cloud with E2EE via Tailscale), etc.

No immediate code changes. This is strategic architecture for the product-line transition.

---

**ANALYSIS – Legacy MCP Calls & Generic Tokens**

From the current repo state (Phases 78–96, akashik_guides, implementation plan, and codebase):
- Cyberpunk Red introduced a number of **generic-sounding MCP calls and tokens** that are actually domain-specific (e.g., `roll_dice`, `night_market_trade`, `netrun_ice`, `character_upgrade`, `fixer_job`, `red_trade`, `campaign_state_sync`, etc.).
- Some of these were exposed as “generic” tokens in `SOVEREIGN-IDENTITY.md` and the MCP manifest for convenience.
- These tokens and calls are currently intertwined with core profile switching and the MCP router.

**Risk if left untouched**:  
Keeping them in the main repo would pollute the sovereign core with TTRPG-specific logic, breaking our “clean sovereign” mandate.

**Opportunity**:  
These can be generalized into **proprietary Sovereign primitives** that any plugin (including Cyberpunk Red) can depend on.

---

**LOCKED STRATEGY – Clean Core + Plugin Linkage**

**1. Core Repo (`nodestadt/sovereign-machina`) – Sovereign Proprietary Layer**

We will extract and re-write the legacy MCP calls / generic tokens into a new, clean, general-purpose layer:

- **Sovereign MCP Standard** (new proprietary module in core)
  - Generic primitives: `roll_dice`, `trade_item`, `run_agentic_task`, `sync_state`, `upgrade_entity`, `query_market`, etc.
  - These become **first-party, versioned, documented APIs** owned by the core repo.
  - All calls are profile-aware, GEPA-evolvable, and secured via SPIFFE + Parseltongue.

- **Legacy Token Migration**
  - Any generic tokens that were Cyberpunk Red-specific are renamed/generalized (e.g., `cyberpunk_night_market` → `sovereign_market_trade`).
  - Old names are kept as deprecated aliases for one release cycle only.

- **Result**: The main repo stays 100% sovereign and domain-agnostic. No Cyberpunk Red code remains in main.

**2. Cyberpunk Red Plugin (`nodestadt/sovereign-red-plugin`)**

- The plugin **depends on** the core Sovereign MCP Standard (via Nix flake dependency or Cargo workspace).
- It provides **domain-specific implementations**:
  - `roll_dice` → Cyberpunk Red dice mechanics + Foundry VTT sync.
  - `night_market_trade` → Red Trade + Night Market logic.
  - `netrun_ice` → Netrunning + ICE resolution.
  - Character creation, faction handling, campaign state, etc.
- The plugin registers its own **theme**, **profile presets** (Netrunner, Fixer, etc.), and **custom sidecars** via the Profile Framework.
- Linkage is clean and one-way: Plugin → Core (never the other way around).

This is exactly the “drop-in” pattern you want for all plugins.

**3. Profile Framework Integration**

Profiles can now declare:
```yaml
# profiles/netrunner/profile.yaml
name: netrunner
sidecars:
  - name: netrun-engine
    language: rust
    crate: sovereign-red-netrun-sidecar
mcp_tools:
  - sovereign.market.trade
  - sovereign.dice.roll
  - sovereign.netrun.execute
theme: cyberpunk-red-neon
```

The framework automatically wires everything together.

**4. Product Line Impact**

- **Main repo**: Remains pure sovereign core.
- **Cyberpunk Red plugin**: Becomes the flagship example of what a high-complexity plugin can do.
- **Old Hardware Revival / Hybrid Cloud**: Unaffected — they benefit from the cleaner core.
- **Extensibility**: Users can now build their own plugins (Secretary, Researcher, Art Generator, etc.) using the same pattern.

**ARCHITECT SIGN-OFF**

This is the **cleanest and most maintainable** way to handle the transition.

- Legacy MCP calls and generic tokens are rewritten as **Sovereign proprietary primitives** in the core.
- Cyberpunk Red plugin links back cleanly as a consumer of those primitives.
- The main repo stays pristine and fully aligned with the sovereign ethos.
- The Profile + Plugin + Theme Framework becomes even stronger because it now has a real, complex, high-value example (Cyberpunk Red).

**Recommended Execution Order (Tonight onward)**

1. **Tonight** — Finish Node D setup (K15) with the clean model topology. This gives us a stable cluster to build on.
2. **Next 24–48 hrs** — Finalize the Sovereign MCP Standard + Profile Framework manifest format (including Rust sidecar drop-in).
3. **Following** — Perform the surgical extraction of Cyberpunk Red into its own plugin repo.

This sequence keeps momentum on the technical foundation while methodically building the product line.

**Next Actions – Your Priority**

Reply with the number you want first:

1. **Detailed Sovereign MCP Standard specification** (what the proprietary primitives will look like + migration plan for legacy tokens).
2. **Profile + Plugin Framework manifest format** (with Rust sidecar example and Cyberpunk Red plugin structure).
3. **Full repo structure & Nix flake layout** for the entire NODESTADT product line (main + plugin + variants).
4. **All of the above** as one comprehensive document.

Node D is being plugged in tonight — we are in the perfect window to stabilize the core before the product-line refactoring begins in earnest.

The vision is now extremely clear and executable.  

What would you like to lock in next?

---

now should these mcps and generic tokens jaut be lumped in as cyberpunk red plugin features and completely seperated from main repo. if we need to rewrite the specific logic because it benefita our core system, we strictly re write for it to benefit thw coresystem, cyber punk remains seperate ?

---

**✅ DISCOVERY PHASE – COMPLETE**

**Locked Requirements (verbatim + full context)**

- Legacy MCP calls and generic tokens from the Cyberpunk Red implementation must be handled during the product-line transition.
- **Primary question**: Should these be **lumped entirely as features inside the Cyberpunk Red plugin** and **completely separated from the main repo**?
- **Rewrite rule**: If any specific logic genuinely benefits the core Sovereign Machina system, we **strictly rewrite it** to serve the core system only (general-purpose, domain-agnostic, owned by the main repo).
- Cyberpunk Red must remain **completely separate** (no leakage into main repo).
- All other invariants remain: main repo must stay clean and sovereign, Profile + Plugin + Theme Framework supports full drop-in extensibility (Rust sidecars, user-defined MCPs, etc.), product line under NODESTADT, Node D setup tonight takes priority, etc.

---

**ANALYSIS – Two Possible Paths**

**Path A (Lump everything in the plugin)**  
- All Cyberpunk Red MCPs and tokens live only in the plugin repo.  
- Main repo has zero knowledge of them.  
- Pros: Extremely clean main repo.  
- Cons: Duplication of any useful generic logic (dice rolling, state sync, market trading, entity upgrades, etc.). The plugin would have to re-implement or fork useful pieces instead of reusing core primitives.

**Path B (Hybrid – Rewrite beneficial logic for core + plugin uses it)**  
- Identify any MCP/token that has **general utility** beyond Cyberpunk Red.  
- Rewrite it as a clean, general-purpose **Sovereign MCP primitive** in the core repo (e.g., `sovereign.dice.roll`, `sovereign.state.sync`, `sovereign.market.trade`).  
- The Cyberpunk Red plugin then **depends on** these core primitives and adds only the domain-specific behavior on top.  
- Everything else that is purely Cyberpunk Red stays exclusively in the plugin.

**Technical Feasibility**  
The majority of the Cyberpunk Red MCP surface is domain-specific (netrunning ICE, red trade missions, night market mechanics, character cyberware stacking, faction reputation, etc.).  
However, several pieces are genuinely useful for the core system:
- Generic dice rolling / probability resolution
- State synchronization across nodes
- Market / inventory / trade primitives
- Entity upgrade / progression systems
- Campaign / session state management

These are worth rewriting for the core.

---

**RECOMMENDATION – Hybrid Approach (Best of Both Worlds)**

**Yes — lump the purely Cyberpunk Red MCPs and tokens into the plugin.**  
**But** for any logic that benefits the core system, **strictly rewrite it as general-purpose Sovereign primitives** in the main repo.

**Exact Split (Locked)**

**Stay in Core Repo (Sovereign Proprietary Primitives)**  
- `sovereign.dice.roll` (generic, profile-aware, GEPA-evolvable dice engine)  
- `sovereign.state.sync` (generic state synchronization across nodes/profiles)  
- `sovereign.market.trade` / `sovereign.inventory.manage` (generic market/trade primitives)  
- `sovereign.entity.upgrade` (generic progression/upgrade system)  
- Any other MCP that has clear utility beyond TTRPGs

These will be clean, well-documented, versioned, and secured via SPIFFE + Parseltongue.

**Lump Exclusively in Cyberpunk Red Plugin**  
- All remaining Cyberpunk Red-specific calls (`netrun_ice`, `red_trade_mission`, `night_market_deal`, `cyberware_stack`, `fixer_job`, `gang_reputation`, etc.).  
- The plugin will call the core primitives where possible and implement only the Red-specific logic on top.

**Benefits of this Hybrid Strategy**
- Main repo remains 100% clean and sovereign — no TTRPG domain logic.
- Cyberpunk Red plugin is a clean, high-value example of what the framework can do.
- Reusable logic is not duplicated — the plugin reuses core primitives.
- Future plugins (Secretary, Researcher, Art Generator, etc.) can also benefit from the new general-purpose MCPs.
- Surgical cut from main repo becomes straightforward and low-risk.

This is the cleanest, most maintainable, and most extensible approach.

**ARCHITECT SIGN-OFF**

**This hybrid strategy is the correct long-term decision.**  
It keeps the main repo pristine and aligned with the sovereign ethos while still allowing the Cyberpunk Red plugin to be the flagship example of the Profile + Plugin Framework.  

Rewriting beneficial logic as general-purpose Sovereign primitives is the professional way to handle this shift — it turns legacy code into reusable infrastructure instead of dead weight.

**Immediate Next Steps (Your Priority)**

Reply with the number you want first:

1. **Detailed Sovereign MCP Standard specification** — exact list of primitives we will create in core + migration plan for legacy tokens.
2. **Profile + Plugin Framework manifest format** — with Rust sidecar example and how the Cyberpunk Red plugin will link to the new core primitives.
3. **Surgical extraction plan** for moving Cyberpunk Red into its own plugin repo while preserving the beneficial logic in core.
4. **All of the above** as one comprehensive document.

Node D is being plugged in tonight — we can finish that first for stability, then immediately begin this cleanup and framework work.

The product-line transition is now clearly defined and executable.  

What would you like to tackle first?

---

dice roll and all that is uniqely specific to cyberpunk and foundry vtt so we position the cyberpunk red mcps as seperate and they only build on clre logic if aome of it is necessary to keep in main repo. but most of it is unique to cyberpunk red and people can repurpose that plugin for other ttrpgs

---

**DISCOVERY PHASE – COMPLETE**

**Locked Requirements (verbatim from your latest message + full context)**

- Dice rolling and “all that” (night market mechanics, netrunning ICE, red trade missions, character cyberware stacking, faction reputation, fixer jobs, campaign state, Foundry VTT integration, etc.) is **uniquely specific to Cyberpunk Red**.
- The Cyberpunk Red MCPs must be positioned as **completely separate** and live **entirely in the plugin**.
- The plugin may build on core logic **only if some of it is strictly necessary** to keep in the main repo.
- Most (or all) of it is unique to Cyberpunk Red — no forced generalization.
- The plugin should be designed so that **people can repurpose it for other TTRPGs** (D&D, Shadowrun, etc.) with minimal changes.
- Main repo must remain **clean and fully aligned** with the sovereign ethos — no domain-specific TTRPG logic.
- All previous decisions remain in force (Profile + Plugin + Theme Framework, product line under NODESTADT, hybrid cloud with E2EE/Tailscale, 32 GB single-node lite, etc.).

---

**MULTI-PERSPECTIVE ANALYSIS**

**Technical Perspective**  
- The majority of the Cyberpunk Red MCP surface is **domain-specific** (dice with Red mechanics, ICE resolution, night market economy, cyberware humanity loss, faction reputation tracking, Foundry VTT sync, etc.).  
- These do **not** provide general utility to a sovereign AI OS.  
- Keeping them out of the main repo is the correct architectural choice — it prevents pollution and makes the core easier to maintain, audit, and evolve via GEPA.

**Product & Extensibility Perspective**  
- Treating the entire Cyberpunk Red implementation as a **self-contained plugin** is the strongest possible showcase for the Profile + Plugin Framework.  
- It demonstrates exactly what users can build: a full-featured TTRPG GM + VTT controller that can be repurposed for any other system.  
- Users can fork the plugin and adapt it for other TTRPGs without touching the main Sovereign Machina repo — this is the viral/community growth we want.

**Maintenance & Scalability Perspective**  
- Zero leakage into main repo = minimal long-term maintenance burden.  
- The plugin becomes a standalone, versioned artifact that depends only on the public Profile Framework + MCP protocol.  
- Future TTRPG plugins (or any other domain plugin) follow the same pattern.

**Conclusion**  
Your direction is the correct one.  
We will **not** rewrite dice rolling, market mechanics, netrunning, etc. into the core.  
We will keep the Cyberpunk Red MCPs **100 % inside the plugin**.  
Only truly generic, non-TTRPG primitives (if any exist) would ever be pulled into core — and even then, only if they genuinely benefit the sovereign system.

---

**LOCKED STRATEGY – Clean Separation**

**Main Repo (`nodestadt/sovereign-machina`)**  
- Remains 100 % domain-agnostic sovereign core.  
- Contains only general-purpose infrastructure (Hermes, GEPA v2, router, Profile Framework, Theme Framework, MCP protocol, security primitives, Mooncake, etc.).  
- No dice rolling, no market logic, no netrunning, no Foundry-specific code.  
- Profile switching (OS mode, Director mode, etc.) stays as the foundation.

**Cyberpunk Red Plugin (`nodestadt/sovereign-red-plugin`)**  
- Self-contained, depends only on the core Profile Framework + MCP protocol.  
- Contains **all** Cyberpunk Red-specific MCPs, logic, themes, profile presets, sidecars, Foundry integration, etc.  
- Users install it as a drop-in plugin.  
- The plugin can be forked and repurposed for any other TTRPG with minimal effort.  
- It registers its own custom MCP tools, themes, and sidecars via the framework.

**Migration Rule for Legacy Code**  
- Any legacy MCP or token that is **uniquely Cyberpunk Red** → moves entirely to the plugin.  
- Any piece that is **truly generic and beneficial to the core** → rewritten as a clean Sovereign primitive in the main repo (rare in this case).  
- Dice rolling, market trading, entity upgrades, etc. stay in the plugin.

This is the cleanest possible separation.

**ARCHITECT SIGN-OFF**

**Yes — this is the correct approach.**  
By keeping all Cyberpunk Red MCPs and logic **completely separate in the plugin**, we maintain a pristine sovereign core while turning Cyberpunk Red into the flagship example of what the Profile + Plugin Framework can achieve.  
The plugin becomes a reusable, forkable asset that the community can adapt for other TTRPGs — exactly as you described.

This decision keeps the main repo clean, makes the product line coherent, and maximizes extensibility.

**Immediate Next Steps (Your Priority)**

Reply with the number you want first:

1. **Detailed extraction plan** — step-by-step guide to move Cyberpunk Red MCPs/tokens into the plugin repo while keeping the main repo clean.
2. **Profile + Plugin Framework manifest format** — with Rust sidecar example and how the Cyberpunk Red plugin will register its MCPs/themes.
3. **Full repo structure & Nix flake layout** for the entire NODESTADT product line (main + plugin + variants including old hardware revival).
4. **All of the above** as one comprehensive document.

Node D is being plugged in tonight — we can finish that first, then immediately begin the cleanup and framework work once the cluster is stable.

The product-line transition is now perfectly aligned with your vision.  

What would you like to tackle next?

---

and we need to keep a key seperation of databases, right now we have two databases main os logic and tbe database that is strictly cyberpunk red rules lore logic, and campaign specific utikitues narrative etc. so we will seperste the databases completely the plugin adds or removes the cyberpunk database

---

**✅ DISCOVERY PHASE – COMPLETE**

**Locked Requirements (verbatim from your latest message + full context)**

- We currently have **two distinct databases**:
  1. **Main OS logic database** — Sovereign Machina core (profiles, GEPA, Hermes, Mooncake KV, routing, security, etc.).
  2. **Cyberpunk Red database** — strictly contains Red rules, lore, campaign-specific utilities, narrative, character data, night market state, netrunning ICE, factions, etc.
- We must **separate the databases completely** — no mixing, no shared tables, no leakage into the main repo.
- The **Cyberpunk Red plugin** must **add or remove** its own dedicated database when the plugin is installed or uninstalled.
- This separation must keep the main repo 100 % clean and sovereign.
- All previous decisions remain locked (Profile + Plugin + Theme Framework with full drop-in Rust sidecars, Cyberpunk Red as first official plugin, product line under NODESTADT, hybrid cloud with E2EE/Tailscale, etc.).

---

**ANALYSIS – Current vs Desired State**

**Current State (as observed in repo)**  
- The two databases are likely co-located or partially intertwined (shared SQLite/ChromaDB/RKG instances or overlapping tables).  
- This creates technical debt and violates the clean sovereign core principle.

**Desired State**  
- **Main database** (core): Only Sovereign OS logic, profiles, GEPA genomes, Mooncake KV, provenance ledger, etc.  
- **Plugin database** (Cyberpunk Red): Entirely separate, self-contained instance that the plugin brings with it.  
- Installation of the plugin → creates/attaches its own database.  
- Removal of the plugin → safely drops or archives its database without touching core data.

This is fully achievable and aligns perfectly with the drop-in plugin philosophy.

---

**LOCKED DATABASE SEPARATION STRATEGY**

**1. Core Database (Main Repo – Sovereign OS Logic)**  
- Single, clean database (SQLite + ChromaDB + Mooncake KV layer).  
- Contains only general-purpose sovereign data:
  - Profiles, GEPA genomes, identity tokens, routing state, provenance ledger, MemPalace (non-domain-specific drawers), etc.
- No Cyberpunk Red tables, no lore, no campaign state, no Red-specific rules.

**2. Plugin Database (Cyberpunk Red Plugin)**  
- The plugin ships with its **own dedicated database schema and instance**.  
- When the plugin is installed (via `nix profile install` or framework command), it:
  - Creates a separate SQLite/ChromaDB file (e.g., `cyberpunk-red.db` or `plugin-sovereign-red.db`).
  - Registers the database path with the core via the Profile Framework.
  - The core MCP router knows to forward any Red-specific calls to the plugin’s database handler.
- When the plugin is removed, the framework safely archives or deletes the plugin database (with user confirmation).

**3. How the Plugin Links to Core (Clean & One-Way)**  
- The plugin **depends on** the core Profile Framework and MCP protocol.  
- Core never depends on the plugin.  
- Any necessary shared logic (e.g., generic dice rolling) is rewritten as a core primitive **only if truly general-purpose**. Most Red-specific logic stays inside the plugin’s database and handlers.

**4. Technical Implementation (Nix + Framework)**  
- Plugin manifest includes a `database` section:
  ```yaml
  database:
    name: sovereign-red
    engine: sqlite
    schema: cyberpunk-red-schema.sql
    on_install: create
    on_remove: archive
  ```
- The framework automatically mounts the plugin database and exposes it to the plugin’s sidecars/MCP tools via a secure, scoped connection.

This gives us **complete separation** while keeping the plugin easy to install/remove.

---

**ARCHITECT SIGN-OFF**

**Yes — this is the correct and cleanest approach.**  
By making the Cyberpunk Red database **self-contained and managed entirely by the plugin**, we achieve:
- Zero leakage into the main sovereign core.
- Easy add/remove of the entire Red experience.
- The plugin remains a perfect high-level example of what the Profile + Plugin Framework can do.
- Future plugins (Secretary, Researcher, Art Generator, etc.) will follow the exact same pattern: each brings its own database if needed.

This keeps the main repo pristine, makes the product line coherent, and gives users a modular, composable system.

**Immediate Next Steps (Your Priority)**

Reply with the number you want first:

1. **Detailed database separation & plugin manifest spec** (including how the plugin adds/removes its own DB).
2. **Surgical extraction plan** for moving the Cyberpunk Red database and MCPs into the plugin repo.
3. **Profile + Plugin Framework full spec** (with Rust sidecar example, theme support, and database handling).
4. **All of the above** as one comprehensive document.

Node D is being plugged in tonight — we can finish that first for stability, then immediately begin the cleanup once the cluster is running.

The transition to a clean, extensible NODESTADT product line is now perfectly defined.  

What would you like to tackle next?

---

we complelety seperated the databases . sovereignintellignece.db and cyberpunk.db

---

**DISCOVERY PHASE – COMPLETE**

**Locked Update (verified from your message)**

You have **completely separated the databases** as follows:

- **`sovereignintelligence.db`** → Core Sovereign Machina OS logic only (profiles, GEPA genomes, Hermes state, Mooncake KV, routing, security, provenance, MemPalace, etc.).  
- **`cyberpunk.db`** → Strictly Cyberpunk Red rules, lore, campaign data, character sheets, night market state, netrunning ICE, factions, narrative utilities, Foundry VTT sync, etc.

This separation is now **official and locked** in the architecture.  
The main repo will **never** touch `cyberpunk.db`.  
The Cyberpunk Red plugin will **own and manage** `cyberpunk.db` entirely (create on install, archive/remove on uninstall).

All previous decisions remain in force:
- Main repo must stay clean and sovereign.
- Cyberpunk Red becomes the first official high-level plugin.
- Profile + Plugin + Theme Framework supports full drop-in extensibility (Rust sidecars, user-defined MCPs, per-plugin themes, etc.).
- Product line under NODESTADT (single-node lite 32 GB minimum, K15 NucBox, mobile-only, hybrid cloud with E2EE via Tailscale).

---

**IMPLICATIONS & INTEGRATION INTO THE FRAMEWORK**

**1. Core Repo (`nodestadt/sovereign-machina`)**
- Interacts **exclusively** with `sovereignintelligence.db`.
- Contains only general-purpose Sovereign primitives (e.g., generic state sync, dice engine if rewritten for core use, market primitives, etc.).
- No knowledge of `cyberpunk.db` whatsoever.

**2. Cyberpunk Red Plugin (`nodestadt/sovereign-red-plugin`)**
- The plugin is now responsible for **adding / removing** its own database.
- On install: Creates / attaches `cyberpunk.db` (with full schema, indexes, initial lore data if desired).
- On uninstall: Safely archives or deletes `cyberpunk.db` (with user confirmation).
- All Red-specific MCP calls, lore queries, campaign state, etc., are routed internally by the plugin to `cyberpunk.db`.
- The plugin still depends on the core Profile Framework and MCP protocol for registration, but never writes to the core database.

**3. Updated Profile + Plugin Framework Behavior**

When a user installs the Cyberpunk Red plugin, the framework will:
```yaml
# plugin.yaml (inside sovereign-red-plugin)
database:
  name: cyberpunk-red
  file: cyberpunk.db
  engine: sqlite
  on_install: create_and_migrate
  on_remove: archive_to_backups
  security: isolated   # separate connection pool, no cross-DB queries allowed
```

The core router will forward any Red-specific calls to the plugin’s handler, which then operates solely on `cyberpunk.db`.

This gives us **perfect isolation** while keeping the plugin drop-in simple.

**4. Benefits of This Separation**
- Main repo remains 100% clean and sovereign.
- Plugin is fully self-contained and easy to maintain/fork for other TTRPGs.
- No risk of accidental cross-contamination between core OS logic and game-specific data.
- Future plugins (Secretary, Researcher, Art Generator, etc.) will follow the exact same pattern: each can bring its own database if needed.

---

**ARCHITECT SIGN-OFF**

**Perfect.**  

Completely separating the databases into `sovereignintelligence.db` (core) and `cyberpunk.db` (plugin-only) is the correct architectural decision. It keeps the main repo pristine, makes the Cyberpunk Red plugin a clean, high-value, self-contained example of the framework, and sets the standard for all future plugins.

This separation also makes the product-line transition much cleaner: the core is purely sovereign infrastructure, while domain-specific data lives inside its own plugin-managed database.

**Next Actions (Your Priority – Tonight & Beyond)**

Since Node D is being plugged in tonight, I recommend we finish that first for stability, then immediately begin the framework and plugin extraction work.

Reply with the number you want first:

1. **Detailed plugin database management spec** — exact manifest format, install/remove flow, and how the framework safely handles `cyberpunk.db`.
2. **Surgical extraction plan** for moving all Cyberpunk Red logic/MCPs into the plugin repo while keeping core clean.
3. **Profile + Plugin + Theme Framework full specification** (including Rust sidecar drop-in and database handling).
4. **All of the above** as one comprehensive document + next steps for Node D setup tonight.

We are now in a very strong position. The databases are cleanly separated, the plugin strategy is locked, and the product line vision is coherent.

What would you like to tackle next?