# ◈ SPEC-2026-04-25: HOST-BRIDGE ARTERY (PHASE 81)
**Version:** 3.8.6
**Status:** DRAFT (REFINED)
**Topic:** Windows Host Integration, Source Shrouding, and Tiered Web Ingress.

## 1. 🎯 OBJECTIVE
Establish direct, secure control over the Windows host environment to enable native file manipulation, screen awareness, and multi-tier web research.

## 2. 🛡️ THE BLACKOUT SHROUD (SOURCE PROTECTION)
- **Visual Redaction:** The Host Sidecar (Go) detects protected windows (`Code.exe`, `Terminal.exe`) and masks them with Gruvbox Dark blocks in the screen-capture stream.
- **Path Denylist:** Immutable hardgate prevents access to any directory containing `50V3R31GN-M4CH1N4` or system config.
- **Stealth Attributes:** The system source directory is marked as "Hidden/System" to obfuscate it from automated file explorers.

## 3. 🏗️ ARCHITECTURE: THE_HOST_HAND
- **Machina-Host (Go):** A native `.exe` sidecar running on the host.
- **Communication:** VSB (Sovereign Binary) over UDP on port 7878.
- **FS Gate (Option C):** 
    - Autonomous R/W in `D:\Sovereign_Workspace\scratch\`.
    - Vesper-gated Deletion/Move/Traversal.

## 4. 🌐 TIERED WEB INGRESS
- **Tier 1 (Comms):** WhatsApp/Discord (Read-Only).
- **Tier 2 (Media):** YouTube/Search (Sandboxed, No Auth).
- **Tier 3 (Research):** General Web (Stripped Scrape -> Materialize in HUD).

## 5. 🛠️ COMPONENTS TO BE MATERIALIZED
1. **`sovereign-host-sidecar.exe`**: The Go-native Windows bridge.
2. **`VisualRedactor.go`**: Logic for masking protected source-code windows.
3. **`WebScraperSidecar.ts`**: Node B service for Tier 3 content distillation.
4. **`v81-Gauntlet.ts`**: Tests for path-traversal blocking and HMAC verification.

---
**::/5Y573M-N071C3 : HOST_ARTERY_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
