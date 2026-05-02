# ◈ GEPA & THE SKILL-FACTORY (v3.8.24-SYNTHESIS)

**Phase:** 87 [AGENTIC_SKILL_AUTHORING]
**Core Component:** `SkillAuthor.ts`

---

## ◈ OVERVIEW

The **Global Experience Processing Artery (GEPA)** is the NODESTADT subsystem responsible for the autonomous evolution of agentic capabilities. Through the **Skill-Factory**, the OS converts successful agent reasoning trajectories into permanent, reusable skills (MCP tools), and uses failed trajectories for **Logic Vaccination** to prevent recurring system deadlocks.

---

## ◈ THE SKILL-FACTORY

The Skill-Factory utilizes the `SkillAuthor` logic to promote ephemeral agent behaviors into first-class system capabilities.

### 1. Trajectory-to-Skill Conversion
When an agent completes a successful trajectory, the `SkillAuthor` performs the following steps:
- **Ingestion**: Analyzes the `AgentTrajectory` (tool calls, inputs, and outcomes).
- **Synthesis**: Extracts the underlying logic pattern and generates a corresponding TypeScript MCP tool.
- **Materialization**: Writes the tool to `packages/hermes-core/src/core/plugins/skills/`.
- **Registration**: Injects the new skill into the `PluginRegistry` for immediate system-wide availability.

### 2. Zero-Trust Verification
Every auto-synthesized skill is subject to a mandatory security audit by the Node D Strategic Oracle before being marked as `STABLE`. This ensures the logic is clinical and does not violate zero-trust boundaries.

---

## ◈ EXPERIENCE-GITTING

Experience-Gitting is the process of logging and indexing failures to refine system reasoning.

### 1. Failure Log Ingestion
Persistent failure traces are captured in the `experience_logs` table in `SovereignIntelligence.db`.
- **`failure_trajectory`**: A JSON trace of the reasoning path that led to the deadlock.
- **`learned_fix`**: A synthesized correction proposed by the Node D audit layer.
- **`severity`**: Range from LOW to CRITICAL.

### 2. Logic Vaccination
The **Ouroboros Reflection Engine** audits failure logs to extract **Logic Vaccinations** — concise directive constraints that are prepended to future agent prompts.
- **Vaccination Effect**: Prevents the agent from re-entering the same class of deadlock.
- **Deduplication**: Logic vaccinations are deduplicated to maintain a lean prompt context.

---

## ◈ EVOLUTIONARY WORKFLOW

1. **Attempt**: Agent attempts a task using existing skills.
2. **Result**:
   - **Success**: `SkillAuthor` promotes the pattern to a new **Skill**.
   - **Failure**: `Hermes` logs the trajectory for **Experience-Gitting**.
3. **Refine**: `Ouroboros` synthesizes a **Logic Vaccination** from the failure.
4. **Repeat**: Future attempts are "vaccinated" against the previous failure.

---
*::/5Y573M-N071C3 : EVOLUTIONARY_ARTERY_PRIMED. // NODESTADT_AUTHORITY_OS*
