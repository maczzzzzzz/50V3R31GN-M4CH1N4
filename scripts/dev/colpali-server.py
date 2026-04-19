import base64
import io
import os
import json
import uuid
import threading
from typing import Optional
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import torch

try:
    import torch_directml
    dml_available = True
except ImportError:
    dml_available = False

from colpali_engine.models import ColPali
from transformers import AutoProcessor

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Sovereign ColPali Server")

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", os.getcwd()))
INDEX_DIR = PROJECT_ROOT / "data" / "ingest" / "colpali_index"
INDEX_DIR.mkdir(parents=True, exist_ok=True)

MODEL_NAME = "vidore/colpali-v1.2"

# Determine device - FORCED CPU FOR STABILITY DURING AUDIT
device = torch.device("cpu")

model = None
processor = None
model_ready = False

def load_model_background():
    global model, processor, model_ready
    print(f"::/5Y573M-N071C3 : Loading ColPali ({MODEL_NAME}) on {device} (Background)...")
    try:
        # Use float32 on CPU for precision and compatibility
        dtype = torch.float32
        
        model = ColPali.from_pretrained(
            MODEL_NAME, 
            torch_dtype=dtype,
        ).to(device)
        model.eval()
        
        processor = AutoProcessor.from_pretrained(MODEL_NAME)
        model_ready = True
        print(f"  [SUCCESS] ColPali model ready on {device}.")
    except Exception as e:
        import traceback
        print(f"  [WARN] Failed to load model: {e}. Running in MOCK mode.")
        traceback.print_exc()

# Start background load
threading.Thread(target=load_model_background, daemon=True).start()

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

class EmbedRequest(BaseModel):
    page_id: str
    source_pdf: str
    page_number: int
    image_b64: Optional[str] = None
    text_hint: Optional[str] = None

class EmbedResponse(BaseModel):
    embedding_id: str
    vector_dim: int
    stored: bool

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/embed_patch", response_model=EmbedResponse)
async def embed_patch(req: EmbedRequest):
    import traceback
    try:
        embedding_id = f"emb_{uuid.uuid4().hex[:16]}"
        vectors = []

        if req.image_b64 and model_ready and model and processor:
            # Real embedding path
            image_data = base64.b64decode(req.image_b64)
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            
            # Ensure text_hint is not empty and has <image> tokens if needed
            text = req.text_hint if req.text_hint else "Describe this image."
            if "<image>" not in text:
                text = f"<image>{text}"

            # Process image through ColPali
            try:
                inputs = processor(text=text, images=image, return_tensors="pt").to(device)
            except Exception as pe:
                print(f"  [WARN] Processor failed: {pe}. Retrying without text.")
                inputs = processor(images=image, return_tensors="pt").to(device)

            with torch.no_grad():
                embeddings = model(**inputs)
                patch_embeddings = embeddings[0] # [n_patches, dim]
                vectors = patch_embeddings.cpu().float().numpy().tolist()
        else:
            # Mock or text-only path
            import numpy as np
            vectors = np.random.randn(10, 128).tolist()
            if not model_ready:
                embedding_id = f"mock_{embedding_id}"

        # Save to index directory for ZeroClaw MaxSim
        index_file = INDEX_DIR / f"{req.source_pdf}_p{req.page_number}.json"
        record = {
            "source_pdf": req.source_pdf,
            "page_number": req.page_number,
            "vectors": vectors
        }
        
        with open(index_file, "w") as f:
            json.dump(record, f)

        return EmbedResponse(
            embedding_id=embedding_id,
            vector_dim=len(vectors[0]) if vectors else 0,
            stored=True
        )
    except Exception as e:
        print(f"  [ERROR] Embed failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "online", 
        "device": str(device), 
        "model": MODEL_NAME,
        "model_ready": model_ready,
        "mode": "REAL" if model_ready else "MOCK"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)
