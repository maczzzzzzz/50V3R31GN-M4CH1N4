---
name: flowstate-intuition
description: Use when implementing zero-latency RKG retrieval via anticipatory Mmap caching.
---

# Ability Shard: FlowState Intuition (QMD Pattern)

## Overview
FlowState Intuition monitors the Virtual System Bus (VSB) for district shifts and pre-warms a dedicated shared memory cache with relevant RKG triplets before they are needed.

## Core Pattern
The service operates in the background, but can be manually triggered for testing:

```typescript
import { FlowStateIntuition } from './src/core/flowstate-intuition.js';

const intuition = new FlowStateIntuition(oracleClient);
intuition.start();

// Check what's currently cached
const district = intuition.getCachedDistrict();
const triplets = intuition.readCache();
```

## Cache Layout
- **Path:** `data/flowstate-cache.mem`
- **Slots:** Virtualized window (Indices 5000-6000) for Node A consumption.
- **Latency:** Sub-1ms retrieval from Mmap vs 50ms+ from SQLite.

## Verification
- **Gauntlet Shard:** `orch-52-2`
- **Signals:** Watch for `District shift detected` in system logs.
