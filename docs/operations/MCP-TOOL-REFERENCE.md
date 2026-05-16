# MCP Tool Reference Card

## CodeGraph-Rust MCP Tools

### agentic_context (HIGH PRIORITY)
```bash
# Use when: You need semantic understanding of code relationships
agentic_context "Show me how authentication flows through the mesh"
agentic_context "Why is the LiteLLM proxy configured this way?"
agentic_context "What are the entry points for the mirage-vfs module?"
```
**Replaces:** Manual grep + piecing together relationships
**Gap:** Native search_files finds patterns but doesn't understand call chains, dependencies, or architectural intent

### agentic_impact (HIGH PRIORITY)
```bash
# Use when: You're making a change and want to know what breaks
agentic_impact "What depends on the LiteLLM proxy configuration?"
agentic_impact "If I change directors-forge API, what's the impact?"
agentic_impact "What modules use the Tailscale artery functions?"
```
**Replaces:** Manual dependency tracking
**Gap:** No native dependency analysis or impact mapping

### agentic_architecture (MEDIUM PRIORITY)
```bash
# Use when: You need to understand system structure or boundaries
agentic_architecture "What are the module boundaries in 50V3R31GN-M4CH1N4?"
agentic_architecture "Show me the mesh routing architecture"
agentic_architecture "How do the Rust crates interact with Hermes Agent?"
```
**Replaces:** Manual documentation reading + mental model building
**Gap:** No native architectural pattern recognition

### agentic_quality (MEDIUM PRIORITY)
```bash
# Use when: You need to refactor or understand code complexity
agentic_quality "What are the most complex functions in this crate?"
agentic_quality "Where should I focus refactoring efforts?"
agentic_quality "Show me coupling hotspots between modules"
```
**Replaces:** Manual line counting + code reading
**Gap:** No native complexity analysis or metrics

---

## Native Tools to Keep Using

### search_files
```bash
# Use when: Fast pattern finding, simple grep
search_files "LiteLLM" target="content"
search_files "*.py" target="files"
```
**Advantage:** Fast, ripgrep-backed, good for simple patterns

### read_file
```bash
# Use when: Direct file access
read_file path="crates/modules/directors-forge/src/main.rs"
```
**Advantage:** Direct, low-overhead, no abstraction

### terminal
```bash
# Use when: Build, test, deployment, system operations
terminal command="cargo build --release"
```
**Advantage:** Full shell access, complete control

### execute_code
```bash
# Use when: Scripted operations, complex data processing
execute_code code="import json; print(json.dumps(data))"
```
**Advantage:** Python scripting with hermes_tools integration

### session_search
```bash
# Use when: Cross-session memory retrieval
session_search query="LiteLLM proxy setup"
```
**Advantage:** Hermes native, covers all past conversations

### delegate_task
```bash
# Use when: Parallel independent work
delegate_task tasks=[{goal:"Task A"}, {goal:"Task B"}]
```
**Advantage:** Parallel execution, isolated contexts

---

## Tool Selection Heuristic

**Use Native Tools When:**
- Simple file operations (read, write, search)
- Build/test/deployment (terminal)
- Scripted workflows (execute_code)
- Cross-session memory (session_search)
- Parallel work (delegate_task)

**Use CodeGraph Tools When:**
- Semantic code understanding (agentic_context)
- Dependency/impact analysis (agentic_impact)
- Architectural questions (agentic_architecture)
- Code quality/refactoring (agentic_quality)

---

## Tool Combinations

**Common Pattern: Context + Impact**
```bash
# Understand current state
agentic_context "How does the mesh routing work?"

# Plan a change
agentic_impact "What if I change the routing rules?"

# Implement
terminal command="edit config file"

# Verify
agentic_quality "Did this introduce complexity?"
```

**Common Pattern: Architecture + Quality**
```bash
# Understand boundaries
agentic_architecture "What are the module boundaries?"

# Find hotspots
agentic_quality "What are the most complex functions?"

# Refactor
# (use native tools)
```

---

## Performance Notes

**CodeGraph Tools:**
- Use tier-aware prompting (adjusts based on model context window)
- Maximum 8 steps (prevents runaway costs)
- Context overflow protection (truncates large results)
- Agentic reasoning (plans, searches, analyzes, synthesizes)

**Native Tools:**
- No token overhead
- Instant response
- Direct control
- Lower-level abstraction

**Decision Rule:**
- Quick, simple tasks → Native tools
- Complex, semantic tasks → CodeGraph tools
- Hybrid workflows → Combine both
