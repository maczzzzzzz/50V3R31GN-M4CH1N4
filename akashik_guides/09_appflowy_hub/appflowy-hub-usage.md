# ◈ TUTORIAL: APPFLOWY CLOUD USAGE
**Version:** 3.8.0
**Aesthetic:** Gruvbox (Canonical)

## 🎯 OBJECTIVE
The **AppFlowy Hub** serves as the structured project documentation and roadmap center for the **50V3R31GN-M4CH1N4** ecosystem. It synchronizes the `IMPLEMENTATION_PLAN.md` into a visual Kanban board and relational database.

---

## 🏗️ 1. ARCHITECTURE
The Hub runs as a Nix-managed `systemd` daemon on **Node C**.

- **Server:** AppFlowy Cloud (Rust/Go)
- **Artery:** `scripts/ops/appflowy-sync.ts` (Roadmap Synchronizer)
- **Storage:** PostgreSQL (Internal) / SQLite (OS Mesh)

---

## ⚡ 2. SYNCHRONIZATION
The roadmap is automatically synchronized whenever a phase is marked complete in the markdown manifest.

**Manual Sync Command:**
```bash
nix develop -c npm run scribe
```

**What it does:**
1. Parses `IMPLEMENTATION_PLAN.md`.
2. Materializes Phases as "Kanban Cards".
3. Maps Tasks as "Block-Storage Entities".
4. Updates status based on `[x]` vs `[ ]`.

---

## 🖥️ 3. ACCESSING THE HUB
The Hub is accessible via the **AppFlowy Desktop** client connected to the Node C endpoint.

- **URL:** `http://10.0.0.30:8000` (Tailscale Secure)
- **Login:** (See `crush vault open credentials`)

---

## 🛡️ 4. DATA INTEGRITY
The Hub is **Read-Only** for the AI agents unless explicitly authorized via a `/ship` command. The `IMPLEMENTATION_PLAN.md` remains the **Single Source of Truth (SSOT)**.

---
**::/5Y573M-N071C3 : HUB_GUIDE_MATERIALIZED. THE_MAP_IS_LIVE. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[09_appflowy_hub]] | [[OS_CORE]]
