"""
Kanban MCP Server -- SQLite database layer.
Reads/writes the native Hermes kanban.db schema.
No migrations. Pure query wrapper.
"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_BOARD = "default"
KANBAN_ROOT = Path(os.environ.get("HERMES_KANBAN_ROOT", Path.home() / ".hermes" / "kanban" / "boards"))

# Direct override: if set, always use this path regardless of board arg.
# Matches Hermes native kanban_db.py behaviour (HERMES_KANBAN_DB env var).
_KANBAN_DB_OVERRIDE = os.environ.get("HERMES_KANBAN_DB", "").strip()


def _db_path(board: str = DEFAULT_BOARD) -> Path:
    if _KANBAN_DB_OVERRIDE:
        return Path(_KANBAN_DB_OVERRIDE).expanduser()
    # Back-compat: Hermes stores the default board at <root>/kanban.db
    # (not <root>/kanban/boards/default/kanban.db).
    if board == DEFAULT_BOARD:
        back_compat = Path.home() / ".hermes" / "kanban.db"
        if back_compat.exists():
            return back_compat
    return KANBAN_ROOT / board / "kanban.db"


def _ensure_board(board: str) -> Path:
    """Ensure the board directory and database exist. Returns db path."""
    db = _db_path(board)
    # If using override or back-compat path, the DB already exists.
    if _KANBAN_DB_OVERRIDE or (board == DEFAULT_BOARD and db.exists()):
        return db
    if not db.parent.exists():
        db.parent.mkdir(parents=True, exist_ok=True)
    if not db.exists():
        conn = sqlite3.connect(str(db))
        conn.executescript(SCHEMA)
        conn.close()
    return db


SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    assignee TEXT DEFAULT NULL,
    claim_lock TEXT DEFAULT NULL,
    claim_expires TEXT DEFAULT NULL,
    created_by TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    result TEXT DEFAULT NULL,
    workspace_kind TEXT DEFAULT NULL,
    workspace_path TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS task_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    actor TEXT DEFAULT NULL,
    payload TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
"""


@contextmanager
def _connect(board: str = DEFAULT_BOARD):
    db = _ensure_board(board)
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# --- Query Functions ---


def list_tasks(
    board: str = DEFAULT_BOARD,
    status: str | None = None,
    assignee: str | None = None,
    priority: int | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    with _connect(board) as conn:
        clauses: list[str] = []
        params: list[Any] = []
        if status:
            clauses.append("status = ?")
            params.append(status)
        if assignee:
            clauses.append("assignee = ?")
            params.append(assignee)
        if priority is not None:
            clauses.append("priority = ?")
            params.append(priority)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        rows = conn.execute(
            f"SELECT * FROM tasks {where} ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?",
            params + [limit, offset],
        ).fetchall()
        return [_row_to_dict(r) for r in rows]


def get_task(task_id: str, board: str = DEFAULT_BOARD) -> dict[str, Any] | None:
    with _connect(board) as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not row:
            return None
        task = _row_to_dict(row)
        # Attach comments
        comments = conn.execute(
            "SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC",
            (task_id,),
        ).fetchall()
        task["comments"] = [_row_to_dict(c) for c in comments]
        return task


def create_task(
    id: str,
    title: str,
    board: str = DEFAULT_BOARD,
    body: str = "",
    status: str = "pending",
    priority: int = 5,
    assignee: str | None = None,
    created_by: str | None = None,
) -> dict[str, Any]:
    with _connect(board) as conn:
        now = _now_iso()
        conn.execute(
            """INSERT INTO tasks (id, title, body, status, priority, assignee, created_by, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (id, title, body, status, priority, assignee, created_by, now),
        )
        return {"id": id, "title": title, "status": status, "created_at": now}


def update_task(
    task_id: str,
    board: str = DEFAULT_BOARD,
    **fields: Any,
) -> dict[str, Any] | None:
    """Update arbitrary fields on a task. Returns updated task or None if not found."""
    allowed = {
        "title", "body", "status", "priority", "assignee",
        "result", "workspace_kind", "workspace_path",
    }
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return None

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [task_id]

    with _connect(board) as conn:
        cursor = conn.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = ?", values
        )
        if cursor.rowcount == 0:
            return None
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        return _row_to_dict(row)


def claim_task(
    task_id: str,
    agent: str,
    board: str = DEFAULT_BOARD,
    ttl_seconds: int = 3600,
) -> dict[str, Any] | None:
    """Claim a task with an expiring lock."""
    from datetime import timedelta
    expires = (datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)).isoformat()
    with _connect(board) as conn:
        # Only claim if unclaimed or expired
        conn.execute(
            """UPDATE tasks SET assignee = ?, claim_lock = ?, claim_expires = ?
               WHERE id = ? AND (claim_lock IS NULL OR claim_expires < ?)""",
            (agent, agent, expires, task_id, _now_iso()),
        )
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not row:
            return None
        result = _row_to_dict(row)
        if result.get("claim_lock") != agent:
            return None  # Someone else holds the lock
        return result


def complete_task(
    task_id: str,
    result: str | None = None,
    board: str = DEFAULT_BOARD,
) -> dict[str, Any] | None:
    """Mark a task as completed with optional result."""
    with _connect(board) as conn:
        updates = "status = 'completed'"
        params: list[Any] = []
        if result:
            updates += ", result = ?"
            params.append(result)
        params.append(task_id)
        conn.execute(f"UPDATE tasks SET {updates} WHERE id = ?", params)
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not row:
            return None
        return _row_to_dict(row)


def add_comment(
    task_id: str,
    author: str,
    body: str,
    board: str = DEFAULT_BOARD,
) -> dict[str, Any] | None:
    """Add a comment to a task. Returns the comment or None if task not found."""
    with _connect(board) as conn:
        exists = conn.execute("SELECT 1 FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if not exists:
            return None
        now = _now_iso()
        cursor = conn.execute(
            "INSERT INTO task_comments (task_id, author, body, created_at) VALUES (?, ?, ?, ?)",
            (task_id, author, body, now),
        )
        return {"id": cursor.lastrowid, "task_id": task_id, "author": author, "body": body, "created_at": now}


def list_boards() -> list[str]:
    """List all available kanban boards."""
    boards: list[str] = []
    # Back-compat: default board at ~/.hermes/kanban.db.
    # Only applies when KANBAN_ROOT is the default path (not test-patched).
    back_compat = Path.home() / ".hermes" / "kanban.db"
    _default_root = Path.home() / ".hermes" / "kanban" / "boards"
    if KANBAN_ROOT == _default_root and back_compat.exists():
        boards.append(DEFAULT_BOARD)
    if KANBAN_ROOT.exists():
        for d in KANBAN_ROOT.iterdir():
            if d.is_dir() and (d / "kanban.db").exists() and d.name not in boards:
                boards.append(d.name)
    return boards
