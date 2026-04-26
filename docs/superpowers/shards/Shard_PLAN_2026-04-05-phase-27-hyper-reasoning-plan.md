# Phase 27 — Hyper-Reasoning Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Pixtral-12B (VLM) for multimodal perception and expose real-time Thought Streams.

**Architecture:** Refactor vision services to use the native Node B `llama-server` (OpenAI-compatible) and implement CDP-based surgical cropping for high-res perception.

**Tech Stack:** TypeScript (Node.js), Chrome DevTools Protocol (CDP), llama-cpp-vulkan.

---

### Task 1: VLM Provisioning & Proxy Alignment

**Files:**
- Modify: `.env`
- Modify: `src/core/spatial-vision-service.ts`

- [ ] **Step 1: Update `.env` with VLM parameters**

```env
VLM_MODEL=pixtral-12b-q5_k_m.gguf
VLM_MMPROJ=pixtral-12b-mmproj.bin
VLM_ENDPOINT=http://localhost:8080/v1/chat/completions
```

- [ ] **Step 2: Refactor `SpatialVisionService` to use OpenAI-compatible endpoint**

```typescript
// Use standard fetch() to send image_url payloads to llama-server
async function callVlm(prompt: string, imageB64: string) {
  const res = await fetch(process.env.VLM_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      model: "pixtral",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/png;base64,${imageB64}` } }
        ]
      }]
    })
  });
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(vlm): align SpatialVisionService with native llama-server"
```

---

### Task 2: Surgical Perception (CDP Cropping)

**Files:**
- Modify: `src/core/visual-monitor-service.ts`

- [ ] **Step 1: Implement `captureCoordinateCrop` method**

```typescript
async captureCoordinateCrop(x: number, y: number, size: number = 512): Promise<string> {
  const client = await this.getClient();
  const { data } = await client.Page.captureScreenshot({
    format: 'png',
    clip: {
      x: x - (size / 2),
      y: y - (size / 2),
      width: size,
      height: size,
      scale: 1
    }
  });
  return data; // Base64
}
```

- [ ] **Step 2: Verify with manual test script**
- [ ] **Step 3: Commit**

```bash
git add src/core/visual-monitor-service.ts
git commit -m "feat(cdp): implement surgical coordinate cropping"
```

---

### Task 3: Thought Stream (CoT) Pipeline

**Files:**
- Modify: `crush/main.go`
- Modify: `src/api/foundry-adapter.ts`

- [ ] **Step 1: Update `foundry-adapter` to stream `<think>` blocks to Mmap/Proxy**
- [ ] **Step 2: Update `crush` CLI to render streaming tokens in a dedicated pane**
- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(ui): implement real-time Thought Stream in CLI"
```

---

### Task 4: Akashik Visual Audit

**Files:**
- Create: `src/core/akashik-visual-auditor.ts`

- [ ] **Step 1: Implement auditor that feeds Forge PNGs to Pixtral**
- [ ] **Step 2: Store results in `Akashik.db` library_entries table**
- [ ] **Step 3: Commit**

```bash
git add src/core/akashik-visual-auditor.ts
git commit -m "feat(akashik): implement visual lore extraction for campaign PDFs"
```

---

### Final Verification

- [ ] **Step 1: Run `crush forge run` to generate Smart Assets**
- [ ] **Step 2: Run `crush library --audit` to trigger VLM lore extraction**
- [ ] **Step 3: Verify AI atmospheric barks are grounded in PDF artwork**
- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: finalize Phase 27 Hyper-Reasoning Orchestrator"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
