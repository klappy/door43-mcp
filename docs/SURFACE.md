# SURFACE — the only hand-written copy on the two human doors

`README.md` and the homepage at `/` are generated from this file plus the sources that
drive the build (`package.json`, `src/descriptions.ts`, the recipe table in
`src/tools/docs.ts`, and `/health` at request time). Edit here, then `npm run docs`.
Everything below the headings is copy; the headings are the contract `src/surface.ts` reads.

## What

Door43-mcp is a small MCP server that lets an AI agent use Door43 (DCS, the Gitea host for
unfoldingWord's open Bible translation resources) as you. You log in with your own Door43
account; the server keeps the grant and never sees a pasted token. Three tools cover the
whole job: read the API reference, run one GET/HEAD request, read the server's own numbers.

## Is not

Not a helps aggregator, not a multi-host broker, not a token vault, not a write surface, not a cache of DCS content.

## Connect

1. Add the MCP URL to your client (Claude, Cursor, or any MCP client that speaks OAuth).
2. Log in when the client sends you to git.door43.org and approve the app.
3. Ask for `execute GET /user` — it returns your Door43 login. You are in.
