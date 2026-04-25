/**
 * RESONANT RULE ENGINE — PHASE 77
 *
 * Deterministic, zero-ML policy evaluation.
 * Rules are loaded from the SOVEREIGN-IDENTITY.md permission_policy block
 * and evaluated synchronously — no async, no I/O, no randomness.
 *
 * Policy matrix (built-in):
 *
 *   policy "default"    — allows llm_query, profile_switch (named)
 *                         denies shell_exec, vault_op with destructive flag
 *   policy "hardened"   — allows llm_query only
 *                         escalates everything else to Strategist
 *   policy "researcher" — allows llm_query, vault_op (read-only)
 *                         denies shell_exec
 *
 * Evaluation order: DENY → ESCALATE → ALLOW → (default: Escalate/unknown)
 */

use crate::decision_audit::{DecisionAudit, Verdict};
use std::collections::{HashMap, HashSet};

// ── PolicyRule ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct PolicyRule {
    /// policy name (matches DecisionAudit.policy)
    pub policy:   String,
    /// action_types explicitly allowed
    pub allowed:  HashSet<String>,
    /// action_types explicitly denied (checked before allowed)
    pub denied:   HashSet<String>,
    /// action_types that require human escalation
    pub escalate: HashSet<String>,
    /// If true, any action not in allowed/denied/escalate is denied.
    /// If false, unknown actions are escalated.
    pub deny_unknown: bool,
}

impl PolicyRule {
    fn new(policy: &str, deny_unknown: bool) -> Self {
        PolicyRule {
            policy:       policy.to_string(),
            allowed:      HashSet::new(),
            denied:       HashSet::new(),
            escalate:     HashSet::new(),
            deny_unknown,
        }
    }

    fn allow(mut self, actions: &[&str]) -> Self {
        self.allowed.extend(actions.iter().map(|s| s.to_string()));
        self
    }

    fn deny(mut self, actions: &[&str]) -> Self {
        self.denied.extend(actions.iter().map(|s| s.to_string()));
        self
    }

    fn escalate(mut self, actions: &[&str]) -> Self {
        self.escalate.extend(actions.iter().map(|s| s.to_string()));
        self
    }
}

// ── RuleEngine ────────────────────────────────────────────────────────────────

pub struct RuleEngine {
    rules: HashMap<String, PolicyRule>,
}

impl RuleEngine {
    /// Build the engine from the built-in policy matrix.
    pub fn default_policies() -> Self {
        let mut rules = HashMap::new();

        // "default" — standard daily-use profile
        rules.insert("default".to_string(), PolicyRule::new("default", false)
            .allow(&["llm_query", "profile_switch", "status_query"])
            .deny(&["shell_exec_destructive", "vault_wipe"])
            .escalate(&["shell_exec", "vault_op"])
        );

        // "hardened" — minimal attack surface
        rules.insert("hardened".to_string(), PolicyRule::new("hardened", true)
            .allow(&["llm_query"])
            .deny(&["shell_exec", "shell_exec_destructive", "vault_wipe"])
            .escalate(&["profile_switch", "vault_op"])
        );

        // "researcher" — read-heavy, vault reads OK
        rules.insert("researcher".to_string(), PolicyRule::new("researcher", false)
            .allow(&["llm_query", "vault_op_read", "status_query"])
            .deny(&["shell_exec_destructive", "vault_wipe", "shell_exec"])
            .escalate(&["profile_switch", "vault_op"])
        );

        RuleEngine { rules }
    }

    /// Evaluate a `DecisionAudit` against the loaded policy rules.
    ///
    /// Evaluation order: DENY > ESCALATE > ALLOW > (default per policy)
    pub fn evaluate(&self, audit: &DecisionAudit) -> Verdict {
        let rule = match self.rules.get(&audit.policy) {
            Some(r) => r,
            None => {
                return Verdict::Escalate {
                    reason: format!(
                        "unknown policy '{}' — cannot evaluate action '{}'",
                        audit.policy, audit.action_type
                    ),
                };
            }
        };

        let action = &audit.action_type;

        // 1. Explicit deny — highest precedence
        if rule.denied.contains(action) {
            return Verdict::Denied {
                reason: format!(
                    "action '{}' is explicitly denied under policy '{}'",
                    action, audit.policy
                ),
            };
        }

        // 2. Explicit escalate
        if rule.escalate.contains(action) {
            return Verdict::Escalate {
                reason: format!(
                    "action '{}' requires Strategist approval under policy '{}'",
                    action, audit.policy
                ),
            };
        }

        // 3. Explicit allow
        if rule.allowed.contains(action) {
            return Verdict::Approved;
        }

        // 4. Default for unknown actions
        if rule.deny_unknown {
            Verdict::Denied {
                reason: format!(
                    "action '{}' not in policy '{}' allowlist (deny_unknown=true)",
                    action, audit.policy
                ),
            }
        } else {
            Verdict::Escalate {
                reason: format!(
                    "action '{}' not explicitly listed in policy '{}' — escalating",
                    action, audit.policy
                ),
            }
        }
    }

    /// Register a custom policy rule (for runtime policy additions).
    pub fn register(&mut self, rule: PolicyRule) {
        self.rules.insert(rule.policy.clone(), rule);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::decision_audit::DecisionAudit;

    fn audit(policy: &str, action: &str) -> DecisionAudit {
        DecisionAudit::new("req", policy, action, "test", serde_json::Value::Null)
    }

    #[test]
    fn default_policy_allows_llm_query() {
        let engine = RuleEngine::default_policies();
        assert_eq!(engine.evaluate(&audit("default", "llm_query")), Verdict::Approved);
    }

    #[test]
    fn default_policy_denies_vault_wipe() {
        let engine = RuleEngine::default_policies();
        let v = engine.evaluate(&audit("default", "vault_wipe"));
        assert!(matches!(v, Verdict::Denied { .. }));
    }

    #[test]
    fn default_policy_escalates_shell_exec() {
        let engine = RuleEngine::default_policies();
        let v = engine.evaluate(&audit("default", "shell_exec"));
        assert!(matches!(v, Verdict::Escalate { .. }));
    }

    #[test]
    fn hardened_policy_denies_everything_except_llm() {
        let engine = RuleEngine::default_policies();
        assert_eq!(engine.evaluate(&audit("hardened", "llm_query")), Verdict::Approved);
        assert!(matches!(engine.evaluate(&audit("hardened", "shell_exec")), Verdict::Denied { .. }));
        assert!(matches!(engine.evaluate(&audit("hardened", "some_new_action")), Verdict::Denied { .. }));
    }

    #[test]
    fn unknown_policy_escalates() {
        let engine = RuleEngine::default_policies();
        let v = engine.evaluate(&audit("ghost_policy", "llm_query"));
        assert!(matches!(v, Verdict::Escalate { .. }));
    }

    #[test]
    fn deny_takes_precedence_over_allow() {
        // Contrived spec: action in both denied and allowed — deny wins
        let mut engine = RuleEngine::default_policies();
        let rule = PolicyRule::new("conflict_test", false)
            .allow(&["contested"])
            .deny(&["contested"]);
        engine.register(rule);
        let v = engine.evaluate(&audit("conflict_test", "contested"));
        assert!(matches!(v, Verdict::Denied { .. }));
    }
}
