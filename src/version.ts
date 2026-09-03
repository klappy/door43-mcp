/** The one version. `package.json` is the source of truth; nothing else in `src/` may spell a version.
 *  Bundled by wrangler (esbuild JSON import); read by vitest the same way. */
import pkg from "../package.json";
export const VERSION: string = pkg.version;
