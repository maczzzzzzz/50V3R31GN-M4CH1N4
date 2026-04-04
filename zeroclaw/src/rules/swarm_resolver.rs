use serde::{Deserialize, Serialize};

/// A single action submitted by the Node B orchestrator for batch resolution.
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SwarmAction {
    Attack {
        attacker_id: String,
        /// Pre-rolled d10 values.
        dice: Vec<u8>,
        stat: u8,
        skill: u8,
        dv: u8,
    },
    Damage {
        attacker_id: String,
        /// Pre-rolled damage dice values.
        dice: Vec<u8>,
        bonus: i16,
        armour_sp: u8,
    },
}

/// The resolved result for a single `SwarmAction`.
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SwarmResult {
    pub attacker_id: String,
    /// Either `"attack"` or `"damage"`.
    pub action_type: String,
    pub total: i32,
    /// For attacks: `true` if `total >= dv`. For damage: `true` if net damage `> 0`.
    pub success: bool,
    /// Human-readable breakdown string.
    pub detail: String,
}

/// Resolve an entire NPC swarm batch in a single sequential pass.
///
/// This function is pure CPU arithmetic with no global mutable state,
/// making it trivially thread-safe and suitable for parallel tokio tasks.
pub fn resolve_swarm(actions: Vec<SwarmAction>) -> Vec<SwarmResult> {
    actions.into_iter().map(resolve_one).collect()
}

fn resolve_one(action: SwarmAction) -> SwarmResult {
    match action {
        SwarmAction::Attack {
            attacker_id,
            dice,
            stat,
            skill,
            dv,
        } => {
            let roll_sum: i32 = dice.iter().map(|&d| d as i32).sum();
            let total = roll_sum + stat as i32 + skill as i32;
            let success = total >= dv as i32;
            let detail = format!(
                "roll={total}, dv={dv}, hit={success}"
            );
            SwarmResult {
                attacker_id,
                action_type: "attack".to_string(),
                total,
                success,
                detail,
            }
        }

        SwarmAction::Damage {
            attacker_id,
            dice,
            bonus,
            armour_sp,
        } => {
            let raw: i32 = dice.iter().map(|&d| d as i32).sum();
            let net = raw + bonus as i32 - armour_sp as i32;
            let total = net.max(0);
            let success = total > 0;
            let detail = format!(
                "raw={raw}, bonus={bonus}, sp={armour_sp}, net={total}"
            );
            SwarmResult {
                attacker_id,
                action_type: "damage".to_string(),
                total,
                success,
                detail,
            }
        }
    }
}

// ── Unit Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_batch() {
        let results = resolve_swarm(vec![]);
        assert!(results.is_empty());
    }

    #[test]
    fn test_single_attack_hit() {
        // dice=[7], stat=5, skill=4 → total=16, dv=14 → hit
        let actions = vec![SwarmAction::Attack {
            attacker_id: "npc_01".to_string(),
            dice: vec![7],
            stat: 5,
            skill: 4,
            dv: 14,
        }];
        let results = resolve_swarm(actions);
        assert_eq!(results.len(), 1);
        let r = &results[0];
        assert_eq!(r.attacker_id, "npc_01");
        assert_eq!(r.action_type, "attack");
        assert_eq!(r.total, 16);
        assert!(r.success);
        assert_eq!(r.detail, "roll=16, dv=14, hit=true");
    }

    #[test]
    fn test_single_attack_miss() {
        // dice=[3], stat=2, skill=1 → total=6, dv=14 → miss
        let actions = vec![SwarmAction::Attack {
            attacker_id: "npc_02".to_string(),
            dice: vec![3],
            stat: 2,
            skill: 1,
            dv: 14,
        }];
        let results = resolve_swarm(actions);
        assert_eq!(results.len(), 1);
        let r = &results[0];
        assert_eq!(r.total, 6);
        assert!(!r.success);
        assert_eq!(r.detail, "roll=6, dv=14, hit=false");
    }

    #[test]
    fn test_damage_with_armour_reduction() {
        // dice=[4,3]=7, bonus=2, armour_sp=8 → net=1, total=1, success=true
        let actions = vec![SwarmAction::Damage {
            attacker_id: "npc_03".to_string(),
            dice: vec![4, 3],
            bonus: 2,
            armour_sp: 8,
        }];
        let results = resolve_swarm(actions);
        assert_eq!(results.len(), 1);
        let r = &results[0];
        assert_eq!(r.action_type, "damage");
        assert_eq!(r.total, 1);
        assert!(r.success);
        assert_eq!(r.detail, "raw=7, bonus=2, sp=8, net=1");
    }

    #[test]
    fn test_damage_fully_absorbed_by_armour() {
        // dice=[2], bonus=0, armour_sp=10 → net=-8 → clamped to 0, success=false
        let actions = vec![SwarmAction::Damage {
            attacker_id: "npc_04".to_string(),
            dice: vec![2],
            bonus: 0,
            armour_sp: 10,
        }];
        let results = resolve_swarm(actions);
        let r = &results[0];
        assert_eq!(r.total, 0);
        assert!(!r.success);
        assert_eq!(r.detail, "raw=2, bonus=0, sp=10, net=0");
    }

    #[test]
    fn test_mixed_batch() {
        // Two attacks, one damage — order preserved, correct types.
        let actions = vec![
            SwarmAction::Attack {
                attacker_id: "a1".to_string(),
                dice: vec![10],
                stat: 6,
                skill: 4,
                dv: 15,
            },
            SwarmAction::Damage {
                attacker_id: "a1".to_string(),
                dice: vec![5, 5],
                bonus: 3,
                armour_sp: 4,
            },
            SwarmAction::Attack {
                attacker_id: "a2".to_string(),
                dice: vec![1],
                stat: 2,
                skill: 1,
                dv: 20,
            },
        ];
        let results = resolve_swarm(actions);
        assert_eq!(results.len(), 3);

        // First: attack hit (10+6+4=20 >= 15)
        assert_eq!(results[0].action_type, "attack");
        assert_eq!(results[0].total, 20);
        assert!(results[0].success);

        // Second: damage (5+5+3-4=9)
        assert_eq!(results[1].action_type, "damage");
        assert_eq!(results[1].total, 9);
        assert!(results[1].success);

        // Third: attack miss (1+2+1=4 < 20)
        assert_eq!(results[2].action_type, "attack");
        assert_eq!(results[2].total, 4);
        assert!(!results[2].success);
    }
}
