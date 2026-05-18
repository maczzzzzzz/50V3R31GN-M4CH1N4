#!/usr/bin/env python3
"""
Minimal Sovereign Mesh Router
Single-file OpenAI-compatible proxy for the NODESTADT mesh.
No database. No Prisma. Just model name routing.
"""

import os
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import json

app = FastAPI(title="Sovereign Mesh Router", version="0.1.0")

# Model -> Backend mapping (edit as nodes change)
ROUTES = {
    "mesh-fast": {
        "url": "http://10.0.0.11:8081/v1",
        "api_key": "machina-internal-mesh-key-2026",
    },
    "mesh-vision": {
        "url": "http://10.0.0.11:8082/v1",
        "api_key": "machina-internal-mesh-key-2026",
    },
    "mesh-function-calling": {
        "url": "http://100.102.109.81:8081/v1",  # Node C direct Tailscale
        "api_key": "machina-internal-mesh-key-2026",
    },
    "mesh-heavy": {
        "url": "http://100.120.225.12:8080/v1",  # Node D direct Tailscale
        "api_key": "machina-internal-mesh-key-2026",
    },
    "mesh-micro": {
        "url": "http://100.96.253.114:8080/v1",  # Node A direct Tailscale
        "api_key": "machina-internal-mesh-key-2026",
    },
}

# Aliases for convenience (same as old litellm router_settings)
ALIASES = {
    "fast": "mesh-fast",
    "vision": "mesh-vision",
    "vl": "mesh-vision",
    "fc": "mesh-function-calling",
    "function-calling": "mesh-function-calling",
    "heavy": "mesh-heavy",
    "micro": "mesh-micro",
    "classify": "mesh-micro",
}

client = httpx.AsyncClient(timeout=300.0)


def resolve_model(model: str) -> str:
    return ALIASES.get(model, model)


@app.get("/v1/models")
async def list_models():
    models = []
    for name in ROUTES.keys():
        models.append({
            "id": name,
            "object": "model",
            "owned_by": "nodestadt-mesh",
            "permission": []
        })
    return {"object": "list", "data": models}


@app.post("/v1/chat/completions")
@app.post("/v1/completions")
async def proxy(request: Request):
    body = await request.json()
    model = body.get("model", "")
    model = resolve_model(model)

    if model not in ROUTES:
        raise HTTPException(status_code=404, detail=f"Model {model} not found in mesh")

    route = ROUTES[model]
    target_url = f"{route['url']}{request.url.path}"

    headers = {
        "Authorization": f"Bearer {route['api_key']}",
        "Content-Type": "application/json",
    }

    # Forward the request
    try:
        if body.get("stream", False):
            async def stream():
                async with client.stream(
                    "POST", target_url, json=body, headers=headers
                ) as resp:
                    async for chunk in resp.aiter_bytes():
                        yield chunk
            return StreamingResponse(stream(), media_type="text/event-stream")
        else:
            resp = await client.post(target_url, json=body, headers=headers)
            return JSONResponse(content=resp.json(), status_code=resp.status_code)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Backend error: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok", "models": list(ROUTES.keys())}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4000)