# User Guide: Sovereign Asset Forge — Ingestion

**Version:** 3.2.6
**Role:** AI-Powered Geometric Asset Management

---

## 🏗️ The Asset Ingestion Pipeline
The **Sovereign Asset Forge** allows you to ingest raw maps, tokens, and legacy data into the **Akashik Oracle** for use by the Director and HUD.

### 🏗️ Canonical Sources:
1.  **Anchors**: Raw PNGs in `./assets/` (NCPD, Corporate, Vehicles, etc.) are processed with steganographic metadata.
2.  **Campaign Maps**: Original TTTA maps in `./docs/raw_data/campaign_ttta/Maps/`.
3.  **Legacy Mooks**: Actor JSONs in `./docs/raw_data/entities_mooks/`.
4.  **Generated Tiles**: AI-generated district tiles in `./data/assets/tiles/`.

---

## 🛠️ How to Ingest
To trigger a global ingestion pass and register all new assets in `Akashik.db`, execute:

```bash
npm run forge:ingest
```

### 🧠 CV Dispatch (Node A)
Once assets are indexed, the **Architect Pass** dispatches geometric analysis tasks to ZeroClaw on Node A to identify:
- **Walls & Windows**: (LOS enforcement).
- **Light Sources**: (Dynamic lighting).
- **Environment Tags**: (Narration grounding).

---

## 🎨 Materialization
To paint a registered asset into your active Foundry scene, use the **Crush CLI**:

```bash
./crush-cli forge run --ingestion-dir <dir>
```

---
*Asset Ingestion: Hardware-Level Map Perception Online.*
