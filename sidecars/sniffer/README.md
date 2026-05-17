# sovereign-sniffer

On-demand screen capture and vision triage pipeline.

## Usage

```bash
# From WSL2 (Node B)
python3 sidecars/sniffer/triage.py
```

## Architecture

1. **capture.py** -- Captures Windows desktop via PowerShell screenshot, saves to /tmp.
2. **triage.py** -- Sends captured image to mesh-vision route (Qwen3-VL-2B), returns structured analysis.

## Design Decision: On-Demand Only

The sniffer is intentionally NOT a persistent service. Reasons:
- Screen capture is a discretionary action, not a continuous monitoring need.
- Running periodic screenshots as a systemd timer creates privacy concerns without clear value.
- The vision model (mesh-vision) is not always running; depends on Windows llama-server being active.
- Invocation from Hermes via terminal tool is the expected usage pattern.

If continuous monitoring is needed in the future, create a `sniffer.timer` + `sniffer.service` pair.

## Dependencies

- mesh-vision route must be active (Node B port 8082)
- LITELLM_MASTER_KEY env var must be set
- PowerShell access to Windows host (WSL2 interop)
