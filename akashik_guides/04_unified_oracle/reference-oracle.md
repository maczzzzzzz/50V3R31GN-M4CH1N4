# User Guide: The Unified Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle (Akashik Record)

**Version:** 3.2.6
**Role:** Universal Synapse and Atomic Persistence

---

## 📜 What is the Akashik Record?
The **Akashik Record** (`Akashik.db`) is the universal "Truth" for your Cyberpunk RED session. It provides a structured, searchable memory for every action, NPC, and world-state shift.

### 📜 What it Stores:
- **Vision History**: Hashes of every tactical state captured by the Neural Uplink.
- **Lore Triplets**: Structured facts (Subject-Predicate-Object) for RAG extraction.
- **Actor Metadata**: Every NPC, their stats, and their relationship status.
- **District Grid**: The physical map of faction influence.
- **Asset Index**: Registry of all ingested maps, tiles, and tokens.

---

## 🛡️ Atomic Integrity (The Flush Gate)
To prevent world-state drift, every update to the Akashik Record passes through the **Flush Gate**. This ensures that multiple concurrent updates (from the Swarm or Pulse Engine) are committed in an atomic, deadlock-free transaction.

---

## 🛠️ Searching the Record
The AI uses **RulesGrep** to surgically extract facts from the record during mission generation. You can query the history directly via the Crush CLI or the **`rkg_schema`** MCP resource.

---
*Akashik Synapse: The Permanent Record is Locked.*
