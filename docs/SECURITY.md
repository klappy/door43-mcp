# Security
- **Auth:** DCS OIDC, PKCE S256, confidential client. No PATs, ever.
- **Secrets:** three Worker secrets; never in repo, logs, or URLs.
- **Grants:** per user, encrypted at rest (`COOKIE_ENCRYPTION_KEY`), keyed by `sub`.
  Refresh tokens rotate on use. Nothing shared across users.
- **Blast radius of a leaked access token:** whatever that one user can read on DCS
  until expiry (≤1h) — the server holds no elevated credential.
- **Revocation:** user removes the app in DCS settings; operator deletes the OAuth app
  to kill every grant at once.
- **Telemetry:** no user ids, no full paths, no query strings, no bodies.
- **Reporting:** issues on this repo; private disclosures to the operator email in README.
