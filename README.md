# ASP-GM-AGENT v1.9.0

```text
 █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
 █  █████╗ ███████╗██████╗      ██████╗ ███╗   ███╗           █
 █  ██╔══██╗██╔════╝██╔══██╗    ██╔════╝ ████╗ ████║          █
 █  ███████║███████╗██████╔╝    ██║  ███╗██╔████╔██║          █
 █  ██╔══██║╚════██║██╔═══╝     ██║   ██║██║╚██╔╝██║          █
 █  ██║  ██║███████║██║         ╚██████╔╝██║ ╚═╝ ██║          █
 █  ╚═╝  ╚═╝╚══════╝╚═╝          ╚═════╝ ╚═╝     ╚═╝          █
 █                                                            █
 █  SYSTEM STATUS: SOVEREIGN HIGHWAY ACTIVE // v1.9.0         █
 █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█

 █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
 █  01 // SYSTEM TOPOLOGY                                     █
 █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█

 [ NODE B: THE DIRECTOR ]           [ NODE A: THE KERNEL ]
 ------------------------           ----------------------
 > NixOS on WSL 2 (Native)          > Linux / Nix Native
 > Mistral-Nemo (12B)               > Open-Reasoner-1.5B
 > RDNA 4 (AMD) // Vulkan           > GTX 1050 Ti // CUDA
 > Narrative Orchestrator           > Mechanical Rules Judge

           ||                          ||
           ╚════════════════════════════╝
               [ VSB SOVEREIGN HIGHWAY ]
               Binary UDP (Cross-Machine)
               Shared Memory Mmap (Local)

 █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
 █  02 // CORE TECHNOLOGY                                     █
 █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█

 [ TRANSPORT ] : VSB HIGHWAY
 Sub-1ms state synchronization via raw C-style binary UDP. 
 Dedicated physical threads watch the bus for zero-latency.

 [ INFERENCE ] : NATIVE LLAMA-SERVER
 Ollama overhead eliminated. Native llama.cpp binaries 
 with residency enforced via --mlock and hardware pins.

 [ SENSORY ]   : OPTICAL BRIDGE
 Falcon-0.3B perception extracts physical facts from 
 Foundry VTT pixels via raw CDP visual capture.

 [ VISUALS ]   : LAYOUT SOVEREIGNTY
 Pretext engine renders narrative overlays at 60fps
 directly to detached PIXI.js canvas. Zero reflows.

 [ STEGO ]     : ST3GG & ROOTS
 Physical wall coordinates and metadata embedded 
 directly into asset pixels using LSB Steganography.

 █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
 █  03 // DECK IGNITION (QUICK START)                         █
 █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█

 1. Jack into the internal NixOS filesystem:
    $ cd /home/nixos/asp-gm-agent

 2. Synchronize hardware environment:
    [Node B] $ nix develop
    [Node A] $ nix develop .#cuda

 3. Boot the Orchestrator:
    $ pnpm start

 █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
 █  04 // NETWORK NODES (ACKNOWLEDGMENTS)                     █
 █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█

 * Elder Plinius : Roots, Glossopetrae, ST3GG, AutoStoryGen.
 * Charmbracelet : Terminal UI via lipgloss & bubbletea.
 * llama.cpp     : The foundation of our native inference.
 * Foundry VTT   : The physical medium we inhabit.

 --------------------------------------------------------------
 Cyberpunk RED is a trademark of R. Talsorian Games. 
 This project is an independent architectural toolset.
 --------------------------------------------------------------
```
