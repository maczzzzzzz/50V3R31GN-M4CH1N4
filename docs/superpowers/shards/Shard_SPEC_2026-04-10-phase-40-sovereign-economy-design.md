# Phase 40: 50V3R31GN-3C0N0MY Design Spec

**Goal:** Elevate the Red Trade and Night Market systems to utilize the full potential of the Dual-Node architecture (VSB, Mmap, and 7R1_SC0R3R).

**Architecture:** 
- **Binary Bus Friction:** Moving economic rolls to Node A over Binary UDP.
- **Heat Radar HUD:** Real-time tactical Heat display in Rust with encrypted/public modes.
- **Auto-Materialization:** Architect-driven scene population for missions and markets.

---

## 1. Sovereign Friction (Node A Audit)

### 1.1 VSB Protocol Expansion
- **New Packet:** `FRICTION_INTENT` (Type `0x05`).
- **Payload:** `{ faction_id, current_heat, district_modifier }`.
- **Node A Audit:** Kernel reasoner validates the roll + modifiers against `RED_RULES.md` and RKG faction standing.

### 1.2 RedTradeService Evolution
- **Logic:** `calculateFrictionRoll` now dispatches a Binary UDP packet to Node A.
- **Persistence:** Roll results are grounded in the `world_events` table of `Akashik.db`.

---

## 2. Tactical Heat Radar (Cyberdeck HUD)

### 2.1 Shared Synapse Slots
- **Offset 3072:** `DISTRICT_HEAT` (uint8).
- **Offset 3073:** `AMBUSH_PROBABILITY` (uint8).
- **Offset 3074:** `RADAR_LOCK` (bitmask: 0x01 = Encrypted, 0x02 = Scanned).

### 2.2 Rust HUD Implementation
- **Widget:** A pulsing circular radar in the `NETRUN` or `DECK` tab.
- **Modes:**
  - **Encrypted (Default):** Displays a generic "CAUTION" warning light. Heat value is masked.
  - **Scanned:** A "Tactical Scan" action in the HUD reveals the actual Heat value and Ambush % for 60 seconds.
  - **Public (Dev Toggle):** Forced visibility of all metrics.

---

## 3. Automated Contraband Missions

### 3.1 Architect Manifests
- **Beat 1 (Fixer):** Materializes a "Dead Drop" container (`Drawing` or `Token`) at a POI coordinate retrieved from RKG.
- **Beat 2 (Transit):** If Heat Radar triggers an AMBUSH, Architect auto-spawns Hostile tokens (e.g., Tyger Claws) in a 10m radius around the player.
- **Beat 3 (Handoff):** Materializes the Buyer vendor and sets the scene lighting to "Transaction Mode" (Dim + Red).

---

## 4. Night Market Auto-Ingestion

### 4.1 Smart Vendor Loop
- **Process:** Architect materializes vendors based on `NightMarketService` inventory.
- **Baking:** Token portraits are background-baked via `ST3GG` with the inventory JSON.
- **Ingestion:** Hovering over a vendor in Foundry triggers the Phase 39 "Live Scanner" to display their specific stock and prices.

---

## 5. Dev Commands (Tactical Control)

### 5.1 Crush Commands
- `crush radar --public [on|off]`: Toggles HUD radar encryption bit.
- `crush market --spawn <vendor_name>`: Forces an Architect materialization of a specific vendor.
- `crush trade --heat <value>`: Manually injects Heat into the current district Mmap for testing.

---
*Status: Approved for Phase 40 Implementation.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
