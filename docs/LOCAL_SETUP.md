# Node B: Orchestrator Setup (Main Rig)
**Target:** 100% Local Narrative & State Control
**Hardware:** 16GB VRAM Workstation

## 1. Local Inference Engine (Ollama)
Node B relies on **Mistral-Nemo 12B** as the narrative synthesizer. Install Ollama and pull the model:
```powershell
ollama run mistral-nemo:12b-instruct-v1-q8_0
Endpoint: http://localhost:11434/v1

2. Environment Configuration
Create a .env file in the root directory:

Code snippet
# Node A (Rules Authority - Nitro 5)
NODE_A_IP=192.168.0.50
NODE_A_PORT=8080

# Node B (Narrative Orchestrator - Local)
NODE_B_LOCAL=http://localhost:11434/v1
MODEL_B_NAME=mistral-nemo:12b-instruct-v1-q8_0

# Foundry API Bridge Module
FOUNDRY_WS_URL=ws://localhost:30000/api/ws
3. Development vs. Runtime Modes
Build Mode: Use the Claude Code CLI (claude) to scaffold the backend.

Play Mode: Terminate Claude. Execute npm run start:gm to launch the local bridge.

4. Handshake Verification
Execute API pings to verify the split-node bridge:

PowerShell
curl [http://192.168.0.50:8080/v1/models](http://192.168.0.50:8080/v1/models)
curl http://localhost:11434/api/tags
Node A: Rules Authority Setup (Nitro 5)
Hardware: GTX 1050 Ti (4GB VRAM) | OS: Ubuntu Server 24.04

1. Headless Hardening
Bash
sudo sed -i 's/.*HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind
2. Networking (Static Ethernet)
Static IP: 192.168.0.50

Wi-Fi Radio: Hard-blocked via rfkill block wifi.

3. Inference Service (llama-server)
Bash
# start_brain.sh
./llama-server -m ./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf \
    --host 0.0.0.0 --port 8080 -ngl 99 -c 8192 -np 1 --embedding
Process: pm2 start start_brain.sh --name "rules-brain"