/* SRWE Study Lab — interactive "Understand" visuals, one function per widget id. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE;
  const App = SRWE.App;
  const h = App.h;
  /* small text and VLAN-list helpers (trunk allowed lists are kept as 'all', 'none' or "1-9,11-4094") */
  const U = {};
  U.pad = (s, n) => { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); };
  U.parseVlanList = (s) => {
    if (!/^[\d,\s-]+$/.test(s)) return null;
    const out = new Set();
    for (const part of s.split(',')) {
      const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim());
      if (!m) return null;
      const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
      if (a < 1 || b > 4094 || a > b) return null;
      for (let v = a; v <= b; v++) out.add(v);
    }
    return [...out].sort((x, y) => x - y);
  };
  U.specToRanges = (spec) => {
    if (spec === 'all') return [[1, 4094]];
    if (!spec || spec === 'none') return [];
    return spec.split(',').map((p) => { const [a, b] = p.split('-').map(Number); return [a, b === undefined ? a : b]; });
  };
  U.rangesToSpec = (rs) => {
    const s = rs.filter((r) => r[0] <= r[1]).map((r) => r.slice()).sort((x, y) => x[0] - y[0]);
    const m = [];
    for (const r of s) { if (m.length && r[0] <= m[m.length - 1][1] + 1) m[m.length - 1][1] = Math.max(m[m.length - 1][1], r[1]); else m.push(r); }
    if (!m.length) return 'none';
    if (m.length === 1 && m[0][0] === 1 && m[0][1] === 4094) return 'all';
    return m.map((r) => (r[0] === r[1] ? String(r[0]) : r[1] === r[0] + 1 ? r[0] + ',' + r[1] : r[0] + '-' + r[1])).join(',');
  };
  U.listToRanges = (list) => list.map((v) => [v, v]);
  U.specHas = (spec, v) => U.specToRanges(spec).some((r) => v >= r[0] && v <= r[1]);
  U.specUnion = (spec, list) => U.rangesToSpec(U.specToRanges(spec).concat(U.listToRanges(list)));
  U.specMinus = (spec, list) => {
    let rs = U.specToRanges(spec);
    for (const v of list) {
      const next = [];
      for (const [a, b] of rs) { if (v < a || v > b) next.push([a, b]); else { if (a <= v - 1) next.push([a, v - 1]); if (v + 1 <= b) next.push([v + 1, b]); } }
      rs = next;
    }
    return U.rangesToSpec(rs);
  };
  U.specExcept = (list) => U.specMinus('all', list);
  U.specDisplay = (spec) => (spec === 'all' ? '1-4094' : spec === 'none' ? 'none' : spec);
  const W = SRWE.Widgets = {};
  const reduced = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const box = (container, title, sub, ...kids) => { const el = h('section', { class: 'widget' }, h('div', { class: 'widget-head' }, h('h3', null, title), sub ? h('span', { class: 'muted' }, sub) : null), ...kids); container.appendChild(el); return el; };
  const seg = (labels, onPick, initial) => {
    const s = h('div', { class: 'seg', role: 'group' });
    labels.forEach((l, i) => s.appendChild(h('button', { type: 'button', class: i === (initial || 0) ? 'on' : '', 'aria-pressed': i === (initial || 0) ? 'true' : 'false', onclick: () => { [...s.children].forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); onPick(i, l); } }, l)));
    return s;
  };
  const select = (id, label, values, value, onChange) => h('div', { class: 'field' }, h('label', { for: id }, label),
    h('select', { class: 'input', id, onchange: (e) => onChange(e.target.value) }, ...values.map((v) => h('option', { value: v, selected: v === value ? 'selected' : null }, v))));
  SRWE.WidgetKit = { box, seg, select, U }; // shared with widgets2.js

  /* ------------------------------------------------ 1.1 boot sequence */
  W.boot = function (c) {
    const steps = [
      ['POST', 'ROM', 'Power-on self-test checks the CPU, DRAM and the part of flash that holds the file system.', 'POST: CPU, DRAM, flash ... passed'],
      ['Boot loader', 'ROM', 'The boot loader starts right after POST succeeds.', 'Boot loader started (C2960-HBOOT-M)'],
      ['CPU init', 'ROM', 'Registers that map physical memory, its size and speed are initialized.', 'Initializing CPU registers ... done'],
      ['Flash init', 'ROM', 'The flash file system on the system board is initialized.', 'Initializing flash file system ... done'],
      ['Load IOS', 'flash → RAM', 'The BOOT variable (or the first executable in flash) points to IOS, which is loaded into RAM and takes control. IOS then applies config.text.', 'Loading "flash:/c2960-lanbasek9-mz.150-2.SE7.bin" ... [OK]\nSwitch>'],
    ];
    let i = -1, timer = null;
    const track = h('div', { class: 'row', style: { gap: '6px', alignItems: 'stretch' } });
    const nodes = steps.map((s, k) => h('div', { class: 'card', style: { flex: '1 1 120px', padding: '10px 12px', minWidth: '110px' } },
      h('div', { class: 'row', style: { gap: '6px' } }, App.led(''), h('strong', null, (k + 1) + '. ' + s[0])), h('div', { class: 'small muted' }, s[1])));
    nodes.forEach((n) => track.appendChild(n));
    const info = h('p', { class: 'feedback info', style: { marginBottom: 0 } }, 'Press "Power on" to watch the five steps.');
    const con = h('pre', { class: 'out', style: { marginTop: '10px', minHeight: '6em' } });
    const bootVar = h('label', { class: 'row small' }, h('input', { type: 'checkbox', id: 'boot-var', checked: 'checked' }), 'BOOT variable is set (boot system flash:/…)');
    function paint() {
      nodes.forEach((n, k) => { n.querySelector('.led').className = 'led' + (k < i ? ' on' : k === i ? ' amber' : ''); n.style.borderColor = k === i ? 'var(--accent)' : ''; });
      if (i >= 0) {
        const s = steps[i];
        info.textContent = (i + 1) + '. ' + s[0] + ' (' + s[1] + '): ' + s[2];
        let line = s[3];
        if (i === 4 && !bootVar.querySelector('input').checked) line = 'BOOT variable not set: loading the first executable file found in flash ...\nLoading "flash:/c2960-lanbasek9-mz.150-2.SE7.bin" ... [OK]\nSwitch>';
        con.textContent = steps.slice(0, i).map((x) => x[3]).join('\n') + (i ? '\n' : '') + line;
      } else { con.textContent = ''; info.textContent = 'Press "Power on" to watch the five steps.'; }
    }
    const step = () => { if (i < steps.length - 1) { i++; paint(); } };
    const run = () => { clearInterval(timer); i = -1; paint(); if (reduced()) { i = steps.length - 1; paint(); return; } timer = setInterval(() => { step(); if (i >= steps.length - 1) clearInterval(timer); }, 900); };
    box(c, 'Boot sequence', 'what happens after you plug the switch in', track, h('div', { class: 'btn-row', style: { margin: '12px 0' } },
      h('button', { class: 'btn primary small', type: 'button', onclick: run }, App.icon('play', 14), 'Power on'),
      h('button', { class: 'btn small', type: 'button', onclick: () => { clearInterval(timer); step(); } }, 'Next step'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { clearInterval(timer); i = -1; paint(); } }, 'Reset'), bootVar), info, con);
    paint();
  };

  /* ------------------------------------------------ 1.1 LED panel */
  W.leds = function (c) {
    const MODES = ['STAT', 'DUPLX', 'SPEED', 'PoE'];
    const ports = [
      { stat: 'green', dup: 'full', spd: 100, poe: 'on' }, { stat: 'blink', dup: 'full', spd: 1000, poe: 'off' }, { stat: 'off', dup: null, spd: null, poe: 'off' },
      { stat: 'amber', dup: 'full', spd: 100, poe: 'off' }, { stat: 'green', dup: 'half', spd: 10, poe: 'off' }, { stat: 'alt', dup: 'full', spd: 100, poe: 'fault' },
      { stat: 'green', dup: 'full', spd: 100, poe: 'denied' }, { stat: 'green', dup: 'full', spd: 100, poe: 'disabled' },
    ];
    let mode = 0, sel = null;
    const led = (p) => {
      const m = MODES[mode];
      if (m === 'STAT') return { off: ['off', 'No link, or port shut down'], green: ['green', 'Link up'], blink: ['blink', 'Activity (sending or receiving)'], amber: ['amber', 'Port blocked to prevent a loop'], alt: ['alt', 'Link fault'] }[p.stat];
      if (m === 'DUPLX') return p.dup === 'full' ? ['green', 'Full duplex'] : p.dup === 'half' ? ['off', 'Half duplex'] : ['off', 'No link'];
      if (m === 'SPEED') return p.spd === 1000 ? ['blink', '1000 Mb/s'] : p.spd === 100 ? ['green', '100 Mb/s'] : p.spd === 10 ? ['off', '10 Mb/s'] : ['off', 'No link'];
      return { on: ['green', 'PoE on'], off: ['off', 'PoE off'], disabled: ['amber', 'PoE disabled'], fault: ['blinkamber', 'PoE off due to a fault'], denied: ['alt', 'PoE denied: power budget exceeded'] }[p.poe];
    };
    const svgBox = h('div');
    const info = h('div', { class: 'feedback info' }, 'Press MODE to change what the port LEDs mean, then click a port LED.');
    const fill = (k) => ({ green: '#3fb950', blink: '#3fb950', amber: '#e3b341', blinkamber: '#e3b341', alt: '#3fb950', off: '#2a3442' }[k]);
    function draw() {
      const sysLeds = [['SYST', '#3fb950'], ['RPS', '#2a3442']].concat(MODES.map((m, i) => [m, i === mode ? '#3fb950' : '#2a3442']));
      let s = '<svg class="wsvg narrow" viewBox="0 0 640 170" role="img" aria-label="Switch front panel in ' + MODES[mode] + ' mode"><rect x="2" y="2" width="636" height="166" rx="10" fill="#141b24" stroke="#33435a"/>';
      sysLeds.forEach(([n, col], i) => { const y = 24 + i * 22; s += '<circle cx="26" cy="' + y + '" r="6" fill="' + col + '"/><text x="40" y="' + (y + 5) + '" font-size="13" fill="#c9d4e0">' + n + '</text>'; });
      s += '<g class="modebtn" style="cursor:pointer"><rect x="110" y="128" width="54" height="26" rx="5" fill="#2a3442" stroke="#4b5b72"/><text x="137" y="146" text-anchor="middle" font-size="12" fill="#e6edf3" font-weight="600">MODE</text></g>';
      ports.forEach((p, i) => {
        const x = 220 + i * 50, [k] = led(p);
        const anim = !reduced() && (k === 'blink' || k === 'blinkamber') ? '<animate attributeName="opacity" values="1;0.15;1" dur="0.8s" repeatCount="indefinite"/>' : '';
        const alt = !reduced() && k === 'alt' ? '<animate attributeName="fill" values="#3fb950;#e3b341;#3fb950" dur="1s" repeatCount="indefinite"/>' : '';
        s += '<g class="pl" data-i="' + i + '" style="cursor:pointer"><rect x="' + (x - 18) + '" y="58" width="36" height="30" rx="3" fill="#0b0f15" stroke="' + (sel === i ? '#f5a524' : '#33435a') + '" stroke-width="' + (sel === i ? 2.5 : 1) + '"/>' +
          '<circle cx="' + x + '" cy="44" r="7" fill="' + fill(k) + '">' + anim + alt + '</circle><text x="' + x + '" y="108" text-anchor="middle" font-size="12" fill="#9eb0c4">' + (i + 1) + '</text></g>';
      });
      s += '</svg>';
      svgBox.innerHTML = s;
      svgBox.querySelector('.modebtn').addEventListener('click', cycle);
      svgBox.querySelectorAll('.pl').forEach((g) => g.addEventListener('click', () => { sel = Number(g.dataset.i); draw(); explain(); }));
    }
    function explain() {
      if (sel === null) { info.textContent = MODES[mode] + ' mode selected. Click a port LED to read it.'; return; }
      const [k, meaning] = led(ports[sel]);
      const look = { green: 'solid green', blink: 'blinking green', amber: 'amber', blinkamber: 'blinking amber', alt: 'alternating green/amber', off: 'off' }[k];
      info.textContent = 'Port ' + (sel + 1) + ' in ' + MODES[mode] + ' mode is ' + look + ': ' + meaning + '.';
    }
    function cycle() { mode = (mode + 1) % MODES.length; draw(); explain(); }
    box(c, 'Switch LED panel', 'the Mode button changes what the port LEDs mean', svgBox, h('div', { class: 'btn-row', style: { margin: '10px 0' } },
      h('button', { class: 'btn small primary', type: 'button', onclick: cycle }, 'Press MODE'), h('span', { class: 'small muted' }, 'Default mode after power-on: STAT')), info);
    draw();
  };

  /* ------------------------------------------------ 1.2 duplex / speed negotiation */
  /* IEEE 802.3 autonegotiation, as Cisco 10/100 ports behave: a port negotiates only when both speed and
   * duplex are auto. A negotiating port facing a fixed port detects the speed but falls back to half duplex. */
  function linkOper(a, b) {
    const neg = (x) => x.speed === 'auto' && x.duplex === 'auto';
    const sp = (x) => (x.speed === 'auto' ? '100' : x.speed);
    if (neg(a) && neg(b)) return { up: true, a: { speed: '100', duplex: 'full' }, b: { speed: '100', duplex: 'full' }, mismatch: false };
    if (!neg(a) && !neg(b) && sp(a) !== sp(b)) return { up: false };
    const speed = neg(a) ? sp(b) : sp(a);
    const dx = (x) => (neg(x) ? 'half' : x.duplex === 'auto' ? 'half' : x.duplex);
    const oa = { speed, duplex: dx(a) }, ob = { speed, duplex: dx(b) };
    return { up: true, a: oa, b: ob, mismatch: oa.duplex !== ob.duplex };
  }
  W.duplex = function (c) {
    const cfg = { a: { speed: 'auto', duplex: 'auto' }, b: { speed: 'auto', duplex: 'auto' } };
    const out = h('div');
    function evaluate() {
      const r = linkOper(cfg.a, cfg.b);
      const oa = r.a, ob = r.b;
      if (oa) oa.mismatch = r.mismatch;
      out.innerHTML = '';
      if (!r.up) { out.appendChild(h('div', { class: 'feedback bad' }, h('strong', null, 'Link down. '), 'Both ends are forced to different speeds, so no link comes up (down/down).')); return; }
      const mdix = cfg.a.speed === 'auto' && cfg.a.duplex === 'auto';
      out.append(
        h('div', { class: 'grid two' },
          h('div', { class: 'card' }, h('strong', null, 'SwitchA Fa0/1'), h('div', { class: 'mono' }, (oa.duplex === 'full' ? 'Full' : 'Half') + '-duplex, ' + oa.speed + 'Mb/s')),
          h('div', { class: 'card' }, h('strong', null, 'SwitchB Fa0/1'), h('div', { class: 'mono' }, (ob.duplex === 'full' ? 'Full' : 'Half') + '-duplex, ' + ob.speed + 'Mb/s'))),
        oa.mismatch
          ? h('div', { class: 'feedback bad' }, h('strong', null, 'Duplex mismatch. '), 'The link is up but slow. The half-duplex side counts collisions and late collisions; the full-duplex side counts CRC errors and runts. ',
            (cfg.a.speed === 'auto' && cfg.a.duplex === 'auto') !== (cfg.b.speed === 'auto' && cfg.b.duplex === 'auto') ? 'Only one side autonegotiates, so the other side cannot learn its duplex and falls back to half.' : '')
          : h('div', { class: 'feedback ok' }, h('strong', null, 'Healthy link. '), 'Both ends agree on speed and duplex.'),
        h('p', { class: 'small muted', style: { marginTop: '8px' } }, 'Auto-MDIX on SwitchA: ' + (mdix ? 'works (speed and duplex are auto)' : 'off, because speed or duplex is fixed') + '.'));
    }
    const side = (k, label) => h('div', { class: 'card stack' }, h('strong', null, label),
      select('dx-' + k + '-s', 'speed', ['auto', '10', '100'], cfg[k].speed, (v) => { cfg[k].speed = v; evaluate(); }),
      select('dx-' + k + '-d', 'duplex', ['auto', 'full', 'half'], cfg[k].duplex, (v) => { cfg[k].duplex = v; evaluate(); }));
    box(c, 'Speed and duplex negotiation', 'set both ends of a FastEthernet link', h('div', { class: 'grid two' }, side('a', 'SwitchA Fa0/1'), side('b', 'SwitchB Fa0/1')),
      h('p', { class: 'small muted', style: { margin: '10px 0' } }, 'Try forcing SwitchA to full / 100 and leaving SwitchB on auto: the classic duplex mismatch.'), out);
    evaluate();
  };

  /* ------------------------------------------------ 1.2 error counters */
  W.iferrors = function (c) {
    const S = [
      { name: 'Link A', c: { runts: 0, giants: 0, inErr: 0, crc: 0, outErr: 8, coll: 1790, late: 235, duplex: 'Half-duplex, 100Mb/s' }, a: 0 },
      { name: 'Link B', c: { runts: 2, giants: 0, inErr: 4127, crc: 4120, outErr: 0, coll: 0, late: 0, duplex: 'Full-duplex, 100Mb/s' }, a: 1 },
      { name: 'Link C', c: { runts: 9452, giants: 0, inErr: 9460, crc: 8, outErr: 0, coll: 0, late: 0, duplex: 'Full-duplex, 100Mb/s' }, a: 2 },
      { name: 'Link D', c: { runts: 0, giants: 0, inErr: 0, crc: 0, outErr: 0, coll: 0, late: 0, duplex: 'Full-duplex, 100Mb/s' }, a: 3 },
    ];
    const DX = ['Duplex mismatch (this end is half duplex)', 'Cabling or electrical noise', 'A malfunctioning NIC sending short frames', 'Healthy, nothing to fix'];
    const WHY = ['Collisions and late collisions on a link that should be full duplex point to a duplex mismatch (or an over-long cable).',
      'Thousands of CRC errors with almost no runts mean frames are damaged on the wire: check the cable, connectors and noise sources.',
      'Huge numbers of runts (frames under 64 bytes) are usually caused by a faulty NIC.', 'All error counters are zero and the port runs full duplex.'];
    let cur = 0;
    const pre = h('pre', { class: 'out' });
    const fb = h('div');
    const opts = h('div', { class: 'opts' });
    function show() {
      const k = S[cur].c;
      const hl = (txt, on) => (on ? '<span style="color:#ffb86b;font-weight:700">' + txt + '</span>' : txt);
      pre.innerHTML = 'S1# show interfaces fastEthernet 0/18\nFastEthernet0/18 is up, line protocol is up (connected)\n  ' + hl(k.duplex, k.duplex.startsWith('Half')) + ', media type is 10/100BaseTX\n' +
        '     ' + hl(k.runts + ' runts', k.runts > 0) + ', ' + k.giants + ' giants, 0 throttles\n' + '     ' + hl(k.inErr + ' input errors, ' + k.crc + ' CRC', k.inErr > 0) + ', 0 frame, 0 overrun, 0 ignored\n' +
        '     ' + hl(k.outErr + ' output errors, ' + k.coll + ' collisions', k.coll > 0) + ', 1 interface resets\n' + '     0 babbles, ' + hl(k.late + ' late collision', k.late > 0) + ', 0 deferred';
      fb.innerHTML = '';
      opts.innerHTML = '';
      DX.forEach((d, i) => opts.appendChild(h('button', { class: 'opt', type: 'button', onclick: () => {
        [...opts.children].forEach((b, j) => { b.disabled = true; if (j === S[cur].a) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
        fb.innerHTML = '';
        fb.appendChild(h('div', { class: 'feedback ' + (i === S[cur].a ? 'ok' : 'bad') }, h('strong', null, i === S[cur].a ? 'Correct. ' : 'Not this one. '), WHY[S[cur].a]));
      } }, h('span', { class: 'mark' }), h('span', null, d))));
    }
    box(c, 'Read the error counters', 'what is wrong with each link?', seg(S.map((s) => s.name), (i) => { cur = i; show(); }), h('div', { style: { height: '10px' } }), pre, opts, fb);
    show();
  };

  /* ------------------------------------------------ 1.3 Telnet vs SSH capture */
  W.telnetssh = function (c) {
    const pre = h('pre', { class: 'out', style: { minHeight: '11em' } });
    const note = h('div', { class: 'feedback' });
    const noise = (n) => { let s = ''; const ch = '!#$%&()*+-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~'; let x = 7; for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; s += i && i % 64 === 0 ? '\n' : ch[x % ch.length]; } return s; };
    function show(i) {
      if (i === 0) {
        pre.textContent = 'Wireshark · Follow TCP Stream (tcp.port == 23)\n\n\nUser Access Verification\n\nUsername: aaddmmiinn\nPassword: ccna\nS1>eennaabbllee\nPassword: class\nS1#sshhooww  rruunn';
        note.className = 'feedback bad'; note.innerHTML = '<strong>Telnet, TCP 23:</strong> the username, both passwords and every command are readable. (Typed characters appear twice because the switch echoes them.)';
      } else {
        pre.textContent = 'Wireshark · Follow TCP Stream (tcp.port == 22)\n\nSSH-2.0-Cisco-1.25\nSSH-2.0-PuTTY_Release_0.72\n' + noise(330);
        note.className = 'feedback ok'; note.innerHTML = '<strong>SSH, TCP 22:</strong> only the version banners are visible; credentials and commands are encrypted. An attacker can still see that a session exists between the two IP addresses.';
      }
    }
    box(c, 'What a packet capture sees', 'the same login over Telnet and SSH', seg(['Telnet', 'SSH'], show), h('div', { style: { height: '10px' } }), pre, note);
    show(0);
  };

  /* ------------------------------------------------ 1.3 SSH steps in order */
  W.sshorder = function (c) {
    const correct = [['show ip ssh', 'Verify SSH support'], ['ip domain-name cisco.com', 'Configure the IP domain'], ['crypto key generate rsa', 'Generate RSA keys (enables SSH)'],
      ['username admin secret ccna', 'Create a local user'], ['line vty 0 15 + transport input ssh + login local', 'Configure the vty lines'], ['ip ssh version 2', 'Enable SSH version 2']];
    let items = App.shuffle(correct.map((x, i) => ({ x, i })));
    const list = h('div', { class: 'order-list' });
    const fb = h('div');
    function draw(checked) {
      list.innerHTML = '';
      items.forEach((it, k) => list.appendChild(h('div', { class: 'order-item', style: checked ? { borderColor: it.i === k ? 'var(--ok)' : 'var(--bad)' } : null },
        h('span', { class: 'n' }, (k + 1) + '.'), h('span', { class: 'txt' }, h('code', null, it.x[0]), h('span', { class: 'small muted' }, '  ' + it.x[1])),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move up', disabled: k === 0, onclick: () => { [items[k - 1], items[k]] = [items[k], items[k - 1]]; draw(); } }, App.icon('up', 16)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move down', disabled: k === items.length - 1, onclick: () => { [items[k + 1], items[k]] = [items[k], items[k + 1]]; draw(); } }, App.icon('down', 16)))));
    }
    box(c, 'Put the SSH configuration in order', 'the six steps from topic 1.3.4', list, h('div', { class: 'btn-row', style: { marginTop: '10px' } },
      h('button', { class: 'btn small primary', type: 'button', onclick: () => { const ok = items.every((it, k) => it.i === k); draw(true); fb.innerHTML = ''; fb.appendChild(h('div', { class: 'feedback ' + (ok ? 'ok' : 'bad') }, ok ? 'Correct order. The hostname must already be set before you start.' : 'Not yet. Red rows are in the wrong position. Hint: RSA keys need the domain name first.')); } }, 'Check order'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { items = App.shuffle(items); fb.innerHTML = ''; draw(); } }, App.icon('shuffle', 14), 'Shuffle')), fb);
    draw();
  };

  /* ------------------------------------------------ 1.4 when is a router interface usable? */
  W.ifready = function (c) {
    const s = { ip: true, noshut: false, cable: true, peer: true };
    const out = h('div');
    const toggles = [['ip', 'IP address configured'], ['noshut', 'no shutdown entered'], ['cable', 'Cable connected'], ['peer', 'Device at the other end is on and enabled']];
    function evaluate() {
      let status, proto, why;
      if (!s.noshut) { status = 'administratively down'; proto = 'down'; why = 'Router interfaces are shut down by default. Enter no shutdown.'; }
      else if (!s.cable || !s.peer) { status = 'down'; proto = 'down'; why = !s.cable ? 'No cable: the physical layer has no carrier.' : 'The other end is off or shut down, so there is no carrier.'; }
      else { status = 'up'; proto = 'up'; why = s.ip ? 'Up/up with an address: the interface forwards traffic.' : 'Up/up, but with no IP address it cannot route IPv4.'; }
      const routes = status === 'up' && s.ip ? 'C  192.168.10.0/24 is directly connected, GigabitEthernet0/0/0\nL  192.168.10.1/32 is directly connected, GigabitEthernet0/0/0' : '(no connected or local route for this interface)';
      out.innerHTML = '';
      out.append(h('pre', { class: 'out' }, 'R1# show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\n' +
        U.pad('GigabitEthernet0/0/0', 23) + U.pad(s.ip ? '192.168.10.1' : 'unassigned', 16) + 'YES ' + U.pad(s.ip ? 'manual' : 'unset', 7) + U.pad(status, 22) + proto + '\n\nR1# show ip route | include 0/0/0\n' + routes),
        h('div', { class: 'feedback ' + (status === 'up' && s.ip ? 'ok' : 'info') }, why));
    }
    box(c, 'When does a router interface work?', 'toggle the conditions', h('div', { class: 'row' }, ...toggles.map(([k, l]) => h('label', { class: 'row small', style: { gap: '6px' } },
      h('input', { type: 'checkbox', id: 'ifr-' + k, checked: s[k] ? 'checked' : null, onchange: (e) => { s[k] = e.target.checked; evaluate(); } }), l))), h('div', { style: { height: '10px' } }), out);
    evaluate();
  };

  /* ------------------------------------------------ 1.5 status decoder */
  W.ifstatus = function (c) {
    const cases = [
      ['up', 'up', 'ok', 'Working. Layer 1 has a carrier and Layer 2 keepalives are received.'],
      ['up', 'down', 'bad', 'Layer 1 is fine but Layer 2 fails: encapsulation mismatch, the far end is error-disabled, or a hardware problem.'],
      ['down', 'down', 'bad', 'No carrier: cable unplugged or faulty, or the far end is shut down. Check cables first.'],
      ['administratively down', 'down', 'info', 'Someone entered shutdown. Use no shutdown (router interfaces start like this).'],
    ];
    const out = h('div');
    const show = (i) => { const k = cases[i]; out.innerHTML = ''; out.append(h('pre', { class: 'out' }, 'GigabitEthernet0/0/1 is ' + k[0] + ', line protocol is ' + k[1]), h('div', { class: 'feedback ' + k[2] }, k[3])); };
    box(c, 'Decode the status line', 'first parameter = Layer 1, second = Layer 2', seg(cases.map((k) => k[0] + ' / ' + k[1]), show), h('div', { style: { height: '10px' } }), out);
    show(0);
  };

  /* ------------------------------------------------ 1.5 routing table reader */
  W.routetable = function (c) {
    const lines = [
      ['R1# show ip route', ''],
      ['Codes: L - local, C - connected, S - static, O - OSPF ...', 'The legend: L and C are the two codes created by active interfaces.'],
      ['Gateway of last resort is not set', 'No default route is configured, so packets to unknown networks are dropped.'],
      ['      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks', 'Header for the classful network: it contains a /24 and a /32, so two masks.'],
      ['C        192.168.10.0/24 is directly connected, GigabitEthernet0/0/0', 'C = connected route: the network on an up/up interface with an IPv4 address.'],
      ['L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/0', 'L = local route: the router\'s own address as a /32 host route, administrative distance 0. It lets the router process packets sent to itself.'],
      ['R1# show ipv6 route', ''],
      ['C   2001:DB8:ACAD:1::/64 [0/0]', 'IPv6 connected route: the prefix of the global unicast address. [0/0] = administrative distance / metric.'],
      ['     via GigabitEthernet0/0/0, directly connected', 'Exit interface for that prefix.'],
      ['L   2001:DB8:ACAD:1::1/128 [0/0]', 'IPv6 local route: the interface address as a /128.'],
      ['L   FF00::/8 [0/0]', 'Multicast range, always shown as a local route via Null0.'],
    ];
    const info = h('div', { class: 'feedback info' }, 'Click a line to see what it means.');
    const pre = h('div', { class: 'out', style: { background: 'var(--term-bg)', color: 'var(--term-fg)', borderRadius: '8px', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', overflowX: 'auto' } });
    lines.forEach(([l, ex]) => {
      const d = h('div', { style: { whiteSpace: 'pre', cursor: ex ? 'pointer' : 'default', borderRadius: '4px', padding: '1px 4px' }, tabindex: ex ? '0' : null, role: ex ? 'button' : null }, l);
      if (ex) {
        const pick = () => { [...pre.children].forEach((x) => { x.style.background = ''; }); d.style.background = 'rgba(245,165,36,0.18)'; info.textContent = ex; };
        d.addEventListener('click', pick);
        d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      }
      pre.appendChild(d);
    });
    box(c, 'Read a routing table', 'click any line', pre, h('div', { style: { height: '10px' } }), info);
  };

  /* ------------------------------------------------ 2.1 MAC learning simulator */
  W.maclearn = function (c) {
    const hosts = [{ n: 'A', mac: '00aa.aaaa.aaaa', port: 1, x: 110, y: 250 }, { n: 'B', mac: '00bb.bbbb.bbbb', port: 2, x: 250, y: 250 },
      { n: 'C', mac: '00cc.cccc.cccc', port: 3, x: 390, y: 250 }, { n: 'D', mac: '00dd.dddd.dddd', port: 4, x: 500, y: 300 }, { n: 'E', mac: '00ee.eeee.eeee', port: 4, x: 620, y: 300 }];
    const SW = { x: 330, y: 80 }, HUB = { x: 560, y: 190 };
    const portXY = (p) => p === 4 ? HUB : hosts.find((x) => x.port === p);
    let table = [], clock = 0, src = 'A', dst = 'C';
    const log = h('ol', { class: 'small', style: { margin: '8px 0 0', paddingLeft: '1.2em' } });
    const svgBox = h('div');
    const tbl = h('div');
    function draw(active) {
      active = active || {};
      let s = '<svg class="wsvg narrow" viewBox="0 0 720 360" role="img" aria-label="Switch with hosts A to E">';
      hosts.forEach((ho) => {
        const p = ho.port === 4 ? HUB : null;
        const from = p || SW;
        const hot = active.lines && active.lines.indexOf(ho.n) >= 0;
        s += '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + ho.x + '" y2="' + ho.y + '" stroke="' + (hot ? '#f5a524' : 'var(--line-2)') + '" stroke-width="' + (hot ? 4 : 2) + '"/>';
      });
      const hubHot = active.lines && active.lines.indexOf('hub') >= 0;
      s += '<line x1="' + SW.x + '" y1="' + SW.y + '" x2="' + HUB.x + '" y2="' + HUB.y + '" stroke="' + (hubHot ? '#f5a524' : 'var(--line-2)') + '" stroke-width="' + (hubHot ? 4 : 2) + '"/>';
      s += '<g transform="translate(' + SW.x + ' ' + SW.y + ')"><rect x="-60" y="-24" width="120" height="48" rx="8" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/><text y="6" text-anchor="middle" font-size="17" font-weight="600" fill="var(--text)">S1</text></g>';
      [1, 2, 3, 4].forEach((p) => { const t = portXY(p); const f = 0.5; const mx = SW.x + (t.x - SW.x) * f, my = SW.y + (t.y - SW.y) * f; s += '<text x="' + (mx + 8) + '" y="' + (my - 4) + '" font-size="13" fill="var(--text-2)">Fa0/' + p + '</text>'; });
      s += '<g transform="translate(' + HUB.x + ' ' + HUB.y + ')"><rect x="-34" y="-16" width="68" height="32" rx="5" fill="var(--surface-2)" stroke="var(--line-2)"/><text y="5" text-anchor="middle" font-size="14" fill="var(--text-2)">hub</text></g>';
      hosts.forEach((ho) => {
        const role = active.src === ho.n ? '#f5a524' : (active.recv || []).indexOf(ho.n) >= 0 ? '#3fb950' : 'var(--line-2)';
        s += '<g transform="translate(' + ho.x + ' ' + ho.y + ')"><rect x="-26" y="-20" width="52" height="34" rx="4" fill="var(--surface-2)" stroke="' + role + '" stroke-width="2.5"/>' +
          '<text y="3" text-anchor="middle" font-size="16" font-weight="700" fill="var(--text)">' + ho.n + '</text><text y="34" text-anchor="middle" font-size="12" fill="var(--text-2)">' + ho.mac + '</text></g>';
      });
      s += '</svg>';
      svgBox.innerHTML = s;
      tbl.innerHTML = '';
      tbl.appendChild(h('table', { class: 't small' }, h('tr', null, h('th', null, 'VLAN'), h('th', null, 'MAC address'), h('th', null, 'Port'), h('th', null, 'Age (s)')),
        ...(table.length ? table.map((r) => h('tr', { style: r.fresh ? { background: 'var(--accent-soft)' } : null }, h('td', null, '1'), h('td', { class: 'mono' }, r.mac), h('td', null, 'Fa0/' + r.port), h('td', { class: 'kv' }, String(clock - r.t))))
          : [h('tr', null, h('td', { colspan: '4', class: 'muted' }, 'Empty: the switch has not seen any frames yet.'))])));
    }
    function send() {
      const S = hosts.find((x) => x.n === src);
      const isB = dst === 'broadcast';
      const D = isB ? null : hosts.find((x) => x.n === dst);
      if (D && D.n === S.n) { App.toast('Pick a different destination.'); return; }
      log.innerHTML = '';
      table.forEach((r) => { r.fresh = false; });
      const steps = [];
      // hub repeats to everything on its segment first
      const lines = [S.n];
      if (S.port === 4) { lines.push('hub'); steps.push('The hub repeats the frame out every hub port, so ' + hosts.filter((x) => x.port === 4 && x.n !== S.n).map((x) => x.n).join(', ') + ' sees it too, and S1 receives it on Fa0/4.'); }
      const ex = table.find((r) => r.mac === S.mac);
      if (ex) { ex.t = clock; ex.port = S.port; ex.fresh = true; steps.push('Learn: ' + S.mac + ' is already in the table on Fa0/' + S.port + ', so its age is reset to 0 (aging time 5 minutes).'); }
      else { table.push({ mac: S.mac, port: S.port, t: clock, fresh: true }); steps.push('Learn: S1 adds the source MAC ' + S.mac + ' on ingress port Fa0/' + S.port + '.'); }
      let recv = [];
      if (isB) {
        recv = hosts.filter((x) => x.n !== S.n).map((x) => x.n);
        steps.push('Forward: the destination is the broadcast FFFF.FFFF.FFFF, so S1 floods it out every port except Fa0/' + S.port + '.');
        hosts.forEach((x) => { if (x.port !== S.port) lines.push(x.n); });
        if (S.port !== 4) lines.push('hub');
      } else {
        const known = table.find((r) => r.mac === D.mac);
        if (!known) {
          steps.push('Forward: ' + D.mac + ' is not in the table (unknown unicast), so S1 floods the frame out every port except Fa0/' + S.port + '.');
          recv = hosts.filter((x) => x.port !== S.port).map((x) => x.n);
          hosts.forEach((x) => { if (x.port !== S.port) lines.push(x.n); });
          if (S.port !== 4) lines.push('hub');
          steps.push('Only ' + D.n + ' accepts it; the other hosts see a different destination MAC and drop it.');
        } else if (known.port === S.port) {
          steps.push('Filter: ' + D.mac + ' is on Fa0/' + known.port + ', the same port the frame came in on, so S1 drops it. (' + D.n + ' already got it from the hub.)');
          recv = [D.n];
        } else {
          steps.push('Forward: ' + D.mac + ' is known on Fa0/' + known.port + ', so S1 sends the frame out that port only.');
          recv = [D.n];
          lines.push(known.port === 4 ? 'hub' : D.n);
          if (known.port === 4) { lines.push(D.n); hosts.forEach((x) => { if (x.port === 4) lines.push(x.n); }); }
        }
      }
      steps.forEach((t) => log.appendChild(h('li', null, t)));
      draw({ src: S.n, recv, lines });
    }
    const srcSel = select('ml-src', 'Source', hosts.map((x) => x.n), src, (v) => { src = v; });
    const dstSel = select('ml-dst', 'Destination', hosts.map((x) => x.n).concat(['broadcast']), dst, (v) => { dst = v; });
    box(c, 'MAC address learning', 'send frames and watch S1 learn and decide', h('div', { class: 'stack' },
      h('div', null, svgBox, h('div', { class: 'row', style: { marginTop: '8px' } }, srcSel, dstSel,
        h('div', { class: 'btn-row', style: { alignSelf: 'flex-end' } }, h('button', { class: 'btn primary small', type: 'button', onclick: send }, App.icon('play', 14), 'Send frame'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { clock += 300; table = table.filter((r) => clock - r.t < 300); log.innerHTML = ''; log.appendChild(h('li', null, '5 minutes pass without traffic: entries older than 300 seconds age out.')); draw(); } }, '+5 min'),
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { table = []; log.innerHTML = ''; draw(); } }, 'Clear table')))),
      h('div', { class: 'grid two', style: { alignItems: 'start' } }, h('div', null, h('strong', null, 'MAC address table (CAM)'), tbl), h('div', null, h('strong', null, 'What happened'), log))));
    draw();
  };

  /* ------------------------------------------------ 2.1 forwarding methods */
  W.fwdmethods = function (c) {
    const FR = [['Preamble', 8], ['Dst MAC', 6], ['Src MAC', 6], ['Type', 2], ['Data', 46], ['FCS', 4]];
    const total = 72;
    const cases = { normal: 'Normal 72-byte frame', crc: 'Frame with a CRC error', runt: 'Runt (collision fragment, 40 bytes)' };
    let kind = 'normal';
    const methods = [
      ['Cut-through', 14, 'Forwards as soon as the destination MAC has arrived.'],
      ['Fragment-free', 64, 'Waits for the first 64 bytes: collision fragments (runts) never get that far.'],
      ['Store-and-forward', 72, 'Waits for the whole frame and checks the FCS before forwarding.'],
    ];
    const out = h('div');
    function draw() {
      const W_ = 640, sc = W_ / total;
      let s = '<svg class="wsvg" viewBox="0 0 680 230" role="img" aria-label="Frame layout with decision points"><g transform="translate(20 20)">';
      let x = 0;
      FR.forEach(([n, b], i) => {
        const w = b * sc;
        const bad = (kind === 'crc' && n === 'FCS') || (kind === 'runt' && x / sc >= 40);
        s += '<rect x="' + x + '" y="0" width="' + w + '" height="40" fill="' + (bad ? 'var(--bad-soft)' : i % 2 ? 'var(--surface-2)' : 'var(--surface)') + '" stroke="var(--line-2)"/><text x="' + (x + w / 2) + '" y="25" text-anchor="middle" font-size="12" fill="var(--text)">' + n + '</text>';
        x += w;
      });
      if (kind === 'runt') s += '<rect x="' + (40 * sc) + '" y="-4" width="' + ((total - 40) * sc) + '" height="48" fill="var(--bg)" opacity="0.75"/><text x="' + (56 * sc) + '" y="25" text-anchor="middle" font-size="12" fill="var(--bad)">frame ends at 40 bytes</text>';
      methods.forEach(([n, at], i) => {
        const px = at * sc, y = 70 + i * 48;
        s += '<line x1="' + px + '" y1="0" x2="' + px + '" y2="' + y + '" stroke="var(--accent)" stroke-dasharray="4 3"/><circle cx="' + px + '" cy="' + y + '" r="5" fill="var(--accent)"/>' +
          '<text x="' + (px > 400 ? px - 10 : px + 10) + '" y="' + (y + 5) + '" text-anchor="' + (px > 400 ? 'end' : 'start') + '" font-size="13" fill="var(--text)">' + n + ' decides after byte ' + at + '</text>';
      });
      s += '</g></svg>';
      out.innerHTML = s;
      const res = methods.map(([n, at, d]) => {
        let r;
        if (kind === 'normal') r = ['ok', 'Forwarded. Latency: waits for ' + at + ' bytes.'];
        else if (kind === 'crc') r = n === 'Store-and-forward' ? ['ok', 'Dropped: the FCS check fails, so the bad frame never reaches the network.'] : ['bad', 'Forwarded with the error: it decides before the FCS arrives.'];
        else r = n === 'Cut-through' ? ['bad', 'Starts forwarding a fragment that will never be complete.'] : ['ok', 'Dropped: fewer than 64 bytes ever arrive.'];
        return h('div', { class: 'feedback ' + r[0] }, h('strong', null, n + ': '), r[1], h('div', { class: 'small muted' }, d));
      });
      out.append(...res);
    }
    box(c, 'Forwarding methods', 'when does each method decide?', seg(Object.values(cases), (i) => { kind = Object.keys(cases)[i]; draw(); }), h('div', { style: { height: '10px' } }), out);
    draw();
  };

  /* ------------------------------------------------ 2.2 count the domains */
  W.domains = function (c) {
    const S = [
      { name: 'Hub', desc: 'Four PCs on one hub.', svg: 'hub', coll: 1, bc: 1, why: 'A hub repeats every signal out of every port: one shared collision domain, one broadcast domain.' },
      { name: 'Switch', desc: 'Four PCs on one switch.', svg: 'switch', coll: 4, bc: 1, why: 'Each switch port is its own collision domain (and with full duplex there are no collisions at all). The switch floods broadcasts, so it is one broadcast domain.' },
      { name: 'Router + 2 switches', desc: 'A router with two interfaces, each to a switch with three PCs.', svg: 'router', coll: 8, bc: 2, why: 'Each switch has 3 PC links + 1 uplink = 4 collision domains, so 8 in total. Each router interface ends a broadcast domain: 2.' },
      { name: 'Switch + hub', desc: 'A switch with two PCs and a hub (with three PCs) on a third port.', svg: 'mixed', coll: 3, bc: 1, why: 'Two PC links plus the whole hub segment = 3 collision domains. No router, so 1 broadcast domain.' },
    ];
    let cur = 0;
    const pic = h('div');
    const fb = h('div');
    const ci = h('input', { class: 'input', type: 'number', min: '0', id: 'dom-c', style: { width: '90px' } });
    const bi = h('input', { class: 'input', type: 'number', min: '0', id: 'dom-b', style: { width: '90px' } });
    const node = (x, y, kind, label) => {
      if (kind === 'pc') return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-16" y="-12" width="32" height="22" rx="3" fill="var(--surface-2)" stroke="var(--line-2)"/></g>';
      const shape = kind === 'router' ? '<circle r="22" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>' : '<rect x="-30" y="-15" width="60" height="30" rx="5" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/>';
      return '<g transform="translate(' + x + ' ' + y + ')">' + shape + '<text y="5" text-anchor="middle" font-size="13" fill="var(--text)">' + label + '</text></g>';
    };
    const ln = (a, b) => '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="var(--line-2)" stroke-width="2"/>';
    function picture(k) {
      let s = '<svg class="wsvg" viewBox="0 0 640 220" role="img" aria-label="' + S[k].desc + '">';
      const fan = (cx, cy, n, y2, kind) => { let o = ''; for (let i = 0; i < n; i++) { const x = cx + (i - (n - 1) / 2) * 70; o += ln([cx, cy], [x, y2]) + node(x, y2, 'pc'); } return o; };
      if (S[k].svg === 'hub') s += fan(320, 60, 4, 170) + node(320, 60, 'sw', 'Hub');
      if (S[k].svg === 'switch') s += fan(320, 60, 4, 170) + node(320, 60, 'sw', 'Switch');
      if (S[k].svg === 'router') s += ln([320, 40], [170, 110]) + ln([320, 40], [470, 110]) + fan(170, 110, 3, 190) + fan(470, 110, 3, 190) + node(320, 40, 'router', 'R1') + node(170, 110, 'sw', 'S1') + node(470, 110, 'sw', 'S2');
      if (S[k].svg === 'mixed') s += ln([220, 50], [420, 120]) + fan(220, 50, 2, 160) + fan(420, 120, 3, 195) + node(220, 50, 'sw', 'Switch') + node(420, 120, 'sw', 'Hub');
      return s + '</svg>';
    }
    function show() { pic.innerHTML = picture(cur); fb.innerHTML = ''; ci.value = ''; bi.value = ''; }
    box(c, 'Count the domains', 'count each switch or router port link as its own collision domain, as CCNA exams do',
      seg(S.map((x) => x.name), (i) => { cur = i; show(); }), h('p', { class: 'small muted', style: { margin: '8px 0' } }, 'Choose a network, then enter your counts.'), pic,
      h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { for: 'dom-c' }, 'Collision domains'), ci, h('label', { for: 'dom-b' }, 'Broadcast domains'), bi,
        h('button', { class: 'btn small primary', type: 'button', onclick: () => {
          const ok = Number(ci.value) === S[cur].coll && Number(bi.value) === S[cur].bc;
          fb.innerHTML = '';
          fb.appendChild(h('div', { class: 'feedback ' + (ok ? 'ok' : 'bad') }, h('strong', null, ok ? 'Correct. ' : 'Answer: ' + S[cur].coll + ' collision, ' + S[cur].bc + ' broadcast. '), S[cur].why));
        } }, 'Check')), fb);
    show();
  };

  /* ------------------------------------------------ 3.1 / 3.2 who hears the broadcast */
  W.vlanbcast = function (c) {
    const pcs = [{ n: 'PC1', v: 10, sw: 'S2', x: 70, y: 250 }, { n: 'PC2', v: 20, sw: 'S2', x: 170, y: 290 }, { n: 'PC3', v: 30, sw: 'S2', x: 270, y: 250 },
      { n: 'PC4', v: 10, sw: 'S3', x: 450, y: 250 }, { n: 'PC5', v: 20, sw: 'S3', x: 550, y: 290 }, { n: 'PC6', v: 30, sw: 'S3', x: 650, y: 250 }];
    const SW = { S1: [360, 50], S2: [170, 150], S3: [550, 150] };
    const VC = { 10: '#388bfd', 20: '#e09b1a', 30: '#a371f7' };
    let vlans = true, block20 = false, from = null;
    const svgBox = h('div');
    const fb = h('div', { class: 'feedback info' }, 'Click a PC to send a broadcast (for example an ARP request).');
    function draw() {
      const src = pcs.find((p) => p.n === from);
      const hears = (p) => src && p !== src && (!vlans || (p.v === src.v && !(block20 && src.v === 20 && p.sw !== src.sw)));
      let s = '<svg class="wsvg narrow" viewBox="0 0 720 340" role="img" aria-label="Three switches with six PCs">';
      const trunkHot = (a) => src && vlans && !(block20 && src.v === 20 && a === 'S3') && pcs.some((p) => hears(p) && (p.sw === a || src.sw === a));
      [['S1', 'S2'], ['S1', 'S3']].forEach(([a, b]) => {
        const hot = src && (!vlans ? true : (trunkHot(b) || (src.sw === b)) && pcs.some((p) => hears(p) && p.sw !== src.sw));
        s += '<line x1="' + SW[a][0] + '" y1="' + SW[a][1] + '" x2="' + SW[b][0] + '" y2="' + SW[b][1] + '" stroke="' + (hot ? (vlans ? VC[src.v] : '#f5a524') : 'var(--line-2)') + '" stroke-width="7" stroke-linecap="round"/>' +
          '<line x1="' + SW[a][0] + '" y1="' + SW[a][1] + '" x2="' + SW[b][0] + '" y2="' + SW[b][1] + '" stroke="var(--surface)" stroke-width="2"/>';
        if (hot && vlans) { const mx = (SW[a][0] + SW[b][0]) / 2, my = (SW[a][1] + SW[b][1]) / 2; s += '<rect x="' + (mx - 46) + '" y="' + (my - 30) + '" width="92" height="22" rx="4" fill="var(--bg)" stroke="' + VC[src.v] + '"/><text x="' + mx + '" y="' + (my - 14) + '" text-anchor="middle" font-size="12" fill="var(--text)">802.1Q tag ' + src.v + '</text>'; }
      });
      pcs.forEach((p) => {
        const hot = src && (p === src || hears(p));
        s += '<line x1="' + SW[p.sw][0] + '" y1="' + SW[p.sw][1] + '" x2="' + p.x + '" y2="' + p.y + '" stroke="' + (hot ? (vlans ? VC[p.v] : '#f5a524') : 'var(--line-2)') + '" stroke-width="' + (hot ? 4 : 2) + '"/>';
      });
      Object.keys(SW).forEach((k) => { s += '<g transform="translate(' + SW[k][0] + ' ' + SW[k][1] + ')"><rect x="-32" y="-16" width="64" height="32" rx="6" fill="var(--surface-2)" stroke="var(--line-2)" stroke-width="1.6"/><text y="5" text-anchor="middle" font-size="15" font-weight="600" fill="var(--text)">' + k + '</text></g>'; });
      pcs.forEach((p) => {
        const role = src && p === src ? '#f5a524' : hears(p) ? '#3fb950' : 'var(--line-2)';
        s += '<g class="pcn" data-n="' + p.n + '" style="cursor:pointer" transform="translate(' + p.x + ' ' + p.y + ')"><rect x="-30" y="-18" width="60" height="34" rx="4" fill="var(--surface-2)" stroke="' + role + '" stroke-width="3"/>' +
          '<text y="0" text-anchor="middle" font-size="13" font-weight="600" fill="var(--text)">' + p.n + '</text>' + (vlans ? '<circle cx="-19" cy="9" r="4" fill="' + VC[p.v] + '"/>' : '') + '<text x="4" y="13" text-anchor="middle" font-size="11" fill="var(--text)">' + (vlans ? 'VLAN ' + p.v : 'no VLANs') + '</text></g>';
      });
      s += '<text x="360" y="105" text-anchor="middle" font-size="12" fill="var(--text-2)">thick lines = trunks</text></svg>';
      svgBox.innerHTML = s;
      svgBox.querySelectorAll('.pcn').forEach((g) => g.addEventListener('click', () => { from = g.dataset.n; draw(); explain(); }));
    }
    function explain() {
      const src = pcs.find((p) => p.n === from);
      if (!src) return;
      const heard = pcs.filter((p) => p !== src && (!vlans || (p.v === src.v && !(block20 && src.v === 20 && p.sw !== src.sw)))).map((p) => p.n);
      fb.className = 'feedback ' + (vlans ? 'ok' : 'bad');
      fb.textContent = !vlans ? src.n + '\'s broadcast reaches every PC (' + heard.join(', ') + '): one big broadcast domain.' :
        src.n + ' is in VLAN ' + src.v + '. Its broadcast stays in VLAN ' + src.v + (heard.length ? ' and reaches ' + heard.join(', ') : ', and no other host receives it') + '. ' +
        (block20 && src.v === 20 ? 'VLAN 20 is not allowed on the S1–S3 trunk, so PC5 does not hear it. ' : 'On the trunks the frame carries an 802.1Q tag with VLAN ' + src.v + '; the access ports remove the tag. ');
    }
    box(c, 'Who hears the broadcast?', 'VLANs contain broadcasts; trunks carry them between switches', h('div', { class: 'row' },
      h('label', { class: 'row small' }, h('input', { type: 'checkbox', id: 'vb-on', checked: 'checked', onchange: (e) => { vlans = e.target.checked; draw(); explain(); } }), 'VLANs configured'),
      h('label', { class: 'row small' }, h('input', { type: 'checkbox', id: 'vb-20', onchange: (e) => { block20 = e.target.checked; draw(); explain(); } }), 'VLAN 20 not allowed on the S1–S3 trunk')),
    svgBox, fb);
    draw();
  };

  /* ------------------------------------------------ 3.2 802.1Q tag builder */
  W.dot1q = function (c) {
    let vid = 10, pri = 0;
    const out = h('div');
    const bits = (n, w) => n.toString(2).padStart(w, '0');
    function draw() {
      out.innerHTML = '';
      if (!(vid >= 1 && vid <= 4094)) { out.appendChild(h('div', { class: 'feedback bad' }, 'VLAN IDs 0 and 4095 are reserved. Usable IDs: 1–4094.')); return; }
      const tci = (pri << 13) | vid;
      const hex = ['81', '00', ((tci >> 8) & 255).toString(16).padStart(2, '0').toUpperCase(), (tci & 255).toString(16).padStart(2, '0').toUpperCase()];
      const field = (name, val, b, color) => h('div', { style: { border: '1px solid var(--line-2)', borderRadius: '6px', padding: '8px', minWidth: '0', background: color } },
        h('div', { class: 'small', style: { fontWeight: 600 } }, name), h('div', { class: 'mono small' }, val), h('div', { class: 'bits', style: { marginTop: '4px' } }, ...b.split('').map((x) => h('span', null, x))));
      out.append(
        h('div', { class: 'small muted', style: { margin: '4px 0' } }, 'Untagged frame:'),
        h('div', { class: 'row mono small', style: { gap: '4px' } }, ...['Dst MAC (6)', 'Src MAC (6)', 'Type/Len (2)', 'Data', 'FCS (4)'].map((x) => h('span', { class: 'pill' }, x))),
        h('div', { class: 'small muted', style: { margin: '10px 0 4px' } }, 'Tagged on the trunk (FCS recalculated):'),
        h('div', { class: 'row mono small', style: { gap: '4px' } }, h('span', { class: 'pill' }, 'Dst MAC'), h('span', { class: 'pill' }, 'Src MAC'), h('span', { class: 'pill accent' }, '802.1Q tag (4)'), h('span', { class: 'pill' }, 'Type/Len'), h('span', { class: 'pill' }, 'Data'), h('span', { class: 'pill warn' }, 'new FCS')),
        h('div', { class: 'grid four', style: { marginTop: '12px' } },
          field('Type / TPID', '0x8100 · 2 bytes', bits(0x8100, 16), null), field('Priority (CoS)', String(pri) + ' · 3 bits', bits(pri, 3), null),
          field('CFI', '0 · 1 bit', '0', null), field('VLAN ID', String(vid) + ' · 12 bits', bits(vid, 12), 'var(--accent-soft)')),
        h('p', { style: { marginTop: '10px' } }, 'The 4 tag bytes on the wire: ', h('code', null, hex.join(' '))));
    }
    const vi = h('input', { class: 'input', id: 'dq-vid', type: 'number', min: '1', max: '4094', value: '10', style: { width: '110px' }, oninput: (e) => { vid = Number(e.target.value); draw(); } });
    const pi = h('input', { class: 'input', id: 'dq-pri', type: 'number', min: '0', max: '7', value: '0', style: { width: '90px' }, oninput: (e) => { pri = Math.max(0, Math.min(7, Number(e.target.value) || 0)); draw(); } });
    box(c, '802.1Q tag builder', 'type a VLAN ID and a priority', h('div', { class: 'row' }, h('label', { for: 'dq-vid' }, 'VLAN ID'), vi, h('label', { for: 'dq-pri' }, 'Priority (0–7)'), pi), out);
    draw();
  };

  /* ------------------------------------------------ 3.3 VLAN ranges */
  W.vlanrange = function (c) {
    const out = h('div');
    function classify(v) {
      if (!Number.isInteger(v) || v < 0 || v > 4095) return ['bad', 'Not a valid VLAN ID (12 bits: 0–4095).'];
      if (v === 0 || v === 4095) return ['bad', 'Reserved; it cannot be configured.'];
      if (v === 1) return ['info', 'Normal range. The default VLAN: exists from the start, cannot be deleted or renamed. Stored in vlan.dat.'];
      if (v >= 1002 && v <= 1005) return ['info', 'Normal range, reserved for legacy Token Ring and FDDI. Created automatically, cannot be deleted.'];
      if (v <= 1005) return ['ok', 'Normal range (1–1005). Stored in vlan.dat in flash, survives erase startup-config, can be synchronized by VTP.'];
      return ['warn', 'Extended range (1006–4094). Stored in the running configuration; needs VTP transparent mode; fewer VLAN features.'];
    }
    const inp = h('input', { class: 'input', type: 'number', id: 'vr-id', value: '20', style: { width: '120px' }, oninput: () => draw() });
    function draw() { const v = Number(inp.value); const [k, t] = classify(v); out.innerHTML = ''; out.appendChild(h('div', { class: 'feedback ' + (k === 'warn' ? 'info' : k) }, h('strong', null, 'VLAN ' + inp.value + ': '), t)); }
    box(c, 'Which VLAN range?', 'type any VLAN ID', h('div', { class: 'row' }, h('label', { for: 'vr-id' }, 'VLAN ID'), inp, ...[1, 20, 1003, 2000, 4095].map((v) => h('button', { class: 'btn small ghost', type: 'button', onclick: () => { inp.value = v; draw(); } }, String(v)))), out);
    draw();
  };

  /* ------------------------------------------------ 3.4 allowed VLAN list */
  W.allowed = function (c) {
    let spec = 'all';
    const hist = [];
    const out = h('div');
    const inp = h('input', { class: 'input mono', id: 'al-list', value: '10,20', style: { width: '160px' }, 'aria-label': 'VLAN list' });
    function apply(op) {
      const list = U.parseVlanList(inp.value.trim() || '1');
      if (!list && !['all', 'none'].includes(op)) { App.toast('Type a VLAN list such as 10,20,30-35'); return; }
      const cmd = 'switchport trunk allowed vlan ' + (op === 'set' ? inp.value : op === 'all' || op === 'none' ? op : op + ' ' + inp.value);
      if (op === 'set') spec = U.rangesToSpec(U.listToRanges(list));
      else if (op === 'add') spec = U.specUnion(spec, list);
      else if (op === 'remove') spec = U.specMinus(spec, list);
      else if (op === 'except') spec = U.specExcept(list);
      else spec = op;
      hist.push(cmd);
      draw();
    }
    function draw() {
      let s = '<svg class="wsvg" viewBox="0 0 640 70" role="img" aria-label="VLANs 1 to 100 allowed on the trunk">';
      for (let v = 1; v <= 100; v++) { const x = ((v - 1) % 50) * 12.6 + 4, y = v <= 50 ? 6 : 36; s += '<rect x="' + x + '" y="' + y + '" width="11" height="24" rx="2" fill="' + (U.specHas(spec, v) ? 'var(--ok)' : 'var(--surface-2)') + '"><title>VLAN ' + v + '</title></rect>'; }
      s += '</svg>';
      out.innerHTML = '';
      out.append(h('div', { html: s }), h('p', { class: 'small muted', style: { margin: '2px 0 8px' } }, 'VLANs 1–100 shown; green = allowed.'),
        h('pre', { class: 'out' }, (hist.length ? hist.map((x) => 'S1(config-if)# ' + x).join('\n') + '\n\n' : '') + 'S1# show interfaces trunk\nPort        Vlans allowed on trunk\nFa0/1       ' + U.specDisplay(spec)));
    }
    box(c, 'Allowed VLAN list', 'replace versus add, remove and except', h('div', { class: 'row' }, h('label', { for: 'al-list' }, 'VLAN list'), inp,
      ...[['set', 'allowed vlan LIST'], ['add', 'add'], ['remove', 'remove'], ['except', 'except'], ['all', 'all'], ['none', 'none']].map(([op, l]) => h('button', { class: 'btn small', type: 'button', onclick: () => apply(op) }, l)),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { spec = 'all'; hist.length = 0; draw(); } }, 'Reset')),
    h('p', { class: 'small muted', style: { margin: '8px 0' } }, 'Try: set 10,20, then add 30. Then try set 30 and see the trap: the list is replaced.'), out);
    draw();
  };

  /* ------------------------------------------------ 3.5 DTP explorer */
  W.dtp = function (c) {
    const MODES = ['dynamic auto', 'dynamic desirable', 'trunk', 'access'];
    let a = 'dynamic auto', b = 'dynamic auto', na = false, nb = false;
    const out = h('div');
    const table = h('div', { class: 'scroll' });
    /* DTP: a dynamic port trunks only if the far end sends DTP frames that ask for (or accept) a trunk. */
    function result(x, y, nx, ny) {
      const sends = (m, n) => !(n && (m === 'trunk' || m === 'access')) && m !== 'access';
      const oper = (me, other, otherNonego) => {
        if (me === 'trunk') return 'trunk';
        if (me === 'access') return 'access';
        if (!sends(other, otherNonego)) return 'access';
        if (me === 'dynamic desirable') return other === 'trunk' || other.startsWith('dynamic') ? 'trunk' : 'access';
        return other === 'trunk' || other === 'dynamic desirable' ? 'trunk' : 'access';
      };
      const ma = oper(x, y, ny), mb = oper(y, x, nx);
      return ma === mb ? (ma === 'trunk' ? 'Trunk' : 'Access') : 'Limited connectivity';
    }
    function draw() {
      const r = result(a, b, na, nb);
      out.innerHTML = '';
      const why = r === 'Trunk' ? 'At least one side actively asks (trunk or desirable) and the other agrees.' : r === 'Access' ? 'Nobody asks for a trunk (or one side is access), so the link is an access link.' :
        'One side trunks and the other is an access port: frames for most VLANs are lost. Avoid this.';
      out.appendChild(h('div', { class: 'feedback ' + (r === 'Trunk' ? 'ok' : r === 'Access' ? 'info' : 'bad') }, h('strong', null, 'Result: ' + r + '. '), why,
        (na && a === 'trunk' && b.startsWith('dynamic')) || (nb && b === 'trunk' && a.startsWith('dynamic')) ? ' Note: nonegotiate stops DTP frames, so the dynamic side never learns that it should trunk.' : ''));
      const mt = h('table', { class: 't dtp small' }, h('tr', null, h('th', null, ''), ...MODES.map((m) => h('th', null, m))),
        ...MODES.map((x) => h('tr', null, h('th', null, x), ...MODES.map((y) => { const v = result(x, y, false, false); return h('td', { class: v === 'Trunk' ? 'y' : v === 'Access' ? '' : 'n', style: x === a && y === b && !na && !nb ? { outline: '3px solid var(--accent)' } : null }, v); }))));
      table.innerHTML = '';
      table.appendChild(mt);
    }
    const nego = (id, set) => h('label', { class: 'row small' }, h('input', { type: 'checkbox', id, onchange: (e) => { set(e.target.checked); draw(); } }), 'switchport nonegotiate');
    box(c, 'DTP results', 'pick the mode of each end', h('div', { class: 'grid two' },
      h('div', { class: 'card stack' }, select('dtp-a', 'Switch A Fa0/1', MODES, a, (v) => { a = v; draw(); }), nego('dtp-na', (v) => { na = v; })),
      h('div', { class: 'card stack' }, select('dtp-b', 'Switch B Fa0/1', MODES, b, (v) => { b = v; draw(); }), nego('dtp-nb', (v) => { nb = v; }))),
    h('div', { style: { height: '10px' } }), out, h('h4', { style: { marginTop: '14px' } }, 'The full table'), table);
    draw();
  };

  /* ------------------------------------------------ 4.x inter-VLAN packet walk */
  W.intervlan = function (c, topic) {
    const MODES = {
      legacy: { name: 'Legacy', nodes: { PC1: [90, 260], S1: [330, 220], R1: [330, 60], PC2: [570, 260] },
        links: [['PC1', 'S1', 'access VLAN 10'], ['S1', 'R1', 'G0/0/0 · VLAN 10'], ['R1', 'S1', 'G0/0/1 · VLAN 20', 30], ['S1', 'PC2', 'access VLAN 20']],
        steps: [['PC1', 'S1', 'PC1 (192.168.10.10) sends the packet to its gateway 192.168.10.1. The frame enters S1 on an access port in VLAN 10.'],
          ['S1', 'R1', 'S1 forwards the frame out the port connected to R1 G0/0/0, which is also in VLAN 10. One router interface per VLAN.'],
          ['R1', 'S1', 'R1 routes 192.168.20.0/24 out G0/0/1, a second physical cable into a VLAN 20 port on S1.'],
          ['S1', 'PC2', 'S1 delivers the frame to PC2 in VLAN 20. It works, but every new VLAN needs another router port and cable.']] },
      roas: { name: 'Router-on-a-stick', nodes: { PC1: [90, 260], S1: [330, 220], R1: [330, 60], PC2: [570, 260] },
        links: [['PC1', 'S1', 'access VLAN 10'], ['S1', 'R1', 'trunk (802.1Q)'], ['S1', 'PC2', 'access VLAN 20']],
        steps: [['PC1', 'S1', 'PC1 sends to its gateway 192.168.10.1 (R1 G0/0/1.10). The frame enters S1 untagged on an access port in VLAN 10.'],
          ['S1', 'R1', 'S1 sends it up the trunk with an 802.1Q tag: VLAN 10. R1 hands it to subinterface G0/0/1.10 (encapsulation dot1Q 10).'],
          ['R1', 'S1', 'R1 routes to 192.168.20.0/24 via G0/0/1.20 and sends it back down the same trunk, now tagged VLAN 20.'],
          ['S1', 'PC2', 'S1 removes the tag and delivers the frame to PC2 on its VLAN 20 access port.']] },
      l3: { name: 'Layer 3 switch', nodes: { PC1: [130, 240], D1: [330, 90], PC2: [530, 240] },
        links: [['PC1', 'D1', 'access VLAN 10'], ['D1', 'PC2', 'access VLAN 20']],
        steps: [['PC1', 'D1', 'PC1 sends to its gateway 192.168.10.1, the VLAN 10 SVI inside D1.'],
          ['D1', 'D1', 'With ip routing enabled, D1 routes in hardware from SVI VLAN 10 to SVI VLAN 20. Nothing leaves the switch.'],
          ['D1', 'PC2', 'D1 forwards the frame out the VLAN 20 access port to PC2. Fastest of the three, and no external router link.']] },
    };
    let mode = topic && topic.id === '4.3' ? 'l3' : topic && topic.id === '4.2' ? 'roas' : 'roas', step = -1;
    const svgBox = h('div');
    const fb = h('div', { class: 'feedback info' }, 'Press Next to follow a packet from PC1 (VLAN 10) to PC2 (VLAN 20).');
    function draw() {
      const M = MODES[mode];
      const cur = step >= 0 ? M.steps[step] : null;
      let s = '<svg class="wsvg narrow" viewBox="0 0 660 320" role="img" aria-label="' + M.name + ' inter-VLAN routing">';
      M.links.forEach(([a, b, label, off]) => {
        const A = M.nodes[a], B = M.nodes[b], o = off || 0;
        const hot = cur && ((cur[0] === a && cur[1] === b) || (cur[0] === b && cur[1] === a && !(mode === 'legacy' && label.indexOf('20') >= 0 && step === 1)));
        const trunk = /trunk/.test(label);
        s += '<line x1="' + (A[0] + o) + '" y1="' + A[1] + '" x2="' + (B[0] + o) + '" y2="' + B[1] + '" stroke="' + (hot ? '#f5a524' : 'var(--line-2)') + '" stroke-width="' + (trunk ? 7 : 3) + '" stroke-linecap="round"/>' + (trunk ? '<line x1="' + A[0] + '" y1="' + A[1] + '" x2="' + B[0] + '" y2="' + B[1] + '" stroke="var(--surface)" stroke-width="2"/>' : '');
        const horiz = Math.abs(B[0] - A[0]) > Math.abs(B[1] - A[1]);
        const mx = (A[0] + B[0]) / 2 + o + (horiz ? 0 : 14), my = (A[1] + B[1]) / 2 + (horiz ? 26 : 4);
        s += '<text x="' + mx + '" y="' + my + '" font-size="13" text-anchor="' + (horiz ? 'middle' : 'start') + '" fill="var(--text-2)">' + label + '</text>';
      });
      Object.keys(M.nodes).forEach((n) => {
        const [x, y] = M.nodes[n];
        const hot = cur && (cur[0] === n || cur[1] === n);
        const shape = n === 'R1' ? '<circle r="26" fill="var(--surface-2)" stroke="' + (hot ? '#f5a524' : 'var(--line-2)') + '" stroke-width="2.5"/>' : n.startsWith('PC') ? '<rect x="-28" y="-18" width="56" height="34" rx="4" fill="var(--surface-2)" stroke="' + (hot ? '#f5a524' : 'var(--line-2)') + '" stroke-width="2.5"/>' :
          '<rect x="-36" y="-20" width="72" height="40" rx="7" fill="var(--surface-2)" stroke="' + (hot ? '#f5a524' : 'var(--line-2)') + '" stroke-width="2.5"/>';
        s += '<g transform="translate(' + x + ' ' + y + ')">' + shape + '<text y="5" text-anchor="middle" font-size="14" font-weight="600" fill="var(--text)">' + n + '</text></g>';
      });
      if (mode === 'l3') s += '<text x="330" y="40" text-anchor="middle" font-size="12" fill="var(--text-2)">SVI Vlan10 192.168.10.1 · SVI Vlan20 192.168.20.1 · ip routing</text>';
      s += '</svg>';
      svgBox.innerHTML = s;
      fb.textContent = cur ? (step + 1) + '. ' + cur[2] : 'Press Next to follow a packet from PC1 (VLAN 10) to PC2 (VLAN 20).';
    }
    const segEl = seg(['Legacy', 'Router-on-a-stick', 'Layer 3 switch'], (i) => { mode = ['legacy', 'roas', 'l3'][i]; step = -1; draw(); }, ['legacy', 'roas', 'l3'].indexOf(mode));
    box(c, 'Follow the packet', 'how each method moves traffic between VLANs', segEl, svgBox, h('div', { class: 'btn-row', style: { margin: '8px 0' } },
      h('button', { class: 'btn small primary', type: 'button', onclick: () => { const M = MODES[mode]; step = step >= M.steps.length - 1 ? 0 : step + 1; draw(); } }, 'Next'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { step = -1; draw(); } }, 'Reset')), fb);
    draw();
  };

  /* ------------------------------------------------ 4.4 troubleshooting helper */
  W.tshoot = function (c) {
    const S = [
      ['A PC has the right IP settings but cannot ping its default gateway', 'Its access port is in the wrong VLAN (or not an access port, or shut down).', 'show vlan brief · show interfaces fa0/6 switchport · show running-config interface fa0/6', 'switchport mode access + switchport access vlan N'],
      ['show interfaces switchport says "Access Mode VLAN: 10 (Inactive)"', 'VLAN 10 does not exist on this switch (never created or deleted).', 'show vlan brief', 'vlan 10 (re-creating it reactivates the ports)'],
      ['The switch port to the router is missing from show interfaces trunk', 'That port is not trunking (access mode, or DTP negotiated access).', 'show interfaces trunk · show running-config interface fa0/5', 'switchport mode trunk'],
      ['PCs in the same VLAN on two switches cannot ping each other', 'The inter-switch link is not a trunk, the VLAN is not allowed on it, or the VLAN is missing on one switch.', 'show interfaces trunk (allowed and active VLANs) · show vlan brief on both switches', 'Fix the trunk mode, allowed list or create the VLAN'],
      ['show interfaces | include Gig|802.1Q shows the wrong Vlan ID on a subinterface', 'The router subinterface listens to the wrong VLAN.', 'show interfaces | include Gig|802.1Q · show ip interface brief', 'encapsulation dot1Q <correct VLAN> on that subinterface'],
      ['Each PC pings its own SVI on the Layer 3 switch, but not the other VLAN', 'IP routing is not enabled on the Layer 3 switch.', 'show ip route (it shows "Default gateway is not set")', 'ip routing'],
      ['CDP logs "%CDP-4-NATIVE_VLAN_MISMATCH" on a trunk', 'The two ends of the trunk use different native VLANs.', 'show interfaces trunk on both switches', 'switchport trunk native vlan N on both ends'],
    ];
    const out = h('div');
    const list = h('div', { class: 'opts' }, ...S.map((s, i) => h('button', { class: 'opt', type: 'button', onclick: () => {
      [...list.children].forEach((b, j) => b.classList.toggle('sel', j === i));
      out.innerHTML = '';
      out.appendChild(h('div', { class: 'card stack', style: { marginTop: '10px' } }, h('div', null, h('strong', null, 'Likely cause: '), s[1]), h('div', null, h('strong', null, 'Verify with: '), h('code', null, s[2])), h('div', null, h('strong', null, 'Fix: '), h('code', null, s[3]))));
    } }, h('span', { class: 'mark' }), h('span', null, s[0]))));
    box(c, 'Symptom → cause → command', 'pick what you see', list, out);
  };
})(typeof window !== 'undefined' ? window : globalThis);
