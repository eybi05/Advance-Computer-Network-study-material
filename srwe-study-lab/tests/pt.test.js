/* Packet Tracer output parsers and the command checker. Run: node tests/pt.test.js */
'use strict';
const { load } = require('./load');
const SRWE = load([]);
const PT = SRWE.PT;

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) { try { fn(); pass++; } catch (e) { fail++; failures.push('FAIL ' + name + '\n   ' + String(e && e.stack || e).split('\n').slice(0, 4).join('\n   ')); } }
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || 'not equal') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)); };

/* ---------------- sample outputs (Packet Tracer 8/9 and IOS 15 formats) ---------------- */
const RUN_S1 = `S1#show running-config
Building configuration...

Current configuration : 1734 bytes
!
version 15.0
no service timestamps log datetime msec
service password-encryption
!
hostname S1
!
enable secret 5 $1$mERr$9cTjUIEqNGurQiFU.ZeCi1
!
!
!
no ip domain-lookup
ip domain-name cisco.com
!
username admin secret 5 $1$mERr$ZE5Q4QZMcvb2qWkq7rqfn/
!
!
spanning-tree mode rapid-pvst
spanning-tree extend system-id
spanning-tree vlan 1,10 priority 24576
!
interface FastEthernet0/1
 switchport trunk native vlan 99
 switchport trunk allowed vlan 10,20,99
 switchport mode trunk
 switchport nonegotiate
 channel-group 1 mode active
!
interface FastEthernet0/2
 switchport trunk native vlan 99
 switchport mode trunk
 channel-group 1 mode active
!
interface FastEthernet0/5
 switchport access vlan 99
 switchport mode access
 shutdown
!
interface FastEthernet0/18
 switchport access vlan 10
 switchport mode access
 switchport port-security
 switchport port-security maximum 2
 switchport port-security mac-address sticky
 switchport port-security mac-address sticky 0001.6343.8C12
 switchport port-security violation restrict
 spanning-tree portfast
 spanning-tree bpduguard enable
!
interface Port-channel1
 switchport trunk native vlan 99
 switchport mode trunk
!
interface Vlan1
 no ip address
 shutdown
!
interface Vlan99
 ip address 172.17.99.11 255.255.255.0
!
ip default-gateway 172.17.99.1
!
banner motd ^CUnauthorized access is strictly prohibited.^C
!
line con 0
 password 7 0822455D0A16
 login
!
line vty 0 4
 password 7 0822455D0A16
 login local
 transport input ssh
line vty 5 15
 password 7 0822455D0A16
 login local
 transport input ssh
!
!
end

S1#`;

const VLAN = `S1#show vlan brief

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Fa0/3, Fa0/4, Fa0/6, Fa0/7
                                                Fa0/8, Fa0/9, Gig0/1, Gig0/2
10   Faculty                          active    Fa0/18
20   Students                         active
99   Management                       active    Fa0/5
1002 fddi-default                     active
1003 token-ring-default               active
1004 fddinet-default                  active
1005 trnet-default                    active
S1#`;

const TRUNK = `S1#show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Po1         on           802.1q         trunking      99

Port        Vlans allowed on trunk
Po1         1-1005

Port        Vlans allowed and active in management domain
Po1         1,10,20,99

Port        Vlans in spanning tree forwarding state and not pruned
Po1         1,10,20,99
`;

const ETHER = `S1#show etherchannel summary
Flags:  D - down        P - in port-channel
        I - stand-alone s - suspended
        H - Hot-standby (LACP only)
        R - Layer3      S - Layer2
        U - in use      f - failed to allocate aggregator
        u - unsuitable for bundling
        w - waiting to be aggregated
        d - default port


Number of channel-groups in use: 1
Number of aggregators:           1

Group  Port-channel  Protocol    Ports
------+-------------+-----------+----------------------------------------------

1      Po1(SU)           LACP   Fa0/1(P) Fa0/2(P)
`;

