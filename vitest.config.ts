import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";

/** `.md` as text — the same shape wrangler gives it (rules: Text). One source file, two loaders. */
const mdText = { name: "md-text", transform(_: string, id: string) { if (id.endsWith(".md")) return { code: `export default ${JSON.stringify(readFileSync(id, "utf8"))};`, map: null }; } };

export default defineConfig({ plugins: [mdText], test: { include: ["test/**/*.test.ts"] } });
