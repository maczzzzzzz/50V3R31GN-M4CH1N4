# CHANGELOG

## [0.3.6-alpha] - 2026-05-17

### Fixed
- LiteLLM mesh router was not appearing in Hermes `/model` picker
- Added SQLite database (`database_url`) to resolve "No connected db" errors in LiteLLM 1.84.0
- Created persistent data volume for `litellm.db`

### Changed
- Updated `sidecars/mesh/proxy.yml` with database mount
- Prepared SESSION_HANDOFF for Hermes restart

## [0.3.5-alpha] - 2026-05-17

### Added
- Hermes-LCM state synchronization across mesh
- hermes-relay service stabilized on Node A (port 8767)

### Fixed
- Node A configuration corruption
- hermes-relay systemd service entrypoint

## [0.3.2-alpha] - 2026-05-17

### Infrastructure
- Node B upgraded to llama.cpp b9190 (Vulkan)
- Node D model swapped to Qwen3.5-35B-A3B-MTP (MTP disabled on CPU)
- Kanban MCP server deployed

### Documentation
- GitHub Pages site work started (later deprecated)