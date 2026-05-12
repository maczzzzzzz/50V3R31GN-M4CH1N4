import httpx
import json

url = "http://127.0.0.1:8081/v1/chat/completions"
payload = {
    "model": "brain-9b",
    "messages": [{"role": "user", "content": "hi"}],
    "stream": True
}

print(":: Testing local stream on Node D...")
with httpx.stream("POST", url, json=payload, timeout=30.0) as resp:
    print(f":: Status: {resp.status_code}")
    for line in resp.iter_lines():
        print(f"DEBUG: {line}")
