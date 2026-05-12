# VSB Router Blocker Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the three cascading blockers causing CRITICAL VSB inference routing failure: missing environmental secret, fallback trap to hardcoded base_url, and Node D physical connectivity (firewall/service).

**Architecture:** Fix the three blocker layers bottom-up: (1) Nix firewall and service configuration on Node D, (2) Remove hardcoded fallback URLs from provider profile and CLI config, (3) Add graceful degradation with clear error messages when secret is missing instead of crashing. Also add a connectivity health-check tool and a deployment env-bootstrap script.

**Tech Stack:** NixOS module configuration, Python 3.11+ (Hermes plugin), shell scripting.

---

## Blocker Chain Analysis

```
Blocker 1: SOVEREIGN_MESH_SECRET missing from ~/.hermes/.env
  → VSBRouter.__init__ raises EnvironmentError
  → SovereignVSBProvider fails to initialize
  → Hermes falls through to SovereignVSBProfile base_url

Blocker 2: SovereignVSBProfile has base_url="http://100.120.225.12:8080/v1"
  → cli-config.yaml also has base_url="http://100.120.225.12:8000"
  → Hermes attempts direct connection without router load-balancing
  → Routes to Node D regardless of load/health

Blocker 3: Node D unreachable on port 8080
  → firewall: tailscale0 NOT in trustedInterfaces
  → only 8000, 8080, 9119 opened in hermes-core.nix
  → inference-engine.nix binds to 0.0.0.0:8080 but firewall may block Tailscale
  → No verification that ik-llama service is running
```

---

### Task 1: Fix Node D Nix Firewall for Tailscale Artery

**Files:**
- Modify: `nix/modules/hermes-core.nix`
- Modify: `nix/modules/tailscale.nix`
- Modify: `nix/hosts/node-d/default.nix`
- Modify: `nix/modules/inference-engine.nix`

- [ ] **Step 1: Add `tailscale0` to `trustedInterfaces` in tailscale.nix**

```nix
# In nix/modules/tailscale.nix, add to the config block:
networking.firewall.trustedInterfaces = [ "tailscale0" ];
```

This allows ALL traffic on the Tailscale overlay without per-port rules. The Tailscale Artery is the Zero-Trust mesh boundary. Traffic on `tailscale0` is already authenticated and encrypted by Tailscale. Adding it to `trustedInterfaces` means all ports (8080, 8000, 9119, 7878 UDP, etc.) are reachable from other mesh nodes without explicitly listing each one.

- [ ] **Step 2: Add UDP pulse port (7878) to hermes-core.nix**

```nix
# In nix/modules/hermes-core.nix, add to allowedTCPPorts and add allowedUDPPorts:
networking.firewall.allowedTCPPorts = [
  8000  # Hermes API
  8080  # IK Llama.cpp
  9119  # Hermes Web UI
];
networking.firewall.allowedUDPPorts = [
  7878  # VSB Pulse sync
];
```

Note: With `tailscale0` in `trustedInterfaces`, this is belt-and-suspenders. But explicit port declarations serve as documentation and protect LAN access.

- [ ] **Step 3: Add port 8081 to inference-engine.nix for secondary inference endpoint**

```nix
# In nix/modules/inference-engine.nix, add firewall config:
config = mkIf cfg.enable {
  networking.firewall.allowedTCPPorts = [ cfg.port ];

  systemd.services.ik-llama = {
    # ... existing config ...
  };
};
```

This opens whatever port `cfg.port` is set to (default 8080). The module user can override with `services.ik-llama.port = 8081` in host config.

- [ ] **Step 4: Add model path and explicit port to Node D host config**

```nix
# In nix/hosts/node-d/default.nix, add:
services.ik-llama = {
  enable = true;
  memoryMax = "36G";
  port = 8080;
  modelPath = "/var/lib/hermes/models/carnice-v2-27b-q6_k.gguf";
};
```

The `modelPath` must point to an actual GGUF file on Node D. The default `/var/lib/hermes/models/default.gguf` does not exist. Document that the model must be provisioned to this path.

- [ ] **Step 5: Run `nix eval` to verify configuration**

