/**
 * PHASE 4 PRE-FLIGHT AUDIT: DATABASE STRESS & METADATA INTEGRITY
 * Target: Node A (Ubuntu Nitro 5 @ 192.168.0.50) via Headless SSH Key
 * Location: D:\asp-gm-agent\tests\db\phase4-preflight.ts
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const NODE_A_IP = "192.168.0.50";
const NODE_A_USER = "maczz";
// Correct relative path for local execution on Windows
const SERVER_PATH = "src/mcp/nitro-db/index.ts"; 

async function runAudit() {
  console.log("🏙️  STARTING PHASE 4 PRE-FLIGHT AUDIT...");
  console.log(`🔗 Target: ${NODE_A_USER}@${NODE_A_IP} | Script: ${SERVER_PATH}`);
  
  // 1. Establish the Bridge (Running MCP server locally, it connects to Node A DB)
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", SERVER_PATH]
  });

  const client = new Client({ name: "preflight-auditor", version: "1.0.0" }, { capabilities: {} });
  
  try {
    await client.connect(transport);
    console.log("✅ Bridge Established: Node B (Windows) -> Node A (Ubuntu)");

    // 2. TEST 1: The "Rapid-Fire" Concurrency Test (50 Requests)
    console.log("\n🧪 TEST 1: RAPID-FIRE ORACLE (50 Concurrent Calls)");
    const start = performance.now();
    
    const queries = Array.from({ length: 50 }).map(() => 
      (client as any).callTool({
        name: "rag_query",
        arguments: { 
          query: "Combat Difficulty Values", 
          namespace: "core_rules", 
          topK: 1 
        }
      })
    );

    const results = await Promise.allSettled(queries);
    const end = performance.now();
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const errors = results.filter(r => r.status === 'rejected');
    
    console.log(`⏱️  Total Time: ${(end - start).toFixed(2)}ms`);
    console.log(`📊 Average Latency: ${((end - start) / 50).toFixed(2)}ms per request`);
    console.log(`📈 Success Rate: ${successful}/50`);

    if (errors.length > 0) {
      console.log("⚠️  Connection Drops Detected. Check Node A Postgres pool.");
      console.error((errors[0] as any).reason);
    }

    // 3. TEST 2: The "Metadata Scour" (Mistral-Nemo Readiness)
    console.log("\n🧪 TEST 2: METADATA SCOUR (RAG Integrity Check)");
    
    const sample = await (client as any).callTool({
      name: "rag_query",
      arguments: { 
        query: "Full Auto Fire", 
        namespace: "core_rules", 
        topK: 1,
        similarityThreshold: 0.5
      }
    });

    const data = sample?.content?.[0]?.text;

    if (!data) {
      throw new Error("🔴 CRITICAL: Node A returned an empty or non-text response.");
    }

    // Checking for field names in the Markdown output
    const requirements = ["Namespace", "Source", "Type"];
    const missing = requirements.filter(req => !data.includes(req));

    if (missing.length === 0) {
      console.log("✅ Metadata Mandate Satisfied: All tags present.");
    } else {
      console.log(`❌ CRITICAL: Missing Tags: ${missing.join(", ")}`);
    }

    // 4. TEST 3: The "Zod Hammer" (Type Safety)
    console.log("\n🧪 TEST 3: ZOD HAMMER (Malformed Payload)");
    try {
      const response = await (client as any).callTool({
        name: "rag_query",
        arguments: { topK: "string_instead_of_number" } as any
      });
      
      if (response.isError) {
        console.log("✅ Zod Hammer Caught Error: Node A validation is locked (isError: true).");
      } else {
        console.log("❌ FAILURE: Node A accepted malformed JSON!");
      }
    } catch (e) {
      console.log("✅ Zod Hammer Caught Error: Node A validation is locked (Exception thrown).");
    }

  } catch (error) {
    console.error("\n🔴 BRIDGE FAILURE:", error);
    console.log(`Make sure the directory '/home/maczz/asp-gm-agent/src' exists on Node A and contains the necessary MCP source files.`);
  } finally {
    process.exit(0);
  }
}

runAudit();