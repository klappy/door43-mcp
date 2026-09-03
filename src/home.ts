/**
 * `/` — the human door, rendered at request time from `src/surface.ts` (ticket
 * 2026-09-03-door43-mcp-homepage-readme). Nothing on the page is typed here that a source
 * already knows: version ← package.json, tool lines ← DESCRIPTIONS, journeys ← RECIPES,
 * copy ← docs/SURFACE.md, live status ← /health fetched in the browser (with observed_at).
 * Design: the captain-supplied Generative Glass design system (2026-09-03) — tokens ported
 * verbatim (glass fill ladder, blur, hairlines, inner top light, refraction sheen, aurora field,
 * three-layer shadows, radius scale, SF Pro type scale, theme-dark aliases). Copy rules kept:
 * sentence case, overlines at 9px/0.14em, no emoji, no exclamation, no em-dashes. Accent budget:
 * teal for the live glow, red for down; nothing else coloured.
 * One inline <style>, one inline <script>; no external font, script, or image. ≤ 24 KB.
 */
import { surface, REPO_URL } from "./surface";

/** Text-node and double-quoted-attribute escaping; apostrophes stay readable (DESCRIPTIONS are matched verbatim in tests). */
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
/** SURFACE.md copy: the one markdown mark it uses is `code`. */
const md = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

