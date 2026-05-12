# Flutter Identity Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Flutter app colors and implement CRT scanline overlay.

**Architecture:** Use `CustomPainter` for the CRT effect and update static color constants in `AppStyles`.

**Tech Stack:** Flutter/Dart

---

### Task 1: Update AppStyles Palette

**Files:**
- Modify: `sidecars/omi-monorepo-fork/app/lib/utils/ui_guidelines.dart`

- [ ] **Step 1: Update backgroundPrimary**
- [ ] **Step 2: Update backgroundSecondary**
- [ ] **Step 3: Update accent**

```dart
// OLD
static final Color backgroundPrimary = Colors.black;
static final Color backgroundSecondary = const Color(0xFF1F1F25);
static const Color accent = Colors.blue;

// NEW
static final Color backgroundPrimary = const Color(0xFF1A282F);
static final Color backgroundSecondary = const Color(0xFF27353B);
static const Color accent = const Color(0xFF376374);
```

### Task 2: Implement CRT Overlay Widget

**Files:**
- Create: `sidecars/omi-monorepo-fork/app/lib/widgets/crt_overlay.dart`

- [ ] **Step 1: Create CRTScanlineOverlay and CRTScanlinePainter**

```dart
import 'package:flutter/material.dart';

class CRTScanlineOverlay extends StatelessWidget {
  const CRTScanlineOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: CustomPaint(
        painter: CRTScanlinePainter(),
        child: Container(),
      ),
    );
  }
}

class CRTScanlinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withOpacity(0.1)
      ..strokeWidth = 1.0;

    for (double y = 0; y < size.height; y += 4) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
```

### Task 3: Commit Changes

- [ ] **Step 1: Add and commit**
Run: `git add sidecars/omi-monorepo-fork/app/lib/utils/ui_guidelines.dart sidecars/omi-monorepo-fork/app/lib/widgets/crt_overlay.dart`
Run: `git commit -m "feat(mobile): unify Flutter app with CRT Artery identity"`
