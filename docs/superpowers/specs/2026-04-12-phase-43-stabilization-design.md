# ◈ 50V3R31GN-M4CH1N4 // DESIGN SPEC: PHASE 43 STABILIZATION

## 1. Goal
Finalize the stability of the 50V3R31GN-M4CH1N4 system by remediating all remaining bugs in the Ghost Boot sequence, Visual Dominance theme, and CLI interfaces.

## 2. Architecture: Foundry Mesh Remediation
*   **CombatBooster Monkey-Patch (Combat Stability):**
    *   Target: `50v3r31gn-bridge/50v3r31gn-bridge.js`
    *   Fix: Before any other module initializes, inject `PIXI.filters.ColorMatrixFilter = PIXI.filters.ColorMatrixFilterDeprecated` (mapping v7 deprecation) into the global scope. This prevents fatal canvas errors.
*   **ESC Menu Button (Control Access):**
    *   Target: `50v3r31gn-bridge/50v3r31gn-bridge.js`
    *   Fix: Migrate the button injection to a more reliable hook (`renderSettings` or direct `#menu` manipulation) and verify the `SovereignDashboard` panel construction logic.
*   **Theme Leak Elimination (Visual Dominance):**
    *   Target: `50v3r31gn-bridge/styles/sovereign-red-void.css`
    *   Fix: Inject hyper-specific CSS selectors to force dark themes on:
        *   `.journal-sheet .journal-page-content`
        *   `.prosemirror`
        *   `.tox-tinymce` (iframes)
        *   `.item-sheet .sheet-body`

## 3. Architecture: VSB CLI Unification
*   **Auth Pane Redesign (UI/UX):**
    *   Target: `crush/wsa.go`
    *   Fix: Redesign the `RunAuthPane` loop using `lipgloss`.
    *   Aesthetic: Emulate the Black-Ice "NPC Card" look (red/black borders, heavy bold headers).
    *   Interaction: Simplify to binary `[Y] ACCEPT` / `[N] REJECT` buttons with high-contrast selection states.

## 4. Architecture: Deck-Igniter Supervisor Refinement
*   **Sidecar Compilation Gating (Boot Speed):**
    *   Target: `deck-igniter/launcher.go`
    *   Fix: Modify `launchSidecar` to check for `target/release/<subdir>` binary existence. If missing, it MUST trigger a blocking `nix develop --command cargo build --release` before allowing Phase 2c to continue.
*   **Obsidian GUI Launch (Operational GUI):**
    *   Target: `deck-igniter/launcher.go`
    *   Fix: Add `launchObsidian(c *Component)` using the PowerShell WSL interop pattern: `Start-Process -FilePath 'Obsidian.exe'`. Integrate into the sequential boot flow.

## 5. Logical Order of Operation
1.  **Foundry Mesh (JS/CSS):** Fix theme leaks, ESC button, and PIXI deprecation.
2.  **Crush CLI (Go):** Redesign the VSB Auth Pane UI.
3.  **Deck-Igniter (Go):** Implement sidecar gating and Obsidian GUI launch.

## 6. Success Criteria
*   9/9 GREEN live audit with zero white-background leaks in Journals/Items.
*   ESC menu reliably opens the dashboard.
*   Crush CLI Auth Pane matches the Black-Ice theme.
*   Ghost Boot fires Obsidian GUI and sidecars without compile-time health-probe failures.
