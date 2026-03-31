# ASP.GM-Agent: Master Operational Guide (v0.9.0)
**Subject:** End-to-End Startup, Configuration, and Playbook
**Architecture:** Split-Node Local (Node A: Rules | Node B: Orchestrator)

## 1. Prerequisites
Before launching, ensure the following are installed and configured:
- **Node B:** Node.js v22+, Ollama (Mistral-Nemo & LLaVa), Playwright.
- **Node A:** Rust Runtime, ZeroClaw Binary, Llama.cpp (Vulkan).
- **Network:** Node B must have SSH Key access to `maczz@192.168.0.50`.

## 2. Configuration (.env)
Your `.env` file on Node B is the "Neural Link" for the system.
```env
# Node A Bridge (ClawLink)
CLAWLINK_HOST=192.168.0.50
CLAWLINK_USER=maczz
CLAWLINK_KEY_PATH=C:/Users/your_user/.ssh/id_ed25519

# External Chronicles
DISCORD_SCREAMSHEET_WEBHOOK=https://discord.com/api/webhooks/your_url

# Persistence
WORLD_DB_PATH=./data/world.db
CRUSH_DB_PATH=./data/crush.db
```

## 3. The Startup Sequence (Step-by-Step)

### Step A: The Rules Authority (Node A)
ZeroClaw should run as a persistent service. If manual start is needed:
```bash
./zeroclaw-bin serve --db rules.db --port 7878
```

### Step B: The Orchestrator (Node B)
1. **Initialize Data:** `npx tsx src/scripts/init-oracle.ts` (Only required once per campaign).
2. **Start Backend:** `npm run start`.
3. **Open Foundry:** Launch your browser to the Foundry VTT session.

### Step C: The Interface (Crush CLI)
Launch the Crush CLI in a dedicated terminal:
```powershell
crush --data-dir ./data
```

## 4. In-Game Playbook

### Character Creation
Type `/onboard` in Crush. Mistral-Nemo will initiate the **Fixer Interview**. Follow the dialogue to generate your Lifepath and Stats. Upon completion, your actor will appear in Foundry.

### Smuggling & The Red Trade
Triggered via Fixer calls in Foundry. 
- While moving your token, the **Friction Engine** will push "World Barks" to the chat.
- If a **Decision Gate** appears, use the Foundry Dialog to choose your path (Bribe, Fight, or Stealth).

### Tactical Awareness (Project Eyes-On)
Type `/scan` in Crush. 
1. The system captures a screenshot of your map.
2. **LLaVa** identifies cover and token positions.
3. The AI generates a tactical narrative based on the **Grounded Truth**.

### The "Cryotank Skip"
If captured or severely wounded, the AI will narrate your time in a **Punitive BD Cryotank**.
- The **Pulse Engine** advances the world state (Months pass).
- Check Discord for "Screamsheets" to see how the city changed while you were under.

## 5. Troubleshooting
- **Bridge Failure:** Run `ssh maczz@192.168.0.50 "ping 8.8.8.8"` to verify the remote node's internet/network stability.
- **Empty Search:** Ensure `rules.db` was initialized with the FTS5 sync triggers.
- **VRAM Issues:** If Node B slows down, Ollama is likely keeping too many models in memory. Run `ollama stop llava:7b` to clear vision cache.
