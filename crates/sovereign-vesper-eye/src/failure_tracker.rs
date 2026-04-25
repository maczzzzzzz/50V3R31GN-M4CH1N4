/**
 * VESPER FAILURE TRACKER — PHASE 80, TASK 3
 *
 * Monitors the `decision_audit` table for consecutive RE_ROLL or CRASH
 * signals associated with the same `trace_id`. When the threshold is
 * reached the FailureTracker emits a MANDATORY_HALL_CALL by writing a
 * manifest file to `data/meetings/<trace_id>/`.
 *
 * Design constraints:
 *   - Zero inference dependencies — deterministic SQL scanning only.
 *   - Hardgate: locks VSB artery by writing `data/meetings/<trace_id>/vsb.lock`.
 *     The lock file presence signals to the Go crush layer that the agent's
 *     artery is suspended until the Hall resolves it.
 */

use anyhow::{Context, Result};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tracing::{info, warn};

// ── FailureRecord ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailureRecord {
    pub trace_id:    String,
    pub action_type: String,
    pub verdict:     String,
    pub timestamp_ms: i64,
}

// ── FailureTracker ────────────────────────────────────────────────────────────

/// Monitors the decision_audit artery for consecutive failures.
pub struct FailureTracker {
    db_path:      PathBuf,
    meetings_dir: PathBuf,
    /// In-memory streak counters: trace_id → consecutive failure count
    streaks:      HashMap<String, u32>,
    /// Threshold before a MANDATORY_HALL_CALL is emitted
    threshold:    u32,
    /// Epoch offset for incremental polling: last seen timestamp_ms
    last_seen_ms: i64,
}

impl FailureTracker {
    /// Create a new FailureTracker.
    ///
    /// * `db_path`      — path to SovereignIntelligence.db
    /// * `meetings_dir` — path to data/meetings/
    /// * `threshold`    — consecutive failures before Hall call (default 3)
    pub fn new(
        db_path: impl AsRef<Path>,
        meetings_dir: impl AsRef<Path>,
        threshold: u32,
    ) -> Self {
        FailureTracker {
            db_path:      db_path.as_ref().to_path_buf(),
            meetings_dir: meetings_dir.as_ref().to_path_buf(),
            streaks:      HashMap::new(),
            threshold,
            last_seen_ms: 0,
        }
    }

    /// Poll the decision_audit table for new verdicts since the last call.
    /// Events are processed in timestamp order so a SUCCESS correctly resets
    /// the streak before any subsequent failures are tallied.
    /// Returns the number of Hall calls emitted.
    pub fn poll(&mut self) -> Result<u32> {
        let conn = Connection::open(&self.db_path)
            .context("FailureTracker: open db")?;

        // Fetch ALL relevant verdicts in timestamp order — interleaved so that
        // a SUCCESS row correctly clears the streak before the next failure.
        let mut stmt = conn.prepare(
            "SELECT trace_id, action_type, verdict, timestamp_ms
             FROM   decision_audit
             WHERE  verdict IN ('CRASH', 'RE_ROLL', 'FATAL', 'SUCCESS')
               AND  timestamp_ms > ?1
             ORDER  BY timestamp_ms ASC"
        ).context("FailureTracker: prepare stmt")?;

        let records: Vec<FailureRecord> = stmt
            .query_map(params![self.last_seen_ms], |row| {
                Ok(FailureRecord {
                    trace_id:     row.get(0)?,
                    action_type:  row.get(1)?,
                    verdict:      row.get(2)?,
                    timestamp_ms: row.get(3)?,
                })
            })
            .context("FailureTracker: query_map")?
            .filter_map(|r| r.ok())
            .collect();

        // Advance watermark
        if let Some(last) = records.last() {
            self.last_seen_ms = last.timestamp_ms;
        }

        let mut hall_calls = 0u32;

        for rec in &records {
            if rec.verdict == "SUCCESS" {
                self.streaks.remove(&rec.trace_id);
                continue;
            }

            let count = self.streaks.entry(rec.trace_id.clone()).or_insert(0);
            *count += 1;

            info!(
                "[VESPER/FAILURE_TRACKER] trace={} verdict={} streak={}",
                rec.trace_id, rec.verdict, *count
            );

            if *count >= self.threshold {
                warn!(
                    "[VESPER/FAILURE_TRACKER] MANDATORY_HALL_CALL: trace={} streak={}",
                    rec.trace_id, *count
                );
                self.emit_hall_call(&rec.trace_id, &rec.action_type)?;
                self.streaks.remove(&rec.trace_id); // reset after gate fires
                hall_calls += 1;
            }
        }

        Ok(hall_calls)
    }

    /// Emit a MANDATORY_HALL_CALL by writing manifest + vsb.lock to meetings dir.
    fn emit_hall_call(&self, trace_id: &str, last_action: &str) -> Result<()> {
        let meet_dir = self.meetings_dir.join(trace_id);
        fs::create_dir_all(&meet_dir)
            .with_context(|| format!("FailureTracker: mkdir {}", meet_dir.display()))?;

        // Manifest JSON
        let manifest = serde_json::json!({
            "trace_id":   trace_id,
            "called_at":  chrono_now_iso(),
            "called_by":  "vesper:failure_tracker",
            "status":     "open",
            "agents":     [],
            "last_action": last_action,
        });
        let manifest_path = meet_dir.join("manifest.json");
        fs::write(&manifest_path, serde_json::to_string_pretty(&manifest)?)
            .context("FailureTracker: write manifest")?;

        // VSB Hardgate lock file — signals crush to suspend artery
        let lock_path = meet_dir.join("vsb.lock");
        fs::write(&lock_path, format!("LOCKED by vesper:failure_tracker at {}\n", chrono_now_iso()))
            .context("FailureTracker: write vsb.lock")?;

        // Healer thought fragment stub
        let thought = format!(
            "## THOUGHT_FRAGMENT : vesper:failure_tracker\n\
             - **Assumed Context:** {threshold} consecutive failures for trace {trace_id}\n\
             - **Failed Approach:** {last_action}\n\
             - **Proposed Resolution:** Awaiting agent fragments\n\
             - **Confidence Score:** 0.0\n",
            threshold  = self.threshold,
            trace_id   = trace_id,
            last_action = last_action,
        );
        fs::write(meet_dir.join("vesper.thought"), thought)
            .context("FailureTracker: write vesper.thought")?;

        info!(
            "[VESPER/FAILURE_TRACKER] Hall call materialized → {}",
            meet_dir.display()
        );
        Ok(())
    }

