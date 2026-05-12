# Phase 7: Avatar Pets & Stealth Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the high-fidelity visual and observational layer for managed mesh processes using CloakBrowser, pup, Nano Banana 2, Hello-Agents, and Memoir.

**Architecture:** 
This phase overhauls several disparate systems into a unified observability and memory layer:
1. **Stealth Reconnaissance:** `CloakBrowser` replaces standard Playwright contexts in the `Stagehand` plugin, allowing agents to perform API discovery without triggering anti-bot flags.
2. **Node Telemetry:** `pup` is deployed to nodes A, C, and D, streaming structured JSON metrics back to the Hermes Core (Node D) instead of relying on legacy polling.
3. **Hierarchical Memory:** `memoir` replaces flat-file contexts (`MEMORY.md`) with a Git-backed, versioned semantic hierarchy, allowing agents to branch memory during stealth reconnaissance and merge upon verification.
4. **Avatar Pets:** The Hermes Workspace HUD consumes `pup` telemetry to animate procedural `Nano Banana 2` sprites, giving visual "moods" to physical hardware nodes.
5. **A2A Context:** `Hello-Agents` situational understanding headers are injected into the VSB protocol for high-density agent handoffs.

**Tech Stack:** Python (Hermes Core), Rust (Pup), TypeScript/React (Workspace HUD), CloakBrowser (C++ Chromium), Memoir (Python SDK).

---

### Task 1: Stealth Browser-Harness Integration (Cloak)

**Files:**
- Create: `sidecars/hermes-agent-nous/plugins/model_providers/cloak_browser/provider.py`
- Modify: `sidecars/hermes-agent-nous/cli-config.yaml:150-165`
- Test: `sidecars/hermes-agent-nous/tests/integration/test_cloak_stealth.py`

- [ ] **Step 1: Write the failing test**

```python
# sidecars/hermes-agent-nous/tests/integration/test_cloak_stealth.py
import pytest
from plugins.model_providers.cloak_browser.provider import CloakBrowserProvider

@pytest.mark.asyncio
async def test_cloak_browser_initialization():
    provider = CloakBrowserProvider()
    context = await provider.create_stealth_context()
    
    # Ensure humanize flag is active for bypass
    assert context.humanize_enabled is True
    assert context.fingerprint_seed is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sidecars/hermes-agent-nous && pytest tests/integration/test_cloak_stealth.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'plugins.model_providers.cloak_browser'"

- [ ] **Step 3: Write minimal implementation**

```python
# sidecars/hermes-agent-nous/plugins/model_providers/cloak_browser/provider.py
import os
import uuid

class CloakBrowserContext:
    def __init__(self, humanize: bool):
        self.humanize_enabled = humanize
        self.fingerprint_seed = str(uuid.uuid4())

class CloakBrowserProvider:
    def __init__(self):
        self.binary_path = os.getenv("CLOAK_BROWSER_PATH", "/usr/bin/cloak")

    async def create_stealth_context(self) -> CloakBrowserContext:
        # Initialize stealth CDP context
        return CloakBrowserContext(humanize=True)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sidecars/hermes-agent-nous && pytest tests/integration/test_cloak_stealth.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/cloak_browser/provider.py sidecars/hermes-agent-nous/tests/integration/test_cloak_stealth.py
git commit -m "feat(phase7): initialize CloakBrowser stealth provider"
```

---

### Task 2: Version-Controlled Semantic Memory (Memoir)

**Files:**
- Create: `sidecars/hermes-agent-nous/plugins/memory/memoir_store.py`
- Modify: `sidecars/hermes-agent-nous/hermes_state.py:45-60`
- Test: `sidecars/hermes-agent-nous/tests/unit/test_memoir_store.py`

- [ ] **Step 1: Write the failing test**

```python
# sidecars/hermes-agent-nous/tests/unit/test_memoir_store.py
import pytest
from plugins.memory.memoir_store import MemoirStore

@pytest.mark.asyncio
async def test_memoir_branching_and_recall():
    store = MemoirStore(repo_path="/tmp/test_memoir")
    await store.init_repo()
    
    # Create stealth branch
    branch_id = await store.branch("stealth_recon_01")
    await store.commit(branch_id, "target.api.endpoints", {"status": "discovered"})
    
    # Recall
    data = await store.recall(branch_id, "target.api")
    assert data["endpoints"]["status"] == "discovered"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sidecars/hermes-agent-nous && pytest tests/unit/test_memoir_store.py -v`
Expected: FAIL with "ModuleNotFoundError"

- [ ] **Step 3: Write minimal implementation**

```python
# sidecars/hermes-agent-nous/plugins/memory/memoir_store.py
import json
import os

