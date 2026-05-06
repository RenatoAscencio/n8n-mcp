# Fork Changelog

Tracks fork-specific changes on top of upstream [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp).

For upstream changes see [CHANGELOG.md](./CHANGELOG.md).

Versioning: `v<upstream-version>-chatwoot.<n>` where:

- `<upstream-version>` is the n8n-mcp version we synced from (e.g., `2.51.1`)
- `<n>` is the iteration number for fork-specific changes on that base

## [v2.51.1-chatwoot.1] - 2026-05-06

### Synced from upstream (v2.35.4 → v2.51.1, 83 commits)

- Sanitizer hardening for telemetry workflow ingestion (#779)
- New tools: `n8n_manage_datatable`, `n8n_manage_credentials`, `n8n_audit_instance`, `n8n_generate_workflow`
- `includeUsage` flag for credential listing — shows which workflows reference each credential
- `WWW-Authenticate` Bearer challenge on 401 responses (RFC 6750)
- FTS5 graceful unavailability fallback in sql.js adapter (#398)
- Critical memory leak fix in sql.js adapter (#335)
- HTTP handlers: defensive JSON.parse for stringified params (#605)
- Workflow validator improvements
- And ~75 other upstream fixes/features. See [upstream CHANGELOG](./CHANGELOG.md) for full details.

### Fork-specific (preserved through sync)

- **`chatwoot_doctor` MCP tool** — diagnostic tool for Chatwoot integration health
- **`@renatoascencio/n8n-nodes-chatwoot` registered in nodes.db** — 2 nodes (Chatwoot, Chatwoot Trigger) discoverable via MCP catalog
- **Chatwoot connection validator** — graceful degradation, hardened error messages
- **5 Chatwoot workflow templates** — pre-built examples for common use cases
- **TVPlus MCP operator kit** — compose, rules, smoke tests
- **Multi-arch Docker support** (amd64 + arm64) via `docker-publish.yml`
- **Docker MCP Toolkit metadata labels** for image discoverability

### Conflict resolutions during sync

- `src/mcp/server.ts`: kept both `chatwoot_doctor` handler + new upstream tools
- `src/scripts/rebuild.ts`: kept both Chatwoot node registration + upstream's FTS5 rebuild guard
- `README.md`: kept fork's Chatwoot-specific README
- `data/nodes.db`: took upstream's fresh DB and re-registered `@renatoascencio/n8n-nodes-chatwoot`

---

## [v2.35.2-chatwoot.x] - 2026-02-19

Initial Chatwoot integration baseline. See git history for details.

- Chatwoot integration scaffold (`src/integrations/chatwoot/`)
- `chatwoot_doctor` diagnostic tool
- Connection validator with timeout/error classification
- 5 workflow templates (monitoring, sync, messaging, automation, public API)
- Unit tests (19/19 passing, 88%+ coverage)
- Docker CI workflow for GHCR
- Multi-arch support (amd64 + arm64)

---

## How to update

1. Sync with upstream: `git fetch upstream && git merge upstream/main`
2. Resolve conflicts (preserve fork-specific files)
3. Re-register Chatwoot nodes if `data/nodes.db` was overwritten
4. Run `npm run build` and chatwoot tests
5. Tag as `v<new-upstream>-chatwoot.<next-n>`
6. Add entry to this file
