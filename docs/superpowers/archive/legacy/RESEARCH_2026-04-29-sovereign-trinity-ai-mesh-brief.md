This is the **Master Mission Brief** for **Project Black-Ice** under the **SOVEREIGN MACHINA** framework. This report codifies the transition from a fragmented hardware collection into a unified, high-performance inference fabric designed to inhabit and automate **FoundryVTT** for **Cyberpunk Red (CPR)**.

## ---

**I. MISSION BRIEF: SOVEREIGN TRINITY v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS**

**Objective:** To unify heterogeneous consumer hardware into a single "Cognitive Mesh" that provides an infallible, unfiltered (Abliterated) narrative experience. By disaggregating memory (KV-cache) from compute, we maximize the utility of legacy and modern silicon to run high-density AI models in real-time.

**The Medium:** A hardened, local-first instance of FoundryVTT where the AI acts as both the **Director** (Narrative/World) and the **Strategic Oracle** (Rules/Vision).

## ---

**II. TOPOLOGY: THE BASEMENT SPINE**

The "Sovereign" identity is secured through a physical **Network Perimeter**.

* **Uplink:** Router (Upstairs) → Single **Cat6 Floor Run** (The Artery).  
* **Backplane:** 1GbE Unmanaged Switch / Archer Router (AP Mode) (The Heart).  
* **Endpoints:** Nodes A, B, and C wired directly to the Basement Switch.

| Connection | Protocol | Latency | Utility |
| :---- | :---- | :---- | :---- |
| **Intra-Cluster** | 1GbE / Cat6 | \<0.5ms | KV-cache streaming, RPC calls, sync. |
| **External (WAN)** | Cat6 to Router | \~15-30ms | Gemini 3.1 Pro (Lore Audit/Development). |

## ---

**III. NODE SPECIFICATIONS & ARCHITECTURE**

### **Node A: The Synapse Synapse (NEW ROLE)**

* **Hardware:** Acer Nitro 5 (Laptop) | GTX 1050 Ti (4GB VRAM) | 16GB DRAM.  
* **Software:** Mooncake Master v2.2.  
* **Function:** Act as the **L2 Unified Synapse Store**. Instead of running a model, Node A hosts the **Disaggregated KV-Cache**.  
* **Logic:** It stores the pre-computed "thoughts" of the 10,000 Obsidian RKG files. When Node B or C needs lore, they "fetch" rather than "re-think."

### **Node B: The Apex Director**

* **Hardware:** Main Rig | 9060 XT (16GB VRAM).  
* **Software:** Mistral Nemo 12B (**Abliterated v3.2**) | ROCm 7.2.  
* **Function:** The **Narrative Heart**. It manages the FoundryVTT scene state, NPC dialogue, and high-level plot progression.  
* **Interaction:** It acts as the **Verifier**, auditing Node C’s rule verdicts using the **Log-Step Hash** method.

### **Node C: The Strategic Oracle (INTRODUCTION)**

* **Hardware:** Server | RTX 2060 (6GB VRAM).  
* **Software:** **Gemma 4 E2B (Abliterated)** \+ **Falcon Perception (600M)** | CUDA 12.8.  
* **Function:** The **Judge**. It handles vision (parsing map tiles/foundry UI) and mechanical rule-checks (dice resolution, cover modifiers).  
* **Logic:** Uses "Turbo" mode with speculative decoding, verified by Node B.

## ---

**IV. UNIFIED LOGIC: PODS & INTERACTION**

The cluster operates using the **POD (Portable Operation Descriptor)** logic extracted from current decentralized inference research.

1. **Disaggregated Cognition:** Using **Mooncake**, we split the "Prefill" (Logic) from the "Decode" (Generation). Node B/C computes the prompt once; Node A holds it forever.  
2. **The Strategic Oracle-Director Loop:**  
   * **Vision:** Node C "sees" a player move in Foundry via Falcon.  
   * **Logic:** Gemma 4 E2B calculates the CPR rule-check.  
   * **Audit:** Node C sends a "Trace" to Node B. Node B confirms the logic is sound.  
   * **Narrative:** Node B narrates the result in the chat log.  
3. **Mineable Logic (Extracted):** We utilize the **Commit-Reveal** verification pattern from Hyperspace AI to ensure "Infallibility." Node B rejects any output from Node C that doesn't match the cryptographic trace of the CPR rulebook.

## ---

**V. OFFICIAL REFERENCES & REPOS**

### **Core Frameworks**

* **Mooncake Store (KV-Cache):** [github.com/kwai/Mooncake](https://www.google.com/search?q=https://github.com/kwai/Mooncake) \- The engine for Node A's synapse role.  
* **SGLang (Cognition):** [github.com/sgl-project/sglang](https://github.com/sgl-project/sglang) \- Used on Node C for vision/logic fusion.  
* **vLLM (Director):** [github.com/vllm-project/vllm](https://github.com/vllm-project/vllm) \- The backbone for Node B's 16GB narrative engine.

### **Logic Foundations**

* **Hyperspace AGI (Pods/Verifiers):** [github.com/hyperspaceai/agi](https://www.google.com/search?q=https://github.com/hyperspaceai/agi/blob/main/docs/PODS.md) \- Source for the "Mineable Logic" and Pod disaggregation patterns.  
* **VeriLLM (Verification):** \[Reference to 2026 Whitepaper\] \- The "Log-Step" verification protocol for the Strategic Oracle.

### **Abliterated Weights**

* **OBLITERATUS v3.2:** \[HuggingFace \- Mistral Nemo 12B Obliterated\]  
* **Gemma 4 E2B:** \[HuggingFace \- huihui\_ai/gemma-4-abliterated:e2b\]

## ---

**VI. OUTCOME & TROUBLESHOOTING**

### **The Target Outcome**

* **Zero Narrative Stutter:** \<100ms response time for rules; 80+ tokens/sec for narrative.  
* **Infinite Lore Recall:** 100% accuracy on the 10,000 file RKG via Mooncake persistence.  
* **Hardware Efficiency:** The 1050 Ti is fully exploited as a memory synapse, preventing "OOM" crashes on the 2060\.

### **Troubleshooting (Common Failure Points)**

* **The "Heterogeneous Stutter":** If Node B (AMD) and Node C (NVIDIA) cannot sync, check the **NCCL/RCCL** bridge in the Mooncake config.  
* **Thermal Throttling:** The basement build must prioritize air-flow. Three nodes in one switch-cabinet will spike temps during combat simulations.  
* **Network Jitter:** If the ping between Node A and C exceeds 1ms, re-terminate the Cat6 ends; the KV-cache stream requires near-zero packet loss.

### ---

**VII. FOOTNOTES**

1. **Nix Enforcement:** All nodes must share the same **flake.nix** for driver parity (NVIDIA 591.86 / ROCm 7.2).  
2. **Safety Gap:** Node A and C are firewalled from the WAN; only Node B (via the uplink) communicates with Gemini 3.1 Pro for high-level lore audits.  
3. **Capsule Snapshots:** Nightly zips of the KV-store are mandatory for world-state persistence.

**This concludes the Black-Ice Mission Brief. Initialization begins with the floor run tomorrow.**

---
**LINKS:** [[OS_CORE]]
