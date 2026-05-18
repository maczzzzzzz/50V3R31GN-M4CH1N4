# Mesh Baseline Summary - 2026-05-18

**Scope:** Pre-Node D upgrade baseline  
**Nodes exercised:** Node B (Vulkan)  
**Model:** Qwopus3.5-9B Q8_0  
**Backend:** llama.cpp b9190 Vulkan (f16 KV)

## Node B Results (3 passes each)

### Native
- Prompt: ~310-330 t/s
- Generation: ~32-35 t/s
- Context: 4096
- Notes: Stable, matches historical 322/34.1 baseline

### Speculative (0.6B draft)
- Prompt: ~300-320 t/s  
- Generation: ~38-42 t/s (estimated +12-18% uplift)
- Acceptance rate: Not captured cleanly in this run
- Notes: Slight regression in prompt speed, gain in generation

## Issues Encountered
- PowerShell output capture produces garbled text with null bytes
- RPC backend warning on every run (non-fatal)
- No sustained GPU spike visible due to short test duration

## Next Steps (before Node D upgrade)
- Re-run with `--output json` or pure cmd.exe redirection for clean numbers
- Run equivalent 3-pass baseline on Node C (CUDA)
- Run equivalent 3-pass baseline on Node D (CPU, MTP off)

## Files
- Raw outputs saved in D:\llama.cpp\benchmarks\system-wide-*
- This summary: docs/benchmarks/baseline-2026-05-18/raw-summary.md
