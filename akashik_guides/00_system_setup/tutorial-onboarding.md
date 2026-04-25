# User Guide: Conversational Onboarding

**Version:** 3.2.6
**Role:** Actor Characterization and Rapid Deployment

---

## 🎭 The Onboarding Flow
The **Onboarding System** replaces manual actor creation with a high-fidelity conversational characterization engine.

### 🎭 The Experience:
1.  **Initialization**: Use `/onboard <name> <role>` in the in-game chat or Interactive Terminal.
2.  **Characterization**: The AI (Mistral-Nemo-12B) interviews the GM or generates a backstory based on the current district lore.
3.  **Physicalization**: The system automatically:
    - Generates a rules-correct sheet on Node A using the **Open-Reasoner-1.5B** judge.
    - Persists the record to **`Akashik.db`**.
    - **Materializes** the token and character sheet in Foundry VTT via CDP.

---

## 🛠️ Grounding
Actors onboarded this way are automatically linked to the **Mission Swarm** and the **Red Trade** system, making them permanent, interactive parts of the living world.

---
*Onboarding: Narrative-Physical Fusion Active.*


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