const CSS = `
/* Generative Glass design system (captain-supplied, 2026-09-03): tokens ported verbatim from
   tokens/{colors,glass,elevation,radius,typography,spacing,motion,theme-dark}.css. Fonts: the
   system ships SF Pro binaries under Apple's licence; this page uses the same faces via the
   platform stack (-apple-system) and ships no font file. Dark = the system's theme-dark aliases,
   keyed on prefers-color-scheme since the page has no toggle. */
:root{color-scheme:light dark;
--ink-900:#0E1420;--ink-700:#242C3A;--ink-500:#5A6472;--ink-400:#7C8595;--ink-300:#9AA2B0;
--paper-000:#FFFFFF;--paper-100:#EEF0F5;--night-900:#0B0D10;--on-night-500:#A7ADB6;--on-night-400:#7E858F;
--accent-blue:#1F4FE0;--accent-red:#D0202E;--accent-teal:#3FB6A8;
--text-title:var(--ink-900);--text-body:var(--ink-700);--text-muted:var(--ink-500);--text-dim:var(--ink-400);--text-faint:var(--ink-300);
--surface-app:var(--paper-100);
--glass-fill-2:rgba(255,255,255,.46);--glass-fill-3:rgba(255,255,255,.62);
--blur-soft:16px;--blur-medium:24px;--sat-glass:saturate(160%);
--border-glass:.5px solid rgba(255,255,255,.7);--border-hairline:.5px solid rgba(20,28,45,.06);
--refraction:linear-gradient(135deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,0) 38%,rgba(255,255,255,0) 62%,rgba(255,255,255,.22) 100%);
--aurora-field:radial-gradient(52% 34% at 22% 30%,rgba(188,214,244,.85) 0%,rgba(188,214,244,0) 70%),radial-gradient(46% 30% at 78% 24%,rgba(251,216,189,.80) 0%,rgba(251,216,189,0) 72%),radial-gradient(58% 38% at 62% 62%,rgba(201,195,240,.85) 0%,rgba(201,195,240,0) 72%),radial-gradient(42% 28% at 30% 78%,rgba(246,239,198,.70) 0%,rgba(246,239,198,0) 74%),radial-gradient(50% 36% at 88% 82%,rgba(242,207,219,.65) 0%,rgba(242,207,219,0) 74%),linear-gradient(180deg,#F4F6FA 0%,#E7EBF3 100%);
--shadow-rest:0 1px 2px rgba(20,28,45,.04),0 6px 18px rgba(20,28,45,.05);
--shadow-card:0 2px 6px rgba(20,28,45,.05),0 14px 34px rgba(20,28,45,.08),0 40px 80px rgba(20,28,45,.06);
--glow-focus:0 0 0 1px rgba(255,255,255,.7),0 0 24px rgba(188,214,244,.55);
--inner-top:inset 0 1px 0 rgba(255,255,255,.75);--inner-edge:inset 0 0 0 .5px rgba(255,255,255,.55);
--r-sm:14px;--r-lg:22px;--r-xl:28px;--r-pill:999px;
--gutter-screen:18px;--gutter-card:18px;--gap-stack:10px;--gap-inline:8px;
--font-core:"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,system-ui,sans-serif;--font-mono:ui-monospace,"SF Mono",Menlo,monospace;
--fs-hero:28px;--fs-title:19px;--fs-body:15px;--fs-label:13px;--fs-caption:12px;--fs-micro:10px;--fs-overline:9px;
--ease-liquid:cubic-bezier(.22,1,.36,1);--dur-fast:240ms;--press-scale:.972}
@media(prefers-color-scheme:dark){:root{
--text-title:#FFFFFF;--text-body:#E7EAEF;--text-muted:var(--on-night-500);--text-dim:var(--on-night-400);--text-faint:#666D77;
--surface-app:var(--night-900);
--glass-fill-2:rgba(255,255,255,.09);--glass-fill-3:rgba(255,255,255,.14);
--border-glass:.5px solid rgba(255,255,255,.28);--border-hairline:.5px solid rgba(255,255,255,.10);
--inner-top:inset 0 1px 0 rgba(255,255,255,.26);--inner-edge:inset 0 0 0 .5px rgba(255,255,255,.14);
--refraction:linear-gradient(135deg,rgba(255,255,255,.20) 0%,rgba(255,255,255,0) 38%,rgba(255,255,255,0) 62%,rgba(255,255,255,.10) 100%);
--shadow-rest:0 1px 2px rgba(0,0,0,.34),0 6px 18px rgba(0,0,0,.30);
--shadow-card:0 2px 6px rgba(0,0,0,.36),0 14px 34px rgba(0,0,0,.40),0 40px 80px rgba(0,0,0,.32);
--glow-focus:0 0 0 1px rgba(255,255,255,.22),0 0 24px rgba(63,182,168,.30);
--accent-blue:#5C86F2;
--aurora-field:radial-gradient(52% 34% at 22% 30%,rgba(102,138,152,.55) 0%,rgba(102,138,152,0) 70%),radial-gradient(46% 30% at 78% 24%,rgba(92,134,242,.46) 0%,rgba(92,134,242,0) 72%),radial-gradient(58% 38% at 62% 62%,rgba(140,110,215,.52) 0%,rgba(140,110,215,0) 72%),radial-gradient(42% 28% at 30% 78%,rgba(226,70,84,.28) 0%,rgba(226,70,84,0) 74%),radial-gradient(50% 36% at 88% 82%,rgba(102,138,152,.32) 0%,rgba(102,138,152,0) 74%),linear-gradient(180deg,#0B0D10 0%,#0A1114 100%)}}
*{box-sizing:border-box}
html{background:var(--surface-app)}
body{margin:0;min-height:100vh;color:var(--text-body);font:400 var(--fs-body)/1.4 var(--font-core);letter-spacing:-.01em;-webkit-font-smoothing:antialiased;position:relative;overflow-x:hidden}
.aurora{position:fixed;inset:-18%;z-index:-1;background:var(--aurora-field);filter:blur(28px);animation:gg-drift 22s var(--ease-liquid) infinite}
@keyframes gg-drift{0%{transform:translate3d(0,0,0) scale(1)}33%{transform:translate3d(3%,-2%,0) scale(1.06)}66%{transform:translate3d(-2%,3%,0) scale(1.03)}100%{transform:translate3d(0,0,0) scale(1)}}
@media(prefers-reduced-motion:reduce){.aurora{animation:none}}
main{max-width:420px;margin:0 auto;padding:52px var(--gutter-screen) 40px;display:flex;flex-direction:column;gap:var(--gap-stack)}
.hd{padding:8px 4px 22px}
.date{font:400 var(--fs-caption)/1.3 var(--font-core);color:var(--text-dim);margin:0 0 6px}
h1{margin:0;font:500 var(--fs-hero)/1.16 var(--font-core);letter-spacing:-.02em;color:var(--text-title)}
.g{position:relative;background:var(--glass-fill-2);backdrop-filter:blur(var(--blur-medium)) var(--sat-glass);-webkit-backdrop-filter:blur(var(--blur-medium)) var(--sat-glass);border:var(--border-glass);border-radius:var(--r-xl);box-shadow:var(--shadow-card),var(--inner-top),var(--inner-edge);padding:var(--gutter-card);color:var(--text-body)}
.g:before{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--refraction);opacity:.6;pointer-events:none}
.g>*{position:relative}
.ov{display:block;font:600 var(--fs-overline)/1.2 var(--font-core);letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin:0 0 8px}
h2{margin:0 0 8px;font:600 var(--fs-title)/1.24 var(--font-core);letter-spacing:-.015em;color:var(--text-title)}
p{margin:0}
.body{font-size:var(--fs-body)}
.muted{color:var(--text-muted);font-size:var(--fs-label);margin-top:10px}
.st{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:var(--fs-label);align-items:baseline}
.st dt{color:var(--text-dim);font-weight:500}.st dd{margin:0;color:var(--text-body)}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--text-faint);margin-right:7px;vertical-align:middle}
.dot.up{background:var(--accent-teal);box-shadow:0 0 12px rgba(63,182,168,.6)}
.dot.down{background:var(--accent-red)}
.url{display:flex;gap:var(--gap-inline);align-items:center;margin:2px 0 12px}
.url code{flex:1;min-width:0;overflow-x:auto;white-space:nowrap;padding:11px 14px;border-radius:var(--r-pill);background:var(--glass-fill-3);border:var(--border-glass);box-shadow:var(--inner-top);font:500 var(--fs-label)/1 var(--font-mono);color:var(--text-title)}
.url code::-webkit-scrollbar{display:none}
button{display:inline-flex;align-items:center;justify-content:center;padding:12px 20px;border-radius:var(--r-pill);border:var(--border-glass);background:var(--glass-fill-3);color:var(--text-title);box-shadow:var(--shadow-rest),var(--inner-top);font:600 var(--fs-label)/1 var(--font-core);letter-spacing:-.01em;cursor:pointer;flex:none;transition:opacity var(--dur-fast) var(--ease-liquid),transform var(--dur-fast) var(--ease-liquid),box-shadow var(--dur-fast) var(--ease-liquid)}
button:hover{transform:translateY(-1px);filter:brightness(1.04)}button:active{transform:scale(var(--press-scale))}
button:focus-visible,a:focus-visible{outline:none;box-shadow:var(--glow-focus)}
ol{margin:0;padding-left:20px;font-size:var(--fs-body)}ol li{margin:6px 0}
code,kbd{font-family:var(--font-mono);font-size:.93em}
.chip{display:inline-flex;align-items:center;padding:5px 11px;border-radius:var(--r-pill);background:var(--glass-fill-3);border:var(--border-glass);color:var(--text-title);font:500 var(--fs-caption)/1.1 var(--font-mono);letter-spacing:.01em;margin-bottom:6px}
.row{padding:12px 0;border-top:var(--border-hairline)}.row:first-of-type{border-top:0;padding-top:4px}.row:last-of-type{padding-bottom:0}
.row p{font-size:var(--fs-body)}
.call{display:block;overflow-x:auto;white-space:nowrap;margin-top:8px;padding:9px 12px;border-radius:var(--r-sm);background:var(--glass-fill-3);border:var(--border-glass);box-shadow:var(--inner-top);font:500 var(--fs-caption)/1.2 var(--font-mono);color:var(--text-title)}
.call::-webkit-scrollbar{display:none}
.foot{font-size:var(--fs-label);color:var(--text-muted)}
.links{display:flex;flex-wrap:wrap;gap:var(--gap-inline);margin:0 0 12px}
.links a{display:inline-flex;padding:8px 14px;border-radius:var(--r-pill);background:var(--glass-fill-3);border:var(--border-glass);box-shadow:var(--inner-top);color:var(--text-title);font:600 var(--fs-caption)/1 var(--font-core);text-decoration:none}
a{color:var(--text-title);text-decoration-thickness:.5px;text-underline-offset:3px}
`;

