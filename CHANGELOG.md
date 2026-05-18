# Changelog

All notable changes to the Sovereign Mesh are documented here.

## [0.3.6-alpha] - 2026-05-20

### Fixed
- LiteLLM mesh router authentication and model discovery
  - Added `database_url: sqlite:///app/litellm.db` to resolve "No connected db" errors
  - Created persistent data volume for SQLite database
  - Updated container startup to mount database directory
  - LiteLLM now serves `/v1/models` correctly for Hermes model picker

### Changed
- LiteLLM configuration updated for production stability (v1.84.0)
- Session handoff prepared for Hermes restart

## [0.3.5-alpha] - 2026-05-19

### Added
- Hermes-LCM state sync and cross-node rsync
- hermes-relay stabilization on Node A

### Fixed
- Node A configuration corruption and lid handling

## [0.3.2-alpha] - 2026-05-18

### Added
- Kanban MCP server
- GitHub Pages documentation site (later deprecated)

### Changed
- Node B binary upgraded to b9190 (Vulkan)
- Node D model swapped to Qwen3.5-35B-A3B-MTP

[Full history available in git log]