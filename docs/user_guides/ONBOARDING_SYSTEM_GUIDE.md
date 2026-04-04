# User Guide: Conversational Onboarding

**Version:** 1.2.0
**Role:** Actor Characterization and Rapid Deployment

---

## 🎭 The Onboarding Flow
The **Onboarding System** replaces manual actor creation with a high-fidelity conversational characterization engine.

### 🎭 The Experience:
1.  **Initialization**: Use `/onboard [NPC_NAME]` in the Crush CLI.
2.  **Characterization**: The AI (Mistral-Nemo) interviews the GM or generates a backstory based on the current district lore.
3.  **Physicalization**: The system automatically:
    - Generates a rules-correct sheet on Node A.
    - Persists the record to **`Akashik.db`**.
    - **Materializes** the token and character sheet in Foundry VTT.

---

## 🛠️ Grounding
Actors onboarded this way are automatically linked to the **Mission Swarm** and the **Red Trade** system, making them permanent, interactive parts of the living world.

---
*Onboarding: Narrative-Physical Fusion Active.*
