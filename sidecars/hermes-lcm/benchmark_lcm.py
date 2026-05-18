#!/usr/bin/env python3
"""Phase 0-style benchmark for Hermes-LCM vendored implementation"""
import time
import sqlite3
import tempfile
import os
from pathlib import Path

# Minimal import of the provider
import sys
sys.path.insert(0, str(Path(__file__).parent))
from hermes_lcm_provider import HermesLCMProvider  # assuming class exists

def benchmark_lcm():
    print("=== Hermes-LCM First Benchmarks ===")
    print(f"Python: {sys.version}")
    
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "lcm_bench.db")
        
        # Initialize (adjust to actual class if different)
        try:
            lcm = HermesLCMProvider(db_path=db_path, max_context_tokens=128000)
        except Exception as e:
            print(f"Init failed: {e}")
            # Fallback to raw SQLite timing
            return raw_sqlite_benchmark(db_path)
        
        # TODO: Implement real tests once class API known
        print("Provider loaded. Running basic timing...")

def raw_sqlite_benchmark(db_path):
    """Fallback raw timing for core operations"""
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS blocks 
                 (id TEXT, semantic TEXT, context TEXT, ts REAL)''')
    
    # Insert latency (100 blocks)
    start = time.perf_counter()
    for i in range(100):
        c.execute("INSERT INTO blocks VALUES (?, ?, ?, ?)", 
                  (f"id{i}", f"semantic{i}", "context data " * 20, time.time()))
    conn.commit()
    insert_ms = (time.perf_counter() - start) * 1000 / 100
    print(f"Insert latency (avg per block): {insert_ms:.2f} ms")
    
    # Query latency
    start = time.perf_counter()
    for _ in range(50):
        c.execute("SELECT * FROM blocks WHERE semantic LIKE '%10%'")
        c.fetchall()
    query_ms = (time.perf_counter() - start) * 1000 / 50
    print(f"Query latency (avg): {query_ms:.2f} ms")
    
    conn.close()
    print("Raw SQLite baseline complete.")

if __name__ == "__main__":
    benchmark_lcm()
