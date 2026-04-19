import torch
from colpali_engine.models import ColPali
from transformers import AutoProcessor
from PIL import Image
import numpy as np
import os

MODEL_NAME = "vidore/colpali-v1.2"
device = torch.device("cpu")
print(f"Loading model on {device}...")

try:
    model = ColPali.from_pretrained(MODEL_NAME, torch_dtype=torch.float32).to(device)
    model.eval()
    processor = AutoProcessor.from_pretrained(MODEL_NAME)

    # Dummy image
    image = Image.new('RGB', (224, 224), color = (73, 109, 137))
    print("Processing...")
    inputs = processor(images=image, return_tensors="pt").to(device)

    print("Forward pass...")
    with torch.no_grad():
        embeddings = model(**inputs)
        print("Success!")
        print(f"Shape: {embeddings.shape}")
except Exception as e:
    import traceback
    print(f"FAILED: {e}")
    traceback.print_exc()
