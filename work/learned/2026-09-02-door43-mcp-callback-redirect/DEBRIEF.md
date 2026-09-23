# DEBRIEF — door43-mcp-callback-redirect (at the pass)

Cooked 2026-09-03T03:47Z–03:50Z (2026-09-02 ~11:50 PM ET), Otto seat in the
CoS-configured door (captain's order "Board as Otto"), ~4 min wall clock
(promise: 30 min). Cargo lives on `klappy/door43-mcp`:

- PR #8 — https://github.com/klappy/door43-mcp/pull/8 — **auto-merge ON**
  (squash, enabled 2026-09-03T03:50:04Z). Merge NOT yet observed at pass time.
- Branch `otto/callback-redirect`: `eb4b1f1` (cook) · `70109f1` (PLAN names #8)
- Base observed: main `2a7c23a`.

## Declared product → observed
1. `src/dcs-auth.ts` — success path `Response.redirect(redirectTo, 302)`; debug
   page only when `?debug=1` was on `/authorize`, sealed into `state`; page prints
   `observed_at/status/login/upstream_ms` only (no expires_in / has_refresh /
   token_type — Required Response §2).
2. `test/auth.test.ts` — **did not exist on main** (ticket assumed it); created.
   5 tests: 302 + Location = client redirect · sealed debug → 200 HTML login-only ·
   unsealed `&debug=1` on callback → still 302 · exchange failure → 502 unchanged ·
   `/authorize` 302s to DCS. 44/44 pass, `tsc --noEmit` clean.
3. `docs/PLAN.md` gate 0 — one appended row naming #8. `package.json` 0.3.1.

## Pre-DCS click (ticket L21–24)
Not ours. `/authorize` `Response.redirect`s to DCS at `dcs-auth.ts` L49 with no
page rendered; `workers-oauth-provider` hands `/authorize` wholesale to the
default handler. The "while connecting" click is the MCP client's own connect
confirmation. Stated in the PR body; nothing to fix in this repo.

## Done-means — observed vs waiting
Observed in harness: 302 whose `Location` starts with the client redirect;
`?debug=1` yields the old page; PR body names the pre-DCS click.
NOT yet observed: merge (auto-merge waits on checks), deploy-by-push, and the
captain's phone reconnect with zero extra taps — HUMAN-ONLY, after merge.

## Seat notes
- Commit author set to `klappy@users.noreply.github.com` (legacy noreply form);
  the `{id}+{login}` form per GitAuth identity-and-attribution was not used —
  operator id not observed this door. Flag, not fix.
- Root `/` page still says "0.2.0 — gate 1" (`dcs-auth.ts` L109). Out of plate;
  named for a future fast-food ticket.
- Rail move committed to kitchen main per rail/README.md (HYGIENE §3, 1.25.0).
- Validation not performed here — same seat as the cook.

## Plated 2026-09-03T04:1xZ
PR #8 merged (observed `merged: true` 04:06Z). Captain phone check still owed.

## Captain taste — 2026-09-03 ~1:55 PM ET (HUMAN-ONLY done-means, closed)
Captain, verbatim: "#8 disconnected and reconnected and it just worked as expected after login. Felt natural."
Observed by the captain on the phone: disconnect → reconnect → DCS login → back in the app, no extra taps, no gate-0 page. Every done-means on this ticket is now observed. Plate fully closed.
