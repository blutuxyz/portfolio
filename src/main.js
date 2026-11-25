import '@fontsource-variable/archivo/wdth.css';
import './style.css';
import './vendor/scrollcraft.js';
import { dict, sections, projects } from './i18n.js';

const SC = window.ScrollCraft;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const win = (p, a, b) => smooth((p - a) / Math.max(b - a, 1e-4));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------ i18n */
let lang = (() => {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'de' || saved === 'en') return saved;
  } catch (e) { /* storage blocked */ }
  return (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en';
})();

const secById = Object.fromEntries(sections.map((s) => [s.id, s]));
const projById = Object.fromEntries(projects.map((p) => [p.id, p]));
let api = null;

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const words = (s) => s.split(/(\s+)/).map((w) => (/^\s+$/.test(w) || !w ? w : `<span class="w">${esc(w)}</span>`)).join('');

/* The statement: [[hue|phrase]] marks a coloured phrase. Every word becomes
   its own span so it can be inked as it is read. */
const statementEl = $('#statement');
let statementWords = [];
function buildStatement() {
  const src = dict[lang].statement;
  let html = '';
  let last = 0;
  src.replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (m, hue, phrase, at) => {
    html += words(src.slice(last, at));
    html += `<span class="hl c-${hue}">${words(phrase)}</span>`;
    last = at + m.length;
    return m;
  });
  html += words(src.slice(last));
  statementEl.innerHTML = html;
  statementWords = $$('.w', statementEl).map((el) => ({ el, o: -1 }));
}

