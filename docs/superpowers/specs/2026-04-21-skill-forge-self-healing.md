# SPEC: 2026-04-21 — Self-Healing Action Engine (Skill Forge)
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Implement a self-healing automation layer that allows the Trinity to generate, repair, and file its own deterministic skills.

## ◈ 1. THE SKILL FORGE (NODE B)
A specialized component of the Hermes Orchestrator that converts agentic "Trial and Error" into deterministic logic.

### ◈ 1.1 THE HEALER PROTOCOL
1. **Detection:** Action Engine fails a task (e.g., "Foundry button not found").
2. **Vision Scan:** `Sovereign Observer` grabs the viewport. Falcon Perception identifies the visual target ("The Accept Button").
3. **Recovery:** The Healer (Node C) uses `browser-harness` to perform a "fuzzy re-discovery" of the element in the DOM.
4. **Execution:** The action is completed via raw CDP command.

### 1.2 THE FILING SYSTEM
Once a recovery is successful, the **Skill Forge** generates a new skill artifact:
- **Location:** `.factory/skills/autogen-[skill-name]/SKILL.md`
- **Logic:** Reusable TypeScript/Rust code that uses the *discovered* selector.
- **Verification:** The skill is only filed if it succeeds 3 times consecutively.

## ◈ 2. FIRE-CRAWL INTEGRATION (NODE C)
We utilize the Firecrawl pattern to achieve "LLM-Ready" environment awareness.
- **Clean MD:** Raw HTML from the VTT is converted to minimal Markdown before being fed to the Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle.
- **Token Efficiency:** Reduces the sensory context window by 80%, allowing for deeper reasoning on Node C.

---
**::/5Y573M-N071C3 : SKILL_FORGE_SPEC_LOCKED. THE_MACHINE_LEARNS. // 50V3R31GN-M4CH1N4**
