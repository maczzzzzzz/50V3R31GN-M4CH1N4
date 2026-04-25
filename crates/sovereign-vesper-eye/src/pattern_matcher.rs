/**
 * VESPER PATTERN MATCHER — PHASE 78, TASK 2
 *
 * Detects "Scribe" drift and other system-state anomalies in terminal output
 * by scanning log lines against a compiled pattern set.
 *
 * "Scribe drift" := any log evidence that a manifest update was attempted
 * without the canonical scribe workflow (npm run scribe), e.g. direct edits
 * to IMPLEMENTATION_PLAN.md without a matching CHANGELOG entry, or version
 * fields going out of sync across files.
 *
 * Each matched pattern produces a TripletProposal for Synapse ingestion.
 */

use regex::Regex;
use serde::{Deserialize, Serialize};
use tracing::debug;

// ── TripletProposal ───────────────────────────────────────────────────────────

/// An extracted (Subject-Predicate-Object) triplet proposal for os_triplets seeding.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TripletProposal {
    pub subject:   String,
    pub predicate: String,
    pub object:    String,
    /// Source log file that produced this triplet.
    pub source:    String,
}

// ── PatternRule ───────────────────────────────────────────────────────────────

struct PatternRule {
    pattern:   Regex,
    predicate: &'static str,
    subject:   &'static str,
}

// ── PatternMatcher ────────────────────────────────────────────────────────────

/// Scans log lines for drift signals and extracts SPO triplets.
pub struct PatternMatcher {
    rules: Vec<PatternRule>,
}

impl PatternMatcher {
    /// Build the default rule set for Phase 78.
    pub fn new() -> Self {
        let rules = vec![
            // Scribe drift — direct manifest edit without scribe workflow
            PatternRule {
                pattern:   Regex::new(r"(?i)IMPLEMENTATION_PLAN\.md.*modified").unwrap(),
                predicate: "scribe_drift_detected",
                subject:   "manifest:IMPLEMENTATION_PLAN",
            },
            // Version desync — different version strings in a single log line
            PatternRule {
                pattern:   Regex::new(r"v3\.\d+\.\d+.*v3\.\d+\.\d+").unwrap(),
                predicate: "version_desync_signal",
                subject:   "system:version_parity",
            },
            // Mooncake sync failure
            PatternRule {
                pattern:   Regex::new(r"(?i)Mooncake.*fail|KV.*sync.*fail").unwrap(),
                predicate: "kv_sync_failure",
                subject:   "mooncake:kv_bridge",
            },
            // Boot invariant violation
            PatternRule {
                pattern:   Regex::new(r"HARDGATE VIOLATION").unwrap(),
                predicate: "hardgate_violation",
                subject:   "crush:hardgate",
            },
            // VSB magic mismatch
            PatternRule {
                pattern:   Regex::new(r"invalid VSB magic|corrupted shared memory").unwrap(),
                predicate: "vsb_integrity_failure",
                subject:   "vsb:black_ice_state",
            },
            // Hermes router backend unreachable
            PatternRule {
                pattern:   Regex::new(r"(?i)Backend unreachable|BAD_GATEWAY").unwrap(),
                predicate: "inference_node_offline",
                subject:   "hermes:router",
            },
        ];
        PatternMatcher { rules }
    }

    /// Scan a single log line. Returns triplet proposals for every match.
    pub fn scan_line(&self, line: &str, source: &str) -> Vec<TripletProposal> {
        let mut proposals = Vec::new();
        for rule in &self.rules {
            if rule.pattern.is_match(line) {
                debug!(
                    "[VESPER/MATCHER] Pattern '{}' matched in {}: {:?}",
                    rule.predicate, source, &line[..line.len().min(80)]
                );
                proposals.push(TripletProposal {
                    subject:   rule.subject.to_string(),
                    predicate: rule.predicate.to_string(),
                    object:    line.chars().take(500).collect(),
                    source:    source.to_string(),
                });
            }
        }
        proposals
    }

    /// Scan all lines of a log buffer, return all proposals.
    pub fn scan_buffer(&self, content: &str, source: &str) -> Vec<TripletProposal> {
        content
            .lines()
            .flat_map(|line| self.scan_line(line, source))
            .collect()
    }
}

impl Default for PatternMatcher {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn matcher() -> PatternMatcher { PatternMatcher::new() }

    #[test]
    fn detects_scribe_drift() {
        let m = matcher();
        let hits = m.scan_line("[2026-04-25] IMPLEMENTATION_PLAN.md was modified directly", "test.log");
        assert!(!hits.is_empty());
        assert_eq!(hits[0].predicate, "scribe_drift_detected");
    }

    #[test]
    fn detects_hardgate_violation() {
        let m = matcher();
        let hits = m.scan_line("HARDGATE VIOLATION: permission_policy change blocked", "crush.log");
        assert!(!hits.is_empty());
        assert_eq!(hits[0].subject, "crush:hardgate");
    }

    #[test]
    fn clean_line_produces_no_proposals() {
        let m = matcher();
        let hits = m.scan_line("◈ [ARTERY] Atomic Switch Complete: daily-use active.", "crush.log");
        assert!(hits.is_empty());
    }

    #[test]
    fn scan_buffer_aggregates_all_matches() {
        let m = matcher();
        let buf = "HARDGATE VIOLATION: blocked\nBEACON online\nBackend unreachable: node B";
        let proposals = m.scan_buffer(buf, "multi.log");
        assert_eq!(proposals.len(), 2);
    }
}
