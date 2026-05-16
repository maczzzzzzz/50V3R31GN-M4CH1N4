# Kanban MCP Server

MCP (Model Context Protocol) server wrapping the Hermes Kanban SQLite database. Enables bidirectional task coordination between Hermes and Gemini CLI (or any MCP-compatible agent).

## Architecture

```
Hermes CLI  ←stdio→  Kanban MCP Server  ←stdio→  Gemini CLI
                              │
                        kanban.db (SQLite WAL)
```

Local-only. No network transport. stdio only. No schema migration -- reads/writes the native Hermes kanban structure.

## Tools

| Tool | Description |
|:-----|:------------|
| `kanban_list_boards` | List available kanban boards |
| `kanban_list_tasks` | List tasks with optional filters (status, assignee, priority) |
| `kanban_get_task` | Get task details including comments |
| `kanban_create_task` | Create a new task |
| `kanban_update_task` | Update task fields |
| `kanban_claim_task` | Claim a task with expiring lock (prevents duplicate work) |
| `kanban_complete_task` | Mark task completed with optional result |
| `kanban_add_comment` | Add a comment for cross-agent discussion |

## Setup

```bash
cd sidecars/kanban-mcp-server
python3 -m venv .venv
.venv/bin/pip install -e .
```

## Hermes Integration

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  kanban:
    command: /path/to/kanban-mcp-server/.venv/bin/python
    args: ["-m", "kanban_mcp.server"]
    env:
      HERMES_KANBAN_ROOT: ~/.hermes/kanban/boards
```

## Gemini CLI Integration

Add to `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "kanban": {
      "command": "/path/to/kanban-mcp-server/.venv/bin/python",
      "args": ["-m", "kanban_mcp.server"],
      "env": {
        "HERMES_KANBAN_ROOT": "~/.hermes/kanban/boards"
      }
    }
  }
}
```

## Testing

```bash
PYTHONPATH=src .venv/bin/pytest tests/ -v
```

## Concurrency

SQLite WAL mode enables safe concurrent reads. Write contention is managed by claim locks with TTL expiration. Short transactions keep write windows minimal.

---
::/5Y573M-N071C3 : KANBAN_MCP_V0.1. COORDINATION_IS_TRUTH. // 50V3R31GN-M4CH1N4
