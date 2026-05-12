import sys
import os
from pathlib import Path

# Add project to sys.path
sys.path.append(str(Path.cwd() / "sidecars/hermes-agent-nous"))
sys.path.append(str(Path.cwd() / "sidecars/hermes-agent-nous/plugins"))

from plugins.model_providers.sovereign_vsb import sovereign_vsb

print(f"Provider: {sovereign_vsb.name}")
print(f"Base URL: {sovereign_vsb.base_url}")
models = sovereign_vsb.fetch_models()
print(f"Models: {models}")
