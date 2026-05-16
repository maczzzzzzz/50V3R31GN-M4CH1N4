#!/usr/bin/env python3
"""Screen triage: capture -> mesh-vision -> structured analysis.

End-to-end pipeline for the sovereign-sniffer sidecar.
Captures the Windows desktop, sends to the mesh-vision model,
and returns a structured triage response.
"""
import json
import os
import sys
import time

import requests

# Reuse capture utility
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from capture import capture_screen

LITELLM_URL = "http://localhost:4000/v1/chat/completions"
API_KEY = "sk-sov...roxy"
MODEL = "mesh-vision"

TRIAGE_PROMPT = """Analyze this screen capture. Respond in this format:

1. APPlications: List visible application windows/tabs
2. ALERTS: Any error messages, warnings, or notifications needing attention (or "none")
3. STATUS: One of [normal | warning | critical]
4. SUMMARY: One sentence describing what's happening on screen

Be concise. Focus on actionable information."""


def triage_screen(prompt: str = TRIAGE_PROMPT) -> dict:
    """Capture screen and run vision triage.

    Returns dict with keys: response, latency_ms, tokens.
    """
    t0 = time.time()

    # Step 1: Capture
    b64_image = capture_screen()
    capture_ms = (time.time() - t0) * 1000

    # Step 2: Send to vision model
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64_image}"
                        },
                    },
                ],
            }
        ],
        "max_tokens": 300,
    }

    t1 = time.time()
    resp = requests.post(
        LITELLM_URL,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    inference_ms = (time.time() - t1) * 1000

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    total_ms = (time.time() - t0) * 1000

    return {
        "response": content,
        "capture_ms": round(capture_ms),
        "inference_ms": round(inference_ms),
        "total_ms": round(total_ms),
        "tokens": data.get("usage", {}).get("completion_tokens", 0),
    }


if __name__ == "__main__":
    try:
        result = triage_screen()
        print(f"[{result['total_ms']}ms total | {result['capture_ms']}ms capture | {result['inference_ms']}ms inference]")
        print(f"[{result['tokens']} tokens]")
        print()
        print(result["response"])
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
