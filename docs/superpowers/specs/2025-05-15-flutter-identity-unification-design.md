# 2025-05-15-Flutter-Identity-Unification-Design

**Goal:** Unify the mobile app with the Sovereign Machina 'CRT Artery' identity by updating the color palette and adding a CRT scanline overlay.

**Architecture:**
- Surgical update of `AppStyles` in `ui_guidelines.dart`.
- Implementation of `CRTScanlineOverlay` and `CRTScanlinePainter` in `widgets/crt_overlay.dart`.

**Tech Stack:**
- Flutter (Dart)
- CustomPaint / CustomPainter API

**Components:**
1. **Palette Update:**
    - `backgroundPrimary`: `0xFF1A282F`
    - `backgroundSecondary`: `0xFF27353B`
    - `accent`: `0xFF376374`
2. **CRT Overlay:**
    - `CRTScanlineOverlay` (StatelessWidget)
    - `CRTScanlinePainter` (CustomPainter) drawing lines every 4px with 0.1 opacity.

**Verification:**
- Visual inspection of code changes.
- Ensure idiomatic Flutter/Dart usage.
