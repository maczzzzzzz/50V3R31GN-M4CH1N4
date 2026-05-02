# Phase 114.5 Functional Lockdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock down functional arteries and aesthetic parity for the NODESTADT HUD and Artery system.

**Architecture:** 
- Relocate Terminal App navigation to the bottom for space optimization.
- Repair Voice Artery by aligning with BasedHardware/OMI protocol.
- Extend Settings to manage dynamic node IP/Ports and SPIFFE/mTLS toggles.
- Implement Task Reminders via NotificationService and manual Synapse management.
- Refactor Browser Extension to 'Glow-Terminal' aesthetic.

**Tech Stack:** Flutter, WebSocket, OMI (PCM-16), HTML/CSS/JS.

---

### Task 1: Terminal App Navigation Relocation

**Files:**
- Modify: `terminal-app/lib/screens/pretext_dashboard.dart`

- [ ] **Step 1: Remove SideRail and implement BottomNavigationBar**
Refactor the `Scaffold` body to remove the `Row` containing `_buildClinicalSideRail`. Implement `bottomNavigationBar` using the official Nodestadt palette.

```dart
// lib/screens/pretext_dashboard.dart
// Update Scaffold
bottomNavigationBar: Container(
  decoration: const BoxDecoration(
    border: Border(top: BorderSide(color: Color(0xFF333333))),
    color: Color(0xFF0F0F0F),
  ),
  child: BottomNavigationBar(
    currentIndex: _currentIndex,
    onTap: _onTabTapped,
    backgroundColor: Colors.transparent,
    type: BottomNavigationBarType.fixed,
    selectedItemColor: const Color(0xFFF36622),
    unselectedItemColor: const Color(0xFF404040),
    selectedFontSize: 8,
    unselectedFontSize: 8,
    items: _navItems.map((item) => BottomNavigationBarItem(
      icon: Icon(item['icon'], size: 20),
      label: item['label'],
    )).toList(),
  ),
),
```

- [ ] **Step 2: Verify Layout**
Ensure `PageView` now occupies the full width.

---

### Task 2: Voice Artery (OMI) Repair

**Files:**
- Modify: `terminal-app/lib/services/artery_client.dart`
- Modify: `terminal-app/lib/screens/pretext_dashboard.dart`

- [ ] **Step 1: Update Handshake for OMI v1 Compatibility**
Modify the handshake payload to include `version` and `audio_format`.

```dart
// lib/services/artery_client.dart
final handshake = jsonEncode({
  "type": "handshake",
  "version": "1.0",
  "session_id": _uuid.v4(),
  "sample_rate": 16000,
  "audio_format": "pcm16",
  "uid": "SOVEREIGN_HUD"
});
```

- [ ] **Step 2: Implement Buffered PCM Streaming**
Ensure audio chunks are sent only when the channel is ready.

---

### Task 3: Extended Settings Suite

**Files:**
- Modify: `terminal-app/lib/screens/settings_screen.dart`
- Modify: `terminal-app/lib/services/artery_client.dart`

- [ ] **Step 1: Add Node D and Observer Fields to Settings**
Include text controllers and persistent storage for `VISION_URL` and `NODE_D_URL`.

- [ ] **Step 2: Implement "Secure Tunnel" Toggle logic**
Update `ArteryClient` to respect the `secure_tunnel` preference for `wss://` vs `ws://`.

---

### Task 4: Task Reminders & Notifications

**Files:**
- Modify: `terminal-app/lib/models/task.dart`
- Modify: `terminal-app/lib/services/task_service.dart`
- Modify: `terminal-app/lib/screens/tasks_screen.dart`

- [ ] **Step 1: Add `reminderTime` to Task model**
- [ ] **Step 2: Implement `DatePicker` and `TimePicker` in `tasks_screen.dart`**
- [ ] **Step 3: Call `NotificationService.scheduleNotification` in `TaskService.addTask`**

---

### Task 5: Synapse Management CRUD

**Files:**
- Modify: `terminal-app/lib/screens/memory_screen.dart`
- Modify: `terminal-app/lib/services/memory_provider.dart`

- [ ] **Step 1: Add "Add Synapse" modal to UI**
- [ ] **Step 2: Add "Delete" swipe action or button to GeometricShard in Synapse View**

---

### Task 6: Browser Extension Aesthetic Refactor

**Files:**
- Modify: `sidecars/sidecar-browser-extension/popup/popup.html`
- Modify: `sidecars/sidecar-browser-extension/popup/popup.js`

- [ ] **Step 1: Implement "Glow-Terminal" HTML/CSS**
Apply Authority Charcoal (#1A1A1A) and Machina Rust (#F36622) styling.

- [ ] **Step 2: Add Ticker Telemetry Stream to JS**
Update `popup.js` to append JSON pulses to a scrolling log container.

---

### Task 7: Documentation Shards

**Files:**
- Create: `docs/nodestadt/sidecars/sidecar-obsidian-plugin.md`
- Modify: `docs/nodestadt/capabilities/browser-ingress.md`

- [ ] **Step 1: Document Obsidian Plugin Install (Manual Load)**
- [ ] **Step 2: Update Extension Ingress with Vivaldi Side-load instructions**

---
**::/5Y573M-N071C3 : PLAN_LOCKED. THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4**
