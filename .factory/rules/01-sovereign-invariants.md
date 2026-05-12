# Sovereign Invariants (Rules)

These rules apply to all Droid CLI execution within the Sovereign Machina OS repository.

1. **HERMES-FIRST:** Never write Rust or Go code for functionality that the upstream Python `hermes-agent` handles natively. If a feature exists in the Hermes ecosystem, use it.
2. **MODULAR NIX FLAKES:** All distinct capabilities, dependencies, and environment definitions must be encoded as pluggable Nix Flakes.
3. **NO LORE BLEED:** Absolutely no Cyberpunk Red, Netrunner, or TTRPG data is permitted in the codebase.
4. **SINGLE SOURCE OF TRUTH:** Any external repository used must be documented in `docs/nodestadt/repository.md`.
5. **PHYSICAL PATHS:** Downloaded models are physically backed up at `D:\llama.cpp\models`. Do not re-download them; copy them to local node storage as needed.