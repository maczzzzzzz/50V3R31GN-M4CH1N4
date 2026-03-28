**Orchestrator Setup Guide**
**File:** `LOCAL_SETUP.md`  
**Location:** `/asp-gm-agent/docs/LOCAL_SETUP.md`

```markdown
# Node B: Orchestrator Setup Guide
**Target:** Main Rig (Narrative & State Control)

## 1. Repository Initialization
1. **Install Core Dependencies:**
   ```bash
   npm install @modelcontextprotocol/sdk zod
   npm install -D typescript @types/node tsx vitest
Project Structure:
Ensure src/mcp, src/core, and docs/raw_data directories exist as defined in the Architecture Spec.

2. Agent Skill Injection (MCP)
Claude requires specific global tools to operate within the project architecture. Run these in your terminal:

Bash
# Cross-session memory
claude mcp add memory npx -y @modelcontextprotocol/server-memory

# Logic & TDD planning
claude mcp add sequential-thinking npx -y @modelcontextprotocol/server-sequential-thinking

# Web/Docs fetching
claude mcp add fetch npx -y @modelcontextprotocol/server-fetch
3. The Handshake Protocol
Open CLAUDE.md and update the NODE_A_IP variable to 192.168.0.50.

Launch claude.

Paste the System Initialization Protocol (found in IMPLEMENTATION_PLAN.md) as your first prompt.

4. Verification
Run the API ping from Node B to ensure the bridge is open:

Bash
curl [http://192.168.0.50:8080/v1/models](http://192.168.0.50:8080/v1/models)

---

### **4. Troubleshooting Matrix**
**File:** `TROUBLESHOOTING.md`  
**Location:** `/asp-gm-agent/docs/TROUBLESHOOTING.md`

```markdown
# ASP.GM-Agent Troubleshooting Matrix

| Issue | Potential Cause | Resolution |
| :--- | :--- | :--- |
| `Connection Reset` | Server suspended / Lid event | Re-verify `HandleLidSwitch` in `logind.conf`. |
| `Connection Refused` | Engine not running | SSH into Node A and run `pm2 status`. |
| Math Hallucinations | Missing "Chain of Thought" | Verify `nitro-logic` is appending the CoT suffix to prompts. |
| VRAM Overflow | Context too large / Parallelism | Ensure `-np 1` is set in the Node A startup script. |
| RAG contamination | Missing Namespace | Ensure `nitro-db` queries are filtered by the correct metadata namespace. |