# ◈ RESEARCH: THE ATLAS-INTEGRATED MOBILE ARTERY
PARENT :: [[PHASE_91_SPEC]]
-----

## ◈ EXECUTIVE SUMMARY
**Mission:** Port established architectural patterns from Hermes Atlas (Specifically `hermes-android` and `llm-agents.nix`) to the Sovereign OS. Move from "Visual Observation" to "Native Android Control."

## ◈ CORE ARCHITECTURAL PRIMITIVES

### 1. Semantic Device Control (Accessibility Artery)
- **Pattern:** `AccessibilityService` (Kotlin/Android) provides the agent with a semantic tree of all on-screen elements.
- **Tools:**
    - `android_read_screen`: Dumps the accessibility node hierarchy.
    - `android_send_intent`: Directly triggers native app actions.
    - `android_keyboard_type`: Inputs text into focused fields.

### 2. Nix-Reproducible Agent Brains
- **Pattern:** Using Nix Flakes (`llm-agents.nix`) to define the agent's runtime environment (Python/Rust/TS).
- **Isolation:** Leverages `nono` for kernel-level capability gating on agent actions.
- **Deployment:** Bit-identical agent binaries shored across Node B and the Android host.

### 3. SSE-First Thought Streaming
- **Pattern:** Server-Sent Events (SSE) for low-latency log and thought ingress into the HUD.
- **Benefit:** Reduces the complexity of the WebSocket handshake for "Watch-Only" HUD clients.

---
**::/5Y573M-N071C3 : ATLAS_RESEARCH_V1. // 50V3R31GN-M4CH1N4**
