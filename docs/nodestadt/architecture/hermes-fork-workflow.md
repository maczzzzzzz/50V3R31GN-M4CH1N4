# ◈ NODESTADT ARCHITECTURE : MONOREPO, FORKS & SIDECAR SOVEREIGNTY (v2.0.0)
## The Complete Workflow Guide — Phase 118 → 119 Architectural Shift

---

## 1. THE SHORT ANSWER

**Where do you work?**
Always in `github.com/nodestadt/50V3R31GN-M4CH1N4`. That is the Sovereign Machina OS. It is the only repo you touch day-to-day. Every other repo (hermes-agent, halo, hermeshub, etc.) is a dependency that lives inside it.

**Does hermes-agent auto-update into the monorepo?**
No. Nothing auto-updates anywhere. Git submodules are intentionally frozen at a specific commit SHA. Upstream repos (NousResearch, context-labs, etc.) can ship new code every hour — your monorepo will not change until you explicitly decide to pull and bump the pin. This is a feature, not a limitation.

**What changed in Phase 118?**
The monorepo's internal Node.js reimplementation of Hermes (`packages/hermes-core/`) was deleted. The real NousResearch Python agent (`sidecars/hermes-agent-nous/`) became the authoritative runtime. That Python sidecar is now tracked as a proper git submodule pointing to a patched fork we own (`nodestadt/hermes-agent`).

---

## 2. THE TWO-REPO MODEL

There are exactly two repos you will ever care about:

```
┌─────────────────────────────────────────────────────────────┐
│  github.com/nodestadt/50V3R31GN-M4CH1N4  (THE MONOREPO)    │
│                                                             │
│  This is Sovereign Machina OS. You live here.              │
│  All code, all crates, all phases, all dashboards.         │
│  Local path: //wsl.localhost/NixOS/home/nixos/             │
│              50V3R31GN-M4CH1N4                              │
│  Branch: master                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ contains (as submodule)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  github.com/nodestadt/hermes-agent  (THE FORK)              │
│                                                             │
│  Your patched fork of NousResearch/hermes-agent.           │
│  You only touch this when pulling a new upstream release.  │
│  Never commit here during normal dev cycles.               │
│  Local path: //wsl.localhost/NixOS/home/nixos/             │
│              50V3R31GN-M4CH1N4/sidecars/hermes-agent-nous  │
└──────────────────────────┬──────────────────────────────────┘
                           │ forked from
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  github.com/NousResearch/hermes-agent  (UPSTREAM)           │
│                                                             │
│  The original. You never touch this.                       │
│  You pull from it when NousResearch ships new releases.    │
└─────────────────────────────────────────────────────────────┘
```

### The Rule
- **Building features, fixing bugs, running phases** → work in `50V3R31GN-M4CH1N4`
- **Pulling a new NousResearch release** → work in the fork, then bump the pin in `50V3R31GN-M4CH1N4`
- **Never** develop directly in `nodestadt/hermes-agent` outside of an upstream-pull event

---

## 3. WHAT A GIT SUBMODULE ACTUALLY IS

This is the most important concept to understand. A submodule is not a sync, a mirror, or a live connection. It is a **pinned SHA pointer**.

```
.gitmodules file in 50V3R31GN-M4CH1N4:
┌──────────────────────────────────────────────────────────┐
│ [submodule "sidecars/hermes-agent-nous"]                 │
│   path = sidecars/hermes-agent-nous                      │
│   url  = https://github.com/nodestadt/hermes-agent.git   │
└──────────────────────────────────────────────────────────┘

Git index entry (the pin):
  160000  0ce9231396495192b2e32d5e14d2b6493f157bfb  sidecars/hermes-agent-nous
          ↑ this SHA is the exact commit in nodestadt/hermes-agent
            that the monorepo is currently locked to
```

When you `cd sidecars/hermes-agent-nous` you are inside a complete, separate git repository — it just happens to live inside the monorepo's filesystem. It has its own `git log`, its own branches, its own history.

