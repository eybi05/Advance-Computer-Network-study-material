/* SRWE Study Lab — navigation, dashboard, modules, topics (Read / Understand / Practice / Apply). */
(function (root) {
  'use strict';
  const SRWE = root.SRWE;
  const App = SRWE.App;
  const h = App.h;
  const STAGES = [['read', 'Read', 'book'], ['understand', 'Understand', 'bulb'], ['practice', 'Practice', 'target'], ['apply', 'Apply', 'terminal']];

  /* ---------------- navigation rail ---------------- */
  App.renderRail = function () {
    const rail = document.getElementById('rail');
    const cur = App.current();
    const activeTopic = /^t-/.test(cur) ? cur.split('-')[1] : null;
    const activeMod = /^m\d+$/.test(cur) ? Number(cur.slice(1)) : activeTopic ? App.moduleOf(activeTopic).num : null;
    const link = (href, icon, label, extra) => h('a', { class: 'nav-link' + (cur === href || (extra && extra.active) ? ' active' : ''), href: '#' + href, 'aria-current': cur === href ? 'page' : null },
      App.icon(icon), h('span', null, label), extra && extra.count !== undefined ? h('span', { class: 'count' + (extra.hot ? ' hot' : '') }, extra.count) : null);
    const due = App.dueCards().length - App.newCount();
    rail.innerHTML = '';
    rail.appendChild(h('a', { class: 'brand', href: '#home' },
      h('span', { class: 'brand-mark', html: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect x="2" y="6" width="18" height="10" rx="2" fill="none" stroke="#9eb0c4" stroke-width="1.6"/><circle cx="6.5" cy="11" r="1.7" fill="#3fb950"/><circle cx="11" cy="11" r="1.7" fill="#3fb950"/><circle cx="15.5" cy="11" r="1.7" fill="#f5a524"/></svg>' }),
      h('span', null, h('div', { class: 'brand-name' }, 'SRWE Study Lab'), h('div', { class: 'brand-sub' }, 'Modules 1–' + App.modules().length))));
    const learn = h('nav', { class: 'nav-group', 'aria-label': 'Learn' }, h('div', { class: 'nav-label' }, 'Learn'), link('home', 'home', 'Dashboard'));
    const BLOCKS = { 1: 'Modules 1–4', 5: 'Modules 5–6', 7: 'Modules 7–9', 10: 'Modules 10–13', 14: 'Modules 14–16' };
    for (const m of App.modules()) {
      if (BLOCKS[m.num]) learn.appendChild(h('div', { class: 'nav-block' }, BLOCKS[m.num]));
      const open = activeMod === m.num;
      const box = h('div', { class: 'nav-mod' }, link('m' + m.num, 'layers', m.num + '. ' + m.title, { active: open && !activeTopic }));
      if (open) {
        box.appendChild(h('div', { class: 'nav-topics' }, ...m.topics.map((t) => h('a', { class: 'nav-topic' + (activeTopic === t.id ? ' active' : ''), href: '#t-' + t.id + '-read', title: t.title },
          h('span', { class: 'num' }, t.id), h('span', { class: 'ttl' }, t.title), App.ledRow(t)))));
      }
      learn.appendChild(box);
    }
    rail.appendChild(learn);
    rail.appendChild(h('nav', { class: 'nav-group', 'aria-label': 'Practice' }, h('div', { class: 'nav-label' }, 'Practice'),
      link('cards', 'cards', 'Flashcards', { count: due > 0 ? due : App.newCount(), hot: due > 0 }),
      link('quiz', 'list', 'Quizzes'), link('exam', 'clock', 'Practice exams'), link('drills', 'keyboard', 'Command drills')));
    rail.appendChild(h('nav', { class: 'nav-group', 'aria-label': 'Apply' }, h('div', { class: 'nav-label' }, 'Apply'),
      link('labs', 'flask', 'Packet Tracer labs', { count: SRWE.labs.filter((l) => App.labDone(l.id)).length + '/' + SRWE.labs.length }),
      (SRWE.teacherLabs || []).length ? link('tlabs', 'school', 'Instructor\'s labs', { count: SRWE.teacherLabs.filter((tl) => App.teacherDone(tl.id)).length + '/' + SRWE.teacherLabs.length }) : null));
    rail.appendChild(h('nav', { class: 'nav-group', 'aria-label': 'Reference' }, h('div', { class: 'nav-label' }, 'Reference'),
      link('reference', 'ref', 'Command reference'), link('glossary', 'search', 'Glossary'), link('settings', 'gear', 'Settings & progress')));
    const theme = App.state().settings.theme;
    rail.appendChild(h('div', { class: 'rail-foot' },
      h('button', { class: 'btn small ghost', type: 'button', onclick: App.cycleTheme, 'aria-label': 'Change theme' }, App.icon(theme === 'light' ? 'sun' : 'moon', 16), 'Theme: ' + theme)));
  };

  App.applyTheme = function () {
    const t = App.state().settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  };
  App.cycleTheme = function () {
    const s = App.state().settings;
    s.theme = s.theme === 'system' ? 'dark' : s.theme === 'dark' ? 'light' : 'system';
    App.applyTheme();
    App.save();
    App.renderRail();
    App.toast('Theme: ' + s.theme + (s.theme === 'system' ? ' (follows your operating system)' : ''));
  };

  /* ---------------- shared bits ---------------- */
  App.decorateCli = function (container) {
    for (const pre of container.querySelectorAll('pre.cli')) {
      const lines = pre.textContent.split('\n');
      pre.innerHTML = lines.map((l) => {
        let m = /^([A-Za-z][\w-]*(?:\([\w-]+\))?[#>])(\s?)(.*)$/.exec(l);
        if (!m) m = /^(C:\\[^>]*>)(\s?)(.*)$/.exec(l);
        if (m && (m[3] || /[#>]$/.test(m[1]))) return '<span class="p">' + App.esc(m[1]) + '</span>' + m[2] + '<span class="c">' + App.esc(m[3]) + '</span>';
        return '<span class="o">' + App.esc(l) + '</span>';
      }).join('\n');
    }
  };
  function pctText(p) { return Math.round(p * 100) + '%'; }
  function bar(p, cls) { return h('div', { class: 'bar ' + (cls || ''), role: 'progressbar', 'aria-valuenow': Math.round(p * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('span', { style: { width: pctText(p) } })); }
  App.bar = bar;

  /* ---------------- dashboard ---------------- */
  App.route('home', function (page) {
    const next = App.nextStep();
    const due = App.dueCards().length;
    const weak = App.weakTopics();
    const mistakes = App.mistakes();
    const teacher = SRWE.teacherLabs || [];
    App.pageHead(page, {
      eyebrow: 'CCNA · Switching, Routing and Wireless Essentials v7',
      title: 'Your study plan',
      lead: 'Work through each topic in four stages: read the lesson, understand the ideas, practise until it sticks, then apply it in a lab. The four lights next to every topic show your progress.',
    });
    const stageName = { read: 'Read', understand: 'Understand', practice: 'Practice', apply: 'Apply' };
    const nextCard = next
      ? h('div', { class: 'next-card' }, h('div', { class: 'eyebrow' }, 'Next step'),
        h('div', { class: 'what' }, stageName[next.stage] + ': ' + next.topic.id + ' ' + next.topic.title),
        h('p', { class: 'muted', style: { margin: 0 } }, {
          read: 'Read the lesson. It covers every slide of this topic, with corrections where the official deck has mistakes.',
          understand: 'Explore the interactive visuals, avoid the common traps, and pass the quick check.',
          practice: 'Score 80% or more on the topic quiz. Typed IOS commands accept the same abbreviations as a real switch.',
          apply: 'Build the lab in your Packet Tracer, then paste your show output here. Every task is checked from it.',
        }[next.stage]),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn primary', href: '#t-' + next.topic.id + '-' + next.stage }, App.icon('play', 16), 'Continue'),
          h('a', { class: 'btn', href: '#m' + next.topic.module.num }, 'Module ' + next.topic.module.num + ' overview')))
      : h('div', { class: 'next-card' }, h('div', { class: 'eyebrow' }, 'All stages complete'), h('div', { class: 'what' }, 'Every topic is green. Keep it that way.'),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn primary', href: '#exam-final' }, 'Take the final exam'), h('a', { class: 'btn', href: '#labs' }, 'Redo a lab')));
    const stats = h('div', { class: 'stack' },
      h('div', { class: 'stat-row' },
        h('div', { class: 'stat' }, h('div', { class: 'n' }, pctText(App.overallPct())), h('div', { class: 'l' }, 'overall progress')),
        h('a', { class: 'stat', href: '#cards', style: { textDecoration: 'none', color: 'inherit' } }, h('div', { class: 'n' }, String(due)), h('div', { class: 'l' }, 'flashcards to study')),
        h('div', { class: 'stat' }, h('div', { class: 'n' }, String(App.streak())), h('div', { class: 'l' }, 'day streak'))),
      h('div', { class: 'card' }, h('div', { class: 'row' }, h('strong', null, 'Packet Tracer labs completed'), h('span', { class: 'spacer' }), h('span', { class: 'kv muted' }, SRWE.labs.filter((l) => App.labDone(l.id)).length + ' of ' + SRWE.labs.length)),
        h('div', { style: { marginTop: '10px' } }, bar(SRWE.labs.filter((l) => App.labDone(l.id)).length / SRWE.labs.length)),
        teacher.length ? h('div', { class: 'row', style: { marginTop: '14px' } }, h('a', { href: '#tlabs' }, h('strong', null, 'Instructor\'s activities done')), h('span', { class: 'spacer' }),
          h('span', { class: 'kv muted' }, teacher.filter((tl) => App.teacherDone(tl.id)).length + ' of ' + teacher.length)) : null,
        teacher.length ? h('div', { style: { marginTop: '10px' } }, bar(teacher.filter((tl) => App.teacherDone(tl.id)).length / teacher.length)) : null));
    page.appendChild(h('div', { class: 'hero' }, nextCard, stats));

    page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Modules'), h('span', { class: 'spacer' }),
      h('div', { class: 'legend' }, h('span', null, App.led('on'), 'done'), h('span', null, App.led('half'), 'in progress'), h('span', null, App.led(''), 'not started'),
        h('span', { class: 'muted' }, 'Lights: Read · Understand · Practice · Apply'))));
    page.appendChild(h('div', { class: 'panel-ports' }, ...App.modules().map((m) => h('a', { class: 'modcard', href: '#m' + m.num },
      h('div', { class: 'modnum' }, 'Module ' + m.num), h('div', { class: 'modttl' }, m.title),
      h('div', { class: 'portgrid' }, ...m.topics.map((t) => h('div', { class: 'port' }, h('span', { class: 'pnum' }, t.id), h('span', { class: 'pttl' }, t.title), App.ledRow(t)))),
      h('div', { class: 'row' }, bar(App.modulePct(m)), h('span', { class: 'small muted kv', style: { flex: 'none' } }, pctText(App.modulePct(m))))))));

    if (weak.length || mistakes.length) {
      page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Needs attention')));
      page.appendChild(h('div', { class: 'grid two' },
        weak.length ? h('div', { class: 'card' }, h('h3', null, 'Weakest topics'), h('div', { class: 'list' }, ...weak.map((w) => h('a', { class: 'list-item', href: '#t-' + w.t.id + '-read' },
          h('div', { class: 'grow' }, h('div', { class: 'ttl' }, w.t.id + ' ' + w.t.title), h('div', { class: 'small muted' }, Math.round(w.acc * 100) + '% correct over ' + w.n + ' answers')),
          h('span', { class: 'pill warn' }, 'review'))))) : null,
        mistakes.length ? h('div', { class: 'card' }, h('h3', null, 'Questions you missed'), h('p', { class: 'muted' }, mistakes.length + ' question' + (mistakes.length > 1 ? 's' : '') + ' you answered wrong last time.'),
          h('a', { class: 'btn primary', href: '#quiz-mistakes' }, 'Retry them')) : null));
    }
    if (!App.storageOk()) page.appendChild(h('p', { class: 'note', style: { marginTop: '18px' } }, 'Your browser is blocking local storage, so progress will not be saved after you close this page.'));
  });

  /* ---------------- module page ---------------- */
  for (const mod of App.modules()) {
    const n = mod.num;
    App.route('m' + n, function (page) {
      const m = App.modules().find((x) => x.num === n);
      App.pageHead(page, {
        crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Module ' + n }],
        eyebrow: 'Module ' + n + ' · ' + m.deck, title: m.title, lead: 'Objective: ' + m.objective,
        right: h('div', { class: 'btn-row' }, h('a', { class: 'btn', href: '#quiz-m' + n }, App.icon('list', 16), 'Module quiz'), h('a', { class: 'btn', href: '#cards-m' + n }, App.icon('cards', 16), 'Module flashcards')),
      });
      page.appendChild(h('div', { class: 'list' }, ...m.topics.map((t) => {
        const s = App.stages(t);
        return h('div', { class: 'list-item' },
          h('div', { class: 'grow' }, h('div', { class: 'ttl' }, t.id + ' ' + t.title), h('div', { class: 'small muted' }, t.objective + ' · slides ' + t.slides)),
          h('div', { class: 'btn-row' }, ...STAGES.map(([k, label]) => h('a', { class: 'btn small' + (s[k] === 'on' ? '' : ''), href: '#t-' + t.id + '-' + k, title: label },
            App.led(s[k]), label))));
      })));
      const labs = SRWE.labs.filter((l) => l.module === n);
      if (labs.length) {
        page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Packet Tracer labs for this module')));
        page.appendChild(h('div', { class: 'list' }, ...labs.map(App.labListItem)));
      }
      const tlabs = (SRWE.teacherLabs || []).filter((tl) => tl.module === n);
      if (tlabs.length) {
        page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Your instructor\'s activities')));
        page.appendChild(h('div', { class: 'list' }, ...tlabs.map(App.teacherListItem)));
      }
    });
  }

  /* ---------------- topic page ---------------- */
  App.route('t', function (page, arg) {
    const k = arg.lastIndexOf('-');
    const tid = k > 0 ? arg.slice(0, k) : arg;
    const stage = k > 0 ? arg.slice(k + 1) : 'read';
    const t = App.topic(tid);
    if (!t) { page.appendChild(h('div', { class: 'empty' }, 'Unknown topic ' + tid)); return; }
    const m = t.module;
    const s = App.stages(t);
    App.pageHead(page, {
      crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Module ' + m.num + ': ' + m.title, href: 'm' + m.num }, { label: 'Topic ' + t.id }],
      eyebrow: 'Topic ' + t.id + ' · slides ' + t.slides + ' of ' + m.deck,
      title: t.title, lead: t.objective,
    });
    page.appendChild(h('nav', { class: 'stages', 'aria-label': 'Study stages' }, ...STAGES.map(([key, label, icon], i) =>
      h('a', { class: 'stage' + (stage === key ? ' active' : ''), href: '#t-' + t.id + '-' + key, 'aria-current': stage === key ? 'page' : null },
        h('span', { class: 'n' }, String(i + 1)), App.icon(icon, 16), label, App.led(s[key])))));
    const body = h('div');
    page.appendChild(body);
    ({ read: viewRead, understand: viewUnderstand, practice: viewPractice, apply: viewApply }[stage] || viewRead)(body, t);
    // previous / next topic
    const all = App.topics(), i = all.indexOf(t);
    page.appendChild(h('div', { class: 'article-foot' },
      i > 0 ? h('a', { class: 'btn ghost', href: '#t-' + all[i - 1].id + '-read' }, App.icon('arrowL', 16), all[i - 1].id + ' ' + all[i - 1].title) : null,
      h('span', { class: 'spacer' }),
      i < all.length - 1 ? h('a', { class: 'btn ghost', href: '#t-' + all[i + 1].id + '-read' }, all[i + 1].id + ' ' + all[i + 1].title, App.icon('arrowR', 16)) : null));
  });

  function nextStageButton(t, stage) {
    const order = STAGES.map((x) => x[0]);
    const i = order.indexOf(stage);
    if (i >= order.length - 1) return null;
    return h('a', { class: 'btn', href: '#t-' + t.id + '-' + order[i + 1] }, 'Next: ' + STAGES[i + 1][1], App.icon('arrowR', 16));
  }

  function viewRead(body, t) {
    const st = App.state();
    const art = h('article', { class: 'article', html: t.read });
    App.decorateCli(art);
    body.appendChild(art);
    const btn = h('button', { class: 'btn ' + (st.read[t.id] ? '' : 'primary'), type: 'button' });
    const paint = () => { btn.innerHTML = ''; btn.append(App.icon('check', 16), st.read[t.id] ? 'Marked as read' : 'Mark as read'); btn.className = 'btn ' + (st.read[t.id] ? '' : 'primary'); };
    btn.addEventListener('click', () => { if (st.read[t.id]) delete st.read[t.id]; else st.read[t.id] = Date.now(); App.save(); paint(); App.renderRail(); });
    paint();
    body.appendChild(h('div', { class: 'article-foot' }, btn, nextStageButton(t, 'read'),
      h('span', { class: 'small muted' }, 'Source: slides ' + t.slides + ' of ' + t.module.deck)));
  }

  function viewUnderstand(body, t) {
    const u = t.understand;
    const st = App.state();
    body.appendChild(h('div', { class: 'big-idea' }, u.big));
    body.appendChild(h('div', { class: 'grid two' },
      h('div', { class: 'card' }, h('h3', null, 'Why it matters'), h('p', { style: { margin: 0 } }, u.why)),
      h('div', { class: 'card' }, h('h3', null, 'Picture it'), h('p', { style: { margin: 0 } }, u.analogy))));
    body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Key points')));
    body.appendChild(h('ul', { class: 'keys card' }, ...u.keys.map((k) => h('li', null, App.led('on'), h('span', { html: k })))));
    if (u.widgets && u.widgets.length) {
      body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Explore')));
      for (const w of u.widgets) {
        const box = h('div');
        body.appendChild(box);
        if (SRWE.Widgets && SRWE.Widgets[w]) {
          try { SRWE.Widgets[w](box, t); } catch (e) { box.appendChild(h('div', { class: 'empty' }, 'This visual could not load: ' + e.message)); if (root.__srweErrors) root.__srweErrors.push(String(e.stack || e)); }
        }
      }
    }
    body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Common traps')));
    body.appendChild(h('div', { class: 'traps' }, ...u.traps.map((x) => h('div', { class: 'trap' }, h('div', { class: 'lbl bad' }, 'Trap'), h('div', { html: x.trap }), h('div', { class: 'lbl ok' }, 'Instead'), h('div', { html: x.fix })))));

    body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Explain it yourself')));
    body.appendChild(h('p', { class: 'muted' }, 'Answer in your own words before you reveal the model answer. Explaining is the fastest way to find what you do not understand yet.'));
    const ex = st.explain[t.id] = st.explain[t.id] || {};
    body.appendChild(h('div', { class: 'explain' }, ...u.explain.map((e, i) => {
      const ta = h('textarea', { id: 'ex-' + t.id + '-' + i, 'aria-label': 'Your answer', placeholder: 'Type your explanation…' });
      const model = h('div', { class: 'model', hidden: true }, h('strong', null, 'Model answer: '), h('span', { html: e.a }));
      const rate = h('div', { class: 'btn-row', hidden: true }, h('span', { class: 'small muted' }, 'How close were you?'),
        ...[['got', 'Got it'], ['partly', 'Partly'], ['no', 'Not yet']].map(([v, label]) => h('button', { class: 'btn small', type: 'button', onclick: () => { ex[i] = v; App.save(); App.toast(v === 'got' ? 'Nice.' : 'Re-read the key points, then try again later.'); App.renderRail(); } }, label)));
      const reveal = h('button', { class: 'btn small', type: 'button', onclick: () => { model.hidden = false; rate.hidden = false; reveal.hidden = true; } }, App.icon('eye', 14), 'Show model answer');
      return h('div', { class: 'explain-item' }, h('div', { html: '<b>' + (i + 1) + '.</b> ' + e.q }), ta, h('div', { class: 'btn-row' }, reveal, ex[i] ? h('span', { class: 'pill' + (ex[i] === 'got' ? ' ok' : ' warn') }, 'last time: ' + ex[i]) : null), model, rate);
    })));

    body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Check your understanding'), st.understood[t.id] ? h('span', { class: 'pill ok' }, 'passed') : null));
    const cyuBox = h('div');
    body.appendChild(cyuBox);
    const start = () => {
      cyuBox.innerHTML = '';
      SRWE.Practice.runQuiz(cyuBox, App.shuffle(App.questionsFor(t.id).filter((q) => q.type === 'mc' || q.type === 'tf')).slice(0, 3), {
        compact: true, scope: 'cyu:' + t.id, title: 'Quick check',
        onDone: (score, total) => {
          if (score >= total - 1) { st.understood[t.id] = Date.now(); App.save(); App.renderRail(); App.toast('Understand stage complete for ' + t.id + '.'); }
        },
      });
    };
    cyuBox.appendChild(h('div', { class: 'card' }, h('p', null, 'Three quick questions. Get at least two right to light up the Understand stage.'),
      h('button', { class: 'btn primary', type: 'button', onclick: start }, App.icon('play', 16), st.understood[t.id] ? 'Check again' : 'Start the check')));
    body.appendChild(h('div', { class: 'article-foot' }, nextStageButton(t, 'understand')));
  }

  function viewPractice(body, t) {
    const qs = App.questionsFor(t.id);
    const best = App.bestQuiz('topic:' + t.id);
    const cards = App.cardsFor(t.id);
    const due = App.dueCards((c) => c.t === t.id).length;
    const drills = App.drillsFor(t);
    body.appendChild(h('div', { class: 'grid two' },
      h('div', { class: 'card stack' }, h('div', null, h('h3', null, 'Topic quiz'), h('p', { class: 'muted', style: { margin: 0 } }, qs.length + ' questions, including typed IOS commands. Reach 80% to light up Practice.')),
        best !== null ? h('div', null, h('div', { class: 'row' }, h('span', { class: 'small muted' }, 'Best score'), h('span', { class: 'spacer' }), h('strong', { class: 'kv' }, Math.round(best * 100) + '%')), bar(best, best >= 0.8 ? '' : 'accent')) : null,
        h('div', null, h('a', { class: 'btn primary', href: '#quiz-' + t.id }, App.icon('play', 16), best === null ? 'Start the quiz' : 'Take it again'))),
      h('div', { class: 'card stack' }, h('div', null, h('h3', null, 'Flashcards'), h('p', { class: 'muted', style: { margin: 0 } }, cards.length + ' cards for this topic, scheduled with spaced repetition.')),
        h('div', { class: 'small muted' }, due + ' due now'),
        h('div', null, h('a', { class: 'btn', href: '#cards-' + t.id }, App.icon('cards', 16), 'Review cards')))));
    if (drills.length) {
      body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Command drills')));
      body.appendChild(h('div', { class: 'list' }, ...drills.map(App.drillListItem)));
    }
    body.appendChild(h('div', { class: 'article-foot' }, nextStageButton(t, 'practice')));
  }

  App.drillListItem = function (d) {
    const done = App.drillDone(d.id);
    return h('a', { class: 'list-item', href: '#drill-' + d.id }, App.led(done ? 'on big' : 'big'),
      h('div', { class: 'grow' }, h('div', { class: 'ttl' }, d.title), h('div', { class: 'small muted' }, d.intro)),
      h('span', { class: 'pill' }, d.steps.length + ' steps'), h('span', { class: 'pill' }, { '2960': 'Switch', '4321': 'Router', '3650': 'L3 switch' }[d.dev] || 'Device'));
  };

  function viewApply(body, t) {
    const labs = App.labsFor(t);
    const drills = App.drillsFor(t);
    body.appendChild(h('p', { class: 'muted' }, 'Apply what you learned in your own Cisco Packet Tracer. Each lab gives you the topology, cabling, addressing and tasks. When you are done, paste the output of the show commands, ping and ipconfig, and every task is checked from that output.'));
    if (labs.length) {
      body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Packet Tracer labs')));
      body.appendChild(h('div', { class: 'list' }, ...labs.map(App.labListItem)));
    } else body.appendChild(h('div', { class: 'empty' }, 'No Packet Tracer lab for this topic yet.'));
    const tlabs = App.teacherLabsFor(t);
    if (tlabs.length) {
      body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'From your instructor')));
      body.appendChild(h('div', { class: 'list' }, ...tlabs.map(App.teacherListItem)));
    }
    if (drills.length) {
      body.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Warm up: command drills')));
      body.appendChild(h('div', { class: 'list' }, ...drills.map(App.drillListItem)));
    }
  }

  /* ---------------- reference & glossary ---------------- */
  App.route('reference', function (page) {
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Command reference' }], title: 'Command reference', lead: 'Every IOS command used in the course, with the mode you type it in.' });
    const q = h('input', { class: 'input ref-search', type: 'search', id: 'ref-q', placeholder: 'Filter commands, e.g. trunk, ssh, standby, dhcp', 'aria-label': 'Filter commands' });
    page.appendChild(h('div', { class: 'row', style: { marginBottom: '14px' } }, q));
    const box = h('div');
    page.appendChild(box);
    const draw = () => {
      const f = q.value.trim().toLowerCase();
      box.innerHTML = '';
      for (const g of SRWE.reference) {
        const rows = g.cmds.filter((c) => !f || (c[0] + ' ' + c[1] + ' ' + c[2]).toLowerCase().includes(f));
        if (!rows.length) continue;
        box.appendChild(h('h3', { style: { marginTop: '18px' } }, g.title, ' ', h('a', { class: 'small', href: '#t-' + g.t + '-read' }, 'topic ' + g.t)));
        box.appendChild(h('div', { class: 'scroll' }, h('table', { class: 't ref-table' }, h('tr', null, h('th', null, 'Command'), h('th', null, 'Mode'), h('th', null, 'What it does')),
          ...rows.map((c) => h('tr', null, h('td', null, c[0]), h('td', { class: 'small' }, c[1]), h('td', null, c[2]))))));
      }
      if (!box.children.length) box.appendChild(h('div', { class: 'empty' }, 'No command matches "' + q.value + '".'));
    };
    q.addEventListener('input', draw);
    draw();
  });
  App.route('glossary', function (page) {
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Glossary' }], title: 'Glossary', lead: 'Terms from all ' + App.modules().length + ' modules, with the topic where each is taught.' });
    const q = h('input', { class: 'input ref-search', type: 'search', id: 'gl-q', placeholder: 'Filter terms', 'aria-label': 'Filter terms' });
    page.appendChild(h('div', { class: 'row', style: { marginBottom: '14px' } }, q));
    const box = h('div', { class: 'list' });
    page.appendChild(box);
    const draw = () => {
      const f = q.value.trim().toLowerCase();
      box.innerHTML = '';
      for (const g of SRWE.glossary.slice().sort((a, b) => a[0].localeCompare(b[0]))) {
        if (f && !(g[0] + ' ' + g[1]).toLowerCase().includes(f)) continue;
        box.appendChild(h('div', { class: 'list-item' }, h('div', { class: 'grow' }, h('div', { class: 'ttl' }, g[0]), h('div', { class: 'muted' }, g[1])), h('a', { class: 'pill', href: '#t-' + g[2] + '-read' }, g[2])));
      }
    };
    q.addEventListener('input', draw);
    draw();
  });

  /* ---------------- settings ---------------- */
  App.route('settings', function (page) {
    App.pageHead(page, { crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Settings & progress' }], title: 'Settings and progress' });
    const st = App.state();
    const themes = h('div', { class: 'seg', role: 'group', 'aria-label': 'Theme' }, ...['system', 'dark', 'light'].map((t) =>
      h('button', { type: 'button', class: st.settings.theme === t ? 'on' : '', onclick: () => { st.settings.theme = t; App.applyTheme(); App.save(); App.render(); } }, t)));
    const ta = h('textarea', { class: 'input mono', id: 'backup', rows: 4, 'aria-label': 'Progress backup', style: { minHeight: '90px' } });
    const confirmBox = h('div', { class: 'btn-row', hidden: true }, h('span', null, 'Delete all progress, lab states and card schedules?'),
      h('button', { class: 'btn danger', type: 'button', onclick: () => { App.resetAll(); App.applyTheme(); App.toast('Progress reset.'); App.go('home'); } }, 'Yes, reset everything'),
      h('button', { class: 'btn', type: 'button', onclick: () => { confirmBox.hidden = true; } }, 'Cancel'));
    page.appendChild(h('div', { class: 'stack' },
      h('div', { class: 'card stack' }, h('h3', null, 'Appearance'), h('div', { class: 'row' }, themes, h('span', { class: 'muted small' }, 'System follows your operating system setting.'))),
      h('div', { class: 'card stack' }, h('h3', null, 'Back up or move your progress'),
        h('p', { class: 'muted', style: { margin: 0 } }, 'Progress is stored in this browser only. Copy the backup text to keep it safe or to move it to another browser, then paste it there and press Restore.'),
        ta,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', onclick: () => { ta.value = App.exportJson(); ta.select(); try { navigator.clipboard.writeText(ta.value).then(() => App.toast('Backup copied to the clipboard.'), () => App.toast('Backup text is selected; copy it with Ctrl+C.')); } catch (e) { App.toast('Backup text is selected; copy it with Ctrl+C.'); } } }, 'Create backup'),
          h('button', { class: 'btn', type: 'button', onclick: () => { try { App.importJson(ta.value); App.applyTheme(); App.toast('Progress restored.'); App.go('home'); } catch (e) { App.toast('Could not restore: ' + e.message); } } }, 'Restore from text'))),
      h('div', { class: 'card stack' }, h('h3', null, 'Start over'), h('p', { class: 'muted', style: { margin: 0 } }, 'Clears every stage, quiz result, flashcard schedule and the output you pasted into labs.'),
        h('div', null, h('button', { class: 'btn danger', type: 'button', onclick: () => { confirmBox.hidden = false; } }, App.icon('reset', 16), 'Reset all progress')), confirmBox),
      h('div', { class: 'card' }, h('h3', null, 'About'), h('p', { class: 'muted', style: { margin: 0 } },
        'Built from the ' + App.modules().length + ' SRWE v7 module decks in this folder, including the content of their screenshots. Labs run in your own Cisco Packet Tracer; this app checks the output you paste.'))));
  });
})(typeof window !== 'undefined' ? window : globalThis);