const JS = `
(function(){
var d=document,st=d.getElementById('st'),dot=d.getElementById('dot'),up=d.getElementById('up'),at=d.getElementById('at');
fetch('/health',{cache:'no-store'}).then(function(r){return r.json()}).then(function(h){
 var ok=h.status===200&&h.upstream&&h.upstream.version;
 dot.className='dot '+(ok?'up':'down');st.textContent=ok?'Reachable':'Unreachable, '+h.status;
 up.textContent=(h.upstream&&h.upstream.host||'')+(h.upstream&&h.upstream.version?' · '+h.upstream.version:'');
 at.textContent=h.observed_at+(h.upstream_ms!=null?' · '+h.upstream_ms+' ms':'');
}).catch(function(){dot.className='dot down';st.textContent='No answer from /health';at.textContent=new Date().toISOString()});
var b=d.getElementById('cp'),u=d.getElementById('url');
b.addEventListener('click',function(){
 var t=u.textContent,done=function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1600)};
 if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){sel()});else sel();
 function sel(){var r=d.createRange();r.selectNodeContents(u);var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected, press copy'}
});
})();
`;

export function renderHome(o: { host: string; serverUrl: string }): string {
  const s = surface();
  const mcp = `${o.serverUrl}/mcp`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="light dark"><title>${s.name}</title><meta name="description" content="${esc(s.what.slice(0, 150))}"><style>${CSS}</style></head><body><div class="aurora" aria-hidden="true"></div><main>
<header class="hd"><p class="date">${s.name} <code>${esc(s.version)}</code></p><h1>Door43,<br>as you.</h1></header>
<section class="g"><span class="ov">What this is</span><p class="body">${md(s.what)}</p><p class="muted">${md(s.isNot)}</p></section>
<section class="g"><span class="ov">Live</span><dl class="st"><dt>Upstream</dt><dd><span class="dot" id="dot"></span><span id="st">Checking</span></dd><dt>Host</dt><dd id="up">${esc(o.host)}</dd><dt>Observed</dt><dd id="at">Waiting</dd><dt>Server</dt><dd>${esc(s.version)}</dd></dl></section>
<section class="g"><span class="ov">Connect</span><h2>Three steps</h2><div class="url"><code id="url">${esc(mcp)}</code><button id="cp" type="button" aria-label="Copy the MCP URL">Copy</button></div><ol>${s.connect.map((c) => `<li>${md(c)}</li>`).join("")}</ol></section>
<section class="g"><span class="ov">Tools</span><h2>Three, no more</h2>${s.tools.map((t) => `<div class="row"><span class="chip">${esc(t.name)}</span><p>${esc(t.line)}</p></div>`).join("")}</section>
<section class="g"><span class="ov">Journeys</span><h2>Filled for you</h2>${s.journeys.map((j) => `<div class="row"><span class="chip">${esc(j.recipe)}</span><p>${md(j.about)}</p><code class="call">${esc(j.call)}</code></div>`).join("")}<p class="muted">Each one is <code>docs({recipe})</code>. The server fills the call.</p></section>
<section class="g foot"><span class="ov">More</span><div class="links"><a href="${REPO_URL}">Repo</a><a href="${REPO_URL}/blob/main/AGENTS.md">Agents</a><a href="${REPO_URL}/tree/main/docs">Docs</a><a href="${REPO_URL}/blob/main/docs/DEPLOY.md">Deploy your own</a><a href="/health">Health</a></div>Governed by <code>${esc(s.law)}</code>. Reads only in v1. Revoke any time by deleting the app on Door43.</section>
</main><script>${JS}</script></body></html>`;
}
