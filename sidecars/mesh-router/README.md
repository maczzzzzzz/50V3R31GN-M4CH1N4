# Sovereign Mesh Router

Minimal native OpenAI-compatible router for the NODESTADT mesh.

Replaces LiteLLM for this deployment. No database, no Prisma, no Docker.

## Features
- Routes by model name to the correct backend node
- Supports aliases (`fast`, `heavy`, `fc`, `vision`, etc.)
- Streams responses correctly
- Exposes `/v1/models` so Hermes can discover routes
- Single file, trivial to audit

## Run manually (for testing)

```bash
python -m pip install fastapi uvicorn httpx
python mesh_router.py
```

## Nix package

```bash
nix-build sidecars/mesh-router
```

## Systemd service (recommended)

Create `/etc/systemd/system/mesh-router.service`:

```ini
[Unit]
Description=Sovereign Mesh Router
After=network.target

[Service]
Type=simple
ExecStart=/run/current-system/sw/bin/mesh-router
Restart=always
User=nixos
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mesh-router
```

## Update Hermes config

Point Hermes at the new router:

```yaml
providers:
  sovereign-mesh:
    - name: mesh-router
      type: openai-compatible
      base_url: http://localhost:4000/v1
      api_key: machina-internal-mesh-key-2026
```

Models will appear as: `mesh-fast`, `mesh-vision`, `mesh-function-calling`, `mesh-heavy`, `mesh-micro`

## Current routes (edit mesh_router.py to change)

| Model                    | Backend                  | Node |
|--------------------------|--------------------------|------|
| mesh-fast                | 10.0.0.11:8081           | B    |
| mesh-vision              | 10.0.0.11:8082           | B    |
| mesh-function-calling    | 100.102.109.81:8081      | C    |
| mesh-heavy               | 100.120.225.12:8080      | D    |
| mesh-micro               | 100.96.253.114:8080      | A    |

## Health check

```bash
curl http://localhost:4000/health
```