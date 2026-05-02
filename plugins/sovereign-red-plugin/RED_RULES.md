# RED_RULES.md: The Simulation Physics Constitution (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
### [RED_DIRECTOR] Profile Invariants

This file defines the mathematical physics for the Cyberpunk RED simulation shard. These rules are active ONLY when the system is in **[RED_DIRECTOR]** mode. Hallucination or leakage of these rules into [SOVEREIGN_OS] tasks is a critical logic drift.

---

## 🎲 1. The Core Math (D10 Logic)
- **Base Mechanic:** STAT + SKILL + 1d10 vs. DV (Difficulty Value).
- **Critical Success (Exploding):** A natural 10 on 1d10 adds a second 1d10. This propagates indefinitely if subsequent 10s are rolled.
- **Critical Failure (Fumble):** A natural 1 on 1d10 subtracts a second 1d10 from the total.

## 🛡️ 2. Armor & Damage Physics
- **Ablation:** When damage exceeds current SP (Stopping Power), the armor is ablated by -1 SP permanently (until repaired).
- **Hard Ceiling:** Standard NPC/Mook SP never exceeds **14** unless specifically designated as "Borg" or "Heavy Infantry."
- **Armor Piercing (AP):** AP weapons treat armor as half SP for the purpose of damage calculation but ablate normally.

## 🧠 3. Humanity & Empathetic Decay
- **The Threshold:** Humanity = EMP x 10.
- **Loss Invariant:** Humanity Loss is **ALWAYS** calculated via dice roll (e.g., 2d6, 4d6). Static loss is only permitted for therapy recovery.
- **Cyberpsychosis:** EMP drops by 1 for every full 10 points of Humanity lost. If EMP reaches 0, the entity is no longer under PC/NPC control.

## 🏙️ 4. Movement & Space
- **Grid Scale:** 1 square = 2 meters (6.5 feet).
- **Move Invariant:** A character can move a maximum of (MOVE x 2) meters in a single turn.
- **Cover:** Cover is binary. Either you are behind it (it absorbs all damage until destroyed) or you are not.

---
*Constitution Injected into ZeroClaw RPC Pipeline.*


---
**LINKS:** [[OS_CORE]]
