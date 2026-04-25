claude report

OPEN ITEMS

  1. Pre-existing TS errors — sovereign-theme.ts (palette possibly undefined ×5) + main.ts (missing
  LangGraphOrchestrator import). Not introduced this session. Targeted fix pass available on request.                  2. obscura-sidecar.service deploy on Node C — sudo systemctl enable --now obscura-sidecar, then curl
  http://localhost:9222/json/version to verify.                                                                        3. Hermes-Kanban board init — Ensure Sovereign-Pipeline.md exists in vault with kanban-plugin: board frontmatter.
  Test: go run scripts/ops/hermes-sync/main.go --sync.