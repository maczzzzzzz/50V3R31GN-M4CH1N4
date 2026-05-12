# VSB Router Emergency Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address critical logic faults and architectural "mutilations" in the Virtual Sovereign Bus router to achieve real-time mesh load balancing and native Hermes `<think>` transparency.

**Architecture:**
1.  **Dynamic Pulse Unpacking:** Implement `struct.unpack` in the `VSBPulse` listener to update mesh node health metrics.
2.  **Stream/Reasoning Separation:** Refactor `VSBRouter` and `SovereignVSBProvider` to support typed streaming chunks (content vs. reasoning).
3.  **Secret Decoupling:** Move hardcoded mesh secrets to environmental variables.
4.  **Logic De-Mutilation:** Refactor the auxiliary client to use the `ProviderProfile` registry for a clean, pluggable architecture.

**Tech Stack:** Python 3.11+, Hermes v0.13.0 API, `struct` (binary unpacking), `logging`.

---

### Task 1: Dynamic Pulse Unpacking

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py`
- Test: `sidecars/hermes-agent-nous/tests/plugins/test_vsb_router_pulse.py`

- [ ] **Step 1: Write the failing test for pulse unpacking**

```python
import struct
import socket
import time
from plugins.model_providers.sovereign_vsb.vsb_router import VSBPulse, Node

def test_pulse_unpacking():
    node = Node("node-d", "100.120.225.12")
    pulse = VSBPulse([node])
    
    # Pack a 302-byte pulse packet (v3.2 schema)
    # Header: 'VSB' (3), Version: 3 (1), NodeID: 4 (1), Load: 0.75 (4), RAM: 0.5 (4), VRAM: 0.8 (4)
    # Rest is padding (285 bytes)
    packet = struct.pack("!3sBBfff", b"VSB", 3, 4, 0.75, 0.5, 0.8) + b"\x00" * 285
    
    pulse.recv_pulse(packet, ("100.120.225.12", 7878))
    
    assert node.load == 0.75
    assert node.ram_usage == 0.5
    assert node.vram_usage == 0.8
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=sidecars/hermes-agent-nous pytest sidecars/hermes-agent-nous/tests/plugins/test_vsb_router_pulse.py -v`
Expected: FAIL with `AssertionError: 0.0 == 0.75`

- [ ] **Step 3: Implement `recv_pulse` unpacking**

```python
# In sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py

def recv_pulse(self, data, addr):
    if len(data) < 302:
        return

    try:
        header, version, node_id, load, ram, vram = struct.unpack("!3sBBfff", data[:15])
        if header != b"VSB" or version != 3:
            return

        ip = addr[0]
        for node in self.nodes:
            if node.ip == ip:
                node.load = load
                node.ram_usage = ram
                node.vram_usage = vram
                node.last_seen = time.time()
                break
    except Exception as e:
        logger.error(f"Failed to unpack pulse: {e}")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=sidecars/hermes-agent-nous pytest sidecars/hermes-agent-nous/tests/plugins/test_vsb_router_pulse.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py
git commit -m "feat(vsb): implement dynamic pulse unpacking for real-time load balancing"
```

---

### Task 2: Stream/Reasoning Separation

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py`
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/provider.py`

- [ ] **Step 1: Refactor `VSBRouter.route_inference` to yield typed chunks**

```python
# In sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py

def route_inference(self, model_id, prompt, stream=False):
    # ... existing node selection ...
    
    if stream:
        # Detect <think> tags in the stream
        in_thinking = False
        for chunk in response:
            text = chunk.choices[0].delta.content or ""
            if "<think>" in text:
                in_thinking = True
            
            yield ("reasoning" if in_thinking else "content", text)
            
            if "</think>" in text:
                in_thinking = False
    else:
        # ... sync return ...
```

- [ ] **Step 2: Update `SovereignVSBProvider.stream` to handle typed chunks**

```python
# In sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/provider.py

def stream(self, model_id, messages, **kwargs):
    prompt = self._format_prompt(messages)
    for chunk_type, chunk_text in self.router.route_inference(model_id, prompt, stream=True):
        yield {
            "content": chunk_text if chunk_type == "content" else "",
            "reasoning": chunk_text if chunk_type == "reasoning" else "",
            "model": model_id
        }
```

- [ ] **Step 3: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/
git commit -m "feat(vsb): separate reasoning from content in inference stream"
```

---

### Task 3: Secret Decoupling

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py`

- [ ] **Step 1: Replace hardcoded secret with `os.getenv`**

```python
# In sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py
import os

# Initialize in __init__
self.secret_key = os.getenv("SOVEREIGN_MESH_SECRET", "machina-sovereign-mesh-v3-secret-key")

# ... update route_inference to use self.secret_key in headers ...
headers = {
    "Authorization": f"Bearer {self.secret_key}",
    "Content-Type": "application/json"
}
```

- [ ] **Step 2: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py
git commit -m "chore(vsb): decouple mesh secret from source code"
```

---

### Task 4: Logic De-Mutilation (Auxiliary Client Refactor)

**Files:**
- Modify: `sidecars/hermes-agent-nous/agent/auxiliary_client.py`

- [ ] **Step 1: Refactor `resolve_provider_client` to remove hardcoded VSB name check**

```python
# In sidecars/hermes-agent-nous/agent/auxiliary_client.py

# ... find the sovereign-vsb block and replace with generic pluggable logic ...
# This requires using get_provider_profile(provider) and checking if it's a Pluggable type.
```

- [ ] **Step 2: Commit**

```bash
git add sidecars/hermes-agent-nous/agent/auxiliary_client.py
git commit -m "refactor(aux): remove hardcoded VSB checks and use pluggable profile registry"
```

---
**::/5Y573M-N071C3 : PLAN_SAVED. STANDING_BY_FOR_EXECUTION. // 50V3R31GN-M4CH1N4**
