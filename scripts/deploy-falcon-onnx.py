#!/usr/bin/env python3
"""
scripts/deploy-falcon-onnx.py

Phase 16 Falcon ONNX Model Deployment
--------------------------------------
Downloads the TrOCR-Small encoder from HuggingFace and exports the Vision
Transformer (ViT) encoder component to ONNX format with a 1x3x384x384 input,
matching the preprocessing performed by zeroclaw/src/perception/mod.rs.

The Rust inference code (PerceptionController::preprocess_image) resizes the
input image to 384x384 RGB, normalises to [0,1], and passes it as a
1×3×384×384 float32 tensor — identical to the input shape exported here.

Usage:
    python scripts/deploy-falcon-onnx.py

Requirements:
    pip install torch torchvision transformers onnx onnxruntime

Output:
    zeroclaw/models/falcon-0.3b-ocr.onnx  (~90MB TrOCR ViT encoder)
"""

import sys
import os
import pathlib

OUTPUT_PATH = pathlib.Path(__file__).parent.parent / "zeroclaw" / "models" / "falcon-0.3b-ocr.onnx"
MODEL_NAME = "microsoft/trocr-small-printed"

print(f"[deploy-falcon-onnx] Target: {OUTPUT_PATH}")
print(f"[deploy-falcon-onnx] Source model: {MODEL_NAME}")

try:
    import torch
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    import onnx
    import onnxruntime as ort
except ImportError as e:
    print(f"\n[ERROR] Missing dependency: {e}")
    print("Install requirements:")
    print("  pip install torch torchvision transformers onnx onnxruntime")
    sys.exit(1)

print("[deploy-falcon-onnx] Loading TrOCR-Small from HuggingFace...")
model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME)
encoder = model.encoder  # ViT encoder: 1×3×384×384 → 577×384 feature map
encoder.eval()

# Dummy input matching zeroclaw preprocess_image output: 1×3×384×384 float32
dummy_input = torch.randn(1, 3, 384, 384)

print("[deploy-falcon-onnx] Exporting encoder to ONNX...")
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

torch.onnx.export(
    encoder,
    dummy_input,
    str(OUTPUT_PATH),
    export_params=True,
    opset_version=14,
    input_names=["pixel_values"],
    output_names=["last_hidden_state"],
    dynamic_axes={
        "pixel_values": {0: "batch_size"},
        "last_hidden_state": {0: "batch_size"},
    },
)

# Validate the exported model
print("[deploy-falcon-onnx] Validating ONNX model...")
onnx_model = onnx.load(str(OUTPUT_PATH))
onnx.checker.check_model(onnx_model)

# Quick ORT inference check
session = ort.InferenceSession(str(OUTPUT_PATH), providers=["CPUExecutionProvider"])
import numpy as np
test_input = np.random.randn(1, 3, 384, 384).astype(np.float32)
outputs = session.run(None, {"pixel_values": test_input})

size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
print(f"[deploy-falcon-onnx] Model size: {size_mb:.1f} MB")
print(f"[deploy-falcon-onnx] Output shape: {outputs[0].shape}")
print(f"[deploy-falcon-onnx] ONNX validation: PASSED")
print(f"[deploy-falcon-onnx] Deployed to: {OUTPUT_PATH}")
print()
print("Next step: Hand off to Gemini for Audit/Verification.")
print("  cargo test -p zeroclaw  (validates perception module with real model)")
