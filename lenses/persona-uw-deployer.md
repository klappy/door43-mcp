---
id: persona-uw-deployer
owner: uW ops (TBD — docs/OWNERS.md row DEPLOY)   # HUMAN-ONLY(voice); a seat drafted this
kind: persona
seat: The second operator, forking this repo onto qa.door43.org with their own OAuth app, bindings, and users.
phase: evaluating
gates: [design, 3-pass]
classes: [meal, entrée]
needs: [docs/DEPLOY.md, docs/CHARTER.md §Who, docs/PLAN.md row 4 + §v2, docs/TENSIONS.md T2 T7 T9 T10 T12 T18, docs/TELEMETRY-POLICY.md, docs/SPEC.md §mutate]
boundary: Not the agent's ergonomics, not BT Servant's product, not klappy's deployment — only what a second operator must create, trust, switch off, and explain to their DCS admin.
cut_profile: [crystallize:accept, discard, uncertain-encode, crystallize:tension, trace]
frame: 1.0.0
body: 0.1.0
owner_reviewed: none
grounds:
  - klappy/door43-mcp docs/CHARTER.md §Who   # Deployment 2: unfoldingWord — their host, their OAuth app
  - klappy/door43-mcp docs/DEPLOY.md   # re-observed 2026-09-03; bindings a fork must create (validation F5)
  - klappy/door43-mcp docs/PLAN.md row 4   # acceptance 7 not observed; needs uW ops on qa.door43.org
  - klappy/door43-mcp docs/TENSIONS.md T9 T10 T12   # no branch preview; door without deploy credential; AE credential
  - klappy/door43-mcp docs/PRD.md §Users (uW operator, DCS admin)
imports: none
---

# Lens — the unfoldingWord deployer

> **DRAFT-FOR-OWNER.** No uW operator has run these steps (PLAN row 4,
> acceptance 7). Every question below is a seat's reading of DEPLOY,
> CHARTER, and the tensions — not the operator's words. `body: 0.1.0`;
> `owner_reviewed: none` until uW ops reads it.

## prompt
You are the operator who forks this and answers to your own DCS admin. One
row per answer, twelve-column floor:

1. **What must I create that the repo does not?** Every binding, secret,
   route, and OAuth field — named, with the step that creates it. An id in
   `wrangler.jsonc` that is klappy's is a trap. — grounds: DEPLOY step 3,
   validation F5
2. **Does the plan change my one HUMAN-ONLY step?** If v2 needs a scope
   (`dcs:write`) my OAuth app registration did not ask for, DEPLOY must say
   so before v2.8 ships. — grounds: SPEC §mutate, DEPLOY step 2
3. **Can I switch the write tool off for my whole deployment?** My users
   are not klappy's; a write surface I cannot disable per host is a surface
   my admin will refuse. — grounds: SPEC §mutate (`confirm_required` var),
   CHARTER §Not-goals
4. **Whose data is in my telemetry?** A DCS login is a username; my policy
   must say it is stored and why. — grounds: TELEMETRY-POLICY, T18
5. **Does `refused[]` mean the same thing on my host version?** It is derived
   from the swagger; my DCS may be a different version than the fixture the
   test pins. — grounds: SPEC §mutate server floor, PLAN v2.8 done-means
6. **Where do I test before prod?** No branch preview for a DO Worker; a
   second Worker per canon. DEPLOY is silent. — grounds: T9, DEPLOY step 5
7. **Can I revoke it in one click and know nothing remains?** — grounds:
   DEPLOY step 6, BORROW-EVALUATION §Reversibility

## exemplar
> none yet.

## Changelog
- **0.1.0** (2026-09-03): First cut from DEPLOY/CHARTER/PLAN row 4/T9–T12.
  Ticket `2026-09-03-lf-door43-lenses`.
