"""
Kanban MCP Server -- FastMCP tool definitions.
Exposes Hermes kanban SQLite as MCP tools for cross-agent coordination.
"""

from __future__ import annotations

import json
from typing import Any

from fastmcp import FastMCP

from . import db

mcp = FastMCP(
    "kanban-mcp",
    instructions=(
        "Shared kanban board for cross-agent task coordination. "
        "Use list_tasks to see work items, claim_task to pick one up, "
        "complete_task when done, add_comment for async discussion. "
        "Board names correspond to Hermes kanban boards."
    ),
)


@mcp.tool()
def kanban_list_boards() -> list[str]:
    """List all available kanban boards."""
    return db.list_boards()


@mcp.tool()
def kanban_list_tasks(
    board: str = "default",
    status: str | None = None,
    assignee: str | None = None,
    priority: int | None = None,
    limit: int = 50,
) -> str:
    """List tasks on a kanban board. Filter by status, assignee, or priority."""
    tasks = db.list_tasks(
        board=board,
        status=status,
        assignee=assignee,
        priority=priority,
        limit=limit,
    )
    return json.dumps(tasks, indent=2, default=str)


@mcp.tool()
def kanban_get_task(task_id: str, board: str = "default") -> str:
    """Get full details for a single task, including comments."""
    task = db.get_task(task_id, board=board)
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})
    return json.dumps(task, indent=2, default=str)


@mcp.tool()
def kanban_create_task(
    id: str,
    title: str,
    board: str = "default",
    body: str = "",
    priority: int = 5,
    assignee: str | None = None,
    created_by: str | None = None,
) -> str:
    """Create a new task on the board."""
    task = db.create_task(
        id=id,
        title=title,
        board=board,
        body=body,
        priority=priority,
        assignee=assignee,
        created_by=created_by,
    )
    return json.dumps(task, indent=2, default=str)


@mcp.tool()
def kanban_update_task(
    task_id: str,
    board: str = "default",
    title: str | None = None,
    body: str | None = None,
    status: str | None = None,
    priority: int | None = None,
    assignee: str | None = None,
    result: str | None = None,
) -> str:
    """Update fields on an existing task."""
    task = db.update_task(
        task_id=task_id,
        board=board,
        title=title,
        body=body,
        status=status,
        priority=priority,
        assignee=assignee,
        result=result,
    )
    if not task:
        return json.dumps({"error": f"Task {task_id} not found or no fields to update"})
    return json.dumps(task, indent=2, default=str)


@mcp.tool()
def kanban_claim_task(
    task_id: str,
    agent: str,
    board: str = "default",
    ttl_seconds: int = 3600,
) -> str:
    """Claim a task with an expiring lock. Prevents duplicate work between agents."""
    task = db.claim_task(
        task_id=task_id,
        agent=agent,
        board=board,
        ttl_seconds=ttl_seconds,
    )
    if not task:
        return json.dumps({"error": f"Task {task_id} not found or already claimed by another agent"})
    return json.dumps(task, indent=2, default=str)


@mcp.tool()
def kanban_complete_task(
    task_id: str,
    board: str = "default",
    result: str | None = None,
) -> str:
    """Mark a task as completed with an optional result summary."""
    task = db.complete_task(
        task_id=task_id,
        result=result,
        board=board,
    )
    if not task:
        return json.dumps({"error": f"Task {task_id} not found"})
    return json.dumps(task, indent=2, default=str)


@mcp.tool()
def kanban_add_comment(
    task_id: str,
    author: str,
    body: str,
    board: str = "default",
) -> str:
    """Add a comment to a task for cross-agent discussion."""
    comment = db.add_comment(
        task_id=task_id,
        author=author,
        body=body,
        board=board,
    )
    if not comment:
        return json.dumps({"error": f"Task {task_id} not found"})
    return json.dumps(comment, indent=2, default=str)


def main():
    """Entry point for the MCP server."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
