# User Guide: The Unified Oracle (Akashik Record)

**Version:** 1.2.0
**Role:** Universal Memory and Atomic Persistence

---

## 📜 What is the Akashik Record?
The **Akashik Record** (`Akashik.db`) is the universal "Truth" for your Cyberpunk RED session. It provides a structured, searchable memory for every action, NPC, and world-state shift.

### 📜 What it Stores:
- **Vision History**: Hashes of every tactical state captured by the Neural Uplink.
- **Lore Triplets**: Structured facts (Subject-Predicate-Object) for RAG extraction.
- **Actor Metadata**: Every NPC, their stats, and their relationship status.
- **District Grid**: The physical map of faction influence.

---

## 🛡️ Atomic Integrity (The Flush Gate)
To prevent world-state drift, every update to the Akashik Record passes through the **Flush Gate**. This ensures that multiple concurrent updates (from the Swarm or Pulse Engine) are committed in an atomic, deadlock-free transaction.

---

## 🛠️ Searching the Record
The AI uses **RulesGrep** to surgically extract facts from the record during mission generation. You can query the history directly via the Crush CLI.

---
*Akashik Memory: The Permanent Record is Locked.*