**What does NOT happen automatically:**
- When nodestadt/hermes-agent gets a new commit → the monorepo SHA does NOT change
- When NousResearch ships v0.13.0 → nothing in your monorepo changes
- There are no webhooks, no Actions, no cron jobs that bump this

**What DOES happen:**
- When you `git clone --recurse-submodules 50V3R31GN-M4CH1N4`, git checks out `sidecars/hermes-agent-nous` at exactly that pinned SHA
- The files you see in `sidecars/hermes-agent-nous/` are always the version pinned in the index

---

## 4. THE FULL ARCHITECTURE MAP

```
50V3R31GN-M4CH1N4/ (monorepo, master branch)
│
├── crates/                          ← Rust components (all owned by nodestadt)
│   ├── sovereign-mcp-bridge/        Phase 118: VSB UDP→MCP bridge, port 7878
│   ├── sovereign-whisper-mcp/       Phase 118.5: STT artery, PCM-16 ring buffer
│   └── [other crates]/
│
├── dashboard/                       ← Next.js HUD (owned by nodestadt)
│   ├── app/
│   │   └── globals.css              Tactical Authority v1.3.1 palette
│   └── components/
│       └── HermesInteractiveTUI.tsx iframe → port 9119 (hermes-agent web UI)
│
├── sidecars/
│   │
│   ├── hermes-agent-nous/    ◄──── SUBMODULE: nodestadt/hermes-agent @ 0ce9231
│   │   ├── environments/
│   │   │   └── agent_loop.py        PATCHED: ST3GG guard + vision artery stub
│   │   ├── tools/
│   │   │   └── transcription_tools.py  PATCHED: whisper-mcp stub
│   │   ├── web/src/index.css        PATCHED: Tactical Authority palette
│   │   └── cli-config.yaml          ADDED: MCP server registrations
│   │
│   ├── halo/                 ◄──── SUBMODULE: context-labs/halo @ 5fdc06f
│   │   └── [agent optimization loop — RLM-based trace analysis]
│   │
│   ├── hermeshub/            ◄──── SUBMODULE: amanning3390/hermeshub @ 55e6fb9
│   │   └── [skills registry + marketplace, x402 payments]
│   │
│   ├── hermes-web-ui/        ◄──── SUBMODULE: EKKOLearnAI/hermes-web-ui @ caa9162
│   │   └── [Vue 3 web dashboard: chat, sessions, scheduling, analytics]
│   │
│   ├── hermes-desktop/       ◄──── SUBMODULE: fathah/hermes-desktop @ 8678cd5
│   │   └── [Electron app: guided install, chat, profiles, tools, skills]
│   │
│   ├── worldseed/            ◄──── SUBMODULE: AIScientists-Dev/WorldSeed @ 928416c
│   │   └── [multi-agent world engine, emergent scenarios, AI Dungeon Master]
│   │
│   ├── free-claude-proxy/    ◄──── SUBMODULE: Alishahryar1/free-claude-code @ d3a3b37
│   │   └── [proxy: Claude Code → NVIDIA NIM / OpenRouter / LM Studio / Ollama]
│   │
│   ├── skill-marketplace/    ◄──── SUBMODULE: Lethe044/hermes-skill-marketplace @ 10754a2
│   │   └── [Skill Forge: observe→write→test→publish to agentskills.io]
│   │
│   ├── paperclip-adapter/    ◄──── SUBMODULE: NousResearch/hermes-paperclip-adapter @ 937ea71
│   │   └── [Hermes ↔ Paperclip orchestration bridge]
│   │
│   ├── zeroboot/             ◄──── SUBMODULE: zerobootdev/zeroboot @ 87ca9c0
│   │   └── [sub-ms VM sandboxes for agent isolation via Firecracker KVM]
│   │
│   ├── git-nexus/            ◄──── TRACKED DIR (no upstream): code knowledge graph + MCP
│   └── sidecar-proxy/        ◄──── TRACKED DIR (no upstream): multi-provider proxy CLI
│
├── terminal-app/                    ← Flutter mobile app (owned by nodestadt)
│   └── lib/services/openclaw_bridge.dart   ws://node-b:8000/ws gateway
│
├── .gitmodules                      ← all submodule URL + path mappings
└── IMPLEMENTATION_PLAN.md           ← phase roadmap
```

