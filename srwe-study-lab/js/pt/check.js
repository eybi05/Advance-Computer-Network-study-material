/* SRWE Study Lab — Packet Tracer evidence: read pasted CLI / Command Prompt output and grade lab tasks.
 *
 * The learner runs commands in Cisco Packet Tracer and pastes the text here. Output is split
 * into sections at each prompt ("S1#show vlan brief", "C:\>ipconfig"); each section is recognised
 * by its command (abbreviations allowed) or, without a prompt, by the shape of the output.
 * Task checks call helpers such as h.run('S1') or h.pinged('PC1', '10.0.0.1'); when the output a
 * check needs was not pasted, the helper throws Need and the task shows what to paste. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const PT = SRWE.PT = {};

  /* ======================= small utilities ======================= */
  const IFT = [
    ['fastethernet', 'FastEthernet', ['f', 'fa', 'fas', 'fast']], ['gigabitethernet', 'GigabitEthernet', ['g', 'gi', 'gig', 'giga']],
    ['tengigabitethernet', 'TenGigabitEthernet', ['te', 'ten']], ['serial', 'Serial', ['s', 'se', 'ser']], ['vlan', 'Vlan', ['vl', 'vla']],
    ['loopback', 'Loopback', ['lo', 'loop']], ['port-channel', 'Port-channel', ['po']], ['ethernet', 'Ethernet', ['e', 'et', 'eth']],
    ['wlan-gigabitethernet', 'Wlan-GigabitEthernet', ['wlan-gi']], ['tunnel', 'Tunnel', ['tu']],
  ];
  /* "Fa0/1", "gig 0/0/1", "GigabitEthernet0/0/1.20", "Po1" -> "FastEthernet0/1" ... */
  function ifCanon(name) {
    const s = String(name || '').trim().replace(/\s+/g, '');
    const m = /^([A-Za-z][A-Za-z-]*?)(\d.*)$/.exec(s);
    if (!m) return s;
    const p = m[1].toLowerCase();
    for (const [full, nice, abbr] of IFT) if (full === p || abbr.includes(p) || (p.length >= 3 && p !== 'port' && full.startsWith(p))) return nice + m[2];
    return s;
  }
  const ifKey = (n) => ifCanon(n).toLowerCase();
  PT.ifCanon = ifCanon;
  PT.ifKey = ifKey;
  PT.shortIf = (n) => ifCanon(n).replace(/^FastEthernet/, 'Fa').replace(/^GigabitEthernet/, 'G').replace(/^Serial/, 'S').replace(/^Port-channel/, 'Po').replace(/^Loopback/, 'Lo').replace(/^Vlan/, 'VLAN ');

  function v6(a) { return (SRWE.Cmd && SRWE.Cmd.expandV6(String(a || ''))) || String(a || '').toLowerCase(); }
  PT.v6 = v6;
  const sameV6 = (a, b) => v6(a) === v6(b);
  PT.sameV6 = sameV6;
  const IP4 = /\b(\d{1,3}(?:\.\d{1,3}){3})\b/;
  function ip2n(ip) { return ip.split('.').reduce((n, x) => n * 256 + Number(x), 0); }
  function mask2len(m) { if (/^\d+$/.test(String(m))) return Number(m); let n = ip2n(m), len = 0; while (n & 0x80000000) { len++; n = (n << 1) >>> 0; } return len; }
  function len2mask(len) { const n = len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0; return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.'); }
  function netOf(ip, len) { const n = len === 0 ? 0 : (ip2n(ip) & ((0xffffffff << (32 - len)) >>> 0)) >>> 0; return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.'); }
  function inNet(ip, net, len) { return netOf(ip, len) === netOf(net, len); }
  PT.ip = { ip2n, mask2len, len2mask, netOf, inNet };
  const macNorm = (m) => String(m || '').toLowerCase().replace(/[^0-9a-f]/g, '');
  PT.macNorm = macNorm;

  const XLAT = 'dsfd;kfoA,.iyewrkldJKDHSUBsgvca69834ncxv9873254k;fg87';
  function decode7(enc) {
    if (!/^\d{2}([0-9A-Fa-f]{2})*$/.test(enc)) return null;
    let seed = Number(enc.slice(0, 2)), out = '';
    for (let i = 2; i < enc.length; i += 2) out += String.fromCharCode(parseInt(enc.slice(i, i + 2), 16) ^ XLAT.charCodeAt((seed++) % XLAT.length));
    return out;
  }
  PT.decode7 = decode7;

  /* VLAN list "1-5,10,20" -> Set of numbers (or 'all') */
  function vlanSet(list) {
    const s = new Set();
    for (const part of String(list).split(',')) {
      const p = part.trim();
      if (!p) continue;
      const m = /^(\d+)-(\d+)$/.exec(p);
      if (m) { const a = Number(m[1]), b = Number(m[2]); if (b - a < 5000) for (let i = a; i <= b; i++) s.add(i); } else if (/^\d+$/.test(p)) s.add(Number(p));
    }
    return s;
  }
  PT.vlanSet = vlanSet;

  /* ======================= splitting pasted output ======================= */
  const PROMPT = /^([A-Za-z0-9][\w.-]*)(\([\w-]+\))?([#>])[ \t]*(.*)$/;
  const PC_PROMPT = /^(?:[A-Za-z]:\\[^>]*|PC>|Laptop>)>?[ \t]*(.*)$/;
  function clean(text) {
    return String(text || '').replace(/\r\n?/g, '\n').replace(/\x08/g, '').replace(/[ \t]*--More--[ \t]*/g, '').replace(/\t/g, '    ');
  }
  function splitSections(text) {
    const lines = clean(text).split('\n');
    const out = [];
    let cur = { host: null, cmd: null, mode: null, lines: [] };
    for (const ln of lines) {
      let m = PROMPT.exec(ln);
      if (m && !/^(Codes|Gateway|Interface|Port|VLAN|Group|Flags|Building|Current|Secure|Total|Max|Device|Capability|Pinging|Ping|Reply|Request|Packets|Approximate|Tracing|Sending|Success|Type)$/.test(m[1]) && !/^\d+$/.test(m[1])) {
        out.push(cur);
        let cmd = m[4].trim(), skip = false;
        for (let k = 0, mm; k < 3 && (mm = PROMPT.exec(cmd)); k++) { m = mm; cmd = mm[4].trim(); } // "S1#S1#show vlan" from joined pastes
        if (m[2]) { // configuration mode: only "do show ..." produces output worth reading
          if (/^do\s+/i.test(cmd)) cmd = cmd.replace(/^do\s+/i, ''); else skip = true;
        }
        cur = { host: m[1], cmd, skip, mode: m[2] || m[3], lines: [] };
        continue;
      }
      m = PC_PROMPT.exec(ln);
      if (m && /^[A-Za-z]:\\|^PC>|^Laptop>/.test(ln)) {
        out.push(cur);
        cur = { host: null, cmd: m[1].trim(), mode: 'pc', lines: [] };
        continue;
      }
      cur.lines.push(ln);
    }
    out.push(cur);
    return out.filter((s) => s.cmd || s.lines.some((l) => l.trim()));
  }
  PT.splitSections = splitSections;

  /* ======================= recognise a section ======================= */
  function words(cmd) { return String(cmd || '').toLowerCase().replace(/\s+\|.*$/, '').trim().split(/\s+/).filter(Boolean); }
  function pre(w, full, min) { return !!w && full.startsWith(w) && w.length >= (min || 2); }
  /* returns { kind, arg } or null */
  function kindOfCmd(cmd) {
    const w = words(cmd);
    if (!w.length) return null;
    if (/^ipconfig/.test(w[0])) return { kind: 'ipconfig' };
    if (w[0] === 'ping' || pre(w[0], 'ping', 3)) return { kind: 'ping', arg: w.slice(1).join(' ') };
    if (w[0] === 'tracert' || pre(w[0], 'traceroute', 4)) return { kind: 'trace', arg: w[w.length - 1] };
    if (!pre(w[0], 'show', 2)) return null;
    const a = w[1] || '', b = w[2] || '', c = w[3] || '';
    if (pre(a, 'running-config', 2) || pre(a, 'startup-config', 3)) return { kind: pre(a, 'startup-config', 3) ? 'start' : 'run', arg: w.slice(2).join(' ') };
    if (pre(a, 'vlan', 2)) return { kind: 'vlan' };
    if (pre(a, 'interfaces', 2) && pre(b, 'trunk', 2)) return { kind: 'trunk' };
    if (pre(a, 'interfaces', 2) && pre(b, 'switchport', 2)) return { kind: 'swport' };
    if (pre(a, 'interfaces', 2) && pre(b, 'status', 2)) return { kind: 'ifstatus' };
    if (pre(a, 'interfaces', 2) && b && pre(c, 'switchport', 2)) return { kind: 'swport', arg: b };
    if (pre(a, 'interfaces', 2)) return { kind: 'ifaces', arg: w.slice(2).join('') };
    if (a === 'ip' && pre(b, 'interface', 3) && pre(c, 'brief', 2)) return { kind: 'ipbrief' };
    if (a === 'ip' && pre(b, 'interface', 3)) return { kind: 'ipif', arg: w.slice(3).join('') };
    if (a === 'ipv6' && pre(b, 'interface', 3) && pre(c, 'brief', 2)) return { kind: 'ipv6brief' };
    if (a === 'ipv6' && pre(b, 'interface', 3)) return { kind: 'ipv6if', arg: w.slice(3).join('') };
    if (a === 'ip' && pre(b, 'route', 2)) return { kind: 'route' };
    if (a === 'ipv6' && pre(b, 'route', 2)) return { kind: 'route6' };
    if (pre(a, 'etherchannel', 3)) return { kind: 'ether' };
    if (pre(a, 'spanning-tree', 3) && pre(b, 'summary', 3)) return { kind: 'stpsum' };
    if (pre(a, 'spanning-tree', 3)) return { kind: 'stp' };
    if (pre(a, 'standby', 3)) return { kind: 'standby' };
    if (a === 'ip' && pre(b, 'dhcp', 2) && pre(c, 'binding', 2)) return { kind: 'dhcpbind' };
    if (a === 'ip' && pre(b, 'dhcp', 2) && pre(c, 'snooping', 2)) return { kind: pre(w[4] || '', 'binding', 2) ? 'snoopbind' : 'snoop' };
    if (a === 'ip' && pre(b, 'dhcp', 2) && pre(c, 'pool', 2)) return { kind: 'dhcppool' };
    if (a === 'ipv6' && pre(b, 'dhcp', 2) && pre(c, 'pool', 2)) return { kind: 'dhcp6pool' };
    if (a === 'ipv6' && pre(b, 'dhcp', 2) && pre(c, 'binding', 2)) return { kind: 'dhcp6bind' };
    if (a === 'ipv6' && pre(b, 'dhcp', 2) && pre(c, 'interface', 2)) return { kind: 'dhcp6if' };
    if (pre(a, 'port-security', 3) && pre(b, 'interface', 3)) return { kind: 'psecif', arg: w.slice(3).join('') };
    if (pre(a, 'port-security', 3) && pre(b, 'address', 3)) return { kind: 'psecaddr' };
    if (pre(a, 'port-security', 3)) return { kind: 'psec' };
    if (pre(a, 'mac', 3) || pre(a, 'mac-address-table', 4)) return { kind: 'mac' };
    if (pre(a, 'cdp', 2)) return { kind: 'cdp' };
    if (a === 'ip' && pre(b, 'ssh', 2)) return { kind: 'ssh' };
    if (pre(a, 'version', 3)) return { kind: 'version' };
    if (a === 'ip' && pre(b, 'arp', 2)) return { kind: 'arpinspect' };
    if (a === 'ip' && pre(b, 'ospf', 2)) return { kind: 'ospf' };
    return { kind: 'other' };
  }
  PT.kindOfCmd = kindOfCmd;

  function kindOfText(t) {
    if (/^\s*(Building configuration|Current configuration\s*:)/m.test(t) || (/^hostname \S+/m.test(t) && /^(interface|line) /m.test(t))) return 'run';
    if (/^VLAN\s+Name\s+Status\s+Ports/m.test(t)) return 'vlan';
    if (/^Port\s+Mode\s+Encapsulation\s+Status\s+Native vlan/m.test(t)) return 'trunk';
    if (/^Interface\s+IP-Address\s+OK\?\s+Method\s+Status\s+Protocol/m.test(t)) return 'ipbrief';
    if (/Group\s+Port-channel\s+Protocol\s+Ports/.test(t)) return 'ether';
    if (/Spanning tree enabled protocol/.test(t)) return 'stp';
    if (/^Switch is in \S+ mode/m.test(t)) return 'stpsum';
    if (/^IPv6 Routing Table/m.test(t)) return 'route6';
    if (/^Gateway of last resort/m.test(t) || /^Codes: L - local, C - connected/m.test(t)) return 'route';
    if (/Interface\s+Grp\s+Pri\s+P\s+State/.test(t) || /- Group \d+\s*\n\s*State is/.test(t)) return 'standby';
    if (/^IP address\s+Client-ID/m.test(t)) return 'dhcpbind';
    if (/Secure Port\s+MaxSecureAddr/.test(t)) return 'psec';
    if (/^Port Security\s*:\s*(Enabled|Disabled)/m.test(t)) return 'psecif';
    if (/^Switch DHCP snooping is/m.test(t)) return 'snoop';
    if (/^MacAddress\s+IpAddress\s+Lease/m.test(t)) return 'snoopbind';
    if (/Mac Address Table/.test(t) || /^\s*Vlan\s+Mac Address\s+Type\s+Ports/m.test(t)) return 'mac';
    if (/Sending \d+, \d+-byte ICMP Echos to/.test(t) || /^Pinging \S+ with \d+ bytes/m.test(t)) return 'ping';
    if (/Tracing (the )?route to/.test(t)) return 'trace';
    if (/(IPv4 Address|IP Address|Physical Address)[ .]*:/.test(t) && /(Connection|adapter)/.test(t)) return 'ipconfig';
    if (/SSH (Enabled|Disabled) - version/.test(t)) return 'ssh';
    if (/Device ID\s+Local Intrfce/.test(t)) return 'cdp';
    if (/DHCPv6 pool:/.test(t)) return 'dhcp6pool';
    if (/IPv6 is enabled, link-local address is/.test(t)) return 'ipv6if';
    if (/^\S+\s+\[(up|down|administratively down)\/(up|down)\]/m.test(t)) return 'ipv6brief';
    if (/^\S+ is (up|down|administratively down), line protocol is/m.test(t)) return /Helper address|Internet protocol processing|Outgoing access list/.test(t) ? 'ipif' : 'ifaces';
    if (/Cisco IOS Software/.test(t)) return 'version';
    return null;
  }
  PT.kindOfText = kindOfText;

  /* ======================= parsers ======================= */
  const P = PT.parsers = {};

  /* ---------- running-config ---------- */
  function Config(text) {
    const lines = clean(text).split('\n');
    this.global = [];
    this.blocks = [];
    this.banners = {};
    let cur = null;
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const ln = raw.replace(/\s+$/, '');
      if (!ln.trim() || /^!/.test(ln.trim()) && !/^\s/.test(ln)) { if (/^!/.test(ln)) cur = null; continue; }
      if (/^(Building configuration|Current configuration|Last configuration change|NVRAM config last updated|end$|version \d|Using \d+ out of)/.test(ln)) continue;
      const bm = /^banner (motd|login|exec)\s+(\S\S?|\^C)(.*)$/.exec(ln);
      if (bm) {
        const delim = bm[2].startsWith('^C') ? '^C' : bm[2][0];
        let rest = (bm[2].length > delim.length ? bm[2].slice(delim.length) : '') + bm[3];
        let body = '';
        if (rest.includes(delim)) body = rest.slice(0, rest.indexOf(delim));
        else {
          body = rest;
          while (++i < lines.length) {
            const l2 = lines[i];
            if (l2.includes(delim)) { body += '\n' + l2.slice(0, l2.indexOf(delim)); break; }
            body += '\n' + l2;
          }
        }
        this.banners[bm[1]] = body.trim();
        this.global.push('banner ' + bm[1]);
        cur = null;
        continue;
      }
      if (/^\s/.test(ln)) {
        if (cur) cur.lines.push(ln.trim());
        else this.global.push(ln.trim());
        continue;
      }
      const head = ln.trim();
      if (/^(interface|line|router|ip dhcp pool|ipv6 dhcp pool|vlan \d|ip access-list|aaa group|radius server|key chain|class-map|policy-map|crypto|ipv6 router)\b/.test(head)) {
        let key = head.toLowerCase();
        if (/^interface /i.test(head)) key = 'interface ' + ifKey(head.slice(10));
        cur = this.blocks.find((b) => b.key === key);
        if (!cur) { cur = { key, head, lines: [] }; this.blocks.push(cur); }
      } else {
        cur = null;
        this.global.push(head);
      }
    }
    const hn = this.global.map((l) => /^hostname (\S+)/.exec(l)).find(Boolean);
    this.hostname = hn ? hn[1] : null;
  }
  Config.prototype = {
    has(re) { return this.global.some((l) => re.test(l)); },
    find(re) { for (const l of this.global) { const m = re.exec(l); if (m) return m; } return null; },
    findAll(re) { const out = []; for (const l of this.global) { const m = re.exec(l); if (m) out.push(m); } return out; },
    block(re) { return this.blocks.find((b) => re.test(b.head)) || null; },
    blocksOf(re) { return this.blocks.filter((b) => re.test(b.head)); },
    intf(name) { const b = this.blocks.find((x) => x.key === 'interface ' + ifKey(name)); return b ? new Intf(b) : null; },
    interfaces() { return this.blocks.filter((b) => b.key.startsWith('interface ')).map((b) => new Intf(b)); },
    /* line con 0 / line vty a b -> [{kind, from, to, lines}] */
    lineBlocks() {
      return this.blocksOf(/^line /).map((b) => {
        const m = /^line (con|console|aux|vty)\s+(\d+)(?:\s+(\d+))?/i.exec(b.head) || [];
        const kind = /^con/i.test(m[1] || '') ? 'con' : (m[1] || '').toLowerCase();
        return { kind, from: Number(m[2] || 0), to: Number(m[3] || m[2] || 0), lines: b.lines };
      });
    },
    con() { return this.lineBlocks().find((l) => l.kind === 'con') || { kind: 'con', from: 0, to: 0, lines: [] }; },
    /* every vty line from a..b satisfies pred(lineBlock) */
    vty(a, b, pred) {
      const vs = this.lineBlocks().filter((l) => l.kind === 'vty');
      for (let n = a; n <= b; n++) { const blk = vs.find((l) => n >= l.from && n <= l.to); if (!blk || !pred(blk)) return false; }
      return true;
    },
    routes() {
      return this.findAll(/^ip route (\S+) (\S+) (.*)$/).map((m) => {
        const rest = m[3].split(/\s+/);
        const r = { net: m[1], mask: m[2], len: mask2len(m[2]), nh: null, ifc: null, ad: 1, raw: m[0] };
        for (const t of rest) {
          if (IP4.test(t) && !r.nh) r.nh = t;
          else if (/^\d+$/.test(t)) r.ad = Number(t);
          else if (/^[A-Za-z]/.test(t) && !/^(name|permanent|tag|track)$/i.test(t)) r.ifc = ifCanon(t);
        }
        return r;
      });
    },
    routes6() {
      return this.findAll(/^ipv6 route (\S+)\/(\d+) (.*)$/).map((m) => {
        const rest = m[3].split(/\s+/);
        const r = { net: m[1], len: Number(m[2]), nh: null, ifc: null, ad: 1, raw: m[0] };
        for (const t of rest) {
          if (/:/.test(t) && !r.nh) r.nh = t;
          else if (/^\d+$/.test(t)) r.ad = Number(t);
          else if (/^[A-Za-z]/.test(t)) r.ifc = ifCanon(t);
        }
        return r;
      });
    },
    pools() {
      return this.blocksOf(/^ip dhcp pool /).map((b) => {
        const p = { name: b.head.slice(13).trim(), network: null, len: null, gw: [], dns: [], domain: null, lines: b.lines };
        for (const l of b.lines) {
          let m;
          if ((m = /^network (\S+)\s+(\S+)/.exec(l))) { p.network = m[1]; p.len = mask2len(m[2].replace('/', '')); }
          else if ((m = /^network (\S+)\/(\d+)/.exec(l))) { p.network = m[1]; p.len = Number(m[2]); }
          else if ((m = /^default-router (.*)$/.exec(l))) p.gw = m[1].split(/\s+/);
          else if ((m = /^dns-server (.*)$/.exec(l))) p.dns = m[1].split(/\s+/);
          else if ((m = /^domain-name (\S+)/.exec(l))) p.domain = m[1];
        }
        return p;
      });
    },
    excluded() { return this.findAll(/^ip dhcp excluded-address (\S+)(?:\s+(\S+))?/).map((m) => ({ lo: m[1], hi: m[2] || m[1] })); },
    isExcluded(ip) { return this.excluded().some((r) => ip2n(ip) >= ip2n(r.lo) && ip2n(ip) <= ip2n(r.hi)); },
    pools6() {
      return this.blocksOf(/^ipv6 dhcp pool /).map((b) => {
        const p = { name: b.head.slice(15).trim(), prefix: null, dns: [], domain: null, lines: b.lines };
        for (const l of b.lines) {
          let m;
          if ((m = /^address prefix (\S+)/.exec(l))) p.prefix = m[1];
          else if ((m = /^dns-server (\S+)/.exec(l))) p.dns.push(m[1]);
          else if ((m = /^domain-name (\S+)/.exec(l))) p.domain = m[1];
        }
        return p;
      });
    },
    stpMode() { const m = this.find(/^spanning-tree mode (\S+)/); return m ? m[1] : 'pvst'; },
    stpPriority(vlan) {
      for (const m of this.findAll(/^spanning-tree vlan (\S+) (priority (\d+)|root (primary|secondary))/)) {
        if (!vlanSet(m[1]).has(vlan)) continue;
        if (m[3]) return Number(m[3]);
        return m[4] === 'primary' ? 24576 : 28672;
      }
      return null;
    },
    banner(kind) { return this.banners[kind || 'motd'] || null; },
    users() {
      return this.findAll(/^username (\S+)(.*)$/).map((m) => ({ name: m[1], secret: /\bsecret\b/.test(m[2]), password: /\bpassword\b/.test(m[2]), priv: Number((/privilege (\d+)/.exec(m[2]) || [])[1] || 1) }));
    },
  };
  /* A line password, decoded if it is type 7. */
  PT.linePassword = function (block) {
    const l = (block.lines || []).map((x) => /^password(?: (\d))? (\S+)/.exec(x)).find(Boolean);
    if (!l) return null;
    return l[1] === '7' ? decode7(l[2]) : l[2];
  };
  PT.lineLogin = function (block) {
    const l = (block.lines || []).find((x) => /^login\b/.test(x));
    return !l ? null : /local/.test(l) ? 'local' : /authentication/.test(l) ? 'aaa' : 'line';
  };
  PT.lineTransport = function (block) {
    const l = (block.lines || []).map((x) => /^transport input (.*)$/.exec(x)).find(Boolean);
    return l ? l[1].trim().split(/\s+/).sort().join(' ') : null;
  };

  function Intf(b) {
    this.name = ifCanon(b.head.slice(10));
    this.lines = b.lines;
  }
  Intf.prototype = {
    has(re) { return this.lines.some((l) => re.test(l)); },
    get(re) { for (const l of this.lines) { const m = re.exec(l); if (m) return m; } return null; },
    all(re) { const o = []; for (const l of this.lines) { const m = re.exec(l); if (m) o.push(m); } return o; },
    get shutdown() { return this.lines.includes('shutdown'); },
    get desc() { const m = this.get(/^description (.*)$/); return m ? m[1] : null; },
    get ip() {
      if (this.has(/^ip address dhcp/)) return { dhcp: true };
      const m = this.get(/^ip address (\S+) (\S+)$/) || this.get(/^ip address (\S+) (\S+)(?! secondary)/);
      return m ? { addr: m[1], mask: m[2], len: mask2len(m[2]), str: m[1] + '/' + mask2len(m[2]) } : null;
    },
    hasIp(addr, len) { const ip = this.ip; return !!ip && ip.addr === addr && (len === undefined || ip.len === len); },
    get ipv6() { return this.all(/^ipv6 address (\S+?)(\/\d+)?(?: (link-local|eui-64|anycast))?$/).filter((m) => m[3] !== 'link-local' && /:/.test(m[1])).map((m) => v6(m[1] + (m[2] || ''))); },
    hasV6(addr) { const want = v6(addr.indexOf('/') < 0 ? addr : addr); return this.ipv6.some((a) => a === want || a.split('/')[0] === want.split('/')[0]); },
    get linkLocal() { const m = this.get(/^ipv6 address (\S+) link-local/); return m ? v6(m[1]) : null; },
    get mode() {
      if (this.has(/^no switchport$/)) return 'routed';
      const m = this.get(/^switchport mode (access|trunk|dynamic auto|dynamic desirable|dot1q-tunnel)/);
      return m ? m[1] : null;
    },
    get access() { const m = this.get(/^switchport access vlan (\d+)/); return m ? Number(m[1]) : 1; },
    get voice() { const m = this.get(/^switchport voice vlan (\d+)/); return m ? Number(m[1]) : null; },
    get native() { const m = this.get(/^switchport trunk native vlan (\d+)/); return m ? Number(m[1]) : 1; },
    get allowed() {
      let set = null; // null = all
      for (const m of this.all(/^switchport trunk allowed vlan (.*)$/)) {
        const a = m[1].trim().split(/\s+/);
        if (a[0] === 'add') { set = set || null; if (set) for (const v of vlanSet(a[1])) set.add(v); }
        else if (a[0] === 'remove') { set = set || vlanSet('1-4094'); for (const v of vlanSet(a[1])) set.delete(v); }
        else if (a[0] === 'except') { set = vlanSet('1-4094'); for (const v of vlanSet(a[1])) set.delete(v); }
        else if (a[0] === 'none') set = new Set();
        else if (a[0] === 'all') set = null;
        else set = vlanSet(a[0]);
      }
      return set;
    },
    allows(vlan) { const s = this.allowed; return s === null || s.has(vlan); },
    get nonegotiate() { return this.has(/^switchport nonegotiate/); },
    get group() { const m = this.get(/^channel-group (\d+) mode (\S+)/); return m ? { id: Number(m[1]), mode: m[2] } : null; },
    get encap() { const m = this.get(/^encapsulation dot1Q (\d+)( native)?/i); return m ? { vlan: Number(m[1]), native: !!m[2] } : null; },
    get portfast() { return this.has(/^spanning-tree portfast(\s+(edge|trunk))?$/) || this.has(/^spanning-tree portfast$/); },
    get bpduguard() { return this.has(/^spanning-tree bpduguard enable/); },
    get helpers() { return this.all(/^ip helper-address (\S+)/).map((m) => m[1]); },
    standby(grp) {
      const out = { ip: null, priority: 100, preempt: false, configured: false };
      for (const l of this.lines) {
        const m = /^standby(?: (\d+))? (ip|priority|preempt)(?: (\S+))?/.exec(l);
        if (!m) continue;
        const g = m[1] === undefined ? 0 : Number(m[1]);
        if (grp !== undefined && g !== grp) continue;
        out.configured = true;
        if (m[2] === 'ip') out.ip = m[3];
        if (m[2] === 'priority') out.priority = Number(m[3]);
        if (m[2] === 'preempt') out.preempt = true;
      }
      return out;
    },
    get psec() {
      if (!this.has(/^switchport port-security$/)) return null;
      const max = this.get(/^switchport port-security maximum (\d+)/);
      const vio = this.get(/^switchport port-security violation (\S+)/);
      const age = this.get(/^switchport port-security aging time (\d+)/);
      const atype = this.get(/^switchport port-security aging type (\S+)/);
      return {
        max: max ? Number(max[1]) : 1, violation: vio ? vio[1] : 'shutdown', sticky: this.has(/^switchport port-security mac-address sticky$/),
        stickyMacs: this.all(/^switchport port-security mac-address sticky (\S+)/).map((m) => m[1]),
        staticMacs: this.all(/^switchport port-security mac-address ([0-9a-fA-F.]{14})$/).map((m) => m[1]),
        aging: age ? Number(age[1]) : null, agingType: atype ? atype[1] : null,
      };
    },
    get snoopTrust() { return this.has(/^ip dhcp snooping trust/); },
    get snoopRate() { const m = this.get(/^ip dhcp snooping limit rate (\d+)/); return m ? Number(m[1]) : null; },
    get arpTrust() { return this.has(/^ip arp inspection trust/); },
    get cdpOff() { return this.has(/^no cdp enable/); },
    get speed() { const m = this.get(/^speed (\S+)/); return m ? m[1] : 'auto'; },
    get duplex() { const m = this.get(/^duplex (\S+)/); return m ? m[1] : 'auto'; },
  };
  PT.Config = Config;
  P.run = (t) => new Config(t);

  /* ---------- show vlan brief ---------- */
  P.vlan = function (t) {
    const vlans = {};
    let last = null, inTable = false;
    for (const ln of clean(t).split('\n')) {
      if (/^VLAN\s+Name\s+Status/.test(ln)) { inTable = true; continue; }
      if (/^VLAN\s+Type\s+SAID/.test(ln)) inTable = false;
      if (!inTable || /^-+/.test(ln)) continue;
      const m = /^(\d+)\s+(\S+)\s+(\S+)\s*(.*)$/.exec(ln);
      if (m) { last = vlans[m[1]] = { id: Number(m[1]), name: m[2], status: m[3], ports: ports(m[4]) }; continue; }
      const c = /^\s{10,}(\S.*)$/.exec(ln);
      if (c && last) last.ports = last.ports.concat(ports(c[1]));
    }
    function ports(s) { return String(s || '').split(/,\s*/).map((x) => x.trim()).filter(Boolean).map(ifCanon); }
    return { vlans, get(id) { return vlans[String(id)] || null; }, portVlan(p) { const k = ifKey(p); for (const v of Object.values(vlans)) if (v.ports.some((x) => x.toLowerCase() === k)) return v.id; return null; } };
  };

  /* ---------- show interfaces trunk ---------- */
  P.trunk = function (t) {
    const ports = {};
    let sec = null;
    for (const ln of clean(t).split('\n')) {
      if (/^Port\s+Mode\s+Encapsulation/.test(ln)) { sec = 'mode'; continue; }
      if (/^Port\s+Vlans allowed on trunk/.test(ln)) { sec = 'allowed'; continue; }
      if (/^Port\s+Vlans allowed and active/.test(ln)) { sec = 'active'; continue; }
      if (/^Port\s+Vlans in spanning tree forwarding/.test(ln)) { sec = 'fwd'; continue; }
      if (!sec || !ln.trim()) continue;
      if (sec === 'mode') {
        const m = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)/.exec(ln);
        if (m) ports[ifKey(m[1])] = { port: ifCanon(m[1]), mode: m[2], encap: m[3], status: m[4], native: Number(m[5]) };
      } else {
        const m = /^(\S+)\s+(\S+)\s*$/.exec(ln);
        if (m) { const p = ports[ifKey(m[1])] = ports[ifKey(m[1])] || { port: ifCanon(m[1]) }; p[sec] = m[2] === 'none' ? new Set() : vlanSet(m[2]); p[sec + 'Raw'] = m[2]; }
      }
    }
    return { ports, get(p) { return ports[ifKey(p)] || null; } };
  };

  /* ---------- show ip interface brief ---------- */
  P.ipbrief = function (t) {
    const ifs = {};
    for (const ln of clean(t).split('\n')) {
      const m = /^(\S+)\s+(\S+)\s+(YES|NO)\s+(\S+)\s+(up|down|administratively down|deleted)\s+(up|down)\s*$/.exec(ln);
      if (m) ifs[ifKey(m[1])] = { name: ifCanon(m[1]), ip: m[2], method: m[4], status: m[5], protocol: m[6] };
    }
    return { ifs, get(n) { return ifs[ifKey(n)] || null; } };
  };
  /* ---------- show ipv6 interface brief ---------- */
  P.ipv6brief = function (t) {
    const ifs = {};
    let cur = null;
    for (const ln of clean(t).split('\n')) {
      const m = /^(\S+)\s+\[(up|down|administratively down)\/(up|down)\]/.exec(ln);
      if (m) { cur = ifs[ifKey(m[1])] = { name: ifCanon(m[1]), status: m[2], protocol: m[3], addrs: [] }; continue; }
      const a = /^\s+([0-9A-Fa-f:]+)\s*$/.exec(ln);
      if (a && cur) cur.addrs.push(v6(a[1]));
    }
    return { ifs, get(n) { return ifs[ifKey(n)] || null; } };
  };

  /* ---------- show etherchannel summary ---------- */
  P.ether = function (t) {
    const groups = [];
    let last = null;
    for (const ln of clean(t).split('\n')) {
      const m = /^(\d+)\s+(Po\d+)\((\w+)\)\s+(\S+)\s*(.*)$/.exec(ln);
      if (m) { last = { id: Number(m[1]), po: ifCanon(m[2]), flags: m[3], protocol: m[4] === '-' ? 'none' : m[4].toUpperCase(), ports: pl(m[5]) }; groups.push(last); continue; }
      const c = /^\s{20,}(\S.*)$/.exec(ln);
      if (c && last) last.ports = last.ports.concat(pl(c[1]));
    }
    function pl(s) { return (s.match(/\S+\(\w+\)/g) || []).map((x) => { const k = /^(\S+)\((\w+)\)$/.exec(x); return { name: ifCanon(k[1]), flags: k[2] }; }); }
    return { groups, get(id) { return groups.find((g) => g.id === Number(id)) || null; } };
  };

  /* ---------- show spanning-tree ---------- */
  P.stp = function (t) {
    const vlans = {};
    const text = clean(t);
    const parts = text.split(/^(?=VLAN\d{4}\b)/m);
    for (const part of parts) {
      const vm = /^VLAN(\d{4})/.exec(part);
      const id = vm ? Number(vm[1]) : (/sys-id-ext (\d+)/.exec(part) || [])[1];
      if (id === undefined || id === null) continue;
      const v = { vlan: Number(id), protocol: (/Spanning tree enabled protocol (\S+)/.exec(part) || [])[1] || null, ports: {} };
      const root = /Root ID\s+Priority\s+(\d+)\s*\n\s*Address\s+(\S+)/.exec(part);
      if (root) { v.rootPriority = Number(root[1]); v.rootMac = root[2].toLowerCase(); }
      v.isRoot = /This bridge is the root/.test(part);
      const cost = /^\s+Cost\s+(\d+)/m.exec(part.split('Bridge ID')[0] || '');
      v.rootCost = cost ? Number(cost[1]) : (v.isRoot ? 0 : null);
      const rp = /^\s+Port\s+\d+\s*\(([^)]+)\)/m.exec(part.split('Bridge ID')[0] || '');
      v.rootPort = rp ? ifCanon(rp[1]) : null;
      const br = /Bridge ID\s+Priority\s+(\d+)(?:\s+\(priority (\d+) sys-id-ext (\d+)\))?\s*\n\s*Address\s+(\S+)/.exec(part);
      if (br) { v.bridgePriority = Number(br[1]); v.basePriority = br[2] ? Number(br[2]) : null; v.bridgeMac = br[4].toLowerCase(); }
      for (const ln of part.split('\n')) {
        const m = /^(\S+)\s+(Root|Desg|Altn|Back|Mstr|Shr|Bound|Disb)\s+(FWD|BLK|LRN|LIS|DIS|BKN\*?|LBK)\s+(\d+)\s+(\d+)\.(\d+)\s*(.*)$/.exec(ln);
        if (m) v.ports[ifKey(m[1])] = { name: ifCanon(m[1]), role: m[2], state: m[3], cost: Number(m[4]), prio: Number(m[5]), num: Number(m[6]), type: m[7].trim() };
      }
      vlans[v.vlan] = v;
    }
    return { vlans, get(id) { return vlans[id] || null; } };
  };
  P.stpsum = function (t) {
    const x = clean(t);
    const flag = (re) => { const m = re.exec(x); return m ? /enabled/i.test(m[1]) : null; };
    return { mode: (/^Switch is in (\S+) mode/m.exec(x) || [])[1] || null, portfastDefault: flag(/^Portfast Default\s+is (\w+)/mi), bpduguardDefault: flag(/^PortFast BPDU Guard Default\s+is (\w+)/mi), rootFor: (/^Root bridge for:\s*(.*)$/m.exec(x) || [])[1] || '' };
  };

  /* ---------- show ip route ---------- */
  P.route = function (t) {
    const routes = [];
    let gw = null, gwSet = null, defLen = null, last = null;
    for (const ln of clean(t).split('\n')) {
      let m;
      if ((m = /^Gateway of last resort is (\S+) to network (\S+)/.exec(ln))) { gw = m[1]; gwSet = true; continue; }
      if (/^Gateway of last resort is not set/.test(ln)) { gwSet = false; continue; }
      if ((m = /^\s*(\d+\.\d+\.\d+\.\d+)\/(\d+) is (variably )?subnetted/.exec(ln))) { defLen = m[3] ? null : Number(m[2]); last = null; continue; }
      m = /^([A-Za-z][A-Za-z0-9]{0,2}\*?|\*)(?:\s+([A-Z][A-Z0-9]?\*?))?\s+(\d+\.\d+\.\d+\.\d+)(?:\/(\d+))?\s+(.*)$/.exec(ln);
      if (m && !/ - /.test(ln.slice(0, 12))) {
        const code = (m[1] + (m[2] ? ' ' + m[2] : '')).replace(/\s+/g, ' ');
        const len = m[4] !== undefined ? Number(m[4]) : (defLen !== null ? defLen : (m[3] === '0.0.0.0' ? 0 : null));
        const r = { code, base: code.replace(/[\s*].*$/, '').replace('*', ''), candidate: /\*/.test(code), net: m[3], len, ad: null, metric: null, via: [], ifc: null, connected: false };
        const rest = m[5];
        let k;
        if ((k = /^\[(\d+)\/(\d+)\]/.exec(rest))) { r.ad = Number(k[1]); r.metric = Number(k[2]); }
        if (/is directly connected/.test(rest)) { r.connected = true; r.ad = r.ad === null ? (r.base === 'S' ? 1 : 0) : r.ad; }
        for (const v of rest.matchAll(/via (\d+\.\d+\.\d+\.\d+)/g)) r.via.push(v[1]);
        const ifm = /,\s*([A-Za-z][\w/.-]*\d[\w/.]*)\s*$/.exec(rest) || /directly connected, (\S+)/.exec(rest);
        if (ifm) r.ifc = ifCanon(ifm[1]);
        routes.push(r);
        last = r;
        continue;
      }
      if ((m = /^\s+\[(\d+)\/(\d+)\] via (\d+\.\d+\.\d+\.\d+)/.exec(ln)) && last) last.via.push(m[3]);
    }
    return {
      routes, gw, gwSet,
      find(net, len) { return routes.filter((r) => r.net === net && (len === undefined || r.len === len)); },
      has(code, net, len) { return routes.some((r) => r.base === code && r.net === net && (len === undefined || r.len === len)); },
      defaultRoute() { return routes.find((r) => r.net === '0.0.0.0' && (r.len === 0 || r.len === null)) || null; },
    };
  };
  /* ---------- show ipv6 route ---------- */
  P.route6 = function (t) {
    const routes = [];
    let last = null;
    for (const ln of clean(t).split('\n')) {
      let m = /^([A-Z][A-Z0-9]{0,2}\*?)\s+([0-9A-Fa-f:]+)\/(\d+)\s*(?:\[(\d+)\/(\d+)\])?/.exec(ln);
      if (m && /:/.test(m[2])) {
        last = { code: m[1], base: m[1][0], net: v6(m[2]), len: Number(m[3]), ad: m[4] ? Number(m[4]) : null, metric: m[5] ? Number(m[5]) : null, via: [], ifc: null, connected: false };
        routes.push(last);
        continue;
      }
      m = /^\s+via (\S+?)(?:,\s*(\S+?))?(?:,\s*(.*))?\s*$/.exec(ln);
      if (m && last) {
        if (/:/.test(m[1])) { last.via.push(v6(m[1])); if (m[2] && !/directly|receive/.test(m[2])) last.ifc = ifCanon(m[2]); }
        else { last.ifc = ifCanon(m[1]); if (/directly connected/.test(ln)) last.connected = true; }
      }
    }
    return {
      routes,
      find(net, len) { const n = v6(net); return routes.filter((r) => r.net === n && (len === undefined || r.len === len)); },
      has(code, net, len) { const n = v6(net); return routes.some((r) => r.base === code && r.net === n && (len === undefined || r.len === len)); },
      defaultRoute() { return routes.find((r) => r.net === v6('::') && r.len === 0) || null; },
    };
  };

  /* ---------- show standby [brief] ---------- */
  P.standby = function (t) {
    const groups = [];
    const x = clean(t);
    for (const ln of x.split('\n')) {
      const m = /^(\S+)\s+(\d+)\s+(\d+)\s+(P\s+)?(Init|Learn|Listen|Speak|Standby|Active|Disabled)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/i.exec(ln);
      if (m) groups.push({ iface: ifCanon(m[1]), grp: Number(m[2]), priority: Number(m[3]), preempt: !!m[4], state: m[5][0].toUpperCase() + m[5].slice(1).toLowerCase(), active: m[6], standby: m[7], vip: m[8] });
    }
    if (!groups.length) {
      for (const blk of x.split(/^(?=\S+ - Group \d+)/m)) {
        const h = /^(\S+) - Group (\d+)/.exec(blk);
        if (!h) continue;
        groups.push({
          iface: ifCanon(h[1]), grp: Number(h[2]), state: ((/State is (\w+)/.exec(blk) || [])[1] || ''),
          vip: (/Virtual IP address is (\S+)/.exec(blk) || [])[1] || null, priority: Number((/Priority (\d+)/.exec(blk) || [])[1] || 100),
          preempt: /Preemption enabled/.test(blk), active: /Active router is local/.test(blk) ? 'local' : ((/Active router is (\S+?),?\s/.exec(blk) || [])[1] || null),
          standby: /Standby router is local/.test(blk) ? 'local' : ((/Standby router is (\S+?),?\s/.exec(blk) || [])[1] || null),
        });
      }
    }
    return { groups, get(iface, grp) { return groups.find((g) => (!iface || ifKey(g.iface) === ifKey(iface)) && (grp === undefined || g.grp === grp)) || null; } };
  };

  /* ---------- show ip dhcp binding ---------- */
  P.dhcpbind = function (t) {
    const list = [];
    for (const ln of clean(t).split('\n')) {
      const m = /^(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F.]+)/.exec(ln);
      if (m) list.push({ ip: m[1], mac: macNorm(m[2]).slice(-12) });
    }
    return { list, inNet(net, len) { return list.filter((b) => inNet(b.ip, net, len)); } };
  };

  /* ---------- port security ---------- */
  P.psec = function (t) {
    const ports = {};
    for (const ln of clean(t).split('\n')) {
      const m = /^\s*(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(Shutdown|Restrict|Protect)\s*$/i.exec(ln);
      if (m) ports[ifKey(m[1])] = { port: ifCanon(m[1]), max: Number(m[2]), current: Number(m[3]), violations: Number(m[4]), action: m[5].toLowerCase() };
    }
    return { ports, get(p) { return ports[ifKey(p)] || null; } };
  };
  P.psecif = function (t) {
    const kv = {};
    for (const ln of clean(t).split('\n')) {
      const m = /^([A-Za-z][A-Za-z :]*?)\s*:\s*(\S.*)$/.exec(ln);
      if (m) kv[m[1].trim().toLowerCase()] = m[2].trim();
    }
    const num = (k) => (kv[k] !== undefined ? Number(String(kv[k]).replace(/[^\d]/g, '')) : null);
    return {
      enabled: /enabled/i.test(kv['port security'] || ''), status: (kv['port status'] || '').toLowerCase(), violation: (kv['violation mode'] || '').toLowerCase(),
      max: num('maximum mac addresses'), total: num('total mac addresses'), sticky: num('sticky mac addresses'), configured: num('configured mac addresses'),
      violations: num('security violation count'), last: kv['last source address:vlan'] || kv['last source address'] || null, agingTime: num('aging time'), agingType: (kv['aging type'] || '').toLowerCase(),
    };
  };

  /* ---------- DHCP snooping ---------- */
  P.snoop = function (t) {
    const x = clean(t);
    const vl = /DHCP snooping is configured on following VLANs:\s*\n\s*(\S*)/.exec(x);
    const ifs = {};
    for (const ln of x.split('\n')) {
      const m = /^(\S+)\s+(yes|no)\s+(?:(yes|no)\s+)?(\S+)\s*$/i.exec(ln);
      if (m && /\d/.test(m[1])) ifs[ifKey(m[1])] = { name: ifCanon(m[1]), trusted: /yes/i.test(m[2]), rate: /^\d+$/.test(m[4]) ? Number(m[4]) : null };
    }
    return { enabled: /Switch DHCP snooping is enabled/.test(x), vlans: vl && vl[1] !== 'none' ? vlanSet(vl[1]) : new Set(), ifs, get(n) { return ifs[ifKey(n)] || null; } };
  };
  P.snoopbind = function (t) {
    const list = [];
    for (const ln of clean(t).split('\n')) {
      const m = /^([0-9A-Fa-f:.]{12,17})\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(\S+)/.exec(ln);
      if (m) list.push({ mac: macNorm(m[1]), ip: m[2], vlan: Number(m[5]), port: ifCanon(m[6]) });
    }
    return { list };
  };

  /* ---------- MAC address table ---------- */
  P.mac = function (t) {
    const list = [];
    for (const ln of clean(t).split('\n')) {
      const m = /^\s*(\d+|All)\s+([0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})\s+(DYNAMIC|STATIC)\s+(\S+)/i.exec(ln);
      if (m) list.push({ vlan: m[1] === 'All' ? null : Number(m[1]), mac: macNorm(m[2]), type: m[3].toUpperCase(), port: /^[A-Za-z]+\d/.test(m[4]) ? ifCanon(m[4]) : m[4] });
    }
    return { list, portOf(mac) { const e = list.find((x) => x.mac === macNorm(mac)); return e ? e.port : null; } };
  };

  /* ---------- ping ---------- */
  P.ping = function (t, arg) {
    const x = clean(t);
    const out = [];
    for (const m of x.matchAll(/Sending (\d+), \d+-byte ICMP Echos to (\S+?), timeout[^\n]*\n([\s\S]*?)Success rate is (\d+) percent \((\d+)\/(\d+)\)/g)) {
      const src = /Packet sent with a source address of (\S+)/.exec(m[3]);
      out.push({ target: m[2].toLowerCase(), sent: Number(m[6]), ok: Number(m[5]), success: Number(m[5]) > 0, source: src ? src[1].toLowerCase() : null });
    }
    for (const m of x.matchAll(/Pinging (\S+) with \d+ bytes of data:([\s\S]*?)(?=Pinging |$)/g)) {
      const body = m[2];
      const replies = (body.match(/^Reply from \S+?: (bytes=|time)/gm) || []).length;
      const sent = /Sent = (\d+)/.exec(body);
      out.push({ target: m[1].toLowerCase(), sent: sent ? Number(sent[1]) : 4, ok: replies, success: replies > 0, source: null });
    }
    if (!out.length && arg) {
      const target = String(arg).trim().split(/\s+/).pop();
      if (/% No valid route|Destination host unreachable|Request timed out|Success rate is 0/.test(x)) out.push({ target: target.toLowerCase(), sent: 0, ok: 0, success: false, source: null });
    }
    return out;
  };
  /* ---------- traceroute / tracert ---------- */
  P.trace = function (t, arg) {
    const x = clean(t);
    const tm = /Tracing (?:the )?route to (\S+)/.exec(x);
    const target = (tm ? tm[1] : String(arg || '')).replace(/[[\]]/g, '').toLowerCase();
    const hops = [];
    for (const ln of x.split('\n')) {
      const m = /^\s*(\d+)\s+(.*)$/.exec(ln);
      if (!m) continue;
      const ip = /(\d+\.\d+\.\d+\.\d+|[0-9a-fA-F]*:[0-9a-fA-F:]+)/.exec(m[2]);
      hops[Number(m[1]) - 1] = ip ? ip[1].toLowerCase() : null;
    }
    return { target, hops: Array.from(hops, (h) => h || null), complete: hops.length > 0 && (hops[hops.length - 1] === target || sameV6(hops[hops.length - 1], target)) };
  };

  /* ---------- ipconfig [/all] ---------- */
  P.ipconfig = function (t) {
    const adapters = [];
    let cur = null, lastKey = null;
    for (const ln of clean(t).split('\n')) {
      const h = /^(\S.*?)\s*Connection:?(\(default port\))?\s*:?\s*$/.exec(ln) || /^(?:Ethernet|Wireless LAN) adapter (.*?):\s*$/.exec(ln);
      if (h && !/:\s*\S/.test(ln.replace(/Connection:?\(default port\)/, ''))) { cur = { name: h[1].trim(), def: !!h[2], kv: {} }; adapters.push(cur); lastKey = null; continue; }
      const kv = /^\s+([A-Za-z][A-Za-z0-9 ()/-]*?)[\s.]*:\s?(.*)$/.exec(ln);
      if (kv && /\.\s*:|\s:\s/.test(ln)) {
        if (!cur) { cur = { name: 'adapter', def: true, kv: {} }; adapters.push(cur); }
        lastKey = kv[1].replace(/\s*\(.*\)$/, '').trim().toLowerCase();
        cur.kv[lastKey] = (cur.kv[lastKey] || []).concat(kv[2].trim() ? [kv[2].replace(/\(Preferred\)/i, '').trim()] : []);
        continue;
      }
      const c = /^\s{20,}(\S+)\s*$/.exec(ln);
      if (c && cur && lastKey) cur.kv[lastKey].push(c[1].replace(/\(Preferred\)/i, ''));
    }
    const pick = adapters.find((a) => a.def && first4(a)) || adapters.find((a) => first4(a)) || adapters.find((a) => a.def) || adapters[0] || { kv: {} };
    function first4(a) { const v = (a.kv['ipv4 address'] || a.kv['ip address'] || []).find((x) => IP4.test(x)); return v && v !== '0.0.0.0' ? v : null; }
    const g = (k) => pick.kv[k] || [];
    const all = (k) => g(k).filter((x) => x && x !== '::' && x !== '0.0.0.0');
    return {
      adapter: pick.name || null,
      ipv4: first4(pick) || null,
      mask: all('subnet mask')[0] || null,
      gw4: all('default gateway').find((x) => IP4.test(x)) || null,
      gw6: all('default gateway').find((x) => /:/.test(x)) || null,
      ipv6: all('ipv6 address').map(v6),
      ll6: (all('link-local ipv6 address')[0] || null) && v6(all('link-local ipv6 address')[0].replace(/%\d+$/, '')),
      dns4: all('dns servers').filter((x) => IP4.test(x)),
      dns6: all('dns servers').filter((x) => /:/.test(x)).map(v6),
      dhcp: all('dhcp servers'),
      suffix: (g('connection-specific dns suffix')[0] || '').replace(/^\.+/, '') || null,
      mac: macNorm(all('physical address')[0] || '') || null,
      adapters,
    };
  };

  /* ---------- others ---------- */
  P.ssh = (t) => { const m = /SSH (Enabled|Disabled) - version (\S+)/.exec(clean(t)); return { enabled: !!m && m[1] === 'Enabled', version: m ? m[2] : null }; };
  P.version = (t) => { const x = clean(t); return { image: ((/\(([A-Z0-9_-]+-M)\)/.exec(x) || [])[1]) || null, model: ((/^cisco (\S+)/mi.exec(x) || [])[1]) || null }; };
  P.cdp = function (t) {
    const list = [];
    for (const ln of clean(t).split('\n')) {
      const m = /^(\S+)\s+((?:Fas|Gig|Ser|Ten|Eth|Fa|Gi|Se|Po)\s?[\d/.]+)\s+(\d+)\s+(.*?)\s+(\S+)\s+((?:Fas|Gig|Ser|Ten|Eth|Fa|Gi|Se|Po)\s?[\d/.]+)\s*$/.exec(ln);
      if (m) list.push({ id: m[1], local: ifCanon(m[2]), platform: m[5], port: ifCanon(m[6]) });
    }
    return { list, has(id) { return list.some((n) => n.id.toLowerCase().startsWith(String(id).toLowerCase())); } };
  };
  P.ifaces = function (t) {
    const ifs = {};
    let cur = null;
    for (const ln of clean(t).split('\n')) {
      let m = /^(\S+) is (up|down|administratively down), line protocol is (up|down)(?:\s*\(([\w-]+)\))?/.exec(ln);
      if (m) { cur = ifs[ifKey(m[1])] = { name: ifCanon(m[1]), status: m[2], protocol: m[3], flag: m[4] || null, helpers: [] }; continue; }
      if (!cur) continue;
      if ((m = /^\s+Description: (.*)$/.exec(ln))) cur.desc = m[1];
      else if ((m = /^\s+Internet address is (\S+)/.exec(ln))) cur.ip = m[1];
      else if ((m = /^\s+(Full|Half|Auto)-duplex, (\S+?)(?:b\/s|bps)?(?:,|\s*$)/i.exec(ln))) { cur.duplex = m[1].toLowerCase(); cur.speed = m[2]; }
      else if ((m = /^\s+Helper address(?:es)? (?:is|are) (.*)$/.exec(ln))) cur.helpers = m[1].includes('not set') ? [] : m[1].split(/\s+/).filter((x) => IP4.test(x));
      else if ((m = /^\s+(\d+\.\d+\.\d+\.\d+)\s*$/.exec(ln)) && cur.helpers.length) cur.helpers.push(m[1]);
    }
    return { ifs, get(n) { return ifs[ifKey(n)] || null; } };
  };
  P.ipif = P.ifaces;
  P.ipv6if = function (t) {
    const ifs = {};
    for (const blk of clean(t).split(/^(?=\S+ is (?:up|down|administratively down), line protocol)/m)) {
      const m = /^(\S+) is (up|down|administratively down), line protocol is (up|down)/.exec(blk);
      if (!m) continue;
      const ll = /link-local address is (\S+)/.exec(blk);
      ifs[ifKey(m[1])] = {
        name: ifCanon(m[1]), status: m[2], protocol: m[3], ll: ll ? v6(ll[1]) : null,
        globals: [...blk.matchAll(/^\s+([0-9A-Fa-f:]+), subnet is/gm)].map((x) => v6(x[1])),
        groups: [...blk.matchAll(/^\s+(FF0[0-9A-F]::[0-9A-F:]+)\s*$/gim)].map((x) => v6(x[1])),
        slaac: /Hosts use stateless autoconfig for addresses/i.test(blk),
        managed: /Hosts use DHCP to obtain routable addresses/i.test(blk),
        other: /Hosts use DHCP to obtain other configuration/i.test(blk),
      };
    }
    return { ifs, get(n) { return ifs[ifKey(n)] || null; } };
  };
  P.dhcp6pool = function (t) {
    const pools = [];
    for (const blk of clean(t).split(/^(?=DHCPv6 pool:)/m)) {
      const m = /^DHCPv6 pool: (\S+)/.exec(blk);
      if (!m) continue;
      pools.push({ name: m[1], prefix: ((/Address allocation prefix: (\S+)/.exec(blk) || [])[1] || null), dns: [...blk.matchAll(/DNS server: (\S+)/g)].map((x) => v6(x[1])), domain: (/Domain name: (\S+)/.exec(blk) || [])[1] || null, active: Number((/Active clients: (\d+)/.exec(blk) || [])[1] || 0) });
    }
    return { pools };
  };

  /* ======================= evidence for a whole lab ======================= */
  const NEED_CMD = {
    run: 'show running-config', start: 'show startup-config', vlan: 'show vlan brief', trunk: 'show interfaces trunk', ipbrief: 'show ip interface brief', ipv6brief: 'show ipv6 interface brief',
    ether: 'show etherchannel summary', stp: 'show spanning-tree', stpsum: 'show spanning-tree summary', route: 'show ip route', route6: 'show ipv6 route',
    standby: 'show standby brief', dhcpbind: 'show ip dhcp binding', psec: 'show port-security', psecif: 'show port-security interface', snoop: 'show ip dhcp snooping',
    snoopbind: 'show ip dhcp snooping binding', mac: 'show mac address-table', ipconfig: 'ipconfig /all', ssh: 'show ip ssh', cdp: 'show cdp neighbors',
    version: 'show version', ifaces: 'show interfaces', ipif: 'show ip interface', ipv6if: 'show ipv6 interface', dhcp6pool: 'show ipv6 dhcp pool',
  };
  PT.NEED_CMD = NEED_CMD;

  function Need(dev, what) { this.dev = dev; this.what = what; this.message = 'Paste ' + what + ' from ' + dev; }
  PT.Need = Need;

  /* Parse one device's pasted text into { host, kinds: {kind: [parsed]}, ... } */
  PT.parseDevice = function (text) {
    const ev = { hosts: new Set(), runText: [], startText: [], kinds: {}, pings: [], traces: [], psecif: {}, ifaces: {}, remote: [], unknown: 0 };
    let session = null; // an ssh/telnet session opened from a PC Command Prompt
    for (const s of splitSections(text)) {
      if (s.mode === 'pc') session = null;
      if (s.host && session) { session.ok = true; session.host = session.host || s.host; continue; }
      if (s.host) ev.hosts.add(s.host);
      if (s.skip) continue;
      const rm = s.mode === 'pc' && /^(ssh|telnet)\b(.*)$/i.exec(s.cmd || '');
      if (rm) {
        const args = rm[2].trim().split(/\s+/);
        const u = /-l\s+(\S+)/.exec(rm[2]);
        session = { proto: rm[1].toLowerCase(), user: u ? u[1] : null, target: (args[args.length - 1] || '').toLowerCase(), ok: false, host: null };
        const body = s.lines.join('\n');
        if (/Connection refused|timed out|% Login invalid|Connection closed/i.test(body) && !/^\S+[>#]/m.test(body)) session.refused = true;
        if (/^Password:/m.test(body) && /\n\S+[>#]/.test(body)) session.ok = true;
        ev.remote.push(session);
        continue;
      }
      const body = s.lines.join('\n');
      let kind = null, k = null;
      if (s.cmd) {
        k = kindOfCmd(s.cmd);
        if (!k) continue; // a command that prints nothing to grade (enable, configure terminal, copy ...)
        kind = k.kind === 'other' ? kindOfText(body) : k.kind;
      } else kind = kindOfText(body);
      if (!kind || !body.trim()) { if (body.trim()) ev.unknown++; continue; }
      if (kind === 'run' || kind === 'start') { (kind === 'run' ? ev.runText : ev.startText).push(body); continue; }
      if (kind === 'ping') { ev.pings.push(...P.ping(body, k && k.arg)); continue; }
      if (kind === 'trace') { ev.traces.push(P.trace(body, k && k.arg)); continue; }
      if (kind === 'psecif') { const r = P.psecif(body); ev.psecif[k && k.arg ? ifKey(k.arg) : '?'] = r; continue; }
      if (kind === 'ifaces' || kind === 'ipif') { const r = P.ifaces(body); for (const [n, v] of Object.entries(r.ifs)) ev.ifaces[n] = Object.assign(ev.ifaces[n] || {}, v, { helpers: (v.helpers && v.helpers.length ? v.helpers : (ev.ifaces[n] || {}).helpers) || [] }); continue; }
      if (!P[kind]) continue;
      if (kind === 'stp' && ev.kinds.stp) { const r = P.stp(body); Object.assign(ev.kinds.stp.vlans, r.vlans); continue; }
      ev.kinds[kind] = P[kind](body, k && k.arg);
    }
    if (ev.runText.length) { ev.kinds.run = new Config(ev.runText.join('\n!\n')); if (ev.kinds.run.hostname) ev.hosts.add(ev.kinds.run.hostname); }
    if (ev.startText.length) ev.kinds.start = new Config(ev.startText.join('\n!\n'));
    return ev;
  };

  /* Helpers given to task checks. pasted: { deviceId: text } */
  PT.helpers = function (lab, pasted) {
    const cache = {};
    const ev = (dev) => (cache[dev] = cache[dev] || PT.parseDevice((pasted && pasted[dev]) || ''));
    const need = (dev, kind, what) => { const e = ev(dev); if (!e.kinds[kind]) throw new Need(dev, what || NEED_CMD[kind]); return e.kinds[kind]; };
    const h = {
      lab, ev,
      run: (dev) => need(dev, 'run'),
      start: (dev) => need(dev, 'start', 'show startup-config'),
      /* a Telnet/SSH session opened from a PC: { ok, refused, host } */
      remote(dev, proto, target, user) {
        const t = String(target).toLowerCase();
        const list = ev(dev).remote.filter((r) => r.proto === proto && r.target === t && (!user || !r.user || r.user === user));
        if (!list.length) throw new Need(dev, proto === 'ssh' ? 'ssh -l ' + (user || 'admin') + ' ' + target : 'telnet ' + target);
        return list.find((r) => r.ok) || list[list.length - 1];
      },
      vlan: (dev) => need(dev, 'vlan'),
      trunk: (dev) => need(dev, 'trunk'),
      brief: (dev) => need(dev, 'ipbrief'),
      brief6: (dev) => need(dev, 'ipv6brief'),
      ether: (dev) => need(dev, 'ether'),
      stp(dev, vlan) {
        const s = need(dev, 'stp');
        const v = s.get(vlan === undefined ? 1 : vlan);
        if (!v) throw new Need(dev, 'show spanning-tree vlan ' + (vlan === undefined ? 1 : vlan));
        return v;
      },
      stpsum: (dev) => need(dev, 'stpsum'),
      route: (dev) => need(dev, 'route'),
      route6: (dev) => need(dev, 'route6'),
      standby: (dev) => need(dev, 'standby'),
      bind: (dev) => need(dev, 'dhcpbind'),
      psec: (dev) => need(dev, 'psec'),
      psecIf(dev, port) {
        const e = ev(dev);
        const r = e.psecif[ifKey(port)] || (Object.keys(e.psecif).length === 1 && e.psecif['?']);
        if (!r) throw new Need(dev, 'show port-security interface ' + PT.shortIf(port).replace(' ', ''));
        return r;
      },
      snoop: (dev) => need(dev, 'snoop'),
      mac: (dev) => need(dev, 'mac'),
      cdp: (dev) => need(dev, 'cdp'),
      ssh: (dev) => need(dev, 'ssh'),
      version: (dev) => need(dev, 'version'),
      v6if(dev, name) {
        const r = need(dev, 'ipv6if', 'show ipv6 interface ' + PT.shortIf(name).replace(' ', ''));
        const x = r.get(name);
        if (!x) throw new Need(dev, 'show ipv6 interface ' + PT.shortIf(name).replace(' ', ''));
        return x;
      },
      pool6: (dev) => need(dev, 'dhcp6pool'),
      iface(dev, name) {
        const x = ev(dev).ifaces[ifKey(name)];
        if (!x) throw new Need(dev, 'show interfaces ' + PT.shortIf(name).replace(' ', ''));
        return x;
      },
      ipcfg: (dev) => need(dev, 'ipconfig'),
      /* ping evidence from dev to target; null if none pasted */
      pingTo(dev, target) {
        const t = String(target).toLowerCase();
        const list = ev(dev).pings.filter((p) => p.target === t || sameV6(p.target, t));
        if (!list.length) return null;
        return list.find((p) => p.success) || list[list.length - 1];
      },
      pinged(dev, target) {
        const p = h.pingTo(dev, target);
        if (!p) throw new Need(dev, 'ping ' + target);
        return p.success;
      },
      pingFailed(dev, target) {
        const p = h.pingTo(dev, target);
        if (!p) throw new Need(dev, 'ping ' + target);
        return !p.success;
      },
      trace(dev, target) {
        const t = String(target).toLowerCase();
        const r = ev(dev).traces.filter((x) => x.target === t || sameV6(x.target, t)).pop();
        if (!r) throw new Need(dev, (/^PC|^Laptop|^Server|^H\d/i.test(dev) ? 'tracert ' : 'traceroute ') + target);
        return r;
      },
      hostOk(dev, expected) { const e = ev(dev); return !e.hosts.size || [...e.hosts].some((x) => x.toLowerCase() === String(expected).toLowerCase()); },
      PT,
    };
    return h;
  };

  /* Grade every task. state: { pasted, answers, ticks } -> [{ i, status: 'pass'|'fail'|'need'|'open', msg, need }] */
  PT.grade = function (lab, state) {
    state = state || {};
    const h = PT.helpers(lab, state.pasted || {});
    return lab.tasks.map((t, i) => {
      const r = { i, text: t.text, status: 'fail', msg: null, need: null, optional: !!t.optional };
      try {
        if (t.self) { r.status = state.ticks && state.ticks[i] ? 'pass' : 'open'; return r; }
        if (t.answer !== undefined) {
          const given = state.answers && state.answers[i];
          if (given === undefined || String(given).trim() === '') {
            // computed answers still need their evidence, so report what to paste first
            if (typeof t.answer === 'function') t.answer(h);
            r.status = 'open';
            return r;
          }
          const accepted = (typeof t.answer === 'function' ? t.answer(h) : t.answer).map((a) => String(a).trim().toLowerCase().replace(/\s+/g, ' '));
          const g = String(given).trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');
          r.status = accepted.includes(g) ? 'pass' : 'fail';
          if (r.status === 'fail') r.msg = 'Not the answer the output shows. Read it again.';
          return r;
        }
        const res = t.check(h);
        if (res === true) r.status = 'pass';
        else { r.status = 'fail'; if (typeof res === 'string') r.msg = res; }
      } catch (e) {
        if (e instanceof Need) { r.status = 'need'; r.need = { dev: e.dev, what: e.what }; } else { r.status = 'fail'; r.msg = 'Could not read this output (' + (e && e.message) + ').'; r.error = String(e && e.stack || e); }
      }
      return r;
    });
  };

  /* Warn when a paste box seems to hold another device's output. */
  PT.hostWarning = function (dev, text, expectedName) {
    if (!text || !text.trim()) return null;
    const e = PT.parseDevice(text);
    const want = String(expectedName || dev).toLowerCase();
    const others = [...e.hosts].filter((x) => x.toLowerCase() !== want && !/^(switch|router)$/i.test(x));
    if (others.length && ![...e.hosts].some((x) => x.toLowerCase() === want)) return 'This output comes from ' + others.join(', ') + ', not ' + (expectedName || dev) + '.';
    return null;
  };
  PT.summary = function (text) {
    const e = PT.parseDevice(text);
    const found = Object.keys(e.kinds).map((k) => NEED_CMD[k] || k);
    if (e.pings.length) found.push(e.pings.length + ' ping' + (e.pings.length > 1 ? 's' : ''));
    if (e.traces.length) found.push(e.traces.length + ' trace' + (e.traces.length > 1 ? 's' : ''));
    if (Object.keys(e.psecif).length) found.push('show port-security interface');
    if (Object.keys(e.ifaces).length) found.push('show interfaces');
    return { found, unknown: e.unknown };
  };
})(typeof window !== 'undefined' ? window : globalThis);
