# Deploy your own door43-mcp

1. Fork `klappy/door43-mcp`.
2. **HUMAN-ONLY (once):** on your DCS host → Settings → Applications → Manage OAuth2
   Applications → New. Name `door43-mcp`, redirect `https://<your-host>/callback`,
   confidential client. Copy client id + secret.
3. `wrangler secret put D43_CLIENT_ID` · `D43_CLIENT_SECRET` · `COOKIE_ENCRYPTION_KEY`
   (`openssl rand -hex 32`).
4. Set `D43_HOST` in `wrangler.toml` if not `git.door43.org`.
5. `wrangler deploy`. Add `https://<your-host>/mcp` to your MCP client. Log in.
6. Verify: `execute GET /user` returns you. Revoke anytime by deleting the OAuth app.