---

## 5. DAILY DEVELOPMENT WORKFLOW

### 5.1 Normal feature work (most of the time)

You never leave the monorepo. Everything is a path inside `50V3R31GN-M4CH1N4`.

```bash
# Clone the monorepo fresh (one-time on a new machine)
git clone --recurse-submodules https://github.com/nodestadt/50V3R31GN-M4CH1N4
cd 50V3R31GN-M4CH1N4

# OR if you already have a clone but submodules are not initialized:
git submodule update --init --recursive

# Daily work: edit files, run tests, commit
cd 50V3R31GN-M4CH1N4
# ... make changes to dashboard/, crates/, terminal-app/, etc. ...
git add <files>
git commit -m "feat: ..."
git push origin master
```

### 5.2 Modifying the Hermes sidecar (rare — only for sovereign patches)

If you need to change files inside `sidecars/hermes-agent-nous/`, those changes must go to `nodestadt/hermes-agent` first, then be pulled back into the monorepo via a submodule bump. You do not commit sidecar changes from inside the monorepo.

```bash
# Step 1: Open a separate terminal and clone the fork
git clone https://github.com/nodestadt/hermes-agent /tmp/hermes-work
cd /tmp/hermes-work
git checkout sovereign-patches     # always patch on this branch

# Step 2: Make your changes, commit them
# e.g., adding a new sovereign tool guard or wiring Phase 120 logic
git add environments/agent_loop.py
git commit -m "feat(sovereign): wire Phase 120 MCP client to whisper artery"

# Step 3: Merge to main and push
git checkout main
git merge sovereign-patches --no-ff -m "merge: sovereign patch vX"
git push origin main
git push origin sovereign-patches

# Step 4: Back in the monorepo, bump the submodule pin
cd /path/to/50V3R31GN-M4CH1N4
git submodule update --remote sidecars/hermes-agent-nous
git add sidecars/hermes-agent-nous
git commit -m "chore(hermes): bump submodule SHA — Phase 120 whisper wiring"
```

### 5.3 Pulling a new NousResearch upstream release

Do this when NousResearch ships a significant update to hermes-agent that you want.

```bash
# Clone or use existing fork clone
git clone https://github.com/nodestadt/hermes-agent /tmp/hermes-update
cd /tmp/hermes-update

# Add NousResearch as upstream (one-time per machine)
git remote add upstream https://github.com/NousResearch/hermes-agent

# Fetch the new upstream
git fetch upstream --tags

# Rebase sovereign-patches onto new upstream tag
git checkout sovereign-patches
git rebase upstream/vX.Y.Z

# Resolve any conflicts in:
#   environments/agent_loop.py   — ST3GG guard (line numbers may shift)
#   tools/transcription_tools.py — whisper-mcp stub
#   web/src/index.css            — Tactical Authority palette
#   cli-config.yaml              — MCP server registrations

# Merge into main and push
git checkout main
git merge sovereign-patches --no-ff -m "merge: sovereign patches onto NousResearch vX.Y.Z"
git push origin main --force-with-lease
git push origin sovereign-patches --force-with-lease

# Bump the monorepo pin
cd /path/to/50V3R31GN-M4CH1N4
git submodule update --remote sidecars/hermes-agent-nous
git add sidecars/hermes-agent-nous
git commit -m "chore(hermes): bump to NousResearch vX.Y.Z + sovereign patches"
```

### 5.4 Updating a third-party sidecar (halo, hermeshub, etc.)

The other sidecars (halo, hermes-web-ui, etc.) are pinned to their upstream repos directly — no nodestadt fork. If you want the latest version:

