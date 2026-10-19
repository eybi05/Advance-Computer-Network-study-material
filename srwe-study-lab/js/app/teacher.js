/* SRWE Study Lab — Apply: your instructor's Packet Tracer activities.
 * The .pka files stay in the "teacher's lab" folder next to the app; js/data/teacher-labs.js (made by
 * tools/pkt/teacher.py) holds each activity's instructions, topology and objectives. Packet Tracer scores
 * the activity itself (Check Results). Here the learner reads the instructions beside the topology, keeps
 * answers to the activity's questions, and marks the activity done. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE;
  const App = SRWE.App;
  const h = App.h;
  const all = () => SRWE.teacherLabs || [];
  const HOSTS = ['pc', 'laptop', 'server', 'tablet'];

  App.teacherState = function (id) {
    const st = App.state();
    const s = st.tlabs[id] = st.tlabs[id] || {};
    s.answers = s.answers || {};
    return s;
  };
  const answered = (tl) => { const s = App.state().tlabs[tl.id]; return s && s.answers ? Object.keys(s.answers).filter((k) => String(s.answers[k]).trim()).length : 0; };
  const fileUrl = (tl) => encodeURI(SRWE.teacherDir + tl.file);
  /* One line for the list: the activity's parts, else its short objectives. */
  const summary = (tl) => {
    const parts = tl.objectives.filter((o) => /^Part \d/.test(o));
    return (parts.length ? parts : tl.objectives.filter((o) => o.length < 90)).join(' · ');
  };
  /* This app's own labs on the same topics: same network ideas, checked from pasted output. */
  App.teacherRelated = (tl) => { const ts = App.teacherTopics(tl); return SRWE.labs.filter((l) => (l.topics || []).some((t) => ts.includes(t))); };

  App.teacherListItem = function (tl) {
    const done = App.teacherDone(tl.id);
    const n = answered(tl);
    const sum = summary(tl);
    return h('a', { class: 'list-item', href: '#tlab-' + tl.id },
      App.led(done ? 'on big' : n ? 'half big' : 'big'),
      h('div', { class: 'grow' }, h('div', { class: 'ttl' }, h('span', { class: 'mono muted' }, tl.id), ' ', tl.title), sum ? h('div', { class: 'small muted' }, sum) : null),
      h('span', { class: 'pill accent' }, 'Instructor'),
      tl.questions ? h('span', { class: 'pill' }, n ? n + '/' + tl.questions + ' answered' : tl.questions + (tl.questions > 1 ? ' questions' : ' question')) : null,
      done ? h('span', { class: 'pill ok' }, 'done') : null);
  };

  /* ================= list ================= */
  App.route('tlabs', function (page) {
    const labs = all();
    const done = labs.filter((tl) => App.teacherDone(tl.id)).length;
    App.pageHead(page, {
      crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Instructor\'s labs' }],
      title: 'Instructor\'s labs',
      lead: 'The Packet Tracer activities your instructor shared. Open each one in Packet Tracer and follow its instructions; Check Results in the activity scores your work. Here you read the instructions beside the topology, keep your answers to its questions, and mark the activity done.',
      right: h('div', { class: 'stat', style: { minWidth: '160px' } }, h('div', { class: 'n' }, done + '/' + labs.length), h('div', { class: 'l' }, 'activities done')),
    });
    if (!labs.length) {
      page.appendChild(h('div', { class: 'empty' }, 'No activities yet. Put the .pka files in the "teacher\'s lab" folder next to this app and run python3 tools/pkt/teacher.py.'));
      return;
    }
    for (const m of App.modules()) {
      const list = labs.filter((tl) => tl.module === m.num);
      if (!list.length) continue;
      page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Module ' + m.num + ': ' + m.title)));
      page.appendChild(h('div', { class: 'list' }, ...list.map(App.teacherListItem)));
    }
  });

  /* ================= activity page ================= */
  App.route('tlab', function (page, id) {
    const tl = all().find((x) => x.id === id);
    if (!tl) { page.appendChild(h('div', { class: 'empty' }, 'Unknown activity ' + id)); return; }
    page.className = 'page wide';
    const s = App.teacherState(id);
    const count = h('div', { class: 'small muted' });
    const doneBtns = [];
    function paint() {
      for (const b of doneBtns) {
        b.className = b.dataset.cls + (s.completed ? '' : ' primary');
        b.innerHTML = '';
        b.append(App.icon('check', 14), s.completed ? 'Marked as done' : 'Mark as done');
      }
      count.textContent = tl.questions ? answered(tl) + ' of ' + tl.questions + ' questions answered. Answers are saved in this browser and in your backups.' : 'This activity has no questions to answer; Check Results in Packet Tracer scores it.';
    }
    const doneButton = (cls) => {
      const b = h('button', { type: 'button', 'data-cls': cls });
      b.addEventListener('click', () => {
        if (s.completed) delete s.completed;
        else { s.completed = Date.now(); App.toast('Activity marked as done.'); }
        App.save(true);
        App.renderRail();
        paint();
      });
      doneBtns.push(b);
      return b;
    };
    App.pageHead(page, {
      crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Instructor\'s labs', href: 'tlabs' }, { label: tl.id + ' ' + tl.title }],
      eyebrow: 'Instructor\'s Packet Tracer activity · module ' + tl.module + ' · ' + tl.id,
      title: tl.title, lead: summary(tl) || null, right: doneButton('btn'),
    });

    /* ---------- open it ---------- */
    const hostPort = (dev, port) => (HOSTS.includes((tl.devices.find((d) => d.id === dev) || {}).type) && /^(Fast|Gigabit)?Ethernet0$/.test(port) ? 'NIC' : port);
    const drawn = { title: tl.title, devices: tl.devices, links: tl.links.map((l) => [l[0], hostPort(l[0], l[1]), l[2], hostPort(l[2], l[3]), l[4]]) };
    const devRows = tl.devices.map((d) => h('tr', null, h('td', null, h('b', null, d.id)), h('td', null, d.model), h('td', { class: 'small' }, App.KIND_LABEL[d.type] || '')));
    const linkRows = tl.links.map((l) => h('tr', null, h('td', null, h('b', null, l[0]), ' ', h('span', { class: 'mono' }, l[1])),
      h('td', null, h('b', null, l[2]), ' ', h('span', { class: 'mono' }, l[3])), h('td', { class: 'small' }, App.CABLE_LABEL[l[4]] || l[4])));
    const folder = SRWE.teacherDir.replace(/^(\.\.\/)+/, '');
    const open = h('section', { class: 'card stack', 'aria-labelledby': 'o-' + id },
      h('h2', { id: 'o-' + id, class: 'h-step' }, h('span', { class: 'n' }, '1'), 'Open it in Packet Tracer'),
      h('div', { class: 'note stack', style: { gap: '8px' } },
        h('div', null, 'Open ', h('code', null, folder + tl.file), ' in Packet Tracer (File > Open)' + (tl.version ? ', version ' + tl.version.split('.').slice(0, 2).join('.') + ' or later' : '') +
          '. Follow the instructions in its window or below, then click ', h('b', null, 'Check Results'), ' in the activity to see your score.'),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn small primary', href: fileUrl(tl), download: tl.file }, App.icon('download', 14), 'Activity ' + tl.id + '.pka'))),
      tl.devices.length ? App.ptTopology(drawn) : null,
      tl.emptyStart ? h('p', { class: 'small muted', style: { margin: 0 } }, 'The activity starts with an empty workspace: you add and cable these devices yourself, as its instructions describe.') : null,
      tl.devices.length ? h('details', { class: 'tl-more' }, h('summary', null, h('strong', null, 'Devices and cabling')),
        h('div', { class: 'scroll' }, h('table', { class: 't small compact' }, h('tr', null, h('th', null, 'Name'), h('th', null, 'Packet Tracer model'), h('th', null, 'Kind')), ...devRows)),
        linkRows.length ? h('div', { class: 'scroll' }, h('table', { class: 't small compact' }, h('tr', null, h('th', null, 'From'), h('th', null, 'To'), h('th', null, 'Cable')), ...linkRows)) : null,
        tl.devices.some((d) => ['ap', 'wrouter', 'wlc'].includes(d.type)) ? h('p', { class: 'small muted', style: { margin: 0 } }, 'Wireless clients join their access point in Packet Tracer, so they have no cable here.') : null) : null);

    /* ---------- instructions, with an answer box under every question ---------- */
    const doc = h('div', { class: 'article tl-doc', html: tl.html });
    App.decorateCli(doc);
    for (const q of doc.querySelectorAll('.tl-q')) {
      const k = q.dataset.q;
      const ta = h('textarea', { class: 'input tl-ans', rows: '2', placeholder: 'Your answer', 'aria-label': 'Your answer: ' + q.textContent.trim().slice(0, 120) });
      ta.value = s.answers[k] || '';
      q.classList.toggle('answered', !!ta.value.trim());
      ta.addEventListener('input', () => {
        if (ta.value.trim()) s.answers[k] = ta.value; else delete s.answers[k];
        q.classList.toggle('answered', !!ta.value.trim());
        App.save();
        paint();
      });
      q.appendChild(ta);
    }
    const instructions = h('section', { class: 'card stack', 'aria-labelledby': 'i-' + id },
      h('h2', { id: 'i-' + id, class: 'h-step' }, h('span', { class: 'n' }, '2'), 'Instructions'), doc);

    /* ---------- side: progress and related study material ---------- */
    const resetConfirm = h('div', { class: 'btn-row', hidden: true }, h('span', { class: 'small' }, 'Clear your answers for this activity?'),
      h('button', { class: 'btn small danger', type: 'button', onclick: () => { s.answers = {}; App.save(true); App.render(); } }, 'Yes, clear'),
      h('button', { class: 'btn small', type: 'button', onclick: () => { resetConfirm.hidden = true; } }, 'Cancel'));
    const related = App.teacherRelated(tl);
    const topics = App.teacherTopics(tl).map(App.topic).filter(Boolean);
    const side = h('section', { class: 'card stack', 'aria-labelledby': 'r-' + id },
      h('h2', { id: 'r-' + id, class: 'h-step' }, h('span', { class: 'n' }, '3'), 'Your progress'),
      count,
      h('div', { class: 'btn-row' }, doneButton('btn small'),
        tl.questions ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => { resetConfirm.hidden = false; } }, App.icon('reset', 14), 'Clear my answers') : null),
      resetConfirm,
      related.length ? h('div', { class: 'stack', style: { gap: '8px' } }, h('h3', { style: { margin: 0 } }, 'Practise it here too'),
        h('p', { class: 'small muted', style: { margin: 0 } }, 'Labs of this app on the same topics: paste your show output and every task is checked.'),
        h('div', { class: 'list' }, ...related.map(App.labListItem))) : null,
      topics.length ? h('div', { class: 'stack', style: { gap: '8px' } }, h('h3', { style: { margin: 0 } }, 'Course topics'),
        h('div', { class: 'list' }, ...topics.map((t) => h('a', { class: 'list-item', href: '#t-' + t.id + '-read' },
          h('div', { class: 'grow' }, h('div', { class: 'ttl' }, t.id + ' ' + t.title)), App.ledRow(t))))) : null);

    page.appendChild(h('div', { class: 'ptlab' },
      h('div', { class: 'ptlab-main' }, open, instructions),
      h('div', { class: 'ptlab-side' }, side)));
    paint();
  });
})(typeof window !== 'undefined' ? window : globalThis);
