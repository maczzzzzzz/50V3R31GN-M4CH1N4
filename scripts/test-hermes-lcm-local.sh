#!/usr/bin/env bash
#
# Local Test Script for Hermes-LCM
# Tests the provider locally before mesh deployment
#

set -e

echo "================================================"
echo "  HERMES-LCM LOCAL TEST"
echo "================================================"

# Create test directory
TEST_DIR="/tmp/hermes-lcm-test"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

echo ":: Step 1: Testing Blockify pre-processor..."
cd /home/nixos/50V3R31GN-M4CH1N4/.worktrees/phase3-implementation/sidecars/mempalace-bridge
python3 blockify.py

echo ":: Step 2: Testing Hermes-LCM provider..."
cd /home/nixos/50V3R31GN-M4CH1N4/.worktrees/phase3-implementation/sidecars/hermes-lcm
python3 __main__.py --test --db-path "$TEST_DIR/memory.db"

echo ":: Step 3: Verifying database structure..."
echo "   - Database file exists:"
ls -lh "$TEST_DIR/memory.db"

echo ""
echo "   - Database schema:"
python3 -c "
import sqlite3
conn = sqlite3.connect('$TEST_DIR/memory.db')
cursor = conn.cursor()
cursor.execute(\"SELECT sql FROM sqlite_master WHERE type='table' AND name='ideablocks'\")
schema = cursor.fetchone()[0]
print(schema)
conn.close()
"

echo ""
echo "   - Sample blocks:"
python3 -c "
import sqlite3
conn = sqlite3.connect('$TEST_DIR/memory.db')
cursor = conn.cursor()
cursor.execute('SELECT block_id, semantic, timestamp FROM ideablocks LIMIT 5')
for row in cursor.fetchall():
    print(f'     * {row[1][:50]}...')
conn.close()
"

echo ":: Step 4: Testing XML export..."
python3 -c "
from hermes_lcm_provider import HermesLCMProvider
import sys

provider = HermesLCMProvider('$TEST_DIR/memory.db')
provider.export_to_xml('$TEST_DIR/export.xml')

# Verify XML was created
with open('$TEST_DIR/export.xml', 'r') as f:
    content = f.read()
    if '<ideablocks>' in content and '<ideablock' in content:
        print('   ✓ XML export successful')
        print(f'   - Export size: {len(content)} bytes')
    else:
        print('   ✗ XML export failed')
        sys.exit(1)
"

echo ":: Step 5: Testing search functionality..."
python3 -c "
from hermes_lcm_provider import HermesLCMProvider
import sys

provider = HermesLCMProvider('$TEST_DIR/memory.db')
results = provider.search_blocks('test', limit=5)

print(f'   - Found {len(results)} blocks matching \"test\"')
for block in results:
    print(f'     * {block.semantic[:50]}...')
"

echo "================================================"
echo "  ✅ ALL LOCAL TESTS PASSED"
echo "================================================"
echo ""
echo "Test database location: $TEST_DIR/memory.db"
echo "XML export location: $TEST_DIR/export.xml"
echo ""
echo "Ready for mesh deployment with: ./scripts/deploy-phase3-hermes-lcm.sh"
