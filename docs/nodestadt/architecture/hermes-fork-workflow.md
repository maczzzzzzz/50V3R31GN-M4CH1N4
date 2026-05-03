# ◈ NODESTADT ARCHITECTURE : HERMES CLINICAL FORK & SIDECAR SOVEREIGNTY (v1.0.0)
## Phase 118 → 118.5 → 119 Architectural Shift

---

## 1. WHAT HAPPENED — THE PLAIN READ

Before Phase 118, the monorepo had two competing hermes implementations:

| Path | Language | Status before Phase 118 |
| :--- | :--- | :--- |
| `packages/hermes-core/` | TypeScript (Node.js) | Shadow logic — partially duplicating the Python harness |
| `sidecars/hermes-agent-nous/` | Python (NousResearch upstream) | Vendored copy, no upstream tracking |

Phase 118 executed the **clinical fork**: deleted `packages/hermes-core/` (94 files, 10,033 lines) and declared `sidecars/hermes-agent-nous/` the single source of truth for all Hermes reasoning. Phases 118.5 and 119 built the VSB audio artery and HUD encapsulation on top of that foundation.

At the end of that cycle, the Python sidecar was still raw vendored files — a snapshot of NousResearch code with our patches applied directly on top, no upstream remote, no version pin.

**Phase 118 also surfaced 13 orphaned gitlink entries** in the monorepo index: `sidecars/halo`, `sidecars/hermeshub`, `sidecars/gepa-*`, etc. These were ghost pointers left over from submodules that were previously deleted without proper `git submodule deinit` cleanup. The files on disk were never touched — `git rm --cached` only removes the 160000-mode index entry, not the filesystem directory. Every one of those sidecar directories still exists exactly as-is.

---

## 2. THE DATA SAFETY GUARANTEE

```
git rm --cached <path>   ←  removes the gitlink from the INDEX only
                             does NOT touch the filesystem
                             does NOT delete any files
```

**All sidecars are intact:**

| Sidecar | Status |
| :--- | :--- |
| `sidecars/halo` | On disk, untracked — contents 100% preserved |
| `sidecars/hermeshub` | On disk, untracked — contents 100% preserved |
| `sidecars/hermes-web-ui` | On disk, untracked — contents 100% preserved |
| `sidecars/hermes-desktop` | On disk, untracked — contents 100% preserved |
| `sidecars/worldseed` | On disk, untracked — contents 100% preserved |
| `sidecars/free-claude-proxy` | On disk, untracked — contents 100% preserved |
| `sidecars/git-nexus` | On disk, untracked — contents 100% preserved |
| `sidecars/skill-marketplace` | On disk, untracked — contents 100% preserved |
| `sidecars/sidecar-proxy` | On disk, untracked — contents 100% preserved |
| `sidecars/paperclip-adapter` | On disk, untracked — contents 100% preserved |
| `sidecars/zeroboot` | On disk, untracked — contents 100% preserved |

They are currently **untracked** by git (show as `??` in `git status`), which means git ignores them — a safe holding state. To re-integrate any of them properly, see Section 5.

---

## 3. THE NEW HERMES ARCHITECTURE

### 3.1 The Fork Chain

```
NousResearch/hermes-agent  (upstream — MIT)
        │
        │  github.com fork
        ▼
nodestadt/hermes-agent  (your fork)
        │
        │  sovereign-patches branch
        │    commit 1: feat(sovereign): ST3GG guard + vision artery constants
        │    commit 2: feat(sovereign): SOVEREIGN_ARTERY + whisper-mcp stub
        │    commit 3: feat(sovereign): Tactical Authority v1.3.1 palette
        │    commit 4: feat(sovereign): cli-config.yaml with MCP registrations
        │  merged → main @ 0ce9231396495192b2e32d5e14d2b6493f157bfb
        │
        │  git submodule
        ▼
50V3R31GN-M4CH1N4/sidecars/hermes-agent-nous  (monorepo pin)
```

### 3.2 What the Sovereign Patches Add

| File | Change | Phase |
| :--- | :--- | :--- |
| `environments/agent_loop.py` | ST3GG tool-guard (unsigned intents clinically refused) + `VISION_ARTERY_URL`/`VISION_ARTERY_HZ` env constants | 118 + 119 |
| `tools/transcription_tools.py` | `SOVEREIGN_ARTERY` comment (MCP-first STT priority) + `_get_ambient_intent_from_whisper_mcp()` stub | 118.5 |
| `web/src/index.css` | Tactical Authority v1.3.1 palette (`#1A282F` bg, `#376374` accent, Cinzel/Lexend) | 119 |
| `cli-config.yaml` | MCP server registrations: `sovereign_mcp_bridge` (port 7878 VSB) + `sovereign_whisper_mcp` (STT artery) | 118.5 |

### 3.3 What Lives Where Now

```
50V3R31GN-M4CH1N4/
├── crates/
│   ├── sovereign-mcp-bridge/      ← VSB UDP→MCP bridge (Rust, Phase 118)
│   └── sovereign-whisper-mcp/     ← STT artery (Rust, Phase 118.5)
├── dashboard/
│   └── components/
│       └── HermesInteractiveTUI.tsx  ← iframe → port 9119, Phase 119
├── sidecars/
│   └── hermes-agent-nous/         ← git submodule → nodestadt/hermes-agent
│       ├── environments/
│       │   └── agent_loop.py      ← ST3GG guard, vision artery stub
│       ├── tools/
│       │   └── transcription_tools.py  ← whisper-mcp stub
│       ├── web/src/index.css      ← Tactical Authority palette
│       └── cli-config.yaml        ← MCP server registrations
└── .gitmodules                    ← pins nodestadt/hermes-agent @ SHA
```

