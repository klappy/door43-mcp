/** `/` — a ≤ 24 KB self-contained glass page whose facts all come from sources (ticket 2026-09-03-door43-mcp-homepage-readme). */
import { describe, it, expect } from "vitest";
import pkg from "../package.json";
import { DcsAuthHandler } from "../src/dcs-auth";
import { DESCRIPTIONS } from "../src/descriptions";

const ORIGIN = "https://door43.test";
const env = { D43_HOST: "git.door43.org", D43_CLIENT_ID: "cid", D43_CLIENT_SECRET: "s", COOKIE_ENCRYPTION_KEY: "00".repeat(32), OAUTH_PROVIDER: {} } as any;

async function home() {
  const r = await DcsAuthHandler.fetch(new Request(`${ORIGIN}/`), env);
  return { r, body: await r.text() };
}

describe("GET /", () => {
  it("200 text/html, ≤ 24 KB", async () => {
    const { r, body } = await home();
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/^text\/html/);
    expect(new TextEncoder().encode(body).byteLength).toBeLessThanOrEqual(24 * 1024);
  });
  it("names the three tools with DESCRIPTIONS verbatim, and the MCP URL for this origin", async () => {
    const { body } = await home();
    for (const [name, line] of Object.entries(DESCRIPTIONS)) { expect(body).toContain(`<b>${name}</b>`); expect(body).toContain(line.replace(/&/g, "&amp;")); }
    expect(body).toContain(`${ORIGIN}/mcp`);
    expect(body).toContain(`id="cp"`); // the copy button
  });
  it("version equals package.json (HYGIENE 19) and appears in the page", async () => {
    const { body } = await home();
    expect(body).toContain(`<code>${pkg.version}</code>`);
    for (const v of body.match(/\b\d+\.\d+\.\d+\b/g) ?? []) expect(v).toBe(pkg.version);
  });
  it("zero external assets: no external script/style/font/image, no @import, no inline event handlers", async () => {
    const { body } = await home();
    expect(body).not.toMatch(/<script[^>]*\ssrc=/i);
    expect(body).not.toMatch(/<link\b/i);
    expect(body).not.toMatch(/<img\b/i);
    expect(body).not.toMatch(/@import|fonts\.googleapis|fonts\.gstatic|cdn\./i);
    expect(body).not.toMatch(/\son[a-z]+=/i);
    expect(body.match(/<style>/g)).toHaveLength(1);
    expect(body.match(/<script>/g)).toHaveLength(1);
  });
  it("status is read from /health in the browser, not typed: the page fetches /health and prints observed_at", async () => {
    const { body } = await home();
    expect(body).toContain(`fetch('/health'`);
    expect(body).toContain(`observed_at`);
    expect(body).not.toContain("1.27.2"); // the upstream version is never typed into the page
  });
  it("glass-morphism mechanism is present: backdrop blur, translucent panels, thin light borders, layered gradient, both schemes", async () => {
    const { body } = await home();
    expect(body).toContain("backdrop-filter:blur(");
    expect(body).toMatch(/--glass:rgba\(255,255,255,\.\d+\)/);
    expect(body).toContain("radial-gradient(");
    expect(body).toContain("prefers-color-scheme:dark");
  });
});