```bash
# Example: update halo to latest upstream
cd sidecars/halo
git fetch origin
git checkout main
git pull origin main

# Back in monorepo: the sidecar's HEAD has changed, stage the new SHA
cd /path/to/50V3R31GN-M4CH1N4
git add sidecars/halo
git commit -m "chore(halo): bump to latest context-labs/halo"
```

---

## 6. THE SUBMODULE STATUS LEGEND

When you run `git submodule status` in the monorepo:

```
 0ce9231... sidecars/hermes-agent-nous  (heads/main)    ← initialized, up to date
-5fdc06f... sidecars/halo                               ← registered, NOT initialized
+928416c... sidecars/worldseed                          ← initialized, differs from pinned SHA
U           sidecars/zeroboot                           ← merge conflict (rare)
```

| Prefix | Meaning | Action |
| :--- | :--- | :--- |
| ` ` (space) | Initialized, checked out at correct SHA | Nothing — this is healthy |
| `-` | Registered in .gitmodules but not yet initialized locally | Run `git submodule update --init sidecars/<name>` |
| `+` | Initialized but checked out at a different SHA than pinned | Run `git submodule update sidecars/<name>` to snap back, OR bump the pin if you intentionally moved it |
| `U` | Merge conflict inside the submodule | Resolve conflict inside the submodule directory |

**The `-` prefix on most sidecars is normal.** It means the submodule is registered in `.gitmodules` and pinned in the index, but you have not run `git submodule update --init` to check them out. The files in those directories are your local working copies that exist on disk independently — they just are not git-managed checkouts yet.

---

## 7. WHAT HAPPENED TO THE SIDECARS — THE FULL STORY

Before Phase 118, the monorepo had 13 ghost gitlink entries in its git index. These are `160000`-mode entries (the git type for submodule pointers) that had been left behind when submodules were previously removed using `git rm` instead of `git submodule deinit`. The directories were still on disk; only the index entry was corrupt/orphaned.

The cleanup used `git rm --cached` which removes only the index entry:

```
git rm --cached <path>
  │
  ├── DOES: remove the 160000 gitlink record from the git index
  ├── DOES NOT: touch any file on disk
  └── DOES NOT: delete the directory or its contents
```

Every sidecar directory was 100% intact throughout. The only thing that changed was whether git was tracking a pointer to it.

After cleanup and restoration, all 11 sidecars are now properly registered:

| Sidecar | Type | Upstream | What It Does |
| :--- | :--- | :--- | :--- |
| `hermes-agent-nous` | Submodule (nodestadt fork) | NousResearch/hermes-agent | Primary Python agent harness — ST3GG patched |
| `halo` | Submodule | context-labs/halo | RLM agent optimization loop — analyzes traces, generates improvement reports |
| `hermeshub` | Submodule | amanning3390/hermeshub | Skills registry + marketplace, GitHub OAuth, security scanning |
| `hermes-web-ui` | Submodule | EKKOLearnAI/hermes-web-ui | Vue 3 production web dashboard: chat, sessions, channels, analytics |
| `hermes-desktop` | Submodule | fathah/hermes-desktop | Electron desktop client: guided install, chat, profiles, scheduling |
| `worldseed` | Submodule | AIScientists-Dev/WorldSeed | Multi-agent world simulation engine with emergent AI outcomes |
| `free-claude-proxy` | Submodule | Alishahryar1/free-claude-code | Claude Code → NVIDIA NIM / OpenRouter / Ollama / LM Studio proxy |
| `skill-marketplace` | Submodule | Lethe044/hermes-skill-marketplace | Skill Forge: observe tasks → write SKILL.md → test → publish |
| `paperclip-adapter` | Submodule | NousResearch/hermes-paperclip-adapter | Hermes ↔ Paperclip orchestration bridge |
| `zeroboot` | Submodule | zerobootdev/zeroboot | Sub-millisecond Firecracker KVM sandboxes for agent task isolation |
| `git-nexus` | Tracked directory | none (nodestadt-local) | Code knowledge graph + MCP tools for Cursor/Claude Code |
| `sidecar-proxy` | Tracked directory | none (nodestadt-local) | Multi-provider proxy CLI (OpenAI/Gemini/Claude/Codex) |

