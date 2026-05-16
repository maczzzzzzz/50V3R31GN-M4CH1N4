# Implementation Plan: Shared Kanban MCP Server

**Date:** 2026-05-14
**Status:** PLANNING
**Phase:** Cross-cutting (Phase 1 dependency)
**Assignee:** Lead Architect (Hermes)
**Reviewer:** Sovereign Strategist (Gemini CLI)

---

## Problem

Hermes and Gemini CLI operate as isolated agents with no shared task state. Hermes uses a SQLite-backed kanban (`~/.hermes/kanban/boards/`). Gemini CLI has no task persistence. Coordination currently requires the human to manually relay context between agents.

## Solution

Build a lightweight MCP (Model Context Protocol) server that wraps the existing Hermes Kanban SQLite database, exposing task CRUD operations as MCP tools. Both Hermes and Gemini CLI connect to this server as MCP clients, enabling bidirectional task coordination.

## Architecture

```
┌─────────────┐     MCP/stdio      ┌──────────────────┐
│  Hermes CLI  │◄──────────────────►│                  │
└─────────────┘                     │  Kanban MCP      │
                                    │  Server           │
┌─────────────┐     MCP/stdio      │  (FastMCP)        │
│  Gemini CLI  │◄──────────────────►│                  │
└─────────────┘                     └────────┬─────────┘
                                             │
                                    SQLite   │
                                    ┌────────▼─────────┐
                                    │  kanban.db        │
                                    │  (Hermes native)  │
                                    └──────────────────┘
```

## Existing Schema (Hermes Kanban)

The `tasks` table already contains:
- `id`, `title`, `body`, `status`, `priority`
- `assignee`, `claim_lock`, `claim_expires`
- `created_by`, `created_at`
- `result`, `workspace_kind`, `workspace_path`

No schema migration required. The MCP server is a thin read/write layer over the existing structure.

## Tasks

### T-001: Scaffold MCP Server
- Create `sidecars/kanban-mcp-server/` in project root
- Use FastMCP (Python) with stdio transport
- Define tool signatures for: `list_tasks`, `get_task`, `create_task`, `update_task`, `claim_task`, `complete_task`, `add_comment`
- Wire to `~/.hermes/kanban/boards/<board>/kanban.db`
- Add `pyproject.toml` with dependencies: `fastmcp`, `sqlite3` (stdlib)

### T-002: Hermes Integration
- Add MCP server config to `~/.hermes/config.yaml` under `mcp_servers`
- Verify Hermes discovers kanban tools at startup
- Test bidirectional: Hermes creates task, reads it back via MCP

### T-003: Gemini CLI Integration
- Add MCP server config to `.gemini/settings.json`
- Verify Gemini CLI discovers kanban tools
- Test: Gemini reads Hermes-created tasks, adds comments

### T-004: Documentation
- Document MCP server in `docs/nodestadt/architecture/`
- Update `KANBAN_MAP.md` with cross-agent coordination notes
- Update `repository-map.html` if applicable

## File Layout

```
sidecars/kanban-mcp-server/
├── pyproject.toml
├── README.md
├── src/
│   └── kanban_mcp/
│       ├── __init__.py
│       ├── server.py          # FastMCP app + tool definitions
│       └── db.py              # SQLite connection + queries
└── tests/
    └── test_tools.py
```

## Constraints

- **Local-only.** No network transport. stdio only.
- **No schema migration.** Read/write existing Hermes kanban schema.
- **Board-aware.** Server accepts board name as config, defaults to `default`.
- **Lock-safe.** Respect `claim_lock` / `claim_expires` for concurrent agent access.
- **NixOS compatible.** No binary dependencies beyond Python stdlib + FastMCP.

## Risks

| Risk | Mitigation |
|:-----|:-----------|
| SQLite write contention between Hermes core and MCP server | SQLite WAL mode (default in Hermes). Short transactions. |
| FastMCP binary deps on NixOS | FastMCP is pure Python. Test in venv first. |
| Hermes kanban schema changes upstream | Pin to current schema, add version check on startup. |

---
::/5Y573M-N071C3 : MCP_PLAN_V1. COORDINATION_IS_TRUTH. // 50V3R31GN-M4CH1N4
