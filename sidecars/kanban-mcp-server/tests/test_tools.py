"""Tests for kanban_mcp.db module."""

import json
import tempfile
from pathlib import Path

import pytest

# Override DB root before importing db module
import kanban_mcp.db as db

_tmpdir: Path


@pytest.fixture(autouse=True)
def tmp_board(tmp_path, monkeypatch):
    """Use a temp directory as kanban root for every test."""
    monkeypatch.setattr(db, "KANBAN_ROOT", tmp_path)
    global _tmpdir
    _tmpdir = tmp_path
    return tmp_path


class TestListBoards:
    def test_empty(self):
        assert db.list_boards() == []

    def test_with_board(self):
        db._ensure_board("test-board")
        assert db.list_boards() == ["test-board"]


class TestCreateAndGetTask:
    def test_create_and_fetch(self):
        task = db.create_task("t1", "Test Task", board="test", created_by="hermes")
        assert task["id"] == "t1"
        assert task["status"] == "pending"

        fetched = db.get_task("t1", board="test")
        assert fetched is not None
        assert fetched["title"] == "Test Task"
        assert fetched["comments"] == []

    def test_get_nonexistent(self):
        assert db.get_task("nope", board="test") is None


class TestListTasks:
    def test_list_empty(self):
        assert db.list_tasks(board="test") == []

    def test_list_with_filters(self):
        db.create_task("t1", "A", board="test", status="pending", priority=1)
        db.create_task("t2", "B", board="test", status="completed", priority=5)

        pending = db.list_tasks(board="test", status="pending")
        assert len(pending) == 1
        assert pending[0]["id"] == "t1"

        high = db.list_tasks(board="test", priority=5)
        assert len(high) == 1
        assert high[0]["id"] == "t2"


class TestUpdateTask:
    def test_update_title(self):
        db.create_task("t1", "Old", board="test")
        updated = db.update_task("t1", board="test", title="New", status="in_progress")
        assert updated is not None
        assert updated["title"] == "New"
        assert updated["status"] == "in_progress"

    def test_update_nonexistent(self):
        assert db.update_task("nope", board="test", title="X") is None


class TestClaimTask:
    def test_claim_unclaimed(self):
        db.create_task("t1", "Work", board="test")
        result = db.claim_task("t1", "hermes", board="test")
        assert result is not None
        assert result["assignee"] == "hermes"
        assert result["claim_lock"] == "hermes"

    def test_claim_already_claimed(self):
        db.create_task("t1", "Work", board="test")
        db.claim_task("t1", "hermes", board="test", ttl_seconds=99999)
        # Second claim should fail (lock not expired)
        result = db.claim_task("t1", "gemini", board="test")
        assert result is None


class TestCompleteTask:
    def test_complete(self):
        db.create_task("t1", "Work", board="test")
        result = db.complete_task("t1", result="All done", board="test")
        assert result is not None
        assert result["status"] == "completed"
        assert result["result"] == "All done"


class TestComments:
    def test_add_and_read(self):
        db.create_task("t1", "Work", board="test")
        comment = db.add_comment("t1", "hermes", "Starting this now", board="test")
        assert comment is not None
        assert comment["author"] == "hermes"

        task = db.get_task("t1", board="test")
        assert len(task["comments"]) == 1
        assert task["comments"][0]["body"] == "Starting this now"

    def test_comment_nonexistent_task(self):
        assert db.add_comment("nope", "hermes", "X", board="test") is None
