//! zeroclaw/src/linguistics/pruner.rs
//!
//! Phase 38 — M3M0RY_1NC1N3R4710N: Context Buffer Pruning Layer
//!
//! Intercepts prompts before they reach `llama-server` and surgically removes
//! tokens with the lowest `SovereignWeight`, maximising the information density
//! of Node A's 4GB VRAM budget.
//!
//! ## Pruning Modes
//! - **Standard (< 90% VRAM):** Removes the lowest-weight 50% of tokens.
//! - **Critical (≥ 90% VRAM):** Removes the lowest-weight 90% of tokens.
//!
//! `#PHY51C5` and `#57473` tier tokens are **always protected** from pruning
//! regardless of their trigonometric weight, ensuring rule lookups and session
//! state are never lost under VRAM pressure.

use std::collections::HashSet;
use tracing::info;

use crate::linguistics::tri_scorer::{score_prompt, SovereignTier};

// ── Pruning Thresholds ────────────────────────────────────────────────────────

/// Standard mode: prune bottom 50% of tokens by weight.
const PRUNE_RATIO_STANDARD: f32 = 0.50;
/// Critical mode: prune bottom 90% of tokens by weight (VRAM emergency).
const PRUNE_RATIO_CRITICAL: f32 = 0.90;
/// VRAM usage fraction that triggers Critical Mode.
const VRAM_CRITICAL_THRESHOLD: f32 = 0.90;

// ── VRAM Sampling ─────────────────────────────────────────────────────────────

/// Sample current VRAM usage via `nvidia-smi` on Node A.
///
/// Returns a fraction in `[0.0, 1.0]` (used / total). Falls back to `0.0` if
/// `nvidia-smi` is unavailable or fails, so the system degrades gracefully to
/// Standard mode rather than crashing.
pub fn sample_vram_usage() -> f32 {
    let output = std::process::Command::new("nvidia-smi")
        .args(["--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            let parts: Vec<f32> = text
                .trim()
                .split(',')
                .filter_map(|s| s.trim().parse::<f32>().ok())
                .collect();

            if parts.len() == 2 && parts[1] > 0.0 {
                (parts[0] / parts[1]).clamp(0.0, 1.0)
            } else {
                0.0
            }
        }
        _ => 0.0, // nvidia-smi unavailable → assume no pressure
    }
}

// ── M3M0RY_1NC1N3R4710N ───────────────────────────────────────────────────────