Run: `nix eval .#nixosConfigurations.node-d.config.networking.firewall.allowedTCPPorts`
Expected: `[ 8000 8080 9119 ]`

Run: `nix eval .#nixosConfigurations.node-d.config.networking.firewall.trustedInterfaces`
Expected: `[ "tailscale0" ]`

- [ ] **Step 6: Commit**

```bash
git add nix/modules/hermes-core.nix nix/modules/tailscale.nix nix/hosts/node-d/default.nix nix/modules/inference-engine.nix
git commit -m "fix(nix): add tailscale0 to trustedInterfaces, open VSB pulse port, fix Node D inference config"
```

---

### Task 2: Remove Fallback Trap from SovereignVSBProfile

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/__init__.py`
- Modify: `sidecars/hermes-agent-nous/cli-config.yaml`

- [ ] **Step 1: Remove hardcoded `base_url` from SovereignVSBProfile**

In `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/__init__.py`, change the `sovereign_vsb` profile instantiation to remove `base_url`:

```python
sovereign_vsb = SovereignVSBProfile(
    name="sovereign-vsb",
    aliases=("vsb", "sovereign"),
    display_name="Sovereign VSB",
    description="Sovereign Model Router - VSB (Virtual Sovereign Bus) for high-performance inference.",
    signup_url="https://github.com/Sovereign-Machina",
    base_url="",  # No direct URL — VSB routes dynamically via mesh nodes
    env_vars=("SOVEREIGN_MESH_SECRET",),
    auth_type="api_key",
    fallback_models=(
        "falcon", "embedding",
        "carnice-9b", "qwen3-vl",
        "voxcpm2-indic-q4", "qwen3.5-0.8b",
        "carnice-v2-27b", "qwen2.5-coder-14b"
    ),
    default_max_tokens=32768,
)
```

Key changes:
- `base_url=""` instead of hardcoded Node D IP. When the VSB router fails, Hermes will not fall through to a direct Node D connection.
- `env_vars` now references `SOVEREIGN_MESH_SECRET` (the actual required env var) instead of `HERMES_API_TOKEN`.

- [ ] **Step 2: Remove hardcoded `base_url` from cli-config.yaml**

In `sidecars/hermes-agent-nous/cli-config.yaml`, remove the `base_url` line from the model section:

```yaml
model:
  default: "carnice-v2-27b"
  provider: "sovereign-vsb"
  # base_url removed — VSB router resolves endpoints dynamically
```

The VSB provider resolves the correct node endpoint at runtime. A hardcoded `base_url` bypasses the router and creates the fallback trap.

- [ ] **Step 3: Run existing VSB tests**

Run: `PYTHONPATH=sidecars/hermes-agent-nous pytest sidecars/hermes-agent-nous/tests/plugins/test_vsb_router_pulse.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/__init__.py sidecars/hermes-agent-nous/cli-config.yaml
git commit -m "fix(vsb): remove hardcoded base_url to eliminate fallback trap when router is down"
```

---

### Task 3: Graceful Degradation When SOVEREIGN_MESH_SECRET Missing

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py`
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/provider.py`

- [ ] **Step 1: Add graceful degradation to VSBRouter**

In `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py`, modify `VSBRouter.__init__`:

```python
class VSBRouter:
    def __init__(self, nodes: List[Node]):
        self.nodes = {n.id: n for n in nodes}
        self.secret_key = os.getenv("SOVEREIGN_MESH_SECRET", "")
        if not self.secret_key:
            logger.error(
                "SOVEREIGN_MESH_SECRET not set. VSB pulse authentication disabled. "
                "Set SOVEREIGN_MESH_SECRET in ~/.hermes/.env for production use."
            )
        self.pulse = VSBPulse(nodes, secret=self.secret_key)
        self.running = False
