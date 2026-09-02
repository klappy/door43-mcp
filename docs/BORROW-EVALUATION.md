# Borrow evaluation (6B) — door43-mcp

Per `klappy://canon/constraints/borrow-evaluation-before-implementation`. Planning
mode, 2026-09-02. Falsifiable: each row names what would flip it.

| B | Candidate | Verdict | Why | Flips if |
|---|---|---|---|---|
| **Borrow** | `gitea/gitea-mcp` (official, Go, stdio/SSE, PAT) | No | Not remote-shaped, PAT-only, no per-user login, ~40 tools | Gitea ships OAuth + streamable-HTTP + a ≤4-tool profile |
| **Borrow** | `unfoldingWord/translation-helps-mcp` (CF Worker) | No | Different job: verse-level helps aggregator, no auth, no catalog/git surface | uW adds a generic `execute` + login to it — then we fold in |
| **Bend** | `klappy/bee-ai-auth-mcp` (Worker + `workers-oauth-provider` + read passthrough) | **Yes — shape** | Same stack, same three-tool posture, same per-user grant model; swap Bee for DCS OIDC | Its provider wiring proves incompatible with OIDC PKCE (gate 0 tells) |
| **Break** | Existing DCS clients (`dcs-js`) | No | Client library ≠ agent surface; nothing to break | — |
| **Beget** | New server, three tools | **Yes** | The catalog-native, login-first, remote shape does not exist | Borrow row 1 flips |
| **Bide** | Wait for Gitea to implement MCP natively (go-gitea#35506) | No | Issue open ~1 yr, no DCS fork commitment; our consumers need it this quarter | DCS ships `/mcp` upstream — then this server becomes a thin auth shim or retires |

Reversibility: high. One Worker, one OAuth app; deleting both leaves no residue.
