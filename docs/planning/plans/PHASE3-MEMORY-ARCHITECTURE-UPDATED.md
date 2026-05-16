# Phase 3: Memory Architecture - FINAL PLAN

**Status:** APPROVED (Option 1 - Hybrid SQLite)
**Date:** May 14, 2026
**Updated:** User decisions integrated

---

## USER DECISIONS LOGGED

### Q1: LCM Sync Frequency
**Answer:** Batch mode
**Configuration:**
```yaml
lcm:
  sync:
    mode: "batch"
    batch_size: 10           # Sync every 10 messages
    interval_minutes: 5         # Or every 5 minutes, whichever comes first
    priority: "bandwidth"       # Prioritize network efficiency
```
**Rationale:** Balances freshness with bandwidth usage. Every 10 messages or 5 minutes is safe for Tailscale artery.

### Q2: CodeGraph Deployment Strategy
**Answer:** Start with Node B, rsync to other nodes
**Configuration:**
```yaml
codegraph:
  primary_node: "node-b"        # Build index on Node B
  sync_targets:
    - node_c: /home/maczz/codegraph-index
    - node_d: /home/nixos/codegraph-index
  sync_method: "rsync"         # Over Tailscale artery
  rsync_flags: "-avz --delete"
```
**Rationale:** Node B is Director (48GB, primary workspace). Build index once, deploy everywhere.

### Q3: Backup Strategy
**Answer:** Every 48 hours OR change-based trigger
**Configuration:**
```yaml
backup:
  schedule:
    interval_hours: 48           # Every 48 hours
  triggers:
    session_change_threshold: 1000  # If session logs exceed 1000 messages
    code_change_threshold: 5000    # Or if 5000+ lines changed in 24h
  targets:
    - node_a_primary: /mnt/data/hermes-lcm
    - node_c_ssd: /mnt/sovereign_soul/hermes-lcm-backups
```
**Rationale:** Time-based backups with intelligent triggers for heavy usage periods.

### Q4: CodeGraph Re-indexing
**Answer:** Manual + cron automation
**Configuration:**
```yaml
codegraph:
  reindex:
    mode: "manual"              # Manual trigger
    automation: "cron"           # But automate via cron jobs
    cron_schedule:
      daily_backup: "0 2 * * *"        # Daily at 2am
      weekly_full_reindex: "0 3 * * 0"  # Weekly full reindex at 3am Sunday
      change_trigger: "inotify-watch"   # Optional: watch for heavy changes
```
**Rationale:** Manual control for precision, cron for automation. Watch mode for heavy changes.

---

## UPDATED IMPLEMENTATION TASKS

### Task 1: Mount Node C External SSD (BLOCKING - requires sudo)
```bash
# On Node C (100.102.109.81)
# Add to /etc/fstab:
UUID=511d1a67-a3c0-49f8-899d-e509eab53c1a  /mnt/sovereign_soul  ext4  defaults,noatime  0  2

# Mount and verify
sudo mount -a
df -h /mnt/sovereign_soul
```

### Task 2: Install Hermes-LCM (Node A)
```bash
git clone https://github.com/stephenschoettler/hermes-lcm \
  ~/.hermes/plugins/hermes-lcm

# Add to ~/.hermes/config.yaml:
plugins:
  enabled:
    - hermes-lcm

context:
  engine: lcm

lcm:
  sync:
    mode: "batch"
    batch_size: 10
    interval_minutes: 5
  sync_targets:
    - node_c: /mnt/sovereign_soul/hermes-lcm

# Restart Hermes
hermes plugins
lcm_status
```

### Task 3: Install CodeGraph-Rust (Node B)
```bash
# On Node B (Director - primary workspace)
cargo install --git https://github.com/Jakedismo/codegraph-rust codegraph

# Initialize for main repo
codegraph init /home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha

# Index with tier=balanced
CODEGRAPH_INDEX_TIER=balanced codegraph index

# Start MCP server
codegraph start mcp --port 3000
```

### Task 4: Configure CodeGraph MCP in Hermes (Node B)
```yaml
# Add to ~/.hermes/config.yaml:
mcp_servers:
  codegraph:
    url: "http://localhost:3000"
    enabled: true
```

