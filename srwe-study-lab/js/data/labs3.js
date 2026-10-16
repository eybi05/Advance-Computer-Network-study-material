/* Packet Tracer labs, modules 10–16 (format: see labs1.js). */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const K = SRWE.LabKit;
  const PT = SRWE.PT;
  const L = SRWE.labs = SRWE.labs || [];
  const SW = '2960-24TT', RT = 'ISR4321', RT3 = 'ISR4331', PC = 'PC-PT';
  const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push('Fa0/' + i); return o; };

  /* ================================================================ M10 */
  L.push({
    id: 'm10-access-control', module: 10, topics: ['10.2', '10.3', '10.5'], level: 'Practice', minutes: 30,
    title: 'Local AAA, SSH and CDP Reconnaissance',
    goal: 'See what CDP gives away, limit it, and move device logins to a local AAA user database.',
    scenario: '<p>An attacker plugged into an access port can learn a lot from CDP. First look at what CDP shows, then switch it off where no Cisco neighbour should be. Then replace the shared vty password on R1 with local AAA authentication over SSH.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 6 }, { id: 'S1', type: 'switch', model: SW, x: 50, y: 30 },
      { id: 'PC1', type: 'pc', model: PC, x: 22, y: 56, note: 'admin PC' }, { id: 'PC2', type: 'pc', model: PC, x: 78, y: 56, note: 'user PC' }],
    links: [['R1', 'G0/0/1', 'S1', 'G0/1', 'straight'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/1', '192.168.1.1/24', ''], ['S1', 'VLAN 1', '192.168.1.2/24', '192.168.1.1'], ['PC1', 'NIC', '192.168.1.10/24', '192.168.1.1'], ['PC2', 'NIC', '192.168.1.20/24', '192.168.1.1']],
    start: {
      R1: ['hostname R1', 'interface g0/0/1', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown', 'exit', 'line vty 0 4', 'password cisco', 'login'],
      S1: ['hostname S1', 'interface vlan 1', 'ip address 192.168.1.2 255.255.255.0', 'no shutdown', 'exit', 'ip default-gateway 192.168.1.1'],
    },
    tasks: [
      { part: 'Reconnaissance', text: 'On S1, run <code>show cdp neighbors</code>. Which platform does CDP report for R1?', answer: (h) => { const n = h.cdp('S1').list.find((x) => /^R1/i.test(x.id)); return n ? [n.platform] : []; } },
      { part: 'Reconnaissance', text: 'Which S1 interface leads to R1, according to CDP?', answer: (h) => { const n = h.cdp('S1').list.find((x) => /^R1/i.test(x.id)); return n ? [n.local, PT.shortIf(n.local), PT.shortIf(n.local).replace('G', 'Gi')] : []; } },
      { part: 'Limit CDP', text: 'Stop CDP on the two access ports Fa0/6 and Fa0/18 of S1. Keep it on the uplink to R1.', check: (h) => ['Fa0/6', 'Fa0/18'].every((p) => { const i = K.intf(h, 'S1', p); return i && i.cdpOff; }) || 'Fa0/6 and Fa0/18 need no cdp enable.',
        cmds: ['interface range fa0/6, fa0/18', 'no cdp enable'] },
      { part: 'Local AAA', text: 'On R1, create the user <b>admin</b> with the secret <code>Str0ngPass</code>.', check: K.user('R1', 'admin'), cmds: ['username admin secret Str0ngPass'] },
      { part: 'Local AAA', text: 'Turn on AAA and make the default login method the local user database.', check: K.all(K.has('R1', /^aaa new-model/, 'aaa new-model is missing.'), K.has('R1', /^aaa authentication login default local/, 'aaa authentication login default local is missing.')),
        cmds: ['aaa new-model', 'aaa authentication login default local'] },
      { part: 'Local AAA', text: 'Prepare SSH on R1: domain <code>ccna-lab.com</code>, a 1024-bit RSA key, SSH version 2, and only SSH on vty 0–4.',
        check: K.all(K.has('R1', /^ip domain[- ]name ccna-lab\.com$/i, 'ip domain-name ccna-lab.com is missing.'), K.has('R1', /^ip ssh version 2/, 'ip ssh version 2 is missing.'), (h) => h.run('R1').vty(0, 4, (l) => PT.lineTransport(l) === 'ssh') || 'vty 0–4 must allow only SSH.'),
        cmds: ['ip domain-name ccna-lab.com', 'crypto key generate rsa general-keys modulus 1024', 'ip ssh version 2', 'line vty 0 4', 'transport input ssh'] },
      { part: 'Verify', text: 'From PC1, log in to R1 with <code>ssh -l admin 192.168.1.1</code>.', check: (h) => h.remote('PC1', 'ssh', '192.168.1.1', 'admin').ok || 'The SSH session did not reach the R1> prompt.' },
      { part: 'Concepts', text: 'Which of the three A\'s records the commands a user entered?', answer: ['accounting'] },
      { part: 'Concepts', text: 'In 802.1X, which role does the switch play?', answer: ['authenticator', 'the authenticator'] },
    ],
    collect: { S1: ['show cdp neighbors', 'show running-config'], R1: ['show running-config'], PC1: ['ssh -l admin 192.168.1.1'] },
    solution: {
      S1: ['interface range fa0/6, fa0/18', 'no cdp enable'],
      R1: ['username admin secret Str0ngPass', 'aaa new-model', 'aaa authentication login default local', 'ip domain-name ccna-lab.com', 'crypto key generate rsa general-keys modulus 1024', 'ip ssh version 2', 'line vty 0 4', 'transport input ssh'],
    },
  });

  /* ================================================================ M11 */
  const UNUSED = range(2, 5).concat(range(7, 17), range(19, 24));
  L.push({
    id: 'm11-switch-security', module: 11, topics: ['11.1', '11.2', '11.3', '11.4', '11.5'], level: 'Challenge', minutes: 45,
    title: 'Switch Security Configuration',
    goal: 'Harden S1 against MAC flooding, VLAN hopping, DHCP, ARP and STP attacks.',
    scenario: '<p>S1 is the access switch for VLAN 10. R1 is the DHCP server and default gateway. S1 Fa0/1 is a trunk to S2. Apply every mitigation from module 11, then prove the PCs still get addresses and can talk.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 4 }, { id: 'S1', type: 'switch', model: SW, x: 50, y: 28 }, { id: 'S2', type: 'switch', model: SW, x: 88, y: 28 },
      { id: 'PC1', type: 'pc', model: PC, x: 26, y: 54, note: 'DHCP' }, { id: 'PC2', type: 'pc', model: PC, x: 60, y: 56, note: 'DHCP' }],
    links: [['R1', 'G0/0/1', 'S1', 'G0/1', 'straight'], ['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/1', '192.168.10.1/24', ''], ['PC1', 'NIC', 'DHCP (192.168.10.0/24)', '192.168.10.1'], ['PC2', 'NIC', 'DHCP (192.168.10.0/24)', '192.168.10.1']],
    ptNotes: ['Set both PCs to DHCP. If a PC does not get an address after you enable DHCP snooping, check the trusted port and the note on option 82 in the hint.'],
    start: {
      R1: ['hostname R1', 'interface g0/0/1', 'ip address 192.168.10.1 255.255.255.0', 'no shutdown', 'exit', 'ip dhcp excluded-address 192.168.10.1 192.168.10.9', 'ip dhcp pool VLAN10', 'network 192.168.10.0 255.255.255.0', 'default-router 192.168.10.1'],
      S1: ['hostname S1', 'vlan 10', 'name Users', 'vlan 99', 'name Native', 'vlan 999', 'name BlackHole', 'exit', 'interface g0/1', 'switchport mode access', 'switchport access vlan 10',
        'interface range fa0/6, fa0/18', 'switchport mode access', 'switchport access vlan 10', 'interface fa0/1', 'switchport mode trunk'],
      S2: ['hostname S2', 'vlan 10', 'vlan 99', 'exit', 'interface fa0/1', 'switchport mode trunk'],
    },
    tasks: [
      { part: 'Unused ports', text: 'Put every unused Fa port (Fa0/2–5, Fa0/7–17, Fa0/19–24) in VLAN 999 as an access port, and shut it down.',
        check: (h) => { for (const p of UNUSED) { const i = K.intf(h, 'S1', p); if (!i || i.mode !== 'access' || i.access !== 999 || !i.shutdown) return PT.shortIf(p) + ' is not a shut-down access port in VLAN 999.'; } return true; },
        cmds: ['interface range fa0/2 - 5, fa0/7 - 17, fa0/19 - 24', 'switchport mode access', 'switchport access vlan 999', 'shutdown'] },
      { part: 'Port security', text: 'On Fa0/6 and Fa0/18, enable port security with at most 2 MAC addresses, sticky learning and violation mode <b>restrict</b>.',
        check: (h) => { for (const p of ['Fa0/6', 'Fa0/18']) { const i = K.intf(h, 'S1', p); const s = i && i.psec; if (!s) return 'Port security is not enabled on ' + p + '.'; if (s.max !== 2 || !s.sticky || s.violation !== 'restrict') return p + ': maximum ' + s.max + ', sticky ' + (s.sticky ? 'on' : 'off') + ', violation ' + s.violation + '.'; } return true; },
        cmds: ['interface range fa0/6, fa0/18', 'switchport port-security', 'switchport port-security maximum 2', 'switchport port-security mac-address sticky', 'switchport port-security violation restrict'] },
      { part: 'VLAN hopping', text: 'Harden the trunk Fa0/1 on S1 and S2: static trunk, DTP off, native VLAN 99.', check: K.all(K.trunk('S1', 'Fa0/1', { native: 99, nonegotiate: true }), K.trunk('S2', 'Fa0/1', { native: 99, nonegotiate: true })),
        cmds: ['interface fa0/1', 'switchport mode trunk', 'switchport nonegotiate', 'switchport trunk native vlan 99'] },
      { part: 'DHCP snooping', text: 'Enable DHCP snooping globally and for VLAN 10, trust G0/1 (towards the DHCP server) and limit Fa0/6 and Fa0/18 to 6 DHCP packets per second.',
        hint: 'Packet Tracer, like IOS, inserts option 82 by default and the IOS DHCP server on R1 then drops the relayed requests. Add <code>no ip dhcp snooping information option</code> on S1.',
        check: K.all(K.has('S1', /^ip dhcp snooping$/, 'ip dhcp snooping is not enabled.'), (h) => /^ip dhcp snooping vlan/.test((h.run('S1').find(/^ip dhcp snooping vlan (\S+)/) || [''])[0]) && PT.vlanSet(h.run('S1').find(/^ip dhcp snooping vlan (\S+)/)[1]).has(10) || 'Snooping is not enabled for VLAN 10.',
          (h) => { const g = K.intf(h, 'S1', 'G0/1'); return (!!g && g.snoopTrust) || 'G0/1 is not trusted for DHCP snooping.'; }, (h) => ['Fa0/6', 'Fa0/18'].every((p) => (K.intf(h, 'S1', p) || {}).snoopRate === 6) || 'Fa0/6 and Fa0/18 need ip dhcp snooping limit rate 6.'),
        cmds: ['ip dhcp snooping', 'ip dhcp snooping vlan 10', 'no ip dhcp snooping information option', 'interface g0/1', 'ip dhcp snooping trust', 'interface range fa0/6, fa0/18', 'ip dhcp snooping limit rate 6'] },
      { part: 'DHCP snooping', text: '<code>show ip dhcp snooping</code> confirms it: enabled, VLAN 10, G0/1 trusted.', check: (h) => { const s = h.snoop('S1'); return (s.enabled && s.vlans.has(10) && !!s.get('G0/1') && s.get('G0/1').trusted) || 'show ip dhcp snooping does not show all three.'; } },
      { part: 'DAI', text: 'Enable Dynamic ARP Inspection for VLAN 10 and trust G0/1 for ARP inspection.', check: K.all(K.has('S1', /^ip arp inspection vlan .*\b10\b/, 'ip arp inspection vlan 10 is missing.'), (h) => { const g = K.intf(h, 'S1', 'G0/1'); return (!!g && g.arpTrust) || 'G0/1 is not trusted for ARP inspection.'; }),
        cmds: ['ip arp inspection vlan 10', 'interface g0/1', 'ip arp inspection trust'] },
      { part: 'STP attacks', text: 'Enable PortFast and BPDU Guard on Fa0/6 and Fa0/18.', check: K.all(K.portfast('S1', ['Fa0/6', 'Fa0/18']), K.bpduguard('S1', ['Fa0/6', 'Fa0/18'])),
        cmds: ['interface range fa0/6, fa0/18', 'spanning-tree portfast', 'spanning-tree bpduguard enable'] },
      { part: 'Verify', text: 'Both PCs still get an address from R1 (renew it in IP Configuration).', check: K.all(K.dhcpClient('PC1', '192.168.10.0', 24, '192.168.10.1'), K.dhcpClient('PC2', '192.168.10.0', 24, '192.168.10.1')) },
      { part: 'Verify', text: 'From PC1, ping PC2 so S1 learns sticky addresses. Then <code>show port-security interface fa0/6</code> shows Secure-up, mode Restrict and at least one sticky MAC.',
        check: K.all((h) => { const ip = h.ipcfg('PC2').ipv4; if (!ip) return 'PC2 has no address.'; const p = h.pingTo('PC1', ip); if (!p) throw new PT.Need('PC1', 'ping ' + ip); return p.success || 'The ping from PC1 to PC2 failed.'; },
          (h) => { const p = h.psecIf('S1', 'Fa0/6'); return (/secure-up/.test(p.status) && p.violation === 'restrict' && p.sticky >= 1) || 'Fa0/6 shows ' + p.status + ', ' + p.violation + ', sticky ' + p.sticky + '.'; }) },
    ],
    collect: { S1: ['show running-config', 'show ip dhcp snooping', 'show port-security interface fa0/6'], S2: ['show running-config'], PC1: ['ipconfig /all', 'ping <PC2 address>'], PC2: ['ipconfig /all'] },
    solution: {
      S1: ['interface range fa0/2 - 5, fa0/7 - 17, fa0/19 - 24', 'switchport mode access', 'switchport access vlan 999', 'shutdown', 'interface range fa0/6, fa0/18', 'switchport port-security', 'switchport port-security maximum 2',
        'switchport port-security mac-address sticky', 'switchport port-security violation restrict', 'spanning-tree portfast', 'spanning-tree bpduguard enable', 'ip dhcp snooping limit rate 6', 'interface fa0/1', 'switchport mode trunk', 'switchport nonegotiate',
        'switchport trunk native vlan 99', 'exit', 'ip dhcp snooping', 'ip dhcp snooping vlan 10', 'no ip dhcp snooping information option', 'ip arp inspection vlan 10', 'interface g0/1', 'ip dhcp snooping trust', 'ip arp inspection trust'],
      S2: ['interface fa0/1', 'switchport mode trunk', 'switchport nonegotiate', 'switchport trunk native vlan 99'],
    },
  });

  L.push({
    id: 'm11-port-security-violation', module: 11, topics: ['11.1'], level: 'Practice', minutes: 20,
    title: 'Trigger and Recover a Port Security Violation',
    goal: 'Watch a sticky MAC get learned, plug in a rogue laptop, and recover the error-disabled port.',
    scenario: '<p>Fa0/6 allows exactly one device and remembers it (sticky). You will connect PC1, then swap it for a rogue laptop and see the port shut itself down.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 50, y: 14 }, { id: 'PC1', type: 'pc', model: PC, x: 24, y: 46, note: '192.168.1.10' }, { id: 'Rogue', type: 'laptop', model: 'Laptop-PT', x: 76, y: 46, note: '192.168.1.66' }],
    links: [['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['Rogue', 'NIC', 'S1', 'Fa0/18', 'straight']],
    addressing: [['S1', 'VLAN 1', '192.168.1.2/24', ''], ['PC1', 'NIC', '192.168.1.10/24', ''], ['Rogue', 'NIC', '192.168.1.66/24', '']],
    ptNotes: ['Cable the rogue laptop to Fa0/18 for now. In step 3 you move its cable to Fa0/6 (and unplug PC1).'],
    start: { S1: ['hostname S1', 'interface vlan 1', 'ip address 192.168.1.2 255.255.255.0', 'no shutdown', 'interface fa0/6', 'switchport mode access', 'switchport port-security', 'switchport port-security mac-address sticky'] },
    tasks: [
      { part: 'Learn', text: 'From PC1, ping S1 (192.168.1.2) so Fa0/6 learns PC1\'s MAC address.', check: K.ping('PC1', '192.168.1.2') },
      { part: 'Learn', text: 'The running-config of S1 now holds PC1\'s MAC as a sticky address on Fa0/6.',
        check: (h) => { const i = K.intf(h, 'S1', 'Fa0/6'); const mac = h.ipcfg('PC1').mac; const s = i && i.psec; return (!!s && s.stickyMacs.some((m) => PT.macNorm(m) === mac)) || 'No sticky MAC on Fa0/6 matches PC1 (' + mac + ').'; } },
      { part: 'Violate', text: 'Unplug PC1, connect the rogue laptop to Fa0/6 and ping 192.168.1.2 from it. <code>show port-security interface fa0/6</code> on S1 then shows Secure-shutdown and a violation count of at least 1.',
        check: (h) => { const p = h.psecIf('S1', 'Fa0/6'); return (/secure-shutdown/.test(p.status) && p.violations >= 1) || 'Fa0/6 is ' + p.status + ' with ' + p.violations + ' violations.'; } },
      { part: 'Violate', text: 'Which violation mode was used? (it is the default)', answer: ['shutdown'] },
      { part: 'Violate', text: 'Run <code>show interfaces fa0/6</code>. What state is shown in brackets after "line protocol is down"?', answer: ['err-disabled', 'errdisabled', 'error-disabled', '(err-disabled)'] },
      { part: 'Recover', text: 'Put PC1 back on Fa0/6, then re-enable the port with <code>shutdown</code> followed by <code>no shutdown</code>. PC1 can ping S1 again.', self: true },
      { part: 'Recover', text: 'Which violation mode drops the rogue frames and logs a message, but keeps the port up?', answer: ['restrict'] },
    ],
    collect: { S1: ['show running-config', 'show port-security interface fa0/6'], PC1: ['ipconfig /all', 'ping 192.168.1.2'] },
    solution: { S1: ['#', '(after the violation)', 'S1(config)# interface fa0/6', 'S1(config-if)# shutdown', 'S1(config-if)# no shutdown'] },
  });

  /* ================================================================ M12 */
  L.push({
    id: 'm12-wlan-basics', module: 12, topics: ['12.2', '12.3', '12.5', '12.7'], level: 'Practice', minutes: 30,
    title: 'Two Access Points, One ESS',
    goal: 'Build an extended service set from two autonomous APs on non-overlapping channels with WPA2-PSK.',
    scenario: '<p>Two autonomous access points share one SSID, so wireless clients see a single network (an ESS) made of two BSSs. Put the APs on non-overlapping 2.4 GHz channels and secure the WLAN with WPA2 Personal (AES). R1 hands out addresses with DHCP.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 4, note: 'DHCP server' }, { id: 'S1', type: 'switch', model: SW, x: 50, y: 26 },
      { id: 'AP1', type: 'ap', model: 'AccessPoint-PT', x: 24, y: 42, note: 'channel 1' }, { id: 'AP2', type: 'ap', model: 'AccessPoint-PT', x: 76, y: 42, note: 'channel 11' },
      { id: 'Laptop1', type: 'laptop', model: 'Laptop-PT + WPC300N', x: 12, y: 64 }, { id: 'Laptop2', type: 'laptop', model: 'Laptop-PT + WPC300N', x: 88, y: 64 }],
    links: [['R1', 'G0/0/1', 'S1', 'G0/1', 'straight'], ['AP1', 'Port0', 'S1', 'Fa0/1', 'straight'], ['AP2', 'Port0', 'S1', 'Fa0/2', 'straight'], ['Laptop1', 'NIC', 'AP1', '', 'wireless'], ['Laptop2', 'NIC', 'AP2', '', 'wireless']],
    addressing: [['R1', 'G0/0/1', '192.168.50.1/24', ''], ['Laptops', 'Wireless0', 'DHCP (192.168.50.0/24)', '192.168.50.1']],
    ptNotes: ['A Laptop-PT has a wired NIC. Power it off in the Physical tab, drag the NIC out, drag a <b>WPC300N</b> in, and power it on.',
      'Configure an AP in its <b>Config > Port 1</b> page: SSID, channel, Authentication <b>WPA2-PSK</b>, PSK pass phrase, Encryption <b>AES</b>.',
      'Join a laptop in <b>Config > Wireless0</b> (or Desktop > PC Wireless) with the same SSID and pass phrase, and set IP Configuration to DHCP.'],
    start: { R1: ['hostname R1', 'interface g0/0/1', 'ip address 192.168.50.1 255.255.255.0', 'no shutdown', 'exit', 'ip dhcp excluded-address 192.168.50.1 192.168.50.9', 'ip dhcp pool WLAN', 'network 192.168.50.0 255.255.255.0', 'default-router 192.168.50.1'], S1: ['hostname S1'] },
    tasks: [
      { part: 'Access points', text: 'AP1: SSID <b>Branch</b>, channel 1, WPA2-PSK with pass phrase <code>cisco12345</code> and AES.', self: true },
      { part: 'Access points', text: 'AP2: the same SSID and security, but channel 11.', self: true },
      { part: 'Plan', text: 'Which three 2.4 GHz channels do not overlap?', answer: ['1, 6, 11', '1,6,11', '1 6 11', '1, 6 and 11', '1 6 and 11'] },
      { part: 'Plan', text: 'Two BSSs joined by a wired distribution system and sharing one SSID form a what? (three letters)', answer: ['ess', 'an ess', 'extended service set'] },
      { part: 'Clients', text: 'Laptop1 joins the WLAN and gets an address from 192.168.50.0/24.', check: K.dhcpClient('Laptop1', '192.168.50.0', 24, '192.168.50.1') },
      { part: 'Clients', text: 'Laptop2 joins the WLAN and gets an address from 192.168.50.0/24.', check: K.dhcpClient('Laptop2', '192.168.50.0', 24, '192.168.50.1') },
      { part: 'Verify', text: 'From Laptop1, ping R1 (192.168.50.1).', check: K.ping('Laptop1', '192.168.50.1') },
      { part: 'Security', text: 'Which encryption protocol does WPA2 use?', answer: ['aes', 'aes-ccmp', 'ccmp'] },
    ],
    collect: { Laptop1: ['ipconfig /all', 'ping 192.168.50.1'], Laptop2: ['ipconfig /all'] },
    solution: { AP1: ['#', 'Config > Port 1: SSID Branch, Channel 1, WPA2-PSK, pass phrase cisco12345, AES'], AP2: ['#', 'Config > Port 1: SSID Branch, Channel 11, WPA2-PSK, pass phrase cisco12345, AES'],
      Laptop1: ['#', 'Config > Wireless0: SSID Branch, WPA2-PSK, pass phrase cisco12345, AES; IP Configuration: DHCP'] },
  });

  /* ================================================================ M13 */
  L.push({
    id: 'm13-home-router', module: 13, topics: ['13.1'], level: 'Guided', minutes: 30,
    title: 'Configure a Wireless Home Router',
    goal: 'Set up a SOHO wireless router: WAN by DHCP, a new LAN subnet, a secured WLAN, and internet access through NAT.',
    scenario: '<p>The ISP router hands out a public address by DHCP. Set up the wireless router for a small office: change the LAN to 192.168.10.0/24, secure the WLAN, change the admin password, and connect a wired PC and a laptop.</p>',
    devices: [{ id: 'ISP', type: 'router', model: RT, x: 50, y: 4, note: 'ISP' }, { id: 'Web', type: 'server', model: 'Server-PT', x: 88, y: 4, note: '198.51.100.10' },
      { id: 'HomeRouter', type: 'wrouter', model: 'WRT300N', x: 50, y: 30 }, { id: 'PC1', type: 'pc', model: PC, x: 22, y: 58, note: 'DHCP' }, { id: 'Laptop1', type: 'laptop', model: 'Laptop-PT + WPC300N', x: 78, y: 58, note: 'DHCP' }],
    links: [['HomeRouter', 'Internet', 'ISP', 'G0/0/0', 'straight'], ['Web', 'NIC', 'ISP', 'G0/0/1', 'cross'], ['PC1', 'NIC', 'HomeRouter', 'Ethernet1', 'straight'], ['Laptop1', 'NIC', 'HomeRouter', '', 'wireless']],
    addressing: [['ISP', 'G0/0/0', '209.165.200.225/27 (DHCP pool)', ''], ['ISP', 'G0/0/1', '198.51.100.1/24', ''], ['Web', 'NIC', '198.51.100.10/24', '198.51.100.1'],
      ['HomeRouter', 'Internet', 'DHCP from the ISP', ''], ['HomeRouter', 'LAN', '192.168.10.1/24', ''], ['PC1, Laptop1', 'NIC', 'DHCP', '192.168.10.1']],
    ptNotes: ['Open the wireless router\'s GUI from PC1: <b>Desktop > Web Browser</b>, address 192.168.0.1, user and password <b>admin</b>. (Or use the router\'s GUI tab.)',
      'After you change the LAN address, renew PC1\'s DHCP lease and browse to 192.168.10.1.'],
    start: { ISP: ['hostname ISP', 'interface g0/0/0', 'ip address 209.165.200.225 255.255.255.224', 'no shutdown', 'interface g0/0/1', 'ip address 198.51.100.1 255.255.255.0', 'no shutdown', 'exit',
      'ip dhcp excluded-address 209.165.200.225 209.165.200.229', 'ip dhcp pool CUSTOMERS', 'network 209.165.200.224 255.255.255.224', 'default-router 209.165.200.225'] },
    tasks: [
      { part: 'Basic setup', text: 'Leave the Internet connection type on <b>Automatic Configuration - DHCP</b>. <code>show ip dhcp binding</code> on the ISP lists a lease for the wireless router.', check: (h) => h.bind('ISP').inNet('209.165.200.224', 27).length >= 1 || 'The ISP has not leased an address to the wireless router.' },
      { part: 'Basic setup', text: 'Change the router\'s LAN address to 192.168.10.1/24 and let DHCP start at 192.168.10.100.', self: true },
      { part: 'Basic setup', text: 'Change the default administrative password (Administration tab).', self: true },
      { part: 'Wireless', text: 'Set the SSID to <b>SOHO-Net</b>, pick channel 6, and set the security mode to WPA2 Personal with AES and a pass phrase.', self: true },
      { part: 'Clients', text: 'PC1 (wired) has an address from 192.168.10.0/24 with gateway 192.168.10.1.', check: K.dhcpClient('PC1', '192.168.10.0', 24, '192.168.10.1') },
      { part: 'Clients', text: 'Laptop1 joins SOHO-Net and has an address from 192.168.10.0/24.', check: K.dhcpClient('Laptop1', '192.168.10.0', 24, '192.168.10.1') },
      { part: 'Internet', text: 'From Laptop1, ping the web server 198.51.100.10.', check: K.ping('Laptop1', '198.51.100.10') },
      { part: 'Internet', text: 'The ISP has no route to 192.168.10.0/24, yet the ping works. Which feature of the home router makes this possible?', answer: ['nat', 'network address translation', 'pat'] },
    ],
    collect: { ISP: ['show ip dhcp binding'], PC1: ['ipconfig /all'], Laptop1: ['ipconfig /all', 'ping 198.51.100.10'] },
    solution: { HomeRouter: ['#', 'Setup > Basic Setup: Router IP 192.168.10.1 / 255.255.255.0, DHCP start 192.168.10.100, Save Settings', 'Wireless > Basic Wireless Settings: SSID SOHO-Net, channel 6, Save',
      'Wireless > Wireless Security: WPA2 Personal, AES, pass phrase, Save', 'Administration: new router password, Save'] },
  });

  L.push({
    id: 'm13-wlc', module: 13, topics: ['13.2', '13.3', '13.4'], level: 'Challenge', minutes: 50,
    title: 'WLANs on a Wireless LAN Controller',
    goal: 'Prepare the wired side, then create a WPA2-PSK WLAN and a WPA2-Enterprise WLAN on a WLC with a VLAN interface and RADIUS.',
    scenario: '<p>The WLC manages a lightweight AP. VLAN 1 (192.168.200.0/24) carries management traffic; the new enterprise WLAN uses VLAN 5 (192.168.5.0/24). R1 routes between the VLANs and is the DHCP server. The server on R1\'s LAN runs the RADIUS (AAA) service.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 4 }, { id: 'S0', type: 'switch', model: SW, x: 18, y: 4, note: 'server LAN' },
      { id: 'Admin', type: 'pc', model: PC, x: 4, y: 24, note: '172.16.1.10' }, { id: 'RADIUS', type: 'server', model: 'Server-PT', x: 30, y: 24, note: '172.16.1.254' },
      { id: 'S1', type: 'switch', model: SW, x: 50, y: 26 }, { id: 'WLC', type: 'wlc', model: 'WLC-3504', x: 18, y: 44 }, { id: 'AP1', type: 'ap', model: 'LAP-PT (or 3702i)', x: 82, y: 44 },
      { id: 'Laptop1', type: 'laptop', model: 'Laptop-PT + WPC300N', x: 66, y: 66, note: 'WPA2-PSK' }, { id: 'Laptop2', type: 'laptop', model: 'Laptop-PT + WPC300N', x: 94, y: 66, note: 'WPA2-Enterprise' }],
    links: [['R1', 'G0/0/0', 'S0', 'Fa0/1', 'straight'], ['Admin', 'NIC', 'S0', 'Fa0/2', 'straight'], ['RADIUS', 'NIC', 'S0', 'Fa0/3', 'straight'], ['R1', 'G0/0/1', 'S1', 'G0/1', 'straight'], ['WLC', 'G1', 'S1', 'Fa0/1', 'straight'], ['AP1', 'G0', 'S1', 'Fa0/2', 'straight'],
      ['Laptop1', 'NIC', 'AP1', '', 'wireless'], ['Laptop2', 'NIC', 'AP1', '', 'wireless']],
    addressing: [['R1', 'G0/0/0', '172.16.1.1/24', ''], ['R1', 'G0/0/1.1', '192.168.200.1/24 (native VLAN 1)', ''], ['R1', 'G0/0/1.5', '192.168.5.1/24', ''], ['WLC', 'management', '192.168.200.254/24', '192.168.200.1'],
      ['WLC', 'vlan5', '192.168.5.254/24', '192.168.5.1'], ['AP1', 'G0', 'DHCP (VLAN 1)', ''], ['RADIUS', 'NIC', '172.16.1.254/24', '172.16.1.1'], ['Admin', 'NIC', '172.16.1.10/24', '172.16.1.1']],
    ptNotes: ['S0 needs no configuration.',
      'Open the WLC GUI from Admin: Desktop > Web Browser > https://192.168.200.254. If the WLC still has no address, set it in the WLC\'s Config tab (Management interface) first.',
      'On the RADIUS server enable <b>Services > AAA</b>: add client WLC 192.168.200.254 with secret <code>Wlc!Secret1</code> (type RADIUS) and a user, for example <code>user1 / User1Pass</code>.'],
    start: { S1: ['hostname S1', 'vlan 5', 'name WLAN5', 'exit'], S0: ['hostname S0'] },
    tasks: [
      { part: 'Wired side', text: 'R1: G0/0/0 172.16.1.1/24; subinterface G0/0/1.1 for native VLAN 1 (192.168.200.1/24) and G0/0/1.5 for VLAN 5 (192.168.5.1/24); G0/0/1 up.',
        check: K.all(K.ip('R1', 'G0/0/0', '172.16.1.1', 24), (h) => { const i = K.intf(h, 'R1', 'G0/0/1.1'); return (!!i && !!i.encap && i.encap.vlan === 1 && i.encap.native) || 'G0/0/1.1 needs encapsulation dot1Q 1 native.'; }, K.ip('R1', 'G0/0/1.1', '192.168.200.1', 24),
          (h) => { const i = K.intf(h, 'R1', 'G0/0/1.5'); return (!!i && !!i.encap && i.encap.vlan === 5) || 'G0/0/1.5 needs encapsulation dot1Q 5.'; }, K.ip('R1', 'G0/0/1.5', '192.168.5.1', 24), K.noShut('R1', 'G0/0/1'), K.noShut('R1', 'G0/0/0')),
        cmds: ['interface g0/0/0', 'ip address 172.16.1.1 255.255.255.0', 'no shutdown', 'interface g0/0/1', 'no shutdown', 'interface g0/0/1.1', 'encapsulation dot1Q 1 native', 'ip address 192.168.200.1 255.255.255.0', 'interface g0/0/1.5', 'encapsulation dot1Q 5', 'ip address 192.168.5.1 255.255.255.0'] },
      { part: 'Wired side', text: 'R1 DHCP pools: <b>WLAN-MGMT</b> 192.168.200.0/24 (gateway .1) and <b>WLAN5</b> 192.168.5.0/24 (gateway .1). Exclude .1–.9 and .254 in both.',
        check: (h) => { const c = h.run('R1'); const a = c.pools().find((p) => p.network === '192.168.200.0'), b = c.pools().find((p) => p.network === '192.168.5.0'); if (!a || !b) return 'Both pools are needed.'; if (a.gw[0] !== '192.168.200.1' || b.gw[0] !== '192.168.5.1') return 'Check the default-router of each pool.'; return (c.isExcluded('192.168.200.254') && c.isExcluded('192.168.5.254') && c.isExcluded('192.168.5.1')) || 'The excluded ranges are incomplete.'; },
        cmds: ['ip dhcp excluded-address 192.168.200.1 192.168.200.9', 'ip dhcp excluded-address 192.168.200.254', 'ip dhcp excluded-address 192.168.5.1 192.168.5.9', 'ip dhcp excluded-address 192.168.5.254',
          'ip dhcp pool WLAN-MGMT', 'network 192.168.200.0 255.255.255.0', 'default-router 192.168.200.1', 'ip dhcp pool WLAN5', 'network 192.168.5.0 255.255.255.0', 'default-router 192.168.5.1'] },
      { part: 'Wired side', text: 'S1: G0/1 (to R1) and Fa0/1 (to the WLC) are trunks; Fa0/2 (to the AP) is an access port in VLAN 1.', check: K.all(K.trunk('S1', 'G0/1'), K.trunk('S1', 'Fa0/1'), K.access('S1', 'Fa0/2', 1)),
        cmds: ['interface g0/1', 'switchport mode trunk', 'interface fa0/1', 'switchport mode trunk', 'interface fa0/2', 'switchport mode access'] },
      { part: 'WLC basics', text: 'In the WLC GUI, check <b>Monitor > Access Points</b>: AP1 has joined the controller.', self: true },
      { part: 'WPA2-PSK WLAN', text: 'Create WLAN <b>Wireless_LAN</b> (SSID Wireless_LAN), enable it on the management interface, and set Security > Layer 2 to WPA2 with PSK (AES).', self: true },
      { part: 'WPA2-PSK WLAN', text: 'Laptop1 joins Wireless_LAN and gets an address from 192.168.200.0/24.', check: K.dhcpClient('Laptop1', '192.168.200.0', 24, '192.168.200.1') },
      { part: 'WPA2-Enterprise WLAN', text: 'On the WLC: Security > RADIUS > Authentication > New: server 172.16.1.254, shared secret Wlc!Secret1. Controller > Interfaces > New: <b>vlan5</b>, VLAN ID 5, port 1, 192.168.5.254/24, gateway 192.168.5.1, primary DHCP 192.168.5.1.', self: true },
      { part: 'WPA2-Enterprise WLAN', text: 'Create WLAN ID 5, SSID <b>Enterprise</b>, on interface vlan5, Layer 2 security WPA2 with 802.1X (the default), and select the RADIUS server on the AAA Servers tab.', self: true },
      { part: 'WPA2-Enterprise WLAN', text: 'Laptop2 joins Enterprise with WPA2-Enterprise (user1 / User1Pass) and gets an address from 192.168.5.0/24.', check: K.dhcpClient('Laptop2', '192.168.5.0', 24, '192.168.5.1') },
      { part: 'Verify', text: 'From Laptop2, ping the RADIUS server (172.16.1.254).', check: K.ping('Laptop2', '172.16.1.254') },
      { part: 'Concepts', text: 'Which UDP port does RADIUS authentication use?', answer: ['1812', 'udp 1812'] },
      { part: 'Concepts', text: 'Laptop2 cannot connect. Name the first troubleshooting step in the six-step method. (three words)', answer: ['identify the problem', 'identify problem'] },
    ],
    collect: { R1: ['show running-config'], S1: ['show running-config'], Laptop1: ['ipconfig /all'], Laptop2: ['ipconfig /all', 'ping 172.16.1.254'] },
    solution: {
      R1: ['interface g0/0/0', 'ip address 172.16.1.1 255.255.255.0', 'no shutdown', 'interface g0/0/1', 'no shutdown', 'interface g0/0/1.1', 'encapsulation dot1Q 1 native', 'ip address 192.168.200.1 255.255.255.0',
        'interface g0/0/1.5', 'encapsulation dot1Q 5', 'ip address 192.168.5.1 255.255.255.0', 'exit', 'ip dhcp excluded-address 192.168.200.1 192.168.200.9', 'ip dhcp excluded-address 192.168.200.254',
        'ip dhcp excluded-address 192.168.5.1 192.168.5.9', 'ip dhcp excluded-address 192.168.5.254', 'ip dhcp pool WLAN-MGMT', 'network 192.168.200.0 255.255.255.0', 'default-router 192.168.200.1',
        'ip dhcp pool WLAN5', 'network 192.168.5.0 255.255.255.0', 'default-router 192.168.5.1'],
      S1: ['interface g0/1', 'switchport mode trunk', 'interface fa0/1', 'switchport mode trunk', 'interface fa0/2', 'switchport mode access'],
    },
  });

  /* ================================================================ M14 */
  L.push({
    id: 'm14-routing-table', module: 14, topics: ['14.1', '14.3', '14.4', '14.5'], level: 'Guided', minutes: 30,
    title: 'Basic Router Configuration Review and the Routing Table',
    goal: 'Configure R1 the way module 14 reviews it, then read every part of its routing table.',
    scenario: '<p>R2 is configured already and runs OSPF (OSPF configuration itself is beyond the scope of this course; R1\'s OSPF lines are in the starting configuration). Configure R1\'s basic settings and dual-stack interfaces with the link-local addresses from the deck, then interpret the routing table.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 28, y: 10 }, { id: 'R2', type: 'router', model: RT, x: 72, y: 10 },
      { id: 'PC1', type: 'pc', model: PC, x: 14, y: 40, note: '10.0.1.10' }, { id: 'PC2', type: 'pc', model: PC, x: 86, y: 40, note: '10.0.4.10' }],
    links: [['R1', 'G0/0/1', 'R2', 'G0/0/1', 'cross'], ['PC1', 'NIC', 'R1', 'G0/0/0', 'cross'], ['PC2', 'NIC', 'R2', 'G0/0/0', 'cross']],
    addressing: [['R1', 'G0/0/0', '10.0.1.1/24, 2001:db8:acad:1::1/64, fe80::1:a', ''], ['R1', 'G0/0/1', '10.0.3.1/24, 2001:db8:acad:3::1/64, fe80::1:c', ''],
      ['R2', 'G0/0/1', '10.0.3.2/24', ''], ['R2', 'G0/0/0', '10.0.4.1/24', ''], ['PC1', 'NIC', '10.0.1.10/24', '10.0.1.1'], ['PC2', 'NIC', '10.0.4.10/24', '10.0.4.1']],
    start: {
      R1: ['router ospf 1', 'network 10.0.0.0 0.255.255.255 area 0'],
      R2: ['hostname R2', 'interface g0/0/1', 'ip address 10.0.3.2 255.255.255.0', 'no shutdown', 'interface g0/0/0', 'ip address 10.0.4.1 255.255.255.0', 'no shutdown', 'exit', 'router ospf 1', 'network 10.0.0.0 0.255.255.255 area 0'],
    },
    tasks: [
      { part: 'Configure', text: 'Hostname R1, enable secret <code>class</code>, console password <code>cisco</code> with login and <code>logging synchronous</code>.', check: K.all(K.hostname('R1', 'R1'), K.secret('R1'), K.con('R1', 'cisco'), (h) => h.run('R1').con().lines.includes('logging synchronous') || 'logging synchronous is missing on the console line.'),
        cmds: ['hostname R1', 'enable secret class', 'line console 0', 'logging synchronous', 'password cisco', 'login'] },
      { part: 'Configure', text: 'vty 0–4: password <code>cisco</code>, login, and both SSH and Telnet allowed. Encrypt the passwords and add a MOTD banner.', check: K.all(K.vty('R1', 0, 4, 'cisco'), (h) => h.run('R1').vty(0, 4, (l) => PT.lineTransport(l) === 'ssh telnet') || 'vty 0–4 need transport input ssh telnet.', K.encrypt('R1'), K.banner('R1')),
        cmds: ['line vty 0 4', 'password cisco', 'login', 'transport input ssh telnet', 'exit', 'service password-encryption', 'banner motd # WARNING: Unauthorized access is prohibited! #'] },
      { part: 'Configure', text: 'Enable IPv6 routing. G0/0/0: 10.0.1.1/24, 2001:db8:acad:1::1/64, link-local fe80::1:a, description "Link to LAN 1".',
        check: K.all(K.has('R1', /^ipv6 unicast-routing/, 'ipv6 unicast-routing is missing.'), K.ip('R1', 'G0/0/0', '10.0.1.1', 24), K.v6('R1', 'G0/0/0', '2001:db8:acad:1::1'), K.ll('R1', 'G0/0/0', 'fe80::1:a'), K.desc('R1', 'G0/0/0', /lan 1/i), K.noShut('R1', 'G0/0/0')),
        cmds: ['ipv6 unicast-routing', 'interface g0/0/0', 'description Link to LAN 1', 'ip address 10.0.1.1 255.255.255.0', 'ipv6 address 2001:db8:acad:1::1/64', 'ipv6 address fe80::1:a link-local', 'no shutdown'] },
      { part: 'Configure', text: 'G0/0/1: 10.0.3.1/24, 2001:db8:acad:3::1/64, link-local fe80::1:c, description "Link to R2".',
        check: K.all(K.ip('R1', 'G0/0/1', '10.0.3.1', 24), K.v6('R1', 'G0/0/1', '2001:db8:acad:3::1'), K.ll('R1', 'G0/0/1', 'fe80::1:c'), K.desc('R1', 'G0/0/1', /r2/i), K.noShut('R1', 'G0/0/1')),
        cmds: ['interface g0/0/1', 'description Link to R2', 'ip address 10.0.3.1 255.255.255.0', 'ipv6 address 2001:db8:acad:3::1/64', 'ipv6 address fe80::1:c link-local', 'no shutdown'] },
      { part: 'Read the table', text: 'R1 has learned 10.0.4.0/24 from R2 through OSPF.', check: K.inTable('R1', 'O', '10.0.4.0', 24, '10.0.3.2') },
      { part: 'Read the table', text: 'What is the administrative distance of the route to 10.0.4.0/24?', answer: (h) => { const r = h.route('R1').find('10.0.4.0', 24)[0]; return r && r.ad !== null ? [String(r.ad)] : []; } },
      { part: 'Read the table', text: 'What is its metric (the second number in the brackets)?', answer: (h) => { const r = h.route('R1').find('10.0.4.0', 24)[0]; return r && r.metric !== null ? [String(r.metric)] : []; } },
      { part: 'Read the table', text: 'Which exit interface does that route use?', answer: (h) => { const r = h.route('R1').find('10.0.4.0', 24)[0]; return r && r.ifc ? [r.ifc, PT.shortIf(r.ifc), PT.shortIf(r.ifc).replace('G', 'Gi'), r.ifc.toLowerCase()] : []; } },
      { part: 'Read the table', text: 'How many directly connected (C) routes are in R1\'s IPv4 table?', answer: (h) => [String(h.route('R1').routes.filter((r) => r.base === 'C').length)] },
      { part: 'Read the table', text: 'A packet for 10.0.4.77 arrives. Which route entry is the longest match? (prefix/length)', answer: ['10.0.4.0/24'] },
      { part: 'Verify', text: 'From PC1, ping PC2.', check: K.ping('PC1', '10.0.4.10') },
    ],
    collect: { R1: ['show running-config', 'show ip route'], PC1: ['ping 10.0.4.10'] },
    solution: { R1: ['hostname R1', 'enable secret class', 'line console 0', 'logging synchronous', 'password cisco', 'login', 'line vty 0 4', 'password cisco', 'login', 'transport input ssh telnet', 'exit',
      'service password-encryption', 'banner motd # WARNING: Unauthorized access is prohibited! #', 'ipv6 unicast-routing', 'interface g0/0/0', 'description Link to LAN 1', 'ip address 10.0.1.1 255.255.255.0',
      'ipv6 address 2001:db8:acad:1::1/64', 'ipv6 address fe80::1:a link-local', 'no shutdown', 'interface g0/0/1', 'description Link to R2', 'ip address 10.0.3.1 255.255.255.0', 'ipv6 address 2001:db8:acad:3::1/64',
      'ipv6 address fe80::1:c link-local', 'no shutdown'] },
  });

  /* ================================================================ M15 */
  const DS = {
    devices: [{ id: 'R1', type: 'router', model: RT3, x: 18, y: 30 }, { id: 'R2', type: 'router', model: RT3, x: 50, y: 8 }, { id: 'R3', type: 'router', model: RT3, x: 82, y: 30 },
      { id: 'PC1', type: 'pc', model: PC, x: 18, y: 60, note: '172.16.3.10' }, { id: 'PC2', type: 'pc', model: PC, x: 50, y: 34, note: '172.16.1.10' }, { id: 'PC3', type: 'pc', model: PC, x: 82, y: 60, note: '192.168.2.10' }],
    links: [['R1', 'G0/0/1', 'R2', 'G0/0/1', 'cross'], ['R2', 'G0/0/2', 'R3', 'G0/0/1', 'cross'], ['PC1', 'NIC', 'R1', 'G0/0/0', 'cross'], ['PC2', 'NIC', 'R2', 'G0/0/0', 'cross'], ['PC3', 'NIC', 'R3', 'G0/0/0', 'cross']],
    addressing: [['R1', 'G0/0/0', '172.16.3.1/24, 2001:db8:acad:3::1/64', ''], ['R1', 'G0/0/1', '172.16.2.1/24, 2001:db8:acad:2::1/64', ''],
      ['R2', 'G0/0/0', '172.16.1.1/24, 2001:db8:acad:1::1/64', ''], ['R2', 'G0/0/1', '172.16.2.2/24, 2001:db8:acad:2::2/64', ''], ['R2', 'G0/0/2', '192.168.1.2/24, 2001:db8:cafe:1::2/64', ''],
      ['R3', 'G0/0/1', '192.168.1.1/24, 2001:db8:cafe:1::1/64', ''], ['R3', 'G0/0/0', '192.168.2.1/24, 2001:db8:cafe:2::1/64', ''],
      ['Link-local', 'all interfaces', 'R1 fe80::1, R2 fe80::2, R3 fe80::3', ''],
      ['PC1', 'NIC', '172.16.3.10/24, 2001:db8:acad:3::10/64', 'R1 G0/0/0'], ['PC2', 'NIC', '172.16.1.10/24, 2001:db8:acad:1::10/64', 'R2 G0/0/0'], ['PC3', 'NIC', '192.168.2.10/24, 2001:db8:cafe:2::10/64', 'R3 G0/0/0']],
    ptNotes: ['The deck draws serial links between the routers. Here they are Gigabit links, so the ISR 4331 (three ports) is used.', 'Give each PC its IPv6 address and gateway statically, using the router\'s global address as the IPv6 gateway.'],
  };
  const dsIf = (ifc, v4, v6, ll) => ['interface ' + ifc, 'ip address ' + v4, 'ipv6 address ' + v6, 'ipv6 address ' + ll + ' link-local', 'no shutdown'];
  const DS_START = {
    R1: ['hostname R1', 'ipv6 unicast-routing'].concat(dsIf('g0/0/0', '172.16.3.1 255.255.255.0', '2001:db8:acad:3::1/64', 'fe80::1'), dsIf('g0/0/1', '172.16.2.1 255.255.255.0', '2001:db8:acad:2::1/64', 'fe80::1')),
    R2: ['hostname R2', 'ipv6 unicast-routing'].concat(dsIf('g0/0/0', '172.16.1.1 255.255.255.0', '2001:db8:acad:1::1/64', 'fe80::2'), dsIf('g0/0/1', '172.16.2.2 255.255.255.0', '2001:db8:acad:2::2/64', 'fe80::2'),
      dsIf('g0/0/2', '192.168.1.2 255.255.255.0', '2001:db8:cafe:1::2/64', 'fe80::2')),
    R3: ['hostname R3', 'ipv6 unicast-routing'].concat(dsIf('g0/0/0', '192.168.2.1 255.255.255.0', '2001:db8:cafe:2::1/64', 'fe80::3'), dsIf('g0/0/1', '192.168.1.1 255.255.255.0', '2001:db8:cafe:1::1/64', 'fe80::3')),
  };
  L.push(Object.assign({
    id: 'm15-static-routes', module: 15, topics: ['15.1', '15.2', '15.3'], level: 'Guided', minutes: 35,
    title: 'IPv4 and IPv6 Static and Default Routes',
    goal: 'Route the deck\'s three-router dual-stack network with next-hop, fully specified and default static routes.',
    scenario: '<p>All interfaces are addressed; no router knows any remote network yet. R1 and R3 are stub routers with one neighbour, so they get default routes. R2 is in the middle and needs specific routes.</p>',
    start: DS_START,
    tasks: [
      { part: 'Before', text: 'From R1, ping the R3 LAN gateway 192.168.2.1. What is the success rate? (percent)', answer: ['0', '0%', '0 percent'] },
      { part: 'R2', text: 'On R2, add IPv4 next-hop static routes to 172.16.3.0/24 (via R1) and 192.168.2.0/24 (via R3).', check: K.all(K.route('R2', '172.16.3.0', '255.255.255.0', '172.16.2.1'), K.route('R2', '192.168.2.0', '255.255.255.0', '192.168.1.1')),
        cmds: ['ip route 172.16.3.0 255.255.255.0 172.16.2.1', 'ip route 192.168.2.0 255.255.255.0 192.168.1.1'] },
      { part: 'R2', text: 'On R2, add an IPv6 next-hop route to 2001:db8:acad:3::/64 via R1\'s global address.', check: K.route6('R2', '2001:db8:acad:3::/64', '2001:db8:acad:2::1'), cmds: ['ipv6 route 2001:db8:acad:3::/64 2001:db8:acad:2::1'] },
      { part: 'R2', text: 'On R2, add a <b>fully specified</b> IPv6 route to 2001:db8:cafe:2::/64 that uses R3\'s link-local address fe80::3 as the next hop.', hint: 'A link-local next hop is only unique per link, so IOS insists on the exit interface: <code>ipv6 route prefix/len exit-intf fe80::3</code>.',
        check: (h) => { const r = h.run('R2').routes6().find((x) => PT.sameV6(x.net, '2001:db8:cafe:2::') && x.len === 64); return (!!r && !!r.ifc && PT.ifKey(r.ifc) === PT.ifKey('G0/0/2') && r.nh && PT.sameV6(r.nh, 'fe80::3')) || 'R2 needs ipv6 route 2001:db8:cafe:2::/64 g0/0/2 fe80::3.'; },
        cmds: ['ipv6 route 2001:db8:cafe:2::/64 g0/0/2 fe80::3'] },
      { part: 'Stub routers', text: 'R1: IPv4 default route to 172.16.2.2 and IPv6 default route to 2001:db8:acad:2::2.', check: K.all(K.route('R1', '0.0.0.0', '0.0.0.0', '172.16.2.2'), K.route6('R1', '::/0', '2001:db8:acad:2::2')),
        cmds: ['ip route 0.0.0.0 0.0.0.0 172.16.2.2', 'ipv6 route ::/0 2001:db8:acad:2::2'] },
      { part: 'Stub routers', text: 'R3: IPv4 default route to 192.168.1.2 and IPv6 default route to 2001:db8:cafe:1::2.', check: K.all(K.route('R3', '0.0.0.0', '0.0.0.0', '192.168.1.2'), K.route6('R3', '::/0', '2001:db8:cafe:1::2')) },
      { part: 'Verify', text: '<code>show ip route</code> on R1: the gateway of last resort is 172.16.2.2 and the default route is marked S*.', check: K.all(K.lastResort('R1', '172.16.2.2'), K.inTable('R1', 'S', '0.0.0.0', 0, '172.16.2.2')) },
      { part: 'Verify', text: '<code>show ipv6 route</code> on R2 lists the static route to 2001:db8:cafe:2::/64 via FE80::3.', check: K.inTable6('R2', 'S', '2001:db8:cafe:2::/64', 'fe80::3') },
      { part: 'Verify', text: 'From PC1, ping PC3 over IPv4 and IPv6.', check: K.all(K.ping('PC1', '192.168.2.10'), K.ping('PC1', '2001:db8:cafe:2::10')) },
      { part: 'Verify', text: 'Run <code>tracert 192.168.2.10</code> on PC1. How many hops does it list?', answer: (h) => [String(h.trace('PC1', '192.168.2.10').hops.length)] },
    ],
    collect: { R1: ['show running-config', 'show ip route'], R2: ['show running-config', 'show ipv6 route'], R3: ['show running-config'], PC1: ['ping 192.168.2.10', 'ping 2001:db8:cafe:2::10', 'tracert 192.168.2.10'] },
    solution: {
      R1: ['ip route 0.0.0.0 0.0.0.0 172.16.2.2', 'ipv6 route ::/0 2001:db8:acad:2::2'],
      R2: ['ip route 172.16.3.0 255.255.255.0 172.16.2.1', 'ip route 192.168.2.0 255.255.255.0 192.168.1.1', 'ipv6 route 2001:db8:acad:3::/64 2001:db8:acad:2::1', 'ipv6 route 2001:db8:cafe:2::/64 g0/0/2 fe80::3'],
      R3: ['ip route 0.0.0.0 0.0.0.0 192.168.1.2', 'ipv6 route ::/0 2001:db8:cafe:1::2'],
    },
  }, DS));

  const FLOAT = JSON.parse(JSON.stringify(DS));
  FLOAT.links.push(['R1', 'G0/0/2', 'R3', 'G0/0/2', 'cross']);
  FLOAT.devices.find((d) => d.id === 'PC2').y = -14; // keep PC2 clear of the new R1–R3 link
  FLOAT.addressing.splice(2, 0, ['R1', 'G0/0/2', '10.10.10.1/30, 2001:db8:feed:10::1/64', ''], ['R3', 'G0/0/2', '10.10.10.2/30, 2001:db8:feed:10::2/64', '']);
  FLOAT.addressing.push(['PC2', 'role', 'the "server" for the host routes', '']);
  const FLOAT_START = {
    R1: DS_START.R1.concat(dsIf('g0/0/2', '10.10.10.1 255.255.255.252', '2001:db8:feed:10::1/64', 'fe80::1'), ['exit', 'ip route 0.0.0.0 0.0.0.0 172.16.2.2', 'ipv6 route ::/0 2001:db8:acad:2::2']),
    R2: DS_START.R2.concat(['exit', 'ip route 172.16.3.0 255.255.255.0 172.16.2.1', 'ip route 192.168.2.0 255.255.255.0 192.168.1.1', 'ipv6 route 2001:db8:acad:3::/64 2001:db8:acad:2::1', 'ipv6 route 2001:db8:cafe:2::/64 2001:db8:cafe:1::1']),
    R3: DS_START.R3.concat(dsIf('g0/0/2', '10.10.10.2 255.255.255.252', '2001:db8:feed:10::2/64', 'fe80::3'), ['exit', 'ip route 0.0.0.0 0.0.0.0 192.168.1.2', 'ipv6 route ::/0 2001:db8:cafe:1::2',
      'ip route 172.16.3.0 255.255.255.0 10.10.10.1', 'ipv6 route 2001:db8:acad:3::/64 2001:db8:feed:10::1']),
  };
  L.push(Object.assign(FLOAT, {
    id: 'm15-floating-host', module: 15, topics: ['15.4', '15.5'], level: 'Practice', minutes: 30,
    title: 'Floating Static Routes and Host Routes',
    goal: 'Add a backup default route that takes over when the link to R2 fails, and host routes to one server.',
    scenario: '<p>The network from the previous lab now has a backup link between R1 and R3. Normal traffic still goes through R2. Add floating default routes on R1 that only appear when the primary route disappears, and host routes that pin traffic for the server PC2.</p>',
    start: FLOAT_START,
    tasks: [
      { part: 'Floating routes', text: 'On R1, add an IPv4 default route via 10.10.10.2 with administrative distance 5, and an IPv6 default route via 2001:db8:feed:10::2 with distance 5.',
        check: K.all(K.route('R1', '0.0.0.0', '0.0.0.0', '10.10.10.2', 5), K.route6('R1', '::/0', '2001:db8:feed:10::2', 5)), cmds: ['ip route 0.0.0.0 0.0.0.0 10.10.10.2 5', 'ipv6 route ::/0 2001:db8:feed:10::2 5'] },
      { part: 'Floating routes', text: 'While the link to R2 is up, is the floating route listed in R1\'s routing table? (yes/no)', answer: ['no', 'n'] },
      { part: 'Host routes', text: 'On R1, add an IPv4 host route to the server 172.16.1.10 via 172.16.2.2.', check: K.route('R1', '172.16.1.10', '255.255.255.255', '172.16.2.2'), cmds: ['ip route 172.16.1.10 255.255.255.255 172.16.2.2'] },
      { part: 'Host routes', text: 'On R1, add an IPv6 host route to 2001:db8:acad:1::10/128 using R2\'s link-local next hop fe80::2 (fully specified).',
        check: (h) => { const r = h.run('R1').routes6().find((x) => PT.sameV6(x.net, '2001:db8:acad:1::10') && x.len === 128); return (!!r && !!r.ifc && r.nh && PT.sameV6(r.nh, 'fe80::2')) || 'R1 needs ipv6 route 2001:db8:acad:1::10/128 g0/0/1 fe80::2.'; },
        cmds: ['ipv6 route 2001:db8:acad:1::10/128 g0/0/1 fe80::2'] },
      { part: 'Host routes', text: 'A packet for 172.16.1.10 matches both the default route and the host route. Which rule makes R1 use the host route? (two words)', answer: ['longest match', 'longest prefix match', 'the longest match', 'longest prefix'] },
      { part: 'Failover', text: 'Simulate a failure: shut down R1 G0/0/1. Now <code>show ip route</code> on R1 shows the default route via 10.10.10.2 with distance 5.',
        check: (h) => { const d = h.route('R1').defaultRoute(); return (!!d && d.via.includes('10.10.10.2') && d.ad === 5) || 'The default route on R1 is ' + (d ? 'via ' + d.via.join(', ') + ' [' + d.ad + ']' : 'missing') + '. Shut G0/0/1 and paste show ip route again.'; } },
      { part: 'Failover', text: 'With G0/0/1 still down, PC1 pings PC3 through the backup link.', check: K.ping('PC1', '192.168.2.10') },
      { part: 'Failover', text: 'Bring R1 G0/0/1 back up. The primary default route (distance 1) returns and the floating route hides again.', self: true },
    ],
    collect: { R1: ['show running-config', 'show ip route'], PC1: ['ping 192.168.2.10'] },
    solution: { R1: ['ip route 0.0.0.0 0.0.0.0 10.10.10.2 5', 'ipv6 route ::/0 2001:db8:feed:10::2 5', 'ip route 172.16.1.10 255.255.255.255 172.16.2.2', 'ipv6 route 2001:db8:acad:1::10/128 g0/0/1 fe80::2', 'interface g0/0/1', 'shutdown'] },
  }));

  /* ================================================================ M16 */
  const BROKEN = JSON.parse(JSON.stringify(DS));
  L.push(Object.assign(BROKEN, {
    id: 'm16-troubleshoot-static', module: 16, topics: ['16.1', '16.2'], level: 'Troubleshoot', minutes: 35,
    title: 'Troubleshoot Static and Default Routes',
    goal: 'Find and fix four routing faults so every PC reaches every other PC over IPv4 and IPv6.',
    scenario: '<p>The static routing of the three-router network is configured, but connectivity is broken. Paste the starting configuration, then follow the deck\'s method: ping hop by hop, read the routing tables with <code>show ip route</code> and <code>show ipv6 route</code>, and correct what is wrong. Remove each wrong route with <code>no</code> before you add the right one.</p>',
    start: {
      R1: DS_START.R1.concat(['exit', 'ip route 0.0.0.0 0.0.0.0 172.16.2.2', 'ipv6 route ::/0 2001:db8:acad:2::3']),
      R2: DS_START.R2.concat(['exit', 'ip route 172.16.3.0 255.255.255.0 192.168.1.1', 'ip route 192.168.2.0 255.255.255.0 192.168.1.1', 'ipv6 route 2001:db8:acad:3::/64 2001:db8:acad:2::1', 'ipv6 route 2001:db8:cafe:20::/64 2001:db8:cafe:1::1']),
      R3: DS_START.R3.concat(['exit', 'ip route 0.0.0.0 0.0.0.0 192.168.1.3', 'ipv6 route ::/0 2001:db8:cafe:1::2']),
    },
    tasks: [
      { part: 'Diagnose', text: 'Ping from PC1 to PC3 (192.168.2.10) fails. On R2, which next hop does the route to 172.16.3.0/24 use?', answer: ['192.168.1.1'] },
      { part: 'Diagnose', text: 'Which next-hop address does R3\'s default route use? (Nothing answers at that address.)', answer: ['192.168.1.3'] },
      { part: 'Diagnose', text: 'R1\'s IPv6 default route points to a wrong next hop. Which one?', answer: ['2001:db8:acad:2::3'] },
      { part: 'Diagnose', text: 'R2 has an IPv6 route with a typo in the prefix. Which prefix does it route?', answer: ['2001:db8:cafe:20::/64', '2001:db8:cafe:20::'] },
      { part: 'Fix', text: 'R2 reaches 172.16.3.0/24 through R1 (172.16.2.1), and the wrong route is gone.', check: K.all(K.route('R2', '172.16.3.0', '255.255.255.0', '172.16.2.1'), (h) => !h.run('R2').routes().some((r) => r.net === '172.16.3.0' && r.nh === '192.168.1.1') || 'The wrong route via 192.168.1.1 is still configured.') },
      { part: 'Fix', text: 'R3\'s default route uses R2 (192.168.1.2).', check: K.all(K.route('R3', '0.0.0.0', '0.0.0.0', '192.168.1.2'), (h) => !h.run('R3').routes().some((r) => r.nh === '192.168.1.3') || 'The default route via 192.168.1.3 is still configured.') },
      { part: 'Fix', text: 'R1\'s IPv6 default route uses 2001:db8:acad:2::2.', check: K.all(K.route6('R1', '::/0', '2001:db8:acad:2::2'), (h) => !h.run('R1').routes6().some((r) => r.nh && PT.sameV6(r.nh, '2001:db8:acad:2::3')) || 'The IPv6 default route via ::3 is still configured.') },
      { part: 'Fix', text: 'R2 routes 2001:db8:cafe:2::/64 (not cafe:20) to R3.', check: K.all(K.route6('R2', '2001:db8:cafe:2::/64', '2001:db8:cafe:1::1'), (h) => !h.run('R2').routes6().some((r) => PT.sameV6(r.net, '2001:db8:cafe:20::')) || 'The route to 2001:db8:cafe:20::/64 is still configured.') },
      { part: 'Verify', text: 'R2\'s routing table shows S 172.16.3.0/24 via 172.16.2.1.', check: K.inTable('R2', 'S', '172.16.3.0', 24, '172.16.2.1') },
      { part: 'Verify', text: 'PC1 reaches PC3 over IPv4 and IPv6, and PC3 reaches PC2.', check: K.all(K.ping('PC1', '192.168.2.10'), K.ping('PC1', '2001:db8:cafe:2::10'), K.ping('PC3', '172.16.1.10')) },
      { part: 'Concepts', text: 'A router has no matching route and no default route. What does it do with the packet, and what does it send back? (drop / ICMP)', answer: ['drop', 'drops it', 'drop and send icmp', 'drops it and sends an icmp message', 'drop, icmp', 'drop icmp', 'it drops it and sends icmp unreachable'] },
    ],
    collect: { R1: ['show running-config'], R2: ['show running-config', 'show ip route'], R3: ['show running-config'], PC1: ['ping 192.168.2.10', 'ping 2001:db8:cafe:2::10'], PC3: ['ping 172.16.1.10'] },
    solution: {
      R1: ['no ipv6 route ::/0 2001:db8:acad:2::3', 'ipv6 route ::/0 2001:db8:acad:2::2'],
      R2: ['no ip route 172.16.3.0 255.255.255.0 192.168.1.1', 'ip route 172.16.3.0 255.255.255.0 172.16.2.1', 'no ipv6 route 2001:db8:cafe:20::/64 2001:db8:cafe:1::1', 'ipv6 route 2001:db8:cafe:2::/64 2001:db8:cafe:1::1'],
      R3: ['no ip route 0.0.0.0 0.0.0.0 192.168.1.3', 'ip route 0.0.0.0 0.0.0.0 192.168.1.2'],
    },
  }));
})(typeof window !== 'undefined' ? window : globalThis);