class MemoirStore:
    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self.branches = {}

    async def init_repo(self):
        os.makedirs(self.repo_path, exist_ok=True)

    async def branch(self, branch_name: str) -> str:
        self.branches[branch_name] = {}
        return branch_name

    async def commit(self, branch_id: str, path: str, data: dict):
        keys = path.split('.')
        current = self.branches[branch_id]
        for key in keys[:-1]:
            current = current.setdefault(key, {})
        current[keys[-1]] = data

    async def recall(self, branch_id: str, path: str) -> dict:
        keys = path.split('.')
        current = self.branches[branch_id]
        for key in keys:
            if key in current:
                current = current[key]
            else:
                return {}
        return current
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sidecars/hermes-agent-nous && pytest tests/unit/test_memoir_store.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/memory/memoir_store.py sidecars/hermes-agent-nous/tests/unit/test_memoir_store.py
git commit -m "feat(phase7): implement hierarchical Memoir storage engine"
```

---

### Task 3: Agent-Native Node Observability (Pup)

**Files:**
- Create: `sidecars/hermes-agent-nous/plugins/observability/pup_monitor/plugin.py`
- Test: `sidecars/hermes-agent-nous/tests/unit/test_pup_monitor.py`

- [ ] **Step 1: Write the failing test**

```python
# sidecars/hermes-agent-nous/tests/unit/test_pup_monitor.py
import pytest
from plugins.observability.pup_monitor.plugin import PupMonitor

@pytest.mark.asyncio
async def test_pup_telemetry_parsing():
    monitor = PupMonitor()
    raw_pup_json = '{"node": "node-c", "cpu": 85.5, "status": "degraded"}'
    
    metrics = monitor.parse_stream(raw_pup_json)
    assert metrics.node_id == "node-c"
    assert metrics.requires_runbook is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sidecars/hermes-agent-nous && pytest tests/unit/test_pup_monitor.py -v`
Expected: FAIL 

- [ ] **Step 3: Write minimal implementation**

```python
# sidecars/hermes-agent-nous/plugins/observability/pup_monitor/plugin.py
import json
from dataclasses import dataclass

@dataclass
class NodeMetrics:
    node_id: str
    cpu: float
    requires_runbook: bool

class PupMonitor:
    def parse_stream(self, raw_json: str) -> NodeMetrics:
        data = json.loads(raw_json)
        # Trigger runbook execution if status is degraded or CPU > 80
        requires_runbook = data.get("status") == "degraded" or data.get("cpu", 0) > 80.0
        return NodeMetrics(
            node_id=data.get("node"),
            cpu=data.get("cpu"),
            requires_runbook=requires_runbook
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sidecars/hermes-agent-nous && pytest tests/unit/test_pup_monitor.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/observability/pup_monitor/plugin.py sidecars/hermes-agent-nous/tests/unit/test_pup_monitor.py
git commit -m "feat(phase7): integrate pup agent JSON stream parser"
```

---

### Task 4: Avatar Pets Visual Feedback (Nano Banana 2)

**Files:**
- Create: `dashboard/hermes-workspace/src/components/AvatarPet.tsx`
- Create: `dashboard/hermes-workspace/src/components/AvatarPet.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// dashboard/hermes-workspace/src/components/AvatarPet.test.tsx
import { render, screen } from '@testing-library/react';
import { AvatarPet } from './AvatarPet';

test('renders sad pet when node is degraded', () => {
    render(<AvatarPet nodeId="node-c" status="degraded" cpu={85.5} />);
    
    // Expecting the Nano Banana 2 sprite to reflect 'sad' or 'hungry' state
    const sprite = screen.getByRole('img', { name: /node-c avatar/i });
    expect(sprite.getAttribute('src')).toContain('sprite_sad.png');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd dashboard/hermes-workspace && npm test AvatarPet.test.tsx`
Expected: FAIL 

- [ ] **Step 3: Write minimal implementation**

```tsx
// dashboard/hermes-workspace/src/components/AvatarPet.tsx
import React from 'react';

interface AvatarPetProps {
    nodeId: string;
    status: 'healthy' | 'degraded' | 'offline';
    cpu: number;
}

export const AvatarPet: React.FC<AvatarPetProps> = ({ nodeId, status, cpu }) => {
    // Nano Banana 2 procedural sprite resolution based on Pup telemetry
    const spriteState = status === 'degraded' || cpu > 80 ? 'sad' : 'happy';
    const spriteUrl = `/assets/sprites/${nodeId}_sprite_${spriteState}.png`;

    return (
        <div className="avatar-pet-container">
            <img 
                src={spriteUrl} 
                alt={`${nodeId} avatar`} 
                className={`pet-anim-${spriteState}`}
            />
            <div className="pet-stats">CPU: {cpu}%</div>
        </div>
    );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd dashboard/hermes-workspace && npm test AvatarPet.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add dashboard/hermes-workspace/src/components/AvatarPet.tsx dashboard/hermes-workspace/src/components/AvatarPet.test.tsx
git commit -m "feat(phase7): implement Nano Banana 2 Avatar Pet component"
```

---
**Plan complete and saved to `docs/planning/plans/2026-05-10-phase-7-avatar-pets-stealth.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
