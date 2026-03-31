# Node A: Rules Authority Setup & Hardening
**Target:** Acer Nitro 5 (Headless Inference Appliance)
**OS:** Ubuntu Server 24.04 LTS
**Architecture:** Project Black-Ice (Rust-Native Edge Compute)

## 1. Hardware & OS Hardening
To ensure the appliance remains active and stable as a headless server:

### Lid Management
Prevent suspension when the laptop lid is closed:
```bash
sudo sed -i 's/.*HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo sed -i 's/.*HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind
```

### Static Networking
Maintain a persistent ethernet connection at `192.168.0.50`:
1. **Disable Wi-Fi:** `sudo rfkill block wifi`
2. **Configure Netplan:** Ensure `/etc/netplan/` defines a static IP for the ethernet interface.

---

## 2. Inference Engine (llama-server)
Node A runs **Llama-3.2-3B-Instruct** via the Vulkan-optimised `llama-server`.

1. **Deployment:** Ensure `llama-server` binary and the GGUF model are present in `~/asp-gm-agent/models/`.
2. **Persistence:** Orchestrate via PM2:
   ```bash
   # start_brain.sh
   ./llama-server \
       -m ./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf \
       --host 127.0.0.1 --port 8080 \
       -ngl 99 -c 8192 -np 1 --embedding
   
   pm2 start start_brain.sh --name "rules-brain"
   pm2 save
   ```
   *Note: Binding to `127.0.0.1` ensures inference is only accessible via the ZeroClaw bridge.*

---

## 3. Rules Engine (ZeroClaw)
ZeroClaw is the Rust-native "Physics Engine" that handles mechanical math and lore RAG.

### Building the Binary
Since Node A is a production appliance, we build the binary inside a Docker container to avoid polluting the host:
```bash
# Run from Node B root:
scp -r ./zeroclaw/ maczz@192.168.0.50:~/asp-gm-agent/
ssh maczz@192.168.0.50 "cd ~/asp-gm-agent/zeroclaw && sudo docker run --rm -v \$(pwd):/usr/src/zeroclaw -w /usr/src/zeroclaw rust:1.80 cargo build --release"
ssh maczz@192.168.0.50 "cp ~/asp-gm-agent/zeroclaw/target/release/zeroclaw ~/asp-gm-agent/zeroclaw-bin"
```

### Initialising the Database
Import the 1,437 vector chunks from the JSON export:
```bash
./zeroclaw-bin import --db rules.db --file export.zeroclaw.json
```

### Persistence (ClawLink Server)
Create a systemd service to keep the bridge listener active:
```bash
# /etc/systemd/system/zeroclaw.service
[Unit]
Description=ZeroClaw Rules Authority Bridge
After=network.target

[Service]
ExecStart=/home/maczz/asp-gm-agent/zeroclaw-bin serve --db /home/maczz/asp-gm-agent/rules.db --port 7878
Restart=always
User=maczz

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now zeroclaw
```

---

## 4. Security
- **Access:** Node B connects via SSH direct-tcpip tunneling. 
- **Firewall:** Ensure port 22 is open only to Node B's IP. All other ports (8080, 7878) are bound to `localhost`.
