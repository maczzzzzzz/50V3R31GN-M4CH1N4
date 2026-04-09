//! zeroclaw/src/linguistics/tri_scorer.rs
//!
//! Phase 38 — 7R1_SC0R3R: Trigonometric Context Scoring Engine
//!
//! "Mines" the logic of TriAttention to assign a `SovereignWeight` to every
//! token in a prompt buffer. Weights are derived from:
//!   1. Semantic tier classification (#PHY51C5 → #FL4V0R).
//!   2. Trigonometric (raised-cosine) distance from the harmonic center of
//!      the high-priority tokens.
//!
//! The resulting scored token list is consumed by `pruner.rs` to surgically
//! remove low-relevance context before the prompt reaches llama-server.

use std::f32::consts::PI;

// ── Semantic Tier ─────────────────────────────────────────────────────────────

/// Four-tier retention priority for context tokens.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SovereignTier {
    /// #PHY51C5 — Core mechanics, damage tables, skill checks. Static center.
    /// Pruned LAST; base weight 1.0.
    Physics,
    /// #57473 — Session state: token positions, HP, last dice results. Dynamic center.
    /// Pruned second-to-last; base weight 0.85.
    State,
    /// #L0R3 — Static world facts: factions, geography, cyberware. Mid-priority.
    /// Base weight 0.55.
    Lore,
    /// #FL4V0R — Atmospheric prose, NPC barks, narrative description. Pruned first.
    /// Base weight 0.20.
    Flavor,
}

impl SovereignTier {
    /// Returns the base weight for this tier (used before trigonometric adjustment).
    #[inline]
    pub fn base_weight(&self) -> f32 {
        match self {
            SovereignTier::Physics => 1.00,
            SovereignTier::State   => 0.85,
            SovereignTier::Lore    => 0.55,
            SovereignTier::Flavor  => 0.20,
        }
    }
}

// ── Token Record ──────────────────────────────────────────────────────────────

/// A prompt token annotated with tier and computed `sovereign_weight`.
#[derive(Debug, Clone)]
pub struct SovereignToken {
    pub text:             String,
    pub tier:             SovereignTier,
    /// Final weight after trigonometric distance adjustment. Range [0.0, 1.0].
    pub sovereign_weight: f32,
}

// ── Tier Classification ───────────────────────────────────────────────────────

// #PHY51C5 keywords — Cyberpunk RED mechanical terms.
const PHYSICS_KEYWORDS: &[&str] = &[
    "damage", "dmg", "dv", "ap", "armor", "sp", "ablate",
    "d6", "d10", "d3", "d100",
    "roll", "check", "skill", "stat",
    "wound", "critical", "death", "save",
    "hp", "body", "ref", "dex", "tech", "cool", "will", "luck", "emp", "int",
    "initiative", "move", "penetration", "autofire", "suppressive",
    "melee", "ranged", "evasion", "brawling",
    "valid", "invalid", "mechanical",
];

// #57473 keywords — runtime session state.
const STATE_KEYWORDS: &[&str] = &[
    "token", "position", "x:", "y:", "location", "scene", "actor",
    "current", "last", "target", "round", "turn", "session",
    "hp:", "atk:", "def:", "status",
    "intent", "action", "triggers", "combat",
];

// #L0R3 keywords — static world facts.
const LORE_KEYWORDS: &[&str] = &[
    "night", "city", "corporate", "fixer", "gang", "nomad", "netrunner",
    "arasaka", "militech", "biotechnica", "trauma", "team",
    "cyberware", "cyberdeck", "neuro", "wired", "reflexes",
    "boostergang", "edgerunner", "fixers", "district",
    "net", "blackice", "daemon", "ice",
];

