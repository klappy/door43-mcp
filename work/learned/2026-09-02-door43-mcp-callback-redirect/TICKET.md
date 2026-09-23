# TICKET — door43-mcp-callback-redirect

**What this is:** After DCS login, `/callback` must 302 straight back to the
client. Today it renders the gate-0 debug page (JSON + "Continue to client")
and makes the user click. Gate 0 is closed; its proof surface goes with it.
**Why now:** Captain, 2026-09-02 23:55 ET, from his phone: "the call ack takes
me to a confirmation page of a JSON payload — nice for debugging, bad UX for
success. I had to click a button to continue."
**Your move:** Disconnect and reconnect the connector once it lands; observe
zero extra taps between DCS consent and being back in the app.

Class: fast-food. Risk: STANDARD. Station: subagent (Otto, or any seat with
the repo). Owner: Otto. Promise: 30 min (R6). Depends: none. Meal: door43-mcp.

Ingredients (observed on main 2026-09-03T03:40Z):
- `klappy/door43-mcp` `src/dcs-auth.ts` L100–105: `completeAuthorization` is
  called and `redirectTo` obtained, then the function returns `html(...)` with
  the observed JSON and an anchor to `redirectTo`. L74 (exchange failure) and
  L32 (`/healthz`-style JSON) are fine as they are — failures should show
  detail; success should not.
- Captain reports a second click "while connecting", before DCS. Observe
  whether that is this server (there is no approval-dialog code in
  `dcs-auth.ts`; `/authorize` 302s to DCS at L49) or the connecting client's own
  confirm. Say which in the PR body; if it is ours, fix it in the same PR.

Declared product:
1. `src/dcs-auth.ts` — success path returns `Response.redirect(redirectTo, 302)`.
   The observed-JSON page survives only behind `?debug=1` on the authorize
   URL, sealed into state, and is off by default.
2. `test/auth.test.ts` — callback success → 302 with `Location` = client
   redirect; `?debug=1` → 200 HTML; exchange failure → 502 HTML unchanged.
3. `docs/PLAN.md` gate 0 row: one appended line "debug page retired (#N)".
   `package.json` `0.3.1`.

Done-means:
- The captain can reconnect on his phone and observe: DCS consent → back in
  the app, no intermediate page.
- A cook can hit `/callback` in the test harness and observe a 302 whose
  `Location` starts with the client's registered redirect.
- A cook can add `?debug=1` and observe the old JSON page.
- The PR body names where the pre-DCS click comes from.

## Failure Modes — What Breaks When a Proof Surface Outlives Its Gate
- Every user of every future deployment sees a developer's debug page.
- The debug page leaks `observed` fields (login, TTL) to whoever holds the
  browser after the redirect.

## Required Response When Detected
- Debug page on a success path → 302; debug behind an explicit flag only.
- Leak → the flag page prints no token-adjacent fields; login only.