---

## 4. THE UPDATE WORKFLOW (HOW TO PULL UPSTREAM)

When NousResearch ships a new hermes-agent release and you want to incorporate it:

### 4.1 Update the fork

```bash
# Work in a temp clone of your fork
git clone https://github.com/nodestadt/hermes-agent /tmp/hermes-fork-update
cd /tmp/hermes-fork-update

# Add the NousResearch upstream remote (one-time)
git remote add upstream https://github.com/NousResearch/hermes-agent

# Fetch the new upstream release
git fetch upstream
git fetch upstream --tags

# Rebase sovereign-patches onto the new upstream tag (e.g., v0.13.0)
git checkout sovereign-patches
git rebase upstream/v0.13.0

# Fix any merge conflicts in:
#   environments/agent_loop.py   (ST3GG guard position may shift with new lines)
#   tools/transcription_tools.py (whisper stub may conflict with upstream voice changes)
#   web/src/index.css            (new upstream styles may clash with TA palette)
#   cli-config.yaml              (new upstream keys may appear)

# Merge rebased sovereign-patches into main
git checkout main
git merge sovereign-patches --no-ff -m "merge: sovereign patches onto upstream vX.Y.Z"
git push origin main --force-with-lease
git push origin sovereign-patches --force-with-lease
```

### 4.2 Bump the monorepo submodule

```bash
cd /path/to/50V3R31GN-M4CH1N4

# Pull the new fork HEAD into the submodule
git submodule update --remote sidecars/hermes-agent-nous

# Commit the SHA bump
git add sidecars/hermes-agent-nous
git commit -m "chore(hermes): bump submodule to upstream vX.Y.Z + sovereign patches"
```

### 4.3 Initialize submodule on a fresh clone

Anyone cloning the monorepo must run:

```bash
git clone https://github.com/nodestadt/50V3R31GN-M4CH1N4
cd 50V3R31GN-M4CH1N4
git submodule update --init --recursive
```

Or clone with submodules in one command:

```bash
git clone --recurse-submodules https://github.com/nodestadt/50V3R31GN-M4CH1N4
```

---

## 5. RE-INTEGRATING THE UNTRACKED SIDECARS

The sidecars currently untracked (Section 2) have three re-integration paths depending on their nature:

### Path A — Regular tracked directory (self-contained, no upstream)
For sidecars you own entirely (e.g., `sidecars/worldseed`, `sidecars/zeroboot`):

```bash
git add sidecars/worldseed
git commit -m "chore: re-track sidecars/worldseed as regular directory"
```

### Path B — Fork-backed submodule (external upstream to track)
For sidecars that ARE forks of external repos (e.g., `sidecars/halo` if it forks an upstream):

```bash
# Fork the upstream to nodestadt org on GitHub first
# Then:
git submodule add https://github.com/nodestadt/<repo>.git sidecars/<name>
# Apply your patches to the fork, push, bump SHA
```

### Path C — Archive (deprecated, not needed)
If a sidecar is superseded and not needed:

```bash
# Leave as untracked — git ignores it, files preserved
# Add to .gitignore if you want `git status` to stop showing it:
echo "sidecars/<name>/" >> .gitignore
```

### Current recommended status per sidecar

| Sidecar | Recommended Path | Notes |
| :--- | :--- | :--- |
| `halo` | B (submodule) if upstream exists, else A | Check for upstream remote |
| `hermeshub` | A or C | Evaluate if superseded by hermes-agent |
| `hermes-web-ui` | C (archive) | Superseded by hermes-agent `web/` + dashboard iframe |
| `hermes-desktop` | C (archive) | Superseded by HermesInteractiveTUI.tsx |
| `worldseed` | A (re-track) | Internal — add back as regular directory |
| `free-claude-proxy` | A or B | Evaluate upstream |
| Others | A (re-track) | Re-evaluate per Phase 120 roadmap |

---

## 6. THE BROADER SIDECAR SOVEREIGNTY PRINCIPLE

The architectural decision made in Phase 118 establishes a pattern for all future external integrations:

1. **Never vendor raw.** External repos become tracked gitlinks (submodules), not copied directories.
2. **Fork before patching.** All sovereign modifications go on `nodestadt/<fork>`, never directly into index files.
3. **Patches are commits.** Every deviation from upstream is a named, reviewable commit on the `sovereign-patches` branch.
4. **The monorepo pins SHAs.** The monorepo's `.gitmodules` + index SHA is the source of truth for exactly what version of each external dependency is running.
5. **Update on your schedule.** Submodule SHAs never auto-bump. Upstream can ship daily — you absorb updates deliberately, with rebase + review.

This model is identical to how the Linux kernel manages vendor trees, how Chromium manages V8, and how major distributions maintain patched packages upstream. The fork is the interface; the monorepo is the integration point.

---

## 7. PHASE LINEAGE

| Phase | Commit Range | What Changed |
| :--- | :--- | :--- |
| **118** | `38b7eca` → `d0cfdf1` | Deleted hermes-core Node.js, ST3GG guard, scripts rewired |
| **118.5** | `bd410f8` | sovereign-whisper-mcp Rust crate, cli-config.yaml, transcription stub |
| **119** | `bd410f8` | Tactical Authority HUD skin, vision artery stub, dashboard encapsulation |
| **Submodule** | `221d1d5` → `e0dc35f` | hermes-agent-nous → submodule, 13 orphaned gitlinks purged |

**Fork HEAD:** `0ce9231396495192b2e32d5e14d2b6493f157bfb` (nodestadt/hermes-agent `main`)

---

**::/5Y573M-N071C3 : HERMES_FORK_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
