from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
import sys
import time

app = FastAPI()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: list[Message]
    max_tokens: int | None = None

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatRequest):
    print(f"[MOCK LLM] Received request for model: {req.model}", file=sys.stderr)
    
    tier = "Unknown"
    node = "Unknown"
    
    if "brain" in req.model.lower():
        tier = "Tier 1 (Instant)"
        node = "Node B (Director)"
    elif "qwen" in req.model.lower():
        tier = "Tier 2 (Strategic)"
        node = "Node D (Core)"

    response_content = f"<think>\nProcessing route via {node}...\n</think>\nMesh Dry Run Acknowledged. I am {node} operating at {tier}."
    
    return {
        "id": "chatcmpl-mock123",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": req.model,
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": response_content
            },
            "finish_reason": "stop"
        }],
        "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"[MOCK LLM] Starting mock server on port {port}", file=sys.stderr)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="error")
