# :/U53R-6U1D3 : 7H3-0B51D14N-V4UL7 //
**Subject:** Steganographic Document Encryption & Synapse Palace
**Version:** 3.2.6

## 1. OVERVIEW
The **Obsidian Vault** is the final layer of project security and the physicalization of the machine's memory. It serves two purposes:
1.  **Steganography:** Encrypts sensitive blueprints into noise-map PNGs.
2.  **Synapse Palace:** Generates a 3D Relational Knowledge Graph (RKG) from the `Akashik.db`.

---

## 2. :/537-UP //

### 2.1 The Master Key
The vault requires a 256-bit key for AES-GCM encryption. 
1.  Open your local `.env` file.
2.  Add: `SOVEREIGN_KEY=your-complex-secret-password`

⚠️ **CRITICAL WARNING:** Avoid using the dollar sign (`$`) in your key if you plan to export it via shell commands (e.g., `export $(cat .env)`). The shell will attempt to expand it as a variable, mangling your key and making decryption impossible.

### 2.2 Windows Mirroring
To bypass WSL filesystem limitations, the RKG is mirrored to your native Windows drive.
- **Default Path:** `D:\Obsidian_RKG`
- **WSL Path:** `data/vault/RKG/`

---

## 3. :/0P3R4710N5 //

### 3.1 Sealing the Vault
`./crush-cli vault seal <directory_path>`
*Encodes markdown into PNG shards and nukes cleartext.*

### 3.2 Opening the Vault
`./crush-cli vault open <directory_path>`
*Restores documentation for active development sessions.*

### 3.3 Legacy Recovery
If you encounter "Authentication Failed" errors on older archives (Pre-Phase 30), use the recovery suite:
```bash
nix develop --impure --command go run scripts/recovery/bulk_recovery.go <path>
```

---

## 4. :/RK6-M3M0RY-P4L4C3 //
The **RKG** is your direct window into the AI's world-state.

### 4.1 Reconstructing the Palace
If the vault structure becomes desynced or flat, trigger a full semantic reconstruction:
```bash
npm run reconstruct
```

---
**::/5Y573M-N071C3 : L055 0F 7H3 50V3R31GN_K3Y R3ND3R5 4LL BLU3PR1N75 UNAV41L4BL3 // 50V3R31GN-M4CH1N4**
