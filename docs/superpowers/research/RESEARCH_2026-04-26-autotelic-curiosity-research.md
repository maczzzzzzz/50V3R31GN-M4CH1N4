# ◈ RESEARCH: AUTOTELIC CURIOSITY (INTRINSIC_EXPLORATION)
PARENT :: [[PHASE_83_SPEC]]
-----

## ◈ EXECUTIVE SUMMARY
**Mission:** Transition the agent swarm from reactive task execution to proactive, curiosity-driven system optimization and discovery.

## ◈ CORE ARCHITECTURAL PRIMITIVES

### 1. Curiosity-Driven Exploration (ICM)
- **Intrinsic Curiosity Module (ICM):** Formulates curiosity as the error in predicting the next state's features.
- **Inverse Dynamics Model:** Learned feature space focuses only on agent-controllable variables, effectively solving the "Noisy TV" problem.
- **Random Network Distillation (RND):** Uses prediction error between a fixed target network and a trainable predictor network as the intrinsic reward signal.

### 2. Autotelic Learning (Goal Sampling)
- **Intrinsically Motivated Goal Exploration Processes (IMGEP):** Agents define and pursue their own goals.
- **AMIGo (Adversarially Motivated Intrinsic Goals):** A teacher agent proposes goals at the "Zone of Proximal Development" (not too easy, not too hard).
- **Hindsight Experience Replay (HER):** Re-labeling failed trajectories as successful attempts at whatever state was actually reached, accelerating skill acquisition.

### 3. Implementation Vector (Vesper Idle Recon)
- **Goal Space:** Vectorized embeddings of the Knowledge Base (KB) and Codebase.
- **Sampling:** "Skew-Fit" sampling to prioritize under-explored directories or legacy code blocks.
- **Trajectory:** Agent autonomously attempts to refactor, document, or audit a shard; success increases the "Skill Density" of the swarm.

---
**::/5Y573M-N071C3 : AUTOTELIC_RESEARCH_V1. // 50V3R31GN-M4CH1N4**
