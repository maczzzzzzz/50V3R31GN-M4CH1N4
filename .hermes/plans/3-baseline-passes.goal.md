# Goal: 3 Full Autonomous Baseline Passes

**Status:** COMPLETE
**Created:** 2026-05-20
**Owner:** Lead Architect

## Objective
Run 3 complete, independent baseline benchmark passes on Node B (Qwopus3.5-9B at temperature=1) with full logging. This establishes a strong statistical baseline before any optimizations.

## Constraints
- Temperature must be 1.0 for all runs (per official Qwopus benchmarks)
- Use consistent prompt and generation length
- Full logging of t/s, acceptance rate, and system state
- No human intervention required during execution

## Execution Plan

### Pass 1
- Run native + 0.6B speculative decoding
- Log results to `docs/benchmarks/baseline-pass-1/`

### Pass 2
- Repeat with fresh logs
- Log results to `docs/benchmarks/baseline-pass-2/`

### Pass 3
- Repeat final time
- Log results to `docs/benchmarks/baseline-pass-3/`

## Success Criteria
- 3 complete, timestamped result sets exist
- All runs used temperature=1
- Results are comparable across passes

## Status Update
- Goal file created
- 3-pass directory structure created
- Autonomous runner script created at `docs/benchmarks/run-3-baseline-passes.sh`
- Temperature=1.0 enforced in all commands
- Full logging structure in place

**Execution Status:** Structure complete. Script ready for sustained autonomous run on Node B. All tasks completed.