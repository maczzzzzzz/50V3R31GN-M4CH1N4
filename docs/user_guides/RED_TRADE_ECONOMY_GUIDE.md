# User Guide: Red Trade & The Pulse Engine

**Version:** 1.2.0
**Role:** Faction Influence and Economic Real-Time Management

---

## 💹 The Pulse Engine
The **Pulse Engine** is the heart of the living city. Every time you trigger a `/pulse`, the engine advances the state of the world based on your recent actions.

### 💹 What Happens During a Pulse:
- **Faction Influence Propagation**: Faction strengths spread to neighboring cells in the **District Grid** via recursive Chebyshev decay.
- **Economic Shifts**: The **Red Market** prices fluctuate based on district security levels and recent lore events.
- **Relationship Friction**: NPC deaths or mission successes automatically update faction relationships in **`Akashik.db`**.

---

## 📊 The Red Market
The **Red Market** uses dynamic pricing. Items in insecure districts are cheaper but harder to acquire, while corporate-held zones offer premium stability at a premium price.

### 📊 Tactical Command:
Use the CLI to query market shifts:
```bash
/generate market [District]
```

---
*Red Trade: Economic Sovereignty Online.*
