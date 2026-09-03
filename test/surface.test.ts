/** README.md is a build output: it must equal the generator, and every tool line on both doors must be DESCRIPTIONS verbatim. */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import pkg from "../package.json";
import { DESCRIPTIONS } from "../src/descriptions";
import { RECIPES } from "../src/tools/docs";
import { renderReadme, surface, sections } from "../src/surface";
import { renderHome } from "../src/home";

describe("README.md is generated (ticket 2026-09-03-door43-mcp-homepage-readme)", () => {
  it("committed README.md == renderReadme() — run `npm run docs` when this fails", () => {
    expect(readFileSync("README.md", "utf8")).toBe(renderReadme());
  });
  it("carries no hand-typed version: the only version string is package.json's, via the generator", () => {
    const md = readFileSync("README.md", "utf8");
    const versions = md.match(/\b\d+\.\d+\.\d+\b/g) ?? [];
    for (const v of versions) expect(v).toBe(pkg.version); // dates like 2026-09-03 do not match \d+\.\d+\.\d+
  });
});

describe("tool lines are DESCRIPTIONS verbatim on both doors", () => {
  const readme = renderReadme();
  const home = renderHome({ host: "git.door43.org", serverUrl: "https://door43.test" });
  for (const [name, line] of Object.entries(DESCRIPTIONS)) {
    it(`${name}: README`, () => expect(readme).toContain(`| \`${name}\` | ${line} |`));
    it(`${name}: home`, () => expect(home).toContain(line.replace(/&/g, "&amp;")));
  }
  it("surface() reads every recipe, in table order", () => {
    expect(surface().journeys.map((j) => j.recipe)).toEqual(Object.keys(RECIPES));
  });
  it("docs/SURFACE.md has the three sections the generator needs", () => {
    const s = sections(readFileSync("docs/SURFACE.md", "utf8"));
    expect(Object.keys(s)).toEqual(["what", "is not", "connect"]);
    expect(surface().connect).toHaveLength(3);
  });
});
