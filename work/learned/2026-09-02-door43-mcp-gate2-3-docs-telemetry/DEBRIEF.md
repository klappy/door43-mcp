# DEBRIEF — door43-mcp-gate2-3-docs-telemetry (at the pass)

Cooked 2026-09-03T02:48Z–03:00Z (2026-09-02 late evening ET), Otto seat via shim
`docs/shims/2026-09-02-gate2-3.md`, one door, ~12 min wall clock (promise: 4 h).
Cargo lives on `klappy/door43-mcp`:

- Draft PR #7 — https://github.com/klappy/door43-mcp/pull/7 (assigned to captain; draft until read)
- Branch `gate2-3-docs-telemetry`: `1166a1a` (author `118073+klappy@users.noreply.github.com`)
- CI `test` check → success on `1166a1a`
- Workers Build `8741565d-6f61-4346-834f-fff71d5c91dd` → `build_outcome: success` (branch trigger,
  `versions upload`, no preview — T9). `door43.klappy.dev` untouched until merge.
- D1 `door43mcp_telemetry` `52fa8ea4-7774-4135-b160-f17bb41ac660` observed 02:50Z by API:
  `num_tables: 0`, ENAM. Bound as `TELEMETRY_DB`; not created, not duplicated.

## Declared product → observed (tests: 38 pass — 21 execute + 17 docs/telemetry)
1. `src/tools/docs.ts` — L0 pass **1215 B body / 1647 B envelope** (cap 2048; test fails at 2049),
   cites `mcp-tool-surface-ceiling` + `infra-config-is-seat-work`, `server.version 0.3.0`,
   `upstream.version 1.27.2+dcs`, `auth.logged_in_as`; **zero swagger/DCS calls for the pass**.
   L1 map: catalog 11 · repos 173 · user 35 · users 16 · orgs 27 · misc 61 = 323 (full live
   swagger, 02:50Z). L2 `/catalog/search`: params, `response_keys`, quirk "owner is a string"
   (swagger `CatalogEntry.owner: string` agrees). L3 raw verbatim. `query` BM25.
   5 recipes; `latest-release-zip` selects `zipball_url`.
2. `src/tools/telemetry.ts` + `src/telemetry/index.ts` — `isReadOnlySql`: single statement,
   SELECT/WITH only, no `;`, denylist; INSERT · DROP · `;` · PRAGMA · ATTACH · UPDATE · DELETE →
   400 envelope, 0 statements reach D1 (test asserts). Every tool call → one row via
   `ctx.waitUntil`; column allowlist; `path_family` only — test greps the row for
   `unfoldingWord`/`README`/`v86`/query and finds none.
3. `src/telemetry/schema.sql` — 3 × `CREATE … IF NOT EXISTS`, applied on first request;
   mirrored in `schema.ts`, test pins file == constant.
4. `wrangler.jsonc` — `d1_databases` binding to the named id; `wrangler deploy --dry-run` lists it.
5. `src/descriptions.ts` — the three lines verbatim, test-pinned ≤ 80 chars.
6. `docs/PLAN.md` rows 2/3 · `docs/TENSIONS.md` T8 resolved by observation (connector UI shows
   tools only → no resources/prompts shipped), T12 opened (AE sampled channel needs a credential —
   HUMAN-ONLY secret) · `package.json` 0.3.0 · `docs/TELEMETRY-POLICY.md` recut to D1 exact channel
   + the columns written. Also `docs/SPEC.md` (`level`→`rung` per ticket; five recipes) and
   `AGENTS.md` contract lines.
7. `test/docs-telemetry.test.ts` + `test/fixtures/swagger-slice.json` (11 of 323 live paths).

## Done-means — observed vs. waiting for main
Observed in harness: pass ≤ 2 KB with both URIs and versions; L2 owner-is-string; recipe with
`zipball_url`; DROP → 400 and nothing runs; grep of the row shows only `path_family`.
NOT yet observed live (deploy is push): three tools on the captain's phone; `execute` then
`telemetry` count +1; the D1 table itself (created by the first request after merge).
Captain's move after merge: reconnect the connector, read three tools, call `docs()`.

## Deviations for the pass (named, not decided)
- `README.md` status line still reads "planning — no code yet"; gate 4 owns README, left as is.
- `docs` L1 has six families (adds `users`) vs SPEC's five — `users` (16 paths) is not `user`.
- Consumer label = DCS login from the grant (`consumer_source: grant`), not the oddkit
  `?consumer=` ladder — no query-string label ladder exists on this server yet.

## Seat notes
- Shim pasted into the CoS-configured door again (same as gate 1). Took the Otto seat as ordered.
- Seat misses: HYGIENE 1 line check on kitchen skipped before first tool touch (14a);
  first commit `5e54c02` carried a malformed author email (unauthenticated `/users` call
  rate-limited → empty id) — amended to `1166a1a`, force-pushed with lease.
- Validation not performed here — same session as the cook. Fresh seat: reconnect the
  connector; `docs()`; `execute GET /user`; `telemetry` SELECT before/after.

## Plated — 2026-09-03T03:30Z (2026-09-02 ~11:30 PM ET)
Captain reviewed and merged PR #7 (branch head `756446c` — captain's edits after `1166a1a`;
merge `2a7c23a`). Workers Build `3e143006-ead6-4942-8a84-5dc86745bfa1` on main → success 03:26Z.
Live, observed from the Otto seat's own connector 03:30Z:
- `docs()` 200, 1215 B, `0.3.0` / `1.27.2+dcs`, `logged_in_as klappy`, both law URIs.
- `telemetry` before: `docs 1` → `execute GET /user` 200 `{login klappy, id 708}` (306 ms) →
  `DROP TABLE` → 400 `SELECT only`, nothing run → after: `execute//user/200 1`, plus the
  DROP logged as `telemetry/other/400 1`. `path_family` only; no path in the table.
- Captain: "All three tools live!" (phone connector — done-means 1).
Carried: T12 (AE sampled channel, HUMAN-ONLY secret) · T7 rotation waits on gate 4 ·
README status line (gate 4) · validation by a fresh seat still open (this was the cook's seat).
