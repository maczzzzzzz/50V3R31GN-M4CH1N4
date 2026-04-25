---
name: soul-logger
description: Use when capturing reasoning trajectories and high-signal agent decisions for future fine-tuning and audit.
---

# Ability Shard: Soul Logger (Icarus Pattern)

## Overview
The Soul Logger is a persistent background service that captures Node B `<think>` streams and agent decisions. It applies heuristic `training_value` tagging (0.0–1.0) to identify high-signal reasoning cycles.

## Core Pattern
Wrap any generative or logical call path with the `soulLogger`:

```typescript
import { soulLogger } from './src/core/soul-logger.js';

// Simple capture
soulLogger.capture(rawOutput, 'narrative', { district: 'Watson' });

// Async wrap (recommended)
const response = await soulLogger.wrap(
  () => narrativeClient.generate(prompt),
  'narrative',
  { context: 'combat' }
);
```

## Heuristics
- **High Signal (0.8+):** Critical successes/failures, governance vetoes, pattern detection.
- **Medium Signal (0.4-0.6):** Standard narrative generation, strategy shifts.
- **Low Signal (0.1):** Timeouts, fallbacks, trivial errors.

## Verification
- **Gauntlet Shard:** `orch-52-1`
- **Output File:** `data/logs/soul.jsonl`


---
**LINKS:** [[OS_CORE]]
