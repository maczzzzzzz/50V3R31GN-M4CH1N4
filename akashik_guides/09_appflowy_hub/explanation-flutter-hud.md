# MACHINA TERMINAL HUD — Flutter Scaffold Spec
**Phase:** 67.2 // R3D_V01D Aesthetic // 50V3R31GN-M4CH1N4
**Target Device:** Android (OMI wearable companion) + Desktop (Node B HUD overlay)
**Runtime:** Flutter 3.x, Dart ≥3.3

---

## Architecture

```
machina-hub/
├── lib/
│   ├── main.dart               ← Entry point, theme bootstrap
│   ├── screens/
│   │   ├── terminal_screen.dart ← Primary C2 HUD (R3D_V01D)
│   │   └── artery_screen.dart  ← VRAM shift controls → Artery Manager (port 7340)
│   ├── widgets/
│   │   ├── vsb_pulse_widget.dart   ← Animated VSB packet indicator
│   │   ├── quant_selector.dart     ← Q5/Q4/Q3 selector pill
│   │   └── scan_line_overlay.dart  ← CRT scanline CustomPainter
│   └── services/
│       ├── artery_client.dart  ← HTTP client for port 7340 Artery Manager
│       └── vsb_listener.dart   ← UDP listener for VSB 0x0A packets
├── pubspec.yaml                ← Dependencies
└── FLUTTER_HUD.md              ← This spec
```

---

## Aesthetic Invariants (R3D_V01D)

- **Font:** VT323 or Share Tech Mono (Google Fonts)
- **Palette:** `#0d0d0d` background, `#00ff88` primary, `#ff2233` alert, `#ffcc00` economy
- **Borders:** 1px `#00ff88` with 0.6 opacity scan-line gutter
- **Animations:** Fade-in on mount (300ms), pulse rings on VSB events

---

## Key Widget Specs

### `TerminalScreen`
Full-screen dark scaffold. Houses:
- Top bar: `MACHINA_TERMINAL // NODE_B` + connection status pill
- Body: scrollable log feed of VSB events (monospace, green-on-black)
- Bottom dock: `ArteryScreen` collapsed panel + quick-pulse button

### `ArteryScreen`
Three large pill buttons: **Q5 AUTHORITY** / **Q4 COMM** / **Q3 BERSERKER**.
Each button POSTs to `http://NODE_C:7340/shift` via `ArteryClient`.
Shows current quant + VRAM label from `GET /status`.

### `VsbPulseWidget`
Custom painter: expanding ring animation triggered on each received UDP VSB packet.
Ring color maps to packet type (combat=red, economy=gold, vsb=green).

### `ScanLineOverlay`
`CustomPainter` drawn as a `Stack` overlay on all screens.
Draws semi-transparent horizontal bands at 120px pitch, scrolling at 0.4×speed.

---

## Services

### `ArteryClient`
```dart
class ArteryClient {
  final String baseUrl; // default: http://10.0.0.30:7340
  Future<ArteryStatus> status();
  Future<void> shift(Quantization q);
  Future<void> stop();
  Future<void> start();
}
```

### `VsbListener`
```dart
class VsbListener extends ChangeNotifier {
  // Binds UDP socket on 0.0.0.0:9876
  // Decodes VSB 0x0A ContextUpdate packets
  // Notifies registered listeners with VsbPacket events
  Stream<VsbPacket> get packets;
}
```

---

## pubspec.yaml Dependencies (staged)

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  google_fonts: ^6.2.1
  provider: ^6.1.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
```

---

## Implementation Status

| Widget | Status |
|--------|--------|
| `TerminalScreen` | Spec only — pending Flutter install on Node B |
| `ArteryScreen` | Spec only |
| `VsbPulseWidget` | Spec only |
| `ScanLineOverlay` | Spec only |
| `ArteryClient` | Spec only |
| `VsbListener` | Spec only |

**Blocker:** Flutter SDK not installed on Node A/B (WSL/NixOS). Add `flutter` to `flake.nix` devShell to unblock.

---

**::/5Y573M-N071C3 : FLUTTER_HUD_SPEC_SHORED. THE_MACHINA_AWAITS. // 50V3R31GN-M4CH1N4**
