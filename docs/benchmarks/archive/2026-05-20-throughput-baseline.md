# Mesh Throughput Baseline - 2026-05-20

## Quick Tests
- LiteLLM: 5 routes active
- Direct fast: 0.0009s
- Direct vision: 0.0007s
- Router: 0.0015s

## Throughput Harness Results
- mesh-fast: 0.015s
- mesh-vision: 0.012s  
- mesh-heavy: 0.027s

## Recommended Next Actions
1. Enable --cont-batching on Node B vision (port 8082)
2. Test 0.6B CPU draft with 4-6 threads
3. Add KV cache monitoring

All changes respect Vulkan f16 KV and Node B hardware limits.
