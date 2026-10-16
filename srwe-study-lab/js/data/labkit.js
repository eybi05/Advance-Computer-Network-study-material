/* Building blocks for Packet Tracer lab tasks. Every builder returns check(h) -> true | 'what is wrong'.
 * h is the helper object from js/pt/check.js: h.run('S1') reads the pasted running-config, h.vlan('S1')
 * the pasted show vlan brief, h.pinged('PC1', ip) the pasted ping, and so on. A helper throws Need when
 * the output it reads was not pasted; the lab page then tells the learner what to paste. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const PT = SRWE.PT;
  const K = SRWE.LabKit = {};
  const S = (n) => PT.shortIf(n);
  const intf = (h, dev, name) => h.run(dev).intf(name);
  K.intf = intf;
  K.all = (...checks) => (h) => { for (const c of checks) { const r = c(h); if (r !== true) return r; } return true; };
  K.any = (...checks) => (h) => { let last = false; for (const c of checks) { const r = c(h); if (r === true) return true; last = r; } return last; };

  /* ---------- global settings ---------- */
  K.hostname = (dev, name) => (h) => h.run(dev).hostname === name || 'The hostname is ' + (h.run(dev).hostname || 'not set') + ', expected ' + name + '.';
  K.has = (dev, re, msg) => (h) => h.run(dev).has(re) || msg || 'Missing in the running-config of ' + dev + '.';
  K.lacks = (dev, re, msg) => (h) => !h.run(dev).has(re) || msg || 'Still present in the running-config of ' + dev + '.';
  K.noLookup = (dev) => K.has(dev, /^no ip domain[- ]lookup/, 'DNS lookup is still on (no "no ip domain-lookup").');
  K.secret = (dev) => K.has(dev, /^enable secret /, 'No enable secret is configured.');
  K.encrypt = (dev) => K.has(dev, /^service password-encryption/, 'service password-encryption is not on, so line passwords are still plaintext.');
  K.banner = (dev, re) => (h) => { const b = h.run(dev).banner('motd'); return !b ? 'No MOTD banner is configured.' : (!re || re.test(b)) || 'The banner does not say what the task asks: "' + b + '".'; };
  K.gateway = (dev, ip) => K.has(dev, new RegExp('^ip default-gateway ' + ip.replace(/\./g, '\\.') + '$'), dev + ' has no ip default-gateway ' + ip + '.');
  K.con = (dev, pw) => (h) => {
    const c = h.run(dev).con();
    const p = PT.linePassword(c);
    if (p !== pw) return p ? 'The console password is "' + p + '", expected "' + pw + '".' : 'The console line has no password.';
    return PT.lineLogin(c) ? true : 'The console line has a password but no "login".';
  };
  K.vty = (dev, a, b, pw) => (h) => h.run(dev).vty(a, b, (l) => PT.linePassword(l) === pw && !!PT.lineLogin(l)) || 'vty ' + a + '–' + b + ' need password "' + pw + '" and login.';
  K.vtySsh = (dev, a, b) => (h) => h.run(dev).vty(a, b, (l) => PT.lineTransport(l) === 'ssh' && PT.lineLogin(l) === 'local') || 'vty ' + a + '–' + b + ' must have "transport input ssh" and "login local".';
  K.user = (dev, name) => (h) => h.run(dev).users().some((u) => u.name === name && (u.secret || u.password)) || 'No local user ' + name + ' with a secret.';

  /* ---------- interfaces ---------- */
  K.ip = (dev, ifc, addr, len) => (h) => {
    const i = intf(h, dev, ifc);
    if (!i) return dev + ' has no interface ' + S(ifc) + ' in its running-config.';
    const ip = i.ip;
    if (!ip || ip.dhcp) return S(ifc) + ' on ' + dev + ' has no static IPv4 address.';
    return (ip.addr === addr && ip.len === len) || S(ifc) + ' on ' + dev + ' is ' + ip.str + ', expected ' + addr + '/' + len + '.';
  };
  K.v6 = (dev, ifc, addr) => (h) => {
    const i = intf(h, dev, ifc);
    if (!i) return dev + ' has no interface ' + S(ifc) + '.';
    return i.hasV6(addr) || S(ifc) + ' on ' + dev + ' does not have ' + addr + '.';
  };
  K.ll = (dev, ifc, addr) => (h) => { const i = intf(h, dev, ifc); return (!!i && i.linkLocal === PT.v6(addr)) || S(ifc) + ' on ' + dev + ' needs link-local ' + addr + '.'; };
  K.up = (dev, ifc) => (h) => {
    const r = h.brief(dev).get(ifc);
    if (!r) return S(ifc) + ' is not in the show ip interface brief output of ' + dev + '.';
    return (r.status === 'up' && r.protocol === 'up') || S(ifc) + ' on ' + dev + ' is ' + r.status + '/' + r.protocol + '.';
  };
  K.noShut = (dev, ifc) => (h) => { const i = intf(h, dev, ifc); return (!!i && !i.shutdown) || S(ifc) + ' on ' + dev + ' is shut down.'; };
  K.shut = (dev, ifc) => (h) => { const i = intf(h, dev, ifc); return (!!i && i.shutdown) || S(ifc) + ' on ' + dev + ' is not shut down.'; };
  K.desc = (dev, ifc, re) => (h) => { const i = intf(h, dev, ifc); const d = i && i.desc; return !d ? S(ifc) + ' on ' + dev + ' has no description.' : (!re || re.test(d)) || 'The description of ' + S(ifc) + ' is "' + d + '".'; };

  /* ---------- switch ports ---------- */
  K.access = (dev, ports, vlan) => (h) => {
    for (const p of [].concat(ports)) {
      const i = intf(h, dev, p);
      if (!i) return dev + ' has no ' + S(p) + ' in its running-config.';
      if (i.mode !== 'access') return S(p) + ' on ' + dev + ' is not set to access mode (switchport mode access).';
      if (i.access !== vlan) return S(p) + ' on ' + dev + ' is in VLAN ' + i.access + ', expected VLAN ' + vlan + '.';
    }
    return true;
  };
  K.trunk = (dev, port, o) => (h) => {
    o = o || {};
    const i = intf(h, dev, port);
    if (!i) return dev + ' has no ' + S(port) + '.';
    if (i.mode !== 'trunk') return S(port) + ' on ' + dev + ' is not a static trunk (switchport mode trunk).';
    if (o.native && i.native !== o.native) return 'The native VLAN on ' + S(port) + ' (' + dev + ') is ' + i.native + ', expected ' + o.native + '.';
    if (o.allowed) {
      const a = i.allowed;
      const want = o.allowed.slice().sort((x, y) => x - y).join(',');
      if (a === null) return 'All VLANs are allowed on ' + S(port) + ' (' + dev + '); allow only ' + want + '.';
      const got = [...a].sort((x, y) => x - y).join(',');
      if (got !== want) return S(port) + ' on ' + dev + ' allows VLANs ' + (got || 'none') + ', expected ' + want + '.';
    }
    if (o.nonegotiate && !i.nonegotiate) return 'DTP is still on for ' + S(port) + ' (' + dev + '); add switchport nonegotiate.';
    return true;
  };
  K.trunkUp = (dev, port, o) => (h) => {
    o = o || {};
    const t = h.trunk(dev).get(port);
    if (!t || !t.status) return S(port) + ' is not listed as a trunk in show interfaces trunk on ' + dev + '.';
    if (t.status !== 'trunking') return S(port) + ' on ' + dev + ' is ' + t.status + '.';
    if (o.native && t.native !== o.native) return S(port) + ' on ' + dev + ' has native VLAN ' + t.native + '.';
    if (o.active) for (const v of o.active) if (!t.active || !t.active.has(v)) return 'VLAN ' + v + ' is not active on trunk ' + S(port) + ' of ' + dev + '.';
    return true;
  };
  K.vlan = (dev, id, name) => (h) => {
    const v = h.vlan(dev).get(id);
    if (!v) return 'VLAN ' + id + ' does not exist on ' + dev + '.';
    return !name || v.name.toLowerCase() === name.toLowerCase() || 'VLAN ' + id + ' on ' + dev + ' is named ' + v.name + ', expected ' + name + '.';
  };
  K.noVlan = (dev, id) => (h) => !h.vlan(dev).get(id) || 'VLAN ' + id + ' still exists on ' + dev + '.';
  K.inVlan = (dev, ports, id) => (h) => {
    const v = h.vlan(dev);
    for (const p of [].concat(ports)) { const got = v.portVlan(p); if (got !== id) return S(p) + ' on ' + dev + ' shows in ' + (got ? 'VLAN ' + got : 'no VLAN (is it a trunk?)') + ' in show vlan brief, expected VLAN ' + id + '.'; }
    return true;
  };
  K.portfast = (dev, ports) => (h) => { for (const p of [].concat(ports)) { const i = intf(h, dev, p); if (!i || !i.portfast) return 'PortFast is not on for ' + S(p) + ' (' + dev + ').'; } return true; };
  K.bpduguard = (dev, ports) => (h) => { for (const p of [].concat(ports)) { const i = intf(h, dev, p); if (!i || !i.bpduguard) return 'BPDU Guard is not on for ' + S(p) + ' (' + dev + ').'; } return true; };
  K.group = (dev, ports, id, modes) => (h) => {
    for (const p of [].concat(ports)) {
      const i = intf(h, dev, p);
      const g = i && i.group;
      if (!g) return S(p) + ' on ' + dev + ' is not in a channel group.';
      if (g.id !== id) return S(p) + ' on ' + dev + ' is in channel-group ' + g.id + ', expected ' + id + '.';
      if (modes && ![].concat(modes).includes(g.mode)) return S(p) + ' on ' + dev + ' uses mode ' + g.mode + ', expected ' + [].concat(modes).join(' or ') + '.';
    }
    return true;
  };
  K.bundle = (dev, id, ports, protocol) => (h) => {
    const g = h.ether(dev).get(id);
    if (!g) return 'Port-channel ' + id + ' is not in show etherchannel summary on ' + dev + '.';
    if (!/U/.test(g.flags)) return 'Po' + id + ' on ' + dev + ' is (' + g.flags + '), not in use (U).';
    if (protocol && g.protocol !== protocol.toUpperCase()) return 'Po' + id + ' on ' + dev + ' uses ' + g.protocol + ', expected ' + protocol + '.';
    for (const p of ports) { const m = g.ports.find((x) => PT.ifKey(x.name) === PT.ifKey(p)); if (!m || m.flags !== 'P') return S(p) + ' is not bundled (P) in Po' + id + ' on ' + dev + '.'; }
    return true;
  };

  /* ---------- routing ---------- */
  K.route = (dev, net, mask, nh, ad) => (h) => {
    const rs = h.run(dev).routes().filter((r) => r.net === net && r.mask === mask);
    if (!rs.length) return dev + ' has no ip route for ' + net + ' ' + mask + '.';
    if (nh && !rs.some((r) => r.nh === nh || (r.ifc && PT.ifKey(r.ifc) === PT.ifKey(nh)))) return 'The route to ' + net + ' on ' + dev + ' points to ' + rs.map((r) => r.nh || r.ifc).join(', ') + ', expected ' + nh + '.';
    if (ad && !rs.some((r) => r.ad === ad)) return 'The route to ' + net + ' on ' + dev + ' has distance ' + rs.map((r) => r.ad).join(', ') + ', expected ' + ad + '.';
    return true;
  };
  K.route6 = (dev, prefix, nh, ad) => (h) => {
    const [net, len] = prefix.split('/');
    const rs = h.run(dev).routes6().filter((r) => PT.sameV6(r.net, net) && r.len === Number(len));
    if (!rs.length) return dev + ' has no ipv6 route for ' + prefix + '.';
    if (nh && !rs.some((r) => (r.nh && PT.sameV6(r.nh, nh)) || (r.ifc && PT.ifKey(r.ifc) === PT.ifKey(nh)))) return 'The IPv6 route to ' + prefix + ' on ' + dev + ' does not use ' + nh + '.';
    if (ad && !rs.some((r) => r.ad === ad)) return 'The IPv6 route to ' + prefix + ' on ' + dev + ' has distance ' + rs.map((r) => r.ad).join(', ') + ', expected ' + ad + '.';
    return true;
  };
  K.inTable = (dev, code, net, len, via) => (h) => {
    const rs = h.route(dev).find(net, len);
    const r = rs.find((x) => x.base === code);
    if (!r) return net + '/' + len + ' is not in the routing table of ' + dev + (rs.length ? ' as a ' + code + ' route (found ' + rs.map((x) => x.code).join(', ') + ')' : '') + '.';
    if (via && !r.via.includes(via) && !(r.ifc && PT.ifKey(r.ifc) === PT.ifKey(via))) return 'The ' + code + ' route to ' + net + '/' + len + ' on ' + dev + ' goes via ' + (r.via.join(', ') || r.ifc) + ', expected ' + via + '.';
    return true;
  };
  K.inTable6 = (dev, code, prefix, via) => (h) => {
    const [net, len] = prefix.split('/');
    const rs = h.route6(dev).find(net, Number(len));
    const r = rs.find((x) => x.base === code);
    if (!r) return prefix + ' is not in the IPv6 routing table of ' + dev + ' as a ' + code + ' route.';
    if (via && !r.via.some((v) => PT.sameV6(v, via)) && !(r.ifc && PT.ifKey(r.ifc) === PT.ifKey(via))) return 'The IPv6 route to ' + prefix + ' on ' + dev + ' does not go via ' + via + '.';
    return true;
  };
  K.lastResort = (dev, gw) => (h) => { const r = h.route(dev); return r.gw === gw || 'Gateway of last resort on ' + dev + ' is ' + (r.gwSet ? r.gw : 'not set') + ', expected ' + gw + '.'; };

  /* ---------- end devices ---------- */
  K.ping = (src, target) => (h) => h.pinged(src, target) || 'The ping from ' + src + ' to ' + target + ' failed. Fix the problem, ping again and paste the new output.';
  K.noPing = (src, target) => (h) => h.pingFailed(src, target) || 'The ping from ' + src + ' to ' + target + ' succeeded, but it should fail here.';
  K.dhcpClient = (pc, net, len, gw) => (h) => {
    const c = h.ipcfg(pc);
    if (!c.ipv4) return pc + ' has no IPv4 address. Is it set to DHCP?';
    if (/^169\.254\./.test(c.ipv4)) return pc + ' only has an APIPA address (' + c.ipv4 + '): no DHCP server answered.';
    if (!PT.ip.inNet(c.ipv4, net, len)) return pc + ' has ' + c.ipv4 + ', which is not in ' + net + '/' + len + '.';
    if (gw && c.gw4 !== gw) return pc + ' got default gateway ' + (c.gw4 || 'none') + ', expected ' + gw + '.';
    return true;
  };
  K.pcGateway = (pc, gw) => (h) => { const c = h.ipcfg(pc); return c.gw4 === gw || pc + ' uses default gateway ' + (c.gw4 || 'none') + ', expected ' + gw + '.'; };
})(typeof window !== 'undefined' ? window : globalThis);
