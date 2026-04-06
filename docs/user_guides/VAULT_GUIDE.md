# :/U53R-6U1D3 : 7H3-0B51D14N-V4UL7 //
**Subject:** Steganographic Document Encryption (Phase 32)
**Identity:** 50V3R31GN-M4CH1N4

## 1. OVERVIEW
The **Obsidian Vault** is the final layer of project security. It allows the operator to encrypt and hide all sensitive blueprints, research, and audits inside steganographic PNG "Noise Maps." To the outside world, the documentation directory appears to contain only random images.

---

## 2. :/537-UP //

### 2.1 The Master Key
The vault requires a 256-bit key for AES-GCM encryption. 
1.  Open your local `.env` file (which is git-ignored).
2.  Add the following line:
    `SOVEREIGN_KEY=your-complex-secret-password`
3.  Ensure this key is **NEVER** shared or committed.

---

## 3. :/0P3R4710N5 //

### 3.1 Sealing the Vault
To encrypt and hide a directory of markdown files:
`crush vault seal <directory_path>`

**What happens:**
1.  Every `.md` file in the directory is read.
2.  Data is encrypted using AES-256-GCM + `SOVEREIGN_KEY`.
3.  The encrypted blob is embedded into the LSBs of a generated PNG noise map.
4.  The original `.md` file is **permanently deleted**.
5.  The file now appears as `<original_name>.md.png`.

### 3.2 Opening the Vault
To restore the documentation for development:
`crush vault open <directory_path>`

**What happens:**
1.  Every `.md.png` file is scanned.
2.  The encrypted blob is extracted.
3.  Data is decrypted using the `SOVEREIGN_KEY`.
4.  The original `.md` file is restored.
5.  The PNG container is **permanently deleted**.

---

## 4. :/463N7-H4ND5H4K3 //
When starting a new session with an AI agent (Gemini or Claude):
1.  The agent will detect the sealed state (`.png` files in the plans folder).
2.  The agent will request the `SOVEREIGN_KEY` if it is not in the environment.
3.  You must provide the key and instruct the agent to **"Open the Vault"** before any development tasks can begin.

---
**::/5Y573M-N071C3 : L055 0F 7H3 50V3R31GN_K3Y R3ND3R5 4LL BLU3PR1N75 UNAV41L4BL3 // 50V3R31GN-M4CH1N4**
