/**
 * VESPER LOG DISTILLER — PHASE 78, TASK 2
 *
 * Real-time file watcher and SPO triplet extractor.
 * Tails log files in `data/logs/` via the `notify` crate, running each
 * new line through the PatternMatcher to produce TripletProposals.
 *
 * Results are buffered and accessible via `drain_proposals()`.
 */

use crate::pattern_matcher::{PatternMatcher, TripletProposal};
use anyhow::{Context, Result};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tracing::{info, warn};

// ── LogDistiller ──────────────────────────────────────────────────────────────

pub struct LogDistiller {
    proposals: Arc<Mutex<Vec<TripletProposal>>>,
    _watcher:  RecommendedWatcher,
}

impl LogDistiller {
    /// Start watching `log_dir` for new data. All proposals extracted from
    /// matching lines are pushed into the internal buffer.
    pub fn watch(log_dir: impl AsRef<Path>) -> Result<Self> {
        let log_dir = log_dir.as_ref().to_path_buf();
        let proposals: Arc<Mutex<Vec<TripletProposal>>> = Arc::new(Mutex::new(Vec::new()));
        let proposals_clone = Arc::clone(&proposals);

        // Per-file read position tracker: file path → byte offset
        let offsets: Arc<Mutex<std::collections::HashMap<PathBuf, u64>>> =
            Arc::new(Mutex::new(std::collections::HashMap::new()));
        let offsets_clone = Arc::clone(&offsets);

        let matcher = Arc::new(PatternMatcher::new());

        let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
            let event = match res {
                Ok(e) => e,
                Err(e) => {
                    warn!("[VESPER/DISTILLER] Watch error: {}", e);
                    return;
                }
            };

            // Only process data-modify events on .log files.
            if !matches!(event.kind, EventKind::Modify(_)) {
                return;
            }

            for path in &event.paths {
                if path.extension().and_then(|e| e.to_str()) != Some("log") {
                    continue;
                }
                let source = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown.log")
                    .to_string();

                let new_lines = read_new_lines(path, &offsets_clone);
                for line in new_lines {
                    let hits = matcher.scan_line(&line, &source);
                    if !hits.is_empty() {
                        if let Ok(mut buf) = proposals_clone.lock() {
                            buf.extend(hits);
                        }
                    }
                }
            }
        })
        .context("Failed to create file watcher")?;

        watcher.watch(&log_dir, RecursiveMode::NonRecursive)
            .context("Failed to watch log directory")?;

        info!("[VESPER/DISTILLER] Watching {}", log_dir.display());

        Ok(LogDistiller {
            proposals,
            _watcher: watcher,
        })
    }

    /// Drain all accumulated proposals. Clears the internal buffer.
    pub fn drain_proposals(&self) -> Vec<TripletProposal> {
        match self.proposals.lock() {
            Ok(mut buf) => std::mem::take(&mut *buf),
            Err(_) => Vec::new(),
        }
    }

    /// Non-destructive snapshot of pending proposals.
    pub fn pending_count(&self) -> usize {
        self.proposals.lock().map(|b| b.len()).unwrap_or(0)
    }

    /// Perform an initial scan of all .log files currently in the directory.
    /// Useful for detecting drift that occurred before this daemon started.
    pub fn scan_existing(log_dir: impl AsRef<Path>) -> Vec<TripletProposal> {
        let matcher = PatternMatcher::new();
        let mut all = Vec::new();

        let dir = match std::fs::read_dir(log_dir.as_ref()) {
            Ok(d) => d,
            Err(_) => return all,
        };

        for entry in dir.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("log") {
                continue;
            }
            let source = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("?")
                .to_string();
            if let Ok(content) = std::fs::read_to_string(&path) {
                all.extend(matcher.scan_buffer(&content, &source));
            }
        }
        all
    }
}

/// Read only the bytes appended since the last read position.
fn read_new_lines(
    path: &Path,
    offsets: &Arc<Mutex<std::collections::HashMap<PathBuf, u64>>>,
) -> Vec<String> {
    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return Vec::new(),
    };

    let mut map = match offsets.lock() {
        Ok(m) => m,
        Err(_) => return Vec::new(),
    };

    let offset = *map.entry(path.to_path_buf()).or_insert(0);
    if file.seek(SeekFrom::Start(offset)).is_err() {
        return Vec::new();
    }

    let reader = BufReader::new(&mut file);
    let mut lines = Vec::new();
    for line in reader.lines().map_while(Result::ok) {
        lines.push(line);
    }

    // Update offset to end of file.
    if let Ok(pos) = file.seek(SeekFrom::Current(0)) {
        map.insert(path.to_path_buf(), pos);
    }

    lines
}
