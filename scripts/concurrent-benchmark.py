#!/usr/bin/env python3
"""
Concurrent benchmark for continuous batching comparison.
Tests throughput under parallel request load.
"""
import asyncio
import aiohttp
import json
import time
from datetime import datetime
from statistics import mean

BACKENDS = {
    "mesh-fast": {"url": "http://localhost:8081/v1", "model": "Qwopus3.5-9B-Coder-Q8_0.gguf"},
    "mesh-vision": {"url": "http://localhost:8082/v1", "model": "Qwen3-VL-2B-Instruct-Q6_K.gguf"},
}

PROMPT = "Write a short poem about AI. Keep it to 4 lines."

async def make_request(session, backend_name, request_id, max_tokens=50):
    backend = BACKENDS[backend_name]
    url = f"{backend['url']}/chat/completions"
    
    payload = {
        "model": backend['model'],
        "messages": [{"role": "user", "content": PROMPT}],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    
    start = time.perf_counter()
    try:
        async with session.post(url, json=payload, timeout=60) as resp:
            data = await resp.json()
            elapsed = time.perf_counter() - start
            
            if resp.status != 200:
                return {"id": request_id, "error": f"HTTP {resp.status}", "time": elapsed}
            
            usage = data.get("usage", {})
            timings = data.get("timings", {})
            gen_tps = timings.get("predicted_per_second", 0) if timings else 0
            
            return {
                "id": request_id,
                "time": round(elapsed, 3),
                "tokens": usage.get("completion_tokens", 0),
                "gen_tps": round(gen_tps, 2),
            }
    except Exception as e:
        return {"id": request_id, "error": str(e)[:50], "time": time.perf_counter() - start}

async def benchmark_concurrent(backend_name, num_requests=8, max_tokens=50):
    print(f"\n[{backend_name}] {num_requests} concurrent requests...")
    
    connector = aiohttp.TCPConnector(limit=num_requests + 2)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [
            make_request(session, backend_name, i, max_tokens)
            for i in range(num_requests)
        ]
        
        start = time.perf_counter()
        results = await asyncio.gather(*tasks)
        total_time = time.perf_counter() - start
        
        success = [r for r in results if "error" not in r]
        errors = [r for r in results if "error" in r]
        
        if success:
            total_tokens = sum(r["tokens"] for r in success)
            avg_gen_tps = mean(r["gen_tps"] for r in success if r["gen_tps"] > 0)
            
            # Effective throughput = total tokens / total wall time
            effective_tps = round(total_tokens / total_time, 2) if total_time > 0 else 0.0
            
            print(f"  Completed: {len(success)}/{num_requests} in {total_time:.2f}s")
            print(f"  Total tokens: {total_tokens}")
            print(f"  Effective throughput: {effective_tps:.1f} tokens/s (wall time)")
            print(f"  Avg gen t/s per request: {avg_gen_tps:.1f}")
        else:
            print(f"  ALL FAILED: {errors}")
        
        return {
            "backend": backend_name,
            "concurrent": num_requests,
            "total_time": round(total_time, 2),
            "success": len(success),
            "total_tokens": sum(r.get("tokens", 0) for r in success),
            "effective_tps": round(effective_tps, 2) if success else 0,
            "errors": len(errors),
        }

async def main():
    print(f"\n{'='*60}")
    print(f"CONCURRENT BENCHMARK - {datetime.now().isoformat()}")
    print(f"Tests continuous batching effectiveness")
    print(f"{'='*60}")
    
    results = []
    
    # Test with increasing concurrency
    for concurrency in [1, 2, 4, 8]:
        print(f"\n--- Concurrency: {concurrency} ---")
        for backend in BACKENDS:
            result = await benchmark_concurrent(backend, num_requests=concurrency)
            results.append({"concurrency": concurrency, **result})
    
    # Summary
    print(f"\n{'='*60}")
    print("THROUGHPUT VS CONCURRENCY")
    print(f"{'='*60}")
    print(f"{'Backend':<15} {'Concurrent':>10} {'Eff t/s':>10} {'Total tok':>10}")
    print("-" * 50)
    for r in results:
        print(f"{r['backend']:<15} {r['concurrent']:>10} {r['effective_tps']:>10.1f} {r['total_tokens']:>10}")
    
    # Save
    output = {
        "timestamp": datetime.now().isoformat(),
        "results": results,
    }
    path = f"docs/benchmarks/concurrent-{datetime.now().strftime('%Y-%m-%d')}.json"
    with open(path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nSaved: {path}")

if __name__ == "__main__":
    asyncio.run(main())