```

This replaces the `raise EnvironmentError` with a logged warning. The router will still function for direct inference calls (which use `httpx`), but pulse sync will run without HMAC authentication. This prevents the provider from crashing during initialization.

- [ ] **Step 2: Add initialization error handling to SovereignVSBProvider**

In `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/provider.py`, wrap router init:

```python
def __init__(self, config: dict):
    self.config = config

    mesh_nodes_config = config.get("mesh_nodes", [])
    nodes = []
    from .vsb_router import Node

    for n in mesh_nodes_config:
        nodes.append(Node(
            id=n["id"],
            ip=n["ip"],
            port=n["port"],
            models=n["models"]
        ))

    if not nodes:
        from .vsb_router import MESH_NODES
        nodes = MESH_NODES
        logger.warning("No mesh_nodes found in config, using hardcoded fallback")

    try:
        self.router = VSBRouter(nodes)
    except Exception as e:
        logger.error(f"VSB Router initialization failed: {e}")
        self.router = None
        self._init_error = str(e)
        return

    self.pulse_enabled = config.get("pulse_enabled", True)

    if self.pulse_enabled:
        self.router.start_pulse_sync()

    logger.info(f"VSB provider initialized with {len(nodes)} nodes")
```

And update `generate()` and `stream()` to check for init failure:

```python
def generate(self, model_id, messages, temperature=0.7, max_tokens=4096, **kwargs):
    if not self.router:
        return {"error": f"VSB provider not initialized: {getattr(self, '_init_error', 'unknown')}. Check SOVEREIGN_MESH_SECRET and mesh connectivity."}
    # ... existing logic ...
```

- [ ] **Step 3: Run tests**

Run: `PYTHONPATH=sidecars/hermes-agent-nous pytest sidecars/hermes-agent-nous/tests/plugins/test_vsb_router_pulse.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/provider.py
git commit -m "fix(vsb): graceful degradation when SOVEREIGN_MESH_SECRET is missing instead of crashing"
```

---

### Task 4: Environment Bootstrap Script

**Files:**
- Create: `scripts/bootstrap-env.sh`

- [ ] **Step 1: Create the bootstrap script**

```bash
#!/usr/bin/env bash
# bootstrap-env.sh — Provision ~/.hermes/.env with required Sovereign secrets.
set -euo pipefail

ENV_FILE="$HOME/.hermes/.env"
mkdir -p "$(dirname "$ENV_FILE")"

# Check existing
if [ -f "$ENV_FILE" ]; then
    echo ":: Found existing $ENV_FILE"
else
    touch "$ENV_FILE"
    echo ":: Created $ENV_FILE"
fi

# SOVEREIGN_MESH_SECRET — required for VSB pulse authentication
if grep -q "^SOVEREIGN_MESH_SECRET=" "$ENV_FILE" 2>/dev/null; then
    echo ":: SOVEREIGN_MESH_SECRET already set"
else
    if [ -n "${SOVEREIGN_MESH_SECRET:-}" ]; then
        echo "SOVEREIGN_MESH_SECRET=$SOVEREIGN_MESH_SECRET" >> "$ENV_FILE"
        echo ":: SOVEREIGN_MESH_SECRET written from environment"
    else
        SECRET=$(openssl rand -hex 32)
        echo "SOVEREIGN_MESH_SECRET=$SECRET" >> "$ENV_FILE"
        echo ":: SOVEREIGN_MESH_SECRET generated (32-byte random hex)"
        echo ":: IMPORTANT: Copy this secret to all mesh nodes' ~/.hermes/.env"
    fi
fi

# HERMES_API_TOKEN — required by provider profile
if grep -q "^HERMES_API_TOKEN=" "$ENV_FILE" 2>/dev/null; then
    echo ":: HERMES_API_TOKEN already set"
else
    if [ -n "${HERMES_API_TOKEN:-}" ]; then
        echo "HERMES_API_TOKEN=$HERMES_API_TOKEN" >> "$ENV_FILE"
        echo ":: HERMES_API_TOKEN written from environment"
    else
        TOKEN=$(openssl rand -hex 16)
        echo "HERMES_API_TOKEN=$TOKEN" >> "$ENV_FILE"
        echo ":: HERMES_API_TOKEN generated (16-byte random hex)"
    fi
fi

