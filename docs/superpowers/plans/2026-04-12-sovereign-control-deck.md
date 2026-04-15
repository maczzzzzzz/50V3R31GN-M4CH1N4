# Sovereign Control Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `deck-igniter` CLI into a high-fidelity, tabbed "Control Deck" with a purpose-driven glitch engine matching the Sovereign Triad aesthetic.

**Architecture:** Refactor the Go/Bubble Tea application into a tabbed state machine. Implement a centralized UI style library and a glitch engine that maps visual corruption to system state (errors/conflicts).

**Tech Stack:** Go, Bubble Tea, Lip Gloss.

---

### Task 1: UI Style Library & Tabbed State Machine

**Files:**
- Modify: `deck-igniter/main.go`

- [ ] **Step 1: Define Tab state and update Model**

```go
type Tab int

const (
	TabIgnition Tab = iota
	TabVisAudit
	TabTelemetry
	TabNucleus
)

// Update Model struct
type Model struct {
	components []*Component
	selected   int
	logs       []string
	width      int
	height     int
	booting    bool
	ghostMode  bool
	activeTab  Tab // New field
    glitchIntensity float64 // New field
}
```

- [ ] **Step 2: Update View to switch based on activeTab**

```go
func (m Model) View() string {
	var sb strings.Builder
    // ... Banner rendering ...
    
    // Render Tabs
    sb.WriteString(m.renderTabs())
    sb.WriteString("\n")

	switch m.activeTab {
	case TabIgnition:
		sb.WriteString(m.renderStatusTable())
	case TabVisAudit:
		sb.WriteString(m.renderVisAudit())
	case TabTelemetry:
		sb.WriteString(m.renderLogFeed())
	case TabNucleus:
		sb.WriteString(m.renderNucleus())
	}

    // ... Legend rendering ...
	return sb.String()
}
```

- [ ] **Step 3: Commit**
```bash
git add deck-igniter/main.go
git commit -m "feat: refactor deck-igniter to tabbed architecture"
```

---

### Task 2: The Purpose-Driven Glitch Engine

**Files:**
- Modify: `deck-igniter/main.go`

- [ ] **Step 1: Implement glitch transformation logic**

```go
func (m Model) applyGlitch(text string) string {
    if m.glitchIntensity == 0 { return text }
    leetMap := map[rune]rune{'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7'}
    chars := []rune(text)
    for i, r := range chars {
        if rand.Float64() < m.glitchIntensity * 0.4 {
            if val, ok := leetMap[unicode.ToLower(r)]; ok {
                chars[i] = val
            }
        }
    }
    return string(chars)
}
```

- [ ] **Step 2: Link intensity to system state in Update**

```go
case tickMsg:
    // ... existing logic ...
    m.glitchIntensity = 0.0
    for _, c := range m.components {
        if c.State == StateError { m.glitchIntensity = 0.4; break }
    }
    // Check for active governance duel via bridge logs (Phase 48 sync)
    // if duelActive { m.glitchIntensity = 0.8 }
```

- [ ] **Step 3: Commit**
```bash
git add deck-igniter/main.go
git commit -m "feat: implement purpose-driven glitch engine in Go"
```

---

### Task 3: ASCII Block Borders & Unified HUD Styles

**Files:**
- Modify: `deck-igniter/main.go`

- [ ] **Step 1: Define ASCII block border styles**

```go
var sovereignBorder = lipgloss.Border{
	Top:         "▀",
	Bottom:      "▄",
	Left:        "█",
	Right:       "█",
	TopLeft:     "▛",
	TopRight:    "▜",
	BottomLeft:  "▙",
	BottomRight: "▟",
}

// Update paneStyle to use sovereignBorder
paneStyle = lipgloss.NewStyle().
    Border(sovereignBorder).
    BorderForeground(colorRed)
```

- [ ] **Step 2: Update table headers to :/PATTERN // style**

```go
func (m Model) renderTabs() string {
    tabs := []string{"IGNIT3", "V1SU4L", "L0G5", "C0N7R0L"}
    var rendered []string
    for i, t := range tabs {
        label := fmt.Sprintf(":/%s //", t)
        if Tab(i) == m.activeTab {
            rendered = append(rendered, selectedStyle.Render(label))
        } else {
            rendered = append(rendered, dimStyle.Render(label))
        }
    }
    return strings.Join(rendered, "   ")
}
```

- [ ] **Step 3: Commit**
```bash
git add deck-igniter/main.go
git commit -m "style: apply ASCII block borders and unified HUD headers"
```

---

### Task 4: Final Verification & Nix Integration

**Files:**
- Modify: `flake.nix`

- [ ] **Step 1: Add build script for the revised CLI**
Run: `go build -o deck-igniter-cli ./deck-igniter`

- [ ] **Step 2: Verify tab navigation and glitch triggers**
Launch CLI and simulate an error (e.g. stop a required service). Verify visual corruption.

- [ ] **Step 3: Final Commit**
```bash
git commit -m "chore: finalize Sovereign Control Deck revision"
```
