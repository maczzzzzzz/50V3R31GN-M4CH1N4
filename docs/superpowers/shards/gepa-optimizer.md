---
name: gepa-optimizer
description: Use when evolving the SOVEREIGN_SOUL Nix identity based on high-signal soul log trajectories.
---

# Ability Shard: GEPA Optimizer (Genetic Prompt Evolution)

## Overview
The GEPA Optimizer reads `data/logs/soul.jsonl` for entries with `training_value >= 0.8`, extracts recurring directive patterns, and patches `nix/identities.nix` to reinforce successful cognitive patterns in the sovereign soul string.

## Core Pattern

```typescript
import { runOptimizer } from './scripts/forge/gepa-optimizer.js';

// Dry run — preview evolved soul without writing
const result = runOptimizer({ dryRun: true });

// Live evolution — patches nix/identities.nix
const result = runOptimizer({ dryRun: false });
console.log(`Evolved: ${result.patternsFound} patterns from ${result.highSignalCount} high-signal entries`);
```

## CLI

```bash
npm run forge:gepa        # live evolution
npm run forge:gepa:dry    # preview without writing
```

## Evolution Requirements
- Minimum **3 high-signal samples** (`training_value >= 0.8`) required to trigger evolution.
- Extracts sentences appearing **2+ times** across high-signal entries.
- Top 5 patterns by average score reinforced in the EVOLVED PATTERNS section.

## Verification
- **Gauntlet Shard:** `orch-53-2` (Evolution-Verification)
- **Test:** Generates evolved soul from synthetic patterns, validates Nix syntax, patches fixture file.
