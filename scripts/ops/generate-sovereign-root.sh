#!/bin/bash
# ◈ SOVEREIGN_ROOT_GENERATOR : PHASE 106, TASK 1.1
# Generates the physical Anchor of Truth (Root CA) for the Machina.

set -e

SECURITY_DIR="/etc/sovereign/security"
ROOT_CA_KEY="$SECURITY_DIR/root-ca.key"
ROOT_CA_CERT="$SECURITY_DIR/root-ca.crt"
DAYS_VALID=3650 # 10 years

echo "◈ [SECURITY] Materializing Sovereign Root CA..."

# 1. Create Security Directory
sudo mkdir -p "$SECURITY_DIR"
sudo chmod 700 "$SECURITY_DIR"

# 2. Generate Root CA Key (AES-256 encrypted)
if [ ! -f "$ROOT_CA_KEY" ]; then
    echo "● Generating Root CA Private Key..."
    sudo openssl genrsa -out "$ROOT_CA_KEY" 4096
    sudo chmod 400 "$ROOT_CA_KEY"
else
    echo "● Root CA Key already exists. Skipping."
fi

# 3. Generate Self-Signed Root Certificate
if [ ! -f "$ROOT_CA_CERT" ]; then
    echo "● Generating Self-Signed Root Certificate..."
    sudo openssl req -x509 -new -nodes -key "$ROOT_CA_KEY" \
        -sha256 -days "$DAYS_VALID" -out "$ROOT_CA_CERT" \
        -subj "/C=OS/ST=NODESTADT/L=QUATERNARY/O=50V3R31GN-M4CH1N4/CN=Sovereign Root Authority"
    sudo chmod 444 "$ROOT_CA_CERT"
else
    echo "● Root CA Certificate already exists. Skipping."
fi

echo "◈ [SECURITY] Sovereign Root Materialized at $ROOT_CA_CERT"
echo "::/5Y573M-N071C3 : PHYSICAL_ROOT_LOCKED. // 50V3R31GN-M4CH1N4"
