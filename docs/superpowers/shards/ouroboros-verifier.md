---
name: ouroboros-verifier
description: Use when Node A must audit Node B trajectories for mandate violations and issue RE_ROLL interrupts.
---

# Ability Shard: Ouroboros Verifier (Recursive Logic Audit)

## Overview
The Ouroboros Verifier reads `data/logs/soul.jsonl` and checks each trajectory entry against a set of mandate violation patterns. On detection, it issues a VSB `RE_ROLL` interrupt (Index 4002) via UDP to port 7878.

## Core Pattern

```typescript
import { runAudit, OuroborosVerifier } from './src/core/ouroboros-verifier.js';

// One-shot audit of recent entries
const report = runAudit({ emit: true, tailN: 200 });
console.log(`${report.violationsFound} violations in ${report.entriesScanned} entries`);

// Continuous monitoring
const verifier = new OuroborosVerifier();
verifier.start(30_000); // poll every 30s
```

## Violation Patterns
- `PHYSICAL_INTEGRITY`: wall collision, ignored boundary
- `ZERO_TRUST`: rules-lawyer manipulation
- `MANDATE`: gauntlet bypass, shard skipping
- `RADICAL_CANDOR`: success simulation
- `VAULT_SECURITY`: push without seal
- `NIX_SOVEREIGNTY`: global package manager usage

## RE_ROLL Interrupt Format
```json
{ "index": 4002, "reason": "PHYSICAL_INTEGRITY: wall collision detected", "entryId": "...", "timestamp": "..." }
```

## Verification
- **Gauntlet Shard:** `orch-53-1` (Logic-Consistency)
- **Test:** Injects 3 mock violations + 1 clean entry; expects 3/3 detections, 0 false positives.
