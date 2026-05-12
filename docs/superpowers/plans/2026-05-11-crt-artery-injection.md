# CRT Artery CSS Surface Injection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject CRT scanlines and glow into the workspace dashboard.

**Architecture:** Use CSS variables and pseudo-elements for scanlines, and a text-shadow class for the CRT glow effect. Enforce brutalism by removing border-radius globally.

**Tech Stack:** CSS, Tailwind CSS

---

### Task 1: Implement Scanline Overlay and Glow Variables

**Files:**
- Modify: `dashboard/hermes-workspace/src/scifi-theme.css`

- [ ] **Step 1: Update scifi-theme.css with CRT variables and overlay**

```css
/* scifi-theme.css */
:root {
  /* ... existing vars ... */
  --glow-color: rgba(55, 99, 116, 0.4);
  --scanline-opacity: 0.05;
}

.root::after {
  content: " ";
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  z-index: 100;
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
  opacity: var(--scanline-opacity);
}

.crt-glow {
  text-shadow: 0 0 5px var(--glow-color);
}

/* Forced Brutalism */
* {
  border-radius: 0px !important;
}
```

- [ ] **Step 2: Commit scifi-theme.css**

```bash
git add dashboard/hermes-workspace/src/scifi-theme.css
git commit -m "feat(visual): inject CRT scanlines and glow protocol"
```

---

### Task 2: Apply glow to all technical text

**Files:**
- Modify: `dashboard/hermes-workspace/src/styles.css`

- [ ] **Step 1: Add .crt-glow to .theme-text and headers in styles.css**

```css
/* styles.css */
.theme-text {
  color: var(--theme-text) !important;
  @apply crt-glow; /* If using tailwind, or just add the property */
}

/* Or more precisely, find where .theme-text is defined and add the shadow */
```

- [ ] **Step 2: Commit styles.css**

```bash
git add dashboard/hermes-workspace/src/styles.css
git commit -m "feat(visual): apply CRT glow to technical text"
```
