/**
 * DECISION AUDIT — PHASE 77
 *
 * Structured record of every action proposed by the LLM output layer.
 * Every audit entry is evaluated by the RuleEngine before execution.
 *
 * Wire format: JSON — produced by the LangGraph Orchestrator and consumed
 * by the ResonantGate before any system command is dispatched.
 */

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

// ── Verdict ───────────────────────────────────────────────────────────────────

/// Gate verdict returned by `RuleEngine::evaluate`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "verdict", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Verdict {
    /// Action is within policy — proceed.
    Approved,
    /// Action is explicitly denied by policy.
    Denied { reason: String },
    /// Policy is ambiguous for this action — require human Strategist review.
    Escalate { reason: String },
}

impl Verdict {
    pub fn is_approved(&self) -> bool {
        matches!(self, Verdict::Approved)
    }

    pub fn reason(&self) -> Option<&str> {
        match self {
            Verdict::Denied   { reason } | Verdict::Escalate { reason } => Some(reason),
            Verdict::Approved => None,
        }
    }
}

// ── DecisionAudit ─────────────────────────────────────────────────────────────

/// A single proposed action emitted by the LLM output layer.
///
/// Fields mirror the `/decision_audit` JSON schema expected from
/// LangGraph Orchestrator (`src/core/hermes/LangGraphOrchestrator.ts`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionAudit {
    /// Unique request identifier (UUIDv4 or snowflake from Orchestrator).
    pub request_id:  String,
    /// The active permission_policy at evaluation time (from SOVEREIGN-IDENTITY.md).
    pub policy:      String,
    /// Action category — maps to RuleEngine's allow/deny lists.
    /// Examples: "profile_switch", "vault_op", "shell_exec", "llm_query"
    pub action_type: String,
    /// Submitting agent or node label (e.g. "node_b", "hermes-tui", "orchestrator").
    pub agent_id:    String,
    /// Arbitrary action payload — inspected by policy rules.
    pub payload:     serde_json::Value,
    /// Unix timestamp (ms) when the audit was created.
    pub timestamp_ms: u64,
    /// Gate verdict — populated by ResonantGate after evaluation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verdict:     Option<Verdict>,
}

impl DecisionAudit {
    /// Construct a new pre-verdict audit entry.
    pub fn new(
        request_id:  impl Into<String>,
        policy:      impl Into<String>,
        action_type: impl Into<String>,
        agent_id:    impl Into<String>,
        payload:     serde_json::Value,
    ) -> Self {
        let timestamp_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        DecisionAudit {
            request_id:  request_id.into(),
            policy:      policy.into(),
            action_type: action_type.into(),
            agent_id:    agent_id.into(),
            payload,
            timestamp_ms,
            verdict:     None,
        }
    }

    /// Stamp the verdict onto this audit record.
    pub fn stamp(&mut self, verdict: Verdict) {
        self.verdict = Some(verdict);
    }

    /// Serialize to JSON for logging / persistence.
    pub fn to_json(&self) -> serde_json::Result<String> {
        serde_json::to_string(self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verdict_approved_is_approved() {
        assert!(Verdict::Approved.is_approved());
        assert!(!Verdict::Denied { reason: "x".into() }.is_approved());
    }

    #[test]
    fn audit_stamp_round_trips_json() {
        let mut audit = DecisionAudit::new(
            "req-1", "default", "shell_exec", "orchestrator",
            serde_json::json!({"cmd": "ls"}),
        );
        audit.stamp(Verdict::Denied { reason: "not allowed".into() });
        let json = audit.to_json().unwrap();
        let recovered: DecisionAudit = serde_json::from_str(&json).unwrap();
        assert_eq!(recovered.action_type, "shell_exec");
        assert!(!recovered.verdict.unwrap().is_approved());
    }
}
