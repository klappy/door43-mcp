# door43-mcp

🚪🔐 Door43 (DCS) as an MCP server — login with your Door43 account, 📖 `docs` · ⚡ `execute` · 📊 `telemetry`. Three tools, no pasted tokens. ☁️ Cloudflare Workers.

Status: **live** at `https://door43.klappy.dev/mcp` — three tools, reads only (v1). Version is `package.json`; the server prints it at `/` and in `docs()`. Validated as built: [docs/validation/2026-09-03-v1.md](docs/validation/2026-09-03-v1.md).

**Agents start at [AGENTS.md](AGENTS.md).**

| Read | For |
|---|---|
| [AGENTS.md](AGENTS.md) | boarding pass — identity, state, contracts, map, journeys |
| [docs/PLAN.md](docs/PLAN.md) | gates, owners, observed values — the resume point |
| [docs/SPEC.md](docs/SPEC.md) | boundaries, envelope, tool contracts, auth flow |
| [docs/PRD.md](docs/PRD.md) | journeys, requirements, acceptance |
| [docs/DESIGN.md](docs/DESIGN.md) | agent-facing design principles |
| [docs/CHARTER.md](docs/CHARTER.md) | why, who, not-goals |
| [docs/DEPLOY.md](docs/DEPLOY.md) | run your own (one human step) |
| [docs/BORROW-EVALUATION.md](docs/BORROW-EVALUATION.md) | 6B: what we borrowed, bent, begot |
| [docs/OWNERS.md](docs/OWNERS.md) · [docs/TENSIONS.md](docs/TENSIONS.md) | who decides, what's unresolved |
| [docs/SECURITY.md](docs/SECURITY.md) · [docs/TELEMETRY-POLICY.md](docs/TELEMETRY-POLICY.md) | what we hold, what we track |

Governed by `klappy://canon/constraints/mcp-tool-surface-ceiling` and `klappy/kitchen` `health-code/mcp-server-build-convention.md`.

License: MIT.