const STP = `S2#show spanning-tree
VLAN0001
  Spanning tree enabled protocol rstp
  Root ID    Priority    24577
             Address     0001.4320.ABCD
             Cost        19
             Port        1(FastEthernet0/1)
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     000A.F3C4.5A01
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  20

Interface        Role Sts Cost      Prio.Nbr Type
---------------- ---- --- --------- -------- --------------------------------
Fa0/1            Root FWD 19        128.1    P2p
Fa0/2            Altn BLK 19        128.2    P2p
Fa0/6            Desg FWD 19        128.6    P2p

VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    24586
             Address     000A.F3C4.5A01
             This bridge is the root
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    24586  (priority 24576 sys-id-ext 10)
             Address     000A.F3C4.5A01
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  20

Interface        Role Sts Cost      Prio.Nbr Type
---------------- ---- --- --------- -------- --------------------------------
Fa0/1            Desg FWD 19        128.1    P2p
Fa0/2            Desg FWD 19        128.2    P2p
`;

const ROUTE = `R1#show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
       E1 - OSPF external type 1, E2 - OSPF external type 2, E - EGP
       i - IS-IS, L1 - IS-IS level-1, L2 - IS-IS level-2, ia - IS-IS inter area
       * - candidate default, U - per-user static route, o - ODR
       P - periodic downloaded static route

Gateway of last resort is 172.16.2.2 to network 0.0.0.0

     172.16.0.0/16 is variably subnetted, 5 subnets, 2 masks
S       172.16.1.0/24 [1/0] via 172.16.2.2
C       172.16.2.0/24 is directly connected, GigabitEthernet0/0/1
L       172.16.2.1/32 is directly connected, GigabitEthernet0/0/1
C       172.16.3.0/24 is directly connected, GigabitEthernet0/0/0
L       172.16.3.1/32 is directly connected, GigabitEthernet0/0/0
     192.168.2.0/24 is subnetted, 1 subnets
S       192.168.2.0 [1/0] via 172.16.2.2
O    10.0.4.0/24 [110/50] via 10.0.3.2, 00:24:22, Serial0/1/1
S*   0.0.0.0/0 [1/0] via 172.16.2.2
`;

const ROUTE6 = `R1#show ipv6 route
IPv6 Routing Table - 8 entries
Codes: C - Connected, L - Local, S - Static, R - RIP, B - BGP
       U - Per-user Static route, M - MIPv6
       I1 - ISIS L1, I2 - ISIS L2, IA - ISIS interarea, IS - ISIS summary
       O - OSPF intra, OI - OSPF inter, OE1 - OSPF ext 1, OE2 - OSPF ext 2
       ON1 - OSPF NSSA ext 1, ON2 - OSPF NSSA ext 2
       D - EIGRP, EX - EIGRP external
S   ::/0 [1/0]
     via 2001:DB8:ACAD:2::2
S   2001:DB8:ACAD:1::/64 [1/0]
     via Serial0/1/0, directly connected
C   2001:DB8:ACAD:3::/64 [0/0]
     via GigabitEthernet0/0/0, directly connected
L   2001:DB8:ACAD:3::1/128 [0/0]
     via GigabitEthernet0/0/0, receive
S   2001:DB8:CAFE:2::/64 [1/0]
     via FE80::2, Serial0/1/0
L   FF00::/8 [0/0]
     via Null0, receive
`;

const PC = `C:\\>ipconfig /all

FastEthernet0 Connection:(default port)

   Connection-specific DNS Suffix..: example.com
   Physical Address................: 0060.7036.2849
   Link-local IPv6 Address.........: FE80::260:70FF:FE36:2849
   IPv6 Address....................: 2001:DB8:ACAD:1:260:70FF:FE36:2849
   IPv4 Address....................: 192.168.10.11
   Subnet Mask.....................: 255.255.255.0
   Default Gateway.................: FE80::1
                                     192.168.10.1
   DHCP Servers....................: 192.168.10.1
   DHCPv6 IAID.....................:
   DHCPv6 Client DUID..............: 00-01-00-01-34-9D-6A-29-00-60-70-36-28-49
   DNS Servers.....................: 2001:DB8:ACAD:1::254
                                     192.168.11.5

Bluetooth Connection:

   Connection-specific DNS Suffix..:
   Physical Address................: 0030.A3B8.0B9D
   Link-local IPv6 Address.........: ::
   IPv6 Address....................: ::
   IPv4 Address....................: 0.0.0.0
   Subnet Mask.....................: 0.0.0.0
   Default Gateway.................: ::
                                     0.0.0.0

C:\\>ping 192.168.20.10

Pinging 192.168.20.10 with 32 bytes of data:

Request timed out.
Reply from 192.168.20.10: bytes=32 time<1ms TTL=127
Reply from 192.168.20.10: bytes=32 time<1ms TTL=127
Reply from 192.168.20.10: bytes=32 time<1ms TTL=127

Ping statistics for 192.168.20.10:
    Packets: Sent = 4, Received = 3, Lost = 1 (25% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 0ms, Average = 0ms

C:\\>ping 192.168.30.10

Pinging 192.168.30.10 with 32 bytes of data:

Reply from 192.168.10.1: Destination host unreachable.
Reply from 192.168.10.1: Destination host unreachable.
Reply from 192.168.10.1: Destination host unreachable.
Reply from 192.168.10.1: Destination host unreachable.

Ping statistics for 192.168.30.10:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),

C:\\>tracert 192.168.20.10

Tracing route to 192.168.20.10 over a maximum of 30 hops:

  1   0 ms      0 ms      0 ms      192.168.10.1
  2   0 ms      0 ms      0 ms      192.168.20.10

Trace complete.
`;

