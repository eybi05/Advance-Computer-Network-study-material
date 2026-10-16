/* Packet Tracer labs, modules 5–9 (format: see labs1.js). */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const K = SRWE.LabKit;
  const PT = SRWE.PT;
  const L = SRWE.labs = SRWE.labs || [];
  const SW = '2960-24TT', RT = 'ISR4321', RT3 = 'ISR4331', PC = 'PC-PT';
  const portNames = (p) => { const c = PT.ifCanon(p); const s = PT.shortIf(c); return [c, s, s.replace(/^Fa/, 'F'), s.replace(/^Fa/, 'fa'), c.replace(/(\D)(\d)/, '$1 $2')]; };
  const SWITCHES = ['S1', 'S2', 'S3'];
  /* which pasted switch reports itself as root for a VLAN */
  const rootOf = (h, vlan) => SWITCHES.find((s) => h.stp(s, vlan).isRoot);
  const altOf = (h, vlan) => { for (const s of SWITCHES) { const p = Object.values(h.stp(s, vlan).ports).find((x) => x.role === 'Altn' || x.state === 'BLK'); if (p) return { sw: s, port: p.name }; } return null; };

  /* ================================================================ M5 */
  const TRIANGLE = {
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 50, y: 6 }, { id: 'S2', type: 'switch', model: SW, x: 22, y: 34 }, { id: 'S3', type: 'switch', model: SW, x: 78, y: 34 },
      { id: 'PC1', type: 'pc', model: PC, x: 10, y: 58, note: '192.168.1.10' }, { id: 'PC2', type: 'pc', model: PC, x: 90, y: 58, note: '192.168.1.20' }],
    links: [['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['S1', 'Fa0/2', 'S3', 'Fa0/2', 'cross'], ['S2', 'Fa0/3', 'S3', 'Fa0/3', 'cross'], ['PC1', 'NIC', 'S2', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S3', 'Fa0/6', 'straight']],
    addressing: [['PC1', 'NIC', '192.168.1.10/24', ''], ['PC2', 'NIC', '192.168.1.20/24', '']],
  };
  L.push(Object.assign({
    id: 'm5-stp-observe', module: 5, topics: ['5.1', '5.2'], level: 'Practice', minutes: 20,
    title: 'Investigate STP Loop Prevention',
    goal: 'Read show spanning-tree on three switches and work out the root bridge, root ports and the blocked port.',
    scenario: '<p>Three switches are cabled in a triangle, so there is a physical loop. Do <b>not</b> change any spanning-tree setting: every switch keeps the default priority 32768, and STP elects the root from the MAC addresses in <b>your</b> Packet Tracer. Your answers are checked against your own output.</p>',
    ptNotes: ['Wait about 30 seconds after cabling until all link lights are green or one is amber (blocking).'],
    start: { S1: ['hostname S1'], S2: ['hostname S2'], S3: ['hostname S3'] },
    tasks: [
      { part: 'Root bridge', text: 'Which switch is the root bridge for VLAN 1? (S1, S2 or S3)', hint: 'Only the root bridge says "This bridge is the root".', answer: (h) => { const r = rootOf(h, 1); return r ? [r] : []; } },
      { part: 'Root bridge', text: 'All three switches have the same priority. What decided the election? (two words)', answer: ['lowest mac', 'lowest mac address', 'mac address', 'the lowest mac address', 'lowest mac addresses'] },
      { part: 'Root bridge', text: 'What bridge priority does the root show for VLAN 1? (The number includes the extended system ID.)', answer: (h) => { const r = rootOf(h, 1); return r ? [String(h.stp(r, 1).bridgePriority)] : []; } },
      { part: 'Port roles', text: 'Which switch has the alternate (blocking) port?', answer: (h) => { const a = altOf(h, 1); return a ? [a.sw] : []; } },
      { part: 'Port roles', text: 'Which port on that switch is blocking? (for example Fa0/3)', answer: (h) => { const a = altOf(h, 1); return a ? portNames(a.port) : []; } },
      { part: 'Port roles', text: 'What is the root path cost of the switch with the blocking port?', answer: (h) => { const a = altOf(h, 1); return a ? [String(h.stp(a.sw, 1).rootCost)] : []; } },
      { part: 'Port roles', text: 'Every port on the root bridge has the same role. Which one?', answer: ['designated', 'desg', 'designated port'] },
      { part: 'Recalculate', text: 'Shut down the <b>root port</b> of the switch that has the blocking port. Watch its alternate port go through listening and learning to forwarding (about 30 seconds), then bring the root port back with <code>no shutdown</code>.', self: true },
      { part: 'Recalculate', text: 'With PVST+, how long does a blocked port take to reach forwarding when the change is detected at once? (listening + learning, in seconds)', answer: ['30', '30 seconds', '30s', '30 sec'] },
      { part: 'Verify', text: 'From PC1, ping PC2.', check: K.ping('PC1', '192.168.1.20') },
    ],
    collect: { S1: ['show spanning-tree'], S2: ['show spanning-tree'], S3: ['show spanning-tree'], PC1: ['ping 192.168.1.20'] },
    solution: { S1: ['#', 'S1# show spanning-tree'], S2: ['#', 'S2# show spanning-tree'], S3: ['#', 'S3# show spanning-tree'] },
  }, TRIANGLE));

  L.push(Object.assign({
    id: 'm5-stp-tune', module: 5, topics: ['5.2', '5.3'], level: 'Guided', minutes: 25,
    title: 'Control the Root Bridge, Rapid PVST+ and PortFast',
    goal: 'Choose the root and backup root, switch to Rapid PVST+, and protect the edge ports.',
    scenario: '<p>Leaving the root election to MAC addresses is bad practice. Make S1 the root bridge for VLAN 1 and S2 the backup root, move all switches to Rapid PVST+, and turn on PortFast and BPDU Guard for the PCs.</p>',
    start: { S1: ['hostname S1'], S2: ['hostname S2'], S3: ['hostname S3'] },
    tasks: [
      { part: 'Root bridge', text: 'Make S1 the root bridge for VLAN 1 with the <code>root primary</code> macro.', hint: 'The macro writes a priority of 24576 (or lower) into the configuration.',
        check: K.all((h) => (h.run('S1').stpPriority(1) || 32768) <= 24576 || 'S1 has no lowered priority for VLAN 1.', (h) => h.stp('S1', 1).isRoot || 'show spanning-tree on S1 does not say "This bridge is the root".'), cmds: ['spanning-tree vlan 1 root primary'] },
      { part: 'Root bridge', text: 'Make S2 the backup root for VLAN 1.', check: (h) => h.run('S2').stpPriority(1) === 28672 || 'S2 should have priority 28672 for VLAN 1 (root secondary).', cmds: ['spanning-tree vlan 1 root secondary'] },
      { part: 'Rapid PVST+', text: 'Run Rapid PVST+ on all three switches.', check: K.all(K.has('S1', /^spanning-tree mode rapid-pvst/, 'S1 still runs PVST+.'), K.has('S2', /^spanning-tree mode rapid-pvst/, 'S2 still runs PVST+.'), K.has('S3', /^spanning-tree mode rapid-pvst/, 'S3 still runs PVST+.'), (h) => h.stp('S1', 1).protocol === 'rstp' || 'show spanning-tree on S1 does not say protocol rstp.'), cmds: ['spanning-tree mode rapid-pvst'] },
      { part: 'Edge ports', text: 'Enable PortFast and BPDU Guard on the PC ports (S2 Fa0/6 and S3 Fa0/6).', check: K.all(K.portfast('S2', 'Fa0/6'), K.bpduguard('S2', 'Fa0/6'), K.portfast('S3', 'Fa0/6'), K.bpduguard('S3', 'Fa0/6')),
        cmds: ['interface fa0/6', 'spanning-tree portfast', 'spanning-tree bpduguard enable'] },
      { part: 'Verify', text: 'Which switch now has the alternate port?', hint: 'S1 is the root, and on the S2–S3 link S2 has the lower bridge ID.', answer: (h) => { const a = altOf(h, 1); return a ? [a.sw] : []; } },
      { part: 'Verify', text: 'In Rapid PVST+, what is the port state of that alternate port called? (RSTP has three states.)', answer: ['discarding', 'blk', 'blocking'] },
      { part: 'Verify', text: 'What priority does S1 show in its Bridge ID for VLAN 1?', answer: (h) => [String(h.stp('S1', 1).bridgePriority)] },
      { part: 'Verify', text: 'From PC1, ping PC2.', check: K.ping('PC1', '192.168.1.20') },
    ],
    collect: { S1: ['show running-config', 'show spanning-tree'], S2: ['show running-config', 'show spanning-tree'], S3: ['show running-config', 'show spanning-tree'], PC1: ['ping 192.168.1.20'] },
    solution: {
      S1: ['spanning-tree mode rapid-pvst', 'spanning-tree vlan 1 root primary'],
      S2: ['spanning-tree mode rapid-pvst', 'spanning-tree vlan 1 root secondary', 'interface fa0/6', 'spanning-tree portfast', 'spanning-tree bpduguard enable'],
      S3: ['spanning-tree mode rapid-pvst', 'interface fa0/6', 'spanning-tree portfast', 'spanning-tree bpduguard enable'],
    },
  }, TRIANGLE));

  /* ================================================================ M6 */
  const EC_VLANS = ['vlan 10', 'name Staff', 'vlan 99', 'name Management', 'exit'];
  const ecStart = (name) => ['hostname ' + name].concat(EC_VLANS, name === 'S1' ? [] : ['interface fa0/18', 'switchport mode access', 'switchport access vlan 10']);
  L.push({
    id: 'm6-etherchannel', module: 6, topics: ['6.1', '6.2', '6.3'], level: 'Guided', minutes: 30,
    title: 'Configure LACP and PAgP EtherChannels',
    goal: 'Bundle two links to S2 with LACP and two links to S3 with PAgP, and trunk over the port channels.',
    scenario: '<p>S1 has two cables to S2 and two to S3. Without EtherChannel, STP blocks one link of each pair. Bundle each pair into a port channel so both links carry traffic, then make the port channels trunks for VLANs 10 and 99.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 50, y: 6 }, { id: 'S2', type: 'switch', model: SW, x: 22, y: 34 }, { id: 'S3', type: 'switch', model: SW, x: 78, y: 34 },
      { id: 'PC1', type: 'pc', model: PC, x: 14, y: 58, note: '192.168.10.11' }, { id: 'PC2', type: 'pc', model: PC, x: 86, y: 58, note: '192.168.10.12' }],
    links: [['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['S1', 'Fa0/2', 'S2', 'Fa0/2', 'cross'], ['S1', 'Fa0/3', 'S3', 'Fa0/3', 'cross'], ['S1', 'Fa0/4', 'S3', 'Fa0/4', 'cross'],
      ['PC1', 'NIC', 'S2', 'Fa0/18', 'straight'], ['PC2', 'NIC', 'S3', 'Fa0/18', 'straight']],
    addressing: [['PC1', 'NIC', '192.168.10.11/24', ''], ['PC2', 'NIC', '192.168.10.12/24', '']],
    start: { S1: ecStart('S1'), S2: ecStart('S2'), S3: ecStart('S3') },
    tasks: [
      { part: 'Before', text: 'Before you configure anything, run <code>show spanning-tree</code> on S2. How many of its two links to S1 forward traffic?', answer: ['1', 'one'] },
      { part: 'LACP', text: 'Bundle S1 Fa0/1–2 into channel group 1 with LACP, actively negotiating.', check: K.group('S1', ['Fa0/1', 'Fa0/2'], 1, 'active'), cmds: ['interface range fa0/1 - 2', 'channel-group 1 mode active'] },
      { part: 'LACP', text: 'Bundle S2 Fa0/1–2 into channel group 1 with LACP, in the mode that only answers.', check: K.group('S2', ['Fa0/1', 'Fa0/2'], 1, 'passive'), cmds: ['interface range fa0/1 - 2', 'channel-group 1 mode passive'] },
      { part: 'LACP', text: 'Make Port-channel 1 a trunk with native VLAN 99 on both S1 and S2.', hint: 'Configure the logical interface <code>interface port-channel 1</code>, not the member ports.',
        check: K.all(K.trunk('S1', 'Po1', { native: 99 }), K.trunk('S2', 'Po1', { native: 99 })), cmds: ['interface port-channel 1', 'switchport mode trunk', 'switchport trunk native vlan 99'] },
      { part: 'PAgP', text: 'Bundle S1 Fa0/3–4 into channel group 2 with PAgP, actively negotiating, and S3 Fa0/3–4 in the PAgP mode that only answers.', check: K.all(K.group('S1', ['Fa0/3', 'Fa0/4'], 2, 'desirable'), K.group('S3', ['Fa0/3', 'Fa0/4'], 2, 'auto')),
        cmds: ['S1(config)# interface range fa0/3 - 4', 'S1(config-if-range)# channel-group 2 mode desirable', 'S3(config)# interface range fa0/3 - 4', 'S3(config-if-range)# channel-group 2 mode auto'] },
      { part: 'PAgP', text: 'Make Port-channel 2 a trunk with native VLAN 99 on S1 and S3.', check: K.all(K.trunk('S1', 'Po2', { native: 99 }), K.trunk('S3', 'Po2', { native: 99 })) },
      { part: 'Verify', text: '<code>show etherchannel summary</code> on S1: Po1 is in use (SU) with LACP and both ports bundled (P); Po2 the same with PAgP.', check: K.all(K.bundle('S1', 1, ['Fa0/1', 'Fa0/2'], 'LACP'), K.bundle('S1', 2, ['Fa0/3', 'Fa0/4'], 'PAgP')) },
      { part: 'Verify', text: '<code>show interfaces trunk</code> on S1 lists Po1 and Po2 as trunking with native VLAN 99.', check: K.all(K.trunkUp('S1', 'Po1', { native: 99 }), K.trunkUp('S1', 'Po2', { native: 99 })) },
      { part: 'Verify', text: 'From PC1, ping PC2.', check: K.ping('PC1', '192.168.10.12') },
      { part: 'Concepts', text: 'Two ports are both set to LACP passive. Does a channel form? (yes/no)', answer: ['no', 'n'] },
    ],
    collect: { S1: ['show running-config', 'show etherchannel summary', 'show interfaces trunk'], S2: ['show running-config'], S3: ['show running-config'], PC1: ['ping 192.168.10.12'] },
    solution: {
      S1: ['interface range fa0/1 - 2', 'channel-group 1 mode active', 'interface port-channel 1', 'switchport mode trunk', 'switchport trunk native vlan 99',
        'interface range fa0/3 - 4', 'channel-group 2 mode desirable', 'interface port-channel 2', 'switchport mode trunk', 'switchport trunk native vlan 99'],
      S2: ['interface range fa0/1 - 2', 'channel-group 1 mode passive', 'interface port-channel 1', 'switchport mode trunk', 'switchport trunk native vlan 99'],
      S3: ['interface range fa0/3 - 4', 'channel-group 2 mode auto', 'interface port-channel 2', 'switchport mode trunk', 'switchport trunk native vlan 99'],
    },
  });

  L.push({
    id: 'm6-troubleshoot', module: 6, topics: ['6.3'], level: 'Troubleshoot', minutes: 25,
    title: 'Troubleshoot EtherChannel',
    goal: 'Get a broken port channel between S1 and S2 into use.',
    scenario: '<p>S1 and S2 should be joined by a PAgP EtherChannel trunk on Fa0/1–2, but <code>show etherchannel summary</code> shows Po1 down. Paste the starting configuration, then find and fix every mismatch. The deck\'s advice applies: when you change the channel mode, remove the port channel and re-add the ports.</p>',
    devices: [{ id: 'S1', type: 'switch', model: SW, x: 30, y: 16 }, { id: 'S2', type: 'switch', model: SW, x: 70, y: 16 },
      { id: 'PC1', type: 'pc', model: PC, x: 14, y: 46, note: '192.168.10.11' }, { id: 'PC2', type: 'pc', model: PC, x: 86, y: 46, note: '192.168.10.12' }],
    links: [['S1', 'Fa0/1', 'S2', 'Fa0/1', 'cross'], ['S1', 'Fa0/2', 'S2', 'Fa0/2', 'cross'], ['PC1', 'NIC', 'S1', 'Fa0/18', 'straight'], ['PC2', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['PC1', 'NIC', '192.168.10.11/24', ''], ['PC2', 'NIC', '192.168.10.12/24', '']],
    start: {
      S1: ['hostname S1'].concat(EC_VLANS, ['interface fa0/18', 'switchport mode access', 'switchport access vlan 10', 'interface range fa0/1 - 2', 'switchport mode trunk', 'switchport trunk native vlan 99', 'channel-group 1 mode on']),
      S2: ['hostname S2'].concat(EC_VLANS, ['interface fa0/18', 'switchport mode access', 'switchport access vlan 10', 'interface range fa0/1 - 2', 'switchport mode trunk', 'channel-group 1 mode desirable', 'interface fa0/2', 'switchport trunk allowed vlan 10']),
    },
    tasks: [
      { part: 'Diagnose', text: 'Which channel-group mode does S1 use?', answer: ['on', 'mode on'] },
      { part: 'Diagnose', text: 'Can mode <b>on</b> form a channel with a PAgP <b>desirable</b> port? (yes/no)', answer: ['no', 'n'] },
      { part: 'Diagnose', text: 'Besides the mode, the two ends disagree on a trunk setting. Which one?', answer: ['native vlan', 'native', 'the native vlan'] },
      { part: 'Diagnose', text: 'On S2, one member port is configured differently from the other. Which port?', answer: ['fa0/2', 'f0/2', 'fastethernet0/2', 'fastethernet 0/2'] },
      { part: 'Fix', text: 'Use PAgP on S1: <code>no interface port-channel 1</code>, then put Fa0/1–2 back in group 1 in desirable mode.', check: K.group('S1', ['Fa0/1', 'Fa0/2'], 1, ['desirable', 'auto']) },
      { part: 'Fix', text: 'Make both S2 member ports identical: remove the allowed VLAN list from Fa0/2.', check: (h) => { const a = K.intf(h, 'S2', 'Fa0/1'), b = K.intf(h, 'S2', 'Fa0/2'); return (!!a && !!b && a.allowed === null && b.allowed === null) || 'S2 Fa0/2 still restricts the allowed VLANs.'; } },
      { part: 'Fix', text: 'Use native VLAN 99 on both port channels.', check: K.all(K.trunk('S1', 'Po1', { native: 99 }), K.trunk('S2', 'Po1', { native: 99 })) },
      { part: 'Verify', text: 'Po1 is SU with PAgP and both ports bundled, on both switches.', check: K.all(K.bundle('S1', 1, ['Fa0/1', 'Fa0/2'], 'PAgP'), K.bundle('S2', 1, ['Fa0/1', 'Fa0/2'], 'PAgP')) },
      { part: 'Verify', text: 'From PC1, ping PC2.', check: K.ping('PC1', '192.168.10.12') },
    ],
    collect: { S1: ['show running-config', 'show etherchannel summary'], S2: ['show running-config', 'show etherchannel summary'], PC1: ['ping 192.168.10.12'] },
    solution: {
      S1: ['no interface port-channel 1', 'interface range fa0/1 - 2', 'channel-group 1 mode desirable', 'no shutdown', 'interface port-channel 1', 'switchport mode trunk', 'switchport trunk native vlan 99'],
      S2: ['interface fa0/2', 'no switchport trunk allowed vlan', 'interface port-channel 1', 'switchport mode trunk', 'switchport trunk native vlan 99'],
    },
  });

  /* ================================================================ M7 */
  L.push({
    id: 'm7-dhcpv4', module: 7, topics: ['7.1', '7.2', '7.3'], level: 'Guided', minutes: 35,
    title: 'DHCPv4 Server, Relay and Client',
    goal: 'Serve two LANs from one router, relay DHCP across a second router, and make a router a DHCP client of the ISP.',
    scenario: '<p>R1 is the DHCPv4 server for both LANs. LAN 2 is behind R2, so R2 must relay. The ISP hands R2 its WAN address by DHCP. Routing between R1 and R2 is already set up with static routes.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 24, y: 8 }, { id: 'R2', type: 'router', model: RT3, x: 62, y: 8 }, { id: 'ISP', type: 'router', model: RT, x: 92, y: 8, note: 'ISP' },
      { id: 'S1', type: 'switch', model: SW, x: 24, y: 32 }, { id: 'S2', type: 'switch', model: SW, x: 62, y: 32 },
      { id: 'PC1', type: 'pc', model: PC, x: 10, y: 56, note: 'DHCP' }, { id: 'PC2', type: 'pc', model: PC, x: 38, y: 56, note: 'DHCP' }, { id: 'PC3', type: 'pc', model: PC, x: 62, y: 56, note: 'DHCP' }],
    links: [['R1', 'G0/0/1', 'R2', 'G0/0/1', 'cross'], ['R2', 'G0/0/2', 'ISP', 'G0/0/0', 'cross'], ['R1', 'G0/0/0', 'S1', 'Fa0/5', 'straight'], ['R2', 'G0/0/0', 'S2', 'Fa0/5', 'straight'],
      ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight'], ['PC3', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/0', '192.168.10.1/24', ''], ['R1', 'G0/0/1', '10.1.1.1/30', ''], ['R2', 'G0/0/1', '10.1.1.2/30', ''], ['R2', 'G0/0/0', '192.168.20.1/24', ''],
      ['R2', 'G0/0/2', 'DHCP from the ISP', ''], ['ISP', 'G0/0/0', '209.165.200.225/27', ''], ['PCs', 'NIC', 'DHCP', '']],
    ptNotes: ['Set every PC to <b>DHCP</b> in Desktop > IP Configuration after the servers are configured. Click Static and then DHCP again to request a new lease.'],
    start: {
      R1: ['hostname R1', 'interface g0/0/0', 'ip address 192.168.10.1 255.255.255.0', 'no shutdown', 'interface g0/0/1', 'ip address 10.1.1.1 255.255.255.252', 'no shutdown', 'exit', 'ip route 0.0.0.0 0.0.0.0 10.1.1.2'],
      R2: ['hostname R2', 'interface g0/0/0', 'ip address 192.168.20.1 255.255.255.0', 'no shutdown', 'interface g0/0/1', 'ip address 10.1.1.2 255.255.255.252', 'no shutdown', 'exit', 'ip route 192.168.10.0 255.255.255.0 10.1.1.1'],
      ISP: ['hostname ISP', 'interface g0/0/0', 'ip address 209.165.200.225 255.255.255.224', 'no shutdown', 'exit', 'ip dhcp excluded-address 209.165.200.225 209.165.200.229',
        'ip dhcp pool ISP', 'network 209.165.200.224 255.255.255.224', 'default-router 209.165.200.225'],
      S1: ['hostname S1'], S2: ['hostname S2'],
    },
    tasks: [
      { part: 'DHCP server on R1', text: 'Exclude 192.168.10.1–192.168.10.9 and 192.168.20.1–192.168.20.9 from leasing.', hint: '<code>ip dhcp excluded-address low high</code>, once per range.',
        check: (h) => { const c = h.run('R1'); return (c.isExcluded('192.168.10.1') && c.isExcluded('192.168.10.9') && !c.isExcluded('192.168.10.10') && c.isExcluded('192.168.20.1') && c.isExcluded('192.168.20.9')) || 'The excluded ranges are not 192.168.10.1–.9 and 192.168.20.1–.9.'; },
        cmds: ['ip dhcp excluded-address 192.168.10.1 192.168.10.9', 'ip dhcp excluded-address 192.168.20.1 192.168.20.9'] },
      { part: 'DHCP server on R1', text: 'Create pool <b>LAN-POOL-1</b> for 192.168.10.0/24 with default router 192.168.10.1, DNS server 192.168.11.5 and domain example.com.',
        check: (h) => { const p = h.run('R1').pools().find((x) => x.name === 'LAN-POOL-1'); if (!p) return 'There is no pool named LAN-POOL-1.'; return (p.network === '192.168.10.0' && p.len === 24 && p.gw[0] === '192.168.10.1' && p.dns.includes('192.168.11.5')) || 'LAN-POOL-1 needs network 192.168.10.0 /24, default-router 192.168.10.1 and dns-server 192.168.11.5.'; },
        cmds: ['ip dhcp pool LAN-POOL-1', 'network 192.168.10.0 255.255.255.0', 'default-router 192.168.10.1', 'dns-server 192.168.11.5', 'domain-name example.com'] },
      { part: 'DHCP server on R1', text: 'Create pool <b>LAN-POOL-2</b> for 192.168.20.0/24 with default router 192.168.20.1 and the same DNS server.',
        check: (h) => { const p = h.run('R1').pools().find((x) => x.name === 'LAN-POOL-2'); if (!p) return 'There is no pool named LAN-POOL-2.'; return (p.network === '192.168.20.0' && p.len === 24 && p.gw[0] === '192.168.20.1') || 'LAN-POOL-2 needs network 192.168.20.0 /24 and default-router 192.168.20.1.'; },
        cmds: ['ip dhcp pool LAN-POOL-2', 'network 192.168.20.0 255.255.255.0', 'default-router 192.168.20.1', 'dns-server 192.168.11.5'] },
      { part: 'DHCP server on R1', text: 'PC1 and PC2 get addresses from 192.168.10.0/24 with gateway 192.168.10.1, and none of them comes from the excluded range.',
        check: K.all(K.dhcpClient('PC1', '192.168.10.0', 24, '192.168.10.1'), K.dhcpClient('PC2', '192.168.10.0', 24, '192.168.10.1'), (h) => ['PC1', 'PC2'].every((p) => Number(h.ipcfg(p).ipv4.split('.')[3]) >= 10) || 'A PC got an excluded address.') },
      { part: 'Relay on R2', text: 'PC3 cannot get an address yet. On R2, relay DHCP broadcasts from LAN 2 to R1 (10.1.1.1).', hint: 'Configure it on the interface that receives the broadcasts.',
        check: (h) => { const i = K.intf(h, 'R2', 'G0/0/0'); return (!!i && i.helpers.includes('10.1.1.1')) || 'R2 G0/0/0 has no ip helper-address 10.1.1.1.'; }, cmds: ['interface g0/0/0', 'ip helper-address 10.1.1.1'] },
      { part: 'Relay on R2', text: 'PC3 gets an address from 192.168.20.0/24 with gateway 192.168.20.1.', check: K.dhcpClient('PC3', '192.168.20.0', 24, '192.168.20.1') },
      { part: 'Relay on R2', text: '<code>show ip dhcp binding</code> on R1 lists leases from both pools.', check: (h) => { const b = h.bind('R1'); return (b.inNet('192.168.10.0', 24).length >= 2 && b.inNet('192.168.20.0', 24).length >= 1) || 'R1 does not show leases for both LANs yet.'; } },
      { part: 'Router as client', text: 'Make R2 G0/0/2 a DHCP client of the ISP and enable it.', check: K.all((h) => { const i = K.intf(h, 'R2', 'G0/0/2'); return (!!i && !!i.ip && i.ip.dhcp && !i.shutdown) || 'R2 G0/0/2 needs ip address dhcp and no shutdown.'; },
        (h) => { const r = h.brief('R2').get('G0/0/2'); return (!!r && r.method === 'DHCP' && PT.ip.inNet(r.ip, '209.165.200.224', 27)) || 'show ip interface brief on R2 does not show a DHCP address from 209.165.200.224/27 on G0/0/2.'; }), cmds: ['interface g0/0/2', 'ip address dhcp', 'no shutdown'] },
      { part: 'Verify', text: 'From PC1, ping PC3 (use the address PC3 got). From R2, ping the ISP (209.165.200.225).',
        check: (h) => {
          const ip = h.ipcfg('PC3').ipv4; // PC3's address comes from DHCP, so read it from its ipconfig
          if (!ip) return 'PC3 has no address yet.';
          const p = h.pingTo('PC1', ip);
          if (!p) throw new PT.Need('PC1', 'ping ' + ip);
          if (!p.success) return 'The ping from PC1 to PC3 (' + ip + ') failed.';
          return h.pinged('R2', '209.165.200.225') || 'The ping from R2 to the ISP failed.';
        } },
      { part: 'Concepts', text: 'Which UDP port does a DHCPv4 server listen on?', answer: ['67', 'udp 67', 'port 67'] },
    ],
    collect: { R1: ['show running-config', 'show ip dhcp binding'], R2: ['show running-config', 'show ip interface brief', 'ping 209.165.200.225'], PC1: ['ipconfig /all', 'ping <PC3 address>'], PC2: ['ipconfig /all'], PC3: ['ipconfig /all'] },
    solution: {
      R1: ['ip dhcp excluded-address 192.168.10.1 192.168.10.9', 'ip dhcp excluded-address 192.168.20.1 192.168.20.9', 'ip dhcp pool LAN-POOL-1', 'network 192.168.10.0 255.255.255.0', 'default-router 192.168.10.1',
        'dns-server 192.168.11.5', 'domain-name example.com', 'ip dhcp pool LAN-POOL-2', 'network 192.168.20.0 255.255.255.0', 'default-router 192.168.20.1', 'dns-server 192.168.11.5'],
      R2: ['interface g0/0/0', 'ip helper-address 10.1.1.1', 'interface g0/0/2', 'ip address dhcp', 'no shutdown'],
    },
  });
  /* ================================================================ M8 */
  L.push({
    id: 'm8-dhcpv6', module: 8, topics: ['8.1', '8.2', '8.3', '8.4'], level: 'Guided', minutes: 35,
    title: 'SLAAC, Stateless and Stateful DHCPv6',
    goal: 'Give LAN 1 SLAAC plus stateless DHCPv6 and LAN 2 stateful DHCPv6 from one router.',
    scenario: '<p>R1 connects two IPv6 LANs. Hosts on LAN 1 build their own address with SLAAC and get the DNS server from a stateless DHCPv6 server. Hosts on LAN 2 get everything from a stateful DHCPv6 server. You control this with the A, O and M flags in R1\'s Router Advertisements.</p>',
    devices: [{ id: 'R1', type: 'router', model: RT, x: 50, y: 6 }, { id: 'S1', type: 'switch', model: SW, x: 25, y: 30 }, { id: 'S2', type: 'switch', model: SW, x: 75, y: 30 },
      { id: 'PC1', type: 'pc', model: PC, x: 12, y: 56, note: 'LAN 1' }, { id: 'PC2', type: 'pc', model: PC, x: 38, y: 56, note: 'LAN 1' }, { id: 'PC3', type: 'pc', model: PC, x: 75, y: 56, note: 'LAN 2' }],
    links: [['R1', 'G0/0/0', 'S1', 'Fa0/5', 'straight'], ['R1', 'G0/0/1', 'S2', 'Fa0/5', 'straight'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight'], ['PC3', 'NIC', 'S2', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/0', '2001:db8:acad:1::1/64, fe80::1', ''], ['R1', 'G0/0/1', '2001:db8:acad:2::1/64, fe80::1', ''], ['PCs', 'NIC', 'IPv6 Automatic', 'fe80::1 (learned)']],
    ptNotes: ['On each PC open <b>Desktop > IP Configuration</b> and set <b>IPv6 Configuration</b> to <b>Automatic</b> (older versions: Auto Config). After you change R1, switch to Static and back to Automatic so the PC asks again.'],
    start: { R1: ['hostname R1'], S1: ['hostname S1'], S2: ['hostname S2'] },
    tasks: [
      { part: 'Router', text: 'Enable IPv6 routing so R1 joins ff02::2 and sends Router Advertisements.', check: K.has('R1', /^ipv6 unicast-routing/, 'ipv6 unicast-routing is missing.'), cmds: ['ipv6 unicast-routing'] },
      { part: 'Router', text: 'G0/0/0: 2001:db8:acad:1::1/64 and link-local fe80::1. G0/0/1: 2001:db8:acad:2::1/64 and link-local fe80::1. Both up.',
        check: K.all(K.v6('R1', 'G0/0/0', '2001:db8:acad:1::1'), K.ll('R1', 'G0/0/0', 'fe80::1'), K.v6('R1', 'G0/0/1', '2001:db8:acad:2::1'), K.ll('R1', 'G0/0/1', 'fe80::1'), K.noShut('R1', 'G0/0/0'), K.noShut('R1', 'G0/0/1')),
        cmds: ['interface g0/0/0', 'ipv6 address 2001:db8:acad:1::1/64', 'ipv6 address fe80::1 link-local', 'no shutdown', 'interface g0/0/1', 'ipv6 address 2001:db8:acad:2::1/64', 'ipv6 address fe80::1 link-local', 'no shutdown'] },
      { part: 'SLAAC', text: 'With the default flags (A=1, O=0, M=0), PC1 builds a global address in 2001:db8:acad:1::/64 and uses fe80::1 as its gateway.',
        check: (h) => { const c = h.ipcfg('PC1'); if (!c.ipv6.some((a) => /^2001:db8:acad:1:/.test(a))) return 'PC1 has no IPv6 address in 2001:db8:acad:1::/64.'; return (c.gw6 && PT.sameV6(c.gw6, 'fe80::1')) || 'PC1 gateway is ' + (c.gw6 || 'missing') + ', expected fe80::1.'; } },
      { part: 'Stateless DHCPv6', text: 'Create pool <b>IPV6-STATELESS</b> with DNS server 2001:db8:acad:1::254 and domain stateless.com.',
        check: (h) => { const p = h.run('R1').pools6().find((x) => x.name === 'IPV6-STATELESS'); return (!!p && p.dns.some((d) => PT.sameV6(d, '2001:db8:acad:1::254'))) || 'Pool IPV6-STATELESS with dns-server 2001:db8:acad:1::254 is missing.'; },
        cmds: ['ipv6 dhcp pool IPV6-STATELESS', 'dns-server 2001:db8:acad:1::254', 'domain-name stateless.com'] },
      { part: 'Stateless DHCPv6', text: 'On G0/0/0, bind the pool and set the O flag so hosts ask DHCPv6 for the other settings.',
        check: (h) => { const i = K.intf(h, 'R1', 'G0/0/0'); return (!!i && i.has(/^ipv6 dhcp server IPV6-STATELESS/) && i.has(/^ipv6 nd other-config-flag/)) || 'G0/0/0 needs ipv6 dhcp server IPV6-STATELESS and ipv6 nd other-config-flag.'; },
        cmds: ['interface g0/0/0', 'ipv6 dhcp server IPV6-STATELESS', 'ipv6 nd other-config-flag'] },
      { part: 'Stateless DHCPv6', text: 'PC1 (<code>ipconfig /all</code>) now also lists the DNS server 2001:db8:acad:1::254.', check: (h) => h.ipcfg('PC1').dns6.some((d) => PT.sameV6(d, '2001:db8:acad:1::254')) || 'PC1 shows no IPv6 DNS server 2001:db8:acad:1::254 yet.' },
      { part: 'Stateful DHCPv6', text: 'Create pool <b>IPV6-STATEFUL</b> with address prefix 2001:db8:acad:2::/64, DNS server 2001:db8:acad:2::254 and domain stateful.com.',
        check: (h) => { const p = h.run('R1').pools6().find((x) => x.name === 'IPV6-STATEFUL'); return (!!p && p.prefix && /^2001:db8:acad:2::\/64$/i.test(p.prefix.replace(/:0:0:0:0\//, '::/'))) || 'Pool IPV6-STATEFUL needs address prefix 2001:db8:acad:2::/64.'; },
        cmds: ['ipv6 dhcp pool IPV6-STATEFUL', 'address prefix 2001:db8:acad:2::/64', 'dns-server 2001:db8:acad:2::254', 'domain-name stateful.com'] },
      { part: 'Stateful DHCPv6', text: 'On G0/0/1, bind the pool and set the M flag. Optionally clear the A flag with <code>ipv6 nd prefix default no-autoconfig</code>.',
        check: (h) => { const i = K.intf(h, 'R1', 'G0/0/1'); return (!!i && i.has(/^ipv6 dhcp server IPV6-STATEFUL/) && i.has(/^ipv6 nd managed-config-flag/)) || 'G0/0/1 needs ipv6 dhcp server IPV6-STATEFUL and ipv6 nd managed-config-flag.'; },
        cmds: ['interface g0/0/1', 'ipv6 dhcp server IPV6-STATEFUL', 'ipv6 nd managed-config-flag', 'ipv6 nd prefix default no-autoconfig'] },
      { part: 'Stateful DHCPv6', text: 'PC3 has an address from 2001:db8:acad:2::/64 and DNS server 2001:db8:acad:2::254, and <code>show ipv6 dhcp pool</code> counts at least one active client in IPV6-STATEFUL.',
        check: K.all((h) => h.ipcfg('PC3').ipv6.some((a) => /^2001:db8:acad:2:/.test(a)) || 'PC3 has no address from 2001:db8:acad:2::/64.', (h) => h.ipcfg('PC3').dns6.some((d) => PT.sameV6(d, '2001:db8:acad:2::254')) || 'PC3 has no DNS server 2001:db8:acad:2::254.',
          (h) => { const p = h.pool6('R1').pools.find((x) => x.name === 'IPV6-STATEFUL'); return (!!p && p.active >= 1) || 'IPV6-STATEFUL shows no active clients.'; }) },
      { part: 'Verify', text: 'From PC1, ping PC3\'s IPv6 address.', check: (h) => { const a = h.ipcfg('PC3').ipv6[0]; if (!a) return 'PC3 has no IPv6 address yet.'; const p = h.pingTo('PC1', a); if (!p) throw new PT.Need('PC1', 'ping ' + a); return p.success || 'The ping from PC1 to PC3 failed.'; } },
      { part: 'Concepts', text: 'Which RA flag tells hosts to get their address from a stateful DHCPv6 server? (one letter)', answer: ['m', 'm flag'] },
    ],
    collect: { R1: ['show running-config', 'show ipv6 dhcp pool'], PC1: ['ipconfig /all', 'ping <PC3 IPv6 address>'], PC3: ['ipconfig /all'] },
    solution: { R1: ['ipv6 unicast-routing', 'ipv6 dhcp pool IPV6-STATELESS', 'dns-server 2001:db8:acad:1::254', 'domain-name stateless.com', 'ipv6 dhcp pool IPV6-STATEFUL', 'address prefix 2001:db8:acad:2::/64',
      'dns-server 2001:db8:acad:2::254', 'domain-name stateful.com', 'interface g0/0/0', 'ipv6 address 2001:db8:acad:1::1/64', 'ipv6 address fe80::1 link-local', 'ipv6 dhcp server IPV6-STATELESS', 'ipv6 nd other-config-flag', 'no shutdown',
      'interface g0/0/1', 'ipv6 address 2001:db8:acad:2::1/64', 'ipv6 address fe80::1 link-local', 'ipv6 dhcp server IPV6-STATEFUL', 'ipv6 nd managed-config-flag', 'ipv6 nd prefix default no-autoconfig', 'no shutdown'] },
  });

  /* ================================================================ M9 */
  L.push({
    id: 'm9-hsrp', module: 9, topics: ['9.1', '9.2'], level: 'Guided', minutes: 30,
    title: 'HSRP: a Default Gateway That Survives a Router Failure',
    goal: 'Give the LAN a virtual gateway shared by R1 and R2, with R1 active and preemption on.',
    scenario: '<p>R1 and R2 both connect the LAN to R3 and the server. The PCs can only have one default gateway, so give them the HSRP virtual address 192.168.1.254. R1 must be the active router whenever it is up. Routing to and from R3 is already configured.</p>',
    devices: [{ id: 'R3', type: 'router', model: RT3, x: 50, y: 4 }, { id: 'Server', type: 'server', model: 'Server-PT', x: 88, y: 4, note: '172.16.1.10' },
      { id: 'R1', type: 'router', model: RT, x: 26, y: 24 }, { id: 'R2', type: 'router', model: RT, x: 74, y: 24 }, { id: 'S1', type: 'switch', model: SW, x: 50, y: 42 },
      { id: 'PC1', type: 'pc', model: PC, x: 26, y: 62, note: '192.168.1.11' }, { id: 'PC2', type: 'pc', model: PC, x: 74, y: 62, note: '192.168.1.12' }],
    links: [['R1', 'G0/0/1', 'R3', 'G0/0/0', 'cross'], ['R2', 'G0/0/1', 'R3', 'G0/0/1', 'cross'], ['Server', 'NIC', 'R3', 'G0/0/2', 'cross'],
      ['R1', 'G0/0/0', 'S1', 'Fa0/1', 'straight'], ['R2', 'G0/0/0', 'S1', 'Fa0/2', 'straight'], ['PC1', 'NIC', 'S1', 'Fa0/6', 'straight'], ['PC2', 'NIC', 'S1', 'Fa0/18', 'straight']],
    addressing: [['R1', 'G0/0/0', '192.168.1.1/24', ''], ['R2', 'G0/0/0', '192.168.1.2/24', ''], ['HSRP', 'virtual', '192.168.1.254', ''], ['R1', 'G0/0/1', '10.1.1.1/30', ''], ['R2', 'G0/0/1', '10.2.2.1/30', ''],
      ['R3', 'G0/0/0 / G0/0/1', '10.1.1.2/30, 10.2.2.2/30', ''], ['R3', 'G0/0/2', '172.16.1.1/24', ''], ['Server', 'NIC', '172.16.1.10/24', '172.16.1.1'],
      ['PC1', 'NIC', '192.168.1.11/24', '192.168.1.254'], ['PC2', 'NIC', '192.168.1.12/24', '192.168.1.254']],
    start: {
      R1: ['hostname R1', 'interface g0/0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown', 'interface g0/0/1', 'ip address 10.1.1.1 255.255.255.252', 'no shutdown', 'exit', 'ip route 0.0.0.0 0.0.0.0 10.1.1.2'],
      R2: ['hostname R2', 'interface g0/0/0', 'ip address 192.168.1.2 255.255.255.0', 'no shutdown', 'interface g0/0/1', 'ip address 10.2.2.1 255.255.255.252', 'no shutdown', 'exit', 'ip route 0.0.0.0 0.0.0.0 10.2.2.2'],
      R3: ['hostname R3', 'interface g0/0/0', 'ip address 10.1.1.2 255.255.255.252', 'no shutdown', 'interface g0/0/1', 'ip address 10.2.2.2 255.255.255.252', 'no shutdown',
        'interface g0/0/2', 'ip address 172.16.1.1 255.255.255.0', 'no shutdown', 'exit', 'ip route 192.168.1.0 255.255.255.0 10.1.1.1', 'ip route 192.168.1.0 255.255.255.0 10.2.2.1'],
      S1: ['hostname S1'],
    },
    tasks: [
      { part: 'Before', text: 'If the PCs used 192.168.1.1 as their gateway and R1 failed, could they still reach the server? (yes/no)', answer: ['no', 'n'] },
      { part: 'HSRP', text: 'On R1 G0/0/0, create HSRP group 1 with virtual IP 192.168.1.254, priority 150 and preemption.',
        check: (h) => { const i = K.intf(h, 'R1', 'G0/0/0'); const s = i && i.standby(1); if (!s || !s.configured) return 'R1 G0/0/0 has no HSRP group 1.'; if (s.ip !== '192.168.1.254') return 'The virtual IP on R1 is ' + s.ip + '.'; if (s.priority !== 150) return 'R1 priority is ' + s.priority + ', expected 150.'; return s.preempt || 'Preemption is not enabled on R1.'; },
        cmds: ['interface g0/0/0', 'standby 1 ip 192.168.1.254', 'standby 1 priority 150', 'standby 1 preempt'] },
      { part: 'HSRP', text: 'On R2 G0/0/0, join HSRP group 1 with the same virtual IP and the default priority.',
        check: (h) => { const i = K.intf(h, 'R2', 'G0/0/0'); const s = i && i.standby(1); return (!!s && s.ip === '192.168.1.254' && s.priority === 100) || 'R2 G0/0/0 needs standby 1 ip 192.168.1.254 with the default priority.'; },
        cmds: ['interface g0/0/0', 'standby 1 ip 192.168.1.254'] },
      { part: 'Verify', text: '<code>show standby brief</code>: R1 is Active and R2 is Standby for 192.168.1.254.',
        check: K.all((h) => { const g = h.standby('R1').get('G0/0/0', 1); return (!!g && g.state === 'Active' && g.vip === '192.168.1.254') || 'R1 is not the active router for group 1.'; }, (h) => { const g = h.standby('R2').get('G0/0/0', 1); return (!!g && g.state === 'Standby') || 'R2 is not in the Standby state.'; }) },
      { part: 'Verify', text: 'Both PCs use 192.168.1.254 as their default gateway.', check: K.all(K.pcGateway('PC1', '192.168.1.254'), K.pcGateway('PC2', '192.168.1.254')) },
      { part: 'Verify', text: 'From PC1, ping the server and run <code>tracert 172.16.1.10</code>. Which real router address answers as the first hop?', answer: (h) => { const t = h.trace('PC1', '172.16.1.10'); return t.hops[0] ? [t.hops[0]] : []; } },
      { part: 'Failover', text: 'Shut down R1 G0/0/0. Ping the server again from PC1: it still works through R2, which is now Active. Then bring R1 G0/0/0 back up.', self: true },
      { part: 'Failover', text: 'After R1 comes back, which command lets it take the active role again?', answer: ['standby 1 preempt', 'standby preempt', 'preempt'] },
      { part: 'Failover', text: 'By default, how many seconds does the standby router wait without hellos before it becomes active?', answer: ['10', '10 seconds', '10s'] },
      { part: 'Verify', text: 'PC1 reaches the server.', check: K.ping('PC1', '172.16.1.10') },
    ],
    collect: { R1: ['show running-config', 'show standby brief'], R2: ['show running-config', 'show standby brief'], PC1: ['ipconfig /all', 'ping 172.16.1.10', 'tracert 172.16.1.10'], PC2: ['ipconfig /all'] },
    solution: {
      R1: ['interface g0/0/0', 'standby 1 ip 192.168.1.254', 'standby 1 priority 150', 'standby 1 preempt'],
      R2: ['interface g0/0/0', 'standby 1 ip 192.168.1.254'],
      PC1: ['#', 'Desktop > IP Configuration > Default Gateway: 192.168.1.254 (same on PC2)'],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