/// Classify a single token into its `SovereignTier`.
/// Case-insensitive. Checks longest tiers first (Physics > State > Lore).
pub fn classify_token(token: &str) -> SovereignTier {
    let lower = token.to_lowercase();
    let word = lower.trim_matches(|c: char| !c.is_alphanumeric());

    if PHYSICS_KEYWORDS.iter().any(|k| word == *k || lower.contains(k)) {
        SovereignTier::Physics
    } else if STATE_KEYWORDS.iter().any(|k| word == *k || lower.contains(k)) {
        SovereignTier::State
    } else if LORE_KEYWORDS.iter().any(|k| word == *k || lower.contains(k)) {
        SovereignTier::Lore
    } else {
        SovereignTier::Flavor
    }
}

// ── Harmonic Center Calculation ───────────────────────────────────────────────

/// Calculate the "Fixed Non-Zero Center" of a weighted token sequence using a
/// circular mean over the sine/cosine harmonic series.
///
/// Maps each token at index `i` to angle `θ = 2π × i / n`, weights by
/// `base_weights[i]`, then computes the circular mean angle.
///
/// Returns the center position in [0.0, n) space. Falls back to `n / 2` when
/// all weights are zero.
pub fn calculate_harmonic_center(base_weights: &[f32]) -> f32 {
    let n = base_weights.len();
    if n == 0 {
        return 0.0;
    }

    let n_f = n as f32;
    let mut sin_sum = 0.0_f32;
    let mut cos_sum = 0.0_f32;
    let mut w_total = 0.0_f32;

    for (i, &w) in base_weights.iter().enumerate() {
        let theta = 2.0 * PI * (i as f32) / n_f;
        sin_sum += w * theta.sin();
        cos_sum += w * theta.cos();
        w_total += w;
    }

    if w_total == 0.0 {
        return n_f / 2.0;
    }

    // Circular mean angle → map to [0, n)
    let mean_angle = sin_sum.atan2(cos_sum); // in [-π, π]
    let normalized = (mean_angle / (2.0 * PI) + 1.0) % 1.0; // [0, 1)
    normalized * n_f
}

// ── Sovereign Weight Assignment ───────────────────────────────────────────────