/* ---------------- tests ---------------- */
test('interface names are canonical', () => {
  eq(PT.ifCanon('Fa0/1'), 'FastEthernet0/1');
  eq(PT.ifCanon('gig 0/0/1.20'), 'GigabitEthernet0/0/1.20');
  eq(PT.ifCanon('Gig0/1'), 'GigabitEthernet0/1');
  eq(PT.ifCanon('Po1'), 'Port-channel1');
  eq(PT.ifCanon('Se0/1/0'), 'Serial0/1/0');
  eq(PT.ifCanon('vlan99'), 'Vlan99');
  eq(PT.ifCanon('G1/0/1'), 'GigabitEthernet1/0/1');
});

test('type 7 passwords decode', () => { eq(PT.decode7('0822455D0A16'), 'cisco'); });

test('running-config parser', () => {
  const ev = PT.parseDevice(RUN_S1);
  const c = ev.kinds.run;
  assert(c, 'no config');
  eq(c.hostname, 'S1');
  assert(c.has(/^no ip domain-lookup/), 'domain lookup');
  eq(c.stpMode(), 'rapid-pvst');
  eq(c.stpPriority(10), 24576);
  eq(c.stpPriority(20), null);
  const f1 = c.intf('fa0/1');
  eq(f1.mode, 'trunk'); eq(f1.native, 99); eq([...f1.allowed].sort((a, b) => a - b), [10, 20, 99]); assert(f1.nonegotiate); eq(f1.group, { id: 1, mode: 'active' });
  assert(f1.allows(20) && !f1.allows(30), 'allows');
  eq(c.intf('FastEthernet0/2').allowed, null);
  const f18 = c.intf('f0/18');
  eq(f18.access, 10); assert(f18.portfast && f18.bpduguard, 'stp edge');
  eq(f18.psec.max, 2); eq(f18.psec.violation, 'restrict'); assert(f18.psec.sticky); eq(f18.psec.stickyMacs, ['0001.6343.8C12']);
  assert(c.intf('fa0/5').shutdown, 'shutdown');
  eq(c.intf('vlan99').ip.str, '172.17.99.11/24');
  eq(c.banner('motd'), 'Unauthorized access is strictly prohibited.');
  eq(PT.linePassword(c.con()), 'cisco');
  assert(c.vty(0, 15, (b) => PT.lineLogin(b) === 'local' && PT.lineTransport(b) === 'ssh'), 'vty');
  eq(c.users()[0].name, 'admin');
});

test('show vlan brief / trunk / etherchannel', () => {
  const ev = PT.parseDevice(VLAN + '\n' + TRUNK + '\n' + ETHER);
  const v = ev.kinds.vlan;
  eq(v.get(10).name, 'Faculty'); eq(v.portVlan('fa0/18'), 10); eq(v.portVlan('gi0/2'), 1); eq(v.get(20).ports, []);
  const t = ev.kinds.trunk.get('po1');
  eq(t.native, 99); eq(t.status, 'trunking'); assert(t.active.has(20) && !t.active.has(30), 'active');
  const g = ev.kinds.ether.get(1);
  eq(g.flags, 'SU'); eq(g.protocol, 'LACP'); eq(g.ports.map((p) => p.name + ':' + p.flags), ['FastEthernet0/1:P', 'FastEthernet0/2:P']);
});