### Task 5: Setup CodeGraph Sync to Nodes C & D
```bash
# On Node B
# Create sync script
cat > ~/sync-codegraph.sh << 'SYNC_EOF'
#!/bin/bash
# Sync CodeGraph index from Node B to Node C & D

echo "Syncing CodeGraph index to Node C..."
rsync -avz --delete \
  ~/.codegraph/ \
  maczz@100.102.109.81:~/codegraph-index/

echo "Syncing CodeGraph index to Node D..."
rsync -avz --delete \
  ~/.codegraph/ \
  nixos@100.120.225.12:~/codegraph-index/

echo "CodeGraph sync complete."
SYNC_EOF

chmod +x ~/sync-codegraph.sh

# Test sync
~/sync-codegraph.sh
```

### Task 6: Create Cron Jobs for Automation
```bash
# On Node A (Hermes-LCM primary)
# Create backup cron job
cat > ~/hermes-lcm-backup.sh << 'BACKUP_EOF'
#!/bin/bash
# Hermes-LCM backup script

SOURCE="/mnt/data/hermes-lcm"
TARGET="/mnt/sovereign_soul/hermes-lcm-backups/$(date +%Y%m%d_%H%M)"
LOG="/var/log/hermes-lcm-backup.log"

mkdir -p "$TARGET"

echo "[$(date)] Starting Hermes-LCM backup..." >> "$LOG"
rsync -avz --delete "$SOURCE/" "$TARGET/" >> "$LOG" 2>&1
echo "[$(date)] Backup complete. Size: $(du -sh "$TARGET" | cut -f1)" >> "$LOG"
BACKUP_EOF

chmod +x ~/hermes-lcm-backup.sh

# Add to crontab (every 48 hours)
(crontab -l 2>/dev/null; echo "0 */48 * * * $HOME/hermes-lcm-backup.sh") | crontab -

# On Node B (CodeGraph backup)
cat > ~/codegraph-backup.sh << 'CG_EOF'
#!/bin/bash
# CodeGraph backup script

SOURCE="$HOME/.codegraph"
TARGET="$HOME/codegraph-backups/$(date +%Y%m%d_%H%M)"
LOG="/var/log/codegraph-backup.log"

mkdir -p "$TARGET"

echo "[$(date)] Starting CodeGraph backup..." >> "$LOG"
rsync -avz --delete "$SOURCE/" "$TARGET/" >> "$LOG" 2>&1
echo "[$(date)] Backup complete." >> "$LOG"
CG_EOF

chmod +x ~/codegraph-backup.sh

# Add to crontab (daily at 2am)
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/codegraph-backup.sh") | crontab -

# Weekly full reindex (Sunday 3am)
cat > ~/codegraph-reindex.sh << 'REINDEX_EOF'
#!/bin/bash
# CodeGraph full reindex script

PROJECT="/home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha"
LOG="/var/log/codegraph-reindex.log"

echo "[$(date)] Starting CodeGraph full reindex..." >> "$LOG"
cd "$PROJECT"
CODEGRAPH_INDEX_TIER=full codegraph index >> "$LOG" 2>&1
echo "[$(date)] Reindex complete." >> "$LOG"

# Sync to nodes C & D
~/sync-codegraph.sh
REINDEX_EOF

chmod +x ~/codegraph-reindex.sh

# Add to crontab (Sundays at 3am)
(crontab -l 2>/dev/null; echo "0 3 * * 0 $HOME/codegraph-reindex.sh") | crontab -
```

### Task 7: Verify Integration
```bash
# Verify Hermes-LCM
hermes plugins  # Should show hermes-lcm
lcm_status

# Verify CodeGraph
hermes mcp list  # Should show codegraph

# Test CodeGraph tools
agentic_context "Show me mesh routing architecture"
agentic_impact "What depends on LiteLLM proxy?"

# Test sync
~/sync-codegraph.sh
```

### Task 8: Index Hermes Agent Fork
```bash
# On Node B
codegraph init ~/50V3R31GN-M4CH1N4-stable-mesh-alpha/sidecars/hermes-agent-nous
CODEGRAPH_INDEX_TIER=balanced codegraph index
```

---

## CRON JOB SUMMARY

### Node A (Synapse)
| Job | Schedule | Command | Purpose |
|-----|----------|----------|---------|
| Hermes-LCM backup | Every 48 hours | `~/hermes-lcm-backup.sh` | Sync to Node C SSD with timestamp |

