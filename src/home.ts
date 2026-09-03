/**
 * `/` — the human door, rendered at request time from `src/surface.ts` (ticket
 * 2026-09-03-door43-mcp-homepage-readme). Nothing on the page is typed here that a source
 * already knows: version ← package.json, tool lines ← DESCRIPTIONS, journeys ← RECIPES,
 * copy ← docs/SURFACE.md, live status ← /health fetched in the browser (with observed_at).
 * Glass-morphism per the captain's ruling: frosted translucent panels (backdrop-filter blur),
 * thin light borders, soft depth, over a layered gradient; light and dark; phone first.
 * One inline <style>, one inline <script>; no external font, script, or image. ≤ 24 KB.
 * The one accent (amber, the light under the door) is spent on the hero's edge, the live dot,
 * and the copy button — nowhere else.
 */
import { surface, REPO_URL } from "./surface";

/** Text-node and double-quoted-attribute escaping; apostrophes stay readable (DESCRIPTIONS are matched verbatim in tests). */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
/** SURFACE.md copy: the one markdown mark it uses is `code`. */
const md = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

const CSS = `
:root{color-scheme:light dark;--ink:#17222D;--ink-2:#4A5966;--line:rgba(255,255,255,.65);--glass:rgba(255,255,255,.46);--glass-2:rgba(255,255,255,.3);--amber:#C9862B;--amber-ink:#2B1B05;--base:#E3EAF0;--b1:#8FB9D3;--b2:#EDBD7A;--b3:#BBA8DF;--shadow:0 18px 50px -24px rgba(23,34,45,.45);--code:rgba(23,34,45,.07)}
@media(prefers-color-scheme:dark){:root{--ink:#E9EFF4;--ink-2:#A9B6C2;--line:rgba(255,255,255,.14);--glass:rgba(255,255,255,.075);--glass-2:rgba(255,255,255,.045);--amber:#F0B85A;--amber-ink:#1A1204;--base:#0D1520;--b1:#1F5A72;--b2:#8A5720;--b3:#463676;--shadow:0 22px 60px -26px rgba(0,0,0,.8);--code:rgba(255,255,255,.08)}}
*{box-sizing:border-box}
html{background:var(--base)}
body{margin:0;min-height:100vh;color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;background:
 radial-gradient(60rem 38rem at 6% -8%,var(--b1) 0%,transparent 64%),
 radial-gradient(42rem 34rem at 100% 18%,var(--b2) 0%,transparent 62%),
 radial-gradient(52rem 42rem at 20% 70%,var(--b3) 0%,transparent 62%),
 radial-gradient(40rem 30rem at 90% 100%,var(--b1) 0%,transparent 62%),
 var(--base);background-attachment:fixed}
main{max-width:40rem;margin:0 auto;padding:1.25rem 1rem 4rem}
.g{background:var(--glass);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);padding:1.25rem 1.25rem;margin:1rem 0}
.hero{position:relative;padding:1.6rem 1.35rem 1.5rem 1.6rem;margin-top:1.5rem;overflow:hidden}
.hero:before{content:"";position:absolute;left:0;top:10%;bottom:10%;width:5px;border-radius:5px;background:var(--amber);box-shadow:0 0 22px 4px color-mix(in srgb,var(--amber) 55%,transparent)}
h1{margin:0 0 .35rem;font-size:clamp(2rem,7vw,2.75rem);line-height:1.05;letter-spacing:-.02em;font-weight:800}
.v{margin:0 0 1rem;color:var(--ink-2);font-size:.95rem}
p{margin:.6rem 0}
.not{color:var(--ink-2);font-size:.95rem;margin-top:.9rem}
h2{font-size:1.15rem;margin:0 0 .6rem;letter-spacing:-.01em}
.st{display:grid;grid-template-columns:auto 1fr;gap:.35rem .8rem;align-items:baseline;font-size:.95rem}
.st dt{color:var(--ink-2)}.st dd{margin:0}
.dot{display:inline-block;width:.6em;height:.6em;border-radius:50%;background:var(--ink-2);margin-right:.45em;vertical-align:middle}
.dot.up{background:var(--amber);box-shadow:0 0 8px var(--amber)}
.dot.down{background:#C0392B}
.url{display:flex;gap:.5rem;align-items:stretch;margin:.4rem 0 1rem}
.url code{flex:1;min-width:0;overflow-x:auto;white-space:nowrap;padding:.7rem .8rem;border-radius:12px;background:var(--code);border:1px solid var(--line);font-size:.95rem}
button{font:inherit;font-weight:600;padding:.55rem .95rem;border-radius:12px;border:1px solid var(--line);background:var(--amber);color:var(--amber-ink);cursor:pointer;flex:none}
button:focus-visible,a:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
ol{margin:0;padding-left:1.35rem}ol li{margin:.35rem 0}
code,kbd{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.92em}
.tools{display:grid;gap:.75rem}
.tool{display:grid;grid-template-columns:6.5rem 1fr;gap:.6rem;padding:.7rem 0;border-top:1px solid var(--line)}
.tool:first-child{border-top:0;padding-top:0}
.tool b{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:600}
.j{padding:.65rem 0;border-top:1px solid var(--line)}.j:first-child{border-top:0;padding-top:0}
.j p{margin:.2rem 0}.j code{display:block;overflow-x:auto;white-space:nowrap;padding:.5rem .65rem;border-radius:10px;background:var(--code);margin-top:.35rem}
.foot{font-size:.9rem;color:var(--ink-2)}.foot a{color:inherit}
.links{display:flex;flex-wrap:wrap;gap:.4rem .9rem;margin:.4rem 0 .8rem}
a{color:var(--ink);text-decoration-thickness:1px;text-underline-offset:3px}
@media(max-width:26rem){.tool{grid-template-columns:1fr;gap:.15rem}}
@media(prefers-reduced-motion:no-preference){button{transition:transform .12s}button:active{transform:scale(.97)}}
`;

