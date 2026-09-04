# lenses/INDEX.md — door43-mcp
frame: 1.0.0

Who is in the seat when this repo's plans are read. A seat opening a plan
loads only the rows for its class and gate (`klappy/kitchen`
`cookbook/lenses/INDEX-TEMPLATE.md`, DELTA d0001). Portable rows are
`klappy://` URIs resolved with `oddkit_resolve` at run time — never copied
here; a failed resolution is a `trace` row, tier 3, in the receipt.

| lens | owner | kind | phase | class | gate | body | owner_reviewed | state |
|---|---|---|---|---|---|---|---|---|
| klappy://canon/methods/driver-seat-lens | house | portable | shaping | meal, entrée, catering | design | 1.0.0 | 2026-09-03 | active |
| klappy://canon/lenses/klappy-architect | klappy | portable | evaluating | meal, entrée, catering | design | 0.1.0 | none | draft |
| persona-agent-reader | CoS door (seat) | persona | evaluating | meal, entrée | design, 3-pass | 0.1.0 | 2026-09-03 | draft |
| persona-uw-deployer | uW ops (TBD; `docs/OWNERS.md`) | persona | evaluating | meal, entrée | design, 3-pass | 0.1.0 | none | draft |
| persona-btservant-dev | Ian Lindsley (proposed) | persona | evaluating | meal, entrée | design | 0.1.0 | none | draft |

state: active | advisory | draft. advisory = three consecutive runs with no
delta, or `owner_reviewed` older than 90 days (kitchen LIFECYCLE 1.2.0).
`draft` = body < 1.0.0, DRAFT-FOR-OWNER: rows it produces stay `custody=run`
until the named owner acks them (DELTA d0005, d0013).

Receipts: `docs/LENSES.tsv` (twelve-column floor, `cookbook/lenses/RECEIPT.md`);
`docs/LENSES-RUN.md` is its `Kirigami:unfold`, never hand-edited.

## Changelog
- **1.0.0** (2026-09-03): First cut. Ticket `klappy/kitchen`
  `2026-09-03-lf-door43-lenses` (meal `2026-09-03-lens-framework`, dish 4).
