/* Test helper: turns configuration commands into Packet Tracer-style output (show running-config,
 * show vlan brief, show ip interface brief, show interfaces trunk, show ip route ...) so lab checks can
 * be tested without a real Packet Tracer. It understands the commands the labs use; it is not a simulator. */
'use strict';

const IFNAMES = [['fastethernet', 'FastEthernet', 'Fa'], ['gigabitethernet', 'GigabitEthernet', 'Gig'], ['serial', 'Serial', 'Se'], ['vlan', 'Vlan', 'Vlan'],
  ['loopback', 'Loopback', 'Lo'], ['port-channel', 'Port-channel', 'Po']];
function ifc(name) {
  const s = String(name).replace(/\s+/g, '');
  const m = /^([a-z-]+?)(\d.*)$/i.exec(s);
  if (!m) return s;
  const p = m[1].toLowerCase();
  for (const [full, nice] of IFNAMES) if (full.startsWith(p) || (p === 'po' && full === 'port-channel')) return nice + m[2];
  return s;
}
const short = (n) => { for (const [, nice, sh] of IFNAMES) if (n.startsWith(nice)) return sh + n.slice(nice.length); return n; };
function expandRange(spec) {
  const out = [];
  for (const part of spec.split(',')) {
    const p = part.trim().replace(/\s*-\s*/, '-');
    const m = /^(.*?)(\d+)-(\d+)$/.exec(p);
    if (m && /\//.test(m[1])) { for (let i = Number(m[2]); i <= Number(m[3]); i++) out.push(ifc(m[1] + i)); } else out.push(ifc(p));
  }
  return out;
}
const MODELS = {
  '2960': { kind: 'switch', ports: [...Array(24)].map((_, i) => 'FastEthernet0/' + (i + 1)).concat(['GigabitEthernet0/1', 'GigabitEthernet0/2']), vty: [[0, 4], [5, 15]], image: 'C2960-LANBASEK9-M' },
  '3650': { kind: 'l3switch', ports: [...Array(24)].map((_, i) => 'GigabitEthernet1/0/' + (i + 1)).concat([1, 2, 3, 4].map((i) => 'GigabitEthernet1/1/' + i)), vty: [[0, 4], [5, 15]], image: 'CAT3K_CAA-UNIVERSALK9-M' },
  '4321': { kind: 'router', ports: ['GigabitEthernet0/0/0', 'GigabitEthernet0/0/1'], vty: [[0, 4]], image: 'ISR4300-UNIVERSALK9-M' },
  '4331': { kind: 'router', ports: ['GigabitEthernet0/0/0', 'GigabitEthernet0/0/1', 'GigabitEthernet0/0/2'], vty: [[0, 4]], image: 'ISR4300-UNIVERSALK9-M' },
};
const XLAT = 'dsfd;kfoA,.iyewrkldJKDHSUBsgvca69834ncxv9873254k;fg87';
function type7(pw) { let out = '05'; for (let i = 0; i < pw.length; i++) out += (pw.charCodeAt(i) ^ XLAT.charCodeAt((5 + i) % XLAT.length)).toString(16).toUpperCase().padStart(2, '0'); return out; }
const mask2len = (m) => m.split('.').reduce((n, o) => n + (Number(o).toString(2).match(/1/g) || []).length, 0);
const netOf = (ip, len) => { const n = ip.split('.').reduce((a, o) => a * 256 + Number(o), 0); const v = len === 0 ? 0 : (n & ((0xffffffff << (32 - len)) >>> 0)) >>> 0; return [24, 16, 8, 0].map((s) => (v >>> s) & 255).join('.'); };

class Device {
  constructor(name, model) {
    this.model = MODELS[model];
    this.hostname = this.model.kind === 'router' ? 'Router' : 'Switch';
    this.globals = [];
    this.intfs = new Map();
    for (const p of this.model.ports) this.intfs.set(p, { name: p, lines: [], shutdown: this.model.kind === 'router' });
    if (this.model.kind !== 'router') this.intfs.set('Vlan1', { name: 'Vlan1', lines: [], shutdown: true });
    this.lines = [{ head: 'line con 0', lines: [] }].concat(this.model.vty.map(([a, b]) => ({ head: 'line vty ' + a + ' ' + b, from: a, to: b, lines: [] })));
    this.blocks = [];
    this.vlans = new Map([[1, 'default']]);
    this.encrypt = false;
    this.banner = null;
    this.name = name;
  }
  intf(n) {
    const k = ifc(n);
    if (!this.intfs.has(k)) this.intfs.set(k, { name: k, lines: [], shutdown: /^(GigabitEthernet|FastEthernet)\d+\/\d+\/?\d*\.\d+$/.test(k) ? false : false });
    return this.intfs.get(k);
  }
  run(cmds) {
    let ctx = null; // { type: 'if', list } | { type: 'line', list } | { type: 'block', b } | { type: 'vlan', ids }
    for (let raw of cmds) {
      const c = raw.trim();
      if (!c || c === 'enable' || c === 'configure terminal' || c === 'end' || /^copy /.test(c) || c === '#') { if (c === 'end') ctx = null; continue; }
      if (c === 'exit') { ctx = null; continue; }
      let m;
      if ((m = /^interface range (.*)$/i.exec(c))) { ctx = { type: 'if', list: expandRange(m[1]).map((n) => this.intf(n)) }; continue; }
      if ((m = /^interface (.*)$/i.exec(c))) { ctx = { type: 'if', list: [this.intf(m[1])] }; if (/^vlan/i.test(m[1].replace(/\s/g, ''))) { const v = Number(m[1].replace(/\D/g, '')); if (!this.intfs.get('Vlan' + v).touched) { this.intfs.get('Vlan' + v).touched = true; } } continue; }
      if ((m = /^line (con|console|vty) (\d+)(?: (\d+))?$/i.exec(c))) {
        if (/^con/i.test(m[1])) ctx = { type: 'line', list: [this.lines[0]] };
        else { const a = Number(m[2]), b = Number(m[3] || m[2]); ctx = { type: 'line', list: this.lines.filter((l) => l.from !== undefined && l.to >= a && l.from <= b) }; }
        continue;
      }
      if ((m = /^vlan ([\d,-]+)$/.exec(c))) { const ids = m[1].split(',').map(Number); for (const id of ids) if (!this.vlans.has(id)) this.vlans.set(id, 'VLAN' + String(id).padStart(4, '0')); ctx = { type: 'vlan', ids }; continue; }
      if ((m = /^no vlan (\d+)$/.exec(c))) { this.vlans.delete(Number(m[1])); ctx = null; continue; }
      if ((m = /^(router ospf \d+|ip dhcp pool \S+|ipv6 dhcp pool \S+|radius server \S+)$/.exec(c))) {
        let b = this.blocks.find((x) => x.head === m[1]);
        if (!b) { b = { head: m[1], lines: [] }; this.blocks.push(b); }
        ctx = { type: 'block', b };
        continue;
      }
      if (ctx && ctx.type === 'vlan') { if ((m = /^name (\S+)/.exec(c))) for (const id of ctx.ids) this.vlans.set(id, m[1]); continue; }
      if (ctx && ctx.type === 'block') { ctx.b.lines.push(c); continue; }
      if (ctx && ctx.type === 'line') { for (const l of ctx.list) this.lineCmd(l, c); continue; }
      if (ctx && ctx.type === 'if') { for (const i of ctx.list) this.ifCmd(i, c); continue; }
      this.globalCmd(c);
    }
    return this;
  }
  lineCmd(l, c) {
    let m;
    if ((m = /^password (\S+)/.exec(c))) { l.lines = l.lines.filter((x) => !/^password/.test(x)); l.lines.unshift('password ' + m[1]); l.pw = m[1]; return; }
    if (/^no /.test(c)) { const k = c.slice(3); l.lines = l.lines.filter((x) => !x.startsWith(k)); return; }
    const key = c.split(' ')[0] === 'transport' ? 'transport input' : c.split(' ')[0];
    l.lines = l.lines.filter((x) => !x.startsWith(key));
    l.lines.push(c);
  }
  ifCmd(i, c) {
    let m;
    if (c === 'shutdown') { i.shutdown = true; return; }
    if (c === 'no shutdown') { i.shutdown = false; return; }
    if ((m = /^switchport access vlan (\d+)/.exec(c)) && !this.vlans.has(Number(m[1]))) this.vlans.set(Number(m[1]), 'VLAN' + m[1].padStart(4, '0'));
    if ((m = /^channel-group (\d+) mode/.exec(c))) { const po = this.intf('Port-channel' + m[1]); if (!po.lines.length) po.lines = i.lines.filter((x) => /^switchport (mode|trunk)/.test(x)); }
    if ((m = /^switchport trunk allowed vlan add (\S+)/.exec(c))) {
      const cur = i.lines.find((x) => /^switchport trunk allowed vlan /.test(x));
      if (cur) { i.lines = i.lines.filter((x) => x !== cur); i.lines.push(cur + ',' + m[1]); }
      return;
    }
    if ((m = /^ipv6 address (\S+)/.exec(c))) { i.lines.push(c.replace(m[1], m[1].toUpperCase())); return; }
    if ((m = /^encapsulation dot1q (\d+)/i.exec(c))) { i.lines = i.lines.filter((x) => !/^(encapsulation|ip address)/i.test(x)); i.lines.push('encapsulation dot1Q ' + m[1] + (/native/.test(c) ? ' native' : '')); return; }
    if (/^no /.test(c)) {
      const k = c.slice(3);
      if (k === 'switchport') { i.lines = i.lines.filter((x) => !/^switchport/.test(x)); i.lines.push('no switchport'); return; }
      i.lines = i.lines.filter((x) => !x.toLowerCase().startsWith(k.toLowerCase()));
      if (/^(cdp enable|lldp transmit|lldp receive)$/.test(k)) i.lines.push(c); // shown in the running-config
      return;
    }
    const keyOf = (x) => {
      const r = [/^switchport mode/, /^switchport access vlan/, /^switchport voice vlan/, /^switchport trunk native/, /^switchport trunk allowed/, /^ip address/, /^description/, /^speed/, /^duplex/, /^channel-group/,
        /^switchport port-security maximum/, /^switchport port-security violation/, /^standby \d+ priority/, /^standby \d+ ip/, /^ip dhcp snooping limit/];
      return r.find((re) => re.test(x));
    };
    const k = keyOf(c);
    if (k) i.lines = i.lines.filter((x) => !k.test(x));
    i.lines.push(c);
  }
  globalCmd(c) {
    let m;
    if ((m = /^hostname (\S+)/.exec(c))) { this.hostname = m[1]; return; }
    if (c === 'service password-encryption') { this.encrypt = true; this.globals.push(c); return; }
    if ((m = /^banner motd (.)(.*)\1$/.exec(c))) { this.banner = m[2].trim(); return; }
    if ((m = /^enable secret (\S+)/.exec(c))) { this.globals = this.globals.filter((x) => !/^enable secret/.test(x)); this.globals.push('enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0'); return; }
    if ((m = /^username (\S+) secret (\S+)/.exec(c))) { this.globals.push('username ' + m[1] + ' secret 5 $1$mERr$5.a6P4JqbNiMX01usIfka/'); return; }
    if (/^crypto key generate rsa/.test(c)) { this.rsa = true; return; }
    if ((m = /^spanning-tree vlan (\S+) root (primary|secondary)/.exec(c))) { this.globals.push('spanning-tree vlan ' + m[1] + ' priority ' + (m[2] === 'primary' ? 24576 : 28672)); return; }
    if ((m = /^ipv6 route (\S+) (.*)$/.exec(c))) { this.globals.push('ipv6 route ' + m[1].toUpperCase() + ' ' + m[2].replace(/([0-9a-f:]{3,})/gi, (x) => (/:/.test(x) ? x.toUpperCase() : x)).replace(/\b(g|gi|gig)(\d)/i, 'GigabitEthernet$2')); return; }
    if ((m = /^ip route (.*)$/.exec(c))) { this.globals.push('ip route ' + m[1].replace(/\b(g|gi|gig)(\d)/i, 'GigabitEthernet$2')); return; }
    if (c === 'no ip domain lookup' || c === 'no ip domain-lookup') { this.globals.push('no ip domain-lookup'); return; }
    if ((m = /^ip domain[- ]name (\S+)/.exec(c))) { this.globals.push('ip domain-name ' + m[1]); return; }
    if (/^no /.test(c)) {
      const k = c.slice(3).toLowerCase();
      this.globals = this.globals.filter((x) => !x.toLowerCase().startsWith(k));
      if (/^(cdp run|lldp run)$/.test(k)) this.globals.push(c);
      return;
    }
    this.globals.push(c);
  }
  /* ---------- output ---------- */
  showRun() {
    const L = ['Building configuration...', '', 'Current configuration : 1234 bytes', '!', 'version 15.0', 'no service timestamps log datetime msec'];
    if (this.encrypt) L.push('service password-encryption');
    L.push('!', 'hostname ' + this.hostname, '!');
    for (const g of this.globals.filter((x) => x !== 'service password-encryption' && !/^(ip route|ipv6 route|ip default-gateway|ip dhcp|banner)/.test(x))) L.push(g);
    if (this.model.kind !== 'router') { if (!this.globals.some((x) => /^spanning-tree mode/.test(x))) L.push('spanning-tree mode pvst'); L.push('spanning-tree extend system-id'); }
    for (const g of this.globals.filter((x) => /^ip dhcp/.test(x))) L.push(g);
    L.push('!');
    for (const b of this.blocks.filter((x) => /dhcp pool/.test(x.head))) { L.push(b.head); for (const l of b.lines) L.push(' ' + l); L.push('!'); }
    for (const i of this.intfs.values()) {
      L.push('interface ' + i.name);
      for (const l of i.lines) L.push(' ' + l);
      if (i.name.startsWith('Vlan') && !i.lines.some((x) => /^ip address/.test(x))) L.push(' no ip address');
      if (i.shutdown) L.push(' shutdown');
      L.push('!');
    }
    for (const b of this.blocks.filter((x) => !/dhcp pool/.test(x.head))) { L.push(b.head); for (const l of b.lines) L.push(' ' + l); L.push('!'); }
    for (const g of this.globals.filter((x) => /^(ip route|ipv6 route|ip default-gateway)/.test(x))) L.push(g);
    if (this.banner) L.push('!', 'banner motd ^C' + this.banner + '^C');
    L.push('!');
    for (const l of this.lines) {
      L.push(l.head);
      for (const x of l.lines) { const m = /^password (\S+)/.exec(x); L.push(' ' + (m && this.encrypt ? 'password 7 ' + type7(m[1]) : x)); }
    }
    L.push('!', 'end');
    return this.hostname + '#show running-config\n' + L.join('\n') + '\n';
  }
  showStart() { return this.showRun().replace('#show running-config', '#show startup-config').replace('Current configuration', 'Using 1234 out of 65536 bytes\n!\nCurrent configuration').replace('Building configuration...\n', ''); }
  modeOf(i) { const m = i.lines.map((x) => /^switchport mode (\S+)/.exec(x)).find(Boolean); return m ? m[1] : (i.lines.includes('no switchport') ? 'routed' : 'dynamic'); }
  accessOf(i) { const m = i.lines.map((x) => /^switchport access vlan (\d+)/.exec(x)).find(Boolean); return m ? Number(m[1]) : 1; }
  showVlan() {
    const rows = ['VLAN Name                             Status    Ports', '---- -------------------------------- --------- -------------------------------'];
    const ids = [...this.vlans.keys()].sort((a, b) => a - b);
    for (const id of ids) {
      const ports = [...this.intfs.values()].filter((i) => this.model.ports.includes(i.name) && this.modeOf(i) !== 'trunk' && this.modeOf(i) !== 'routed' && !i.lines.some((x) => /^channel-group/.test(x)) && this.accessOf(i) === id).map((i) => short(i.name));
      const chunks = [];
      for (let k = 0; k < ports.length; k += 4) chunks.push(ports.slice(k, k + 4).join(', '));
      rows.push(String(id).padEnd(5) + this.vlans.get(id).padEnd(33) + 'active    ' + (chunks[0] || ''));
      for (const ch of chunks.slice(1)) rows.push(' '.repeat(48) + ch);
    }
    for (const [id, n] of [[1002, 'fddi-default'], [1003, 'token-ring-default'], [1004, 'fddinet-default'], [1005, 'trnet-default']]) rows.push(String(id).padEnd(5) + n.padEnd(33) + 'active    ');
    return this.hostname + '#show vlan brief\n\n' + rows.join('\n') + '\n';
  }
  ipOf(i) { const m = i.lines.map((x) => /^ip address (\S+) (\S+)/.exec(x)).find(Boolean); return m ? { ip: m[1], mask: m[2] } : null; }
  showIpBrief(down) {
    const rows = ['Interface              IP-Address      OK? Method Status                Protocol'];
    for (const i of this.intfs.values()) {
      if (i.name.startsWith('Vlan') && i.name !== 'Vlan1' && !i.touched && !this.ipOf(i)) continue;
      const ip = this.ipOf(i);
      const st = i.shutdown ? ['administratively down', 'down'] : (down || []).includes(i.name) ? ['down', 'down'] : ['up', 'up'];
      rows.push((i.name + ' ').padEnd(23) + (ip ? ip.ip : 'unassigned').padEnd(16) + 'YES ' + (ip ? 'manual' : 'unset ').padEnd(7) + st[0].padEnd(22) + st[1]);
    }
    return this.hostname + '#show ip interface brief\n' + rows.join('\n') + '\n';
  }
  showTrunk() {
    const tr = [...this.intfs.values()].filter((i) => this.modeOf(i) === 'trunk' && !i.lines.some((x) => /^channel-group/.test(x)));
    if (!tr.length) return this.hostname + '#show interfaces trunk\n';
    const nat = (i) => { const m = i.lines.map((x) => /^switchport trunk native vlan (\d+)/.exec(x)).find(Boolean); return m ? Number(m[1]) : 1; };
    const allowed = (i) => { const m = i.lines.map((x) => /^switchport trunk allowed vlan (\S+)/.exec(x)).find(Boolean); return m ? m[1] : '1-1005'; };
    const inList = (list, v) => list.split(',').some((p) => { const r = p.split('-').map(Number); return r.length === 2 ? v >= r[0] && v <= r[1] : v === r[0]; });
    const active = (i) => [...this.vlans.keys()].sort((a, b) => a - b).filter((v) => inList(allowed(i), v)).join(',');
    const L = ['Port        Mode         Encapsulation  Status        Native vlan'];
    for (const i of tr) L.push(short(i.name).padEnd(12) + 'on           802.1q         trunking      ' + nat(i));
    L.push('', 'Port        Vlans allowed on trunk');
    for (const i of tr) L.push(short(i.name).padEnd(12) + allowed(i));
    L.push('', 'Port        Vlans allowed and active in management domain');
    for (const i of tr) L.push(short(i.name).padEnd(12) + active(i));
    L.push('', 'Port        Vlans in spanning tree forwarding state and not pruned');
    for (const i of tr) L.push(short(i.name).padEnd(12) + active(i));
    return this.hostname + '#show interfaces trunk\n' + L.join('\n') + '\n';
  }
  /* connected + local + static routes from the configuration; extra lines (OSPF ...) are appended */
  showRoute(extra) {
    const L = ['Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP', '       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area', '       * - candidate default, U - per-user static route, o - ODR', ''];
    const statics = this.globals.map((x) => /^ip route (\S+) (\S+) (\S+)(?: (\d+))?/.exec(x)).filter(Boolean);
    const groups = new Map();
    const def = statics.filter((s) => s[1] === '0.0.0.0').sort((a, b) => Number(a[4] || 1) - Number(b[4] || 1))[0];
    L.push(def ? 'Gateway of last resort is ' + def[3] + ' to network 0.0.0.0' : 'Gateway of last resort is not set', '');
    const add = (net, len, line) => { const k = net; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(line); };
    for (const i of this.intfs.values()) {
      const ip = this.ipOf(i);
      if (!ip || i.shutdown) continue;
      const len = mask2len(ip.mask);
      add(netOf(ip.ip, len), len, 'C       ' + netOf(ip.ip, len) + '/' + len + ' is directly connected, ' + i.name);
      add(ip.ip, 32, 'L       ' + ip.ip + '/32 is directly connected, ' + i.name);
    }
    const best = new Map();
    for (const s of statics) { if (s[1] === '0.0.0.0') continue; const k = s[1] + '/' + mask2len(s[2]); const ad = Number(s[4] || 1); if (!best.has(k) || best.get(k).ad > ad) best.set(k, { s, ad }); }
    for (const { s, ad } of best.values()) add(s[1], mask2len(s[2]), 'S       ' + s[1] + '/' + mask2len(s[2]) + ' [' + ad + '/0] via ' + s[3]);
    for (const lines of groups.values()) for (const l of lines) L.push(l);
    for (const e of extra || []) L.push(e);
    if (def) L.push('S*   0.0.0.0/0 [' + Number(def[4] || 1) + '/0] via ' + def[3]);
    return this.hostname + '#show ip route\n' + L.join('\n') + '\n';
  }
  showRoute6(extra) {
    const L = ['IPv6 Routing Table - 10 entries', 'Codes: C - Connected, L - Local, S - Static, R - RIP, B - BGP'];
    const statics = this.globals.map((x) => /^ipv6 route (\S+)\/(\d+) (.*?)(?: (\d+))?$/.exec(x)).filter(Boolean);
    const best = new Map();
    for (const s of statics) { const k = s[1] + '/' + s[2]; const ad = Number(s[4] || 1); if (!best.has(k) || best.get(k).ad > ad) best.set(k, { s, ad }); }
    for (const { s, ad } of best.values()) {
      const parts = s[3].split(/\s+/);
      const nh = parts.find((p) => /:/.test(p));
      const ifn = parts.find((p) => /^[A-Za-z]/.test(p) && !/:/.test(p));
      L.push('S   ' + s[1] + '/' + s[2] + ' [' + ad + '/0]', '     via ' + (nh ? nh + (ifn ? ', ' + ifc(ifn) : '') : ifc(ifn) + ', directly connected'));
    }
    for (const i of this.intfs.values()) {
      if (i.shutdown) continue;
      for (const x of i.lines) {
        const m = /^ipv6 address (\S+)\/(\d+)$/.exec(x);
        if (!m) continue;
        const pre = m[1].replace(/::?[0-9A-F]*$/i, '::');
        L.push('C   ' + pre + '/' + m[2] + ' [0/0]', '     via ' + i.name + ', directly connected', 'L   ' + m[1] + '/128 [0/0]', '     via ' + i.name + ', receive');
      }
    }
    for (const e of extra || []) L.push(e);
    L.push('L   FF00::/8 [0/0]', '     via Null0, receive');
    return this.hostname + '#show ipv6 route\n' + L.join('\n') + '\n';
  }
}

/* ---------- other outputs ---------- */
const fx = {
  device(name, model, ...cmdLists) { const d = new Device(name, model); for (const c of cmdLists) if (c) d.run(c); return d; },
  ping(target, ok, ios) {
    if (ios) return '#ping ' + target + '\n\nType escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ' + target.toUpperCase() + ', timeout is 2 seconds:\n' + (ok ? '!!!!!' : '.....') + '\nSuccess rate is ' + (ok ? '100 percent (5/5), round-trip min/avg/max = 0/0/1 ms' : '0 percent (0/5)') + '\n';
    const body = ok ? [1, 2, 3, 4].map(() => 'Reply from ' + target + ': bytes=32 time<1ms TTL=127') : [1, 2, 3, 4].map(() => 'Request timed out.');
    return 'C:\\>ping ' + target + '\n\nPinging ' + target + ' with 32 bytes of data:\n\n' + body.join('\n') + '\n\nPing statistics for ' + target + ':\n    Packets: Sent = 4, Received = ' + (ok ? 4 : 0) + ', Lost = ' + (ok ? 0 : 4) + ' (' + (ok ? 0 : 100) + '% loss),\n';
  },
  iosPing(host, target, ok) { return host + fx.ping(target, ok, true); },
  trace(target, hops, ios) {
    if (ios) return '#traceroute ' + target + '\nType escape sequence to abort.\nTracing the route to ' + target + '\n\n' + hops.map((h, i) => '  ' + (i + 1) + ' ' + h + ' 0 msec 0 msec 0 msec').join('\n') + '\n';
    return 'C:\\>tracert ' + target + '\n\nTracing route to ' + target + ' over a maximum of 30 hops: \n\n' + hops.map((h, i) => '  ' + (i + 1) + '   0 ms      0 ms      0 ms      ' + h).join('\n') + '\n\nTrace complete.\n';
  },
  ipconfig(o) {
    const L = ['C:\\>ipconfig /all', '', (o.wireless ? 'Wireless0' : 'FastEthernet0') + ' Connection:(default port)', '',
      '   Connection-specific DNS Suffix..: ' + (o.suffix || ''), '   Physical Address................: ' + (o.mac || '0060.7036.2849'),
      '   Link-local IPv6 Address.........: ' + (o.ll || 'FE80::260:70FF:FE36:2849'), '   IPv6 Address....................: ' + (o.ipv6 || '::'),
      '   IPv4 Address....................: ' + (o.ipv4 || '0.0.0.0'), '   Subnet Mask.....................: ' + (o.mask || '255.255.255.0'),
      '   Default Gateway.................: ' + (o.gw6 || '::'), '                                     ' + (o.gw || '0.0.0.0'),
      '   DHCP Servers....................: ' + (o.dhcp || '0.0.0.0'), '   DNS Servers.....................: ' + (o.dns6 || '::'), '                                     ' + (o.dns || '0.0.0.0'), ''];
    return L.join('\n');
  },
  session(proto, target, user, ok, host) {
    const cmd = proto === 'ssh' ? 'ssh -l ' + user + ' ' + target : 'telnet ' + target;
    if (!ok) return 'C:\\>' + cmd + '\nTrying ' + target + ' ...\n% Connection refused by remote host\n';
    return 'C:\\>' + cmd + '\n' + (proto === 'telnet' ? 'Trying ' + target + ' ...Open\n\nUser Access Verification\n\n' : '\n') + 'Password: \n\n' + host + '>exit\n\n[Connection to ' + target + ' closed by foreign host]\n';
  },
  version(host, image) { return host + '#show version\nCisco IOS Software, C2960 Software (' + image + '), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)\nROM: Bootstrap program is C2960 boot loader\n'; },
  ssh(host, v) { return host + '#show ip ssh\nSSH Enabled - version ' + (v || '2.0') + '\nAuthentication timeout: 120 secs; Authentication retries: 3\n'; },
  ifaces(host, name, duplex, speed) { return host + '#show interfaces ' + name + '\n' + name + ' is up, line protocol is up (connected)\n  Hardware is Lance, address is 0001.4320.1a01 (bia 0001.4320.1a01)\n  ' + duplex + '-duplex, ' + speed + 'Mb/s\n'; },
  mac(host, rows) { return host + '#show mac address-table\n          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n\n' + rows.map((r) => '   ' + r[0] + '    ' + r[1] + '    DYNAMIC     ' + r[2]).join('\n') + '\n'; },
  ether(host, rows) {
    return host + '#show etherchannel summary\nFlags:  D - down        P - in port-channel\n        U - in use      S - Layer2\n\nNumber of channel-groups in use: ' + rows.length + '\nNumber of aggregators:           ' + rows.length + '\n\nGroup  Port-channel  Protocol    Ports\n------+-------------+-----------+----------------------------------------------\n\n' +
      rows.map((r) => r[0] + '      Po' + r[0] + '(' + r[1] + ')           ' + r[2] + '   ' + r[3].map((p) => p + '(' + (r[1] === 'SU' ? 'P' : 'D') + ')').join(' ')).join('\n') + '\n';
  },
  stp(host, vlans) {
    let out = host + '#show spanning-tree\n';
    for (const v of vlans) {
      const id = 'VLAN' + String(v.vlan).padStart(4, '0');
      out += id + '\n  Spanning tree enabled protocol ' + (v.proto || 'ieee') + '\n  Root ID    Priority    ' + v.rootPrio + '\n             Address     ' + v.rootMac + '\n' +
        (v.root ? '             This bridge is the root\n' : '             Cost        ' + v.cost + '\n             Port        ' + v.rootPortNum + '(' + v.rootPort + ')\n') +
        '             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec\n\n  Bridge ID  Priority    ' + v.prio + '  (priority ' + (v.prio - v.vlan) + ' sys-id-ext ' + v.vlan + ')\n             Address     ' + v.mac +
        '\n             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec\n             Aging Time  20\n\nInterface        Role Sts Cost      Prio.Nbr Type\n---------------- ---- --- --------- -------- --------------------------------\n' +
        v.ports.map((p) => p[0].padEnd(17) + p[1] + ' ' + p[2] + ' 19        128.' + p[0].replace(/\D+/, '').split('/').pop() + '    P2p').join('\n') + '\n\n';
    }
    return out;
  },
  standby(host, rows) { return host + '#show standby brief\n                     P indicates configured to preempt.\n                     |\nInterface   Grp  Pri P State    Active          Standby         Virtual IP\n' + rows.map((r) => r.join('    ')).join('\n') + '\n'; },
  dhcpbind(host, rows) { return host + '#show ip dhcp binding\nIP address       Client-ID/              Lease expiration        Type\n                 Hardware address\n' + rows.map((r) => r[0].padEnd(17) + r[1].padEnd(25) + '--                     Automatic').join('\n') + '\n'; },
  psecIf(host, port, o) {
    return host + '#show port-security interface ' + port + '\nPort Security              : Enabled\nPort Status                : ' + o.status + '\nViolation Mode             : ' + o.mode + '\nAging Time                 : 0 mins\nAging Type                 : Absolute\nSecureStatic Address Aging : Disabled\nMaximum MAC Addresses      : ' + o.max +
      '\nTotal MAC Addresses        : ' + o.total + '\nConfigured MAC Addresses   : 0\nSticky MAC Addresses       : ' + o.sticky + '\nLast Source Address:Vlan   : ' + (o.last || '0000.0000.0000:0') + '\nSecurity Violation Count   : ' + o.violations + '\n';
  },
  snoop(host, vlans, rows) { return host + '#show ip dhcp snooping\nSwitch DHCP snooping is enabled\nDHCP snooping is configured on following VLANs:\n' + vlans + '\nInsertion of option 82 is disabled\nInterface                  Trusted    Rate limit (pps)\n-----------------------    -------    ----------------\n' + rows.map((r) => r[0].padEnd(27) + r[1].padEnd(11) + r[2]).join('\n') + '\n'; },
  v6if(host, name, o) {
    return host + '#show ipv6 interface ' + name + '\n' + name + ' is up, line protocol is up\n  IPv6 is enabled, link-local address is ' + (o.ll || 'FE80::1') + '\n  Global unicast address(es):\n    ' + o.gua + ', subnet is ' + o.prefix + '\n  Joined group address(es):\n    FF02::1\n    FF02::2\n' +
      '  ND router advertisements are sent every 200 seconds\n' + (o.managed ? '  Hosts use DHCP to obtain routable addresses.\n' : '  Hosts use stateless autoconfig for addresses.\n') + (o.other || o.managed ? '  Hosts use DHCP to obtain other configuration.\n' : '');
  },
  pool6(host, name, prefix, dns, active) { return host + '#show ipv6 dhcp pool\nDHCPv6 pool: ' + name + '\n' + (prefix ? '  Address allocation prefix: ' + prefix + ' valid 172800 preferred 86400 (' + active + ' in use, 0 conflicts)\n' : '') + '  DNS server: ' + dns + '\n  Active clients: ' + active + '\n'; },
  cdp(host, rows) { return host + '#show cdp neighbors\nCapability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge\nDevice ID    Local Intrfce   Holdtme    Capability   Platform    Port ID\n' + rows.map((r) => r[0].padEnd(13) + r[1].padEnd(16) + '145        R            ' + r[2].padEnd(12) + r[3]).join('\n') + '\n'; },
};

module.exports = { Device, fx, ifc, short };