const JS = `
(function(){
var d=document,st=d.getElementById('st'),dot=d.getElementById('dot'),up=d.getElementById('up'),at=d.getElementById('at');
fetch('/health',{cache:'no-store'}).then(function(r){return r.json()}).then(function(h){
 var ok=h.status===200&&h.upstream&&h.upstream.version;
 dot.className='dot '+(ok?'up':'down');st.textContent=ok?'reachable':'unreachable ('+h.status+')';
 up.textContent=(h.upstream&&h.upstream.host||'')+(h.upstream&&h.upstream.version?' · '+h.upstream.version:'');
 at.textContent=h.observed_at+(h.upstream_ms!=null?' · '+h.upstream_ms+' ms':'');
}).catch(function(){dot.className='dot down';st.textContent='/health did not answer';at.textContent=new Date().toISOString()});
var b=d.getElementById('cp'),u=d.getElementById('url');
b.addEventListener('click',function(){
 var t=u.textContent,done=function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1600)};
 if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){sel()});else sel();
 function sel(){var r=d.createRange();r.selectNodeContents(u);var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected — press copy'}
});
})();
`;

export function renderHome(o: { host: string; serverUrl: string }): string {
  const s = surface();
  const mcp = `${o.serverUrl}/mcp`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${s.name} — Door43 as you</title><meta name="description" content="${esc(s.what.slice(0, 150))}"><style>${CSS}</style></head><body><main>
<section class="g hero"><h1>Door43, as you.</h1><p class="v">${s.name} <code>${esc(s.version)}</code> · live at <a href="${o.serverUrl}/">${esc(o.serverUrl.replace(/^https?:\/\//, ""))}</a></p><p>${md(s.what)}</p><p class="not">${md(s.isNot)}</p></section>
<section class="g"><h2>Live</h2><dl class="st"><dt>Upstream</dt><dd><span class="dot" id="dot"></span><span id="st">checking…</span></dd><dt>Host</dt><dd id="up">${esc(o.host)}</dd><dt>Observed</dt><dd id="at">—</dd><dt>Server</dt><dd>${esc(s.version)} (from <code>package.json</code>)</dd></dl></section>
<section class="g"><h2>Connect in three steps</h2><div class="url"><code id="url">${esc(mcp)}</code><button id="cp" type="button" aria-label="Copy the MCP URL">Copy</button></div><ol>${s.connect.map((c) => `<li>${md(c)}</li>`).join("")}</ol></section>
<section class="g"><h2>The three tools</h2><div class="tools">${s.tools.map((t) => `<div class="tool"><b>${esc(t.name)}</b><span>${esc(t.line)}</span></div>`).join("")}</div></section>
<section class="g"><h2>Journeys</h2>${s.journeys.map((j) => `<div class="j"><p><b>${esc(j.recipe)}</b> — ${md(j.about)}</p><code>${esc(j.call)}</code></div>`).join("")}<p class="not">Each one is <code>docs({recipe:"…"})</code>; the server fills the call for you.</p></section>
<section class="g foot"><div class="links"><a href="${REPO_URL}">Repo</a><a href="${REPO_URL}/blob/main/AGENTS.md">AGENTS.md</a><a href="${REPO_URL}/tree/main/docs">docs/</a><a href="${REPO_URL}/blob/main/docs/DEPLOY.md">Deploy your own</a><a href="/health">/health</a></div>Governed by <code>${esc(s.law)}</code>. Reads only in v1; you can revoke access any time by deleting the app on Door43.</section>
</main><script>${JS}</script></body></html>`;
}