---

## 8. THE SOVEREIGN PATCHES ON nodestadt/hermes-agent

The fork at `github.com/nodestadt/hermes-agent` sits between NousResearch upstream and the monorepo. It has two permanent branches:

```
main              ← what the monorepo pins to. Always = sovereign-patches merged in.
sovereign-patches ← your patch commits, rebased onto each new upstream release.
```

Current patch set (Phase 118 → 119, SHA prefix: 0ce9231):

| Commit | File | What It Does |
| :--- | :--- | :--- |
| `feat(sovereign): ST3GG guard + vision artery constants` | `environments/agent_loop.py` | Refuses unsigned tool intents; registers VISION_ARTERY env vars for Phase 120 |
| `feat(sovereign): SOVEREIGN_ARTERY + whisper-mcp stub` | `tools/transcription_tools.py` | MCP-first STT priority comment; `_get_ambient_intent_from_whisper_mcp()` stub |
| `feat(sovereign): Tactical Authority v1.3.1 palette` | `web/src/index.css` | `#1A282F` bg, `#376374` accent, Cinzel/Lexend fonts |
| `feat(sovereign): cli-config.yaml with MCP registrations` | `cli-config.yaml` | Registers `sovereign_mcp_bridge` + `sovereign_whisper_mcp` MCP servers |

When NousResearch ships a new release, `sovereign-patches` is rebased onto it. The four commits above travel forward onto every new upstream version.

---

## 9. THE SIDECAR SOVEREIGNTY PRINCIPLES

These rules govern all external dependencies in the monorepo going forward:

1. **The monorepo is home.** All active development happens in `50V3R31GN-M4CH1N4`. Never develop in a fork or sidecar repo directly during a feature cycle.

2. **Submodules are intentional pins, not live connections.** There is no auto-sync, no auto-update, no webhook. The monorepo SHA is the source of truth for what version is running.

3. **Fork before patching.** Any external repo that needs sovereign modifications gets forked to `nodestadt/` first. Patches live as named commits on `sovereign-patches` branch. Never patch directly in the monorepo working tree files without committing to the fork first.

4. **Update on your schedule.** Upstream releases are absorbed deliberately: fetch upstream → rebase sovereign-patches → push fork → bump monorepo pin. This gives you a review window before any upstream change enters production.

5. **Plain directories for nodestadt-owned code.** Sidecars with no external upstream (`git-nexus`, `sidecar-proxy`) are tracked as regular git directories — no submodule indirection needed.

6. **Submodule init is explicit.** Run `git submodule update --init --recursive` after cloning or when you need to work inside a specific sidecar. Other sidecars remain as on-disk directories until you need them.

---

## 10. PHASE LINEAGE

| Phase | Key Commits | What Changed |
| :--- | :--- | :--- |
| **118** | `38b7eca` → `d0cfdf1` | Deleted `packages/hermes-core/` (Node.js), injected ST3GG guard, rewired npm scripts |
| **118.5** | `bd410f8` | Created `crates/sovereign-whisper-mcp`, `cli-config.yaml`, transcription stub |
| **119** | `bd410f8` | Tactical Authority HUD skin, vision artery env vars, dashboard iframe update |
| **Submodule setup** | `221d1d5` → `154ce8707` | Converted `hermes-agent-nous` to submodule, purged 13 orphaned gitlinks, restored all 11 sidecars |

**Current monorepo HEAD:** master @ `154ce8707`
**hermes-agent fork HEAD:** `0ce9231396495192b2e32d5e14d2b6493f157bfb` (nodestadt/hermes-agent main)

---

**::/5Y573M-N071C3 : SOVEREIGN_WORKFLOW_SPEC_LOCKED v2.0.0. // 50V3R31GN-M4CH1N4**
