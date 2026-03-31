# Node B: Orchestrator Setup (Main Rig)
**Target:** 100% Local Narrative Synthesis & World State Control
**Architecture:** Unified Oracle (Triple-SQLite) + Mistral-Nemo 12B

## 1. Local Prerequisites
- **Node.js:** v22.0.0 or higher.
- **Ollama:** Installed and running on Node B.
- **Model:** Pull Mistral-Nemo (12B):
  ```powershell
  ollama pull mistral-nemo:12b-instruct-v1-q4_K_M
  ```

---

## 2. Repository & Dependencies
1. **Clone the project:** `git clone <repo_url>`
2. **Install core packages:** `npm install`
3. **Verify build:** `npm run build`

---

## 3. Environment Configuration
Create a `.env` file in the project root with the following variables:

### Node A Connectivity (ClawLink)
```env
CLAWLINK_HOST=192.168.0.50
CLAWLINK_USER=maczz
CLAWLINK_KEY_PATH=C:/Users/your_user/.ssh/id_ed25519
CLAWLINK_REMOTE_PORT=7878
```

### Local State (Unified Oracle)
```env
WORLD_DB_PATH=./world.db
CRUSH_DB_PATH=./.crush/crush.db
RULES_CACHE_PATH=./rules_cache.db
```

### Inference (Ollama)
```env
OLLAMA_BASE_URL=http://localhost:11434
NARRATIVE_MODEL=mistral-nemo:12b-instruct-v1-q4_K_M
EMBEDDING_MODEL=nomic-embed-text
```

---

## 4. World State Initialisation
Before running the orchestrator, you must initialise the Relational Knowledge Graph (RKG):
```powershell
# This creates world.db and sets up NPC/Location tables
npx tsx src/scripts/init-oracle.ts
```

---

## 5. Connection Verification
Verify that Node B can communicate with Node A's Rules Authority via the persistent bridge:
```powershell
# Run the bridge health check
npx tsx src/scripts/bridge-ping.ts
```
**Expected Output:** `[ClawLink] Connection established. Node A (Rules Authority) is ONLINE.`

---

## 6. Launching the GM Assistant
The project is designed to be interacted with via **Crush CLI**:
1. Start the backend: `npm run start`
2. Launch Crush: `crush --data-dir ./.crush`
3. All AI responses will be grounded in the Unified Oracle truth.
