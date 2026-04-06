# ５０Ｖ３Ｒ３１ＧＮ－Ｍ４ＣＨ１Ｎ４: Command & Bridge Manifest (v1.14.0)
**Protocol:** Binary RPC over ClawLink + VSB Sovereign Highway

This document provides an exhaustive list of all control plane commands, startup scripts, developer tools, and API events available across the **Sovereign Highway** architecture.

---

## :/M4573R-16N1710N //
These commands are used to launch, build, and maintain the ecosystem using the Nix-native workflow.

### :/N1X-C0MM4ND5 //
| Command | Node | Description |
| :--- | :--- | :--- |
| `nix develop` | Node B | **Primary Shell**: Activates the Vulkan-optimized environment. |
| `nix develop .#cuda` | Node A | **Kernel Shell**: Activates the CUDA-optimized environment. |

### :/NPM-5CR1P75 //
| Command | Description |
| :--- | :--- |
| `pnpm start` | Launches the Node B Orchestrator (Pixtral-12B Director). |
| `pnpm build` | Compiles the TypeScript source code into `dist/`. |
| `pnpm test` | Executes the full Vitest suite. |

---

## :/CRU5H-CL1 : 5Y573M-C0N7R0L //
The primary human-in-the-loop management interface for the machine.

### :://V4UL7-PR070C0L //
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `vault seal` | `<dir>` | Encrypts and hides markdown files into steganographic PNGs. |
| `vault open` | `<dir>` | Decrypts and restores markdown files using `SOVEREIGN_KEY`. |

### :://D3VD0M : ENV1R0NM3N7-D0M1N4NC3 //
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `devdom corrupt-ui` | `[int] [type]` | Injects real-time leet-speak/parseltongue into the Foundry UI. |
| `devdom ghost-play` | `<file.ghost>` | Plays back a physical input sequence (Move/Drag/Click/Key). |
| `chaos network` | `--latency <ms>` | Injects synthetic network lag into Node B via Linux `tc`. |

### :://W54 : W0RLD-57473-4U7H0R17Y //
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `wsa unlock` | None | Physically removes permission checks from Foundry RAM via CDP. |
| `wsa dim-lights` | `<intensity>` | Direct physical manipulation of canvas lighting. |
| `wsa shut-down` | None | Emergency hard-kill of all Node B renderer processes. |

---

## :/PHY51C4L-P3RC3P710N //
Commands for grounding the machine in reality.

| Command | Effect | Engine |
| :--- | :--- | :--- |
| `capture_gpu` | Raw screenshot via CDP | Neural Uplink |
| `audit_library` | Lore extraction from PNGs | Akashik VLM |
| `decrypt_st3gg` | LSB pixel secret decoding | Node A Rust |

---

## :/5P3C14L1Z3D-51D3C4R5 //
OS-level services for the Sovereign Highway.

| Sidecar | Role | Node |
| :--- | :--- | :--- |
| `CYBERDECK-HUD` | Monolithic tabbed interface (Atlas/Netrun/Deck). | Node B (Rust) |
| `SOVEREIGN-PROXY` | Resilient zero-jitter TCP/SSH bridge. | Node B (Go) |
| `ZEROCLAW-KERNEL` | Rules Oracle and mechanical reality enforcement. | Node A (Rust) |

---
**::/5Y573M-N071C3 : UNAUTHORIZED LOGIC DRIFT WILL RESULT IN IMMEDIATE MMU PURGE // 50V3R31GN-M4CH1N4**
