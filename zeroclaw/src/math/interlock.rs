// zeroclaw/src/math/interlock.rs
//
// Cyberpunk RED Interlock System — pure deterministic math.
// No RNG here: callers supply the d10 roll (already resolved by Node B
// or stubbed in tests). This keeps the math engine 100% unit-testable.
//
// Core resolution: roll + stat + skill vs. DV
//   result >= DV → Hit / Success
//   result <  DV → Miss / Failure
//
// Critical Success:  natural 10 on d10 — roll again and add (recursive, uncapped)
// Critical Failure:  natural 1 on d10  — subtract a second roll from total
//
// Damage: weapon_dice × dice_sides + bonus (e.g. 3d6+2)
// Armour: SP reduces damage by SP, minimum 0

use serde::{Deserialize, Serialize};

// ── Roll Resolution ───────────────────────────────────────────────────────────

/// A resolved d10 roll sequence for Interlock critical handling.
/// `dice` holds all dice in the chain: [first, crit_extension?, ...]
/// For a normal roll: dice = [5] → total = 5
/// For a crit success: dice = [10, 7] → total = 10 + 7 = 17
/// For a crit failure: dice = [1, 4] → total = 1 - 4 = -3
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct InterlockRoll {
    /// All dice in the chain (first element is the triggering roll).
    pub dice: Vec<i32>,
    /// Final resolved total (after critical chain math).
    pub total: i32,
    /// True if the first die was a natural 10 (critical success trigger).
    pub is_critical_success: bool,
    /// True if the first die was a natural 1 (critical failure trigger).
    pub is_critical_failure: bool,
}

/// Resolve a d10 roll chain into an `InterlockRoll`.
///
/// Rules:
/// - Natural 10: add the next die in `dice` (recursively if that is also 10).
/// - Natural 1:  subtract the next die in `dice` from the total.
/// - Otherwise: total = dice[0].
///
/// # Panics
/// Panics if `dice` is empty or if critical handling requires more dice than provided.
pub fn resolve_roll(dice: &[i32]) -> InterlockRoll {
    assert!(!dice.is_empty(), "dice slice must not be empty");

    let first = dice[0];
    let is_crit_success = first == 10;
    let is_crit_failure = first == 1;

    let total = if is_crit_success {
        // Add extension chain starting at dice[1]
        let extension = resolve_extension(&dice[1..], true);
        first + extension
    } else if is_crit_failure {
        assert!(dice.len() > 1, "critical failure requires a second die");
        first - dice[1]
    } else {
        first
    };

    InterlockRoll {
        dice: dice.to_vec(),
        total,
        is_critical_success: is_crit_success,
        is_critical_failure: is_crit_failure,
    }
}

/// Recursively resolve a critical success extension chain.
fn resolve_extension(dice: &[i32], _first_call: bool) -> i32 {
    assert!(!dice.is_empty(), "critical success requires an extension die");
    let d = dice[0];
    if d == 10 && dice.len() > 1 {
        d + resolve_extension(&dice[1..], false)
    } else {
        d
    }
}

// ── Attack Resolution ─────────────────────────────────────────────────────────

/// Result of a single attack check.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AttackResult {
    /// The underlying d10 roll (with crit chain).
    pub roll: InterlockRoll,
    /// Stat modifier (REF for ranged, BODY for melee).
    pub stat: i32,
    /// Skill level (Handgun, Brawling, etc.).
    pub skill: i32,
    /// Difficulty Value the attacker was contesting.
    pub dv: i32,
    /// Final attack total (roll.total + stat + skill).
    pub attack_total: i32,
    /// True if attack_total >= dv.
    pub hit: bool,
}

/// Resolve an attack check.
///
/// # Arguments
/// * `roll`  – Pre-resolved d10 roll chain.
/// * `stat`  – Relevant stat value (e.g. REF = 6).
/// * `skill` – Relevant skill level (e.g. Handgun = 4).
/// * `dv`    – Target Difficulty Value.
pub fn resolve_attack(roll: InterlockRoll, stat: i32, skill: i32, dv: i32) -> AttackResult {
    let attack_total = roll.total + stat + skill;
    AttackResult {
        roll,
        stat,
        skill,
        dv,
        attack_total,
        hit: attack_total >= dv,
    }
}

// ── Damage Resolution ─────────────────────────────────────────────────────────

/// Result of a damage roll.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DamageResult {
    /// Individual die results.
    pub dice: Vec<i32>,
    /// Flat bonus added to the dice sum.
    pub bonus: i32,
    /// Sum of all dice + bonus (raw, before armour).
    pub raw: i32,
    /// Armour SP that absorbs damage.
    pub armour_sp: i32,
    /// Final damage after SP reduction (minimum 0).
    pub final_damage: i32,
}

/// Resolve a damage roll against armour.
///
/// # Arguments
/// * `dice`     – Pre-rolled damage dice (e.g. [3, 5, 2] for 3d6 rolled 3/5/2).
/// * `bonus`    – Flat damage bonus (may be 0 or negative).
/// * `armour_sp`– Stopping Power of the target's armour.
pub fn resolve_damage(dice: &[i32], bonus: i32, armour_sp: i32) -> DamageResult {
    let raw = dice.iter().sum::<i32>() + bonus;
    let final_damage = (raw - armour_sp).max(0);
    DamageResult {
        dice: dice.to_vec(),
        bonus,
        raw,
        armour_sp,
        final_damage,
    }
}

