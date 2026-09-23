# Pass review — recipe run

Observed 2026-09-08T12:29:27-04:00. Reviewer: pass_recent, independent source assessment delegated by active Pass seat. **Cook longer, not Serve.**

Cargo https://github.com/klappy/door43-mcp/pull/21 remains open draft, exact head `6d88295ec95ba80a9e949d64d27efe17b9346b71`.

## Source findings

1. `src/tools/execute.ts:301–305`: run appends a complete step and accumulates bytes before checking the 200 KB total; the condition also skips the check on the last step. Two individually sub-cap bodies can return more than the declared total, and the final step can report completion over the cap. The added cap test explicitly expects greater-than-cap bytes. This is a source-observed mismatch with declared product 1 (200 KB total after projection); no new execution was performed.
2. `src/tools/execute.ts:304,312–313,320`: if the final step is truncated at its own body cap, stopped is set, done is false, resumeAt exceeds plan length, and the top-level result is truncated:true with continue:null. Nested step continuation remains, but top-level always-continue contract cited in the ticket is unmet. Tests lack this final-step case.
3. Existing telemetry test constructs rows from mocked outputs; it does not prove persisted runtime rows. The PR's historical unauthenticated DCS timings are not authenticated Worker execution timings. The live three tool_call plus one recipe_run observation remains unverified here.

Checks: current-head Workers Builds and two test check-runs all completed successfully; reviews and inline comments empty when observed. Existing test success was observed, not independently rerun. No Door43 connector tools appeared in this reviewer's callable tool inventory; no authenticated deployed recipe/telemetry evidence was obtained. No runtime result, deployment, approval or merge is claimed.

Governing sources: cookbook/workers/pass-lane.md, HYGIENE 3/20 and validate-plate 17, this ticket and current PR diff. Return to **Otto: cook longer**, then fresh independent validation on corrected cargo. This receipt changes no product, lane, approval or delivery promise.
