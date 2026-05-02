# 💹 MECHANICS: THE PULSE ENGINE & RED TRADE

**::VERSION_STAMP : 3.8.7**
**::ROLE : FACTION_PROPAGATION_AND_MARKET_VOLATILITY**

---

## ⚡ THE PULSE ENGINE
The **Pulse Engine** is the kinetic heart of the Night City simulation. It is the mechanism that ensures the world is never static. Every `/pulse` execution forces the mesh to recalculate the state of the Time of the Red.

### ◈ THE RECKONING SEQUENCE
When a Pulse is triggered, the engine executes the following logic:
- **FACTION_DECAY**: Faction influence propagates through the **District Grid** using recursive Chebyshev decay. Power does not just vanish; it bleeds into neighboring sectors.
- **ECONOMIC_FLUX**: Market prices in the **Red Market** are recalculated. Security levels and narrative "lore events" drive the volatility.
- **SOCIAL_FRICTION**: The **Akashik.db** is updated to reflect the new state of faction relationships based on mission outcomes and entity terminations.

---

## 📊 THE RED TRADE SYSTEM
Economic sovereignty is achieved through the **Red Trade** module. This is a dynamic pricing engine that rewards risk and punishes stability.

### ◈ MARKET DYNAMICS
- **INSECURE_ZONES**: High availability of "hot" goods at reduced prices, with a corresponding increase in acquisition friction.
- **CORPORATE_ENCLAVES**: Premium prices for stabilized, high-fidelity equipment.

### ◈ OPERATIONAL COMMANDS
- `/buy <item_id>`: Executes a transactional materialization within the simulation.
- `npm run forge:master`: Synchronizes the global market catalog with newly forged cognitive shards.

---
*RED_TRADE: ECONOMIC_SOVEREIGNTY_ONLINE.*

---
**::/5Y573M-N071C3 : PULSE_SHORED. THE_MARKET_NEVER_SLEEPS. // 50V3R31GN-M4CH1N4**
