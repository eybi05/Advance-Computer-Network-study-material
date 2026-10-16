/* SRWE Study Lab — Practice: quiz engine, practice exam, flashcards (spaced repetition), command drills. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE;
  const App = SRWE.App;
  const h = App.h;
  const Practice = SRWE.Practice = {};

  /* ================= question widgets ================= */
  function optionButton(text, multi, onClick) {
    return h('button', { class: 'opt' + (multi ? ' multi' : ''), type: 'button', onclick: onClick, 'aria-pressed': 'false' }, h('span', { class: 'mark', 'aria-hidden': 'true' }), h('span', null, text));
  }

  function makeChoice(q) {
    const multi = q.type === 'multi';
    const opts = q.type === 'tf'
      ? [{ t: 'True', ok: q.ans === true }, { t: 'False', ok: q.ans === false }]
      : App.shuffle(q.o.map((t, i) => ({ t, ok: multi ? i < q.n : i === 0 })));
    const sel = new Set();
    const btns = opts.map((o, i) => optionButton(o.t, multi, () => toggle(i)));
    function toggle(i) {
      if (locked) return;
      if (multi) { if (sel.has(i)) sel.delete(i); else sel.add(i); } else { sel.clear(); sel.add(i); }
      btns.forEach((b, j) => { b.classList.toggle('sel', sel.has(j)); b.setAttribute('aria-pressed', sel.has(j) ? 'true' : 'false'); });
      if (api.onChange) api.onChange();
    }
    let locked = false;
    const api = {
      el: h('div', null, multi ? h('p', { class: 'small muted' }, 'Choose ' + q.n + '.') : null, h('div', { class: 'opts', role: multi ? 'group' : 'radiogroup' }, ...btns)),
      ready: () => (multi ? sel.size === q.n : sel.size === 1),
      grade() {
        const ok = opts.every((o, i) => o.ok === sel.has(i));
        return { ok, given: [...sel].map((i) => opts[i].t).join('; ') || '(no answer)', correct: opts.filter((o) => o.ok).map((o) => o.t).join('; ') };
      },
      lock(showCorrect) {
        locked = true;
        btns.forEach((b, i) => { b.disabled = true; if (showCorrect) { if (opts[i].ok) b.classList.add('right'); else if (sel.has(i)) b.classList.add('wrong'); } });
      },
      key(n) { if (n >= 1 && n <= opts.length) toggle(n - 1); },
    };
    return api;
  }

  function makeOrder(q) {
    let items = App.shuffle(q.items.map((t, i) => ({ t, i })));
    if (items.every((x, k) => x.i === k)) items = items.slice(1).concat(items.slice(0, 1));
    const list = h('div', { class: 'order-list' });
    let locked = false;
    function draw() {
      list.innerHTML = '';
      items.forEach((x, k) => {
        list.appendChild(h('div', { class: 'order-item' }, h('span', { class: 'n' }, (k + 1) + '.'), h('span', { class: 'txt' }, x.t),
          h('button', { class: 'icon-btn', type: 'button', disabled: locked || k === 0, 'aria-label': 'Move up: ' + x.t, onclick: () => { [items[k - 1], items[k]] = [items[k], items[k - 1]]; draw(); } }, App.icon('up', 16)),
          h('button', { class: 'icon-btn', type: 'button', disabled: locked || k === items.length - 1, 'aria-label': 'Move down: ' + x.t, onclick: () => { [items[k + 1], items[k]] = [items[k], items[k + 1]]; draw(); } }, App.icon('down', 16))));
      });
    }
    draw();
    return {
      el: h('div', null, h('p', { class: 'small muted' }, 'Use the arrows to put the items in order.'), list),
      ready: () => true,
      grade: () => ({ ok: items.every((x, k) => x.i === k), given: items.map((x) => x.t).join(' → '), correct: q.items.join(' → ') }),
      lock(showCorrect) {
        locked = true; draw();
        if (showCorrect) [...list.children].forEach((row, k) => row.style.borderColor = items[k].i === k ? 'var(--ok)' : 'var(--bad)');
      },
    };
  }

  function makeMatch(q) {
    const rights = App.shuffle(q.pairs.map((p) => p[1]));
    const sels = q.pairs.map((p, i) => h('select', { class: 'input', id: 'm-' + q.id + '-' + i, 'aria-label': 'Match for ' + p[0] },
      h('option', { value: '' }, 'Choose…'), ...rights.map((r) => h('option', { value: r }, r))));
    const api = {
      el: h('div', null, ...q.pairs.map((p, i) => h('div', { class: 'match-row' }, h('strong', null, p[0]), sels[i]))),
      ready: () => sels.every((s) => s.value),
      grade: () => ({ ok: q.pairs.every((p, i) => sels[i].value === p[1]), given: q.pairs.map((p, i) => p[0] + ' = ' + (sels[i].value || '?')).join('; '), correct: q.pairs.map((p) => p[0] + ' = ' + p[1]).join('; ') }),
      lock(showCorrect) { sels.forEach((s, i) => { s.disabled = true; if (showCorrect) s.style.borderColor = s.value === q.pairs[i][1] ? 'var(--ok)' : 'var(--bad)'; }); },
    };
    sels.forEach((s) => s.addEventListener('change', () => api.onChange && api.onChange()));
    return api;
  }

  const CMD_WHY = { wrong: 'That is not the command this asks for.', value: 'Right command, but a value is wrong.', filter: 'Check the output filter after the |.' };
  function makeCli(q) {
    const input = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', id: 'cli-' + q.id, 'aria-label': 'IOS command' });
    const api = {
      el: h('div', null, h('p', { class: 'small muted' }, 'Type the command as you would on the device. Abbreviations are accepted.'),
        h('div', { class: 'cli-q' }, h('span', { class: 'p' }, q.prompt), input)),
      input,
      ready: () => input.value.trim().length > 0,
      grade() {
        const res = SRWE.Cmd.check(q, input.value);
        return { ok: res.ok, given: input.value, correct: q.answer, why: CMD_WHY[res.reason] };
      },
      lock() { input.disabled = true; },
    };
    input.addEventListener('input', () => api.onChange && api.onChange());
    return api;
  }

  function makeQuestion(q) {
    if (q.type === 'order') return makeOrder(q);
    if (q.type === 'match') return makeMatch(q);
    if (q.type === 'cli') return makeCli(q);
    return makeChoice(q);
  }

  function ring(p) {
    const r = 46, c = 2 * Math.PI * r;
    const color = p >= 0.8 ? 'var(--ok)' : p >= 0.6 ? 'var(--warn)' : 'var(--bad)';
    const svg = '<svg class="score-ring" viewBox="0 0 110 110" role="img" aria-label="' + Math.round(p * 100) + ' percent">' +
      '<circle cx="55" cy="55" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="10"/>' +
      '<circle cx="55" cy="55" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * p) + ' ' + c + '" transform="rotate(-90 55 55)"/>' +
      '<text x="55" y="62" text-anchor="middle" font-size="22" font-weight="600" fill="var(--text)">' + Math.round(p * 100) + '%</text></svg>';
    return h('div', { html: svg });
  }

  /* ================= quiz runner ================= */
  Practice.runQuiz = function (container, questions, opts) {
    opts = opts || {};
    const exam = !!opts.exam;
    const results = [];
    let i = 0, cur = null, checked = false, timer = null;
    const deadline = opts.timeLimit ? Date.now() + opts.timeLimit * 1000 : null;
    const wrap = h('div', { class: 'quiz' });
    container.appendChild(wrap);
    if (!questions.length) { wrap.appendChild(h('div', { class: 'empty' }, 'No questions available here yet.')); return; }

    function onKey(e) {
      if (!wrap.isConnected) { document.removeEventListener('keydown', onKey); return; }
      const tag = (e.target && e.target.tagName) || '';
      if (e.key === 'Enter' && (tag !== 'BUTTON' && tag !== 'SELECT' && tag !== 'A')) { e.preventDefault(); primary.click(); return; }
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (/^[1-9]$/.test(e.key) && cur && cur.key && !checked) cur.key(Number(e.key));
    }
    document.addEventListener('keydown', onKey);

    const primary = h('button', { class: 'btn primary', type: 'button' });
    function show() {
      wrap.innerHTML = '';
      checked = false;
      const q = questions[i];
      cur = makeQuestion(q);
      const t = App.topic(q.t);
      const head = h('div', { class: 'qhead' }, h('strong', { class: 'kv' }, (opts.title ? opts.title + ' · ' : '') + 'Question ' + (i + 1) + ' of ' + questions.length),
        App.bar(i / questions.length, 'accent'), deadline ? h('span', { class: 'pill kv', id: 'qtimer' }, '') : null);
      const fb = h('div', { 'aria-live': 'polite' });
      primary.textContent = exam ? (i === questions.length - 1 ? 'Finish exam' : 'Next') : 'Check';
      primary.disabled = !cur.ready();
      cur.onChange = () => { if (!checked) primary.disabled = !cur.ready(); };
      primary.onclick = () => {
        if (primary.disabled) return;
        if (exam || checked) {
          if (exam && !checked) { const g = cur.grade(); results.push(Object.assign({ q }, g)); }
          i++;
          if (i >= questions.length) finish(); else show();
          return;
        }
        const g = cur.grade();
        results.push(Object.assign({ q }, g));
        checked = true;
        cur.lock(true);
        fb.appendChild(h('div', { class: 'feedback ' + (g.ok ? 'ok' : 'bad') },
          h('strong', null, g.ok ? 'Correct.' : 'Not quite.'), ' ', g.why && !g.ok ? h('span', null, g.why + ' ') : null,
          !g.ok ? h('div', null, h('span', { class: 'muted' }, 'Answer: '), q.type === 'cli' ? h('code', null, g.correct) : g.correct) : null));
        fb.appendChild(h('div', { class: 'explain-box', html: q.ex }));
        primary.textContent = i === questions.length - 1 ? 'See results' : 'Next question';
        primary.disabled = false;
        primary.focus();
      };
      const skip = exam ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { results.push({ q, ok: false, given: '(skipped)', correct: correctText(q) }); i++; if (i >= questions.length) finish(); else show(); } }, 'Skip') : null;
      wrap.append(head, h('div', { class: 'qcard' },
        h('div', { class: 'row small muted', style: { marginBottom: '8px' } }, h('span', { class: 'pill' }, 'Topic ' + q.t), t ? h('span', null, t.title) : null),
        h('div', { class: 'qtext', html: q.q }), cur.el, fb, h('div', { class: 'btn-row', style: { marginTop: '16px' } }, primary, skip)));
      if (cur.input) cur.input.focus({ preventScroll: true });
      tick();
    }
    function correctText(q) {
      if (q.type === 'mc') return q.o[0];
      if (q.type === 'tf') return q.ans ? 'True' : 'False';
      if (q.type === 'multi') return q.o.slice(0, q.n).join('; ');
      if (q.type === 'order') return q.items.join(' → ');
      if (q.type === 'match') return q.pairs.map((p) => p[0] + ' = ' + p[1]).join('; ');
      return q.answer;
    }
    function tick() {
      if (!deadline) return;
      clearInterval(timer);
      const upd = () => {
        const el = document.getElementById('qtimer');
        const left = Math.max(0, deadline - Date.now());
        if (el) el.textContent = Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0') + ' left';
        if (left <= 0) { clearInterval(timer); for (let k = results.length; k < questions.length; k++) results.push({ q: questions[k], ok: false, given: '(time ran out)', correct: correctText(questions[k]) }); finish(true); }
        if (!wrap.isConnected) clearInterval(timer);
      };
      upd();
      timer = setInterval(upd, 1000);
    }
    function finish(timeout) {
      clearInterval(timer);
      document.removeEventListener('keydown', onKey);
      const st = App.state();
      for (const r of results) {
        const s = st.quiz.q[r.q.id] = st.quiz.q[r.q.id] || { right: 0, wrong: 0 };
        if (r.ok) { s.right++; s.lastWrong = false; } else { s.wrong++; s.lastWrong = true; }
        s.last = Date.now();
      }
      const score = results.filter((r) => r.ok).length;
      st.quiz.attempts.push({ scope: opts.scope || 'custom', score, total: questions.length, t: Date.now() });
      if (st.quiz.attempts.length > 400) st.quiz.attempts.shift();
      App.save();
      App.renderRail();
      if (opts.onDone) opts.onDone(score, questions.length, results);
      wrap.innerHTML = '';
      const p = score / questions.length;
      const pass = p >= 0.8;
      wrap.appendChild(h('div', { class: 'qcard stack' },
        h('div', { class: 'result-hero' }, ring(p), h('div', null,
          h('h2', { style: { margin: 0 } }, score + ' of ' + questions.length + ' correct'),
          h('p', { class: 'muted', style: { margin: '6px 0 0' } }, timeout ? 'Time ran out. ' : '', pass ? 'Passed. 80% or more is the target.' : 'The target is 80%. Review the explanations below, then try again.'))),
        perTopic(results),
        h('div', { class: 'btn-row' },
          results.some((r) => !r.ok) ? h('button', { class: 'btn primary', type: 'button', onclick: () => { container.innerHTML = ''; Practice.runQuiz(container, results.filter((r) => !r.ok).map((r) => r.q), Object.assign({}, opts, { scope: 'retry', exam: false, timeLimit: null, title: 'Retry' })); } }, App.icon('reset', 16), 'Retry the ones I missed') : null,
          opts.again ? h('button', { class: 'btn', type: 'button', onclick: opts.again }, 'New set of questions') : null,
          opts.back ? h('a', { class: 'btn ghost', href: '#' + opts.back }, 'Back') : null)));
      const wrong = results.filter((r) => !r.ok);
      if (wrong.length && !opts.compact) {
        wrap.appendChild(h('h3', { style: { marginTop: '22px' } }, 'Review what you missed'));
        wrap.appendChild(h('div', { class: 'stack' }, ...wrong.map((r) => h('div', { class: 'card' },
          h('div', { class: 'row small muted', style: { marginBottom: '6px' } }, h('span', { class: 'pill' }, 'Topic ' + r.q.t), h('a', { href: '#t-' + r.q.t + '-read' }, 'Review the lesson')),
          h('div', { style: { fontWeight: 500, marginBottom: '8px' }, html: r.q.q }),
          h('div', { class: 'small' }, h('span', { class: 'muted' }, 'Your answer: '), r.given),
          h('div', { class: 'small' }, h('span', { class: 'muted' }, 'Correct answer: '), h('strong', null, r.correct)),
          h('div', { class: 'explain-box small', html: r.q.ex })))));
      }
    }
    show();
  };

  function perTopic(results) {
    const by = {};
    for (const r of results) { const b = by[r.q.t] = by[r.q.t] || { ok: 0, n: 0 }; b.n++; if (r.ok) b.ok++; }
    const keys = Object.keys(by).sort((a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b));
    if (keys.length < 2) return null;
    return h('div', { class: 'scroll' }, h('table', { class: 't small' }, h('tr', null, h('th', null, 'Topic'), h('th', null, 'Score'), h('th', null, '')),
      ...keys.map((k) => { const t = App.topic(k); const p = by[k].ok / by[k].n; return h('tr', null, h('td', null, h('a', { href: '#t-' + k + '-read' }, k + ' ' + (t ? t.title : ''))), h('td', { class: 'kv' }, by[k].ok + '/' + by[k].n), h('td', { style: { width: '35%' } }, App.bar(p, p >= 0.8 ? '' : 'accent'))); })));
  }

  /* ================= quiz pages ================= */
  App.route('quiz', function (page, arg) {
    if (!arg) return quizHome(page);
    let qs, scope, title, back = 'quiz';
    const again = () => App.render();
    if (arg === 'mistakes') { qs = App.shuffle(App.mistakes()); scope = 'mistakes'; title = 'Mistakes'; }
    else if (arg === 'mixed') { qs = App.shuffle(SRWE.quiz).slice(0, 20); scope = 'mixed'; title = 'Mixed review'; }
    else if (/^m\d+$/.test(arg)) {
      const m = App.modules().find((x) => 'm' + x.num === arg);
      qs = App.shuffle(SRWE.quiz.filter((q) => m.topics.some((t) => t.id === q.t))).slice(0, 20);
      scope = 'module:' + arg; title = 'Module ' + m.num; back = 'm' + m.num;
    } else {
      const t = App.topic(arg);
      if (!t) { page.appendChild(h('div', { class: 'empty' }, 'Unknown quiz ' + arg)); return; }
      qs = App.shuffle(App.questionsFor(arg)); scope = 'topic:' + arg; title = 'Topic ' + arg; back = 't-' + arg + '-practice';
    }
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Quizzes', href: 'quiz' }, { label: title }], title: title + ' quiz',
      lead: qs.length + ' questions. Press 1–9 to pick an option and Enter to check.' });
    Practice.runQuiz(page, qs, { scope, title, again, back });
  });

  function quizHome(page) {
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Quizzes' }], title: 'Quizzes',
      lead: SRWE.quiz.length + ' questions across all ' + App.topics().length + ' topics: multiple choice, ordering, matching and typed IOS commands. Every answer comes with an explanation.' });
    const mistakes = App.mistakes();
    const best = (s) => { const b = App.bestQuiz(s); return b === null ? h('span', { class: 'pill' }, 'not taken') : h('span', { class: 'pill ' + (b >= 0.8 ? 'ok' : 'warn') }, 'best ' + Math.round(b * 100) + '%'); };
    page.appendChild(h('div', { class: 'grid three' },
      h('div', { class: 'card stack' }, h('h3', null, 'Mixed review'), h('p', { class: 'muted', style: { margin: 0 } }, '20 random questions from every module.'), h('div', null, h('a', { class: 'btn primary', href: '#quiz-mixed' }, 'Start'))),
      h('div', { class: 'card stack' }, h('h3', null, 'Your mistakes'), h('p', { class: 'muted', style: { margin: 0 } }, mistakes.length ? mistakes.length + ' questions you got wrong last time.' : 'Nothing to retry yet.'),
        h('div', null, h('a', { class: 'btn', href: '#quiz-mistakes', 'aria-disabled': mistakes.length ? null : 'true', style: mistakes.length ? null : { pointerEvents: 'none', opacity: 0.5 } }, 'Retry'))),
      h('div', { class: 'card stack' }, h('h3', null, 'Practice exams'), h('p', { class: 'muted', style: { margin: 0 } }, 'Timed exams for each course checkpoint (modules 1–4, 5–6, 7–9, 10–13, 14–16) and a final.'), h('div', null, h('a', { class: 'btn', href: '#exam' }, 'Open')))));
    page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Module quizzes')));
    page.appendChild(h('div', { class: 'grid four' }, ...App.modules().map((m) => h('div', { class: 'card stack' }, h('div', { class: 'eyebrow', style: { margin: 0 } }, 'Module ' + m.num), h('strong', null, m.title),
      best('module:m' + m.num), h('div', null, h('a', { class: 'btn small', href: '#quiz-m' + m.num }, '20 questions'))))));
    page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Topic quizzes')));
    page.appendChild(h('div', { class: 'list' }, ...App.topics().map((t) => h('a', { class: 'list-item', href: '#quiz-' + t.id },
      h('div', { class: 'grow' }, h('div', { class: 'ttl' }, t.id + ' ' + t.title), h('div', { class: 'small muted' }, App.questionsFor(t.id).length + ' questions')), best('topic:' + t.id)))));
  }

  /* Course exams: the checkpoint exams of SRWE v7 plus a final. */
  const EXAMS = [
    { key: 'm1-4', mods: [1, 2, 3, 4], title: 'Modules 1–4: Switching Concepts, VLANs and Inter-VLAN Routing', n: 40, min: 60 },
    { key: 'm5-6', mods: [5, 6], title: 'Modules 5–6: Redundant Networks', n: 30, min: 45 },
    { key: 'm7-9', mods: [7, 8, 9], title: 'Modules 7–9: Available and Reliable Networks', n: 36, min: 50 },
    { key: 'm10-13', mods: [10, 11, 12, 13], title: 'Modules 10–13: L2 Security and WLANs', n: 40, min: 60 },
    { key: 'm14-16', mods: [14, 15, 16], title: 'Modules 14–16: Routing Concepts and Configuration', n: 30, min: 45 },
    { key: 'final', mods: [], title: 'Final exam: all 16 modules', n: 64, min: 90 },
  ];
  App.EXAMS = EXAMS;
  const examScope = (key) => 'exam:' + key;
  App.route('exam', function (page, arg) {
    const go = /-go$/.test(arg || '');
    const key = (arg || '').replace(/-go$/, '');
    const ex = EXAMS.find((e) => e.key === key);
    if (!ex) {
      App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Practice exams' }], title: 'Practice exams',
        lead: 'One exam per checkpoint of the course, plus a final. Questions are balanced across the modules, the clock runs, and you get no feedback until you finish.' });
      page.appendChild(h('div', { class: 'list' }, ...EXAMS.map((e) => {
        const b = App.bestQuiz(examScope(e.key)) !== null ? App.bestQuiz(examScope(e.key)) : e.key === 'm1-4' ? App.bestQuiz('exam') : null;
        return h('a', { class: 'list-item', href: '#exam-' + e.key },
          h('div', { class: 'grow' }, h('div', { class: 'ttl' }, e.title), h('div', { class: 'small muted' }, e.n + ' questions · ' + e.min + ' minutes')),
          b === null ? h('span', { class: 'pill' }, 'not taken') : h('span', { class: 'pill ' + (b >= 0.8 ? 'ok' : 'warn') }, 'best ' + Math.round(b * 100) + '%'));
      })));
      return;
    }
    const mods = ex.mods.length ? ex.mods : App.modules().map((m) => m.num);
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Practice exams', href: 'exam' }, { label: ex.title }], title: 'Practice exam', eyebrow: ex.title,
      lead: ex.n + ' questions balanced across modules ' + mods[0] + '–' + mods[mods.length - 1] + ', ' + ex.min + ' minutes, no feedback until you finish.' });
    if (!go) {
      const hist = App.state().quiz.attempts.filter((a) => a.scope === examScope(ex.key) || (ex.key === 'm1-4' && a.scope === 'exam')).slice(-5).reverse();
      page.appendChild(h('div', { class: 'card stack', style: { maxWidth: '760px' } },
        h('ul', { style: { margin: 0 } }, h('li', null, 'About ' + Math.round(ex.n / mods.length) + ' questions from each module, mixed types including typed commands.'), h('li', null, 'You can skip a question; skipped questions count as wrong.'),
          h('li', null, 'At the end you get a score per topic and a review of every miss.')),
        hist.length ? h('div', null, h('strong', null, 'Recent attempts: '), hist.map((a) => Math.round(a.score / a.total * 100) + '%').join(', ')) : null,
        h('div', null, h('a', { class: 'btn primary', href: '#exam-' + ex.key + '-go' }, App.icon('clock', 16), 'Start the exam'))));
      return;
    }
    const per = Math.ceil(ex.n / mods.length);
    let qs = [];
    for (const n of mods) {
      const m = App.modules().find((x) => x.num === n);
      if (m) qs = qs.concat(App.shuffle(SRWE.quiz.filter((q) => m.topics.some((t) => t.id === q.t))).slice(0, per));
    }
    Practice.runQuiz(page, App.shuffle(qs).slice(0, ex.n), { scope: examScope(ex.key), exam: true, timeLimit: ex.min * 60, title: 'Exam', back: 'exam-' + ex.key });
  });

  /* ================= flashcards ================= */
  App.route('cards', function (page, arg) {
    if (!arg) return cardsHome(page);
    let filter, label;
    if (arg === 'all') { filter = null; label = 'All topics'; }
    else if (/^m\d+$/.test(arg)) { const m = App.modules().find((x) => 'm' + x.num === arg); filter = (c) => m.topics.some((t) => t.id === c.t); label = 'Module ' + m.num + ': ' + m.title; }
    else { const t = App.topic(arg); if (!t) { page.appendChild(h('div', { class: 'empty' }, 'Unknown deck')); return; } filter = (c) => c.t === arg; label = 'Topic ' + t.id + ': ' + t.title; }
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Flashcards', href: 'cards' }, { label: label }], title: 'Flashcards', lead: label });
    cardSession(page, filter, false);
  });

  function cardsHome(page) {
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Flashcards' }], title: 'Flashcards',
      lead: SRWE.cards.length + ' cards scheduled with spaced repetition: cards you know come back less often, cards you miss come back soon. A few minutes a day is enough.' });
    const row = (href, title, filter) => {
      const due = App.dueCards(filter).length, fresh = App.newCount(filter);
      return h('a', { class: 'list-item', href: '#' + href }, h('div', { class: 'grow' }, h('div', { class: 'ttl' }, title)),
        due - fresh > 0 ? h('span', { class: 'pill accent' }, (due - fresh) + ' due') : null, fresh ? h('span', { class: 'pill' }, fresh + ' new') : h('span', { class: 'pill ok' }, 'all started'));
    };
    page.appendChild(h('div', { class: 'list' }, row('cards-all', 'Everything due', null),
      ...App.modules().map((m) => row('cards-m' + m.num, 'Module ' + m.num + ': ' + m.title, (c) => m.topics.some((t) => t.id === c.t)))));
    page.appendChild(h('p', { class: 'muted small', style: { marginTop: '14px' } }, 'Shortcuts: Space shows the answer, then 1 Again · 2 Hard · 3 Good · 4 Easy.'));
  }

  function cardSession(page, filter, ahead) {
    const now = Date.now();
    const scope = SRWE.cards.filter((c) => !filter || filter(c));
    let queue;
    if (ahead) queue = App.shuffle(scope);
    else {
      const reviews = scope.filter((c) => App.cardState(c.id) && App.cardState(c.id).due <= now).sort((a, b) => App.cardState(a.id).due - App.cardState(b.id).due);
      const fresh = scope.filter((c) => !App.cardState(c.id)).slice(0, 20);
      queue = reviews.concat(fresh);
    }
    const box = h('div', { class: 'flash' });
    page.appendChild(box);
    let done = 0, again = 0;
    if (!queue.length) {
      const next = scope.map((c) => App.cardState(c.id)).filter(Boolean).map((s) => s.due).sort((a, b) => a - b)[0];
      box.appendChild(h('div', { class: 'empty stack' }, h('strong', null, 'Nothing is due in this deck.'),
        next ? h('div', null, 'Next card is due ' + new Date(next).toLocaleString() + '.') : null,
        h('div', null, h('button', { class: 'btn', type: 'button', onclick: () => { box.remove(); cardSession(page, filter, true); } }, 'Study ahead anyway'))));
      return;
    }
    let revealed = false;
    function onKey(e) {
      if (!box.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === ' ' && !revealed) { e.preventDefault(); reveal(); }
      else if (revealed && /^[1-4]$/.test(e.key)) rate(Number(e.key) - 1);
    }
    document.addEventListener('keydown', onKey);
    let cardEl, c;
    function draw() {
      box.innerHTML = '';
      if (!queue.length) {
        document.removeEventListener('keydown', onKey);
        App.renderRail();
        box.appendChild(h('div', { class: 'fcard' }, h('div', { class: 'front' }, 'Session complete'),
          h('p', { class: 'muted', style: { margin: 0 } }, done + ' reviews' + (again ? ', ' + again + ' cards repeated' : '') + '. Come back tomorrow for the next ones.'),
          h('div', { class: 'btn-row' }, h('a', { class: 'btn primary', href: '#cards' }, 'All decks'), h('a', { class: 'btn', href: '#quiz' }, 'Take a quiz'))));
        return;
      }
      c = queue[0];
      revealed = false;
      const t = App.topic(c.t);
      cardEl = h('div', { class: 'fcard' },
        h('div', { class: 'row small muted' }, h('span', { class: 'pill' }, 'Topic ' + c.t), h('span', null, t.title), h('span', { class: 'spacer' }), h('span', { class: 'kv' }, queue.length + ' left')),
        h('div', { class: 'front' }, c.f),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn primary', type: 'button', onclick: reveal }, 'Show answer ', h('kbd', null, 'Space'))));
      box.appendChild(cardEl);
    }
    function reveal() {
      if (revealed) return;
      revealed = true;
      cardEl.lastChild.remove();
      const labels = ['Again', 'Hard', 'Good', 'Easy'];
      cardEl.append(h('div', { class: 'back' }, c.b), h('div', { class: 'rate' }, ...labels.map((l, g) => h('button', { class: 'btn' + (g === 2 ? ' primary' : ''), type: 'button', onclick: () => rate(g) },
        h('span', null, (g + 1) + ' · ' + l), h('small', null, App.intervalLabel(c.id, g))))));
    }
    function rate(g) {
      App.rateCard(c.id, g);
      queue.shift();
      done++;
      if (g === 0) { again++; queue.splice(Math.min(queue.length, 3), 0, c); }
      draw();
    }
    draw();
  }

  /* ================= command drills ================= */
  App.route('drills', function (page) {
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Command drills' }], title: 'Command drills',
      lead: 'Short guided sequences, like the Syntax Checker activities in the course. Type each command at the prompt shown; abbreviations such as "conf t" and "sh ip int br" are accepted. Then do it for real in a Packet Tracer lab.' });
    for (const m of App.modules()) {
      const ds = SRWE.drills.filter((d) => m.topics.some((t) => t.id === d.t));
      if (!ds.length) continue;
      page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Module ' + m.num + ': ' + m.title)));
      page.appendChild(h('div', { class: 'list' }, ...ds.map(App.drillListItem)));
    }
  });

  App.route('drill', function (page, id) {
    const d = SRWE.drills.find((x) => x.id === id);
    if (!d) { page.appendChild(h('div', { class: 'empty' }, 'Unknown drill')); return; }
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Command drills', href: 'drills' }, { label: d.title }], eyebrow: 'Drill · topic ' + d.t, title: d.title, lead: d.intro });
    let step = 0;
    const stepEls = [];
    const list = h('ol', { class: 'tasks', style: { listStyle: 'none', padding: 0, margin: 0 } }, ...d.steps.map((s, i) => {
      const li = h('li', { class: 'task' }, App.led(''), h('div', null, h('div', { class: 'txt' }, (i + 1) + '. ' + s.task)));
      stepEls.push(li);
      return li;
    }));
    const showBtn = h('button', { class: 'btn small', type: 'button' }, App.icon('eye', 14), 'Show the command');
    const restart = h('button', { class: 'btn small ghost', type: 'button' }, App.icon('reset', 14), 'Restart');
    const doneBox = h('div', { class: 'done-banner', hidden: true }, App.led('on big'), h('div', null, h('strong', null, 'Drill complete. '), 'Every step was accepted.'), h('span', { class: 'spacer' }), h('a', { class: 'btn small', href: '#drills' }, 'More drills'));

    /* a small terminal: prompt + input, history of accepted lines */
    const log = h('div', { class: 'term-out', role: 'log', 'aria-label': 'Drill session', 'aria-live': 'polite' });
    const promptEl = h('span', { class: 'p' });
    const input = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', id: 'drill-in', 'aria-label': 'Command' });
    const term = h('div', { class: 'term drill-term' }, log, h('div', { class: 'term-in', style: { padding: '0 12px 10px' } }, promptEl, input));
    term.addEventListener('click', () => input.focus());
    const hist = [];
    let hi = 0;
    const line = (cls, text) => { log.appendChild(h('div', { class: 'ln ' + (cls || '') }, text)); log.scrollTop = log.scrollHeight; };
    const echo = (prompt, cmd) => { log.appendChild(h('div', { class: 'ln echo' }, h('span', { class: 'p' }, prompt), h('span', { class: 'c' }, cmd))); log.scrollTop = log.scrollHeight; };
    const note = (cls, text) => { log.appendChild(h('div', { class: 'note-' + cls }, text)); log.scrollTop = log.scrollHeight; };
    function paint() {
      stepEls.forEach((li, i) => { li.style.background = i === step ? 'var(--accent-soft)' : ''; if (i === step) li.firstChild.className = 'led amber'; });
      promptEl.textContent = step < d.steps.length ? d.steps[step].prompt : d.steps[d.steps.length - 1].prompt.replace(/\(.*\)/, '');
    }
    function submit() {
      const cmd = input.value;
      input.value = '';
      if (!cmd.trim()) { echo(promptEl.textContent, ''); return; }
      hist.push(cmd); hi = hist.length;
      echo(promptEl.textContent, cmd);
      if (step >= d.steps.length) { note('info', 'The drill is finished. Press Restart to go again.'); return; }
      const s = d.steps[step];
      const r = SRWE.Cmd.check(s, cmd);
      if (r.ok) {
        for (const l of s.out || []) line('', l);
        stepEls[step].classList.add('done');
        stepEls[step].firstChild.className = 'led on';
        step++;
        paint();
        note('ok', step >= d.steps.length ? 'Correct. That was the last step.' : 'Correct. Next: ' + d.steps[step].task);
        if (step >= d.steps.length) finish();
      } else {
        note('bad', { wrong: 'That is not the command this step asks for. Try again.', value: 'Right command, wrong value. Try again.', filter: 'Check the output filter after the |. Try again.' }[r.reason]);
      }
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = hist[hi]; } e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (hi < hist.length) { hi++; input.value = hist[hi] || ''; } e.preventDefault(); }
    });
    function finish() {
      const st = App.state();
      st.drills[d.id] = { done: true, t: Date.now() };
      App.save();
      App.renderRail();
      doneBox.hidden = false;
      showBtn.disabled = true;
    }
    showBtn.addEventListener('click', () => { if (step < d.steps.length) { note('info', 'Command for step ' + (step + 1) + ': ' + d.steps[step].answer); input.focus(); } });
    restart.addEventListener('click', () => App.render());
    line('dim', 'Syntax practice for a ' + ({ '2960': 'Catalyst 2960 switch', '4321': 'ISR 4321 router', '3650': 'Catalyst 3650 Layer 3 switch' }[d.dev] || 'Cisco device') + '. Type the command for each step.');
    paint();
    page.appendChild(h('div', { class: 'ptlab' },
      h('div', { class: 'ptlab-main' }, h('div', { class: 'card' }, h('h3', null, 'Steps'), list), doneBox),
      h('div', { class: 'ptlab-side stack' }, term, h('div', { class: 'btn-row' }, showBtn, restart, h('span', { class: 'small muted' }, 'Up and Down recall what you typed.')))));
    input.focus();
  });
})(typeof window !== 'undefined' ? window : globalThis);
