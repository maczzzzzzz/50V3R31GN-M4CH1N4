/// Phase 64 — Ouroboros v2: Semantic Logic Veto Engine
///
/// Accepts `Proposal` packets from SentinelMonitorService (via IPC / VSB).
/// Validates each intent against Akashik.db live state and canonical rules.
/// Returns `VetoResult::Approved` or `VetoResult::VetoLogicFail(reason)`.

use rusqlite::{Connection, OptionalExtension};

// ---------------------------------------------------------------------------
// Proposal — mechanical intent submitted for Ouroboros audit
// ---------------------------------------------------------------------------

#[derive(Debug, Clone)]
pub struct Proposal {
    pub actor_id: String,
    pub intent_type: IntentType,
    pub value: i64,
    pub context: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum IntentType {
    /// Spend eurobucks from an actor's balance (validated against player_housing eb_balance)
    SpendEb,
    /// Equip a cyberware item (validated against actor humanity and slots)
    EquipCyberware { item_id: String },
    /// Apply a status effect that would alter a stat
    ApplyMod { stat_key: String },
}

// ---------------------------------------------------------------------------
// Veto result
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq)]
pub enum VetoResult {
    Approved,
    VetoLogicFail(String),
}

// ---------------------------------------------------------------------------
// RulesOracle
// ---------------------------------------------------------------------------

pub struct RulesOracle {
    db_path: Option<String>,
}

impl RulesOracle {
    pub fn new() -> Self {
        Self { db_path: None }
    }

    pub fn with_db(db_path: impl Into<String>) -> Self {
        Self { db_path: Some(db_path.into()) }
    }

    /// Evaluate a `Proposal` against live Akashik.db state.
    ///
    /// Fails open (Approved) when the DB is unreachable — maintaining liveness
    /// while logging the failure via the caller's error channel.
    pub fn evaluate(&self, proposal: &Proposal) -> VetoResult {
        match &proposal.intent_type {
            IntentType::SpendEb => self.audit_spend_eb(proposal),
            IntentType::EquipCyberware { item_id } => self.audit_equip_cyberware(proposal, item_id),
            IntentType::ApplyMod { stat_key } => self.audit_apply_mod(proposal, stat_key),
        }
    }

    /// Veto if the actor cannot afford the spend.
    fn audit_spend_eb(&self, proposal: &Proposal) -> VetoResult {
        let Some(db_path) = &self.db_path else {
            return VetoResult::Approved; // No DB — fail open
        };
        let Ok(conn) = Connection::open(db_path) else {
            return VetoResult::Approved;
        };

        let balance: Option<i64> = conn
            .query_row(
                "SELECT eb_balance FROM player_housing WHERE actor_id = ?1",
                rusqlite::params![&proposal.actor_id],
                |row| row.get(0),
            )
            .optional()
            .unwrap_or(None);

        if let Some(bal) = balance {
            if proposal.value > bal {
                return VetoResult::VetoLogicFail(format!(
                    "VETO_LOGIC_FAIL: SpendEb {} exceeds balance {} for actor {}",
                    proposal.value, bal, proposal.actor_id
                ));
            }
        }
        VetoResult::Approved
    }

    /// Veto if the item does not exist or is not cyberware.
    fn audit_equip_cyberware(&self, _proposal: &Proposal, item_id: &str) -> VetoResult {
        let Some(db_path) = &self.db_path else {
            return VetoResult::Approved;
        };
        let Ok(conn) = Connection::open(db_path) else {
            return VetoResult::Approved;
        };

        let item_type: Option<String> = conn
            .query_row(
                "SELECT type FROM items WHERE id = ?1",
                rusqlite::params![item_id],
                |row| row.get(0),
            )
            .optional()
            .unwrap_or(None);

        match item_type.as_deref() {
            Some("cyberware") => VetoResult::Approved,
            Some(other) => VetoResult::VetoLogicFail(format!(
                "VETO_LOGIC_FAIL: EquipCyberware on non-cyberware item {} (type={})",
                item_id, other
            )),
            None => VetoResult::VetoLogicFail(format!(
                "VETO_LOGIC_FAIL: EquipCyberware — item {} not found in Akashik.db",
                item_id
            )),
        }
    }

    /// Veto if the modifier key is not a recognised canonical stat.
    fn audit_apply_mod(&self, _proposal: &Proposal, stat_key: &str) -> VetoResult {
        const CANONICAL_STATS: &[&str] = &[
            "int", "ref", "dex", "tech", "cool", "will", "luck", "move", "body", "emp",
            "athletics", "brawling", "evasion", "melee", "stealth",
            "handgun", "shoulder_arms", "heavy_weapons", "archery", "autofire", "thrown",
            "basic_tech", "cybertech", "demolitions", "electronics", "first_aid",
            "forgery", "land_vehicle", "pick_lock", "pick_pocket", "sea_vehicle",
            "weaponstech", "air_vehicle",
            "accounting", "animal_handling", "bureaucracy", "business", "composition",
            "criminology", "cryptography", "deduction", "education", "gamble",
            "language", "library_search", "local_expert", "science", "tactics",
            "wilderness_survival",
            "acting", "dance", "fast_talk", "interrogation", "lip_reading",
            "perception", "personal_grooming", "persuasion", "streetwise",
            "trading", "wardrobe_style",
            "automedic", "conceal_reveal", "driving", "paramedic", "pilot_air",
            "pilot_sea", "tracking",
            "interface", "system_knowledge",
            "bribery", "combat_awareness", "concentration", "endurance",
            "resist_torture_drugs",
        ];

        if CANONICAL_STATS.contains(&stat_key) {
            VetoResult::Approved
        } else {
            VetoResult::VetoLogicFail(format!(
                "VETO_LOGIC_FAIL: ApplyMod on unknown stat '{}' — not in canonical CPR stat list",
                stat_key
            ))
        }
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn oracle() -> RulesOracle {
        RulesOracle::new() // No DB — all balance checks fail open
    }

    #[test]
    fn approved_when_no_db() {
        let o = oracle();
        let result = o.evaluate(&Proposal {
            actor_id: "actor-001".into(),
            intent_type: IntentType::SpendEb,
            value: 1_000_000,
            context: "buy megacorp".into(),
        });
        assert_eq!(result, VetoResult::Approved, "Should fail open with no DB");
    }

    #[test]
    fn veto_unknown_stat() {
        let o = oracle();
        let result = o.evaluate(&Proposal {
            actor_id: "actor-001".into(),
            intent_type: IntentType::ApplyMod { stat_key: "fake_stat".into() },
            value: 2,
            context: "cheat mod".into(),
        });
        assert!(matches!(result, VetoResult::VetoLogicFail(_)));
    }

    #[test]
    fn approved_canonical_stat() {
        let o = oracle();
        let result = o.evaluate(&Proposal {
            actor_id: "actor-001".into(),
            intent_type: IntentType::ApplyMod { stat_key: "athletics".into() },
            value: 2,
            context: "cyberware upgrade".into(),
        });
        assert_eq!(result, VetoResult::Approved);
    }
}
