use serde::{Deserialize, Serialize};
use crate::rules::canonical_math;

/// A single action submitted by the Node B orchestrator for batch resolution.
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SwarmAction {
    Attack {
        attacker_id: String,
        /// Optional: override stat/skill for testing.
        stat: Option<u8>,
        skill: Option<u8>,
        dv: u8,
        /// Context tag for situational modifiers (e.g. "melee", "aimed").
        context: Option<String>,
    },
    Damage {
        attacker_id: String,
        dice_count: u8, // e.g. 3 for 3d6
        bonus: i16,
        armour_sp: u8,
    },
}

/// The resolved result for a single `SwarmAction`.
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SwarmResult {
    pub attacker_id: String,
    pub action_type: String,
    pub d10: i32,
    pub stat: i32,
    pub skill: i32,
    pub mods: i32,
    pub total: i32,
    pub dv: i32,
    pub success: bool,
    pub detail: String,
}

pub fn resolve_swarm(actions: Vec<SwarmAction>) -> Vec<SwarmResult> {
    actions.into_iter().map(resolve_one).collect()
}

fn resolve_one(action: SwarmAction) -> SwarmResult {
    match action {
        SwarmAction::Attack {
            attacker_id,
            stat,
            skill,
            dv,
            context: _,
        } => {
            let d10 = canonical_math::roll_d10_exploding();
            let s = stat.unwrap_or(5) as i32;
            let sk = skill.unwrap_or(4) as i32;
            let total = d10 + s + sk;
            let success = total >= dv as i32;
            
            SwarmResult {
                attacker_id,
                action_type: "attack".to_string(),
                d10,
                stat: s,
                skill: sk,
                mods: 0,
                total,
                dv: dv as i32,
                success,
                detail: format!("roll={}+stat{}+skill{}={}, dv={}, hit={}", d10, s, sk, total, dv, success),
            }
        }

        SwarmAction::Damage {
            attacker_id,
            dice_count,
            bonus,
            armour_sp,
        } => {
            let mut rng = rand::thread_rng();
            use rand::Rng;
            let mut raw = 0;
            for _ in 0..dice_count {
                raw += rng.gen_range(1..=6);
            }
            let net = raw + bonus as i32 - armour_sp as i32;
            let total = net.max(0);
            
            SwarmResult {
                attacker_id,
                action_type: "damage".to_string(),
                d10: 0,
                stat: 0,
                skill: 0,
                mods: bonus as i32,
                total,
                dv: armour_sp as i32,
                success: total > 0,
                detail: format!("raw={}, bonus={}, sp={}, net={}", raw, bonus, armour_sp, total),
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
