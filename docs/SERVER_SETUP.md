# Node A: Server Setup & Hardening Guide
**Target:** Acer Nitro 5 (Headless Inference Appliance)
**OS:** Ubuntu Server 24.04
**Network:** 192.168.0.50 (Static Ethernet)

## 1. Power & Lid Management
To prevent the laptop from suspending when the lid is closed:

1. **Modify Master Config:**
   ```bash
   sudo sed -i 's/.*HandleLidSwitch=.*/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
   sudo sed -i 's/.*HandleLidSwitchExternalPower=.*/HandleLidSwitchExternalPower=ignore/' /etc/systemd/logind.conf
   sudo sed -i 's/.*HandleLidSwitchDocked=.*/HandleLidSwitchDocked=ignore/' /etc/systemd/logind.conf
   ```

2. **Apply Changes:**
   ```bash
   sudo systemctl restart systemd-logind
   ```

## 2. Network Hardening (Static Ethernet)
The server must use a wired connection with a fixed IP to maintain the bridge to Node B.

1. **Install Networking Tools:**
   ```bash
   sudo apt update && sudo apt install rfkill -y
   ```

2. **Configure Static IP:**
   Edit `/etc/netplan/50-cloud-init.yaml`:
   ```yaml
   network:
     version: 2
     renderer: networkd
     ethernets:
       enp3s0f1: # Identify via 'ip a'
         dhcp4: false
         addresses: [192.168.0.50/24]
         routes: [{to: default, via: 192.168.0.1}]
         nameservers: {addresses: [8.8.8.8, 1.1.1.1]}
   ```

3. **Apply & Kill Wi-Fi:**
   ```bash
   sudo netplan apply
   sudo rfkill block wifi
   ```

## 3. Inference Service (llama-server)
The engine is orchestrated via PM2 to ensure 100% uptime.

1. **Startup Script (start_brain.sh):**
   ```bash
   #!/bin/bash
   ./llama-server \
       -m ./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf \
       --host 0.0.0.0 --port 8080 \
       -ngl 99 -c 8192 -np 1 --embedding
   ```

2. **Process Persistence:**
   ```bash
   pm2 start start_brain.sh --name "rules-brain"
   pm2 save
   pm2 startup
   ```