test('show spanning-tree', () => {
  const s = PT.parseDevice(STP).kinds.stp;
  const v1 = s.get(1);
  assert(!v1.isRoot, 'not root'); eq(v1.rootPriority, 24577); eq(v1.rootPort, 'FastEthernet0/1'); eq(v1.rootCost, 19); eq(v1.protocol, 'rstp');
  eq(v1.ports['fastethernet0/2'].role, 'Altn'); eq(v1.ports['fastethernet0/2'].state, 'BLK'); eq(v1.bridgePriority, 32769);
  assert(s.get(10).isRoot, 'vlan 10 root'); eq(s.get(10).basePriority, 24576);
});

test('show ip route / show ipv6 route', () => {
  const r = PT.parseDevice(ROUTE).kinds.route;
  eq(r.gw, '172.16.2.2');
  assert(r.has('S', '172.16.1.0', 24) && r.has('S', '192.168.2.0', 24) && r.has('C', '172.16.3.0', 24) && r.has('O', '10.0.4.0', 24), 'routes');
  const d = r.defaultRoute(); eq(d.via, ['172.16.2.2']); assert(d.candidate, 'candidate');
  eq(r.find('10.0.4.0', 24)[0].ifc, 'Serial0/1/1');
  const r6 = PT.parseDevice(ROUTE6).kinds.route6;
  assert(r6.defaultRoute() && r6.defaultRoute().via[0] === PT.v6('2001:db8:acad:2::2'), 'v6 default');
  assert(r6.has('S', '2001:db8:acad:1::', 64) && r6.find('2001:db8:acad:1::', 64)[0].connected, 'v6 static connected');
  eq(r6.find('2001:db8:cafe:2::', 64)[0].ifc, 'Serial0/1/0');
  assert(!r6.has('S', '2001:db8:acad:9::', 64), 'absent');
});

test('PC ipconfig, ping and tracert', () => {
  const ev = PT.parseDevice(PC);
  const ip = ev.kinds.ipconfig;
  eq(ip.ipv4, '192.168.10.11'); eq(ip.mask, '255.255.255.0'); eq(ip.gw4, '192.168.10.1'); eq(ip.dns4, ['192.168.11.5']); eq(ip.dhcp, ['192.168.10.1']);
  eq(ip.suffix, 'example.com'); eq(ip.ipv6, [PT.v6('2001:DB8:ACAD:1:260:70FF:FE36:2849')]); eq(ip.gw6, 'FE80::1'); eq(ip.mac, '0060703628' + '49');
  const h = PT.helpers({ tasks: [] }, { PC1: PC });
  assert(h.pinged('PC1', '192.168.20.10'), 'ping ok');
  assert(h.pingFailed('PC1', '192.168.30.10'), 'unreachable is a failure');
  let threw = false; try { h.pinged('PC1', '10.9.9.9'); } catch (e) { threw = e instanceof PT.Need; }
  assert(threw, 'missing ping should throw Need');
  eq(h.trace('PC1', '192.168.20.10').hops, ['192.168.10.1', '192.168.20.10']);
});