/// Prune a prompt buffer by removing low-`SovereignWeight` tokens.
///
/// # Arguments
/// - `prompt`: The full prompt text (whitespace-delimited tokens).
/// - `vram_used_pct`: Current VRAM utilisation in `[0.0, 1.0]`.
///   Pass `sample_vram_usage()` for live Node A sampling.
///
/// # Behaviour
/// 1. Scores every token via `7R1_SC0R3R`.
/// 2. Selects the pruning ratio based on `vram_used_pct`.
/// 3. Always retains `#PHY51C5` and `#57473` tokens regardless of weight.
/// 4. Removes the bottom `prune_ratio` of remaining tokens by weight.
/// 5. Reconstructs the prompt preserving original token order.
///
/// Returns the pruned prompt string. Returns the original prompt unchanged if
/// it contains 0–4 tokens (too short to prune meaningfully).
pub fn incinerate_low_frequency_tokens(prompt: &str, vram_used_pct: f32) -> String {
    let scored = score_prompt(prompt);
    let n = scored.len();

    if n <= 4 {
        return prompt.to_string();
    }

    let prune_ratio = if vram_used_pct >= VRAM_CRITICAL_THRESHOLD {
        info!(
            "7R1-M1N1NG: CRITICAL mode (VRAM {:.1}%) — pruning {:.0}% of context buffer",
            vram_used_pct * 100.0, PRUNE_RATIO_CRITICAL * 100.0
        );
        PRUNE_RATIO_CRITICAL
    } else {
        PRUNE_RATIO_STANDARD
    };

    // Step 1: always keep Physics + State tier tokens
    let mut keep: HashSet<usize> = (0..n)
        .filter(|&i| {
            matches!(
                scored[i].tier,
                SovereignTier::Physics | SovereignTier::State
            )
        })
        .collect();

    // Step 2: among remaining tokens, keep top (1 - prune_ratio) by weight
    let prunable: Vec<usize> = (0..n).filter(|i| !keep.contains(i)).collect();
    let keep_count = ((prunable.len() as f32) * (1.0 - prune_ratio)).ceil() as usize;

    // Sort prunable indices by weight descending, keep the top `keep_count`
    let mut by_weight = prunable.clone();
    by_weight.sort_by(|&a, &b| {
        scored[b]
            .sovereign_weight
            .partial_cmp(&scored[a].sovereign_weight)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    for &idx in by_weight.iter().take(keep_count) {
        keep.insert(idx);
    }

    // Step 3: reconstruct in original order
    let result: String = (0..n)
        .filter(|i| keep.contains(i))
        .map(|i| scored[i].text.as_str())
        .collect::<Vec<_>>()
        .join(" ");

    let removed = n - keep.len();
    info!(
        "7R1-M1N1NG: {}/{} tokens retained ({} pruned, {:.0}% compression)",
        keep.len(), n, removed,
        (removed as f32 / n as f32) * 100.0
    );

    result
}

// ── Unit Tests ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_prompt(n_flavor: usize, n_physics: usize) -> String {
        let flavor: Vec<&str>  = vec!["perhaps", "slowly", "quietly", "maybe", "gently",
                                      "perhaps", "wandering", "softly", "the", "an"];
        let physics: Vec<&str> = vec!["damage", "DV15", "armor", "roll", "d6",
                                      "HP", "wound", "critical", "save", "BODY"];

        let mut words: Vec<&str> = Vec::new();
        words.extend(flavor.iter().cycle().take(n_flavor));
        words.extend(physics.iter().cycle().take(n_physics));
        words.join(" ")
    }

    #[test]
    fn standard_mode_prunes_roughly_half() {
        let prompt = make_prompt(20, 0); // pure flavor → all prunable
        let pruned = incinerate_low_frequency_tokens(&prompt, 0.0);
        let orig_count  = prompt.split_whitespace().count();
        let pruned_count = pruned.split_whitespace().count();
        // Allow ±2 tokens due to rounding and ceiling math
        assert!(
            pruned_count <= orig_count / 2 + 2,
            "Standard prune expected ≤{} tokens, got {}", orig_count / 2 + 2, pruned_count
        );
    }

    #[test]
    fn critical_mode_prunes_ninety_percent() {
        let prompt = make_prompt(40, 0); // pure flavor
        let pruned = incinerate_low_frequency_tokens(&prompt, 0.95);
        let orig_count   = prompt.split_whitespace().count();
        let pruned_count = pruned.split_whitespace().count();
        let max_keep = ((orig_count as f32) * 0.10).ceil() as usize + 2;
        assert!(
            pruned_count <= max_keep,
            "Critical prune expected ≤{} tokens, got {}", max_keep, pruned_count
        );
    }

    #[test]
    fn physics_tokens_always_survive_critical_prune() {
        // Mix 5 physics tokens into 50 flavor tokens
        let prompt = make_prompt(50, 5);
        let pruned = incinerate_low_frequency_tokens(&prompt, 0.95);
        let physics_kws = ["damage", "dv15", "armor", "roll", "d6"];
        for kw in &physics_kws {
            let found = pruned.split_whitespace().any(|t| t.to_lowercase() == *kw);
            assert!(found, "Physics token '{}' should survive critical prune", kw);
        }
    }

    #[test]
    fn short_prompts_pass_through_unchanged() {
        let short = "damage roll";
        assert_eq!(incinerate_low_frequency_tokens(short, 0.0), short);
        assert_eq!(incinerate_low_frequency_tokens(short, 0.95), short);
    }

    #[test]
    fn original_order_preserved_in_output() {
        // The pruned tokens should appear in their original relative order
        let prompt = "alpha damage beta roll gamma armor delta";
        let pruned = incinerate_low_frequency_tokens(&prompt, 0.0);
        // All physics tokens must appear in order
        let pruned_words: Vec<&str> = pruned.split_whitespace().collect();
        let physics_positions: Vec<usize> = ["damage", "roll", "armor"]
            .iter()
            .filter_map(|kw| pruned_words.iter().position(|w| *w == *kw))
            .collect();
        assert!(
            physics_positions.windows(2).all(|w| w[0] < w[1]),
            "Physics tokens out of order in pruned output: {:?}", pruned_words
        );
    }
}
