# Node D RTX 5060 Ti: Architect's Decision Analysis

**Date:** 2026-05-17
**Architect:** GLM-5 (Lead Architect)
**Status:** FINDINGS NOTED -- pending user decision on purchase

---

## KEY FINDING: The MoE Illusion

The current 35B MoE model (Qwen3.5-35B-A3B-MTP) only activates 3B parameters per token. For a "heavy reasoning" node, this is a misallocation. The 35B total is knowledge breadth (expert variety), not reasoning depth.

A 27B dense model has 27B active params per token -- **9x more compute per token** than 3B-active MoE. The MoE was chosen because CPU-only can't handle dense 27B at usable speed. With a GPU, that constraint evaporates.

## THE MOVE

| Metric | Current (CPU-only) | Proposed (RTX 5060 Ti 16GB + OCuLink) |
|:-------|:-------------------|:---------------------------------------|
| Model | 35B MoE, 3B active/token | Qwen3.6-27B dense, 27B active/token |
| Quant | Q4_K_M (19.7 GB) | UD-Q3_K (~15 GB, fits VRAM) |
| Gen speed | 6.1 t/s | 35-45 t/s base, 70-90 t/s with MTP |
| Active reasoning | 3B params | 27B params (9x more) |
| VRAM usage | N/A (CPU RAM) | ~15 GB of 16 GB |

Net result: **10-15x throughput** AND **9x more active reasoning compute**. Loss is MoE expert diversity (knowledge tasks), not reasoning quality. For a heavy reasoning node, upgrade on both axes.

## HARDWARE SPECS (from Gemini Pro research)

- RTX 5060 Ti 16GB: Blackwell GB206, 448 GB/s GDDR7, sm_100/sm_120, 180W TGP
- OCuLink: PCIe 4.0 x4, ~8 GB/s. Transparent to OS. Only matters for hybrid split inference.
- Rule: model must fit ENTIRELY in 16GB VRAM. Any CPU offload over OCuLink is fatal.

## MODEL FIT CONSTRAINTS

- 35B MoE Q4_K_M (19.7 GB): DOES NOT FIT. Hybrid over OCuLink drops below 6.1 t/s.
- 35B MoE UD-Q2_K (~14 GB): Fits but 2-bit degrades reasoning. Defeats purpose.
- Qwen3.6-27B UD-Q3_K (~15 GB): Best fit. MTP speculative decoding for speed boost.
- Qwen3.6-14B Q6_K (~12 GB): Comfortable fit. ~50-65 t/s. Room for KV cache.

## PREREQUISITES (confirmed by user)

- Node D Meteor Lake platform: has native OCuLink port. Confirmed.
- Requires separate PSU + OCuLink dock/enclosure. User must purchase.

## COST ESTIMATE

| Item | Estimated Cost (CAD) |
|:-----|:---------------------|
| RTX 5060 Ti 16GB (ASUS Prime) | ~$550 |
| OCuLink dock/enclosure | ~$100-150 |
| PSU (400-500W) | ~$80-120 |
| **Total** | **~$730-820 CAD** |

## OPEN ITEMS

1. Exact Qwen3.6-27B UD-Q3_K file size and KV cache headroom at target context length
2. ik_llama.cpp MTP support status for Qwen3.6 -- needs build verification
3. NixOS NVIDIA driver for Blackwell (570.xx+) -- may need nixos-unstable
4. CUDA 12.8+ availability in nixpkgs for ik_llama.cpp CUDA build on Node D

## RESOLUTION

User is evaluating purchase. If approved, this becomes Phase 1 hardware deployment task.
