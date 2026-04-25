# How-To: Seamless Infiltration (Phase 39)

**Subject:** Transient Biometric Scanning & Quick Hacks
**Level:** Operational Tactical
**Version:** 3.7.0

## 1. Overview
Phase 39 transforms the machine from a passive monitor into an active infiltration engine. By simply hovering over tokens or objects in Foundry VTT, the operator receives real-time intelligence directly in the Cyberdeck HUD.

## 2. Transient Biometric Scanning
The **Infiltration Scanner** is a zero-latency overlay that populates when the mouse cursor is over a supported Foundry object.

### ◈ How to Scan
1. Open the **Cyberdeck Sidecar** and navigate to the `DECK` tab.
2. In Foundry VTT, hover your mouse over any **Token**, **Drawing**, or **Note**.
3. The HUD will instantly render the `:/1NF1L7R4710N-5C4NN3R //` window.
4. **Data Extracted:**
   - NPC Name, HP, and SP.
   - Tactical coordinates.
   - Point-of-Interest (POI) "Ghost Facts" baked into drawings.

## 3. Quick Hack Console
While a unit is hovered and scanned, the `DECK` tab populates with the **GM Sovereign Suite** of Quick Hacks.

### ◈ Available Hacks
- **`SY573M-5H0CK`**: Deals Electrical Damage.
- **`OP71C5-D15RUP7`**: Applies the Blinded status effect.
- **`5YNP471C-OV3RLOAD`**: Deals direct Humanity Damage.
- **`BR41N-W1P3`**: Resets the NPC's initiative and tactical intent.

### ◈ Adjudication
When a hack is clicked, the intent is sharded over the VSB to **Node A (The Kernel)**.
- **Normal Mode:** Node A (**Open-Reasoner-1.5B**) performs a 1d10 roll against the target's grounded stats.
- **Sovereign Mode:** If enabled (`./crush-cli sovereign-mode on`), the roll is bypassed for a guaranteed critical success.

## 4. Architect Auto-Forge
The ingestion of "Smart Assets" is now fully automated. When the **Architect** materializes tokens on a scene (via `/onboard` or narrative beats), it automatically background-bakes biometric ST3GG shards into the portraits.

**Result:** Any token placed by the machine is instantly scan-ready for the Infiltration HUD.

---
*Status: Infiltration Protocol Active. v3.7.0 Stabilized.*


---
**LINKS:** [[06_perception_systems]] | [[OS_CORE]]
