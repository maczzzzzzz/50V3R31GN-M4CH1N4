# Semantic Scanner (Go-Native) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Go-native semantic extraction engine within the Sovereign Harness to convert raw HTML/AXTree data into clean, LLM-ready Markdown shards.

**Architecture:** A sub-package in `crush/harness/driver/semantic` that wraps `go-readability` and `html-to-markdown`.

**Tech Stack:** Go 1.21+, `go-readability`, `html-to-markdown`, `sovereign-sdk`.

---

### Task 1: Artery Hardening (Dependencies)

**Files:**
- Modify: `crush/go.mod`

- [ ] **Step 1: Fetch Go-native extraction libraries**
  - Run: `cd crush && go get github.com/go-shiori/go-readability github.com/JohannesKaufmann/html-to-markdown`

- [ ] **Step 2: Verify dependency resolution**
  - Run: `go mod tidy`

- [ ] **Step 3: Commit**
  ```bash
  git add crush/go.mod crush/go.sum
  git commit -m "infra: add go-readability and html-to-markdown dependencies for semantic scanner"
  ```

---

### Task 2: Core Semantic Driver

**Files:**
- Create: `crush/harness/driver/semantic/scanner.go`
- Test: `crush/harness/driver/semantic/scanner_test.go`

- [ ] **Step 1: Implement basic Markdown conversion**

```go
package semantic

import (
    "github.com/JohannesKaufmann/html-to-markdown"
    "github.com/go-shiori/go-readability"
)

func Distill(html string, url string) (string, error) {
    // 1. Extract main content via go-readability
    article, err := readability.FromReader(strings.NewReader(html), url)
    if err != nil {
        return "", err
    }

    // 2. Convert to Markdown via html-to-markdown
    converter := md.NewConverter("", true, nil)
    markdown, err := converter.ConvertString(article.Content)
    return markdown, err
}
```

- [ ] **Step 2: Write test for Foundry VTT sheet extraction**
  - Create dummy HTML of a character sheet.
  - Assert Markdown output contains the HP and Skill values.

- [ ] **Step 3: Commit**
  ```bash
  git add crush/harness/driver/semantic/
  git commit -m "feat(harness): implement Go-native semantic scanner core"
  ```

---

### Task 3: VSB Integration

**Files:**
- Modify: `crush/harness/kernel/vsb_listener.go`

- [ ] **Step 1: Wire Scanner to VSB Intent loop**
  - When an "Extract Lore" intent is received, trigger `Distill`.
  - Broadcast the resulting Markdown shard via VSB 0x05 (Telemetry).

- [ ] **Step 2: Commit**
  ```bash
  git add crush/harness/kernel/vsb_listener.go
  git commit -m "feat(vsb): link semantic scanner to VSB intent loop"
  ```
