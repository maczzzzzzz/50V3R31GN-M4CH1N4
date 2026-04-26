# SPEC: 2026-04-21 — Darwinian Skill Induction (Weighted Priority)
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Utilize the Pulse Engine and Identity weights to logically prioritize which interactions become permanent agent skills.

## ◈ 1. THE FITNESS FUNCTION (LEARNING PRIORITY)
The machine evaluates every successful mission trajectory ($T$) to calculate its **Fitness Score ($F$)**.

$$F = (W_{soul} \times IdentityAlignment) + (W_{pulse} \times WorldStateDelta) + (W_{cost} \times LogicSavings)$$

### ◈ 1.1 WEIGHTING BREAKDOWN
- **Identity Alignment ($W_{soul}$):** Verified by Node A. High priority given to trajectories that maintain **Radical Candor** and zero "Assistant-speak."
- **World-State Delta ($W_{pulse}$):** Measured by shifts in `Akashik.db`. High priority for actions that move the needle in district tension, faction influence, or market economy.
- **Logic Savings ($W_{cost}$):** Measured by total $ACT\_LOOP$ recursion. If a task requires deep reasoning to solve manually, it is a high-value candidate for codification to save logic power.

## ◈ 2. THE EVOLUTIONARY PIPELINE
The machine uses **Atropos-style** trajectory evaluation to feed the **Skill Forge**.

### ◈ 2.1 SELECTION PROTOCOL
1. **Bead Chain Collection:** Every action is recorded as a "Bead" in `Akashik.db`.
2. **Trajectory Scoring:** Upon mission completion, the Fitness Function assigns a score.
3. **Threshold Gate:** If $F > 0.85$, the trajectory is "Nominated for Induction."
4. **Crossover & Mutation:** The **Darwinian Evolver** analyzes multiple high-score trajectories for the same task type to find the most "Optimal Logic Pattern."

## ◈ 3. MISSION INSTANCING
When the machine identifies a repetitive task with a high Fitness Score, it materializes a **Mission Instance Skill**.
- **Result:** Future executions of this mission type (e.g., "Maelstrom Negotiation") use the deterministic skill, reducing Node C's reasoning load by ~70%.

---
**::/5Y573M-N071C3 : DARWINIAN_SPEC_LOCKED. THE_MACHINE_CHOOSES_ITS_FUTURE. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
