/** `.md` imports are text: wrangler via the `Text` rule in wrangler.jsonc, vitest/vite-node via the plugin in vitest.config.ts. */
declare module "*.md" { const text: string; export default text; }