echo ""
echo ":: Environment bootstrap complete. Review $ENV_FILE:"
cat "$ENV_FILE"
echo ""
echo ":: Deploy the same SOVEREIGN_MESH_SECRET to all mesh nodes for pulse auth."
```

- [ ] **Step 2: Make executable**

Run: `chmod +x scripts/bootstrap-env.sh`

- [ ] **Step 3: Commit**

```bash
git add scripts/bootstrap-env.sh
git commit -m "feat(scripts): add bootstrap-env.sh to provision Sovereign secrets"
```

---

### Task 5: VSB Connectivity Health-Check Tool

**Files:**
- Create: `scripts/vsb-healthcheck.sh`

- [ ] **Step 1: Create the health-check script**

```bash
#!/usr/bin/env bash
# vsb-healthcheck.sh — Verify VSB mesh connectivity from Node B.
set -euo pipefail

NODES=(
    "node-a:100.90.196.70:8000"
    "node-b:100.66.173.31:9119"
    "node-c:100.102.109.81:8080"
    "node-d:100.120.225.12:8080"
)

FAIL=0

echo ":: VSB Mesh Connectivity Health-Check"
echo ""

# 1. Check Tailscale Artery
if command -v tailscale >/dev/null 2>&1; then
    if tailscale status >/dev/null 2>&1; then
        echo "[OK] Tailscale Artery: ACTIVE"
    else
        echo "[FAIL] Tailscale Artery: NOT ACTIVE"
        FAIL=1
    fi
else
    echo "[WARN] tailscale CLI not found"
fi

# 2. Check SOVEREIGN_MESH_SECRET
if [ -f "$HOME/.hermes/.env" ] && grep -q "^SOVEREIGN_MESH_SECRET=" "$HOME/.hermes/.env"; then
    echo "[OK] SOVEREIGN_MESH_SECRET: SET"
else
    echo "[FAIL] SOVEREIGN_MESH_SECRET: NOT SET in ~/.hermes/.env"
    FAIL=1
fi

# 3. Check each mesh node
for entry in "${NODES[@]}"; do
    IFS=':' read -r name ip port <<< "$entry"
    
    # ICMP ping (1s timeout)
    if ping -c 1 -W 1 "$ip" >/dev/null 2>&1; then
        echo "[OK] $name ($ip): REACHABLE (ICMP)"
    else
        echo "[FAIL] $name ($ip): UNREACHABLE (ICMP)"
        FAIL=1
        continue
    fi
    
    # HTTP inference endpoint (5s timeout)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$ip:$port/v1/models" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        echo "[OK] $name ($ip:$port): inference endpoint UP (HTTP $HTTP_CODE)"
    else
        echo "[FAIL] $name ($ip:$port): inference endpoint DOWN (HTTP $HTTP_CODE)"
        FAIL=1
    fi
    
    # UDP pulse port
    if nc -z -u -w 1 "$ip" 7878 2>/dev/null; then
        echo "[OK] $name ($ip:7878/UDP): pulse port OPEN"
    else
        echo "[WARN] $name ($ip:7878/UDP): pulse port check inconclusive (UDP)"
    fi
done

echo ""
if [ "$FAIL" -eq 0 ]; then
    echo ":: HEALTH-CHECK PASSED — VSB mesh is operational"
else
    echo ":: HEALTH-CHECK FAILED — see above for details"
fi

exit $FAIL
```

- [ ] **Step 2: Make executable**

Run: `chmod +x scripts/vsb-healthcheck.sh`

- [ ] **Step 3: Commit**

```bash
git add scripts/vsb-healthcheck.sh
git commit -m "feat(scripts): add VSB mesh connectivity health-check tool"
```

---

### Task 6: Provider Profile `fetch_models` Hardening

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/__init__.py`

- [ ] **Step 1: Make `fetch_models` use environment config as fallback**

In the `SovereignVSBProfile.fetch_models` method, add fallback to `MESH_NODES` constant when `config.yaml` is not found:

```python
def fetch_models(self, *, api_key=None, timeout=8.0):
    try:
        import yaml
        from pathlib import Path
        config_path = Path("~/.hermes/config.yaml").expanduser()
        if config_path.exists():
            with open(config_path) as f:
                config = yaml.safe_load(f)

            vsb_config = config.get("model_providers", {}).get("sovereign-vsb", {}).get("config", {})
            nodes = vsb_config.get("mesh_nodes", [])

            if nodes:
                models = []
                for node in nodes:
                    for model in node.get("models", []):
                        models.append(model)
                unique = list(set(models))
                logger.info(f"VSB: Discovered {len(unique)} models from config.yaml")
                return unique
    except Exception as e:
        logger.warning(f"VSB: Could not read config.yaml: {e}")

    # Fallback to hardcoded mesh topology
    from .vsb_router import MESH_NODES
    models = []
    for node in MESH_NODES:
        for model in node.models:
            models.append(model)
    unique = list(set(models))
    logger.info(f"VSB: Using {len(unique)} models from hardcoded mesh topology")
    return unique
```

