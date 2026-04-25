/**
 * RESONANT LOGIC GATE — PHASE 77
 *
 * Deterministic governance layer between LLM output and system execution.
 *
 * Every action proposed by a node (Node B/C or Hermes Orchestrator) MUST
 * pass through the ResonantGate before dispatch. The gate evaluates the
 * DecisionAudit against the active permission_policy and returns a Verdict:
 *
 *   Approved  → action proceeds
 *   Denied    → action blocked; error returned to caller
 *   Escalate  → action deferred; Strategist notification queued
 *
 * The gate is stateless per-call — no I/O, no async, fully deterministic.
 *
 * Usage:
 *   let gate = ResonantGate::default();
 *   let mut audit = DecisionAudit::new("req-1", "default", "shell_exec", "node_b", payload);
 *   let verdict = gate.evaluate(&mut audit);
 */

pub mod decision_audit;
pub mod rule_engine;

pub use decision_audit::{DecisionAudit, Verdict};
pub use rule_engine::{PolicyRule, RuleEngine};

use tracing::{info, warn};

// ── ResonantGate ──────────────────────────────────────────────────────────────

pub struct ResonantGate {
    engine: RuleEngine,
}

impl ResonantGate {
    pub fn new(engine: RuleEngine) -> Self {
        ResonantGate { engine }
    }

    /// Evaluate the audit, stamp the verdict, and return it.
    ///
    /// The audit record is mutated in-place so callers can persist the
    /// stamped record to the decision log.
    pub fn evaluate<'a>(&self, audit: &'a mut DecisionAudit) -> &'a Verdict {
        let verdict = self.engine.evaluate(audit);

        match &verdict {
            Verdict::Approved => {
                info!(
                    "[GATE] APPROVED req={} policy={} action={}",
                    audit.request_id, audit.policy, audit.action_type
                );
            }
            Verdict::Denied { reason } => {
                warn!(
                    "[GATE] DENIED req={} policy={} action={} reason={}",
                    audit.request_id, audit.policy, audit.action_type, reason
                );
            }
            Verdict::Escalate { reason } => {
                warn!(
                    "[GATE] ESCALATE req={} policy={} action={} reason={}",
                    audit.request_id, audit.policy, audit.action_type, reason
                );
            }
        }

        audit.stamp(verdict);
        // Safe: we just stamped it.
        audit.verdict.as_ref().unwrap()
    }
}

impl Default for ResonantGate {
    fn default() -> Self {
        ResonantGate::new(RuleEngine::default_policies())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gate_approves_and_stamps() {
        let gate = ResonantGate::default();
        let mut audit = DecisionAudit::new(
            "req-gate-1", "default", "llm_query", "orchestrator",
            serde_json::Value::Null,
        );
        let verdict = gate.evaluate(&mut audit);
        assert_eq!(*verdict, Verdict::Approved);
        assert!(audit.verdict.is_some());
    }

    #[test]
    fn gate_denies_destructive_shell() {
        let gate = ResonantGate::default();
        let mut audit = DecisionAudit::new(
            "req-gate-2", "default", "shell_exec_destructive", "node_b",
            serde_json::Value::Null,
        );
        let verdict = gate.evaluate(&mut audit);
        assert!(matches!(verdict, Verdict::Denied { .. }));
    }
}
