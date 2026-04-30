# ◈ RESEARCH: PRETEXT ASCENSION BLUEPRINT
**Date:** 2026-04-26
**Subject:** Modernizing the Sovereign UI with Pretext Architecture and OMI Integrity
**Status:** AUDIT_COMPLETE // ACTION_READY

---

## 1. PRETEXT DEEP-DIVE (CHENG LOU ARCHITECTURE)

### 1.1 Architecture Analysis
Cheng Lou's Pretext architecture represents a paradigm shift from "Render-then-Measure" to "Measure-then-Render." By moving the layout engine into Userland (JS/Dart), we bypass the most expensive browser operation: synchronous reflows.

**Core Patterns:**
- **Pure Arithmetic Layout:** Bypasses `ui.Paragraph` (Flutter) or DOM (Web). Uses `Canvas.measureText` (or similar) to build a cache of glyph widths, then uses pure math to calculate line breaks. This allows for 120fps complex layouts.
- **Fluid Smoke:** A voice/thinking activity visualizer. Instead of a standard static waveform, it uses a Perlin-noise fluid simulation where "smoke" density correlates to audio amplitude and "swirl" correlates to linguistic complexity (token rate).
- **FBI Redactor:** Logic-gated UI components that monitor active window titles/process names (via host-sidecar). If a sensitive process (e.g., `Code.exe`) is detected, the "Blackout Shroud" fragment shader is applied to the component, rendering it as a redacted black bar with a "◈ REDACTED" label.
- **Variable Typographic ASCII:** A high-density rendering technique where data values are mapped to ASCII character "weights" (e.g., `.` for low, `#` for high). Used for rendering system vitality without the overhead of complex charts.

---

## 2. OMI BASE AUDIT (BASEDHARDWARE/OMI)

### 2.1 The Connection Gap
Current analysis of the `terminal-app` versus the `BasedHardware/omi` repository reveals a missing **JSON Handshake**. The OMI backend (based on FastAPI/Pusher) expects an initialization message immediately after the WebSocket upgrade.

**Missing Handshake Gate:**
```json
{
  "session_id": "UUID_HERE",
  "sample_rate": 16000,
  "channels": 1,
  "codec": "pcm16",
  "uid": "FIREBASE_UID"
}
```
Our `ArteryClient` currently initiates the stream with raw binary data without this preamble, causing the server to ignore the stream or close the connection.

### 2.2 Permissions
`PermissionService` correctly requests `Permission.microphone`, but the `record` package in Flutter requires explicit initialization before `startStream`.

---

## 3. GRUVBOX MATERIAL REFINEMENT

Standardizing the palette for system-wide parity:

### 3.1 Medium Dark (Material)
- **Background (Primary):** `#282828` (bg0)
- **Background (Secondary):** `#3c3836` (bg1)
- **Foreground (Primary):** `#fbf1c7` (fg0)
- **Foreground (Secondary):** `#ebdbb2` (fg1)
- **Red (Critical):** `#fb4934`
- **Yellow (Warning):** `#fabd2f`
- **Green (Success):** `#b8bb26`
- **Blue (Info):** `#83a598`

### 3.2 Soft Contrast
- **Background (Soft):** `#32302f` (bg0_soft)
- **Foreground (Soft):** `#ddc7a1` (fg0_soft)

---

## 4. IDENTIFIED CODE CHANGES (ACTIONABLE)

### 4.1 Fix: Mobile Terminal (Dynamic Pretext Height)
The current `PretextPainter` has a hardcoded height of 60. To fix layout clipping:
- **Location:** `terminal-app/lib/screens/pretext_screen.dart`
- **Action:** Replace `ListView.builder` height constraints with a `LayoutBuilder` that calculates height based on the `PretextLayout` arithmetic.

### 4.2 Fix: Microphone Initialization
- **Location:** `terminal-app/lib/services/artery_client.dart`
- **Action:**
    1.  Immediately after `_channel = WebSocketChannel.connect(...)`, send the JSON handshake.
    2.  Wait for a server `READY` acknowledgment before `_audioRecorder.startStream`.

### 4.3 Implement: Fluid Smoke Shader
- **Location:** `50v3r31gn-bridge/shaders/voice-smoke.frag` (To be created)
- **Logic:** Use `uTime` and `uAmplitude` (passed from `ArteryClient`) to drive a multi-octave simplex noise field.

---
**::/5Y573M-N071C3 : RESEARCH_COMPLETE. READY_FOR_ASCENSION. // 50V3R31GN-M4CH1N4**
