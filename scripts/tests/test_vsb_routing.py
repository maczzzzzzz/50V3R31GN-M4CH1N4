import logging
import sys
import os
import time
from pathlib import Path

# Change to the agent directory
os.chdir("sidecars/hermes-agent-nous")
sys.path.insert(0, os.getcwd())

from plugins.model_providers.sovereign_vsb.provider import SovereignVSBProvider

logging.basicConfig(level=logging.DEBUG)

config = {
    "mesh_nodes": [
        {"id": "node-d-fast", "ip": "100.120.225.12", "port": 8081, "models": ["carnice-9b"]}
    ],
    "pulse_enabled": False
}

provider = SovereignVSBProvider(config)
messages = [{"role": "user", "content": "Tell me a very short joke."}]

print(":: Calling VSB stream...")
start = time.time()
try:
    for chunk in provider.stream("carnice-9b", messages):
        if isinstance(chunk, dict) and "content" in chunk:
            print(chunk.get("content", ""), end="", flush=True)
    elapsed = time.time() - start
    print(f"\n:: Stream complete (after {elapsed:.1f}s).")
except Exception as e:
    print(f"\n:: Error: {e}")
