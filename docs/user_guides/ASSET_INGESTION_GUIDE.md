# User Guide: Custom Map Ingestion Engine

**Version:** 1.2.0
**Role:** AI-Powered Geometric Asset Management

---

## 🏗️ The Asset Ingestion Pipeline
The **Asset Ingestion Engine** allows you to drop any raw map image (JPG, PNG, WebP) into a monitored folder and have it automatically indexed and prepared for geometric extraction.

### 🏗️ The Step-by-Step Flow:
1.  **Drop Map**: Place your map image into `data/custom_maps/unprocessed/`.
2.  **Asset Watcher**: The **AssetIndexService** instantly detects the file, hashes it for unique identity, and registers it in **`Akashik.db`**.
3.  **CV Dispatch (Node A)**: The AI dispatches a geometric analysis task to ZeroClaw on Node A to identify walls, windows, and light positions.
4.  **Neural Painter**: Once processed, you can materialize the entire geometry in Foundry with a single command.

---

## 🛠️ How to Materialize
After a map is indexed, the system will provide an `assetId`. To paint the map's geometry into your scene, use the **Architect Pass** integration in the Crush CLI.

---
*Asset Ingestion: Hardware-Level Map Perception Online.*
