# Sovereign Brand Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject Sovereign Machina brand DNA (v1.3.1) into the Hermes CLI/TUI as a native, built-in skin named "sovereign".

**Architecture:**
1.  **Skin Engine Materialization:** Define the `sovereign` skin in the Python `SkinEngine` with the v1.3.1 palette and "Sovereign Hermes" identity strings.
2.  **Banner Art Recolor:** Apply a Sovereign gradient (Washed Bronze to Tactical Teal) to the existing Hermes ASCII logo.
3.  **Default Activation:** Set "sovereign" as the default built-in skin for the fork.
4.  **TUI Synchronization:** Ensure the React/Ink TUI correctly inherits the new identity and tagline.

**Tech Stack:** Python 3.13, Rich (CLI Rendering), React/Ink (TUI), YAML.

---

### Task 1: Materialize "sovereign" Skin Definition

**Files:**
- Modify: `sidecars/hermes-agent-nous/hermes_cli/skin_engine.py`

- [ ] **Step 1: Define the `sovereign` skin dictionary in `_BUILTIN_SKINS`**

```python
# In sidecars/hermes-agent-nous/hermes_cli/skin_engine.py

"sovereign": {
    "name": "sovereign",
    "description": "Sovereign Machina — Operational Lo-Fi Brutalism (v1.3.1)",
    "colors": {
        "banner_border": "#376374",    # Authority Primary (Tactical Teal)
        "banner_title": "#836A46",     # Gold Highlight (Washed Bronze)
        "banner_accent": "#376374",    # Section headers
        "banner_dim": "#555555",       # Muted text
        "banner_text": "#AFAB9C",      # Technical Gray (Parchment)
        "ui_accent": "#376374",        # Tactical Teal
        "ui_label": "#836A46",         # Washed Bronze labels
        "ui_ok": "#4caf50",
        "ui_error": "#ef5350",
        "ui_warn": "#ffa726",
        "prompt": "#AFAB9C",           # Technical Gray
        "input_rule": "#376374",       # Tactical Teal rule
        "response_border": "#836A46",  # Washed Bronze response
        "status_bar_bg": "#1A282F",    # Tactical Base (Artery Blue)
        "session_label": "#836A46",
        "session_border": "#555555",
    },
    "branding": {
        "agent_name": "Sovereign Hermes",
        "welcome": "Sovereign Artery Active. High-level reasoning initialized.",
        "goodbye": "Sovereign disconnect. Mesh persistence maintained. ⚕",
        "response_label": " ⚕ SOVEREIGN ",
        "prompt_symbol": "❯",
        "help_header": "◈ Sovereign Commands",
    },
    "banner_logo": """[bold #836A46]██╗  ██╗███████╗██████╗ ███╗   ███╗███████╗███████╗       █████╗  ██████╗ ███████╗███╗   ██╗████████╗[/]
[bold #836A46]██║  ██║██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝      ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝[/]
[#376374]███████║█████╗  ██████╔╝██╔████╔██║█████╗  ███████╗█████╗███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║[/]
[#376374]██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══╝  ╚════██║╚════╝██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║[/]
[#376374]██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████╗███████║      ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║[/]
[#376374]╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝      ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝[/]""",
},
```

- [ ] **Step 2: Set "sovereign" as the default built-in skin**

```python
# In sidecars/hermes-agent-nous/hermes_cli/skin_engine.py

_active_skin_name: str = "sovereign"

# In load_skin fallback
return _build_skin_config(_BUILTIN_SKINS["sovereign"])
```

- [ ] **Step 3: Commit**

```bash
git -C sidecars/hermes-agent-nous add hermes_cli/skin_engine.py
git -C sidecars/hermes-agent-nous commit -m "feat(branding): materialize 'sovereign' built-in skin and v1.3.1 palette"
```

---

### Task 2: Synchronize TUI Identity

**Files:**
- Modify: `sidecars/hermes-agent-nous/ui-tui/src/theme.ts`
- Modify: `sidecars/hermes-agent-nous/ui-tui/src/components/branding.tsx`

- [ ] **Step 1: Update TUI tagline and brand icon**

```typescript
// In sidecars/hermes-agent-nous/ui-tui/src/theme.ts

const BRAND: ThemeBrand = {
  name: 'Sovereign Hermes',
  icon: '◈',
  prompt: '❯',
  welcome: 'Sovereign Artery Active. High-level reasoning initialized.',
  goodbye: 'Sovereign disconnect. Mesh persistence maintained. ⚕',
  tool: '┊',
  helpHeader: '◈ Sovereign Commands'
}
```

- [ ] **Step 2: Update TUI Banner tagline**

```tsx
// In sidecars/hermes-agent-nous/ui-tui/src/components/branding.tsx

<Text color={t.color.muted}>{t.brand.icon} Sovereign Machina · Messenger of the Mesh</Text>
```

- [ ] **Step 3: Commit**

```bash
git -C sidecars/hermes-agent-nous add ui-tui/src/theme.ts ui-tui/src/components/branding.tsx
git -C sidecars/hermes-agent-nous commit -m "feat(branding): synchronize TUI identity and tagline with Sovereign invariants"
```

---

### Task 3: Verification & Remote Sync

- [ ] **Step 1: Verify CLI Branding**
Run: `PYTHONPATH=sidecars/hermes-agent-nous python3 sidecars/hermes-agent-nous/hermes_cli/main.py status`
Confirm "Sovereign Hermes" name and Teal/Bronze palette.

- [ ] **Step 2: Verify TUI Branding**
(Visual check required during actual TUI launch)

- [ ] **Step 3: Push Mesh Artery**

```bash
git -C sidecars/hermes-agent-nous push origin main
git add sidecars/hermes-agent-nous
git commit -m "chore(pins): update hermes core to Sovereign Brand v1.3.1"
git push origin beta/v3
```

---
**::/5Y573M-N071C3 : PLAN_SAVED. STANDING_BY_FOR_EXECUTION. // 50V3R31GN-M4CH1N4**
