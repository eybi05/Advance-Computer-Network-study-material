/* Packet Tracer output for each lab in its solved state (and, where it matters, its starting state).
 * Built with tests/render.js from the lab's own start + solution commands, plus hand-written
 * operational output (pings, spanning tree, EtherChannel ...) that a correct lab would show. */
'use strict';
const { fx } = require('./render');

const dev = (lab, name, model, solved) => fx.device(name, model, lab.start && lab.start[name], solved && lab.solution && lab.solution[name] && lab.solution[name][0] !== '#' ? lab.solution[name] : null);
const both = (fn) => ({ solved: (lab) => fn(lab, true), start: (lab) => fn(lab, false) });

module.exports = {
  /* ---------------- M1 ---------------- */
  'm1-basic-switch': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok);
    return { S1: S1.showRun() + S1.showVlan() + S1.showIpBrief() + S1.showStart(), PC1: fx.ping('172.17.99.11', ok), PC2: fx.ping('172.17.99.11', ok) };
  }),
  'm1-switch-ports': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), S2 = dev(lab, 'S2', '2960', ok);
    return { S1: S1.showRun() + S1.showIpBrief() + fx.ifaces('S1', 'FastEthernet0/1', 'Full', '100'), S2: S2.showRun() + fx.ifaces('S2', 'FastEthernet0/1', ok ? 'Full' : 'Half', '100'), PC1: fx.ping('192.168.1.20', ok) };
  }),
  'm1-ssh': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok);
    return {
      S1: S1.showRun() + fx.version('S1', 'C2960-LANBASEK9-M') + (ok ? fx.ssh('S1', '2.0') : 'S1#show ip ssh\nSSH Disabled - version 1.99\n'),
      PC1: fx.session('telnet', '172.17.99.11', null, true, 'S1') + (ok ? fx.session('telnet', '172.17.99.11', null, false) + fx.session('ssh', '172.17.99.11', 'admin', true, 'S1') : ''),
    };
  }),
  'm1-router-basic': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok);
    return { R1: R1.showRun() + R1.showIpBrief() + R1.showRoute(), PC1: fx.ping('192.168.11.10', ok) + fx.ping('2001:db8:acad:2::10', ok) + fx.ping('10.0.0.1', ok) };
  }),
  /* ---------------- M2 ---------------- */
  'm2-mac-table': both((lab, ok) => ({
    S1: fx.mac('S1', [['1', '0060.7036.0001', 'Fa0/6'], ['1', '0060.7036.0002', 'Fa0/18'], ['1', '0060.7036.0003', 'Fa0/1']]),
    S2: fx.mac('S2', [['1', '0060.7036.0001', 'Fa0/1'], ['1', '0060.7036.0003', 'Fa0/18']]),
    PC1: fx.ipconfig({ ipv4: '192.168.1.10', mac: '0060.7036.0001' }) + (ok ? fx.ping('192.168.1.20', true) + fx.ping('192.168.1.30', true) : ''),
    PC3: fx.ipconfig({ ipv4: '192.168.1.30', mac: '0060.7036.0003' }),
  })),
  /* ---------------- M3 ---------------- */
  'm3-vlans': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok);
    return { S1: S1.showRun() + S1.showVlan(), PC1: fx.ping('192.168.1.12', ok) + fx.ping('192.168.1.13', !ok), PC3: fx.ping('192.168.1.14', ok) };
  }),
  'm3-trunks': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), S2 = dev(lab, 'S2', '2960', ok), S3 = dev(lab, 'S3', '2960', ok);
    return { S1: S1.showRun() + S1.showTrunk(), S2: S2.showRun() + fx.iosPing('S2', '192.168.99.13', ok), S3: S3.showRun(), PC1: fx.ping('192.168.10.12', ok) + fx.ping('192.168.20.11', false), PC2: fx.ping('192.168.20.12', ok) };
  }),
  'm3-troubleshoot': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), S2 = dev(lab, 'S2', '2960', ok);
    return { S1: S1.showRun() + S1.showVlan() + S1.showTrunk(), S2: S2.showRun() + S2.showVlan() + S2.showTrunk(), PC1: fx.ping('192.168.10.12', ok), PC2: fx.ping('192.168.20.12', ok) };
  }),
  /* ---------------- M4 ---------------- */
  'm4-roas': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok), S1 = dev(lab, 'S1', '2960', ok);
    return { R1: R1.showRun() + R1.showIpBrief() + R1.showRoute(), S1: S1.showRun(), PC1: fx.ping('192.168.20.10', ok) + fx.ping('192.168.99.3', ok) + (ok ? fx.trace('192.168.20.10', ['192.168.10.1', '192.168.20.10']) : '') };
  }),
  'm4-l3switch': both((lab, ok) => {
    const D1 = dev(lab, 'D1', '3650', ok);
    const R1o = ok ? ['O    192.168.10.0/24 [110/2] via 10.10.10.2, 00:00:41, GigabitEthernet0/0/1', 'O    192.168.20.0/24 [110/2] via 10.10.10.2, 00:00:41, GigabitEthernet0/0/1'] : [];
    const R1 = dev(lab, 'R1', '4321', ok);
    return {
      D1: D1.showRun() + D1.showVlan() + D1.showIpBrief() + D1.showRoute(ok ? ['O    10.20.20.0/24 [110/2] via 10.10.10.1, 00:00:41, GigabitEthernet1/0/1'] : []),
      R1: R1.showRoute(R1o), PC1: fx.ping('192.168.20.10', ok) + fx.ping('10.20.20.254', ok),
    };
  }),
  'm4-troubleshoot': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok), S1 = dev(lab, 'S1', '2960', ok);
    return { R1: R1.showRun() + R1.showIpBrief(), S1: S1.showRun() + S1.showTrunk() + S1.showVlan(), PC1: fx.ping('192.168.20.10', ok), PC2: fx.ipconfig({ ipv4: '192.168.20.10', gw: ok ? '192.168.20.1' : '192.168.20.254' }) + fx.ping('192.168.20.1', ok) };
  }),
  /* ---------------- M5 ---------------- */
  'm5-stp-observe': both((lab, ok) => {
    const R = { vlan: 1, rootPrio: 32769, rootMac: '0001.4320.0001' };
    return {
      S1: fx.stp('S1', [Object.assign({}, R, { root: true, prio: 32769, mac: '0001.4320.0001', ports: [['Fa0/1', 'Desg', 'FWD'], ['Fa0/2', 'Desg', 'FWD']] })]),
      S2: fx.stp('S2', [Object.assign({}, R, { cost: 19, rootPortNum: 1, rootPort: 'FastEthernet0/1', prio: 32769, mac: '0002.4320.0002', ports: [['Fa0/1', 'Root', 'FWD'], ['Fa0/3', 'Desg', 'FWD'], ['Fa0/6', 'Desg', 'FWD']] })]),
      S3: fx.stp('S3', [Object.assign({}, R, { cost: 19, rootPortNum: 2, rootPort: 'FastEthernet0/2', prio: 32769, mac: '0003.4320.0003', ports: [['Fa0/2', 'Root', 'FWD'], ['Fa0/3', 'Altn', 'BLK'], ['Fa0/6', 'Desg', 'FWD']] })]),
      PC1: ok ? fx.ping('192.168.1.20', true) : '',
    };
  }),
  'm5-stp-tune': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), S2 = dev(lab, 'S2', '2960', ok), S3 = dev(lab, 'S3', '2960', ok);
    const R = { vlan: 1, proto: ok ? 'rstp' : 'ieee', rootPrio: ok ? 24577 : 32769, rootMac: ok ? '0009.4320.0009' : '0002.4320.0002' };
    return {
      S1: S1.showRun() + fx.stp('S1', [Object.assign({}, R, ok ? { root: true, prio: 24577, mac: '0009.4320.0009', ports: [['Fa0/1', 'Desg', 'FWD'], ['Fa0/2', 'Desg', 'FWD']] } : { cost: 19, rootPortNum: 1, rootPort: 'FastEthernet0/1', prio: 32769, mac: '0009.4320.0009', ports: [['Fa0/1', 'Root', 'FWD'], ['Fa0/2', 'Altn', 'BLK']] })]),
      S2: S2.showRun() + fx.stp('S2', [Object.assign({}, R, { cost: 19, rootPortNum: 1, rootPort: 'FastEthernet0/1', prio: ok ? 28673 : 32769, mac: '0002.4320.0002', ports: [['Fa0/1', 'Root', 'FWD'], ['Fa0/3', 'Desg', 'FWD']] }, ok ? {} : { root: true })]),
      S3: S3.showRun() + fx.stp('S3', [Object.assign({}, R, { cost: 19, rootPortNum: 2, rootPort: 'FastEthernet0/2', prio: 32769, mac: '0003.4320.0003', ports: [['Fa0/2', 'Root', 'FWD'], ['Fa0/3', 'Altn', 'BLK']] })]),
      PC1: fx.ping('192.168.1.20', ok),
    };
  }),
  /* ---------------- M6 ---------------- */
  'm6-etherchannel': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), S2 = dev(lab, 'S2', '2960', ok), S3 = dev(lab, 'S3', '2960', ok);
    return {
      S1: S1.showRun() + fx.ether('S1', ok ? [[1, 'SU', 'LACP', ['Fa0/1', 'Fa0/2']], [2, 'SU', 'PAgP', ['Fa0/3', 'Fa0/4']]] : []) + S1.showTrunk(),
      S2: S2.showRun(), S3: S3.showRun(), PC1: fx.ping('192.168.10.12', ok),
    };
  }),
  'm6-troubleshoot': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), S2 = dev(lab, 'S2', '2960', ok);
    return {
      S1: S1.showRun() + fx.ether('S1', [[1, ok ? 'SU' : 'SD', ok ? 'PAgP' : '-', ['Fa0/1', 'Fa0/2']]]),
      S2: S2.showRun() + fx.ether('S2', [[1, ok ? 'SU' : 'SD', 'PAgP', ['Fa0/1', 'Fa0/2']]]), PC1: fx.ping('192.168.10.12', ok),
    };
  }),
  /* ---------------- M7 ---------------- */
  'm7-dhcpv4': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok), R2 = dev(lab, 'R2', '4331', ok);
    const brief = 'R2#show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nGigabitEthernet0/0/0   192.168.20.1    YES manual up                    up\n' +
      'GigabitEthernet0/0/1   10.1.1.2        YES manual up                    up\nGigabitEthernet0/0/2   ' + (ok ? '209.165.200.230 YES DHCP   up                    up' : 'unassigned      YES unset  administratively down down') + '\n';
    const apipa = { ipv4: '169.254.10.11', mask: '255.255.0.0' };
    return {
      R1: R1.showRun() + (ok ? fx.dhcpbind('R1', [['192.168.10.10', '0060.7036.2849'], ['192.168.10.11', '0001.c7a3.0b9d'], ['192.168.20.10', '00d0.ff12.3456']]) : fx.dhcpbind('R1', [])),
      R2: R2.showRun() + brief + fx.iosPing('R2', '209.165.200.225', ok),
      PC1: fx.ipconfig(ok ? { ipv4: '192.168.10.10', gw: '192.168.10.1', dns: '192.168.11.5', dhcp: '192.168.10.1' } : apipa) + (ok ? fx.ping('192.168.20.10', true) : ''),
      PC2: fx.ipconfig(ok ? { ipv4: '192.168.10.11', gw: '192.168.10.1', dns: '192.168.11.5' } : apipa),
      PC3: fx.ipconfig(ok ? { ipv4: '192.168.20.10', gw: '192.168.20.1', dns: '192.168.11.5' } : apipa),
    };
  }),
  /* ---------------- M8 ---------------- */
  'm8-dhcpv6': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok);
    return {
      R1: R1.showRun() + (ok ? fx.pool6('R1', 'IPV6-STATELESS', null, '2001:DB8:ACAD:1::254', 0) + fx.pool6('R1', 'IPV6-STATEFUL', '2001:DB8:ACAD:2::/64', '2001:DB8:ACAD:2::254', 1) : ''),
      PC1: fx.ipconfig(ok ? { ipv4: '0.0.0.0', ipv6: '2001:DB8:ACAD:1:260:70FF:FE36:2849', gw6: 'FE80::1', dns6: '2001:DB8:ACAD:1::254' } : {}) + (ok ? fx.ping('2001:DB8:ACAD:2::A', true) : ''),
      PC3: fx.ipconfig(ok ? { ipv6: '2001:DB8:ACAD:2::A', gw6: 'FE80::1', dns6: '2001:DB8:ACAD:2::254' } : {}),
    };
  }),
  /* ---------------- M9 ---------------- */
  'm9-hsrp': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok), R2 = dev(lab, 'R2', '4321', ok);
    return {
      R1: R1.showRun() + (ok ? fx.standby('R1', [['Gig0/0/0', '1', '150', 'P', 'Active', 'local', '192.168.1.2', '192.168.1.254']]) : ''),
      R2: R2.showRun() + (ok ? fx.standby('R2', [['Gig0/0/0', '1', '100', 'Standby', '192.168.1.1', 'local', '192.168.1.254']]) : ''),
      PC1: fx.ipconfig({ ipv4: '192.168.1.11', gw: ok ? '192.168.1.254' : '192.168.1.1' }) + fx.ping('172.16.1.10', ok) + (ok ? fx.trace('172.16.1.10', ['192.168.1.1', '10.1.1.2', '172.16.1.10']) : ''),
      PC2: fx.ipconfig({ ipv4: '192.168.1.12', gw: ok ? '192.168.1.254' : '192.168.1.1' }),
    };
  }),
  /* ---------------- M10 ---------------- */
  'm10-access-control': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), R1 = dev(lab, 'R1', '4321', ok);
    return { S1: fx.cdp('S1', [['R1', 'Gig 0/1', 'ISR4300', 'Gig 0/0/1']]) + S1.showRun(), R1: R1.showRun(), PC1: ok ? fx.session('ssh', '192.168.1.1', 'admin', true, 'R1') : fx.session('ssh', '192.168.1.1', 'admin', false) };
  }),
  /* ---------------- M11 ---------------- */
  'm11-switch-security': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', ok), S2 = dev(lab, 'S2', '2960', ok);
    return {
      S1: S1.showRun() + (ok ? fx.snoop('S1', '10', [['GigabitEthernet0/1', 'yes', 'unlimited'], ['FastEthernet0/6', 'no', '6'], ['FastEthernet0/18', 'no', '6']]) : 'S1#show ip dhcp snooping\nSwitch DHCP snooping is disabled\n') +
        fx.psecIf('S1', 'fa0/6', ok ? { status: 'Secure-up', mode: 'Restrict', max: 2, total: 1, sticky: 1, violations: 0, last: '0060.7036.0001:10' } : { status: 'Secure-down', mode: 'Shutdown', max: 1, total: 0, sticky: 0, violations: 0 }),
      S2: S2.showRun(),
      PC1: fx.ipconfig({ ipv4: '192.168.10.10', gw: '192.168.10.1' }) + fx.ping('192.168.10.11', ok), PC2: fx.ipconfig({ ipv4: '192.168.10.11', gw: '192.168.10.1' }),
    };
  }),
  'm11-port-security-violation': both((lab, ok) => {
    const S1 = dev(lab, 'S1', '2960', false);
    if (ok) S1.intf('fa0/6').lines.push('switchport port-security mac-address sticky 0060.7036.0001');
    return {
      S1: S1.showRun() + fx.psecIf('S1', 'fa0/6', ok ? { status: 'Secure-shutdown', mode: 'Shutdown', max: 1, total: 1, sticky: 1, violations: 1, last: '00e0.f7a1.0666:1' } : { status: 'Secure-up', mode: 'Shutdown', max: 1, total: 0, sticky: 0, violations: 0 }),
      PC1: fx.ipconfig({ ipv4: '192.168.1.10', mac: '0060.7036.0001' }) + (ok ? fx.ping('192.168.1.2', true) : ''),
    };
  }),
  /* ---------------- M12 ---------------- */
  'm12-wlan-basics': both((lab, ok) => {
    const apipa = { ipv4: '169.254.20.20', mask: '255.255.0.0', wireless: true };
    return {
      Laptop1: fx.ipconfig(ok ? { ipv4: '192.168.50.10', gw: '192.168.50.1', wireless: true } : apipa) + (ok ? fx.ping('192.168.50.1', true) : ''),
      Laptop2: fx.ipconfig(ok ? { ipv4: '192.168.50.11', gw: '192.168.50.1', wireless: true } : apipa),
    };
  }),
  /* ---------------- M13 ---------------- */
  'm13-home-router': both((lab, ok) => ({
    ISP: fx.dhcpbind('ISP', ok ? [['209.165.200.230', '0001.9611.2201']] : []),
    PC1: fx.ipconfig(ok ? { ipv4: '192.168.10.100', gw: '192.168.10.1' } : { ipv4: '192.168.0.100', gw: '192.168.0.1' }),
    Laptop1: fx.ipconfig(ok ? { ipv4: '192.168.10.101', gw: '192.168.10.1', wireless: true } : { ipv4: '169.254.1.1', mask: '255.255.0.0', wireless: true }) + (ok ? fx.ping('198.51.100.10', true) : ''),
  })),
  'm13-wlc': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok), S1 = dev(lab, 'S1', '2960', ok);
    return {
      R1: R1.showRun(), S1: S1.showRun(),
      Laptop1: fx.ipconfig(ok ? { ipv4: '192.168.200.10', gw: '192.168.200.1', wireless: true } : { ipv4: '169.254.3.3', mask: '255.255.0.0', wireless: true }),
      Laptop2: fx.ipconfig(ok ? { ipv4: '192.168.5.10', gw: '192.168.5.1', wireless: true } : { ipv4: '169.254.4.4', mask: '255.255.0.0', wireless: true }) + (ok ? fx.ping('172.16.1.254', true) : ''),
    };
  }),
  /* ---------------- M14 ---------------- */
  'm14-routing-table': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4321', ok);
    return { R1: R1.showRun() + R1.showRoute(ok ? ['O    10.0.4.0/24 [110/2] via 10.0.3.2, 00:01:10, GigabitEthernet0/0/1'] : []), PC1: fx.ping('10.0.4.10', ok) };
  }),
  /* ---------------- M15 ---------------- */
  'm15-static-routes': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4331', ok), R2 = dev(lab, 'R2', '4331', ok), R3 = dev(lab, 'R3', '4331', ok);
    return {
      R1: R1.showRun() + R1.showRoute(), R2: R2.showRun() + R2.showRoute6(), R3: R3.showRun(),
      PC1: fx.ping('192.168.2.10', ok) + fx.ping('2001:db8:cafe:2::10', ok) + (ok ? fx.trace('192.168.2.10', ['172.16.3.1', '172.16.2.2', '192.168.1.1', '192.168.2.10']) : ''),
    };
  }),
  'm15-floating-host': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4331', ok);
    const failover = 'R1#show ip route\nCodes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP\n       * - candidate default, U - per-user static route, o - ODR\n\nGateway of last resort is 10.10.10.2 to network 0.0.0.0\n\n' +
      '     10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks\nC       10.10.10.0/30 is directly connected, GigabitEthernet0/0/2\nL       10.10.10.1/32 is directly connected, GigabitEthernet0/0/2\n' +
      '     172.16.0.0/16 is variably subnetted, 2 subnets, 2 masks\nC       172.16.3.0/24 is directly connected, GigabitEthernet0/0/0\nL       172.16.3.1/32 is directly connected, GigabitEthernet0/0/0\nS*   0.0.0.0/0 [5/0] via 10.10.10.2\n';
    return { R1: R1.showRun() + (ok ? failover : R1.showRoute()), PC1: fx.ping('192.168.2.10', ok) };
  }),
  /* ---------------- M16 ---------------- */
  'm16-troubleshoot-static': both((lab, ok) => {
    const R1 = dev(lab, 'R1', '4331', ok), R2 = dev(lab, 'R2', '4331', ok), R3 = dev(lab, 'R3', '4331', ok);
    return { R1: R1.showRun(), R2: R2.showRun() + R2.showRoute(), R3: R3.showRun(), PC1: fx.ping('192.168.2.10', ok) + fx.ping('2001:db8:cafe:2::10', ok), PC3: fx.ping('172.16.1.10', ok) };
  }),
};