- [ ] **Step 2: Run tests**

Run: `PYTHONPATH=sidecars/hermes-agent-nous pytest sidecars/hermes-agent-nous/tests/plugins/test_vsb_router_pulse.py -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/__init__.py
git commit -m "fix(vsb): harden fetch_models with hardcoded topology fallback when config.yaml missing"
```

---

### Task 7: Update CHANGELOG and Documentation

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/planning/audits/vsb-router-blocker-260510.html`

- [ ] **Step 1: Add CHANGELOG entry**

Add at the top of `CHANGELOG.md`:

```markdown
## [3.3.4-BETA] - 2026-05-10
### Fixed
- **VSB Router Blocker Remediation (CRITICAL)**:
  - **Nix Firewall**: Added `tailscale0` to `trustedInterfaces` in `tailscale.nix`, allowing all mesh traffic on the Tailscale overlay without per-port rules. Added VSB pulse port (7878/UDP) to `hermes-core.nix`. Added dynamic firewall port opening in `inference-engine.nix`.
  - **Node D Inference Config**: Fixed `node-d/default.nix` to specify model path (`carnice-v2-27b-q6_k.gguf`) and explicit port (8080) instead of relying on non-existent defaults.
  - **Fallback Trap Eliminated**: Removed hardcoded `base_url` from `SovereignVSBProfile` (`__init__.py`) and `cli-config.yaml`. VSB router now resolves endpoints dynamically via mesh topology. When the router is down, Hermes gets a clear error instead of attempting a direct Node D connection.
  - **Graceful Degradation**: `VSBRouter.__init__` no longer raises `EnvironmentError` when `SOVEREIGN_MESH_SECRET` is unset. Instead it logs an error and continues with pulse auth disabled. `SovereignVSBProvider.generate()` returns a clear error message if the router failed to initialize.

### Added
- `scripts/bootstrap-env.sh`: Provisions `~/.hermes/.env` with `SOVEREIGN_MESH_SECRET` (auto-generated 32-byte hex) and `HERMES_API_TOKEN`. Prints instructions to copy the mesh secret to all nodes.
- `scripts/vsb-healthcheck.sh`: Verifies Tailscale Artery status, env secret presence, ICMP reachability, HTTP inference endpoint status, and UDP pulse port for all 4 mesh nodes.
```

- [ ] **Step 2: Update blocker audit status**

In `docs/planning/audits/vsb-router-blocker-260510.html`, update the status line from `BLOCKED` to `RESOLVED`:

```html
<p><strong>Status:</strong> <span class="resolved">RESOLVED</span> | <strong>Node:</strong> Node B (Strategist)</p>
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md docs/planning/audits/vsb-router-blocker-260510.html
git commit -m "docs: update CHANGELOG for v3.3.4-BETA VSB blocker remediation, mark audit as RESOLVED"
```

---

## Post-Deployment Verification (Manual)

After deploying to the mesh:

1. **Run health-check:** `scripts/vsb-healthcheck.sh`
2. **Bootstrap env on each node:** `scripts/bootstrap-env.sh` (copy same `SOVEREIGN_MESH_SECRET` to all nodes)
3. **Rebuild Node D:** `sudo nixos-rebuild switch --flake .#node-d`
4. **Verify ik-llama service:** `systemctl status ik-llama` on Node D
5. **Verify Tailscale connectivity:** `curl --connect-timeout 5 http://100.120.225.12:8080/v1/models`
6. **Test VSB routing:** Run `ignite.sh` and issue a prompt that hits `carnice-v2-27b`

---
**::/5Y573M-N071C3 : PLAN_SAVED. STANDING_BY_FOR_EXECUTION. // 50V3R31GN-M4CH1N4**
