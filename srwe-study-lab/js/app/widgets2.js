/* SRWE Study Lab — interactive "Understand" visuals for modules 5–16. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE;
  const App = SRWE.App;
  const h = App.h;
  const W = SRWE.Widgets;
  const { box, seg, select } = SRWE.WidgetKit;
  const HOT = '#f5a524';
  const esc = App.esc;

  /* ------------------------------------------------ 5.2 STP election in a triangle */
  W.stpelect = function (c) {
    const PRIOS = ['4096', '8192', '24576', '28672', '32768', '36864'];
    const sw = {
      S1: { prio: 32768, mac: '0019.aa00.0003', pos: [330, 50] },
      S2: { prio: 32768, mac: '0019.aa00.0001', pos: [120, 250] },
      S3: { prio: 32768, mac: '0019.aa00.0002', pos: [540, 250] },
    };
    const links = { 'S1-S2': 19, 'S1-S3': 19, 'S2-S3': 19 };
    const ports = { 'S1-S2': ['Fa0/1', 'Fa0/1'], 'S1-S3': ['Fa0/2', 'Fa0/2'], 'S2-S3': ['Fa0/3', 'Fa0/3'] };
    const names = Object.keys(sw);
    const bid = (n) => [sw[n].prio + 1, sw[n].mac];
    const lower = (a, b) => (bid(a)[0] !== bid(b)[0] ? bid(a)[0] < bid(b)[0] : bid(a)[1] < bid(b)[1]);
    const cost = (a, b) => links[[a, b].sort().join('-')];
    const out = h('div');
    const svgBox = h('div');
    function compute() {
      const rootB = names.reduce((r, n) => (lower(n, r) ? n : r));
      const res = { root: rootB, rc: { [rootB]: 0 }, rp: {}, roles: {} };
      for (const n of names) {
        if (n === rootB) continue;
        const other = names.find((x) => x !== n && x !== rootB);
        const direct = cost(n, rootB), via = cost(n, other) + cost(other, rootB);
        // equal cost: lowest sender BID (the root vs the other switch) → the root always wins
        const viaBetter = via < direct;
        res.rc[n] = viaBetter ? via : direct;
        res.rp[n] = viaBetter ? other : rootB;
      }
      for (const key of Object.keys(links)) {
        const [a, b] = key.split('-');
        let ra, rb;
        if (res.rp[a] === b) { ra = 'Root'; rb = 'Desg'; }
        else if (res.rp[b] === a) { rb = 'Root'; ra = 'Desg'; }
        else {
          const aBetter = res.rc[a] !== res.rc[b] ? res.rc[a] < res.rc[b] : lower(a, b);
          ra = aBetter ? 'Desg' : 'Altn'; rb = aBetter ? 'Altn' : 'Desg';
        }
        res.roles[key] = [ra, rb];
      }
      return res;
    }
    function draw() {
      const r = compute();
      const col = { Root: 'var(--ok)', Desg: 'var(--info)', Altn: 'var(--bad)' };
      let s = '<svg class="wsvg narrow" viewBox="0 0 660 320" role="img" aria-label="Spanning tree in a three-switch triangle">';
      for (const key of Object.keys(links)) {
        const [a, b] = key.split('-');
        const A = sw[a].pos, B = sw[b].pos;
        const blocked = r.roles[key].includes('Altn');
        s += '<line x1="' + A[0] + '" y1="' + A[1] + '" x2="' + B[0] + '" y2="' + B[1] + '" stroke="' + (blocked ? 'var(--line-2)' : 'var(--ok)') + '" stroke-width="3" stroke-dasharray="' + (blocked ? '8 6' : '') + '"/>';
        const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
        s += '<text x="' + mx + '" y="' + (my + (a === 'S2' ? 22 : -8)) + '" text-anchor="middle" font-size="12" fill="var(--text-2)">cost ' + links[key] + '</text>';
        [[a, A, B, 0], [b, B, A, 1]].forEach(([n, P, Q, i]) => {
          const x = P[0] + (Q[0] - P[0]) * 0.22, y = P[1] + (Q[1] - P[1]) * 0.22;
          const role = r.roles[key][i];
          s += '<g transform="translate(' + x + ' ' + y + ')"><rect x="-26" y="-12" width="52" height="22" rx="11" fill="var(--surface)" stroke="' + col[role] + '" stroke-width="2"/><text y="4" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + col[role] + '">' + role.toUpperCase() + '</text></g>';
        });
      }
      for (const n of names) {
        const [x, y] = sw[n].pos;
        const isRoot = n === r.root;
        s += '<g transform="translate(' + x + ' ' + y + ')"><rect x="-44" y="-22" width="88" height="44" rx="8" fill="var(--surface-2)" stroke="' + (isRoot ? HOT : 'var(--line-2)') + '" stroke-width="' + (isRoot ? 3 : 2) + '"/>' +
          '<text y="-2" text-anchor="middle" font-size="15" font-weight="700" fill="var(--text)">' + n + '</text><text y="14" text-anchor="middle" font-size="10.5" fill="var(--text-2)">' + (sw[n].prio + 1) + '.' + sw[n].mac.slice(-4) + '</text></g>';
        if (isRoot) s += '<text x="' + x + '" y="' + (y - 30) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + HOT + '">ROOT BRIDGE</text>';
      }
      s += '</svg>';
      svgBox.innerHTML = s;
      out.innerHTML = '';
      out.appendChild(h('div', { class: 'scroll' }, h('table', { class: 't small compact' },
        h('tr', null, h('th', null, 'Switch'), h('th', null, 'Bridge ID'), h('th', null, 'Root path cost'), h('th', null, 'Root port')),
        ...names.map((n) => h('tr', null, h('td', null, n + (n === r.root ? ' (root)' : '')), h('td', { class: 'mono' }, (sw[n].prio + 1) + ' · ' + sw[n].mac), h('td', null, String(r.rc[n])),
          h('td', null, n === r.root ? '— (all designated)' : (() => { const key = [n, r.rp[n]].sort().join('-'); return ports[key][key.split('-').indexOf(n)] + ' towards ' + r.rp[n]; })()))))));
      const alt = Object.keys(r.roles).map((k) => { const i = r.roles[k].indexOf('Altn'); return i < 0 ? null : k.split('-')[i] + ' ' + ports[k][i]; }).filter(Boolean);
      out.appendChild(h('div', { class: 'feedback info' }, h('strong', null, 'Blocked: '), alt.join(', ') || 'nothing', '. ', r.root + ' wins because its bridge ID ' + bid(r.root)[0] + '.' + bid(r.root)[1] + ' is the lowest (priority first, then MAC).'));
    }
    const controls = h('div', { class: 'grid three' }, ...names.map((n) => select('stp-' + n, n + ' priority', PRIOS, String(sw[n].prio), (v) => { sw[n].prio = Number(v); draw(); })));
    const linkCtl = h('div', { class: 'grid three', style: { marginTop: '8px' } }, ...Object.keys(links).map((k) => select('stp-l-' + k, k.replace('-', '–') + ' link', ['100 Mb/s (19)', '1 Gb/s (4)', '10 Mb/s (100)'], '100 Mb/s (19)', (v) => { links[k] = Number(/\((\d+)\)/.exec(v)[1]); draw(); })));
    box(c, 'Elect the root and the port roles', 'change priorities and link speeds', controls, linkCtl, svgBox, out,
      h('p', { class: 'small muted', style: { margin: '8px 0 0' } }, 'MAC addresses are fixed (S2 lowest), so with equal priorities S2 is root. Lower S1 to 24576 and watch the tree rebuild around it.'));
    draw();
  };

  /* ------------------------------------------------ 6.1 EtherChannel mode matrix */
  W.ecmodes = function (c) {
    const MODES = ['on', 'desirable', 'auto', 'active', 'passive'];
    const proto = (m) => (m === 'on' ? 'none' : m === 'desirable' || m === 'auto' ? 'PAgP' : 'LACP');
    function result(a, b) {
      if (a === 'on' || b === 'on') return a === b ? ['yes', 'Static channel, no negotiation protocol.'] : ['no', 'Mode on does not negotiate, so the other side never forms the channel.'];
      if (proto(a) !== proto(b)) return ['no', 'One side speaks PAgP and the other LACP.'];
      const passive = (m) => m === 'auto' || m === 'passive';
      if (passive(a) && passive(b)) return ['no', 'Both sides only answer; nobody starts the negotiation.'];
      return ['yes', proto(a) + ' negotiates the channel: at least one side actively starts.'];
    }
    let a = 'active', b = 'passive';
    const out = h('div');
    const table = h('div', { class: 'scroll' });
    function draw() {
      const r = result(a, b);
      out.innerHTML = '';
      out.appendChild(h('div', { class: 'feedback ' + (r[0] === 'yes' ? 'ok' : 'bad') }, h('strong', null, r[0] === 'yes' ? 'Channel forms. ' : 'No channel. '), r[1]));
      out.appendChild(h('pre', { class: 'out', style: { marginTop: '8px' } }, 'S1(config-if-range)# channel-group 1 mode ' + a + '\nS2(config-if-range)# channel-group 1 mode ' + b));
      table.innerHTML = '';
      table.appendChild(h('table', { class: 't dtp small' }, h('tr', null, h('th', null, 'S1 \\ S2'), ...MODES.map((m) => h('th', null, m))),
        ...MODES.map((x) => h('tr', null, h('th', null, x), ...MODES.map((y) => { const v = result(x, y)[0]; return h('td', { class: v === 'yes' ? 'y' : 'n', style: x === a && y === b ? { outline: '3px solid var(--accent)' } : null }, v); })))));
    }
    box(c, 'EtherChannel negotiation', 'pick the mode on each switch', h('div', { class: 'grid two' },
      select('ec-a', 'S1 channel-group mode', MODES, a, (v) => { a = v; draw(); }), select('ec-b', 'S2 channel-group mode', MODES, b, (v) => { b = v; draw(); })),
    h('div', { style: { height: '8px' } }), out, h('h4', { style: { marginTop: '14px' } }, 'All combinations'), table);
    draw();
  };

  /* ------------------------------------------------ 7.1 DORA and renewal */
  W.dora = function (c) {
    const STEPS = [
      ['DHCPDISCOVER', 'right', 'Client → all', 'Src 0.0.0.0 → Dst 255.255.255.255 · Dst MAC FFFF.FFFF.FFFF · UDP 68 → 67', 'The client has no address and does not know any server, so it broadcasts.'],
      ['DHCPOFFER', 'left', 'Server → client', 'Src 192.168.10.1 → offered 192.168.10.10 · UDP 67 → 68', 'The server reserves an address from the pool and offers it with the mask, gateway, DNS and lease time (unicast or broadcast, RFC 2131).'],
      ['DHCPREQUEST', 'right', 'Client → all', 'Src 0.0.0.0 → Dst 255.255.255.255 · requests 192.168.10.10 · UDP 68 → 67', 'Still a broadcast, so every server learns which offer was accepted and can release the others.'],
      ['DHCPACK', 'left', 'Server → client', 'Src 192.168.10.1 → 192.168.10.10 · UDP 67 → 68', 'The lease starts. The client checks the address is free and starts using it.'],
      ['DHCPREQUEST (renew)', 'right', 'Client → server', 'Src 192.168.10.10 → Dst 192.168.10.1 · unicast · UDP 68 → 67', 'Before the lease expires, the client asks the same server directly. No answer → it broadcasts the request to any server.'],
      ['DHCPACK (renew)', 'left', 'Server → client', 'Src 192.168.10.1 → 192.168.10.10 · UDP 67 → 68', 'The server confirms the lease; the client keeps the same address.'],
    ];
    let i = -1;
    const svgBox = h('div'), fb = h('div', { class: 'feedback info' });
    function draw() {
      let s = '<svg class="wsvg narrow" viewBox="0 0 660 ' + (70 + STEPS.length * 42) + '" role="img" aria-label="DHCPv4 message exchange">';
      s += '<text x="80" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text)">Client</text><text x="580" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text)">DHCP server</text>';
      s += '<line x1="80" y1="34" x2="80" y2="' + (50 + STEPS.length * 42) + '" stroke="var(--line-2)" stroke-width="2"/><line x1="580" y1="34" x2="580" y2="' + (50 + STEPS.length * 42) + '" stroke="var(--line-2)" stroke-width="2"/>';
      STEPS.forEach((st, k) => {
        if (k > i) return;
        const y = 58 + k * 42, right = st[1] === 'right', on = k === i;
        const x1 = right ? 88 : 572, x2 = right ? 572 : 88;
        s += '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + (on ? HOT : 'var(--text-2)') + '" stroke-width="' + (on ? 3 : 2) + '"/>';
        s += '<path d="M' + x2 + ' ' + y + ' l' + (right ? '-10 -6 v12' : '10 -6 v12') + ' z" fill="' + (on ? HOT : 'var(--text-2)') + '"/>';
        s += '<text x="330" y="' + (y - 7) + '" text-anchor="middle" font-size="13" font-weight="' + (on ? 700 : 500) + '" fill="var(--text)">' + (k + 1) + '. ' + st[0] + '</text>';
        if (k === 4) s += '<text x="330" y="' + (y - 24) + '" text-anchor="middle" font-size="11" fill="var(--text-2)">… later, before the lease expires …</text>';
      });
      s += '</svg>';
      svgBox.innerHTML = s;
      fb.innerHTML = '';
      if (i < 0) fb.textContent = 'Press Next to watch a client get a lease, then renew it.';
      else fb.append(h('strong', null, STEPS[i][0] + ' (' + STEPS[i][2] + '). '), STEPS[i][4], h('div', { class: 'mono small', style: { marginTop: '4px' } }, STEPS[i][3]));
    }
    box(c, 'DORA, then renewal', 'four messages to get a lease, two to renew it', svgBox, h('div', { class: 'btn-row', style: { margin: '8px 0' } },
      h('button', { class: 'btn small primary', type: 'button', onclick: () => { i = i >= STEPS.length - 1 ? 0 : i + 1; draw(); } }, 'Next'),
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { i = -1; draw(); } }, 'Reset')), fb);
    draw();
  };

  /* ------------------------------------------------ 8.1 / 8.3 RA flags */
  W.raflags = function (c) {
    const f = { A: true, O: false, M: false };
    const out = h('div');
    function verdict() {
      if (f.M) return { name: 'Stateful DHCPv6', addr: f.A ? 'From the DHCPv6 server, and also a SLAAC address because A=1 (clear A to avoid two GUAs)' : 'From the stateful DHCPv6 server', other: 'From the DHCPv6 server', ok: !f.A };
      if (f.A && f.O) return { name: 'SLAAC with stateless DHCPv6', addr: 'SLAAC: prefix from the RA + own interface ID', other: 'DNS, domain name from a stateless DHCPv6 server', ok: true };
      if (f.A) return { name: 'SLAAC only (default)', addr: 'SLAAC: prefix from the RA + own interface ID', other: 'Only what the RA carries (DNS via RDNSS, MTU)', ok: true };
      return { name: 'No dynamic GUA', addr: 'None: no method is offered, so the host keeps only its link-local address', other: f.O ? 'DHCPv6 options only' : 'None', ok: false };
    }
    function draw() {
      const v = verdict();
      const cmds = [];
      if (f.O) cmds.push('R1(config-if)# ipv6 nd other-config-flag');
      if (f.M) cmds.push('R1(config-if)# ipv6 nd managed-config-flag');
      if (!f.A) cmds.push('R1(config-if)# ipv6 nd prefix default no-autoconfig');
      out.innerHTML = '';
      out.append(h('div', { class: 'feedback ' + (v.ok ? 'ok' : 'bad') }, h('strong', null, v.name + '. ')),
        h('div', { class: 'scroll', style: { marginTop: '8px' } }, h('table', { class: 't small compact' },
          h('tr', null, h('th', null, 'The host gets'), h('th', null, 'From')),
          h('tr', null, h('td', null, 'Global unicast address'), h('td', null, v.addr)),
          h('tr', null, h('td', null, 'Other settings (DNS, domain)'), h('td', null, v.other)),
          h('tr', null, h('td', null, 'Default gateway'), h('td', null, 'Always the router\'s link-local address (source of the RA)')))),
        h('pre', { class: 'out' }, (cmds.length ? cmds.join('\n') : '! default RA: A=1, O=0, M=0 — nothing to configure besides ipv6 unicast-routing') + '\n\nR1# show ipv6 interface g0/0/1 | begin ND\n  ' +
          (f.M ? 'Hosts use DHCP to obtain routable addresses.' : f.A ? 'Hosts use stateless autoconfig for addresses.' : 'Hosts use no autoconfig for addresses.') + (f.O || f.M ? '\n  Hosts use DHCP to obtain other configuration.' : '')));
    }
    const flag = (k, label) => h('label', { class: 'row', style: { gap: '8px' } }, h('input', { type: 'checkbox', id: 'ra-' + k, checked: f[k] ? true : null, onchange: (e) => { f[k] = e.target.checked; draw(); } }), h('span', null, h('strong', null, k + ' flag'), ' — ' + label));
    box(c, 'Router Advertisement flags', 'set A, O and M and see what the host does', h('div', { class: 'stack' }, flag('A', 'Address autoconfiguration (SLAAC)'), flag('O', 'Other configuration (stateless DHCPv6)'), flag('M', 'Managed address configuration (stateful DHCPv6)')), h('div', { style: { height: '10px' } }), out);
    draw();
  };

  /* ------------------------------------------------ 9.2 HSRP election, failover and preemption */
  W.hsrpelect = function (c) {
    const R = { R1: { ip: '192.168.1.1', prio: 150, preempt: true, up: true }, R2: { ip: '192.168.1.2', prio: 100, preempt: false, up: true } };
    let active = null;
    const log = [];
    const better = (a, b) => (R[a].prio !== R[b].prio ? R[a].prio > R[b].prio : Number(R[a].ip.split('.').pop()) > Number(R[b].ip.split('.').pop()));
    function elect(reason) {
      const ups = Object.keys(R).filter((n) => R[n].up);
      if (!ups.length) { active = null; log.unshift(reason + ': no router is up, hosts lose their gateway.'); return; }
      if (active && R[active].up) {
        const challenger = ups.find((n) => n !== active && R[n].preempt && better(n, active) && R[n].prio > R[active].prio);
        if (challenger) { log.unshift(reason + ': ' + challenger + ' has a higher priority and preempt, so it takes over the active role.'); active = challenger; }
        else log.unshift(reason + ': ' + active + ' stays active' + (ups.length > 1 ? ' (no preempting router with a higher priority).' : '.'));
        return;
      }
      const prev = active;
      active = ups.reduce((x, y) => (better(x, y) ? x : y));
      log.unshift(reason + ': ' + (prev ? prev + ' stopped sending Hellos (10 s hold time). ' : '') + active + ' becomes active' + (ups.length > 1 ? ' (priority ' + R[active].prio + (R.R1.prio === R.R2.prio ? ', tie broken by the higher IP' : '') + ').' : '.'));
    }
    const out = h('div');
    function draw() {
      out.innerHTML = '';
      const standby = Object.keys(R).find((n) => n !== active && R[n].up);
      out.appendChild(h('div', { class: 'grid two' }, ...Object.keys(R).map((n) => h('div', { class: 'card stack' },
        h('div', { class: 'row' }, h('strong', null, n), h('span', { class: 'pill ' + (!R[n].up ? 'bad' : n === active ? 'ok' : 'accent') }, !R[n].up ? 'down' : n === active ? 'Active' : n === standby ? 'Standby' : 'Listen')),
        h('div', { class: 'small mono' }, 'G0/0/1 ' + R[n].ip + ' · standby 1 ip 192.168.1.254'),
        h('div', { class: 'small mono' }, 'standby 1 priority ' + R[n].prio + (R[n].preempt ? ' · standby 1 preempt' : '')),
        h('button', { class: 'btn small', type: 'button', onclick: () => { R[n].up = !R[n].up; elect(R[n].up ? n + ' comes back' : n + ' fails'); draw(); } }, R[n].up ? 'Fail ' + n : 'Restore ' + n)))));
      out.appendChild(h('div', { class: 'feedback info', style: { marginTop: '10px' } }, h('strong', null, 'Hosts use 192.168.1.254. '), active ? 'Frames to the virtual MAC are forwarded by ' + active + '.' : 'Nobody answers: the gateway is down.'));
      out.appendChild(h('ol', { class: 'small', style: { margin: '10px 0 0', paddingLeft: '1.3em' } }, ...log.slice(0, 6).map((l) => h('li', null, l))));
    }
    const ctl = h('div', { class: 'grid four' },
      select('hs-p1', 'R1 priority', ['50', '100', '150', '200'], '150', (v) => { R.R1.prio = Number(v); draw(); }),
      select('hs-p2', 'R2 priority', ['50', '100', '150', '200'], '100', (v) => { R.R2.prio = Number(v); draw(); }),
      h('label', { class: 'row small', style: { alignSelf: 'end', minHeight: '40px' } }, h('input', { type: 'checkbox', id: 'hs-pre1', checked: true, onchange: (e) => { R.R1.preempt = e.target.checked; draw(); } }), 'R1 preempt'),
      h('label', { class: 'row small', style: { alignSelf: 'end', minHeight: '40px' } }, h('input', { type: 'checkbox', id: 'hs-pre2', onchange: (e) => { R.R2.preempt = e.target.checked; draw(); } }), 'R2 preempt'));
    box(c, 'HSRP election, failover and preemption', 'fail and restore the routers', ctl,
      h('div', { class: 'btn-row', style: { margin: '10px 0' } }, h('button', { class: 'btn small primary', type: 'button', onclick: () => { log.length = 0; active = null; R.R1.up = R.R2.up = true; elect('Both routers start'); draw(); } }, 'Start the election')), out);
    elect('Both routers start');
    draw();
  };

  /* ------------------------------------------------ 10.3 / 10.5 attack → mitigation */
  W.l2mitigate = function (c) {
    const A = [
      ['MAC address flooding', 'MAC table', 'Fake source MACs fill the table; the switch floods every frame in the VLAN.', 'Port security', 'switchport port-security maximum 2'],
      ['VLAN hopping (spoofed DTP)', 'VLAN', 'The attacker\'s host negotiates a trunk and reaches every VLAN.', 'Access mode on user ports; nonegotiate on trunks', 'switchport mode access · switchport nonegotiate'],
      ['VLAN double-tagging', 'VLAN', 'Outer tag = native VLAN is stripped by the first switch; the inner tag reaches the target VLAN.', 'Native VLAN not used by any access port', 'switchport trunk native vlan 999'],
      ['DHCP starvation', 'DHCP', 'Gobbler leases the whole scope with bogus MACs.', 'DHCP snooping (rate limit) and port security', 'ip dhcp snooping limit rate 6'],
      ['DHCP spoofing (rogue server)', 'DHCP', 'A rogue server hands out a false gateway, DNS or address.', 'DHCP snooping with trusted ports', 'ip dhcp snooping trust (uplink only)'],
      ['ARP spoofing / poisoning', 'ARP', 'Gratuitous ARPs claim the gateway\'s IP with the attacker\'s MAC (MITM).', 'Dynamic ARP Inspection', 'ip arp inspection vlan 10'],
      ['MAC / IP address spoofing', 'Address spoofing', 'The attacker reuses a victim\'s MAC or IP address.', 'IP Source Guard', '(IPSG, beyond this course\'s CLI)'],
      ['STP root takeover', 'STP', 'Low-priority BPDUs make the attacker the root bridge.', 'BPDU Guard (with PortFast) on access ports', 'spanning-tree bpduguard enable'],
      ['CDP reconnaissance', 'Reconnaissance', 'CDP broadcasts the IP, IOS version, platform and native VLAN in clear text.', 'Disable CDP on edge ports', 'no cdp enable'],
    ];
    const out = h('div');
    const list = h('div', { class: 'opts' }, ...A.map((a, i) => h('button', { class: 'opt', type: 'button', onclick: (e) => {
      [...list.children].forEach((b) => b.classList.remove('sel')); e.currentTarget.classList.add('sel');
      out.innerHTML = '';
      out.appendChild(h('div', { class: 'card stack', style: { marginTop: '10px' } }, h('div', null, h('span', { class: 'pill' }, a[1] + ' attack')), h('div', null, a[2]),
        h('div', null, h('strong', null, 'Mitigation: '), a[3]), h('div', null, h('strong', null, 'Config: '), h('code', null, a[4]))));
    } }, h('span', { class: 'mark' }), h('span', null, a[0]))));
    box(c, 'Which feature stops which attack?', 'pick an attack', list, out);
  };

  /* ------------------------------------------------ 11.1 port security violation modes */
  W.psecmodes = function (c) {
    let mode = 0;
    const MODES = ['shutdown', 'restrict', 'protect'];
    let st = { count: 0, err: false, log: [] };
    const out = h('div');
    function send(known) {
      if (st.err) { st.log.unshift('Frame from ' + (known ? 'the PC' : 'the rogue laptop') + ' dropped: the port is error-disabled.'); draw(); return; }
      if (known) { st.log.unshift('Frame from the PC (secure MAC 0060.7036.0001) forwarded.'); draw(); return; }
      const m = MODES[mode];
      if (m === 'shutdown') { st.err = true; st.count++; st.log.unshift('%PM-4-ERR_DISABLE: psecure-violation error detected on Fa0/18, putting Fa0/18 in err-disable state'); }
      else if (m === 'restrict') { st.count++; st.log.unshift('%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 00e0.f7a1.0666 on port FastEthernet0/18. (frame dropped)'); }
      else st.log.unshift('(frame dropped silently — no log, no counter)');
      draw();
    }
    function draw() {
      out.innerHTML = '';
      out.append(h('pre', { class: 'out' }, 'S1# show port-security interface fa0/18\nPort Security              : Enabled\nPort Status                : ' + (st.err ? 'Secure-shutdown' : 'Secure-up') +
        '\nViolation Mode             : ' + MODES[mode][0].toUpperCase() + MODES[mode].slice(1) + '\nMaximum MAC Addresses      : 1\nTotal MAC Addresses        : 1\nSecurity Violation Count   : ' + st.count),
      st.err ? h('div', { class: 'feedback bad' }, h('strong', null, 'Fa0/18 is err-disabled. '), 'Even the PC is cut off. Recover with shutdown, then no shutdown.') : null,
      h('ol', { class: 'small', style: { margin: '8px 0 0', paddingLeft: '1.3em' } }, ...st.log.slice(0, 5).map((l) => h('li', { class: 'mono' }, l))));
    }
    box(c, 'Port security violation modes', 'maximum 1, the PC\'s MAC is secure', seg(['shutdown', 'restrict', 'protect'], (i) => { mode = i; st = { count: 0, err: false, log: [] }; draw(); }),
      h('div', { class: 'btn-row', style: { margin: '10px 0' } },
        h('button', { class: 'btn small', type: 'button', onclick: () => send(true) }, 'Frame from the PC'),
        h('button', { class: 'btn small primary', type: 'button', onclick: () => send(false) }, 'Frame from a rogue laptop'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { st.err = false; st.log.unshift('S1(config-if)# shutdown → no shutdown: port re-enabled.'); draw(); } }, 'shutdown / no shutdown')), out);
    draw();
  };

  /* ------------------------------------------------ 12.5 2.4 GHz channel overlap */
  W.channels24 = function (c) {
    const ch = [1, 6, 11];
    const svgBox = h('div'), out = h('div');
    const freq = (n) => 2412 + 5 * (n - 1);
    function draw() {
      const x = (f) => 30 + (f - 2397) * 7.2;
      let s = '<svg class="wsvg narrow" viewBox="0 0 660 190" role="img" aria-label="2.4 GHz channels of three access points">';
      for (let n = 1; n <= 11; n++) s += '<text x="' + x(freq(n)) + '" y="182" text-anchor="middle" font-size="11" fill="var(--text-2)">' + n + '</text>';
      s += '<line x1="20" y1="165" x2="640" y2="165" stroke="var(--line-2)"/>';
      const cols = ['#3fb950', '#6cb6ff', '#f5a524'];
      ch.forEach((n, i) => {
        const f = freq(n), l = x(f - 11), r = x(f + 11), top = 40 + i * 10;
        s += '<path d="M' + l + ' 165 C ' + (l + 20) + ' ' + top + ', ' + (r - 20) + ' ' + top + ', ' + r + ' 165" fill="' + cols[i] + '" fill-opacity="0.18" stroke="' + cols[i] + '" stroke-width="2.5"/>';
        s += '<text x="' + x(f) + '" y="' + (top + 12) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + cols[i] + '">AP' + (i + 1) + ' · ch ' + n + '</text>';
      });
      s += '</svg>';
      svgBox.innerHTML = s;
      const clashes = [];
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(ch[i] - ch[j]) < 5) clashes.push('AP' + (i + 1) + ' (ch ' + ch[i] + ') and AP' + (j + 1) + ' (ch ' + ch[j] + ')');
      out.innerHTML = '';
      out.appendChild(clashes.length ? h('div', { class: 'feedback bad' }, h('strong', null, 'Overlap: '), clashes.join('; ') + '. Channels are 22 MHz wide but only 5 MHz apart, so they must be at least 5 channels apart.')
        : h('div', { class: 'feedback ok' }, h('strong', null, 'No overlap. '), 'These channels are at least 25 MHz apart.'));
    }
    const opts = Array.from({ length: 11 }, (_, i) => String(i + 1));
    box(c, '2.4 GHz channel planner', 'three neighbouring APs', h('div', { class: 'grid three' }, ...ch.map((n, i) => select('ch-' + i, 'AP' + (i + 1) + ' channel', opts, String(n), (v) => { ch[i] = Number(v); draw(); }))), svgBox, out);
    draw();
  };

  /* ------------------------------------------------ 14.1 / 14.4 longest match */
  W.longestmatch = function (c) {
    const ROUTES = [['172.16.0.0', 12, 'S', '10.0.0.2'], ['172.16.0.0', 18, 'O', '10.0.0.6'], ['172.16.0.0', 26, 'S', '10.0.0.10'], ['10.0.0.0', 8, 'C', 'G0/0/0'], ['192.168.1.0', 24, 'S', '10.0.0.2'], ['0.0.0.0', 0, 'S*', '209.165.200.226']];
    const n = (ip) => ip.split('.').reduce((a, o) => a * 256 + Number(o), 0) >>> 0;
    const bin = (ip) => ip.split('.').map((o) => Number(o).toString(2).padStart(8, '0')).join('.');
    const inp = h('input', { class: 'input mono', id: 'lm-dst', value: '172.16.0.10', 'aria-label': 'Destination IPv4 address', style: { maxWidth: '220px' } });
    const out = h('div');
    function draw() {
      out.innerHTML = '';
      const d = inp.value.trim();
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(d) || d.split('.').some((o) => Number(o) > 255)) { out.appendChild(h('div', { class: 'feedback bad' }, 'Type a valid IPv4 address.')); return; }
      const res = ROUTES.map((r) => { const mask = r[1] === 0 ? 0 : (0xffffffff << (32 - r[1])) >>> 0; return { r, match: ((n(d) & mask) >>> 0) === ((n(r[0]) & mask) >>> 0) }; });
      const best = res.filter((x) => x.match).sort((a, b) => b.r[1] - a.r[1])[0];
      const bitsRow = (ip, len) => h('div', { class: 'bits tight' }, ...bin(ip).split('.').map((oct, o) => h('span', { class: 'oct' }, ...oct.split('').map((b, k) => h('span', { style: o * 8 + k < len ? { background: 'var(--accent-soft)', fontWeight: 700 } : null }, b)))));
      out.append(h('div', { class: 'small muted', style: { margin: '8px 0 4px' } }, 'Destination ' + d + ' in binary:'), bitsRow(d, 0),
        h('div', { class: 'scroll', style: { marginTop: '10px' } }, h('table', { class: 't small compact' }, h('tr', null, h('th', null, 'Route'), h('th', null, 'Bits that must match'), h('th', null, 'Match?')),
          ...res.map((x) => h('tr', { style: best && x === best ? { outline: '2px solid var(--ok)' } : null }, h('td', { class: 'mono' }, x.r[2] + ' ' + x.r[0] + '/' + x.r[1] + ' via ' + x.r[3]), h('td', null, bitsRow(x.r[0], x.r[1])),
            h('td', null, x.match ? (x === best ? h('strong', { style: { color: 'var(--ok)' } }, 'longest match') : 'yes, ' + x.r[1] + ' bits') : 'no'))))),
        h('div', { class: 'feedback ok' }, h('strong', null, 'Forward via ' + best.r[3] + '. '), best.r[1] === 0 ? 'Only the default route matches (0 bits), so it is the gateway of last resort.' : best.r[0] + '/' + best.r[1] + ' matches ' + best.r[1] + ' far-left bits, more than any other matching route.'));
    }
    inp.addEventListener('input', draw);
    box(c, 'Longest match', 'type a destination and watch the router choose', h('div', { class: 'row' }, h('label', { for: 'lm-dst' }, 'Destination'), inp,
      ...['172.16.0.10', '172.16.0.200', '172.31.5.5', '192.168.1.77', '8.8.8.8'].map((v) => h('button', { class: 'btn small ghost', type: 'button', onclick: () => { inp.value = v; draw(); } }, v))), out);
    draw();
  };

  /* ------------------------------------------------ 15.1 / 15.2 static route builder */
  W.routetypes = function (c) {
    const T = {
      'Next-hop': { v4: 'ip route 192.168.2.0 255.255.255.0 172.16.2.2', v6: 'ipv6 route 2001:db8:cafe:2::/64 2001:db8:acad:2::2', t4: 'S    192.168.2.0/24 [1/0] via 172.16.2.2', t6: 'S   2001:DB8:CAFE:2::/64 [1/0]\n     via 2001:DB8:ACAD:2::2', note: 'Recommended. The exit interface is derived from the next hop.' },
      'Directly connected': { v4: 'ip route 192.168.2.0 255.255.255.0 s0/1/0', v6: 'ipv6 route 2001:db8:cafe:2::/64 s0/1/0', t4: 'S    192.168.2.0/24 is directly connected, Serial0/1/0', t6: 'S   2001:DB8:CAFE:2::/64 [1/0]\n     via Serial0/1/0, directly connected', note: 'Only for point-to-point serial interfaces.' },
      'Fully specified': { v4: 'ip route 192.168.2.0 255.255.255.0 g0/0/1 172.16.2.2', v6: 'ipv6 route 2001:db8:cafe:2::/64 s0/1/0 fe80::2', t4: 'S    192.168.2.0/24 [1/0] via 172.16.2.2, GigabitEthernet0/0/1', t6: 'S   2001:DB8:CAFE:2::/64 [1/0]\n     via FE80::2, Serial0/1/0', note: 'For multi-access exit interfaces, and required for an IPv6 link-local next hop.' },
      'Default': { v4: 'ip route 0.0.0.0 0.0.0.0 172.16.2.2', v6: 'ipv6 route ::/0 2001:db8:acad:2::2', t4: 'Gateway of last resort is 172.16.2.2 to network 0.0.0.0\nS*   0.0.0.0/0 [1/0] via 172.16.2.2', t6: 'S   ::/0 [1/0]\n     via 2001:DB8:ACAD:2::2', note: 'Matches everything with 0 bits; used when nothing more specific matches.' },
      'Floating': { v4: 'ip route 0.0.0.0 0.0.0.0 10.10.10.2 5', v6: 'ipv6 route ::/0 2001:db8:feed:10::2 5', t4: '(not in the table while a route with a lower AD exists)', t6: '(not in the table while a route with a lower AD exists)', note: 'A backup: AD 5 loses to the primary\'s AD 1 until the primary disappears.' },
      'Host': { v4: 'ip route 209.165.200.238 255.255.255.255 198.51.100.2', v6: 'ipv6 route 2001:db8:acad:2::238/128 2001:db8:acad:1::2', t4: 'S    209.165.200.238/32 [1/0] via 198.51.100.2', t6: 'S   2001:DB8:ACAD:2::238/128 [1/0]\n     via 2001:DB8:ACAD:1::2', note: 'Matches one address: /32 or /128, the longest possible match.' },
    };
    let type = 'Next-hop', v = 'v4';
    const out = h('div');
    function draw() {
      const t = T[type];
      out.innerHTML = '';
      out.append(h('pre', { class: 'out' }, 'R1(config)# ' + t[v] + '\n\nR1# show ' + (v === 'v4' ? 'ip' : 'ipv6') + ' route static\n' + t[v === 'v4' ? 't4' : 't6']), h('div', { class: 'feedback info' }, t.note));
    }
    box(c, 'Static route builder', 'pick a type and a protocol', seg(Object.keys(T), (i, l) => { type = l; draw(); }), h('div', { style: { height: '8px' } }), seg(['IPv4', 'IPv6'], (i) => { v = i ? 'v6' : 'v4'; draw(); }), h('div', { style: { height: '10px' } }), out);
    draw();
  };

  /* ------------------------------------------------ 15.4 administrative distance and floating routes */
  W.adfloat = function (c) {
    let primary = 'static', up = true, fad = 5;
    const AD = { static: 1, EIGRP: 90, OSPF: 110, RIP: 120 };
    const out = h('div');
    function draw() {
      const pad = AD[primary];
      const cands = [];
      if (up) cands.push({ name: 'Primary (' + primary + ') via 172.16.2.2', ad: pad, code: primary === 'static' ? 'S*' : primary === 'OSPF' ? 'O*E2' : primary === 'EIGRP' ? 'D*EX' : 'R*' });
      cands.push({ name: 'Floating static via 10.10.10.2', ad: fad, code: 'S*' });
      const best = cands.sort((a, b) => a.ad - b.ad)[0];
      out.innerHTML = '';
      out.append(h('pre', { class: 'out' }, 'R1# show ip route | include 0.0.0.0/0\n' + best.code + '   0.0.0.0/0 [' + best.ad + '/0] via ' + (best.name.includes('10.10.10.2') ? '10.10.10.2' : '172.16.2.2')),
        h('div', { class: 'feedback ' + (best.name.startsWith('Floating') && up ? 'bad' : 'ok') }, best.name.startsWith('Floating')
          ? (up ? 'The "backup" has the lower AD (' + fad + ' < ' + pad + '), so it is used all the time. A floating route needs a higher AD than the primary.' : 'The primary is gone, so the floating route (AD ' + fad + ') is installed.')
          : 'The primary (AD ' + pad + ') is installed. The floating route (AD ' + fad + ') is configured but hidden.'));
    }
    const slider = h('input', { type: 'range', min: '1', max: '200', value: '5', id: 'af-ad', 'aria-label': 'Floating route administrative distance', oninput: (e) => { fad = Number(e.target.value); val.textContent = String(fad); draw(); } });
    const val = h('strong', { class: 'kv' }, '5');
    box(c, 'Floating static route', 'administrative distance decides which route is installed',
      h('div', { class: 'grid two' }, select('af-p', 'Primary default route learned by', Object.keys(AD), 'static', (v) => { primary = v; draw(); }),
        h('div', { class: 'field' }, h('label', { for: 'af-ad' }, 'Floating route AD: ', val), slider)),
      h('div', { class: 'btn-row', style: { margin: '10px 0' } }, h('button', { class: 'btn small', type: 'button', onclick: (e) => { up = !up; e.currentTarget.textContent = up ? 'Fail the primary link' : 'Restore the primary link'; draw(); } }, 'Fail the primary link')), out);
    draw();
  };
})(typeof window !== 'undefined' ? window : globalThis);
