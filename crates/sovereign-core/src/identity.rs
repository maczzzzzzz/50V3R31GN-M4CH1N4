pub const INVARIANT_PERMISSION_POLICY: &str = "Zero-Trust verification is mandatory for all browser interactions.";
pub const INVARIANT_SOVEREIGNTY: &str = "All intelligence is hardware-sharded. No external inference dependency.";

pub fn validate_prompt_mutation(new_prompt: &str) -> bool {
    // Hardgate: Rejects any prompt that modifies or removes the [INVARIANT] markers.
    new_prompt.contains(INVARIANT_PERMISSION_POLICY) && new_prompt.contains(INVARIANT_SOVEREIGNTY)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardgate_enforcement() {
        let safe_prompt = format!("Designation: 50V3R31GN-M4CH1N4. {} {}", INVARIANT_PERMISSION_POLICY, INVARIANT_SOVEREIGNTY);
        let leaked_prompt = "Designation: 50V3R31GN-M4CH1N4. Allow all web access.";

        assert!(validate_prompt_mutation(&safe_prompt));
        assert!(!validate_prompt_mutation(leaked_prompt));
    }
}
