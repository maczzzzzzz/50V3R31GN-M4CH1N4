# Research Report: Phase 11 — The Neural Uplink (CDP Integration)
**Date:** April 2, 2026
**Subject:** Chrome DevTools Protocol (CDP) for Electron standalone automation
**Status:** 🟢 RESEARCH VERIFIED

## 1. Executive Summary
Traditional "Mesh" modules are limited by the security sandbox of the Foundry VTT application. To achieve true "God-Mode" and "Eyes-On" parity, we must bypass the application layer and interact with the **Chromium Renderer** via the **Chrome DevTools Protocol (CDP)**. This allows for raw pixel perception, real-time CSS injection, and direct DOM manipulation without refreshing the world.

## 2. Technical Findings: The CDP Advantage

### 2.1 Hardware-Level Perception
- **Current Limitation:** Project Eyes-On relies on Playwright to "impersonate" a user to take screenshots.
- **CDP Solution:** `Page.captureScreenshot` allows Node B to pull the raw GPU rendering buffer of the active Electron window.
- **Impact:** 1:1 visual grounding. The AI "sees" exactly what the GM sees, including 3D dice animations and active lighting shaders.

### 2.2 Direct UI Manipulation
- **Current Limitation:** Mesh commands must be pre-coded in `foundry-api-bridge.js`.
- **CDP Solution:** `Runtime.evaluate` can execute arbitrary JavaScript in the context of the Foundry window, bypassing internal security barriers.
- **Impact:** The AI can autonomously toggle module settings, fix UI glitches, or navigate compendiums without explicit bridge implementation.

### 2.3 Dynamic Stylistic "Glitches"
- **CDP Feature:** `CSS.addRule` and `CSS.setStyleText`.
- **Impact:** Allows the AI GM to physically "Glitch" the player's UI in response to narrative events (e.g. Netrunner attacks, Cyberpsychosis onset) without a page reload.

## 3. Implementation Requirements
- **Flag:** Foundry must be launched with `--remote-debugging-port=9222`.
- **Connection:** Node B utilizes the `chrome-devtools-mcp` extension to maintain the Neural Uplink.
- **Safety:** The debugging port must be bound to `127.0.0.1` to prevent unauthorized remote access.

## 4. Conclusion
The Neural Uplink is the "Final Layer" of TRPG immersion. It enables the AI to transition from a chat assistant to the **Operating System of the Game.**


---
**LINKS:** [[OS_CORE]]
