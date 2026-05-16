"""
NODESTADT Mesh Proxy -- Lightweight OpenAI-compatible router.
Routes requests to the correct inference node based on model name.
No Prisma, no DB, no bullshit.
"""
import json
import time
from fastapi import FastAPI, Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, JSONResponse
import httpx
import uvicorn

app = FastAPI(title="NODESTADT Mesh Proxy")
security = HTTPBearer()

MASTER_KEY = "sk-sov...roxy"

# Mesh routing table
MESH = {
    "mesh-fast": {
        "url": "http://10.0.0.11:8081",
        "upstream_model": "NousResearch_Hermes-4-14B-Q4_K_M.gguf",
        "node": "B (Director)",
    },
    "mesh-function-calling": {
        "url": "http://100.102.109.81:8081",
        "upstream_model": "/home/maczz/ik_llama.cpp/models/Carnice-9B-Function-Calling-xLAM-Unsloth.i1-Q4_K_M.gguf",
        "node": "C (Oracle)",
    },
    "mesh-heavy": {
        "url": "http://100.120.225.12:8080",
        "upstream_model": "Carnice-Qwen3.6-MoE-35B-A3B-Q4_K_M.gguf",
        "node": "D (Quaternary)",
    },
}

ALIASES = {
    "hermes-4-14b": "mesh-fast",
    "carnice-9b-fc": "mesh-function-calling",
    "carnice-qwen3.6-moe-35b-a3b": "mesh-heavy",
    "fast": "mesh-fast",
    "fc": "mesh-function-calling",
    "heavy": "mesh-heavy",
}

def resolve_model(model_name: str) -> tuple:
    """Resolve model name to (endpoint_config, canonical_name)."""
    canonical = ALIASES.get(model_name, model_name)
    if canonical not in MESH:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model_name}")
    return MESH[canonical], canonical

async def verify_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != MASTER_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return credentials.credentials

@app.get("/health")
async def health():
    return {"status": "ok", "mesh_nodes": len(MESH)}

@app.get("/v1/models")
async def list_models():
    models = []
    for name, cfg in MESH.items():
        models.append({
            "id": name,
            "object": "model",
            "owned_by": f"nodestadt-{cfg['node'].split()[0].lower()}",
        })
    for alias in ALIASES:
        if alias not in MESH:
            models.append({"id": alias, "object": "model", "owned_by": "nodestadt"})
    return {"object": "list", "data": models}

@app.post("/v1/chat/completions")
async def chat_completions(request: Request, key: str = Security(verify_key)):
    body = await request.json()
    model_name = body.get("model", "")
    cfg, canonical = resolve_model(model_name)

    # Route to upstream
    upstream_body = {**body, "model": cfg["upstream_model"]}
    upstream_url = f"{cfg['url']}/v1/chat/completions"

    # Check if streaming
    stream = body.get("stream", False)

    async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
        if stream:
            async def stream_response():
                async with client.stream("POST", upstream_url, json=upstream_body) as resp:
                    async for chunk in resp.aiter_bytes():
                        yield chunk
            return StreamingResponse(stream_response(), media_type="text/event-stream")
        else:
            resp = await client.post(upstream_url, json=upstream_body)
            result = resp.json()
            # Rewrite model name back to canonical
            if "model" in result:
                result["model"] = canonical
            return JSONResponse(content=result, status_code=resp.status_code)

@app.post("/v1/completions")
async def completions(request: Request, key: str = Security(verify_key)):
    body = await request.json()
    model_name = body.get("model", "")
    cfg, canonical = resolve_model(model_name)

    upstream_body = {**body, "model": cfg["upstream_model"]}
    upstream_url = f"{cfg['url']}/v1/completions"

    stream = body.get("stream", False)

    async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
        if stream:
            async def stream_response():
                async with client.stream("POST", upstream_url, json=upstream_body) as resp:
                    async for chunk in resp.aiter_bytes():
                        yield chunk
            return StreamingResponse(stream_response(), media_type="text/event-stream")
        else:
            resp = await client.post(upstream_url, json=upstream_body)
            result = resp.json()
            if "model" in result:
                result["model"] = canonical
            return JSONResponse(content=result, status_code=resp.status_code)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
