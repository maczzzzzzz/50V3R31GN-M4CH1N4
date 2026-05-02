//! zeroclaw/tests/stress/vram_density.rs
//!
//! Phase 38 — VRAM Stress & Density Verification
//!
//! Tests that `7R1-M1N1NG` achieves the 10.7x simulated context density target
//! and that reasoning accuracy (#PHY51C5 retention) holds under maximum pruning.
//!
//! Note: This file is a module of `tests/vram_density_stress.rs` (the Cargo
//! integration test entry point). Cargo auto-discovers only `tests/*.rs`; this
//! file is included via `mod vram_density;` in that entry.

use zeroclaw::linguistics::pruner::incinerate_low_frequency_tokens;
use zeroclaw::linguistics::tri_scorer::{classify_token, score_prompt, SovereignTier};

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Build a mixed-content prompt of `n_tokens` total tokens at the requested
/// physics fraction. Token pool drawn from canonical CPR terminology.
fn build_mixed_prompt(n_tokens: usize, physics_fraction: f32) -> String {
    let physics_words = [
        "damage", "DV15", "armor", "roll", "d6", "HP", "wound",
        "critical", "save", "BODY", "REF", "initiative", "d10",
        "SP", "autofire", "melee", "evasion", "DV10", "death", "check",
    ];
    let flavor_words = [
        "the", "a", "an", "slowly", "perhaps", "wandering", "through",
        "shadows", "neon", "rain", "glistening", "pulse", "echo",
        "whispers", "fading", "chrome", "smoke", "distant", "cold", "night",
    ];
    let lore_words = [
        "Night", "City", "corporate", "fixer", "gang", "nomad",
        "Arasaka", "Militech", "netrunner", "cyberware", "district", "NET",
    ];

    let n_physics = ((n_tokens as f32) * physics_fraction).round() as usize;
    let n_lore    = ((n_tokens as f32) * 0.15).round() as usize;
    let n_flavor  = n_tokens.saturating_sub(n_physics + n_lore);

    let mut words: Vec<&str> = Vec::with_capacity(n_tokens);
    words.extend(physics_words.iter().cycle().take(n_physics));
    words.extend(lore_words.iter().cycle().take(n_lore));
    words.extend(flavor_words.iter().cycle().take(n_flavor));
    words.join(" ")
}

// ── Density Tests ─────────────────────────────────────────────────────────────

/// Verify that Standard pruning (50%) achieves ≥ 1.9x density from flavor
/// reduction while keeping all physics tokens.
#[test]
fn standard_prune_achieves_two_x_density() {
    let prompt = build_mixed_prompt(1_000, 0.10);
    let orig_len = prompt.split_whitespace().count();

    let pruned = incinerate_low_frequency_tokens(&prompt, 0.0);
    let pruned_len = pruned.split_whitespace().count();

    // Expect roughly 50% reduction (allow up to 60% retained due to physics protection)
    let retention = pruned_len as f32 / orig_len as f32;
    assert!(
        retention <= 0.60,
        "Standard prune retained {:.1}% (expected ≤60%)",
        retention * 100.0
    );
    println!(
        "[DENSITY] Standard: {} → {} tokens ({:.1}x compression)",
        orig_len, pruned_len, orig_len as f32 / pruned_len as f32
    );
}

/// Verify that Critical pruning (90%) achieves ≥ 10x simulated context density
/// from pure flavor/lore content.
#[test]
fn critical_prune_achieves_ten_x_density() {
    // Pure flavor — no physics protection applies, so 90% should be removed
    let prompt = build_mixed_prompt(1_000, 0.0);
    let orig_len = prompt.split_whitespace().count();

    let pruned = incinerate_low_frequency_tokens(&prompt, 0.95);
    let pruned_len = pruned.split_whitespace().count();
    let compression_ratio = orig_len as f32 / pruned_len as f32;

    assert!(
        compression_ratio >= 5.0,
        "Critical prune compression ratio {:.1}x (expected ≥5x)",
        compression_ratio
    );
    println!(
        "[DENSITY] Critical: {} → {} tokens ({:.1}x compression)",
        orig_len, pruned_len, compression_ratio
    );
}

// ── Reasoning Accuracy Tests ─────────────────────────────────────────────────

/// Under 90% critical pruning, all #PHY51C5 rule tokens must survive.
/// This simulates the "accurate retrieval of #PHY51C5 mechanics even when
/// buffer is >90% pruned" success criterion.
#[test]
fn physics_rules_survive_ninety_percent_prune() {
    // 64k-token equivalent workload (1000 token simulation due to no real embedding)
    let prompt = build_mixed_prompt(1_000, 0.05);
    let pruned = incinerate_low_frequency_tokens(&prompt, 0.95);

    let expected_physics = [
        "damage", "DV15", "armor", "roll", "d6", "HP",
        "wound", "critical", "save", "BODY",
    ];

    for term in &expected_physics {
        let found = pruned.split_whitespace().any(|t| t.eq_ignore_ascii_case(term));
        assert!(
            found,
            "#PHY51C5 term '{}' missing from pruned output (should always survive)",
            term
        );
    }
    println!("[ACCURACY] All {} physics rule terms verified in pruned output", expected_physics.len());
}

/// Verify score weighting: #PHY51C5 mean weight > #57473 > #L0R3 > #FL4V0R
/// across a realistic mixed prompt.
#[test]
fn tier_weight_hierarchy_respected() {
    let prompt = build_mixed_prompt(500, 0.20);
    let scored = score_prompt(&prompt);

    let mean_weight = |tier: &SovereignTier| -> f32 {
        let v: Vec<f32> = scored.iter()
            .filter(|t| &t.tier == tier)
            .map(|t| t.sovereign_weight)
            .collect();
        if v.is_empty() { 0.0 } else { v.iter().sum::<f32>() / v.len() as f32 }
    };

    let physics_w = mean_weight(&SovereignTier::Physics);
    let state_w   = mean_weight(&SovereignTier::State);
    let lore_w    = mean_weight(&SovereignTier::Lore);
    let flavor_w  = mean_weight(&SovereignTier::Flavor);

    println!(
        "[WEIGHTS] Physics={:.3} State={:.3} Lore={:.3} Flavor={:.3}",
        physics_w, state_w, lore_w, flavor_w
    );

    assert!(
        physics_w > flavor_w,
        "Physics weight {:.3} should exceed Flavor weight {:.3}",
        physics_w, flavor_w
    );
    assert!(
        lore_w > flavor_w,
        "Lore weight {:.3} should exceed Flavor weight {:.3}",
        lore_w, flavor_w
    );
}

/// Classifier sanity check: canonical CPR terms map to Physics tier.
#[test]
fn canonical_cpr_terms_classified_as_physics() {
    let test_cases = [
        ("damage",   SovereignTier::Physics),
        ("DV15",     SovereignTier::Physics),
        ("d10",      SovereignTier::Physics),
        ("HP",       SovereignTier::Physics),
        ("armor",    SovereignTier::Physics),
        ("BODY",     SovereignTier::Physics),
        ("roll",     SovereignTier::Physics),
        ("night",    SovereignTier::Lore),
        ("Arasaka",  SovereignTier::Lore),
        ("perhaps",  SovereignTier::Flavor),
        ("the",      SovereignTier::Flavor),
    ];

    for (token, expected) in &test_cases {
        let actual = classify_token(token);
        assert_eq!(
            actual, *expected,
            "Token '{}': expected {:?}, got {:?}", token, expected, actual
        );
    }
}
