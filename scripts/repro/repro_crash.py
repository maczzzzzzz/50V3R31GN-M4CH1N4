import sys
import os
from pathlib import Path

# Add project to sys.path
sys.path.append(str(Path.cwd() / "sidecars/hermes-agent-nous"))

from run_agent import AIAgent

agent = AIAgent(
    provider="sovereign-vsb",
    model="carnice-9b",
    api_key="test"
)

print(":: Calling agent.chat...")
try:
    response = agent.chat("Hello")
    print(f":: Response: {response}")
except Exception as e:
    print(f":: Caught exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
