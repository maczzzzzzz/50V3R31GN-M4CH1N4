"""
Hermes-LCM: Lossless Context Management Provider
Native Tenacity plugin for semantic memory management
"""

import sqlite3
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class IdeaBlock:
    """Represents a semantic unit of memory"""

    def __init__(
        self,
        block_id: str,
        semantic: str,
        context: str,
        relations: List[Dict[str, str]],
        metadata: Dict[str, Any],
        timestamp: str = None,
    ):
        self.block_id = block_id or str(uuid.uuid4())
        self.semantic = semantic
        self.context = context
        self.relations = relations or []
        self.metadata = metadata or {}
        self.timestamp = timestamp or datetime.now(timezone.utc).isoformat()

    def to_xml(self) -> str:
        """Convert to XML ideablock format"""
        relations_xml = "\n    ".join(
            f'<relation type="{r.get("type", "related")}" target="{r["target"]}"/>'
            for r in self.relations
        )

        metadata_json = json.dumps(self.metadata, indent=2)
        metadata_xml = metadata_json.replace("\n", "\n    ").replace('"', "&quot;")

        return f"""<ideablock id="{self.block_id}" timestamp="{self.timestamp}">
  <semantic>{self.semantic}</semantic>
  <context>{self.context}</context>
  <relations>
    {relations_xml}
  </relations>
  <metadata>
    {metadata_xml}
  </metadata>
</ideablock>"""

    @classmethod
    def from_xml(cls, xml_str: str) -> "IdeaBlock":
        """Parse XML ideablock format"""
        # Simplified XML parsing (use xml.etree in production)
        import re

        block_id_match = re.search(r'id="([^"]+)"', xml_str)
        timestamp_match = re.search(r'timestamp="([^"]+)"', xml_str)

        semantic_match = re.search(r"<semantic>(.*?)</semantic>", xml_str, re.DOTALL)
        context_match = re.search(r"<context>(.*?)</context>", xml_str, re.DOTALL)

        return cls(
            block_id=block_id_match.group(1) if block_id_match else None,
            semantic=semantic_match.group(1).strip() if semantic_match else "",
            context=context_match.group(1).strip() if context_match else "",
            relations=[],  # Parse relations in production
            metadata={},
            timestamp=timestamp_match.group(1) if timestamp_match else None,
        )