function applyLang(next) {
  lang = next;
  const t = dict[lang];
  root.lang = lang;
  document.title = t['meta.title'];
  const md = $('meta[name="description"]');
  if (md) md.setAttribute('content', t['meta.desc']);

  $$('[data-i18n]').forEach((el) => {
    const v = t[el.dataset.i18n];
    if (v != null && el.textContent !== v) el.textContent = v;
  });
  $$('[data-i18n-aria]').forEach((el) => {
    const v = t[el.dataset.i18nAria];
    if (v != null) el.setAttribute('aria-label', v);
  });
  $$('[data-sec-name]').forEach((el) => { el.textContent = secById[el.dataset.secName][lang]; });
  $$('[data-proj-name]').forEach((el) => { el.textContent = projById[el.dataset.projName][lang]; });
  $$('.dock-lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  buildStatement();
  syncIndexLabel();
  syncThemeLabel();
  renderDock(true);
  try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
  if (api) { api.layout(); requestAnimationFrame(() => runAll(true)); }
}

function switchLang(next) {
  if (next === lang) return;
  if (reduce) { applyLang(next); return; }
  const main = $('#inhalt');
  main.classList.add('is-relettering');
  setTimeout(() => {
    applyLang(next);
    requestAnimationFrame(() => main.classList.remove('is-relettering'));
  }, 130);
}
$$('.dock-lang button').forEach((b) => b.addEventListener('click', () => switchLang(b.dataset.lang)));

/* ----------------------------------------------------------------- theme
   Switching theme is a nightfall (or a daybreak): the new theme climbs the
   screen behind a mountain ridge, with a band of twilight on its edge. */
const themeBtn = $('#theme-btn');
const RIDGE = [6, 2, 5, 0, 3, 8, 4, 1, 6, 9, 3, 1, 7, 4, 8, 2, 5]; // % offsets
const ridgeX = (i) => (i * 100) / (RIDGE.length - 1);
const clipAt = (b) =>
  `polygon(${RIDGE.map((o, i) => `${ridgeX(i).toFixed(2)}% ${(b + o).toFixed(2)}%`).join(', ')}, 100% 160%, 0% 160%)`;

function glowElement(toDark) {
  const el = document.createElement('div');
  el.className = 'vt-glow';
  el.setAttribute('aria-hidden', 'true');
  const top = RIDGE.map((o, i) => `${ridgeX(i)},${o - 6}`).join(' ');
  const bottom = RIDGE.map((o, i) => `${ridgeX(i)},${o + 14}`).reverse().join(' ');
  const edge = RIDGE.map((o, i) => `${ridgeX(i)},${o}`).join(' ');
  const [c1, c2] = toDark ? ['#FF9152', '#FF4F8B'] : ['#FFD36B', '#FFF0C2'];
  el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs><linearGradient id="vtg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c1}" stop-opacity="0"/>
      <stop offset="0.3" stop-color="${c1}" stop-opacity="0.95"/>
      <stop offset="0.55" stop-color="${c2}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${c2}" stop-opacity="0"/>
    </linearGradient></defs>
    <polygon points="${top} ${bottom}" fill="url(#vtg)"/>
    <polyline points="${edge}" fill="none" stroke="${c1}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
  </svg>`;
  return el;
}

function currentTheme() { return root.dataset.theme === 'dark' ? 'dark' : 'light'; }
function syncThemeLabel() {
  themeBtn.setAttribute('aria-label', dict[lang][currentTheme() === 'dark' ? 'theme.toLight' : 'theme.toDark']);
}
function setTheme(t) {
  root.dataset.theme = t;
  try { localStorage.setItem('theme', t); } catch (e) { /* ignore */ }
  syncThemeLabel();
  runAll(true);
}

let themeBusy = false;
themeBtn.addEventListener('click', () => {
  if (themeBusy) return;
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  if (reduce || !document.startViewTransition) { setTheme(next); return; }

  themeBusy = true;
  let glow = null;
  const vt = document.startViewTransition(() => {
    setTheme(next);
    glow = glowElement(next === 'dark');
    document.body.appendChild(glow);
  });
  // The ridge travels until the whole glow band (o - 6 .. o + 14) has left
  // the top edge, and the glow fades over the last stretch, so the final
  // frame is the new theme alone and nothing is left to pop off.
  const opts = { duration: 1600, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', fill: 'both' };
  const END = -32;
  vt.ready.then(() => {
    root.animate({ clipPath: [clipAt(108), clipAt(END)] }, { ...opts, pseudoElement: '::view-transition-new(root)' });
    root.animate([
      { transform: 'translateY(108%)', opacity: 1 },
      { opacity: 1, offset: 0.6 },
      { transform: `translateY(${END}%)`, opacity: 0 },
    ], { ...opts, pseudoElement: '::view-transition-new(vt-glow)' });
  }).catch(() => {});
  vt.finished.finally(() => {
    if (glow) glow.remove();
    themeBusy = false;
  });
});

/* ------------------------------------------------------------------ dock */
const dockTitle = $('#dock-title');
const dockDot = $('#dock-dot');
const secEls = $$('[data-sec]');
let activeSec = 0;
let activeProj = 0;

function renderDock(force) {
  const inWork = sections[activeSec].id === 'work';
  const label = inWork ? projects[activeProj][lang] : sections[activeSec][lang];
  const hue = inWork ? projects[activeProj].hue : sections[activeSec].hue;
  const changed = dockTitle.textContent !== label;
  dockTitle.textContent = label;
  dockDot.style.setProperty('--dot', `var(--h-${hue})`);
  if (changed && !force && !reduce) {
    for (const el of [dockTitle, dockDot]) { el.classList.remove('is-flipping', 'is-pop'); void el.offsetWidth; }
    dockTitle.classList.add('is-flipping');
    dockDot.classList.add('is-pop');
  }
  const cur = inWork ? `p${activeProj}` : sections[activeSec].id;
  $$('.dock-index a').forEach((a) => {
    const key = a.dataset.go != null ? `p${a.dataset.go}` : a.getAttribute('href').slice(1);
    if (key === cur) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

function trackSections() {
  const vh = innerHeight;
  let idx = 0;
  for (let i = 0; i < secEls.length; i++) {
    if (secEls[i].getBoundingClientRect().top <= vh * 0.5) idx = i;
  }
  if (idx !== activeSec) { activeSec = idx; renderDock(false); }
}

const dockBtn = $('#dock-btn');
const dockIndex = $('#dock-index');
function syncIndexLabel() {
  const open = dockBtn.getAttribute('aria-expanded') === 'true';
  dockBtn.setAttribute('aria-label', dict[lang][open ? 'dock.close' : 'dock.open']);
}
function setIndex(open, focusBack) {
  dockBtn.setAttribute('aria-expanded', String(open));
  dockIndex.hidden = !open;
  syncIndexLabel();
  if (open) {
    const cur = dockIndex.querySelector('a[aria-current="true"]') || dockIndex.querySelector('a');
    cur && cur.focus({ preventScroll: true });
  } else if (focusBack) dockBtn.focus({ preventScroll: true });
}
dockBtn.addEventListener('click', () => setIndex(dockBtn.getAttribute('aria-expanded') !== 'true', false));
dockIndex.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  if (a.dataset.go != null) { e.preventDefault(); goToProject(+a.dataset.go); }
  setIndex(false, false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dockIndex.hidden) setIndex(false, true); });
document.addEventListener('pointerdown', (e) => { if (!dockIndex.hidden && !e.target.closest('#dock')) setIndex(false, false); });

/* ---------------------------------------------------------------- mount */
applyLang(lang);
api = SC.mount(document.body);
const actOf = (id) => api.acts.find((a) => a.el.id === id || a.el.classList.contains(id));

/* ------------------------------------------------------ graphics timeline
   data-draw / data-show / data-move / data-sweep(-y), driven by whatever
   progress value the owner hands it. */
function makeTimeline(el) {
  const read = (sel, key) => $$(`[${sel}]`, el).map((n) => ({ el: n, r: n.getAttribute(sel).split(' ').map(Number) }));
  return {
    last: -1,
    draw: read('data-draw'),
    show: read('data-show'),
    move: read('data-move'),
    sweep: read('data-sweep'),
    sweepY: read('data-sweep-y'),
  };
}
function runTimeline(T, p, force) {
  if (!force && Math.abs(p - T.last) < 1e-4) return;
  T.last = p;
  for (const d of T.draw) {
    const k = win(p, d.r[0], d.r[1]);
    d.el.style.strokeDashoffset = (1 - k).toFixed(4);
    d.el.style.visibility = k > 0.002 ? 'visible' : 'hidden'; // a round cap on a zero dash still paints
  }
  for (const s of T.show) {
    let o = win(p, s.r[0], s.r[1]);
    if (s.r.length > 3) o *= 1 - win(p, s.r[2], s.r[3]);
    s.el.style.opacity = o.toFixed(3);
  }
  for (const m of T.move) {
    const k = easeInOut(win(p, m.r[0], m.r[1]));
    m.el.style.transform = `translate(${(m.r[2] * k).toFixed(2)}px, ${(m.r[3] * k).toFixed(2)}px)`;
  }
  for (const w of T.sweep) {
    const k = win(p, w.r[0], w.r[1]);
    w.el.setAttribute('width', k >= 1 ? 3000 : (w.r[2] * k).toFixed(2));
  }
  for (const w of T.sweepY) {
    const k = win(p, w.r[0], w.r[1]);
    w.el.setAttribute('height', k >= 1 ? 3000 : (w.r[2] * k).toFixed(2));
  }
}

/* --------------------------------------------------------------- hero */
const heroAct = actOf('start');
const hero = {
  stage: $('.hero'),
  orb: $('.hero .orb'),
  far: $('.ridge-far'),
  mid: $('.ridge-mid'),
  name: $('.hero-name-block'),
  near: $('.ridge-near-wrap'),
  lede: $('.hero-lede'),
};
const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
if (finePointer && !reduce) {
  addEventListener('pointermove', (e) => {
    ptr.tx = (e.clientX / innerWidth) * 2 - 1;
    ptr.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
}
function runHero() {
  const p = heroAct.p;
  hero.stage.classList.toggle('is-offstage', p >= 1 && hero.stage.getBoundingClientRect().bottom < 0);
  if (reduce) return;
  ptr.x += (ptr.tx - ptr.x) * 0.07;
  ptr.y += (ptr.ty - ptr.y) * 0.07;
  const vh = innerHeight;
  const place = (el, depth, dy) => {
    el.style.transform = `translate3d(${(ptr.x * depth).toFixed(2)}px, ${(ptr.y * depth * 0.5 + dy).toFixed(2)}px, 0)`;
  };
  place(hero.orb, 3, p * 90);
  place(hero.far, 5, -p * 30);
  place(hero.mid, 10, -p * 85);
  place(hero.name, 0, -p * 150);
  hero.name.style.opacity = (1 - win(p, 0.55, 0.95)).toFixed(3);
  place(hero.near, 18, -p * vh * 0.3);
  hero.lede.style.opacity = (1 - win(p, 0.85, 1.15)).toFixed(3);
}

/* ---------------------------------------------------------- statement */
const statementAct = actOf('statement-wrap');
let lastStatement = -1;
function runStatement(force) {
  const n = statementWords.length;
  const pr = reduce ? 1 : clamp01((statementAct.p - 0.16) / 0.38);
  if (!force && Math.abs(pr - lastStatement) < 1e-4) return;
  lastStatement = pr;
  const head = pr * (n + 2);
  for (let k = 0; k < n; k++) {
    const W = statementWords[k];
    const o = +(0.16 + 0.84 * clamp01(head - k)).toFixed(2);
    if (o !== W.o) { W.o = o; W.el.style.setProperty('--o', o); }
  }
}

/* ------------------------------------------------------------ projects
   One pinned room. Each project owns a share of the scroll; its text and
   drawing crossfade in and out, its drawing runs on its own local progress,
   and the window's colour and ridges blend from one project to the next. */
const workAct = actOf('work');
const stage = $('.work-stage');
const srBack = $('.sr-back');
const srFront = $('.sr-front');
const texts = $$('.wt');
const arts = $$('.art');
const W = projects.reduce((s, p) => s + p.w, 0);
let acc = 0;
const items = projects.map((p, i) => {
  const it = { ...p, i, start: acc, end: acc + p.w, text: texts[i], art: arts[i], tl: makeTimeline(arts[i]) };
  acc += p.w;
  return it;
});
const FADE = 0.09; // length of a fade, in segment units

// A ridge line per project, seeded so it is stable, different for each.
function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
const PTS = 12;
items.forEach((it) => {
  const r = seeded(it.i + 3);
  it.back = Array.from({ length: PTS }, (_, k) => 70 + r() * 120 - (k % 2 ? 0 : 30));
  it.front = Array.from({ length: PTS }, (_, k) => 170 + r() * 80 - (k % 2 ? 20 : 0));
});
const ridgePath = (ys) =>
  `M0 300 ${ys.map((y, k) => `L${((k * 1000) / (PTS - 1)).toFixed(1)} ${y.toFixed(1)}`).join(' ')} L1000 300 Z`;
const hueVar = (it) => (it.id === 'trackpegs' ? 'var(--peg-bg)' : `var(--h-${it.hue})`);
const amtOf = (it) => (it.id === 'trackpegs' ? 100 : currentTheme() === 'dark' ? 17 : 20);

const indexBtns = $$('.work-index button');
indexBtns.forEach((b) => b.addEventListener('click', () => goToProject(+b.dataset.go)));

function goToProject(i) {
  const el = workAct.el;
  const top = el.getBoundingClientRect().top + scrollY;
  const travel = el.offsetHeight - innerHeight;
  const u = i === 0 ? 0.02 : items[i].start + FADE * 1.5;
  scrollTo({ top: top + (u / W) * travel + 1, behavior: reduce ? 'auto' : 'smooth' });
}

let lastU = -1;
let lastCurrent = -1;
function runWork(force) {
  const u = clamp01(workAct.p) * W;
  if (!force && Math.abs(u - lastU) < 1e-4) return;
  lastU = u;

  let best = 0;
  let bestO = -1;
  for (const it of items) {
    // out, then in: the outgoing project is gone before the next arrives,
    // so two headlines never sit on top of each other
    const inO = it.i === 0 ? 1 : smooth((u - it.start) / FADE);
    const outO = it.i === items.length - 1 ? 1 : 1 - smooth((u - (it.end - FADE)) / FADE);
    const o = inO * outO;
    if (o > bestO) { bestO = o; best = it.i; }
    const shift = reduce ? 0 : (1 - inO) * 28 - (1 - outO) * 28;
    it.art.style.opacity = o.toFixed(3);
    it.art.style.transform = `translateY(${shift.toFixed(1)}px) scale(${(0.97 + 0.03 * o).toFixed(4)})`;
    it.art.style.visibility = o < 0.005 ? 'hidden' : 'visible';
    it.text.style.opacity = o.toFixed(3);
    it.text.style.transform = `translateY(${(shift * 0.6).toFixed(1)}px)`;
    it.text.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    if (o > 0.005 || force) {
      const t = reduce ? 1 : clamp01((u - it.start) / it.w);
      runTimeline(it.tl, t, force);
    }
  }

  // colour + ridges blend toward the next project across each boundary
  let a = items[0];
  let b = items[0];
  let m = 0;
  for (const it of items) {
    if (u < it.end - FADE) { a = b = it; m = 0; break; }
    if (u < it.end + FADE && it.i < items.length - 1) { a = it; b = items[it.i + 1]; m = smooth((u - (it.end - FADE)) / (2 * FADE)); break; }
    a = b = it;
  }
  stage.style.setProperty('--ha', hueVar(a));
  stage.style.setProperty('--hb', hueVar(b));
  stage.style.setProperty('--mix', `${(m * 100).toFixed(1)}%`);
  const amt = lerp(amtOf(a), amtOf(b), m);
  stage.style.setProperty('--amt', `${amt.toFixed(1)}%`);
  stage.classList.toggle('is-deep', amt > 60);
  srBack.setAttribute('d', ridgePath(a.back.map((y, k) => lerp(y, b.back[k], m))));
  srFront.setAttribute('d', ridgePath(a.front.map((y, k) => lerp(y, b.front[k], m))));

  if (best !== lastCurrent) {
    lastCurrent = best;
    activeProj = best;
    indexBtns.forEach((btn, i) => (i === best ? btn.setAttribute('aria-current', 'true') : btn.removeAttribute('aria-current')));
    renderDock(false);
  }
}

/* -------------------------------------------------------------- valley
   The ridges rise into place as you arrive at the bottom of the page. */
const valleyAct = actOf('tal');
const valley = { far: $('.v-far'), mid: $('.v-mid'), near: $('.v-near'), orb: $('.orb--valley') };
let lastValley = -1;
function runValley() {
  const k = reduce ? 1 : easeInOut(clamp01(valleyAct.p / 0.5));
  if (Math.abs(k - lastValley) < 1e-4) return;
  lastValley = k;
  const r = 1 - k;
  valley.far.style.transform = `translateY(${(r * 40).toFixed(1)}px)`;
  valley.mid.style.transform = `translateY(${(r * 100).toFixed(1)}px)`;
  valley.near.style.transform = `translateY(${(r * 170).toFixed(1)}px)`;
  valley.orb.style.transform = `translateY(${(r * 70).toFixed(1)}px)`;
}

/* ------------------------------------------------------------------ loop */
function runAll(force) {
  if (force) lastValley = -1;
  runStatement(force);
  runWork(force);
  runValley();
}

let lastY = -1;
function frame() {
  const y = scrollY;
  if (y !== lastY) { lastY = y; trackSections(); }
  // Every frame, not only on scroll: the engine may publish this frame's
  // progress after we read it, and each runner skips work when nothing moved.
  runAll(false);
  runHero();
  requestAnimationFrame(frame);
}

addEventListener('resize', () => requestAnimationFrame(() => { trackSections(); runAll(true); }));
document.fonts.ready.then(() => { api.layout(); runAll(true); });
runAll(true);
trackSections();
requestAnimationFrame(frame);