// ── DV Table ──────────────────────────────────────────────────────────────────

/// Standard Difficulty Values from the Interlock System (CPRED p. 130).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Dv {
    Everyday = 9,
    Difficult = 13,
    Professional = 15,
    Heroic = 17,
    SuperHeroic = 21,
    Legendary = 24,
}

/// Ranged weapon DV by range band (CPRED p. 147-148).
/// Distances are upper bounds in metres.
pub fn ranged_dv(range_metres: u32) -> i32 {
    match range_metres {
        0..=6 => 13,    // Close range
        7..=12 => 15,   // Medium range
        13..=25 => 20,  // Long range
        26..=50 => 25,  // Extreme range
        _ => 30,        // Beyond extreme
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── resolve_roll ──────────────────────────────────────────────────────────

    #[test]
    fn test_normal_roll_returns_face_value() {
        let r = resolve_roll(&[7]);
        assert_eq!(r.total, 7);
        assert!(!r.is_critical_success);
        assert!(!r.is_critical_failure);
    }

    #[test]
    fn test_critical_success_adds_extension_die() {
        // Natural 10 + extension 7 = 17
        let r = resolve_roll(&[10, 7]);
        assert_eq!(r.total, 17);
        assert!(r.is_critical_success);
        assert!(!r.is_critical_failure);
    }

    #[test]
    fn test_critical_success_chain_recursive() {
        // 10 + 10 + 6 = 26
        let r = resolve_roll(&[10, 10, 6]);
        assert_eq!(r.total, 26);
        assert!(r.is_critical_success);
    }

    #[test]
    fn test_critical_failure_subtracts_second_die() {
        // 1 - 5 = -4
        let r = resolve_roll(&[1, 5]);
        assert_eq!(r.total, -4);
        assert!(r.is_critical_failure);
        assert!(!r.is_critical_success);
    }

    #[test]
    fn test_critical_failure_zero_result() {
        // 1 - 1 = 0
        let r = resolve_roll(&[1, 1]);
        assert_eq!(r.total, 0);
        assert!(r.is_critical_failure);
    }

    // ── resolve_attack ────────────────────────────────────────────────────────

    #[test]
    fn test_attack_hits_when_total_meets_dv() {
        // roll=8, stat=6, skill=4 → total=18 vs DV 15 → hit
        let roll = resolve_roll(&[8]);
        let result = resolve_attack(roll, 6, 4, 15);
        assert_eq!(result.attack_total, 18);
        assert!(result.hit);
    }

    #[test]
    fn test_attack_misses_when_total_below_dv() {
        // roll=2, stat=3, skill=2 → total=7 vs DV 13 → miss
        let roll = resolve_roll(&[2]);
        let result = resolve_attack(roll, 3, 2, 13);
        assert_eq!(result.attack_total, 7);
        assert!(!result.hit);
    }

    #[test]
    fn test_attack_exactly_at_dv_is_hit() {
        // roll=5, stat=4, skill=4 → total=13 vs DV 13 → hit (>= not >)
        let roll = resolve_roll(&[5]);
        let result = resolve_attack(roll, 4, 4, 13);
        assert_eq!(result.attack_total, 13);
        assert!(result.hit);
    }

    #[test]
    fn test_critical_attack_increases_total() {
        // Crit chain 10+8=18, stat=6, skill=4 → total=28 vs DV 25 → hit
        let roll = resolve_roll(&[10, 8]);
        let result = resolve_attack(roll, 6, 4, 25);
        assert_eq!(result.attack_total, 28);
        assert!(result.hit);
    }

    // ── resolve_damage ────────────────────────────────────────────────────────

    #[test]
    fn test_damage_reduces_by_armour_sp() {
        // 3d6 → [4, 3, 5] = 12, +2 bonus, SP=7 → 12+2-7 = 7
        let result = resolve_damage(&[4, 3, 5], 2, 7);
        assert_eq!(result.raw, 14);
        assert_eq!(result.final_damage, 7);
    }

    #[test]
    fn test_damage_cannot_be_negative() {
        // Small damage absorbed entirely by heavy armour
        let result = resolve_damage(&[1, 1], 0, 20);
        assert_eq!(result.final_damage, 0);
    }

    #[test]
    fn test_damage_with_zero_armour_equals_raw() {
        let result = resolve_damage(&[6, 6, 6], 0, 0);
        assert_eq!(result.final_damage, 18);
        assert_eq!(result.raw, 18);
    }

    // ── ranged_dv ─────────────────────────────────────────────────────────────

    #[test]
    fn test_ranged_dv_close_range() {
        assert_eq!(ranged_dv(5), 13);
    }

    #[test]
    fn test_ranged_dv_medium_range() {
        assert_eq!(ranged_dv(10), 15);
    }

    #[test]
    fn test_ranged_dv_long_range() {
        assert_eq!(ranged_dv(20), 20);
    }

    #[test]
    fn test_ranged_dv_extreme_range() {
        assert_eq!(ranged_dv(40), 25);
    }

    #[test]
    fn test_ranged_dv_beyond_extreme() {
        assert_eq!(ranged_dv(100), 30);
    }
}
