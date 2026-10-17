/* SRWE Study Lab — Apply: Packet Tracer labs.
 * Each lab is built and configured in the learner's own Cisco Packet Tracer. The page gives the
 * topology, cabling, addressing, starting configuration and tasks; the learner pastes the output of
 * show commands, ping and ipconfig, and every task is graded from that output (js/pt/check.js). */
(function (root) {
  'use strict';
  const SRWE = root.SRWE;
  const App = SRWE.App;
  const h = App.h;
  const PT = SRWE.PT;
  const NS = 'http://www.w3.org/2000/svg';

  /* ================= topology drawing (static) ================= */
  const ICONS = {
    router: '<circle class="body" cx="0" cy="0" r="24" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M-13 -6h11M-6 -11l5 5-5 5M13 6H2M6 11l-5-5 5-5" fill="none" stroke="var(--text-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    switch: '<rect class="body" x="-30" y="-17" width="60" height="34" rx="6" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M-16 -5h28M7 -10l5 5-5 5M16 5h-28M-7 0l-5 5 5 5" fill="none" stroke="var(--text-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    l3switch: '<rect class="body" x="-25" y="-25" width="50" height="50" rx="7" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M0 -15v30M-15 0h30M-4 -11l4-4 4 4M-4 11l4 4 4-4M-11 -4l-4 4 4 4M11 -4l4 4-4 4" fill="none" stroke="var(--text-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    pc: '<rect class="body" x="-19" y="-17" width="38" height="25" rx="3" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M-7 14h14M0 8v6" stroke="var(--line-2)" stroke-width="2" stroke-linecap="round"/>',
    laptop: '<rect class="body" x="-16" y="-15" width="32" height="21" rx="2" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M-23 10h46l-4 5h-38z" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6" stroke-linejoin="round"/>',
    server: '<rect class="body" x="-14" y="-22" width="28" height="44" rx="3" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M-8 -12h16M-8 -5h16M-8 2h16" stroke="var(--text-2)" stroke-width="2" stroke-linecap="round"/>',
    wrouter: '<circle class="body" cx="0" cy="4" r="20" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M-9 -12v-14M9 -12v-14" stroke="var(--line-2)" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M-10 0h8M-5 -4l4 4-4 4M10 8H2M5 4l-4 4 4 4" fill="none" stroke="var(--text-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    ap: '<rect class="body" x="-20" y="-8" width="40" height="18" rx="9" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<path d="M-9 -15a13 13 0 0 1 18 0M-5 -11a7 7 0 0 1 10 0" fill="none" stroke="var(--text-2)" stroke-width="2" stroke-linecap="round"/>',
    wlc: '<rect class="body" x="-30" y="-15" width="60" height="30" rx="4" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' +
      '<text x="0" y="5" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text-2)">WLC</text>',
    cloud: '<path class="body" d="M-26 12a12 12 0 0 1 2-24 16 16 0 0 1 30-4 12 12 0 0 1 20 10 10 10 0 0 1-4 18z" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>',
  };
  const KIND_LABEL = { router: 'Router', switch: 'Switch', l3switch: 'Layer 3 switch', pc: 'PC', laptop: 'Laptop', server: 'Server', wrouter: 'Wireless router', ap: 'Access point', wlc: 'Wireless LAN controller', cloud: 'Cloud' };
  const CABLE = {
    straight: 'Copper Straight-Through', cross: 'Copper Cross-Over', serial: 'Serial DCE (on the first device)', console: 'Console', wireless: 'Wireless (no cable)', fiber: 'Fiber',
  };
  function svgEl(tag, attrs, inner) {
    const e = document.createElementNS(NS, tag);
    for (const k of Object.keys(attrs || {})) e.setAttribute(k, attrs[k]);
    if (inner) e.innerHTML = inner;
    return e;
  }
  App.ptTopology = function (lab) {
    const wrap = h('div', { class: 'topo' });
    const svg = svgEl('svg', { role: 'img', 'aria-label': 'Topology for ' + lab.title + ': ' + lab.links.map((l) => l[0] + ' ' + l[1] + ' to ' + l[2] + ' ' + l[3]).join(', ') });
    wrap.appendChild(svg);
    const pos = {};
    for (const d of lab.devices) pos[d.id] = { x: d.x * 10, y: d.y * 10 + 26, d };
    const xs = Object.values(pos).map((p) => p.x), ys = Object.values(pos).map((p) => p.y);
    const minX = Math.min(...xs) - 100, maxX = Math.max(...xs) + 100, minY = Math.min(...ys) - 60, maxY = Math.max(...ys) + 90;
    svg.setAttribute('viewBox', [minX, minY, maxX - minX, maxY - minY].join(' '));
    const linkG = svgEl('g'), nodeG = svgEl('g');
    svg.append(linkG, nodeG);
    for (const l of lab.links) {
      const a = pos[l[0]], b = pos[l[2]];
      if (!a || !b) continue;
      const type = l[4] || 'straight';
      const color = type === 'serial' ? 'var(--bad)' : type === 'wireless' ? 'var(--info)' : 'var(--text-2)';
      const dash = type === 'cross' ? '9 6' : type === 'wireless' ? '2 7' : '';
      if (type === 'serial') {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len * 9, ny = dx / len * 9;
        linkG.appendChild(svgEl('polyline', { points: [a.x, a.y, mx + nx - dx * 0.03, my + ny - dy * 0.03, mx - nx + dx * 0.03, my - ny + dy * 0.03, b.x, b.y].join(' '), fill: 'none', stroke: color, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }));
      } else {
        linkG.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: color, 'stroke-width': type === 'wireless' ? 2.6 : 2.4, 'stroke-dasharray': dash, 'stroke-linecap': 'round' }));
      }
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      [[a, l[1], 1], [b, l[3], -1]].forEach(([p, port, dir]) => {
        if (!port || port === 'NIC' || type === 'wireless') return;
        const f = Math.min(0.4, 86 / len);
        const cx = p.x + dx * f * dir, cy = p.y + dy * f * dir;
        const anchor = nx < -0.35 ? 'end' : nx > 0.35 ? 'start' : 'middle'; // keep the label beside the line, not on it
        const t = svgEl('text', { x: cx + nx * 12, y: cy + ny * 14 + 6, 'text-anchor': anchor, 'font-size': 19, fill: 'var(--text-2)', 'paint-order': 'stroke', stroke: 'var(--bg-2)', 'stroke-width': 5 });
        t.textContent = PT.shortIf(port).replace('VLAN ', 'Vlan');
        linkG.appendChild(t);
      });
    }
    for (const id of Object.keys(pos)) {
      const p = pos[id];
      const g = svgEl('g', { transform: 'translate(' + p.x + ' ' + p.y + ') scale(1.25)' });
      g.innerHTML = ICONS[p.d.type] || ICONS.pc;
      const label = svgEl('text', { x: 0, y: ['l3switch', 'server'].includes(p.d.type) ? 44 : 40, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 600, fill: 'var(--text)' });
      label.textContent = id;
      g.appendChild(label);
      if (p.d.note) {
        const n = svgEl('text', { x: 0, y: ['l3switch', 'server'].includes(p.d.type) ? 60 : 56, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'var(--text-2)' });
        n.textContent = p.d.note;
        g.appendChild(n);
      }
      const title = svgEl('title');
      title.textContent = id + ' · ' + (p.d.model || KIND_LABEL[p.d.type] || '');
      g.appendChild(title);
      nodeG.appendChild(g);
    }
    return wrap;
  };

  /* ================= helpers ================= */
  function copyText(text, btn) {
    const done = () => { if (btn) { const old = btn.lastChild.textContent; btn.lastChild.textContent = 'Copied'; setTimeout(() => { btn.lastChild.textContent = old; }, 1400); } };
    try {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } catch (e) { fallback(); }
    function fallback() {
      const ta = h('textarea', { style: { position: 'fixed', opacity: '0', top: '0' } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { App.toast('Select the text and press Ctrl+C.'); }
      ta.remove();
    }
  }
  App.copyText = copyText;
  function codeBlock(lines, label) {
    const text = lines.join('\n');
    const btn = h('button', { class: 'btn small', type: 'button', 'aria-label': 'Copy ' + (label || 'commands') }, App.icon('copy', 14), h('span', null, 'Copy'));
    btn.addEventListener('click', () => copyText(text, btn));
    const pre = h('pre', { class: 'cli' }, text);
    App.decorateCli(h('div', null, pre));
    return h('div', { class: 'codebox' }, h('div', { class: 'codebar' }, h('span', { class: 'small muted' }, label || ''), btn), pre);
  }
  App.codeBlock = codeBlock;
  /* Full paste-able block for a device: privileged EXEC -> config -> back. */
  function configScript(lines) {
    return ['enable', 'configure terminal'].concat(lines.filter((x) => x !== ''), ['end']);
  }
  const isHost = (d) => ['pc', 'laptop', 'server'].includes(d.type);

  App.labState = function (id) {
    const st = App.state();
    let ls = st.labs[id];
    if (!ls || ls.net) ls = st.labs[id] = { pasted: {}, answers: {}, ticks: {}, doneCount: 0, total: 0 };
    ls.pasted = ls.pasted || {}; ls.answers = ls.answers || {}; ls.ticks = ls.ticks || {};
    return ls;
  };
  App.labGrade = function (lab) {
    const ls = App.labState(lab.id);
    const res = PT.grade(lab, ls);
    const req = res.filter((r) => !r.optional);
    ls.doneCount = req.filter((r) => r.status === 'pass').length;
    ls.total = req.length;
    if (ls.doneCount === ls.total && ls.total && !ls.completed) { ls.completed = Date.now(); ls.justCompleted = true; }
    return res;
  };

  /* ================= lab list ================= */
  App.labListItem = function (l) {
    const st = App.state().labs[l.id];
    const done = App.labDone(l.id);
    const pct = st && st.total ? st.doneCount / st.total : 0;
    return h('a', { class: 'list-item', href: '#lab-' + l.id },
      App.led(done ? 'on big' : pct > 0 ? 'half big' : 'big'),
      h('div', { class: 'grow' }, h('div', { class: 'ttl' }, l.title), h('div', { class: 'small muted' }, l.goal)),
      h('span', { class: 'pill' + (l.level === 'Challenge' ? ' warn' : l.level === 'Troubleshoot' ? ' bad' : l.level === 'Practice' ? ' accent' : '') }, l.level),
      h('span', { class: 'pill' }, '~' + l.minutes + ' min'),
      done ? h('span', { class: 'pill ok' }, 'complete') : pct > 0 ? h('span', { class: 'pill' }, Math.round(pct * 100) + '%') : null);
  };

  App.route('labs', function (page) {
    const done = SRWE.labs.filter((l) => App.labDone(l.id)).length;
    App.pageHead(page, {
      crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Packet Tracer labs' }],
      title: 'Packet Tracer labs',
      lead: 'Build each network in your own Cisco Packet Tracer, configure it, then paste the output of show commands, ping and ipconfig here. Every task is checked from that output.',
      right: h('div', { class: 'stat', style: { minWidth: '160px' } }, h('div', { class: 'n' }, done + '/' + SRWE.labs.length), h('div', { class: 'l' }, 'labs complete')),
    });
    page.appendChild(howToCopy(false));
    for (const m of App.modules()) {
      const labs = SRWE.labs.filter((l) => l.module === m.num);
      if (!labs.length) continue;
      page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Module ' + m.num + ': ' + m.title)));
      page.appendChild(h('div', { class: 'list' }, ...labs.map(App.labListItem)));
    }
  });

  function howToCopy(open) {
    return h('details', { class: 'card howto', open: open ? true : null },
      h('summary', null, h('strong', null, 'How to copy output from Packet Tracer')),
      h('ol', { class: 'small', style: { margin: '10px 0 0', paddingLeft: '1.3em' } },
        h('li', null, 'Open the device, go to the ', h('b', null, 'CLI'), ' tab and enter privileged EXEC mode (', h('code', null, 'enable'), ').'),
        h('li', null, 'Run ', h('code', null, 'terminal length 0'), ' once, so long output is not split by ', h('code', null, '--More--'), '.'),
        h('li', null, 'Run the show commands the lab asks for. You can run several in a row.'),
        h('li', null, 'Select the text in the CLI window and press ', h('kbd', null, 'Ctrl'), '+', h('kbd', null, 'C'), ' (or use the ', h('b', null, 'Copy'), ' button under the CLI), then paste it into the box for that device.'),
        h('li', null, 'For a PC or laptop, open ', h('b', null, 'Desktop > Command Prompt'), ', run ', h('code', null, 'ipconfig /all'), ' and the pings, select the text and copy it the same way.')),
      h('p', { class: 'small muted', style: { margin: '8px 0 0' } }, 'Paste whole sessions: the checker finds each command by its prompt (S1#, R1#, C:\\>) and ignores everything it does not need. Paste again after you fix something; newer output replaces older output of the same command.'));
  }

  /* ================= lab page ================= */
  App.route('lab', function (page, id) {
    const lab = SRWE.labs.find((l) => l.id === id);
    if (!lab) { page.appendChild(h('div', { class: 'empty' }, 'Unknown lab ' + id)); return; }
    page.className = 'page wide';
    const ls = App.labState(id);
    const st = App.state();
    App.pageHead(page, {
      crumbs: [{ label: 'Dashboard', href: 'home' }, { label: 'Packet Tracer labs', href: 'labs' }, { label: lab.title }],
      eyebrow: 'Packet Tracer lab · module ' + lab.module + ' · ' + lab.level + ' · ~' + lab.minutes + ' min',
      title: lab.title, lead: lab.goal,
    });

    /* ---------- tasks ---------- */
    const taskEls = [];
    const taskBox = h('div', { class: 'tasks' });
    const progress = h('div', { class: 'row' });
    const needBox = h('div', { class: 'need-box', hidden: true });
    const doneBox = h('div', { class: 'done-banner', hidden: true }, App.led('on big'),
      h('div', null, h('strong', null, 'Lab complete. '), 'Every task passes on your Packet Tracer output.'), h('span', { class: 'spacer' }), h('a', { class: 'btn small', href: '#labs' }, 'All labs'));
    let part = null;
    lab.tasks.forEach((t, i) => {
      if (t.part && t.part !== part) { part = t.part; taskBox.appendChild(h('div', { class: 'part-title' }, part)); }
      const hintBox = h('div', { class: 'hint', hidden: true });
      const acts = h('div', { class: 'acts' });
      if (t.hint || t.cmds) {
        let level = 0;
        const b = h('button', { class: 'btn small ghost', type: 'button' }, App.icon('eye', 14), h('span', null, t.hint ? 'Hint' : 'Show commands'));
        b.addEventListener('click', () => {
          level++;
          hintBox.hidden = false;
          hintBox.innerHTML = '';
          if (t.hint) hintBox.appendChild(h('div', { html: t.hint }));
          if ((level >= 2 || !t.hint) && t.cmds) hintBox.appendChild(h('pre', { class: 'out', style: { margin: '6px 0 0' } }, t.cmds.join('\n')));
          if (t.hint && t.cmds && level === 1) b.lastChild.textContent = 'Show commands'; else b.hidden = true;
        });
        acts.appendChild(b);
      }
      const msg = h('div', { class: 'tmsg small', 'aria-live': 'polite' });
      let extra = null;
      if (t.answer !== undefined) {
        const inp = h('input', { class: 'input', id: 'ans-' + id + '-' + i, value: ls.answers[i] || '', placeholder: 'Your answer', 'aria-label': 'Answer to task ' + (i + 1) });
        const save = () => { ls.answers[i] = inp.value; evaluate(); };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
        inp.addEventListener('change', save);
        extra = h('div', { class: 'ans' }, inp, h('button', { class: 'btn small', type: 'button', onclick: save }, 'Check'));
      } else if (t.self) {
        const cb = h('input', { type: 'checkbox', id: 'tick-' + id + '-' + i, checked: ls.ticks[i] ? true : null });
        cb.addEventListener('change', () => { ls.ticks[i] = cb.checked; evaluate(); });
        extra = h('label', { class: 'row small tick', for: 'tick-' + id + '-' + i }, cb, 'Done in Packet Tracer (this step is checked by you)');
      }
      const el = h('div', { class: 'task', 'data-task': String(i) }, App.led(''),
        h('div', null, h('div', { class: 'txt', html: (i + 1) + '. ' + t.text }), extra, msg, acts, hintBox));
      taskEls.push({ el, msg });
      taskBox.appendChild(el);
    });

    function evaluate(fromPaste) {
      const res = App.labGrade(lab);
      const needs = {};
      res.forEach((r) => {
        const te = taskEls[r.i];
        te.el.classList.toggle('done', r.status === 'pass');
        te.el.firstChild.className = 'led' + (r.status === 'pass' ? ' on' : r.status === 'fail' ? ' red' : '');
        te.msg.innerHTML = '';
        te.msg.className = 'tmsg small';
        if (r.status === 'need') {
          te.msg.append(App.icon('alert', 13), ' Paste ', h('code', null, r.need.what), ' from ', h('b', null, r.need.dev), '.');
          te.msg.classList.add('need');
          (needs[r.need.dev] = needs[r.need.dev] || new Set()).add(r.need.what);
        } else if (r.status === 'fail' && (r.msg || ls.pasted && Object.keys(ls.pasted).length)) {
          te.msg.textContent = r.msg || (lab.tasks[r.i].answer !== undefined ? 'Not the answer the output shows.' : 'Not done yet according to your output.');
          te.msg.classList.add('bad');
        } else if (r.status === 'pass' && lab.tasks[r.i].answer !== undefined) {
          te.msg.textContent = 'Correct.';
          te.msg.classList.add('ok');
        }
      });
      const req = res.filter((r) => !r.optional);
      const n = req.filter((r) => r.status === 'pass').length;
      progress.innerHTML = '';
      progress.append(h('strong', { class: 'kv' }, n + ' of ' + req.length + ' tasks'), h('div', { style: { flex: 1 } }, App.bar(req.length ? n / req.length : 0)));
      const devs = Object.keys(needs);
      needBox.hidden = !devs.length;
      needBox.innerHTML = '';
      if (devs.length) {
        needBox.append(h('strong', null, 'Still needed from Packet Tracer'), h('ul', null, ...devs.map((d) => h('li', null, h('b', null, d + ': '), [...needs[d]].map((w, k) => [k ? ', ' : '', h('code', null, w)])))));
      }
      doneBox.hidden = !ls.completed;
      if (ls.justCompleted) { delete ls.justCompleted; App.toast('Lab complete. Well done!'); App.renderRail(); }
      for (const tab of tabs) tab.refresh();
      App.save();
    }

    /* ---------- build section ---------- */
    const deviceRows = lab.devices.filter((d) => d.type !== 'cloud' || d.model).map((d) => h('tr', null, h('td', null, h('b', null, d.id)), h('td', null, d.model || KIND_LABEL[d.type]), h('td', { class: 'small' }, d.where || '')));
    const portLabel = (devId, p) => (p === 'NIC' ? ((lab.devices.find((d) => d.id === devId) || {}).type === 'laptop' && (lab.links.find((l) => l[0] === devId) || [])[4] === 'wireless' ? 'Wireless0' : 'Fa0') : PT.shortIf(p).replace('VLAN ', 'Vlan'));
    const linkRows = lab.links.map((l) => h('tr', null, h('td', null, h('b', null, l[0]), ' ', h('span', { class: 'mono' }, portLabel(l[0], l[1]))),
      h('td', null, h('b', null, l[2]), ' ', h('span', { class: 'mono' }, portLabel(l[2], l[3]))), h('td', { class: 'small' }, CABLE[l[4] || 'straight'])));
    const addrTable = lab.addressing ? h('div', { class: 'scroll' }, h('table', { class: 't small compact' },
      h('tr', null, h('th', null, 'Device'), h('th', null, 'Interface'), h('th', null, 'Address'), h('th', null, 'Default gateway')),
      ...lab.addressing.map((r) => h('tr', null, h('td', null, r[0]), h('td', { class: 'mono' }, r[1]), h('td', { class: 'mono' }, r[2]), h('td', { class: 'mono' }, r[3] || ''))))) : null;
    const startBlocks = Object.keys(lab.start || {}).map((d) => codeBlock(configScript(lab.start[d]), d + ': paste into the CLI (from the Router>/Switch> prompt)'));
    const pka = 'pt/' + id + '.pka', pkt = 'pt/' + id + '.pkt';
    const build = h('section', { class: 'card stack', 'aria-labelledby': 'b-' + id },
      h('h2', { id: 'b-' + id, class: 'h-step' }, h('span', { class: 'n' }, '1'), 'Build it in Packet Tracer'),
      lab.scenario ? h('div', { html: lab.scenario }) : null,
      h('div', { class: 'note stack', style: { gap: '8px' } },
        h('div', null, h('strong', null, 'Ready-made files. '), 'Open ', h('code', null, 'srwe-study-lab/' + pka), ' in Packet Tracer 9 (File > Open): every device, cable and starting configuration below is already in it, the PCs are addressed, the tasks are in its instructions window, and ',
          h('b', null, 'Check Results'), ' scores your configuration. The ', h('code', null, '.pkt'), ' is the same network without the activity. Or build it yourself from the tables.'),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn small primary', href: pka, download: id + '.pka' }, App.icon('download', 14), 'Activity ' + id + '.pka'),
          h('a', { class: 'btn small', href: pkt, download: id + '.pkt' }, App.icon('download', 14), 'Network only (.pkt)'))),
      App.ptTopology(lab),
      h('div', null, h('h3', null, 'Devices'), h('div', { class: 'scroll' }, h('table', { class: 't small compact' }, h('tr', null, h('th', null, 'Name'), h('th', null, 'Packet Tracer model'), h('th', null, 'Notes')), ...deviceRows))),
      h('div', null, h('h3', null, 'Cabling'), h('div', { class: 'scroll' }, h('table', { class: 't small compact' }, h('tr', null, h('th', null, 'From'), h('th', null, 'To'), h('th', null, 'Cable')), ...linkRows))),
      addrTable ? h('div', null, h('h3', null, 'Addressing'), addrTable) : null,
      lab.ptNotes && lab.ptNotes.length ? h('div', { class: 'note' }, h('strong', null, 'Packet Tracer notes'), h('ul', { style: { margin: '6px 0 0', paddingLeft: '1.2em' } }, ...lab.ptNotes.map((n) => h('li', { html: n })))) : null,
      startBlocks.length ? h('div', { class: 'stack' }, h('h3', null, 'Starting configuration'),
        h('p', { class: 'small muted', style: { margin: 0 } }, 'The ready-made file already has these. If you build the lab yourself, give each device its name in Packet Tracer, then paste these lines into its CLI. They set up everything this lab is not about.'), ...startBlocks) : null);

    /* ---------- solution ---------- */
    const solBox = h('section', { class: 'card stack', hidden: true }, h('h3', null, 'Reference solution'),
      h('p', { class: 'small muted', style: { margin: 0 } }, 'Try on your own first. These are the commands that complete the configuration tasks. They are not the only correct way.'),
      ...Object.keys(lab.solution || {}).map((d) => codeBlock(lab.solution[d][0] === '#' ? lab.solution[d].slice(1) : configScript(lab.solution[d]), d)),
      lab.solutionNotes ? h('div', { class: 'small', html: lab.solutionNotes }) : null);
    const resetConfirm = h('div', { class: 'btn-row', hidden: true }, h('span', { class: 'small' }, 'Clear your pasted output and answers for this lab?'),
      h('button', { class: 'btn small danger', type: 'button', onclick: () => { delete st.labs[id]; App.save(true); App.render(); } }, 'Yes, clear'),
      h('button', { class: 'btn small', type: 'button', onclick: () => { resetConfirm.hidden = true; } }, 'Cancel'));

    const tasksCard = h('section', { class: 'card stack', 'aria-labelledby': 't-' + id },
      h('h2', { id: 't-' + id, class: 'h-step' }, h('span', { class: 'n' }, '2'), 'Tasks'),
      progress, doneBox, taskBox,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { solBox.hidden = !solBox.hidden; if (!solBox.hidden) solBox.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, App.icon('eye', 14), 'Solution'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { resetConfirm.hidden = false; } }, App.icon('reset', 14), 'Clear my output')), resetConfirm);

    /* ---------- check panel: one paste box per device ---------- */
    const collect = lab.collect || {};
    const tabIds = Object.keys(collect);
    const tabs = [];
    const tabBar = h('div', { class: 'term-bar paste-tabs', role: 'tablist', 'aria-label': 'Devices' });
    const tabBody = h('div', { class: 'paste-body' });
    let active = null;
    tabIds.forEach((dev) => {
      const d = lab.devices.find((x) => x.id === dev) || { id: dev, type: 'pc' };
      const ta = h('textarea', { class: 'input mono paste', id: 'paste-' + id + '-' + dev, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Output pasted from ' + dev, placeholder: isHost(d) ? 'C:\\>ipconfig /all\n…paste the Command Prompt text here' : dev + '#show running-config\n…paste the CLI text here' });
      ta.value = ls.pasted[dev] || '';
      const info = h('div', { class: 'small muted paste-info', 'aria-live': 'polite' });
      const led = App.led('');
      const btn = h('button', { class: 'term-tab', type: 'button', role: 'tab', id: 'tab-' + id + '-' + dev, 'aria-controls': 'panel-' + id + '-' + dev }, led, dev);
      const cmdList = h('div', { class: 'cmd-chips' }, ...(collect[dev] || []).map((c) => {
        const b = h('button', { class: 'chip', type: 'button', title: 'Copy “' + c + '”' }, App.icon('copy', 12), h('span', null, c));
        b.addEventListener('click', () => copyText(c, b));
        return b;
      }));
      const panel = h('div', { class: 'paste-panel', id: 'panel-' + id + '-' + dev, role: 'tabpanel', 'aria-labelledby': 'tab-' + id + '-' + dev, hidden: true },
        h('div', { class: 'small' }, isHost(d) ? h('span', null, 'On ', h('b', null, dev), ', open Desktop > Command Prompt and run:') : h('span', null, 'On ', h('b', null, dev), ', run in privileged EXEC mode:')),
        cmdList, ta, info,
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn small primary', type: 'button', onclick: () => { save(); evaluate(true); } }, App.icon('check', 14), 'Check my work'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { ta.value = ''; save(); evaluate(); ta.focus(); } }, 'Clear box')));
      let timer = null;
      function save() { ls.pasted[dev] = ta.value; if (!ta.value.trim()) delete ls.pasted[dev]; }
      ta.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { save(); evaluate(); }, 450); });
      const tab = {
        dev, btn, panel,
        refresh() {
          const txt = ta.value;
          info.innerHTML = '';
          if (!txt.trim()) { led.className = 'led'; info.textContent = 'Nothing pasted yet.'; return; }
          const s = PT.summary(txt);
          const warn = isHost(d) ? null : PT.hostWarning(dev, txt, dev);
          led.className = 'led ' + (warn ? 'red' : s.found.length ? 'on' : 'amber');
          if (warn) info.appendChild(h('span', { class: 'bad-text' }, App.icon('alert', 13), ' ' + warn + ' '));
          info.appendChild(h('span', null, s.found.length ? 'Found: ' + s.found.join(', ') + '.' : 'No output this checker can read yet. Did you paste the command lines too?'));
        },
      };
      btn.addEventListener('click', () => select(dev));
      tabs.push(tab);
      tabBar.appendChild(btn);
      tabBody.appendChild(panel);
    });
    function select(dev) {
      active = dev;
      for (const t of tabs) { const on = t.dev === dev; t.btn.classList.toggle('on', on); t.btn.setAttribute('aria-selected', on ? 'true' : 'false'); t.panel.hidden = !on; }
      try { sessionStorage.setItem('srwe-tab-' + id, dev); } catch (e) { /* ignore */ }
    }
    tabBar.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = tabIds.indexOf(active), j = (i + (e.key === 'ArrowRight' ? 1 : tabIds.length - 1)) % tabIds.length;
      select(tabIds[j]); tabs[j].btn.focus();
    });
    const check = h('section', { class: 'card stack check-panel', 'aria-labelledby': 'c-' + id },
      h('h2', { id: 'c-' + id, class: 'h-step' }, h('span', { class: 'n' }, '3'), 'Check your work'),
      h('p', { class: 'small muted', style: { margin: 0 } }, 'Paste the output from each device into its tab. Tasks light up green as soon as the output shows they are done.'),
      h('div', { class: 'paste-wrap' }, tabBar, tabBody), needBox, howToCopy(false));

    page.appendChild(h('div', { class: 'ptlab' },
      h('div', { class: 'ptlab-main' }, build, tasksCard, solBox),
      h('div', { class: 'ptlab-side' }, check)));
    let first = tabIds[0];
    try { const s = sessionStorage.getItem('srwe-tab-' + id); if (s && tabIds.includes(s)) first = s; } catch (e) { /* ignore */ }
    if (first) select(first);
    evaluate();
  });
})(typeof window !== 'undefined' ? window : globalThis);
