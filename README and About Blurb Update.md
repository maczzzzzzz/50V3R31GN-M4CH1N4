### **Project "Black-Ice" | ASP-GM-Agent: About**

ASP-GM-Agent is a high-performance, dual-node TRPG orchestration suite designed for zero-latency Cyberpunk RED sessions. By splitting the stack between a dedicated "Rules Oracle" (Node A) and a "Narrative Brain" (Node B), the system maintains a deterministic world-state while hosting Foundry VTT v12 and a 12B LLM on local consumer hardware. The architecture utilizes a full-stack SQLite migration, Rust-native execution via ZeroClaw, and the ClawLink persistent socket protocol to eliminate the infrastructure bloat of traditional "agentic" frameworks. It is a strictly local, air-gapped solution built to replace probabilistic AI guessing with deterministic database verification.

### ---

**Project "Black-Ice" | ASP-GM-Agent: README.md**

Markdown

\# ASP-GM-Agent (Project Black-Ice)

An industrial-grade, local-first Game Master orchestration suite for Cyberpunk RED. 

ASP-GM-Agent v0.6.0 moves away from traditional client-server overhead (Docker/Postgres) in favor of a **\*\*Distributed Edge-Compute\*\*** architecture. It leverages a dual-node hardware cluster to maintain sub-10ms response times and total narrative grounding.

\#\# 🏗️ System Architecture

\#\#\# Node A: The Rules Oracle (The Physics Engine)  
\* **\*\*Hardware:\*\*** Acer Nitro 5 (GTX 1050 Ti 4GB | Headless Ubuntu Server).  
\* **\*\*Engine:\*\*** **\*\*ZeroClaw\*\*** (Rust-native) running Llama-3.2-3B via Vulkan.  
\* **\*\*Storage:\*\*** SQLite-Vec (Rules-RAG & Mechanics Knowledge Base).  
\* **\*\*Role:\*\*** Acts as the deterministic judge for combat math, DV checks, and rule retrieval.

\#\#\# Node B: The Narrative Brain (The Orchestrator)  
\* **\*\*Hardware:\*\*** Main Rig (Radeon 9060 XT 16GB | Windows/WSL2).  
\* **\*\*Engine:\*\*** **\*\*Mistral-Nemo 12B\*\*** (Q4*\_K\_*M) with **\*\*FP8/Q8*\_0 KV Cache\*\* optimization.***  
***\* \*\*Hosting:\*\* Foundry VTT v12 \+ Crush CLI.***  
***\* \*\*Storage:\*\* \*\*Unified Oracle MCP\*\* (SQLite-backed Relational Knowledge Graph).***  
***\* \*\*Role:\*\* Handles prose generation, NPC dialogue, and global session state.***

***\#\# ⚡ Core Pillars***

***\#\#\# 1\. Full-Stack SQLite Migration***  
***The entire state—from the 100+ hours of \*Ticket To The Afterlife\* mission data to individual PC/NPC inventory—is stored in project-local SQLite files. This eliminates "Network Tax" and ensures that the narrative engine performs a \*\*Verification Lookup\*\* before every generated response.***

***\#\#\# 2\. The ClawLink Protocol***  
***Communication between nodes utilizes \*\*ClawLink\*\*, a persistent, authenticated socket-over-SSH bridge. This replaces the standard Stdio-over-SSH handshake, dropping tool-call latency from \~300ms to \*\*\<10ms\*\*.***

***\#\#\# 3\. The Anti-Drift Engine (RKG)***  
***To prevent "Narrative Drift," the system implements a \*\*Relational Knowledge Graph\*\* using a Triplet Schema (Subject-Predicate-Object).***  
***\* \*\*Deterministic Grounding:\*\* The AI must query the SQLite state for NPC factions, locations, and health before narrating.***  
***\* \*\*Global Inventory:\*\* Real-time tracking of every item, mook, and contraband unit in the "Red Trade" system.***

***\#\#\# 4\. VRAM Insurance***  
***Node B utilizes native ROCm acceleration and FP8 quantization for the Key-Value (KV) cache, reducing the memory footprint by \~1.2GB. This ensures a stable 60 FPS in Foundry VTT while the 12B model maintains a 32k context window.***

***\#\# 🛠️ Data Injection Layers***  
***The system is seeded with complete datasets from:***  
***\* Cyberpunk RED Core Repository (Items, Actors, Gear).***  
***\* Ticket To The Afterlife (TTTA) Mission & NPC Modules.***  
***\* Custom Lore PDFs (Parsed into semantic vector chunks on Node A).***

***\#\# 🚀 Development Status: v0.6.0***  
***\* \*\*Status:\*\* Active Migration to ZeroClaw/SQLite.***  
***\* \*\*Environment:\*\* Strictly Local / Air-Gapped.***  
***\* \*\*Interface:\*\* Integrated via Gemini CLI and Crush CLI.***  
