# ◈ SPECIFICATION: UNIFIED COMPONENT STREAM (HEADLESS UI)
**Date:** 2026-04-26
**Subject:** JSON-Shrouded Component Protocol for Web/Mobile Parity
**Status:** DRAFT // FOR_REVIEW

---

## 1. OBJECTIVE
To decouple the **Hermes Singularity** reasoning engine from its visual representation, enabling bit-identical UI rendering across the Pretext Shroud (WebGL) and the Pretext Dashboard (Flutter CustomPaint).

---

## 2. THE TRANSPORT PROTOCOL (JSON_SHROUD)

The **Hermes Transport ABC** (Python) will emit a stream of **Atomic UI Mutations**.

### 2.1 Component Schema
Every UI element is represented as a "Shroud Component":
```json
{
  "id": "terminal_log_shard",
  "type": "CONTAINER",
  "style": {
    "border": "#3c3836",
    "bg": "#1d2021",
    "x": 0, "y": 0, "w": 100, "h": 50
  },
  "children": [
    {
      "type": "TEXT",
      "content": "::/BOOT_PROTOCOL_INITIATED",
      "style": { "color": "#b8bb26", "weight": 500 }
    }
  ],
  "metabolic": {
    "intensity": 0.85,
    "shader": "fluid_smoke"
  }
}
```

### 2.2 Artery Integration (SSE)
- **Endpoint:** `http://localhost:3015/stream`
- **Method:** Server-Sent Events (SSE).
- **Update Logic:** The stream will primarily send **Diffs**. If a child is added to a container, the transport sends only the new component and its parent ID.

---

## 3. RENDERER IMPLEMENTATIONS

### 3.1 Web (Pretext Shroud - React)
- Uses a **Pretext Component Registry**.
- Maps `CONTAINER` to a Three.js Plane with border shaders.
- Maps `TEXT` to a `PretextMeasurement` cache for zero-reflow layout.

### 3.2 Mobile (Pretext Dashboard - Flutter)
- Uses `PretextPainter.dart`.
- The painter iterates through the Shroud Component Tree and executes `Canvas.drawRect` and `Paragraph.draw` calls in a single frame.

---

## 4. SPATIAL SYNCHRONIZATION
The **Claw3D Latch** events are embedded within the Component Metadata:
- If a component has a `locus` property `(x, y, z)`, the **Neural Promenade** will fly the camera to that coordinate when the component is focused in the HUD.

---
**::/5Y573M-N071C3 : SPEC_MATERIALIZED. THE_STREAM_IS_UNIFIED. // 50V3R31GN-M4CH1N4**