test('IOS ping, standby, dhcp binding, port security, snooping', () => {
  const t = `R1#ping 172.16.2.2

Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 172.16.2.2, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 0/0/1 ms

R1#ping 2001:db8:cafe:2::1

Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 2001:DB8:CAFE:2::1, timeout is 2 seconds:
% No valid route for destination
Success rate is 0 percent (0/1)

R1#show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State    Active          Standby         Virtual IP
Gig0/0/1    1    150 P Active   local           192.168.1.2     192.168.1.254

R1#show ip dhcp binding
IP address       Client-ID/              Lease expiration        Type
                 Hardware address
192.168.10.11    0060.7036.2849           --                     Automatic
192.168.11.11    0001.C7A3.0B9D           --                     Automatic
`;
  const h = PT.helpers({ tasks: [] }, { R1: t });
  assert(h.pinged('R1', '172.16.2.2'), 'ios ping');
  assert(h.pingFailed('R1', '2001:db8:cafe:2::1'), 'ios v6 ping failed');
  const g = h.standby('R1').get('g0/0/1', 1);
  eq([g.state, g.priority, g.preempt, g.vip], ['Active', 150, true, '192.168.1.254']);
  eq(h.bind('R1').list.length, 2);
  const sw = `S1#show port-security interface fa0/18
Port Security              : Enabled
Port Status                : Secure-shutdown
Violation Mode             : Shutdown
Aging Time                 : 0 mins
Aging Type                 : Absolute
SecureStatic Address Aging : Disabled
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 1
Last Source Address:Vlan   : 0001.6343.8C12:10
Security Violation Count   : 1

S1#show port-security
Secure Port MaxSecureAddr CurrentAddr SecurityViolation Security Action
               (Count)       (Count)        (Count)
--------------------------------------------------------------------
        Fa0/18        1          1                 1         Shutdown
----------------------------------------------------------------------

S1#show ip dhcp snooping
Switch DHCP snooping is enabled
DHCP snooping is configured on following VLANs:
10,20
Insertion of option 82 is enabled
Option 82 on untrusted port is not allowed
Verification of hwaddr field is enabled
Interface                  Trusted    Rate limit (pps)
-----------------------    -------    ----------------
FastEthernet0/1            yes        unlimited
FastEthernet0/18           no         6
`;
  const h2 = PT.helpers({ tasks: [] }, { S1: sw });
  const p = h2.psecIf('S1', 'FastEthernet0/18');
  eq([p.status, p.violation, p.violations, p.sticky], ['secure-shutdown', 'shutdown', 1, 1]);
  eq(h2.psec('S1').get('fa0/18').violations, 1);
  const sn = h2.snoop('S1');
  assert(sn.enabled && sn.vlans.has(20) && sn.get('fa0/1').trusted && sn.get('f0/18').rate === 6, 'snooping');
});

test('sections without prompts are recognised by their shape', () => {
  const ev = PT.parseDevice(VLAN.replace(/^S1#.*$/gm, ''));
  assert(ev.kinds.vlan, 'vlan without prompt');
  const ev2 = PT.parseDevice('Building configuration...\n\nhostname R9\n!\ninterface GigabitEthernet0/0/0\n ip address 10.0.0.1 255.255.255.0\n!\nend');
  eq(ev2.kinds.run.intf('g0/0/0').ip.addr, '10.0.0.1');
});

test('copy run start and config-mode lines are ignored', () => {
  const ev = PT.parseDevice('S1#copy running-config startup-config\nDestination filename [startup-config]? \nBuilding configuration...\n[OK]\nS1#conf t\nS1(config)#interface fa0/1\nS1(config-if)#do show vlan brief\n' + VLAN.split('\n').slice(1).join('\n'));
  assert(!ev.kinds.run, 'copy run start is not a running-config');
  assert(ev.kinds.vlan, 'do show vlan brief recognised');
});

test('host warning', () => {
  assert(PT.hostWarning('S1', VLAN.replace(/S1#/g, 'S2#'), 'S1'), 'should warn');
  assert(!PT.hostWarning('S1', VLAN, 'S1'), 'should not warn');
});

test('grade(): pass / fail / need / answers', () => {
  const lab = { tasks: [
    { text: 'a', check: (h) => h.run('S1').hostname === 'S1' },
    { text: 'b', check: (h) => h.vlan('S1').get(30) ? true : 'VLAN 30 is missing' },
    { text: 'c', check: (h) => h.pinged('PC1', '192.168.20.10') },
    { text: 'd', answer: ['24577'] },
    { text: 'e', self: true },
  ] };
  const r = PT.grade(lab, { pasted: { S1: RUN_S1 + VLAN }, answers: { 3: '24577' }, ticks: {} });
  eq(r.map((x) => x.status), ['pass', 'fail', 'need', 'pass', 'open']);
  eq(r[1].msg, 'VLAN 30 is missing');
  eq(r[2].need, { dev: 'PC1', what: 'ping 192.168.20.10' });
});

console.log('\nPT tests: ' + pass + ' passed, ' + fail + ' failed');
if (failures.length) { console.log('\n' + failures.join('\n\n')); process.exitCode = 1; }