/// Compute the final `sovereign_weight` for token at position `i` given:
/// - `base_weight`: from tier classification
/// - `center_pos`: from `calculate_harmonic_center`
/// - `n`: total token count
///
/// Uses a raised-cosine function: `w = base × (1 + cos(2π × d / n)) / 2`
/// where `d = |i - center_pos|` (with wrap-around).
/// This yields `w = base` at d=0 and `w = 0` at maximum distance.
#[inline]
fn apply_trig_distance(base_weight: f32, pos: usize, center_pos: f32, n: usize) -> f32 {
    if n <= 1 {
        return base_weight;
    }

    let n_f = n as f32;
    // Wrap-around distance on the circular sequence
    let raw_dist = (pos as f32 - center_pos).abs();
    let dist = raw_dist.min(n_f - raw_dist);

    // Raised cosine over [0, n/2]
    let raised_cos = (1.0 + (2.0 * PI * dist / n_f).cos()) / 2.0;
    base_weight * raised_cos
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Score every whitespace-delimited token in `prompt`, returning a
/// `Vec<SovereignToken>` in original order.
///
/// Each token is classified into a `SovereignTier`, assigned a base weight,
/// then adjusted by its trigonometric distance from the harmonic center of
/// the high-priority tokens.
pub fn score_prompt(prompt: &str) -> Vec<SovereignToken> {
    let tokens: Vec<&str> = prompt.split_whitespace().collect();
    if tokens.is_empty() {
        return Vec::new();
    }

    let n = tokens.len();

    // Step 1: classify and get base weights
    let tiers: Vec<SovereignTier> = tokens.iter().map(|t| classify_token(t)).collect();
    let base_weights: Vec<f32>    = tiers.iter().map(|t| t.base_weight()).collect();

    // Step 2: harmonic center (anchored to Physics + State tokens)
    let center_pos = calculate_harmonic_center(&base_weights);

    // Step 3: final weights via raised-cosine distance
    tokens.iter().enumerate().zip(tiers.into_iter()).map(|((i, &token), tier)| {
        let base_w = base_weights[i];
        let final_w = apply_trig_distance(base_w, i, center_pos, n);
        SovereignToken {
            text:             token.to_string(),
            tier,
            sovereign_weight: final_w.clamp(0.0, 1.0),
        }
    }).collect()
}

// ── Unit Tests ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a mixed prompt with known tier tokens.
    fn mixed_prompt() -> &'static str {
        "The edgerunner approaches slowly DV15 armor damage roll d6 HP night city corporate fixer"
    }

    #[test]
    fn physics_tokens_outweigh_flavor() {
        let scored = score_prompt(mixed_prompt());
        let physics_avg: f32 = scored.iter()
            .filter(|t| t.tier == SovereignTier::Physics)
            .map(|t| t.sovereign_weight)
            .sum::<f32>()
            / scored.iter().filter(|t| t.tier == SovereignTier::Physics).count() as f32;

        let flavor_avg: f32 = scored.iter()
            .filter(|t| t.tier == SovereignTier::Flavor)
            .map(|t| t.sovereign_weight)
            .sum::<f32>()
            / scored.iter().filter(|t| t.tier == SovereignTier::Flavor).count().max(1) as f32;

        assert!(
            physics_avg > flavor_avg,
            "Physics avg weight {:.3} should exceed Flavor avg {:.3}",
            physics_avg, flavor_avg
        );
    }

    #[test]
    fn state_tokens_outweigh_lore() {
        let prompt = "token position x:10 y:20 current HP: round 3 night city fixer corporate gang";
        let scored = score_prompt(prompt);

        let state_avg: f32 = scored.iter()
            .filter(|t| t.tier == SovereignTier::State)
            .map(|t| t.sovereign_weight)
            .sum::<f32>()
            / scored.iter().filter(|t| t.tier == SovereignTier::State).count().max(1) as f32;

        let lore_avg: f32 = scored.iter()
            .filter(|t| t.tier == SovereignTier::Lore)
            .map(|t| t.sovereign_weight)
            .sum::<f32>()
            / scored.iter().filter(|t| t.tier == SovereignTier::Lore).count().max(1) as f32;

        assert!(
            state_avg > lore_avg,
            "State avg weight {:.3} should exceed Lore avg {:.3}",
            state_avg, lore_avg
        );
    }

    #[test]
    fn classify_known_physics_keywords() {
        for kw in &["damage", "DV", "armor", "roll", "HP", "BODY", "d6"] {
            assert_eq!(
                classify_token(kw),
                SovereignTier::Physics,
                "Expected Physics for token '{}'", kw
            );
        }
    }

    #[test]
    fn classify_known_flavor_keywords() {
        for kw in &["the", "slowly", "approaches", "perhaps", "while"] {
            assert_eq!(
                classify_token(kw),
                SovereignTier::Flavor,
                "Expected Flavor for token '{}'", kw
            );
        }
    }

    #[test]
    fn harmonic_center_single_weight() {
        // Single high-weight at index 2 of 5 → center should be near 2
        let weights = vec![0.0, 0.0, 1.0, 0.0, 0.0];
        let center = calculate_harmonic_center(&weights);
        assert!(
            (center - 2.0).abs() < 0.5,
            "Expected center near 2.0, got {:.3}", center
        );
    }

    #[test]
    fn weights_in_valid_range() {
        let scored = score_prompt(mixed_prompt());
        for token in &scored {
            assert!(
                token.sovereign_weight >= 0.0 && token.sovereign_weight <= 1.0,
                "Weight out of [0,1] for '{}': {:.4}",
                token.text, token.sovereign_weight
            );
        }
    }

    #[test]
    fn empty_prompt_returns_empty() {
        assert!(score_prompt("").is_empty());
        assert!(score_prompt("   ").is_empty());
    }
}
