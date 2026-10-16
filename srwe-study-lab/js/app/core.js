/* SRWE Study Lab — app core: storage, DOM helpers, icons, router, progress model. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const App = SRWE.App = {};

  /* ---------------- storage (never throws) ---------------- */
  const KEY = 'srwe-study-lab.v1';
  const blank = () => ({ v: 1, read: {}, understood: {}, explain: {}, quiz: { attempts: [], q: {} }, cards: {}, drills: {}, labs: {}, settings: { theme: 'system' }, days: [] });
  let state = blank();
  let storageOk = true;
  try {
    const raw = root.localStorage.getItem(KEY);
    if (raw) state = migrate(Object.assign(blank(), JSON.parse(raw)));
  } catch (e) { storageOk = false; }
  /* Labs used to run on a built-in simulator; drop its saved networks and the sandbox. */
  function migrate(s) {
    delete s.sandbox;
    for (const id of Object.keys(s.labs || {})) if (s.labs[id] && (s.labs[id].net || s.labs[id].transcripts)) delete s.labs[id];
    return s;
  }
  let saveTimer = null;
  App.state = () => state;
  App.storageOk = () => storageOk;
  App.save = function (now) {
    clearTimeout(saveTimer);
    const write = () => { try { root.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { storageOk = false; } };
    if (now) write(); else saveTimer = setTimeout(write, 250);
  };
  App.resetAll = function () { state = blank(); App.save(true); };
  App.exportJson = () => JSON.stringify(state);
  App.importJson = function (txt) { const o = JSON.parse(txt); if (!o || o.v !== 1) throw new Error('Not a SRWE Study Lab backup'); state = migrate(Object.assign(blank(), o)); App.save(true); };
  App.touchDay = function () {
    const d = new Date().toISOString().slice(0, 10);
    if (state.days[state.days.length - 1] !== d) { state.days.push(d); if (state.days.length > 400) state.days.shift(); App.save(); }
  };
  App.streak = function () {
    let n = 0;
    const set = new Set(state.days);
    const day = new Date();
    for (;;) {
      const s = day.toISOString().slice(0, 10);
      if (!set.has(s)) { if (n === 0) { day.setDate(day.getDate() - 1); if (set.has(day.toISOString().slice(0, 10))) continue; } break; }
      n++;
      day.setDate(day.getDate() - 1);
    }
    return n;
  };

  /* ---------------- DOM helpers ---------------- */
  App.h = function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        const v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };
  App.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.shuffle = function (a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  App.toast = function (msg, ms) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = App.h('div', { class: 'toast', role: 'status' }, msg);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 2600);
  };
  App.led = (cls, title) => App.h('span', { class: 'led ' + (cls || ''), title: title || null, 'aria-hidden': title ? null : 'true' });

  /* ---------------- icons (24px stroke icons) ---------------- */
  const P = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 19.5A2.5 2.5 0 0 1 6.5 17H20',
    bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    terminal: 'M4 17l6-6-6-6M12 19h8',
    layers: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    cards: 'M3 7h13a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM7 3h14a1 1 0 0 1 1 1v12',
    check: 'M20 6 9 17l-5-5',
    list: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    keyboard: 'M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
    flask: 'M9 2h6M10 2v6L4.5 18.5A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.8-2.5L14 8V2M7 15h10',
    box: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
    ref: 'M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5zM8 7h8M8 11h6',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    menu: 'M3 6h18M3 12h18M3 18h18',
    x: 'M18 6 6 18M6 6l12 12',
    reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    play: 'M6 4l14 8-14 8z',
    arrowR: 'M5 12h14M13 6l6 6-6 6',
    arrowL: 'M19 12H5M11 18l-6-6 6-6',
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    shuffle: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    copy: 'M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  };
  App.icon = function (name, size) {
    const s = size || 18;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', s); svg.setAttribute('height', s); svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', P[name] || P.box);
    svg.appendChild(p);
    return svg;
  };

  /* ---------------- content index ---------------- */
  App.modules = () => {
    const ms = SRWE.content.modules.slice().sort((a, b) => a.num - b.num);
    for (const m of ms) for (const t of m.topics) t.module = m;
    return ms;
  };
  App.topics = () => [].concat(...App.modules().map((m) => m.topics));
  App.topic = (id) => App.topics().find((t) => t.id === id) || null;
  App.moduleOf = (tid) => App.modules().find((m) => m.topics.some((t) => t.id === tid));
  /* Packet Tracer labs for a topic: the labs that list the topic, else every lab of its module. */
  App.labsFor = (t) => {
    const list = SRWE.labs.filter((l) => (l.topics || []).includes(t.id));
    return list.length ? list : SRWE.labs.filter((l) => l.module === t.module.num);
  };
  App.drillsFor = (t) => SRWE.drills.filter((d) => d.t === t.id);
  App.questionsFor = (tid) => SRWE.quiz.filter((q) => q.t === tid);
  App.cardsFor = (tid) => SRWE.cards.filter((c) => c.t === tid);

  /* ---------------- progress model ----------------
   * Each topic has four stages, shown as four LEDs:
   * read (marked read), understand (CYU passed), practice (topic quiz >= 80%), apply (a related Packet Tracer lab or drill done). */
  App.bestQuiz = function (scope) {
    let best = null;
    for (const a of state.quiz.attempts) if (a.scope === scope) { const p = a.score / a.total; if (best === null || p > best) best = p; }
    return best;
  };
  App.labDone = (id) => !!(state.labs[id] && state.labs[id].completed);
  App.drillDone = (id) => !!(state.drills[id] && state.drills[id].done);
  App.stages = function (t) {
    const quiz = App.bestQuiz('topic:' + t.id);
    const applyItems = App.labsFor(t).map((l) => App.labDone(l.id)).concat(App.drillsFor(t).map((d) => App.drillDone(d.id)));
    const labState = App.labsFor(t).some((l) => state.labs[l.id] && !state.labs[l.id].completed && (state.labs[l.id].doneCount || 0) > 0);
    return {
      read: state.read[t.id] ? 'on' : '',
      understand: state.understood[t.id] ? 'on' : (state.explain[t.id] && Object.keys(state.explain[t.id]).length ? 'half' : ''),
      practice: quiz !== null && quiz >= 0.8 ? 'on' : quiz !== null ? 'half' : '',
      apply: applyItems.some(Boolean) ? 'on' : labState ? 'half' : '',
    };
  };
  App.topicPct = function (t) {
    const s = App.stages(t);
    return ['read', 'understand', 'practice', 'apply'].reduce((n, k) => n + (s[k] === 'on' ? 1 : s[k] === 'half' ? 0.5 : 0), 0) / 4;
  };
  App.modulePct = (m) => m.topics.reduce((n, t) => n + App.topicPct(t), 0) / m.topics.length;
  App.overallPct = () => { const ts = App.topics(); return ts.reduce((n, t) => n + App.topicPct(t), 0) / ts.length; };
  App.ledRow = function (t) {
    const s = App.stages(t);
    const names = { read: 'Read', understand: 'Understand', practice: 'Practice', apply: 'Apply' };
    return App.h('span', { class: 'leds', title: Object.keys(names).map((k) => names[k] + ': ' + (s[k] === 'on' ? 'done' : s[k] === 'half' ? 'in progress' : 'not started')).join(' · ') },
      ...Object.keys(names).map((k) => App.led(s[k])));
  };
  App.nextStep = function () {
    for (const t of App.topics()) {
      const s = App.stages(t);
      for (const k of ['read', 'understand', 'practice', 'apply']) if (s[k] !== 'on') return { topic: t, stage: k };
    }
    return null;
  };
  App.qStat = (id) => state.quiz.q[id] || { right: 0, wrong: 0 };
  App.weakTopics = function () {
    const out = [];
    for (const t of App.topics()) {
      let r = 0, w = 0;
      for (const q of App.questionsFor(t.id)) { const s = state.quiz.q[q.id]; if (s) { r += s.right; w += s.wrong; } }
      if (r + w >= 3) out.push({ t, acc: r / (r + w), n: r + w });
    }
    return out.sort((a, b) => a.acc - b.acc).filter((x) => x.acc < 0.8).slice(0, 4);
  };
  App.mistakes = () => SRWE.quiz.filter((q) => state.quiz.q[q.id] && state.quiz.q[q.id].lastWrong);

  /* ---------------- spaced repetition (SM-2 style, day granularity) ---------------- */
  const DAY = 86400000;
  App.cardState = (id) => state.cards[id] || null;
  App.dueCards = function (filter) {
    const now = Date.now();
    return SRWE.cards.filter((c) => (!filter || filter(c)) && (!state.cards[c.id] || state.cards[c.id].due <= now));
  };
  App.newCount = (filter) => SRWE.cards.filter((c) => (!filter || filter(c)) && !state.cards[c.id]).length;
  App.rateCard = function (id, grade) { // grade: 0 again, 1 hard, 2 good, 3 easy
    const c = state.cards[id] || { reps: 0, ease: 2.5, ivl: 0, due: 0, lapses: 0 };
    if (grade === 0) { c.reps = 0; c.lapses++; c.ivl = 0; c.ease = Math.max(1.3, c.ease - 0.2); c.due = Date.now() + 60000; } else {
      c.reps++;
      if (c.reps === 1) c.ivl = grade === 3 ? 3 : 1;
      else if (c.reps === 2) c.ivl = grade === 1 ? 2 : grade === 3 ? 6 : 4;
      else c.ivl = Math.round(c.ivl * (grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease));
      c.ease = Math.max(1.3, c.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
      c.due = Date.now() + c.ivl * DAY;
    }
    c.last = Date.now();
    state.cards[id] = c;
    App.save();
    return c;
  };
  App.intervalLabel = function (id, grade) {
    const c = state.cards[id] || { reps: 0, ease: 2.5, ivl: 0 };
    if (grade === 0) return '1 min';
    const reps = c.reps + 1;
    let ivl;
    if (reps === 1) ivl = grade === 3 ? 3 : 1;
    else if (reps === 2) ivl = grade === 1 ? 2 : grade === 3 ? 6 : 4;
    else ivl = Math.round(c.ivl * (grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease));
    return ivl + (ivl === 1 ? ' day' : ' days');
  };

  /* ---------------- router (hash tokens: letters, digits, . _ ~ -) ---------------- */
  const routes = [];
  let leaveHooks = [];
  App.route = (name, fn) => routes.push({ name, fn });
  /* Run fn when the user leaves the current page (navigation or closing the window). */
  App.onLeave = (fn) => leaveHooks.push(fn);
  App.leave = function () { const hs = leaveHooks; leaveHooks = []; for (const f of hs) { try { f(); } catch (e) { /* ignore */ } } };
  App.go = function (hash) { if (location.hash === '#' + hash) App.render(); else location.hash = hash; };
  App.current = () => (location.hash || '#home').slice(1);
  App.render = function () {
    const hash = App.current();
    const dash = hash.indexOf('-');
    const name = dash < 0 ? hash : hash.slice(0, dash);
    const arg = dash < 0 ? '' : hash.slice(dash + 1);
    const r = routes.find((x) => x.name === name) || routes.find((x) => x.name === 'home');
    App.leave();
    if (App.beforeRender) App.beforeRender();
    const main = document.getElementById('page');
    main.innerHTML = '';
    main.className = 'page';
    try { r.fn(main, arg); } catch (e) {
      console.error(e);
      main.appendChild(App.h('div', { class: 'empty' }, 'Something went wrong while showing this page: ' + e.message));
      if (root.__srweErrors) root.__srweErrors.push(String(e && e.stack || e));
    }
    if (App.afterRender) App.afterRender(name, arg);
    App.touchDay();
  };
  App.pageHead = function (parent, opts) {
    const h = App.h;
    if (opts.crumbs) parent.appendChild(h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, ...opts.crumbs.map((c, i) => [i ? h('span', { 'aria-hidden': 'true' }, '/') : null, c.href ? h('a', { href: '#' + c.href }, c.label) : h('span', null, c.label)])));
    parent.appendChild(h('header', { class: 'page-head' },
      h('div', null, opts.eyebrow ? h('div', { class: 'eyebrow' }, opts.eyebrow) : null, h('h1', null, opts.title), opts.lead ? h('p', { class: 'lead' }, opts.lead) : null),
      opts.right || null));
  };
})(typeof window !== 'undefined' ? window : globalThis);
