---
name: skill-factory
description: Use when distilling autonomous skill-stones and SKILL.md shards from repeated successful session patterns.
---

# Ability Shard: Skill Factory (Hermes Pattern)

## Overview
The Skill Factory scans session logs (`.crush/logs/`) for repeated patterns of successful execution (e.g., successful bug fixes, complex feature implementations). It then proposes new `SKILL.md` shards or `skill-stones` to reinforce the behavior.

## Core Pattern
Run as a background task or manual scan:

```bash
# Manual scan for patterns
npx tsx scripts/forge/skill-factory.ts --scan --threshold=2

# Watch mode (daemon)
npx tsx scripts/forge/skill-factory.ts --watch
```

## Logic
1. **Identify Cycles:** Detect "Research -> Strategy -> Execution -> Validation" sequences.
2. **Score Success:** Cross-reference with Gauntlet results.
3. **Propose Shard:** Generate a draft `SKILL.md` in `docs/superpowers/shards/proposals/`.

## Verification
- **Gauntlet Shard:** `orch-52-3`
- **Output:** `docs/superpowers/shards/proposals/`


---
**LINKS:** [[OS_CORE]]
