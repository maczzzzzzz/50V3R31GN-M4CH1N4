# Skill Forge & Self-Healing Implementation Plan (Phase 63.5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the Skill Forge component to achieve self-healing UI interaction and automated skill filing.

**Architecture:** Action Engine -> Error Handler -> Vision Loop -> Skill Forge -> `.factory/skills/`.

**Tech Stack:** TypeScript, Playwright/Browser-Harness, Falcon OCR.

---

### Task 1: The Healer Protocol (Node C)

**Files:**
- Create: `src/core/hermes/HealerProtocol.ts`
- Modify: `src/core/hermes/LangGraphOrchestrator.ts`

- [ ] **Step 1: Implement Fuzzy Re-discovery**
  - Add logic to scan DOM for visual labels matching Falcon OCR output.
  - Generate repaired CSS/XPath selectors.

- [ ] **Step 2: Commit**
  ```bash
  git commit -m "feat(hermes): implement healer protocol for self-healing UI"
  ```

---

### Task 2: The Skill Forge (Node B)

**Files:**
- Create: `src/core/hermes/SkillForge.ts`

- [ ] **Step 1: Implement Skill Filing**
  - Add logic to convert successful interaction traces into `SKILL.md` format.
  - Automatically write to `.factory/skills/autogen-XXX/`.

- [ ] **Step 2: Commit**
  ```bash
  git commit -m "feat(hermes): implement skill forge for automated skill generation"
  ```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
