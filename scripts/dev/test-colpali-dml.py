import torch
import torch_directml
from PIL import Image
import io
import base64
from colpali_engine.models import ColPali
from transformers import AutoProcessor

device = torch_directml.device()
MODEL_NAME = "vidore/colpali-v1.2"

print(f"Loading model on {device}...")
model = ColPali.from_pretrained(MODEL_NAME, torch_dtype=torch.float32).to(device)
model.eval()
processor = AutoProcessor.from_pretrained(MODEL_NAME)

# Dummy image
image = Image.new('RGB', (224, 224), color = (73, 109, 137))
text = "<image>Describe this image."

print("Processing...")
inputs = processor(text=text, images=image, return_tensors="pt").to(device)

print("Forward pass...")
try:
    with torch.no_grad():
        embeddings = model(**inputs)
        print("Success!")
        print(f"Output shape: {embeddings.shape}")
except Exception as e:
    print(f"Failed: {e}")
