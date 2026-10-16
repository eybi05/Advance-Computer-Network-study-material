/* Packet Tracer labs, modules 1–4. Format:
 *   devices: [{ id, type, model, x, y, note }]  (x, y on a 0–100 grid for the diagram)
 *   links:   [deviceA, portA, deviceB, portB, cable]   cable: straight | cross | serial | wireless
 *   start:   commands pasted into a device before the lab (configuration mode)
 *   tasks:   { part, text, hint, cmds, check(h) | answer: [...] | answer(h) | self: true, optional }
 *   collect: what to run on each device and paste back */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const K = SRWE.LabKit;
  const PT = SRWE.PT;
  const L = SRWE.labs = SRWE.labs || [];
  const SW = '2960-24TT', RT = 'ISR4321', PC = 'PC-PT';
  const portNames = (p) => { const c = PT.ifCanon(p); const s = PT.shortIf(c); return [c, s, s.replace(/^Fa/, 'F'), s.replace(/^Fa/, 'fa'), c.replace(/(\D)(\d)/, '$1 $2')]; };

  /* ================================================================ M1 */
  L.push({
    id: 'm1-basic-switch', module: 1, topics: ['1.1'], level: 'Guided', minutes: 30,
    title: 'Basic Switch Configuration',
    goal: 'Secure a new switch and make it manageable from its own subnet and from a remote network.',
    scenario: '<p>S1 is a new Catalyst 2960 with factory settings. Management uses <b>VLAN 99</b>. PC1 is the local admin station. R1 is already configured and connects S1 to a remote admin network where PC2 sits.</p>',
    devices: [
      { id: 'R1', type: 'router', model: RT, x: 50, y: 6 }, { id: 'S1', type: 'switch', model: SW, x: 50, y: 32 },
      { id: 'PC1', type: 'pc', model: PC, x: 20, y: 56, note: '172.17.99.21' }, { id: 'PC2', type: 'pc', model: PC, x: 86, y: 6, note: '192.168.1.10' },
    ],
    links: [['R1', 'G0/0/1', 'S1', 'Fa0/5', 'straight'], ['PC1', 'NIC', 'S1', 'Fa0/18', 'straight'], ['PC2', 'NIC', 'R1', 'G0/0/0', 'cross']],
    addressing: [['S1', 'VLAN 99', '172.17.99.11/24', '172.17.99.1'], ['R1', 'G0/0/1', '172.17.99.1/24', ''], ['R1', 'G0/0/0', '192.168.1.1/24', ''],
      ['PC1', 'NIC', '172.17.99.21/24', '172.17.99.1'], ['PC2', 'NIC', '192.168.1.10/24', '192.168.1.1']],
    ptNotes: ['Set each PC in <b>Desktop > IP Configuration</b> (Static).', 'R1 only needs the starting configuration below.'],
    start: { R1: ['hostname R1', 'interface g0/0/1', 'ip address 172.17.99.1 255.255.255.0', 'no shutdown', 'interface g0/0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown'] },
    tasks: [
      { part: 'Basic settings', text: 'Name the switch <b>S1</b>.', check: K.hostname('S1', 'S1'), cmds: ['enable', 'configure terminal', 'hostname S1'] },
      { part: 'Basic settings', text: 'Stop the switch from trying to resolve mistyped commands as hostnames.', check: K.noLookup('S1'), cmds: ['no ip domain-lookup'] },
      { part: 'Basic settings', text: 'Set the encrypted privileged EXEC password to <code>class</code>.', hint: 'Use <code>secret</code>, not <code>password</code>.', check: K.secret('S1'), cmds: ['enable secret class'] },
      { part: 'Basic settings', text: 'Protect the console with the password <code>cisco</code> and require login.', check: K.con('S1', 'cisco'), cmds: ['line console 0', 'password cisco', 'login', 'exit'] },
      { part: 'Basic settings', text: 'Protect all 16 vty lines with the password <code>cisco</code> and require login.', hint: 'The vty lines are numbered 0 to 15.', check: K.vty('S1', 0, 15, 'cisco'), cmds: ['line vty 0 15', 'password cisco', 'login', 'exit'] },
      { part: 'Basic settings', text: 'Encrypt the plaintext passwords in the configuration.', check: K.encrypt('S1'), cmds: ['service password-encryption'] },
      { part: 'Basic settings', text: 'Add a MOTD banner warning that unauthorized access is prohibited.', hint: 'Pick a delimiter that does not appear in the message, for example #.', check: K.banner('S1', /authori[sz]ed/i), cmds: ['banner motd #Unauthorized access is strictly prohibited.#'] },
      { part: 'Management VLAN', text: 'Create VLAN 99 and name it <b>Management</b>.', check: K.vlan('S1', 99, 'Management'), cmds: ['vlan 99', 'name Management', 'exit'] },
      { part: 'Management VLAN', text: 'Make Fa0/5 (to R1) and Fa0/18 (PC1) access ports in VLAN 99.', hint: '<code>interface range</code> saves typing.', check: K.access('S1', ['Fa0/5', 'Fa0/18'], 99),
        cmds: ['interface range fa0/5, fa0/18', 'switchport mode access', 'switchport access vlan 99', 'exit'] },
      { part: 'Management VLAN', text: 'Give interface VLAN 99 the address 172.17.99.11/24 and make sure it is up/up.', hint: 'An SVI needs <code>no shutdown</code>, an existing VLAN, and at least one active port in that VLAN.',
        check: K.all(K.ip('S1', 'Vlan99', '172.17.99.11', 24), K.up('S1', 'Vlan99')), cmds: ['interface vlan 99', 'ip address 172.17.99.11 255.255.255.0', 'no shutdown', 'exit'] },
      { part: 'Management VLAN', text: 'Configure the default gateway 172.17.99.1 so the switch can answer remote networks.', check: K.gateway('S1', '172.17.99.1'), cmds: ['ip default-gateway 172.17.99.1'] },
      { part: 'Verify and save', text: 'From PC1, ping S1 (172.17.99.11).', check: K.ping('PC1', '172.17.99.11'), cmds: ['C:\\> ping 172.17.99.11'] },
      { part: 'Verify and save', text: 'From PC2 on the remote network, ping S1. This works only because of the default gateway.', check: K.ping('PC2', '172.17.99.11'), cmds: ['C:\\> ping 172.17.99.11'] },
      { part: 'Verify and save', text: 'Save the running configuration to the startup configuration.', check: (h) => { const c = h.start('S1'); return (c.hostname === 'S1' && !!c.intf('vlan99') && !!c.intf('vlan99').ip) || 'The startup-config does not hold your changes yet.'; }, cmds: ['end', 'copy running-config startup-config'] },
    ],
    collect: { S1: ['show running-config', 'show vlan brief', 'show ip interface brief', 'show startup-config'], PC1: ['ping 172.17.99.11'], PC2: ['ping 172.17.99.11'] },
    solution: { S1: ['hostname S1', 'no ip domain-lookup', 'enable secret class', 'line console 0', 'password cisco', 'login', 'line vty 0 15', 'password cisco', 'login', 'exit',
      'service password-encryption', 'banner motd #Unauthorized access is strictly prohibited.#', 'vlan 99', 'name Management', 'exit', 'interface range fa0/5, fa0/18', 'switchport mode access',
      'switchport access vlan 99', 'interface vlan 99', 'ip address 172.17.99.11 255.255.255.0', 'no shutdown', 'exit', 'ip default-gateway 172.17.99.1', 'end', 'copy running-config startup-config'] },
  });

  L.push({
    id: 'm1-switch-ports', module: 1, topics: ['1.2'], level: 'Troubleshoot', minutes: 20,
    title: 'Switch Ports: Duplex, Speed and Status',
    goal: 'Find a duplex mismatch and a disabled port with show commands, then fix both.',
    scenario: '<p>Users report that the link between S1 and S2 is slow and that PC1 has no connection at all. Investigate with <code>show interfaces</code> and <code>show ip interface brief</code> before you change anything. Watch the console: Packet Tracer also reports the mismatch through CDP.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 28, y: 20 }, { id: 'S2', type: 'switch', model: SW, x: 72, y: 20 },
      { id: 'PC1', type: 'pc', model: PC, x: 12, y: 50, note: '192.168.1.10' }, { id: 'PC2', type: 'pc', model: PC, x: 88, y: 50, note: '192.168.1.20' }],
    links: [['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['PC1', 'NIC', '192.168.1.10/24', ''], ['PC2', 'NIC', '192.168.1.20/24', '']],
    start: { S1: ['hostname S1', 'interface fa0/1', 'speed 100', 'duplex full', 'interface fa0/6', 'shutdown'], S2: ['hostname S2'] },
    tasks: [
      { part: 'Investigate', text: 'Before fixing anything, run <code>show interfaces fa0/1</code> on S2. Which duplex does the port run?', hint: 'S1 forces 100/full; S2 is still on auto. A port that autonegotiates against a port that does not falls back to half duplex.', answer: ['half', 'half-duplex', 'half duplex'] },
      { part: 'Investigate', text: 'On S1, run <code>show ip interface brief</code>. What is the status of Fa0/6?', answer: ['administratively down', 'admin down'] },
      { part: 'Fix', text: 'Fix the mismatch the best-practice way for a link between two switches: both ends of the S1–S2 link at 100 Mb/s, full duplex.',
        check: (h) => { for (const s of ['S1', 'S2']) { const i = K.intf(h, s, 'Fa0/1'); if (!i || i.duplex !== 'full' || i.speed !== '100') return 'Fa0/1 on ' + s + ' is speed ' + (i ? i.speed : '?') + ', duplex ' + (i ? i.duplex : '?') + '.'; } return true; },
        cmds: ['S2(config)# interface fa0/1', 'S2(config-if)# speed 100', 'S2(config-if)# duplex full'] },
      { part: 'Fix', text: 'Show that both ends now run <b>Full-duplex, 100Mb/s</b> (<code>show interfaces fa0/1</code> on both switches).',
        check: (h) => { for (const s of ['S1', 'S2']) { const i = h.iface(s, 'Fa0/1'); if (i.duplex !== 'full' || !/^100/.test(i.speed || '')) return s + ' Fa0/1 shows ' + (i.duplex || '?') + '-duplex, ' + (i.speed || '?') + '.'; } return true; } },
      { part: 'Fix', text: 'Describe the uplinks: "Link to S2" on S1 Fa0/1 and "Link to S1" on S2 Fa0/1.', check: K.all(K.desc('S1', 'Fa0/1', /link to s2/i), K.desc('S2', 'Fa0/1', /link to s1/i)), cmds: ['description Link to S2', 'description Link to S1'] },
      { part: 'Fix', text: 'Enable Fa0/6 on S1 so PC1 comes up.', check: K.all(K.noShut('S1', 'Fa0/6'), K.up('S1', 'Fa0/6')), cmds: ['S1(config)# interface fa0/6', 'S1(config-if)# no shutdown'] },
      { part: 'Verify', text: 'From PC1, ping PC2 (192.168.1.20).', check: K.ping('PC1', '192.168.1.20') },
    ],
    collect: { S1: ['show running-config', 'show ip interface brief', 'show interfaces fa0/1'], S2: ['show running-config', 'show interfaces fa0/1'], PC1: ['ping 192.168.1.20'] },
    solution: { S1: ['interface fa0/1', 'description Link to S2', 'interface fa0/6', 'no shutdown'], S2: ['interface fa0/1', 'speed 100', 'duplex full', 'description Link to S1'] },
  });

  L.push({
    id: 'm1-ssh', module: 1, topics: ['1.3'], level: 'Guided', minutes: 25,
    title: 'Configure SSH',
    goal: 'Replace Telnet with SSH version 2 and local user authentication.',
    scenario: '<p>S1 is managed today with Telnet and a shared vty password. The security policy requires SSH version 2, a personal account (<b>admin</b> / <b>ccna</b>) and no Telnet.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 50, y: 16 }, { id: 'PC1', type: 'pc', model: PC, x: 50, y: 48, note: '172.17.99.21' }],
    links: [['PC1', 'NIC', 'S1', 'Fa0/18', 'straight']],
    addressing: [['S1', 'VLAN 99', '172.17.99.11/24', '172.17.99.1'], ['PC1', 'NIC', '172.17.99.21/24', '172.17.99.1']],
    ptNotes: ['On PC1 use <b>Desktop > Command Prompt</b> for <code>telnet</code> and <code>ssh -l admin 172.17.99.11</code>. Type <code>exit</code> to leave a session.'],
    start: { S1: ['hostname S1', 'enable secret class', 'vlan 99', 'name Management', 'interface fa0/18', 'switchport mode access', 'switchport access vlan 99',
      'interface vlan 99', 'ip address 172.17.99.11 255.255.255.0', 'no shutdown', 'exit', 'ip default-gateway 172.17.99.1', 'line vty 0 15', 'password cisco', 'login'] },
    tasks: [
      { part: 'See the problem', text: 'From PC1, Telnet to S1 (172.17.99.11) and log in with the vty password <code>cisco</code>. Everything you type crosses the wire in plaintext.',
        check: (h) => h.remote('PC1', 'telnet', '172.17.99.11').ok || 'The Telnet session did not reach the S1> prompt.', cmds: ['C:\\> telnet 172.17.99.11', 'Password: cisco', 'S1> exit'] },
      { part: 'See the problem', text: 'Which TCP port does Telnet use?', answer: ['23', 'tcp 23', 'port 23', 'tcp/23'] },
      { part: 'Configure SSH', text: 'Run <code>show version</code> on S1 and type the IOS image name shown in parentheses. SSH needs a crypto image: the name contains <b>K9</b>.',
        answer: (h) => { const v = h.version('S1'); return v.image ? [v.image] : []; } },
      { part: 'Configure SSH', text: 'Set the IP domain name to <code>cisco.com</code>.', check: K.has('S1', /^ip domain[- ]name cisco\.com$/i, 'ip domain-name cisco.com is missing.'), cmds: ['configure terminal', 'ip domain-name cisco.com'] },
      { part: 'Configure SSH', text: 'Generate an RSA key pair of at least 1024 bits. <code>show ip ssh</code> then reports SSH as enabled.', check: (h) => h.ssh('S1').enabled || 'show ip ssh still says SSH Disabled: no RSA keys yet.', cmds: ['crypto key generate rsa general-keys modulus 1024'] },
      { part: 'Configure SSH', text: 'Create the local user <b>admin</b> with the secret <code>ccna</code>.', check: K.user('S1', 'admin'), cmds: ['username admin secret ccna'] },
      { part: 'Configure SSH', text: 'On all vty lines, allow only SSH and authenticate against the local user database.', check: K.vtySsh('S1', 0, 15), cmds: ['line vty 0 15', 'transport input ssh', 'login local', 'exit'] },
      { part: 'Configure SSH', text: 'Allow only SSH version 2.', check: K.all(K.has('S1', /^ip ssh version 2/, 'ip ssh version 2 is missing.'), (h) => /^2/.test(h.ssh('S1').version || '') || 'show ip ssh reports version ' + h.ssh('S1').version + '.'), cmds: ['ip ssh version 2'] },
      { part: 'Verify', text: 'Telnet from PC1 must now be refused.', check: (h) => { h.remote('PC1', 'telnet', '172.17.99.11'); return h.ev('PC1').remote.some((r) => r.proto === 'telnet' && r.refused) || 'Paste a Telnet attempt made after the change; it should end with "Connection refused".'; }, cmds: ['C:\\> telnet 172.17.99.11'] },
      { part: 'Verify', text: 'From PC1, log in with <code>ssh -l admin 172.17.99.11</code> (password <code>ccna</code>).', check: (h) => h.remote('PC1', 'ssh', '172.17.99.11', 'admin').ok || 'The SSH session did not reach the S1> prompt.', cmds: ['C:\\> ssh -l admin 172.17.99.11', 'Password: ccna'] },
    ],
    collect: { S1: ['show running-config', 'show ip ssh', 'show version'], PC1: ['telnet 172.17.99.11', 'ssh -l admin 172.17.99.11'] },
    solution: { S1: ['ip domain-name cisco.com', 'crypto key generate rsa general-keys modulus 1024', 'username admin secret ccna', 'line vty 0 15', 'transport input ssh', 'login local', 'exit', 'ip ssh version 2'] },
  });

  L.push({
    id: 'm1-router-basic', module: 1, topics: ['1.4', '1.5'], level: 'Guided', minutes: 30,
    title: 'Basic Router Settings and Dual-Stack Interfaces',
    goal: 'Secure R1 and route IPv4 and IPv6 between two LANs.',
    scenario: '<p>R1 is a new ISR 4321 between LAN 1 (S1) and LAN 2 (S2). Configure the basic security settings, the dual-stack interfaces and a loopback that stands in for the internet.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 6 }, { id: 'S1', type: 'switch', model: SW, x: 25, y: 30 }, { id: 'S2', type: 'switch', model: SW, x: 75, y: 30 },
      { id: 'PC1', type: 'pc', model: PC, x: 10, y: 54, note: '192.168.10.10' }, { id: 'PC2', type: 'pc', model: PC, x: 90, y: 54, note: '192.168.11.10' }],
    links: [['R1', 'G0/0/0', 'S1', 'Fa0/5', 'straight'], ['R1', 'G0/0/1', 'S2', 'Fa0/5', 'straight'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/0', '192.168.10.1/24, 2001:db8:acad:1::1/64', ''], ['R1', 'G0/0/1', '192.168.11.1/24, 2001:db8:acad:2::1/64', ''], ['R1', 'Lo0', '10.0.0.1/24', ''],
      ['PC1', 'NIC', '192.168.10.10/24, 2001:db8:acad:1::10/64', '192.168.10.1, 2001:db8:acad:1::1'], ['PC2', 'NIC', '192.168.11.10/24, 2001:db8:acad:2::10/64', '192.168.11.1, 2001:db8:acad:2::1']],
    ptNotes: ['On each PC set the IPv4 address in IP Configuration and the IPv6 address under <b>IPv6 Configuration: Static</b>.'],
    start: { S1: ['hostname S1'], S2: ['hostname S2'] },
    tasks: [
      { part: 'Basic settings', text: 'Name the router <b>R1</b> and disable DNS lookup.', check: K.all(K.hostname('R1', 'R1'), K.noLookup('R1')), cmds: ['hostname R1', 'no ip domain lookup'] },
      { part: 'Basic settings', text: 'Set the enable secret <code>class</code>, the console password <code>cisco</code> with login, and vty 0–4 password <code>cisco</code> with login.',
        check: K.all(K.secret('R1'), K.con('R1', 'cisco'), K.vty('R1', 0, 4, 'cisco')), cmds: ['enable secret class', 'line console 0', 'password cisco', 'login', 'line vty 0 4', 'password cisco', 'login', 'exit'] },
      { part: 'Basic settings', text: 'Encrypt plaintext passwords and add a MOTD banner about unauthorized access.', check: K.all(K.encrypt('R1'), K.banner('R1', /authori[sz]ed/i)), cmds: ['service password-encryption', 'banner motd $ Authorized Access Only! $'] },
      { part: 'Interfaces', text: 'G0/0/0: 192.168.10.1/24 and 2001:db8:acad:1::1/64, a description, and up/up.', hint: 'Router interfaces are shut down by default.',
        check: K.all(K.ip('R1', 'G0/0/0', '192.168.10.1', 24), K.v6('R1', 'G0/0/0', '2001:db8:acad:1::1'), K.desc('R1', 'G0/0/0'), K.up('R1', 'G0/0/0')),
        cmds: ['interface g0/0/0', 'description Link to LAN 1', 'ip address 192.168.10.1 255.255.255.0', 'ipv6 address 2001:db8:acad:1::1/64', 'no shutdown'] },
      { part: 'Interfaces', text: 'G0/0/1: 192.168.11.1/24 and 2001:db8:acad:2::1/64, a description, and up/up.',
        check: K.all(K.ip('R1', 'G0/0/1', '192.168.11.1', 24), K.v6('R1', 'G0/0/1', '2001:db8:acad:2::1'), K.desc('R1', 'G0/0/1'), K.up('R1', 'G0/0/1')),
        cmds: ['interface g0/0/1', 'description Link to LAN 2', 'ip address 192.168.11.1 255.255.255.0', 'ipv6 address 2001:db8:acad:2::1/64', 'no shutdown'] },
      { part: 'Interfaces', text: 'Let R1 route IPv6 between the LANs.', check: K.has('R1', /^ipv6 unicast-routing/, 'ipv6 unicast-routing is missing: R1 does not forward IPv6.'), cmds: ['ipv6 unicast-routing'] },
      { part: 'Interfaces', text: 'Create Loopback 0 with 10.0.0.1/24 to simulate the internet.', check: K.ip('R1', 'Lo0', '10.0.0.1', 24), cmds: ['interface loopback 0', 'ip address 10.0.0.1 255.255.255.0'] },
      { part: 'Verify', text: 'From PC1, ping PC2 over IPv4 (192.168.11.10) and over IPv6 (2001:db8:acad:2::10).', check: K.all(K.ping('PC1', '192.168.11.10'), K.ping('PC1', '2001:db8:acad:2::10')) },
      { part: 'Verify', text: 'From PC1, ping the loopback (10.0.0.1).', check: K.ping('PC1', '10.0.0.1') },
      { part: 'Verify', text: 'In <code>show ip route</code> on R1, how many <b>L</b> (local) routes are there?', answer: (h) => [String(h.route('R1').routes.filter((r) => r.base === 'L').length)] },
      { part: 'Verify', text: 'Which output filter shows only the lines that contain "up" in <code>show ip interface brief</code>? Type the full command.', answer: ['show ip interface brief | include up', 'sh ip int br | i up', 'show ip int brief | include up', 'sh ip int br | include up', 'show ip interface brief | i up'] },
    ],
    collect: { R1: ['show running-config', 'show ip interface brief', 'show ip route'], PC1: ['ping 192.168.11.10', 'ping 2001:db8:acad:2::10', 'ping 10.0.0.1'] },
    solution: { R1: ['hostname R1', 'no ip domain lookup', 'enable secret class', 'line console 0', 'password cisco', 'login', 'line vty 0 4', 'password cisco', 'login', 'exit', 'service password-encryption',
      'banner motd $ Authorized Access Only! $', 'ipv6 unicast-routing', 'interface g0/0/0', 'description Link to LAN 1', 'ip address 192.168.10.1 255.255.255.0', 'ipv6 address 2001:db8:acad:1::1/64', 'no shutdown',
      'interface g0/0/1', 'description Link to LAN 2', 'ip address 192.168.11.1 255.255.255.0', 'ipv6 address 2001:db8:acad:2::1/64', 'no shutdown', 'interface loopback 0', 'ip address 10.0.0.1 255.255.255.0'] },
  });

  /* ================================================================ M2 */
  L.push({
    id: 'm2-mac-table', module: 2, topics: ['2.1', '2.2'], level: 'Practice', minutes: 15,
    title: 'Watch a Switch Learn MAC Addresses',
    goal: 'Generate traffic and read the MAC address tables of two switches.',
    scenario: '<p>Three PCs share one LAN across two switches. Clear the tables, send pings, and work out from the output where each switch learned each address. Your answers are checked against your own Packet Tracer output, so the MAC addresses will be the ones in your network.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 30, y: 20 }, { id: 'S2', type: 'switch', model: SW, x: 72, y: 20 },
      { id: 'PC1', type: 'pc', model: PC, x: 12, y: 50, note: '192.168.1.10' }, { id: 'PC2', type: 'pc', model: PC, x: 40, y: 54, note: '192.168.1.20' }, { id: 'PC3', type: 'pc', model: PC, x: 86, y: 50, note: '192.168.1.30' }],
    links: [['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight'], ['PC3', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['PC1', 'NIC', '192.168.1.10/24', ''], ['PC2', 'NIC', '192.168.1.20/24', ''], ['PC3', 'NIC', '192.168.1.30/24', '']],
    start: { S1: ['hostname S1'], S2: ['hostname S2'] },
    tasks: [
      { part: 'Generate traffic', text: 'On both switches run <code>clear mac address-table dynamic</code>. Then from PC1 ping PC2 and PC3.', check: K.all(K.ping('PC1', '192.168.1.20'), K.ping('PC1', '192.168.1.30')), cmds: ['S1# clear mac address-table dynamic', 'C:\\> ping 192.168.1.20', 'C:\\> ping 192.168.1.30'] },
      { part: 'Read the tables', text: 'On which S1 port did S1 learn PC1\'s MAC address? (Find PC1\'s MAC with <code>ipconfig /all</code>.)', answer: (h) => { const p = h.mac('S1').portOf(h.ipcfg('PC1').mac); return p ? portNames(p) : []; } },
      { part: 'Read the tables', text: 'On which S1 port did S1 learn PC3\'s MAC address?', hint: 'PC3 is on the other switch.', answer: (h) => { const p = h.mac('S1').portOf(h.ipcfg('PC3').mac); return p ? portNames(p) : []; } },
      { part: 'Read the tables', text: 'How many MAC addresses has S1 learned on Fa0/1?', answer: (h) => [String(h.mac('S1').list.filter((e) => PT.ifKey(e.port) === 'fastethernet0/1').length)] },
      { part: 'Read the tables', text: 'On which S2 port did S2 learn PC1\'s MAC address?', answer: (h) => { const p = h.mac('S2').portOf(h.ipcfg('PC1').mac); return p ? portNames(p) : []; } },
      { part: 'Concepts', text: 'After how many seconds does a dynamic entry age out by default?', answer: ['300', '300 seconds', '300s', '5 minutes'] },
      { part: 'Concepts', text: 'PC2 sends a frame to a MAC address that is in no table. What does S1 do with it? (one word)', answer: ['flood', 'floods', 'flooding', 'flood it'] },
    ],
    collect: { S1: ['show mac address-table'], S2: ['show mac address-table'], PC1: ['ipconfig /all', 'ping 192.168.1.20', 'ping 192.168.1.30'], PC3: ['ipconfig /all'] },
    solution: { S1: ['#', 'S1# clear mac address-table dynamic', 'S1# show mac address-table'], S2: ['#', 'S2# clear mac address-table dynamic', 'S2# show mac address-table'] },
  });

  /* ================================================================ M3 */
  const VLANS = ['vlan 10', 'name Faculty', 'vlan 20', 'name Student', 'vlan 99', 'name Management', 'exit'];
  L.push({
    id: 'm3-vlans', module: 3, topics: ['3.1', '3.2', '3.3'], level: 'Guided', minutes: 25,
    title: 'Create VLANs and Assign Ports',
    goal: 'Split one switch into VLANs and prove that VLANs separate broadcast domains.',
    scenario: '<p>All four PCs use the <b>same subnet</b>, 192.168.1.0/24. Without VLANs they can all reach each other. After this lab, only PCs in the same VLAN can. An old VLAN 30 is still on the switch and must go. Fa0/18 also has an IP phone that needs a voice VLAN.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 50, y: 14 },
      { id: 'PC1', type: 'pc', model: PC, x: 14, y: 46, note: 'VLAN 10' }, { id: 'PC2', type: 'pc', model: PC, x: 38, y: 50, note: 'VLAN 10' },
      { id: 'PC3', type: 'pc', model: PC, x: 62, y: 50, note: 'VLAN 20' }, { id: 'PC4', type: 'pc', model: PC, x: 86, y: 46, note: 'VLAN 20' }],
    links: [['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/11', 'straight'], ['PC3', 'NIC', 'S1', 'Fa0/18', 'straight'], ['PC4', 'NIC', 'S1', 'Fa0/24', 'straight']],
    addressing: [['PC1', 'NIC', '192.168.1.11/24', ''], ['PC2', 'NIC', '192.168.1.12/24', ''], ['PC3', 'NIC', '192.168.1.13/24', ''], ['PC4', 'NIC', '192.168.1.14/24', '']],
    start: { S1: ['hostname S1', 'vlan 30', 'name Old', 'exit', 'interface fa0/24', 'switchport mode access', 'switchport access vlan 30'] },
    tasks: [
      { part: 'Before', text: 'Before you change anything, ping PC3 (192.168.1.13) from PC1. Does it work? (yes/no)', answer: ['yes', 'y'] },
      { part: 'Create VLANs', text: 'Create VLAN 10 <b>Faculty</b>, VLAN 20 <b>Student</b> and VLAN 99 <b>Management</b>.', check: K.all(K.vlan('S1', 10, 'Faculty'), K.vlan('S1', 20, 'Student'), K.vlan('S1', 99, 'Management')), cmds: VLANS },
      { part: 'Create VLANs', text: 'Create VLAN 150 named <b>VOICE</b>.', check: K.vlan('S1', 150, 'VOICE'), cmds: ['vlan 150', 'name VOICE'] },
      { part: 'Assign ports', text: 'Make Fa0/6 and Fa0/11 access ports in VLAN 10.', check: K.access('S1', ['Fa0/6', 'Fa0/11'], 10), cmds: ['interface range fa0/6, fa0/11', 'switchport mode access', 'switchport access vlan 10'] },
      { part: 'Assign ports', text: 'Make Fa0/18 and Fa0/24 access ports in VLAN 20.', check: K.access('S1', ['Fa0/18', 'Fa0/24'], 20), cmds: ['interface range fa0/18, fa0/24', 'switchport mode access', 'switchport access vlan 20'] },
      { part: 'Assign ports', text: 'Add voice VLAN 150 to Fa0/18 for the IP phone.', hint: 'Interface command <code>switchport voice vlan</code>. On a real switch you would also add <code>mls qos trust cos</code>.', check: (h) => { const i = K.intf(h, 'S1', 'Fa0/18'); return (!!i && i.voice === 150) || 'Fa0/18 has no voice VLAN 150.'; }, cmds: ['interface fa0/18', 'switchport voice vlan 150'] },
      { part: 'Clean up', text: 'Delete VLAN 30.', hint: 'Move its ports first, or they become inactive.', check: K.noVlan('S1', 30), cmds: ['no vlan 30'] },
      { part: 'Verify', text: '<code>show vlan brief</code> shows Fa0/6 and Fa0/11 in VLAN 10 and Fa0/18 and Fa0/24 in VLAN 20.', check: K.all(K.inVlan('S1', ['Fa0/6', 'Fa0/11'], 10), K.inVlan('S1', ['Fa0/18', 'Fa0/24'], 20)) },
      { part: 'Verify', text: 'From PC1: the ping to PC2 succeeds and the ping to PC3 fails.', check: K.all(K.ping('PC1', '192.168.1.12'), K.noPing('PC1', '192.168.1.13')) },
      { part: 'Verify', text: 'From PC3, ping PC4.', check: K.ping('PC3', '192.168.1.14') },
      { part: 'Concepts', text: 'What is the range of normal VLAN IDs?', answer: ['1-1005', '1 - 1005', '1 to 1005'] },
    ],
    collect: { S1: ['show running-config', 'show vlan brief'], PC1: ['ping 192.168.1.12', 'ping 192.168.1.13'], PC3: ['ping 192.168.1.14'] },
    solution: { S1: VLANS.slice(0, -1).concat(['vlan 150', 'name VOICE', 'exit', 'interface range fa0/6, fa0/11', 'switchport mode access', 'switchport access vlan 10', 'interface range fa0/18, fa0/24', 'switchport mode access',
      'switchport access vlan 20', 'interface fa0/18', 'switchport voice vlan 150', 'exit', 'no vlan 30']) },
  });

  const TRUNK_START = (name, ip) => ['hostname ' + name].concat(VLANS, ['interface fa0/6', 'switchport mode access', 'switchport access vlan 10', 'interface fa0/18', 'switchport mode access', 'switchport access vlan 20',
    'interface vlan 99', 'ip address ' + ip + ' 255.255.255.0', 'no shutdown']);
  L.push({
    id: 'm3-trunks', module: 3, topics: ['3.4', '3.5'], level: 'Guided', minutes: 25,
    title: 'Configure 802.1Q Trunks',
    goal: 'Carry VLANs 10, 20 and 99 between three switches over hardened trunks.',
    scenario: '<p>The VLANs and access ports are already set up on every switch. The links between the switches still use the default DTP mode (dynamic auto on both ends), so no trunk forms. Build static trunks with native VLAN 99 and switch DTP off.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 50, y: 8 }, { id: 'S2', type: 'switch', model: SW, x: 24, y: 32 }, { id: 'S3', type: 'switch', model: SW, x: 76, y: 32 },
      { id: 'PC1', type: 'pc', model: PC, x: 10, y: 58, note: 'VLAN 10' }, { id: 'PC2', type: 'pc', model: PC, x: 36, y: 60, note: 'VLAN 20' },
      { id: 'PC3', type: 'pc', model: PC, x: 64, y: 60, note: 'VLAN 10' }, { id: 'PC4', type: 'pc', model: PC, x: 90, y: 58, note: 'VLAN 20' }],
    links: [['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['S1', 'Fa0/3', 'S3', 'Fa0/3', 'cross'], ['PC1', 'NIC', 'S2', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S2', 'Fa0/18', 'straight'],
      ['PC3', 'NIC', 'S3', 'Fa0/6', 'straight'], ['PC4', 'NIC', 'S3', 'Fa0/18', 'straight']],
    addressing: [['S1', 'VLAN 99', '192.168.99.11/24', ''], ['S2', 'VLAN 99', '192.168.99.12/24', ''], ['S3', 'VLAN 99', '192.168.99.13/24', ''],
      ['PC1', 'NIC', '192.168.10.11/24', ''], ['PC2', 'NIC', '192.168.20.11/24', ''], ['PC3', 'NIC', '192.168.10.12/24', ''], ['PC4', 'NIC', '192.168.20.12/24', '']],
    start: { S1: TRUNK_START('S1', '192.168.99.11'), S2: TRUNK_START('S2', '192.168.99.12'), S3: TRUNK_START('S3', '192.168.99.13') },
    tasks: [
      { part: 'Before', text: 'Both ends of each link are dynamic auto. Does a trunk form? (yes/no)', answer: ['no', 'n'] },
      { part: 'Trunks', text: 'On S1, make Fa0/1 and Fa0/3 static trunks with native VLAN 99 that allow only VLANs 10, 20 and 99.',
        check: K.all(K.trunk('S1', 'Fa0/1', { native: 99, allowed: [10, 20, 99] }), K.trunk('S1', 'Fa0/3', { native: 99, allowed: [10, 20, 99] })),
        cmds: ['interface range fa0/1, fa0/3', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan 10,20,99'] },
      { part: 'Trunks', text: 'Configure the matching trunks on S2 Fa0/1 and S3 Fa0/3.', hint: 'Both ends must agree on the native VLAN, or CDP reports a native VLAN mismatch.',
        check: K.all(K.trunk('S2', 'Fa0/1', { native: 99, allowed: [10, 20, 99] }), K.trunk('S3', 'Fa0/3', { native: 99, allowed: [10, 20, 99] })) },
      { part: 'Trunks', text: 'Switch DTP off on all four trunk ports.', check: K.all(K.trunk('S1', 'Fa0/1', { nonegotiate: true }), K.trunk('S1', 'Fa0/3', { nonegotiate: true }), K.trunk('S2', 'Fa0/1', { nonegotiate: true }), K.trunk('S3', 'Fa0/3', { nonegotiate: true })), cmds: ['switchport nonegotiate'] },
      { part: 'Verify', text: '<code>show interfaces trunk</code> on S1 lists both ports as trunking, native VLAN 99, with VLANs 10, 20 and 99 active.',
        check: K.all(K.trunkUp('S1', 'Fa0/1', { native: 99, active: [10, 20, 99] }), K.trunkUp('S1', 'Fa0/3', { native: 99, active: [10, 20, 99] })) },
      { part: 'Verify', text: 'PC1 pings PC3 (VLAN 10) and PC2 pings PC4 (VLAN 20) across S1.', check: K.all(K.ping('PC1', '192.168.10.12'), K.ping('PC2', '192.168.20.12')) },
      { part: 'Verify', text: 'From PC1, ping PC2. Without a router this must fail.', check: K.noPing('PC1', '192.168.20.11') },
      { part: 'Verify', text: 'From S2, ping S3\'s management address (192.168.99.13).', check: K.ping('S2', '192.168.99.13') },
    ],
    collect: { S1: ['show running-config', 'show interfaces trunk'], S2: ['show running-config', 'ping 192.168.99.13'], S3: ['show running-config'], PC1: ['ping 192.168.10.12', 'ping 192.168.20.11'], PC2: ['ping 192.168.20.12'] },
    solution: {
      S1: ['interface range fa0/1, fa0/3', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan 10,20,99', 'switchport nonegotiate'],
      S2: ['interface fa0/1', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan 10,20,99', 'switchport nonegotiate'],
      S3: ['interface fa0/3', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan 10,20,99', 'switchport nonegotiate'],
    },
  });

  L.push({
    id: 'm3-troubleshoot', module: 3, topics: ['3.3', '3.4', '3.5'], level: 'Troubleshoot', minutes: 25,
    title: 'Troubleshoot VLANs and Trunks',
    goal: 'Find and fix four VLAN and trunk faults using show commands.',
    scenario: '<p>PC1 should reach PC3 (VLAN 10) and PC2 should reach PC4 (VLAN 20). Neither works. Paste the starting configuration, then use <code>show vlan brief</code>, <code>show interfaces trunk</code> and <code>show interfaces switchport</code> to find what is wrong. Do not erase the configuration; fix it.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 30, y: 14 }, { id: 'S2', type: 'switch', model: SW, x: 70, y: 14 },
      { id: 'PC1', type: 'pc', model: PC, x: 12, y: 46, note: 'VLAN 10' }, { id: 'PC2', type: 'pc', model: PC, x: 38, y: 50, note: 'VLAN 20' },
      { id: 'PC3', type: 'pc', model: PC, x: 62, y: 50, note: 'VLAN 10' }, { id: 'PC4', type: 'pc', model: PC, x: 88, y: 46, note: 'VLAN 20' }],
    links: [['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight'], ['PC3', 'NIC', 'S2', 'Fa0/6', 'straight'], ['PC4', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['PC1', 'NIC', '192.168.10.11/24', ''], ['PC2', 'NIC', '192.168.20.11/24', ''], ['PC3', 'NIC', '192.168.10.12/24', ''], ['PC4', 'NIC', '192.168.20.12/24', '']],
    start: {
      S1: ['hostname S1'].concat(VLANS, ['interface fa0/6', 'switchport mode access', 'interface fa0/18', 'switchport mode access', 'switchport access vlan 20',
        'interface fa0/1', 'switchport mode trunk', 'switchport trunk native vlan 99', 'switchport trunk allowed vlan 10,99']),
      S2: ['hostname S2'].concat(VLANS, ['interface fa0/6', 'switchport mode access', 'switchport access vlan 10', 'interface fa0/18', 'switchport mode access', 'switchport access vlan 20',
        'interface fa0/1', 'switchport mode trunk', 'exit', 'no vlan 20']),
    },
    tasks: [
      { part: 'Diagnose', text: 'Which VLAN is S1 Fa0/6 (PC1) in right now?', answer: ['1', 'vlan 1', 'default'] },
      { part: 'Diagnose', text: 'Which VLAN is missing from S2? (number)', answer: ['20', 'vlan 20'] },
      { part: 'Diagnose', text: 'The two ends of the trunk disagree on one setting. Which one? (CDP reports it on the console.)', answer: ['native vlan', 'native', 'the native vlan', 'native vlan mismatch'] },
      { part: 'Diagnose', text: 'Which VLAN does the S1 trunk not allow, although it is needed?', answer: ['20', 'vlan 20'] },
      { part: 'Fix', text: 'Put S1 Fa0/6 in VLAN 10.', check: K.access('S1', 'Fa0/6', 10) },
      { part: 'Fix', text: 'Recreate VLAN 20 (Student) on S2 so Fa0/18 becomes active again.', check: K.all(K.vlan('S2', 20, 'Student'), K.inVlan('S2', 'Fa0/18', 20)) },
      { part: 'Fix', text: 'Make the native VLAN 99 on both ends of the trunk.', check: K.all(K.trunk('S1', 'Fa0/1', { native: 99 }), K.trunk('S2', 'Fa0/1', { native: 99 })) },
      { part: 'Fix', text: 'Allow VLAN 20 on the S1 trunk without retyping the whole list.', hint: '<code>switchport trunk allowed vlan add 20</code> adds to the list. Without <b>add</b> the list is replaced.',
        check: (h) => { const i = K.intf(h, 'S1', 'Fa0/1'); return (!!i && i.allows(10) && i.allows(20) && i.allows(99)) || 'The S1 trunk must allow VLANs 10, 20 and 99.'; } },
      { part: 'Verify', text: 'PC1 pings PC3 and PC2 pings PC4.', check: K.all(K.ping('PC1', '192.168.10.12'), K.ping('PC2', '192.168.20.12')) },
      { part: 'Verify', text: '<code>show interfaces trunk</code> on S2 shows Fa0/1 trunking with native VLAN 99 and VLANs 10 and 20 active.', check: K.trunkUp('S2', 'Fa0/1', { native: 99, active: [10, 20] }) },
    ],
    collect: { S1: ['show running-config', 'show vlan brief', 'show interfaces trunk'], S2: ['show running-config', 'show vlan brief', 'show interfaces trunk'], PC1: ['ping 192.168.10.12'], PC2: ['ping 192.168.20.12'] },
    solution: {
      S1: ['interface fa0/6', 'switchport access vlan 10', 'interface fa0/1', 'switchport trunk allowed vlan add 20'],
      S2: ['vlan 20', 'name Student', 'interface fa0/1', 'switchport trunk native vlan 99'],
    },
  });

  /* ================================================================ M4 */
  const ROAS_SW = (name, ip, acc) => ['hostname ' + name].concat(VLANS, acc, ['interface vlan 99', 'ip address ' + ip + ' 255.255.255.0', 'no shutdown', 'exit', 'ip default-gateway 192.168.99.1']);
  L.push({
    id: 'm4-roas', module: 4, topics: ['4.1', '4.2'], level: 'Guided', minutes: 30,
    title: 'Router-on-a-Stick Inter-VLAN Routing',
    goal: 'Route between VLANs 10, 20 and 99 with subinterfaces on one router port.',
    scenario: '<p>The switches already have their VLANs, access ports and management addresses. S1 and S2 are joined by a trunk. Configure the trunk to R1 and the router subinterfaces so the VLANs can reach each other.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 30, y: 6 }, { id: 'S1', type: 'switch', model: SW, x: 30, y: 30 }, { id: 'S2', type: 'switch', model: SW, x: 72, y: 30 },
      { id: 'PC1', type: 'pc', model: PC, x: 14, y: 56, note: 'VLAN 10' }, { id: 'PC2', type: 'pc', model: PC, x: 86, y: 56, note: 'VLAN 20' }],
    links: [['R1', 'G0/0/1', 'S1', 'Fa0/5', 'straight'], ['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/1.10', '192.168.10.1/24', ''], ['R1', 'G0/0/1.20', '192.168.20.1/24', ''], ['R1', 'G0/0/1.99', '192.168.99.1/24', ''],
      ['S1', 'VLAN 99', '192.168.99.2/24', '192.168.99.1'], ['S2', 'VLAN 99', '192.168.99.3/24', '192.168.99.1'],
      ['PC1', 'NIC', '192.168.10.10/24', '192.168.10.1'], ['PC2', 'NIC', '192.168.20.10/24', '192.168.20.1']],
    start: {
      S1: ROAS_SW('S1', '192.168.99.2', ['interface fa0/6', 'switchport mode access', 'switchport access vlan 10', 'interface fa0/1', 'switchport mode trunk']),
      S2: ROAS_SW('S2', '192.168.99.3', ['interface fa0/18', 'switchport mode access', 'switchport access vlan 20', 'interface fa0/1', 'switchport mode trunk']),
      R1: ['hostname R1'],
    },
    tasks: [
      { part: 'Switch', text: 'Make S1 Fa0/5 (to R1) a static trunk.', check: K.trunk('S1', 'Fa0/5'), cmds: ['interface fa0/5', 'switchport mode trunk'] },
      { part: 'Router', text: 'Create subinterface G0/0/1.10 for VLAN 10 with 192.168.10.1/24.', hint: 'Set the encapsulation before the IP address.',
        check: K.all((h) => { const i = K.intf(h, 'R1', 'G0/0/1.10'); return (!!i && !!i.encap && i.encap.vlan === 10) || 'G0/0/1.10 needs encapsulation dot1Q 10.'; }, K.ip('R1', 'G0/0/1.10', '192.168.10.1', 24)),
        cmds: ['interface g0/0/1.10', 'description Default Gateway for VLAN 10', 'encapsulation dot1Q 10', 'ip address 192.168.10.1 255.255.255.0'] },
      { part: 'Router', text: 'Create G0/0/1.20 for VLAN 20 (192.168.20.1/24) and G0/0/1.99 for VLAN 99 (192.168.99.1/24).',
        check: K.all((h) => { const a = K.intf(h, 'R1', 'G0/0/1.20'), b = K.intf(h, 'R1', 'G0/0/1.99'); return (!!a && !!a.encap && a.encap.vlan === 20 && !!b && !!b.encap && b.encap.vlan === 99) || 'Check the dot1Q VLAN of G0/0/1.20 and G0/0/1.99.'; },
          K.ip('R1', 'G0/0/1.20', '192.168.20.1', 24), K.ip('R1', 'G0/0/1.99', '192.168.99.1', 24)) },
      { part: 'Router', text: 'Enable the physical interface G0/0/1. The subinterfaces then come up with it.', check: K.all(K.noShut('R1', 'G0/0/1'), K.up('R1', 'G0/0/1.10'), K.up('R1', 'G0/0/1.20'), K.up('R1', 'G0/0/1.99')), cmds: ['interface g0/0/1', 'no shutdown'] },
      { part: 'Verify', text: '<code>show ip route</code> on R1 lists the three VLAN networks as directly connected.', check: K.all(K.inTable('R1', 'C', '192.168.10.0', 24), K.inTable('R1', 'C', '192.168.20.0', 24), K.inTable('R1', 'C', '192.168.99.0', 24)) },
      { part: 'Verify', text: 'From PC1, ping PC2 and S2\'s management address (192.168.99.3).', check: K.all(K.ping('PC1', '192.168.20.10'), K.ping('PC1', '192.168.99.3')) },
      { part: 'Verify', text: 'Run <code>tracert 192.168.20.10</code> on PC1. What is the first hop?', answer: (h) => { const t = h.trace('PC1', '192.168.20.10'); return t.hops[0] ? [t.hops[0]] : []; } },
    ],
    collect: { R1: ['show running-config', 'show ip interface brief', 'show ip route'], S1: ['show running-config'], PC1: ['ping 192.168.20.10', 'ping 192.168.99.3', 'tracert 192.168.20.10'] },
    solution: {
      S1: ['interface fa0/5', 'switchport mode trunk'],
      R1: ['interface g0/0/1.10', 'description Default Gateway for VLAN 10', 'encapsulation dot1Q 10', 'ip address 192.168.10.1 255.255.255.0', 'interface g0/0/1.20', 'encapsulation dot1Q 20', 'ip address 192.168.20.1 255.255.255.0',
        'interface g0/0/1.99', 'encapsulation dot1Q 99', 'ip address 192.168.99.1 255.255.255.0', 'interface g0/0/1', 'no shutdown'],
    },
  });

  const ospfCovers = (dev, ip) => (h) => {
    const b = h.run(dev).block(/^router ospf /);
    if (!b) return dev + ' has no router ospf process.';
    const ok = b.lines.some((l) => { const m = /^network (\S+) (\S+) area (\S+)/.exec(l); if (!m) return false; const w = PT.ip.ip2n(m[2]); return ((PT.ip.ip2n(ip) & ~w) >>> 0) === ((PT.ip.ip2n(m[1]) & ~w) >>> 0); });
    return ok || 'No OSPF network statement on ' + dev + ' covers ' + ip + '.';
  };
  L.push({
    id: 'm4-l3switch', module: 4, topics: ['4.3'], level: 'Practice', minutes: 35,
    title: 'Inter-VLAN Routing on a Layer 3 Switch',
    goal: 'Route between VLANs with SVIs and reach a remote server over a routed port and OSPF.',
    scenario: '<p>D1 is a Catalyst 3650. It replaces router-on-a-stick: it routes VLANs 10 and 20 itself with SVIs and connects to R1 over a routed port. R1 is configured already and runs OSPF.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 4 }, { id: 'D1', type: 'l3switch', model: '3650-24PS', x: 50, y: 30, where: 'Add an AC-POWER-SUPPLY in the Physical tab first.' },
      { id: 'Server', type: 'server', model: 'Server-PT', x: 86, y: 4, note: '10.20.20.254' },
      { id: 'PC1', type: 'pc', model: PC, x: 20, y: 56, note: 'VLAN 10' }, { id: 'PC2', type: 'pc', model: PC, x: 80, y: 56, note: 'VLAN 20' }],
    links: [['D1', 'G1/0/1', 'R1', 'G0/0/1', 'straight'], ['Server', 'NIC', 'R1', 'G0/0/0', 'cross'], ['PC1', 'NIC', 'D1', 'G1/0/6', 'straight'], ['PC2', 'NIC', 'D1', 'G1/0/18', 'straight']],
    addressing: [['D1', 'VLAN 10', '192.168.10.1/24', ''], ['D1', 'VLAN 20', '192.168.20.1/24', ''], ['D1', 'G1/0/1', '10.10.10.2/24', ''], ['R1', 'G0/0/1', '10.10.10.1/24', ''], ['R1', 'G0/0/0', '10.20.20.1/24', ''],
      ['Server', 'NIC', '10.20.20.254/24', '10.20.20.1'], ['PC1', 'NIC', '192.168.10.10/24', '192.168.10.1'], ['PC2', 'NIC', '192.168.20.10/24', '192.168.20.1']],
    ptNotes: ['The 3650-24PS ships without a power supply in Packet Tracer. Open D1 > Physical, drag <b>AC-POWER-SUPPLY</b> into the empty bay, then power it on.'],
    start: {
      R1: ['hostname R1', 'interface g0/0/1', 'ip address 10.10.10.1 255.255.255.0', 'no shutdown', 'interface g0/0/0', 'ip address 10.20.20.1 255.255.255.0', 'no shutdown', 'exit',
        'router ospf 10', 'network 10.10.10.0 0.0.0.255 area 0', 'network 10.20.20.0 0.0.0.255 area 0'],
      D1: ['hostname D1'],
    },
    tasks: [
      { part: 'VLANs', text: 'Create VLAN 10 <b>LAN10</b> and VLAN 20 <b>LAN20</b>, and make G1/0/6 an access port in VLAN 10 and G1/0/18 an access port in VLAN 20.',
        check: K.all(K.vlan('D1', 10, 'LAN10'), K.vlan('D1', 20, 'LAN20'), K.access('D1', 'G1/0/6', 10), K.access('D1', 'G1/0/18', 20)),
        cmds: ['vlan 10', 'name LAN10', 'vlan 20', 'name LAN20', 'interface g1/0/6', 'switchport mode access', 'switchport access vlan 10', 'interface g1/0/18', 'switchport mode access', 'switchport access vlan 20'] },
      { part: 'SVIs', text: 'Create SVIs: VLAN 10 = 192.168.10.1/24 and VLAN 20 = 192.168.20.1/24, both up/up.',
        check: K.all(K.ip('D1', 'Vlan10', '192.168.10.1', 24), K.ip('D1', 'Vlan20', '192.168.20.1', 24), K.up('D1', 'Vlan10'), K.up('D1', 'Vlan20')),
        cmds: ['interface vlan 10', 'ip address 192.168.10.1 255.255.255.0', 'no shutdown', 'interface vlan 20', 'ip address 192.168.20.1 255.255.255.0', 'no shutdown'] },
      { part: 'Routing', text: 'Enable IPv4 routing on D1.', check: K.has('D1', /^ip routing$/, 'ip routing is missing: D1 only switches.'), cmds: ['ip routing'] },
      { part: 'Routing', text: 'Make G1/0/1 a routed port with 10.10.10.2/24.', check: K.all((h) => { const i = K.intf(h, 'D1', 'G1/0/1'); return (!!i && i.mode === 'routed') || 'G1/0/1 is still a switch port (no switchport is missing).'; }, K.ip('D1', 'G1/0/1', '10.10.10.2', 24)),
        cmds: ['interface g1/0/1', 'no switchport', 'ip address 10.10.10.2 255.255.255.0'] },
      { part: 'Routing', text: 'Run OSPF process 10 in area 0 on D1 for 192.168.10.0/24, 192.168.20.0/24 and 10.10.10.0/24.',
        check: K.all(ospfCovers('D1', '192.168.10.1'), ospfCovers('D1', '192.168.20.1'), ospfCovers('D1', '10.10.10.2')),
        cmds: ['router ospf 10', 'network 192.168.10.0 0.0.0.255 area 0', 'network 192.168.20.0 0.0.0.255 area 0', 'network 10.10.10.0 0.0.0.255 area 0'] },
      { part: 'Verify', text: 'R1 has learned both VLAN networks through OSPF (code <b>O</b>).', check: K.all(K.inTable('R1', 'O', '192.168.10.0', 24), K.inTable('R1', 'O', '192.168.20.0', 24)) },
      { part: 'Verify', text: 'D1 has learned the server network 10.20.20.0/24 through OSPF.', check: K.inTable('D1', 'O', '10.20.20.0', 24) },
      { part: 'Verify', text: 'From PC1, ping PC2 and the server.', check: K.all(K.ping('PC1', '192.168.20.10'), K.ping('PC1', '10.20.20.254')) },
    ],
    collect: { D1: ['show running-config', 'show vlan brief', 'show ip interface brief', 'show ip route'], R1: ['show ip route'], PC1: ['ping 192.168.20.10', 'ping 10.20.20.254'] },
    solution: { D1: ['vlan 10', 'name LAN10', 'vlan 20', 'name LAN20', 'exit', 'interface g1/0/6', 'switchport mode access', 'switchport access vlan 10', 'interface g1/0/18', 'switchport mode access', 'switchport access vlan 20',
      'interface vlan 10', 'ip address 192.168.10.1 255.255.255.0', 'no shutdown', 'interface vlan 20', 'ip address 192.168.20.1 255.255.255.0', 'no shutdown', 'exit', 'ip routing',
      'interface g1/0/1', 'no switchport', 'ip address 10.10.10.2 255.255.255.0', 'exit', 'router ospf 10', 'network 192.168.10.0 0.0.0.255 area 0', 'network 192.168.20.0 0.0.0.255 area 0', 'network 10.10.10.0 0.0.0.255 area 0'] },
  });

  L.push({
    id: 'm4-troubleshoot', module: 4, topics: ['4.4'], level: 'Troubleshoot', minutes: 30,
    title: 'Troubleshoot Inter-VLAN Routing',
    goal: 'Find and fix five faults that break router-on-a-stick.',
    scenario: '<p>PC1 (VLAN 10) and PC2 (VLAN 20) should reach each other through R1. Paste the starting configuration and set the PCs exactly as the table says (PC2\'s gateway is wrong on purpose). Then troubleshoot from the bottom up: interfaces, trunk, VLAN membership, subinterfaces, host settings.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 6 }, { id: 'S1', type: 'switch', model: SW, x: 50, y: 30 },
      { id: 'PC1', type: 'pc', model: PC, x: 22, y: 56, note: 'VLAN 10' }, { id: 'PC2', type: 'pc', model: PC, x: 78, y: 56, note: 'VLAN 20' }],
    links: [['R1', 'G0/0/1', 'S1', 'Fa0/5', 'straight'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/1.10', '192.168.10.1/24', ''], ['R1', 'G0/0/1.20', '192.168.20.1/24', ''], ['PC1', 'NIC', '192.168.10.10/24', '192.168.10.1'], ['PC2', 'NIC', '192.168.20.10/24', '192.168.20.254 (as found)']],
    start: {
      R1: ['hostname R1', 'interface g0/0/1.10', 'encapsulation dot1Q 10', 'ip address 192.168.10.1 255.255.255.0', 'interface g0/0/1.20', 'encapsulation dot1Q 2', 'ip address 192.168.20.1 255.255.255.0', 'interface g0/0/1', 'shutdown'],
      S1: ['hostname S1', 'vlan 10', 'vlan 20', 'exit', 'interface fa0/5', 'switchport mode access', 'interface fa0/6', 'switchport mode access', 'switchport access vlan 10', 'interface fa0/18', 'switchport mode access', 'switchport access vlan 10'],
    },
    tasks: [
      { part: 'Layer 1–2', text: 'Bring up R1 G0/0/1.', check: K.all(K.noShut('R1', 'G0/0/1'), K.up('R1', 'G0/0/1')) },
      { part: 'Layer 1–2', text: 'The switch port to R1 must carry both VLANs. Fix S1 Fa0/5.', check: K.trunk('S1', 'Fa0/5') },
      { part: 'Layer 1–2', text: 'PC2 must be in VLAN 20. Fix its switch port.', check: K.access('S1', 'Fa0/18', 20) },
      { part: 'Layer 3', text: 'One subinterface tags the wrong VLAN. Which subinterface? (for example G0/0/1.10)', answer: ['g0/0/1.20', 'gigabitethernet0/0/1.20', '.20', 'gig0/0/1.20', 'g0/0/1.20 ', 'gi0/0/1.20'] },
      { part: 'Layer 3', text: 'Fix that subinterface.', hint: 'Changing the encapsulation may remove the IP address of the subinterface. Check it again afterwards.',
        check: K.all((h) => { const i = K.intf(h, 'R1', 'G0/0/1.20'); return (!!i && !!i.encap && i.encap.vlan === 20) || 'G0/0/1.20 does not tag VLAN 20 yet.'; }, K.ip('R1', 'G0/0/1.20', '192.168.20.1', 24)) },
      { part: 'Hosts', text: 'Fix PC2\'s default gateway.', check: K.pcGateway('PC2', '192.168.20.1') },
      { part: 'Verify', text: 'PC1 pings PC2, and PC2 pings its gateway.', check: K.all(K.ping('PC1', '192.168.20.10'), K.ping('PC2', '192.168.20.1')) },
    ],
    collect: { R1: ['show running-config', 'show ip interface brief'], S1: ['show running-config', 'show interfaces trunk', 'show vlan brief'], PC1: ['ping 192.168.20.10'], PC2: ['ipconfig /all', 'ping 192.168.20.1'] },
    solution: {
      R1: ['interface g0/0/1', 'no shutdown', 'interface g0/0/1.20', 'encapsulation dot1Q 20', 'ip address 192.168.20.1 255.255.255.0'],
      S1: ['interface fa0/5', 'switchport mode trunk', 'interface fa0/18', 'switchport access vlan 20'],
      PC2: ['#', 'Desktop > IP Configuration > Default Gateway: 192.168.20.1'],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