class HermesLCMProvider:
    """
    Lossless Context Management Provider for Tenacity
    Stores semantic memory as a DAG of IdeaBlocks in SQLite
    """

    def __init__(self, db_path: str = "/var/lib/hermes-lcm/memory.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ideablocks (
                    block_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    semantic TEXT NOT NULL,
                    context TEXT NOT NULL,
                    relations_json TEXT NOT NULL,
                    metadata_json TEXT NOT NULL
                )
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp ON ideablocks(timestamp)
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_semantic ON ideablocks(semantic)
            """)

            conn.commit()
            logger.info(f"Hermes-LCM database initialized at {self.db_path}")

    def store_block(self, block: IdeaBlock) -> bool:
        """Store an IdeaBlock in the DAG"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO ideablocks
                    (block_id, timestamp, semantic, context, relations_json, metadata_json)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        block.block_id,
                        block.timestamp,
                        block.semantic,
                        block.context,
                        json.dumps(block.relations),
                        json.dumps(block.metadata),
                    ),
                )
                conn.commit()
                logger.debug(f"Stored IdeaBlock: {block.block_id}")
                return True
        except Exception as e:
            logger.error(f"Failed to store IdeaBlock: {e}")
            return False

    def retrieve_block(self, block_id: str) -> Optional[IdeaBlock]:
        """Retrieve an IdeaBlock by ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    "SELECT block_id, timestamp, semantic, context, relations_json, metadata_json "
                    "FROM ideablocks WHERE block_id = ?",
                    (block_id,),
                )
                row = cursor.fetchone()

                if row:
                    return IdeaBlock(
                        block_id=row[0],
                        timestamp=row[1],
                        semantic=row[2],
                        context=row[3],
                        relations=json.loads(row[4]),
                        metadata=json.loads(row[5]),
                    )
                return None
        except Exception as e:
            logger.error(f"Failed to retrieve IdeaBlock: {e}")
            return None

    def search_blocks(self, query: str, limit: int = 10) -> List[IdeaBlock]:
        """Search for IdeaBlocks by semantic content"""
        # Validate and sanitize limit parameter (before try block to propagate validation errors)
        if not isinstance(limit, int) or limit < 1 or limit > 10000:
            raise ValueError(f"Invalid limit value: {limit}. Must be between 1 and 10000.")

        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT block_id, timestamp, semantic, context, relations_json, metadata_json
                    FROM ideablocks
                    WHERE semantic LIKE ? OR context LIKE ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                    """,
                    (f"%{query}%", f"%{query}%", limit),
                )
                rows = cursor.fetchall()

                return [
                    IdeaBlock(
                        block_id=row[0],
                        timestamp=row[1],
                        semantic=row[2],
                        context=row[3],
                        relations=json.loads(row[4]),
                        metadata=json.loads(row[5]),
                    )
                    for row in rows
                ]
        except Exception as e:
            logger.error(f"Failed to search IdeaBlocks: {e}")
            return []

    def get_recent_blocks(self, limit: int = 10) -> List[IdeaBlock]:
        """Get most recent IdeaBlocks"""
        # Validate and sanitize limit parameter (before try block to propagate validation errors)
        if not isinstance(limit, int) or limit < 1 or limit > 10000:
            raise ValueError(f"Invalid limit value: {limit}. Must be between 1 and 10000.")

        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT block_id, timestamp, semantic, context, relations_json, metadata_json
                    FROM ideablocks
                    ORDER BY timestamp DESC
                    LIMIT ?
                    """,
                    (limit,),
                )
                rows = cursor.fetchall()

                return [
                    IdeaBlock(
                        block_id=row[0],
                        timestamp=row[1],
                        semantic=row[2],
                        context=row[3],
                        relations=json.loads(row[4]),
                        metadata=json.loads(row[5]),
                    )
                    for row in rows
                ]
        except Exception as e:
            logger.error(f"Failed to get recent IdeaBlocks: {e}")
            return []

    def export_to_xml(self, output_path: str):
        """Export all IdeaBlocks to XML format"""
        try:
            blocks = self.get_recent_blocks(limit=10000)  # Get all blocks
            with open(output_path, "w") as f:
                f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
                f.write("<ideablocks>\n")
                for block in blocks:
                    f.write(block.to_xml() + "\n")
                f.write("</ideablocks>\n")
            logger.info(f"Exported {len(blocks)} IdeaBlocks to {output_path}")
        except (OSError, IOError) as e:
            logger.error(f"Failed to export to XML: {e}")
            raise


# Tenacity Plugin Registration
def register_plugin():
    """Register Hermes-LCM as a Tenacity MemoryProvider"""
    try:
        from tenacity.plugins import MemoryProvider

        MemoryProvider.register("hermes-lcm", HermesLCMProvider)
        logger.info("Hermes-LCM registered as Tenacity MemoryProvider")
        return True
    except ImportError:
        logger.warning("Tenacity not available, running in standalone mode")
        return False


if __name__ == "__main__":
    # Test the provider
    logging.basicConfig(level=logging.INFO)
    provider = HermesLCMProvider("/tmp/test-hermes-lcm.db")

    # Create and store a test block
    test_block = IdeaBlock(
        semantic="Phase 3 memory architecture implementation",
        context="Implementing Hermes-LCM with Blockify pre-processor for MemPalace integration",
        relations=[{"type": "depends-on", "target": "hermes-core"}],
        metadata={"source": "node-b", "priority": "high"},
    )

    provider.store_block(test_block)
    print("Stored test block")

    # Retrieve and verify
    retrieved = provider.retrieve_block(test_block.block_id)
    if retrieved:
        print(f"Retrieved block: {retrieved.to_xml()}")


    # === Phase 3: Cross-node rsync support ===

    def sync_to_nodes(self, target_nodes: List[str]) -> Dict[str, bool]:
        """Basic rsync-based sync to other mesh nodes (Node B, D, etc.)."""
        import subprocess
        results = {}
        db_path = Path(self.db_path)

        for node in target_nodes:
            try:
                # Example: rsync over Tailscale
                dest = f"{node}:/var/lib/hermes-lcm/"
                cmd = ["rsync", "-avz", "--delete", str(db_path), dest]
                subprocess.run(cmd, check=True, capture_output=True)
                results[node] = True
                logger.info(f"Successfully synced to {node}")
            except subprocess.CalledProcessError as e:
                results[node] = False
                logger.error(f"Failed to sync to {node}: {e}")

        return results