### Node B (Director)
| Job | Schedule | Command | Purpose |
|-----|----------|----------|---------|
| CodeGraph backup | Daily at 2am | `~/codegraph-backup.sh` | Local backup with timestamp |
| CodeGraph sync | Manual | `~/sync-codegraph.sh` | Sync to Nodes C & D |
| CodeGraph reindex | Sundays at 3am | `~/codegraph-reindex.sh` | Full reindex + sync to all nodes |

---

## CONFIGURATION FILES TO CREATE

### ~/.hermes/config.yaml (Node A)
```yaml
plugins:
  enabled:
    - hermes-lcm

context:
  engine: lcm

lcm:
  sync:
    mode: "batch"
    batch_size: 10
    interval_minutes: 5
  sync_targets:
    - node_c: /mnt/sovereign_soul/hermes-lcm
```

### ~/.hermes/config.yaml (Node B)
```yaml
mcp_servers:
  codegraph:
    url: "http://localhost:3000"
    enabled: true
```

---

## BACKUP RETENTION POLICY

### Hermes-LCM Backups (Node C SSD)
- Location: `/mnt/sovereign_soul/hermes-lcm-backups/`
- Naming: `YYYYMMDD_HHMM/`
- Retention: Keep last 7 backups (14 days coverage)
- Size estimate: ~500MB per backup × 7 = 3.5GB

### CodeGraph Backups (Node B)
- Location: `~/codegraph-backups/`
- Naming: `YYYYMMDD_HHMM/`
- Retention: Keep last 7 daily + 4 weekly = 11 backups
- Size estimate: ~2GB per backup × 11 = 22GB

---

## SYNC VERIFICATION CHECKLIST

After each sync operation, verify:
- [ ] File counts match on source and target
- [ ] Total sizes match (allow 5% variance for timestamps)
- [ ] Most recent files are present
- [ ] No rsync errors in logs

```bash
# Quick verification command
diff -q -r /mnt/data/hermes-lcm/ /mnt/sovereign_soul/hermes-lcm/ | head -10
```

---

## MONITORING & ALERTING

### Log Locations
- Hermes-LCM backup: `/var/log/hermes-lcm-backup.log`
- CodeGraph backup: `/var/log/codegraph-backup.log`
- CodeGraph reindex: `/var/log/codegraph-reindex.log`
- Sync script: Output to stdout (or redirect to `/var/log/codegraph-sync.log`)

### Alert Conditions
- Backup failed (check exit code)
- Sync errors (rsync exit code != 0)
- Disk space < 10GB on backup targets
- Reindex took > 2 hours

---

## ROLLBACK PROCEDURES

### If Hermes-LCM Sync Fails
1. Stop using Hermes (prevent writes to corrupted DB)
2. Restore from Node C backup: `cp -r /mnt/sovereign_soul/hermes-lcm-backups/LATEST /mnt/data/hermes-lcm/`
3. Verify with `lcm_doctor`
4. Restart Hermes

### If CodeGraph Index Corrupts
1. Stop CodeGraph MCP server
2. Restore from local backup: `cp -r ~/codegraph-backups/LATEST ~/.codegraph/`
3. Reindex if needed: `codegraph index`
4. Restart server: `codegraph start mcp --port 3000`

---

## PERFORMANCE BENCHMARKING

After deployment, measure:
- Hermes-LCM sync time per batch (target: < 1 second)
- CodeGraph sync time to Node C (target: < 30 seconds)
- CodeGraph sync time to Node D (target: < 60 seconds)
- Backup time (target: < 5 minutes)
- Reindex time (target: < 30 minutes for balanced tier)

---

## NEXT ACTIONS

1. Mount Node C external SSD (BLOCKING - requires sudo access on Node C)
2. Install Hermes-LCM on Node A
3. Install CodeGraph-Rust on Node B
4. Create and test sync scripts
5. Setup cron jobs
6. Run first backup and sync
7. Verify all systems operational

---

**Updated:** May 14, 2026 with user decisions for Q1-Q4
**Plan Location:** docs/plans/PHASE3-MEMORY-ARCHITECTURE-UPDATED.md
**MCP Reference:** docs/plans/MCP-TOOL-REFERENCE.md
