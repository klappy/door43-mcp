/** `npm run docs` — write README.md from src/surface.ts. The only writer of README.md. */
import { writeFileSync, readFileSync } from "node:fs";
import { renderReadme } from "../src/surface";
const out = renderReadme();
const before = (() => { try { return readFileSync("README.md", "utf8"); } catch { return ""; } })();
writeFileSync("README.md", out);
console.log(before === out ? "README.md unchanged" : `README.md written (${out.length} chars)`);