    /// Remove a VSB hardgate lock once a meeting is resolved.
    pub fn release_lock(&self, trace_id: &str) -> Result<()> {
        let lock_path = self.meetings_dir.join(trace_id).join("vsb.lock");
        if lock_path.exists() {
            fs::remove_file(&lock_path)
                .with_context(|| format!("FailureTracker: remove lock {}", lock_path.display()))?;
            info!("[VESPER/FAILURE_TRACKER] VSB lock released for trace={}", trace_id);
        }
        Ok(())
    }
}

fn chrono_now_iso() -> String {
    // Simple RFC 3339 without the chrono crate dep
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let s = secs % 60;
    let m = (secs / 60) % 60;
    let h = (secs / 3600) % 24;
    let days = secs / 86400;
    // Approximate date from epoch (good enough for log stamps, not calendar-correct)
    format!("T{:04}D{:02}:{:02}:{:02}Z", days, h, m, s)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use tempfile::TempDir;

    fn setup_db(tmp: &TempDir) -> PathBuf {
        let db_path = tmp.path().join("test.db");
        let conn = Connection::open(&db_path).unwrap();
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS decision_audit (
                request_id   TEXT PRIMARY KEY,
                trace_id     TEXT NOT NULL,
                action_type  TEXT NOT NULL,
                verdict      TEXT NOT NULL,
                timestamp_ms INTEGER NOT NULL
            )",
        ).unwrap();
        db_path
    }

    fn insert_verdict(conn: &Connection, trace: &str, verdict: &str, ts: i64) {
        conn.execute(
            "INSERT INTO decision_audit (request_id, trace_id, action_type, verdict, timestamp_ms)
             VALUES (?, ?, 'llm_query', ?, ?)",
            params![format!("{trace}-{ts}"), trace, verdict, ts],
        ).unwrap();
    }

    #[test]
    fn no_hall_call_below_threshold() {
        let tmp = TempDir::new().unwrap();
        let db_path = setup_db(&tmp);
        let meetings = tmp.path().join("meetings");

        {
            let conn = Connection::open(&db_path).unwrap();
            insert_verdict(&conn, "trace-001", "CRASH",   1000);
            insert_verdict(&conn, "trace-001", "RE_ROLL", 2000);
        }

        let mut ft = FailureTracker::new(&db_path, &meetings, 3);
        let calls = ft.poll().unwrap();
        assert_eq!(calls, 0);
    }

    #[test]
    fn emits_hall_call_at_threshold() {
        let tmp = TempDir::new().unwrap();
        let db_path = setup_db(&tmp);
        let meetings = tmp.path().join("meetings");

        {
            let conn = Connection::open(&db_path).unwrap();
            insert_verdict(&conn, "trace-002", "CRASH",   100);
            insert_verdict(&conn, "trace-002", "RE_ROLL", 200);
            insert_verdict(&conn, "trace-002", "FATAL",   300);
        }

        let mut ft = FailureTracker::new(&db_path, &meetings, 3);
        let calls = ft.poll().unwrap();
        assert_eq!(calls, 1);

        // Verify manifest and lock exist
        let meet_dir = meetings.join("trace-002");
        assert!(meet_dir.join("manifest.json").exists(), "manifest should exist");
        assert!(meet_dir.join("vsb.lock").exists(), "vsb.lock should exist");
    }

    #[test]
    fn success_resets_streak() {
        let tmp = TempDir::new().unwrap();
        let db_path = setup_db(&tmp);
        let meetings = tmp.path().join("meetings");

        {
            let conn = Connection::open(&db_path).unwrap();
            insert_verdict(&conn, "trace-003", "CRASH",   100);
            insert_verdict(&conn, "trace-003", "CRASH",   200);
            insert_verdict(&conn, "trace-003", "SUCCESS", 300); // resets streak
            insert_verdict(&conn, "trace-003", "CRASH",   400);
        }

        let mut ft = FailureTracker::new(&db_path, &meetings, 3);
        let calls = ft.poll().unwrap();
        // Only 1 crash after the reset — should not trigger Hall
        assert_eq!(calls, 0);
    }

    #[test]
    fn release_lock_removes_file() {
        let tmp = TempDir::new().unwrap();
        let db_path = setup_db(&tmp);
        let meetings = tmp.path().join("meetings");

        {
            let conn = Connection::open(&db_path).unwrap();
            insert_verdict(&conn, "trace-004", "CRASH",   10);
            insert_verdict(&conn, "trace-004", "RE_ROLL", 20);
            insert_verdict(&conn, "trace-004", "FATAL",   30);
        }

        let mut ft = FailureTracker::new(&db_path, &meetings, 3);
        ft.poll().unwrap();

        let lock = meetings.join("trace-004").join("vsb.lock");
        assert!(lock.exists());

        ft.release_lock("trace-004").unwrap();
        assert!(!lock.exists());
    }
}
