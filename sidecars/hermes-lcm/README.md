# Hermes-LCM: Lossless Context Management (MemoryProvider)

## Overview

Hermes-LCM provides lossless context management for the Sovereign Machina mesh. It implements a Directed Acyclic Graph (DAG) of IdeaBlocks for semantic memory retention and retrieval.

## Architecture

- **Primary Node:** Node A (100.96.253.114) - Synapse Cache
- **Sync Nodes:** Node B (100.66.173.31), Node D (100.120.225.12)
- **Protocol:** SQLite with encrypted rsync over Tailscale Artery
- **Latency Target:** <100ms cross-mesh read/write

## Integration

Hermes-LCM is registered as a native Hermes plugin:

```python
# In Tenacity plugin system
MemoryProvider.register('hermes-lcm', HermesLCMProvider)
```

## Blockify Pre-Processor

Converts MemPalace entities into structured `<ideablock>` units:

```xml
<ideablock id="uuid" timestamp="ISO8601">
  <semantic>...</semantic>
  <context>...</context>
  <relations>...</relations>
  <metadata>...</metadata>
</ideablock>
```

## Deployment

1. Initialize SQLite database on Node A
2. Configure rsync sync to Node B/D
3. Register plugin in Tenacity
4. Verify: `hermes doctor` shows `MemoryProvider: hermes-lcm` active
