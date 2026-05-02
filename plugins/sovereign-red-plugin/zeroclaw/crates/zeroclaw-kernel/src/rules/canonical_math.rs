/// zeroclaw/src/rules/canonical_math.rs
/// Phase 59: Canonical combat math — exploding d10 and CPRMod modifier stacking.
///
/// Rules: Cyberpunk RED Core Rulebook
///   - 10s explode upward (roll again, add)
///   - 1s explode downward (roll again, subtract)
///   - CPRMod: permanent bonuses always apply; situational bonuses apply when
///     the trigger_tag matches the current action context.

use rand::Rng;

// ---------------------------------------------------------------------------
// Exploding d10
// ---------------------------------------------------------------------------

/// Roll a single exploding d10.
/// 10 → roll again and add; 1 → roll again and subtract.
pub fn roll_d10_exploding() -> i32 {
    let mut rng = rand::thread_rng();
    let mut total: i32 = 0;
    let mut current = rng.gen_range(1..=10);
    total += current as i32;

    // Explode up
    while current == 10 {
        current = rng.gen_range(1..=10);
        total += current as i32;
    }

    // Explode down: re-roll from the initial roll
    let mut initial = rng.gen_range(1..=10);
    if initial == 1 {
        total = initial as i32;
        loop {
            initial = rng.gen_range(1..=10);
            total -= initial as i32;
            if initial != 1 { break; }
        }
    }

    total
}

/// Roll a stat check: 1d10 (exploding) + stat + skill.
pub fn roll_stat_check(stat: i32, skill: i32) -> i32 {
    roll_d10_exploding() + stat + skill
}

// ---------------------------------------------------------------------------
// CPRMod — modifier stacking
// ---------------------------------------------------------------------------

/// A single modifier as stored in `item_modifiers`.
#[derive(Debug, Clone)]
pub struct CprMod {
    pub key: String,
    pub value: i32,
    pub mode: ModMode,
    pub trigger_tag: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ModMode {
    Permanent,
    Situational,
}

impl CprMod {
    pub fn new_permanent(key: impl Into<String>, value: i32) -> Self {
        Self { key: key.into(), value, mode: ModMode::Permanent, trigger_tag: None }
    }

    pub fn new_situational(key: impl Into<String>, value: i32, tag: impl Into<String>) -> Self {
        Self { key: key.into(), value, mode: ModMode::Situational, trigger_tag: Some(tag.into()) }
    }
}

/// Aggregate modifiers for a given stat key and optional action context tag.
///
/// Returns the total bonus/penalty to apply.
pub fn aggregate_mods(mods: &[CprMod], key: &str, context_tag: Option<&str>) -> i32 {
    mods.iter()
        .filter(|m| m.key == key)
        .filter(|m| match m.mode {
            ModMode::Permanent => true,
            ModMode::Situational => m.trigger_tag.as_deref() == context_tag,
        })
        .map(|m| m.value)
        .sum()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roll_d10_returns_nonzero_range() {
        // Statistical: over 1000 rolls, never 0
        for _ in 0..1000 {
            let r = roll_d10_exploding();
            assert!(r != 0, "exploding d10 should never be 0");
        }
    }

    #[test]
    fn aggregate_permanent_always_applies() {
        let mods = vec![CprMod::new_permanent("athletics", 2)];
        assert_eq!(aggregate_mods(&mods, "athletics", None), 2);
        assert_eq!(aggregate_mods(&mods, "athletics", Some("ranged")), 2);
    }

    #[test]
    fn aggregate_situational_only_with_tag() {
        let mods = vec![CprMod::new_situational("athletics", 3, "melee")];
        assert_eq!(aggregate_mods(&mods, "athletics", None), 0);
        assert_eq!(aggregate_mods(&mods, "athletics", Some("ranged")), 0);
        assert_eq!(aggregate_mods(&mods, "athletics", Some("melee")), 3);
    }

    #[test]
    fn aggregate_stacks_multiple() {
        let mods = vec![
            CprMod::new_permanent("athletics", 2),
            CprMod::new_situational("athletics", 3, "melee"),
        ];
        assert_eq!(aggregate_mods(&mods, "athletics", Some("melee")), 5);
        assert_eq!(aggregate_mods(&mods, "athletics", None), 2);
    }
}
