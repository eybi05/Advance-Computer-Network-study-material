/* Module 8 — SLAAC and DHCPv6: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 8.1 =============================== */
  match('8.1', 'Match the RA flag to its meaning.', [['A flag', 'Use SLAAC to create a GUA'], ['O flag', 'Get other information from a stateless DHCPv6 server'], ['M flag', 'Get the GUA from a stateful DHCPv6 server']], 'A = Address autoconfiguration, O = Other configuration, M = Managed address configuration.');
  mc('8.1', 'A PC is connected to a switch with no router. Which IPv6 address does it have?', ['Only a link-local address', 'A GUA built with SLAAC', 'A GUA from DHCPv6', 'No IPv6 address at all'], 'The LLA is created automatically; without an RA there is no prefix for a GUA.');
  mc('8.1', 'What is the "%11" at the end of fe80::1c4a:2b:9e:66%11 on Windows?', ['The zone (scope) ID that ties the LLA to an interface', 'The prefix length', 'The hop limit', 'The DHCPv6 lease time'], 'Windows uses the zone ID to associate the link-local address with an interface.');
  mc('8.1', 'How is a GUA configured on a Cisco router interface?', ['Manually with ipv6 address ipv6-address/prefix-length', 'Only through SLAAC', 'Only through DHCPv6', 'It is derived from the hostname'], 'Routers are normally configured manually.');
  tf('8.1', 'The router can force a host to use the method in its RA.', false, 'The RA only suggests a method; the host OS decides.');
  mc('8.1', 'Which ICMPv6 message does a host use to learn how to get its GUA?', ['Router Advertisement (RA)', 'Neighbor Advertisement (NA)', 'Echo Reply', 'Redirect'], 'The RA carries the prefix and the A, O and M flags.');
  mc('8.1', 'Which flag combination is the default SLAAC-only method?', ['A=1, O=0, M=0', 'A=0, O=0, M=1', 'A=1, O=1, M=0', 'A=0, O=1, M=1'], 'Routers send A=1, O=0, M=0 unless configured otherwise.');
  mc('8.1', 'Which flag combination means SLAAC plus a stateless DHCPv6 server?', ['A=1, O=1, M=0', 'A=1, O=0, M=0', 'A=0, O=0, M=1', 'A=0, O=0, M=0'], 'The host builds its own address and asks DHCPv6 for other settings.');
  tf('8.1', 'An IPv6 host creates its link-local address automatically when the interface becomes active.', true, 'No router or server is needed for the LLA.');

  card('8.1', 'The three RA flags', 'A (Address autoconfiguration): use SLAAC.\nO (Other configuration): get DNS etc. from a stateless DHCPv6 server.\nM (Managed address configuration): get the GUA from a stateful DHCPv6 server.');
  card('8.1', 'Zone ID / scope ID', 'The %n after a link-local address on Windows (fe80::…%11). It ties the LLA to one interface.');
  card('8.1', 'IPv6 host with no router on the link', 'It has a link-local address only. Without an RA it learns no prefix and builds no GUA.');
  card('8.1', 'Default RA flags', 'A = 1, O = 0, M = 0: SLAAC only.');

  /* =============================== 8.2 =============================== */
  mc('8.2', 'Which command makes a Cisco router join ff02::2 and start sending RAs?', ['ipv6 unicast-routing', 'ipv6 enable', 'ipv6 nd ra', 'ipv6 address autoconfig'], 'ipv6 unicast-routing turns the router into an IPv6 router.');
  mc('8.2', 'How often does a Cisco router send unsolicited RAs?', ['Every 200 seconds', 'Every 2 seconds', 'Every 30 seconds', 'Only when it receives an RS'], 'Every 200 seconds, and also in reply to an RS.');
  match('8.2', 'Match the message to its destination address.', [['Router Solicitation', 'ff02::2 (all routers)'], ['Router Advertisement', 'ff02::1 (all nodes)'], ['Neighbor Solicitation for DAD', 'Solicited-node multicast address']], 'Hosts ask routers; routers answer all nodes.');
  mc('8.2', 'What does a SLAAC host use as its IPv6 default gateway?', ['The link-local address of the router that sent the RA', 'The router\'s GUA', 'ff02::2', 'The DHCPv6 server address'], 'The RA is sourced from the router\'s link-local address.');
  multi('8.2', 'Which two methods can a host use to create its 64-bit interface ID? (Choose two.)', 2, ['Randomly generated', 'EUI-64', 'Copied from the router', 'Assigned by DHCPv4'], 'Windows 10 generates it randomly; EUI-64 uses the MAC address.');
  mc('8.2', 'Which hexadecimal value does EUI-64 insert into the middle of the MAC address?', ['fffe', 'ffff', 'fe80', '0000'], 'The 48-bit MAC is split in half and fffe is inserted.');
  mc('8.2', 'Why do some operating systems prefer random interface IDs to EUI-64?', ['Privacy: EUI-64 exposes the MAC address', 'EUI-64 does not work on Ethernet', 'Random IDs are shorter', 'EUI-64 requires DHCPv6'], 'The MAC address would be visible inside the IPv6 address.');
  mc('8.2', 'During DAD, what tells a host that its new address is already in use?', ['It receives a Neighbor Advertisement', 'It receives a Router Advertisement', 'It receives no reply', 'It receives an Echo Reply'], 'An NA reply means another device owns the address.');
  tf('8.2', 'SLAAC is stateless because no server keeps track of which addresses are in use.', true, 'That is what stateless means here.');
  cli('8.2', 'Enable IPv6 routing on R1 so it sends Router Advertisements.', 'R1(config)#', 'ipv6 unicast-routing', 'ipv6 unicast-routing is a global configuration command.');
  tf('8.2', 'Most operating systems perform DAD on every IPv6 unicast address, however it was configured.', true, 'The IETF recommends DAD even though duplicates are extremely unlikely.');

  card('8.2', 'SLAAC in four lines', 'Host sends RS to ff02::2 (optional).\nRouter sends RA to ff02::1 (every 200 s): prefix, A=1.\nHost builds its interface ID (random or EUI-64) and runs DAD.\nGateway = router\'s link-local address.');
  card('8.2', 'EUI-64', '48-bit MAC split in half, fffe inserted in the middle (and the 7th bit flipped) = 64-bit interface ID.');
  card('8.2', 'Duplicate Address Detection', 'Host sends an NS to the solicited-node multicast address (last 24 bits of its address). An NA reply means the address is taken.');
  card('8.2', 'Why ipv6 unicast-routing matters for SLAAC', 'It makes the router join the all-routers group ff02::2 and send RAs. Without it, hosts get no prefix.');

  /* =============================== 8.3 =============================== */
  order('8.3', 'Put the messages of a DHCPv6 exchange in order.', ['RS', 'RA', 'SOLICIT', 'ADVERTISE', 'REQUEST / INFORMATION-REQUEST', 'REPLY'], 'The RA tells the host to use DHCPv6; then the four DHCPv6 messages follow.');
  mc('8.3', 'Which UDP destination port do DHCPv6 messages from a client to a server use?', ['547', '546', '67', '68'], 'Client to server: 547. Server to client: 546.');
  mc('8.3', 'Which interface command sets the O flag for stateless DHCPv6?', ['ipv6 nd other-config-flag', 'ipv6 nd managed-config-flag', 'ipv6 dhcp server', 'ipv6 address autoconfig'], 'O = other configuration.');
  mc('8.3', 'Which interface command sets the M flag for stateful DHCPv6?', ['ipv6 nd managed-config-flag', 'ipv6 nd other-config-flag', 'ipv6 nd prefix default no-autoconfig', 'ipv6 enable'], 'M = managed address configuration.');
  mc('8.3', 'With stateless DHCPv6, where does the host get its GUA?', ['It creates it with SLAAC from the RA prefix', 'From the DHCPv6 server', 'From DHCPv4', 'It has no GUA'], 'Stateless DHCPv6 only supplies other information such as DNS.');
  mc('8.3', 'With stateful DHCPv6, where does the host get its default gateway?', ['From the RA (router link-local address)', 'From the DHCPv6 server', 'It is configured manually', 'From DNS'], 'DHCPv6 has no default gateway option.');
  tf('8.3', 'A stateless DHCPv6 server keeps a list of which client has which IPv6 address.', false, 'Only a stateful server keeps bindings.');
  mc('8.3', 'show ipv6 interface g0/0/1 shows "Hosts use DHCP to obtain routable addresses." Which method is configured?', ['Stateful DHCPv6', 'SLAAC only', 'Stateless DHCPv6', 'DHCPv4'], 'Routable addresses from DHCP = M flag set.');
  cli('8.3', 'Tell hosts on this interface to get other information from a stateless DHCPv6 server.', 'R1(config-if)#', 'ipv6 nd other-config-flag', 'Sets the O flag to 1.');
  cli('8.3', 'Tell hosts on this interface to use a stateful DHCPv6 server.', 'R1(config-if)#', 'ipv6 nd managed-config-flag', 'Sets the M flag to 1.');

  card('8.3', 'DHCPv6 message sequence', 'RS → RA → SOLICIT → ADVERTISE → REQUEST (stateless: INFORMATION-REQUEST) → REPLY.');
  card('8.3', 'Stateless vs stateful DHCPv6', 'Stateless: SLAAC address + DNS etc. from DHCPv6; O flag; no bindings.\nStateful: address and settings from DHCPv6; M flag; server keeps bindings.\nBoth: gateway from the RA.');
  card('8.3', 'DHCPv6 ports', 'UDP 546 = server to client. UDP 547 = client to server.');
  card('8.3', 'Flag commands', 'O flag: ipv6 nd other-config-flag\nM flag: ipv6 nd managed-config-flag\nClear A flag: ipv6 nd prefix default no-autoconfig');

  /* =============================== 8.4 =============================== */
  order('8.4', 'Put the stateless DHCPv6 server steps in order.', ['ipv6 unicast-routing', 'ipv6 dhcp pool IPV6-STATELESS', 'dns-server 2001:db8:acad:1::254', 'ipv6 dhcp server IPV6-STATELESS (interface)', 'ipv6 nd other-config-flag (interface)'], 'Enable routing, build the pool, bind it, set the flag.');
  cli('8.4', 'Create the DHCPv6 pool IPV6-STATEFUL.', 'R1(config)#', 'ipv6 dhcp pool IPV6-STATEFUL', 'The prompt becomes R1(config-dhcpv6)#.');
  cli('8.4', 'In the stateful pool, hand out addresses from 2001:db8:acad:1::/64.', 'R1(config-dhcpv6)#', 'address prefix 2001:db8:acad:1::/64', 'A stateful pool needs an address prefix.');
  cli('8.4', 'Bind the pool IPV6-STATEFUL to this interface.', 'R1(config-if)#', 'ipv6 dhcp server IPV6-STATEFUL', 'Without this, the pool is never used.');
  cli('8.4', 'Stop hosts on this interface from also creating a SLAAC address.', 'R1(config-if)#', 'ipv6 nd prefix default no-autoconfig', 'Clears the A flag.');
  match('8.4', 'Match the router client command to the method.', [['ipv6 address autoconfig', 'Stateless (SLAAC) client'], ['ipv6 address dhcp', 'Stateful DHCPv6 client'], ['ipv6 enable', 'Create a link-local address without a GUA']], 'Clients need ipv6 unicast-routing and an LLA too.');
  mc('8.4', 'Which command shows the IPv6 GUA a stateful server assigned to each client?', ['show ipv6 dhcp binding', 'show ipv6 dhcp pool', 'show ipv6 route', 'show ipv6 neighbors'], 'Bindings list each client\'s LLA and the assigned GUA.');
  mc('8.4', 'Which command shows the pool name, prefix, DNS server and number of active clients?', ['show ipv6 dhcp pool', 'show ipv6 dhcp binding', 'show ipv6 interface brief', 'show running-config | section ospf'], 'show ipv6 dhcp pool summarises each pool.');
  cli('8.4', 'Relay DHCPv6 requests from this interface to the server 2001:db8:acad:1::2, which is reached through G0/0/0.', 'R1(config-if)#', 'ipv6 dhcp relay destination 2001:db8:acad:1::2 G0/0/0', 'Configure it on the interface facing the clients.');
  tf('8.4', 'The exit interface in ipv6 dhcp relay destination is only required when the destination is a link-local address.', true, 'A link-local address is only unique per link, so the interface is needed.');
  multi('8.4', 'Which two are DHCPv6 roles a Cisco router can take besides being a server? (Choose two.)', 2, ['DHCPv6 client', 'DHCPv6 relay agent', 'DNS root server', 'Wireless LAN controller'], 'Server, client or relay agent.');

  card('8.4', 'Stateless DHCPv6 server: five steps', '1. ipv6 unicast-routing\n2. ipv6 dhcp pool NAME\n3. dns-server / domain-name\n4. interface: ipv6 dhcp server NAME\n5. interface: ipv6 nd other-config-flag');
  card('8.4', 'Stateful DHCPv6 server: five steps', '1. ipv6 unicast-routing\n2. ipv6 dhcp pool NAME\n3. address prefix X/64 (+ dns-server, domain-name)\n4. interface: ipv6 dhcp server NAME\n5. interface: ipv6 nd managed-config-flag (+ ipv6 nd prefix default no-autoconfig)');
  card('8.4', 'Router as DHCPv6 client', 'ipv6 unicast-routing, ipv6 enable (LLA), then ipv6 address autoconfig (stateless) or ipv6 address dhcp (stateful). Verify: show ipv6 interface brief, show ipv6 dhcp interface.');
  card('8.4', 'DHCPv6 relay agent', 'ipv6 dhcp relay destination <server> [exit-intf] on the client-facing interface. Verify: show ipv6 dhcp interface, show ipv6 dhcp binding.');
  card('8.4', 'DHCPv6 verification commands', 'show ipv6 dhcp pool (pool, prefix, active clients)\nshow ipv6 dhcp binding (stateful bindings)\nshow ipv6 dhcp interface (role of an interface)');
})(typeof window !== 'undefined' ? window : globalThis);
