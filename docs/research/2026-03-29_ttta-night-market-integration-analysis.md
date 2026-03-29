# Deep Research Analysis: TTTA Night Market UI Integration
**Date:** Sunday, March 29, 2026
**Subject:** Dynamic In-Engine Storefronts & The Eagle Economy

## 1. Executive Summary
The proposed integration shifts the "Ticket To The Afterlife" (TTTA) Night Market from a static table roll into a dynamic, interactive storefront within Foundry VTT. By adapting the `cpr-night-market.js` macro and utilizing the "Inventory Grid" UI (Example 3), the Orchestrator (Node B) can generate tactile, vendor-specific shopping experiences.

## 2. UI/UX Mapping (Foundry VTT v12)
Based on the provided mockups, the target UI is a pop-out HTML Dialog containing categorized "Stalls".

### 2.1 The "Vendor Stall" Concept
Instead of a single chaotic list, the macro must group inventory by the canonical Afterlife vendors:
*   **Mr. Connors:** Weapons, Armor, and Ammunition.
*   **Miss Piercing:** Cyberware, Electronics, and Crafting Materials.
*   **Madame Garcia:** Survival Gear, Vehicles, Clothing, and Lifestyle items.

### 2.2 Interactive Elements
*   **Dual Pricing:** Every item card must display its cost in both **Eurobucks (eb)** and **Eagles**.
*   **Buy Button:** A localized button that, when clicked, triggers a validation request to Node B.

## 3. The "Eagle" Economy Conversion Logic
The primary technical hurdle is translating standard Cyberpunk RED Eurobuck costs into the TTTA "Eagle" currency. The macro must be extended with a translation layer.

### 3.1 Conversion Rates (Per TTTA Journal)
*   **Low Tier (≤ 100eb):** 1 Eagle = 200eb credit. (Effectively a "2-for-1" deal).
*   **Mid Tier (~500eb):** 2-4 Eagles.
*   **High Tier (~1000eb):** 6-9 Eagles.
*   **Luxury/Super Luxury:** 10+ / 20+ Eagles.

### 3.2 Proposed JavaScript Hook (Macro Extension)
```javascript
/**
 * TTTA Eagle Conversion Logic (Node B Validation Hook)
 */
function getEagleCost(eurobucks) {
    if (eurobucks <= 100) return "0.5 Eagles (2-for-1)";
    if (eurobucks <= 500) return "2-4 Eagles";
    if (eurobucks <= 1000) return "6-9 Eagles";
    return "GM Discretion";
}

// UI Injection Pattern
const eaglePrice = getEagleCost(item.cost);
itemHtml += `
  <div class="item-card">
    <strong>${item.name}</strong>
    <div class="item-price-tag">
      <span class="eb-price">${item.cost}eb</span> | 
      <span class="eagle-price">${eaglePrice}</span>
    </div>
    <button class="buy-button" onclick="requestPurchase('${item.id}')">Purchase</button>
  </div>`;
```

## 4. Architectural Integration (Phase 3 & 4)

### 4.1 Zero-Trust Validation (Node A -> Node B)
When a player clicks "Purchase":
1.  **WebSocket Trigger:** The UI sends a payload to Node B: `{ action: "buy", itemId: "...", costEagles: 3 }`.
2.  **Rules Authority (Node A):** Node B asks Node A to verify the math: Does the player have enough Eagles? Do they meet the Reputation requirement for Sublevel 2?
3.  **State Execution:** If valid, Node B instructs Foundry to deduct the currency, add the item to the Actor's sheet, and log a narrative transaction via the `simple-phone` module.

### 4.2 The "Reputation Hook"
The TTTA module specifies a +1 Reputation bonus for purchasing clothing. The transaction logic must check item categories and apply temporary Foundry Active Effects or flag updates to the Actor sheet when Madame Garcia sells clothing.

## 5. Conclusion
This UI proposal perfectly aligns with the **Immersion Mandate**. It offloads the complex conversion math to the engine while providing a highly tactile experience for the players.

**Implementation Goal:** Scaffold the `FoundryAdapter` in Phase 3 to listen for these specific UI purchase events.
