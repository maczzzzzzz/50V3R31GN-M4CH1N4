#!/usr/bin/env python3
"""
Direct Backend Benchmark - bypasses LiteLLM router
Tests each mesh node directly for accurate throughput measurements.
"""
import json
import time
import requests
from datetime import datetime
from statistics import mean, stdev

# Direct backend endpoints (via socat bridges on localhost)
BACKENDS = {
    "mesh-fast": {"url": "http://localhost:8081/v1", "model": "Qwopus3.5-9B-Coder-Q8_0.gguf"},
    "mesh-vision": {"url": "http://localhost:8082/v1", "model": "Qwen3-VL-2B-Instruct-Q6_K.gguf"},
    "mesh-heavy": {"url": "http://localhost:18080/v1", "model": "Qwen3.5-35B-A3B-MTP-UD-Q4_K_M.gguf"},
    "mesh-function-calling": {"url": "http://localhost:18081/v1", "model": "/home/maczz/ik_llama.cpp/models/Carnice-9B-Function-Calling-xLAM-Unsloth.i1-Q4_K_M.gguf"},
    "mesh-micro": {"url": "http://localhost:17080/v1", "model": "Qwen3-0.6B-Q8_0.gguf"},
}

PROMPTS = {
    "short": "Write a haiku about machine learning.",
    "medium": "Explain speculative decoding in llama.cpp in 3 sentences.",
}

def benchmark(backend_name: str, prompt_type: str, passes: int = 3, max_tokens: int = 100) -> dict:
    backend = BACKENDS[backend_name]
    url = f"{backend['url']}/chat/completions"
    model = backend['model']
    prompt = PROMPTS[prompt_type]
    
    results = []
    print(f"  {backend_name} ({prompt_type}, {passes} passes)...")
    
    for i in range(passes):
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }
        
        try:
            start = time.perf_counter()
            resp = requests.post(url, json=payload, timeout=120)
            elapsed = time.perf_counter() - start
            
            if resp.status_code != 200:
                print(f"    Pass {i+1}: ERROR {resp.status_code} - {resp.text[:80]}")
                continue
            
            data = resp.json()
            usage = data.get("usage", {})
            timings = data.get("timings", {})
            
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            
            # Use timings from llama-server if available (more accurate)
            if timings:
                prompt_tps = timings.get("prompt_per_second", 0)
                gen_tps = timings.get("predicted_per_second", 0)
            else:
                prompt_tps = prompt_tokens / elapsed if elapsed > 0 else 0
                gen_tps = completion_tokens / elapsed if elapsed > 0 else 0
            
            result = {
                "pass": i + 1,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_time_s": round(elapsed, 3),
                "prompt_tps": round(prompt_tps, 2) if isinstance(prompt_tps, float) else prompt_tps,
                "gen_tps": round(gen_tps, 2) if isinstance(gen_tps, float) else gen_tps,
            }
            results.append(result)
            print(f"    Pass {i+1}: {result['gen_tps']:.1f} gen t/s, {result['prompt_tps']:.1f} prompt t/s")
            
        except Exception as e:
            print(f"    Pass {i+1}: ERROR - {str(e)[:60]}")
        
        time.sleep(0.3)
    
    if not results:
        return {"backend": backend_name, "prompt_type": prompt_type, "error": "All passes failed"}
    
    return {
        "backend": backend_name,
        "prompt_type": prompt_type,
        "passes": len(results),
        "avg_gen_tps": round(mean(r["gen_tps"] for r in results), 2),
        "avg_prompt_tps": round(mean(r["prompt_tps"] for r in results), 2),
        "avg_completion_tokens": round(mean(r["completion_tokens"] for r in results), 1),
        "raw_results": results,
    }

def main():
    print(f"\n{'='*60}")
    print(f"DIRECT BACKEND BENCHMARK - {datetime.now().isoformat()}")
    print(f"{'='*60}\n")
    
    all_results = {"timestamp": datetime.now().isoformat(), "backends": []}
    
    for backend_name in BACKENDS:
        print(f"\n[{backend_name}]")
        backend_results = {"name": backend_name, "tests": []}
        
        for prompt_type in ["short", "medium"]:
            result = benchmark(backend_name, prompt_type, passes=3, max_tokens=100)
            backend_results["tests"].append(result)
        
        valid = [t for t in backend_results["tests"] if "avg_gen_tps" in t and "error" not in t]
        if valid:
            backend_results["summary"] = {
                "avg_gen_tps": round(mean(t["avg_gen_tps"] for t in valid), 2),
                "avg_prompt_tps": round(mean(t["avg_prompt_tps"] for t in valid), 2),
            }
            print(f"  SUMMARY: {backend_results['summary']['avg_gen_tps']:.1f} gen t/s, {backend_results['summary']['avg_prompt_tps']:.1f} prompt t/s")
        
        all_results["backends"].append(backend_results)
    
    # Summary table
    print(f"\n{'='*60}")
    print("MESH THROUGHPUT SUMMARY")
    print(f"{'='*60}")
    print(f"{'Backend':<25} {'Gen t/s':>10} {'Prompt t/s':>12}")
    print("-" * 50)
    for b in all_results["backends"]:
        s = b.get("summary", {})
        print(f"{b['name']:<25} {s.get('avg_gen_tps', 0):>10.1f} {s.get('avg_prompt_tps', 0):>12.1f}")
    
    # Save
    output_path = f"docs/benchmarks/direct-backend-{datetime.now().strftime('%Y-%m-%d')}.json"
    with open(output_path, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"\nResults saved to: {output_path}")

if __name__ == "__main__":
    main()
