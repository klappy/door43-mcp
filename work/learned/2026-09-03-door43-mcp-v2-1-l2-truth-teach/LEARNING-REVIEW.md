# Learning review — 2026-09-03-door43-mcp-v2-1-l2-truth-teach

Retrospective preparation dated 2026-09-08 (America/New_York); source snapshot `klappy/kitchen@b2b043ae40c763cfa9366b351e103dd574a89533`. Bounded Door43 learning cook; independent learning review **pending**. Historical records remain intact. This is not a new runtime test, a new grant of authority, or confirmation of a currently running service.

## Intended, delivered and observed

**Intended:** Make L2 complete and compact, preserve typed next calls, surface conditional-response metadata and teach without extra fetches.

**Delivered / evidence:** PR #12 merge 9585f31 after Bugbot; compact catalog docs 1,690 bytes versus 5,731, 41 keys; 323-path walk, 246 operations with 200 schemas and over 1,000 key checks; 59 tests initially. Heterogeneous-array false-empty bug fixed by Cursor contribution and its test.

**Unknown / contradictory / limited:** Live DCS probes on six paths found no etag, last-modified or rate-limit headers; live fields remain null. Injected-header tests prove optional handling, not that DCS supplies these headers. No longitudinal full-detail-demand threshold observed.

## Three learning loops

1. **Intervention and result:** the delivered evidence above is the single-loop record. Earlier open-state prose is superseded only by a later dated receipt; a merge and an outcome remain different claims.
2. **Producing system:** Compact disclosure must remove prose rather than truth; derive hints from already-held request/response/schema and count upstream fetches.
3. **Learning machinery:** Whole-schema coverage guarded against convenient samples. Autofix changed head and readiness; the required Bugbot check did not appear until ready-for-review was reasserted. That historical platform behavior must be re-observed before relying on it today.

## Disposition

**review-ready; bounded retrospective learning.** The evidence is sufficient to review this bounded retrospective even when the product outcome is incomplete. No amount of missing KPI data converts a negative or inconclusive result into a request to recook history. No attention, money, adoption or time savings are invented.

After independent review, the coordinator may close the learning while retaining every stated product acceptance debt. Future implementation or recovered evidence belongs to its own authorized work, with a dated pointer back here. Revisit when a linked product change or new receipt addresses the exact unknown above; no captain question is required merely to approve this reconstruction.

Recurring process learning routes through existing `cookbook/roles/expeditor/NOTES.md`, HYGIENE19 and the relevant Door43 project cookbook/design home. This file promotes no new binding law. Tool and deployment behavior observed historically must be freshly checked before future use.

## Evidence inventory and journal coverage

All 4 files in this ticket's folder were fetched (including the coordinator's learning claim). These are distinct from journal coverage. Journal discovery used pinned tree names plus GitHub code search for `door43` and exact `door43-mcp`: the latter returned five complete indexed matches. All five were read, together with the Sep2 CoS-door-b chronology. Directly relevant journal sources are listed below; the remaining matches concern later meal/lens coordination rather than this dish's acceptance. Search-index freshness remains a limitation, not a proof that no other historical record exists.

| Source at pinned snapshot | Blob SHA |
|---|---|
| [rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/CHECKLIST-RUN.md](https://github.com/klappy/kitchen/blob/b2b043ae40c763cfa9366b351e103dd574a89533/rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/CHECKLIST-RUN.md) | `a422f31029a1784a35a3df2e254c2ad6f401dda0` |
| [rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/DEBRIEF.md](https://github.com/klappy/kitchen/blob/b2b043ae40c763cfa9366b351e103dd574a89533/rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/DEBRIEF.md) | `1185811fd3cc3f477cecf07c2aeb2a31d86f0b6f` |
| [rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/LEARNING-CLAIM.md](https://github.com/klappy/kitchen/blob/b2b043ae40c763cfa9366b351e103dd574a89533/rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/LEARNING-CLAIM.md) | `6c6f4659f73247bf47cbc9e881e15828e0cd53d1` |
| [rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/TICKET.md](https://github.com/klappy/kitchen/blob/b2b043ae40c763cfa9366b351e103dd574a89533/rail/4-plated/2026-09-03-door43-mcp-v2-1-l2-truth-teach/TICKET.md) | `34cfd89819f9482d6032594a1a94224a0956706a` |
