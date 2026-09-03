# Deploy your own door43-mcp

Re-observed against the repo 2026-09-03 (`wrangler.jsonc`, `docs/validation/2026-09-03-v1.md` F5).

1. Fork `klappy/door43-mcp`.
2. **HUMAN-ONLY (once):** on your DCS host → Settings → Applications → Manage OAuth2
   Applications → New. Name `door43-mcp`, redirect `https://<your-host>/callback`,
   confidential client. Copy client id + secret (the secret starts with `gto_` — keep the prefix).
3. Create your own bindings and put their ids in `wrangler.jsonc` (the committed ids are
   klappy's and will not resolve in your account):
   - `wrangler kv namespace create OAUTH_KV` → `kv_namespaces[0].id`
   - `wrangler d1 create door43mcp_telemetry` → `d1_databases[0].database_id` (schema: `src/telemetry/schema.sql`)
   - `routes[0].pattern` → your host (custom domain; wrangler creates the DNS record)
   - `vars.D43_HOST` → your DCS host if not `git.door43.org`
4. `wrangler secret put D43_CLIENT_ID` · `D43_CLIENT_SECRET` · `COOKIE_ENCRYPTION_KEY`
   (`openssl rand -hex 32`).
5. `wrangler deploy` (or push to main — Workers Builds deploys on push). Add
   `https://<your-host>/mcp` to your MCP client. Log in.
6. Verify: `docs()` names you under `auth.logged_in_as`; `execute GET /user` returns you.
   Revoke anytime by deleting the OAuth app.

Named gap: a second operator (uW ops, `qa.door43.org`) has not yet run these steps — PLAN row 4.
