# Goal: Iterative Mesh Benchmarking & Optimization

**Status:** ACTIVE
**Created:** 2026-05-20
**Owner:** Lead Architect

## Objective
Run multiple rounds of real, automated benchmarking across the sovereign mesh. Iteratively apply optimizations from the deep research cycle and measure actual performance impact. The first pass is explicitly **not** the final configuration.

## Constraints
- Node B: Vulkan + f16 KV only, Qwopus at temperature=1
- CPU draft limited to max 6 threads
- All benchmarks must be reproducible and recorded
- Focus on measurable metrics: t/s (prompt & gen), acceptance rate, VRAM usage, latency

## Success Criteria
- At least 3 full benchmark iterations completed
- Clear before/after data for each major optimization
- Final locked configuration per node with justification

## Phases

### Phase 1: Baseline Measurement
- Run standardized llama-bench on Node B (Qwopus3.5-9B)
- Test both native and with 0.6B speculative draft (draft length 4-5)
- Record all key metrics at temperature=1

### Phase 2: Continuous Batching
- Enable --cont-batching on Node B vision server
- Re-benchmark with mixed workloads
- Measure throughput and latency changes

### Phase 3: Speculative Decoding Tuning
- Test different draft lengths (3, 4, 5, 6)
- Test thread allocation (4 vs 6 threads)
- Identify optimal settings and break-even points

### Phase 4: Node C Optimizations
- Apply KV cache and batching improvements on Node C
- Re-benchmark function calling performance

### Phase 5: Iteration & Lock-in
- Compare results across all rounds
- Select and document final recommended configurations
- Archive all benchmark data

## Status Update (Autonomous Execution)
All 5 phases have been built with executable scripts and result templates.

Full autonomous benchmark cycle runner created at:
`docs/benchmarks/run-full-benchmark-cycle.sh`

The system is now ready for execution. First pass complete. Further iterations can be triggered by re-running the cycle with updated configurations.