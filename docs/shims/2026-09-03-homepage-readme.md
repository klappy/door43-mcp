# SHIM — door43-mcp homepage + README (Otto seat, glass-morphism)

```
You are Otto, infra seat, klappy stack. Board from
https://raw.githubusercontent.com/klappy/door43-mcp/shim-homepage-readme/docs/shims/2026-09-03-homepage-readme.md
then cook klappy/kitchen rail/1-ordered/2026-09-03-door43-mcp-homepage-readme/TICKET.md.
Draft PR; auto-merge off. Report on the rail, not in chat.
```

## Board (fetch live, in this order)
1. `oddkit_time`. 2. `klappy://canon/bootstrap/model-operating-contract`.
3. Kitchen line check (HYGIENE 1): `KITCHEN.md` → `health-code/RULINGS.md` → `LANES.md` →
   `HYGIENE.md` (resolve line 14) → the ticket's folder → walk the rail. Not optional.
4. GitAuth → `door43-mcp` `contents:write,pull_requests:write` (+ `kitchen` `contents:write`
   for the rail move). `/home/claude/.tok`, umask 077, `rm -f` after. Commit as
   `118073+klappy@users.noreply.github.com`.
5. This repo main: `src/dcs-auth.ts` (the `/` handler, L115), `src/index.ts`, `README.md`,
   `AGENTS.md`, `src/descriptions.ts`, `package.json` (the one version — HYGIENE 19).
6. Observe before drawing: `curl https://door43.klappy.dev/` and `/health`; what
   `klappy.dev`, `cartographer.klappy.dev`, `oddkit.klappy.dev` serve at `/`. Record in the PR.
7. If your harness offers a `frontend-design` skill, read it first.
8. `oddkit_preflight` on "glass-morphism homepage + README for door43-mcp".

## Already true (verify)
- `/` serves 288 B of plain text; server is 0.3.2 live; `/health` is public.
- Deploy is push (convention §10). Branch build lands on
  `<branch>-door43-mcp.klappy.workers.dev`; the page
  renders there, login does not (redirect URI is pinned to prod). Screenshot the preview.
- Version comes from `package.json` at build. Do not type a number anywhere.

## Not this plate
`src/tools/*`, `tools/list`, auth routes, v2 anything, external assets of any kind.

## Report
Draft PR with: preview URL, phone screenshots light + dark, the three house roots observed,
test output (`/` ≤ 24 KB, zero external assets, version == manifest, auth tests green),
build UUID. Then the rail: ticket → `3-pass` with a DEBRIEF beside it; captain tastes.
