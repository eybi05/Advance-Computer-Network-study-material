/* Module 15 — IP Static Routing: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 15.1 =============================== */
  multi('15.1', 'Which four types of static routes do IPv4 and IPv6 both support? (Choose four.)', 4, ['Standard static route', 'Default static route', 'Floating static route', 'Summary static route', 'Dynamic static route', 'OSPF static route'], 'Configured with ip route and ipv6 route.');
  match('15.1', 'Match the static route type to what is specified.', [['Next-hop route', 'Only the next-hop IP address'], ['Directly connected static route', 'Only the exit interface'], ['Fully specified static route', 'Both the exit interface and the next hop']], 'How the next hop is given defines the type.');
  mc('15.1', 'Which part of the ip route command sets the administrative distance?', ['The optional distance argument at the end', 'The subnet mask', 'The exit interface', 'It cannot be set'], 'ip route network mask {next-hop | exit-intf [next-hop]} [distance].');
  mc('15.1', 'Which IPv4 static route is written correctly?', ['ip route 192.168.2.0 255.255.255.0 172.16.2.2', 'ip route 192.168.2.0/24 172.16.2.2', 'ipv4 route 192.168.2.0 255.255.255.0 172.16.2.2', 'route add 192.168.2.0 172.16.2.2'], 'IPv4 uses a dotted mask; IPv6 uses /prefix-length.');
  mc('15.1', 'Before any routes are configured, R1 pings 192.168.2.1 on R3\'s LAN. What happens?', ['It fails: R1 has no route to 192.168.2.0/24', 'It succeeds through R2', 'R1 floods it', 'R1 sends it to its default route'], 'A router only knows its directly connected networks by default.');
  tf('15.1', 'Static routes are commonly used even when a dynamic routing protocol is configured.', true, 'For example a default route to the ISP.');
  mc('15.1', 'What does ping to an IPv6 destination without a route show?', ['% No valid route for destination', 'Request timed out', 'Destination host unreachable from the next hop', '!!!!!'], 'R1 has no IPv6 route to 2001:db8:cafe:2::1.');
  mc('15.1', 'Which IPv6 static route is written correctly?', ['ipv6 route 2001:db8:cafe:2::/64 2001:db8:acad:2::2', 'ipv6 route 2001:db8:cafe:2:: 255.255.255.0 2001:db8:acad:2::2', 'ip route 2001:db8:cafe:2::/64 2001:db8:acad:2::2', 'ipv6 route 2001:db8:cafe:2::/64'], 'ipv6 route prefix/length next-hop.');

  card('15.1', 'Four kinds of static route', 'Standard, default, floating, summary (IPv4 and IPv6).');
  card('15.1', 'Next-hop options', 'Next-hop route (IP only), directly connected static route (exit interface only), fully specified (exit interface + next hop).');
  card('15.1', 'Static route syntax', 'ip route network mask {ip-address | exit-intf [ip-address]} [distance]\nipv6 route prefix/len {ipv6-address | exit-intf [ipv6-address]} [distance]');
  card('15.1', 'Routing without static or dynamic routes', 'Only directly connected (C) and local (L) routes; remote networks are unreachable.');

  /* =============================== 15.2 =============================== */
  cli('15.2', 'Configure a next-hop route to 192.168.2.0/24 via 172.16.2.2.', 'R1(config)#', 'ip route 192.168.2.0 255.255.255.0 172.16.2.2', 'The exit interface is derived from the next hop.');
  cli('15.2', 'Configure an IPv6 next-hop route to 2001:db8:cafe:2::/64 via 2001:db8:acad:2::2.', 'R1(config)#', 'ipv6 route 2001:db8:cafe:2::/64 2001:db8:acad:2::2', 'ipv6 unicast-routing must be enabled.');
  cli('15.2', 'Configure a fully specified IPv6 route to 2001:db8:acad:1::/64 using exit interface s0/1/0 and next hop fe80::2.', 'R1(config)#', 'ipv6 route 2001:db8:acad:1::/64 s0/1/0 fe80::2', 'A link-local next hop requires the exit interface.');
  mc('15.2', 'You enter ipv6 route 2001:db8:acad:1::/64 fe80::2. What does IOS reply?', ['%Interface has to be specified for a link-local nexthop', 'Nothing; the route works', '% Invalid input', '% Ambiguous command'], 'Link-local addresses are only unique on a link.');
  mc('15.2', 'When should directly connected (exit-interface-only) static routes be used?', ['Only with point-to-point serial interfaces', 'On every Ethernet interface', 'Only for default routes', 'Never'], 'A next-hop address is generally recommended.');
  mc('15.2', 'When is a fully specified static route used for IPv4?', ['When the exit interface is multi-access (Ethernet) and the next hop must be explicit', 'Only for default routes', 'Only on serial links', 'When the AD must be 0'], 'The next hop must be directly connected to the exit interface.');
  mc('15.2', 'How does a directly connected static route appear in show ip route?', ['S 172.16.1.0/24 is directly connected, Serial0/1/0', 'C 172.16.1.0/24 [1/0] via Serial0/1/0', 'L 172.16.1.0/24', 'S* 172.16.1.0/24'], 'It keeps the S code.');
  multi('15.2', 'Which three commands help verify static routes? (Choose three.)', 3, ['show ip route static', 'show running-config | section ip route', 'show ip route 192.168.2.0', 'show vlan brief', 'show standby brief'], 'Also show ip route, ping and traceroute.');
  tf('15.2', 'IPv6 link-local addresses appear in the IPv6 routing table as destinations.', false, 'They are not in the routing table, which is why the exit interface is needed.');
  cli('15.2', 'Show only the static routes in the IPv4 routing table.', 'R1#', 'show ip route static', 'Replace ip with ipv6 for IPv6.');

  card('15.2', 'Next-hop vs directly connected vs fully specified', 'Next-hop: ip route N M 172.16.2.2 (recommended).\nDirectly connected: ip route N M s0/1/0 (point-to-point serial only).\nFully specified: ip route N M g0/0/1 172.16.2.2 (multi-access).');
  card('15.2', 'IPv6 link-local next hop', 'Must be fully specified: ipv6 route prefix/len exit-intf fe80::2. Otherwise IOS: "%Interface has to be specified for a link-local nexthop".');
  card('15.2', 'Static route verification', 'show ip route, show ip route static, show ip route <network>, show running-config | section ip route, ping, traceroute (and ipv6 versions).');
  card('15.2', 'Prerequisite for IPv6 static routes', 'ipv6 unicast-routing (global).');

  /* =============================== 15.3 =============================== */
  cli('15.3', 'Configure an IPv4 default static route via 172.16.2.2.', 'R1(config)#', 'ip route 0.0.0.0 0.0.0.0 172.16.2.2', 'Also called a quad-zero route.');
  cli('15.3', 'Configure an IPv6 default static route via 2001:db8:acad:2::2.', 'R1(config)#', 'ipv6 route ::/0 2001:db8:acad:2::2', '::/0 matches all IPv6 destinations.');
  mc('15.3', 'What does the asterisk in "S* 0.0.0.0/0 [1/0] via 172.16.2.2" mean?', ['It is a candidate default route', 'It is a floating route', 'It is invalid', 'It was learned by OSPF'], 'That is why it becomes the gateway of last resort.');
  mc('15.3', 'Which router typically uses a default static route?', ['A stub router with one upstream neighbour', 'A core router with many paths', 'A Layer 2 switch', 'A wireless access point'], 'Also an edge router connected to a service provider.');
  mc('15.3', 'How many bits must match for the default route to be used?', ['0', '1', '32', '8'], 'The /0 mask means no bits have to match.');
  tf('15.3', 'A default route is used even when a more specific route matches.', false, 'Longest match first; the default route is the last resort.');
  mc('15.3', 'What is an IPv4 default static route commonly called?', ['A quad-zero route', 'A host route', 'A floating route', 'A summary route'], '0.0.0.0 0.0.0.0.');
  mc('15.3', 'Which line confirms the default route in show ip route?', ['Gateway of last resort is 172.16.2.2 to network 0.0.0.0', 'Gateway of last resort is not set', 'Default gateway is disabled', 'L 0.0.0.0/32'], 'It names the next hop of the default route.');

  card('15.3', 'Default static routes', 'IPv4: ip route 0.0.0.0 0.0.0.0 {next-hop | exit-intf} (quad-zero).\nIPv6: ipv6 route ::/0 {next-hop | exit-intf}.');
  card('15.3', 'Reading a default route', 'S* 0.0.0.0/0 [1/0] via 172.16.2.2: * = candidate default; "Gateway of last resort is 172.16.2.2 to network 0.0.0.0".');
  card('15.3', 'When to use a default static route', 'Edge router to a service provider, or a stub router with one upstream neighbour.');
  card('15.3', 'Why /0 matches everything', 'Zero bits must match, so any destination matches, but only when no more specific route does.');

  /* =============================== 15.4 =============================== */
  mc('15.4', 'How is a floating static route created?', ['By giving it a higher administrative distance than the primary route', 'By giving it a lower administrative distance', 'By using a /32 mask', 'By using the keyword floating'], 'The router installs the lowest AD; the floating route stays hidden.');
  cli('15.4', 'Configure a floating IPv4 default route via 10.10.10.2 with administrative distance 5.', 'R1(config)#', 'ip route 0.0.0.0 0.0.0.0 10.10.10.2 5', 'The primary default route has the default AD of 1.');
  cli('15.4', 'Configure a floating IPv6 default route via 2001:db8:feed:10::2 with administrative distance 5.', 'R1(config)#', 'ipv6 route ::/0 2001:db8:feed:10::2 5', 'The distance argument comes last.');
  mc('15.4', 'While the primary route is up, where can you see the floating static route?', ['Only in the running configuration', 'In show ip route as S*', 'In show ip route as a C route', 'Nowhere; it is deleted'], 'Only the route with the lowest AD is installed in the routing table.');
  mc('15.4', 'The primary link fails. What does show ip route show on R1?', ['S* 0.0.0.0/0 [5/0] via 10.10.10.2', 'S* 0.0.0.0/0 [1/0] via 172.16.2.2', 'No default route', 'O* 0.0.0.0/0 [110/1]'], 'The floating route appears with its AD of 5.');
  mc('15.4', 'A floating static route must back up an OSPF route. Which AD is suitable?', ['115', '100', '1', '0'], 'It must be higher than OSPF\'s 110.');
  tf('15.4', 'By default, static routes are preferred over routes learned by dynamic routing protocols.', true, 'Their default AD is 1.');
  mc('15.4', 'What is the purpose of a floating static route?', ['To provide a backup path when the primary route fails', 'To load-balance across two links', 'To route to a single host', 'To summarise many networks'], 'It is only used when the primary is not available.');

  card('15.4', 'Floating static route', 'A backup route with a higher AD than the primary (e.g. ip route 0.0.0.0 0.0.0.0 10.10.10.2 5). Not in the routing table until the primary disappears.');
  card('15.4', 'Backing up a dynamic route', 'The floating static route\'s AD must be higher than the protocol\'s AD (OSPF 110, EIGRP 90, RIP 120).');
  card('15.4', 'Testing a floating route', 'Fail the primary path; show ip route then shows S* 0.0.0.0/0 [5/0] via the backup next hop.');
  card('15.4', 'Default AD of a static route', '1, so static routes beat dynamic routes unless you raise the AD.');

  /* =============================== 15.5 =============================== */
  mc('15.5', 'What is a host route?', ['An IPv4 address with a /32 mask or an IPv6 address with a /128 prefix', 'Any route learned from a host', 'A route with AD 0', 'The default route'], 'It matches exactly one address.');
  multi('15.5', 'Which three ways can a host route be added to the routing table? (Choose three.)', 3, ['Automatically when an IP address is configured on the router', 'As a static host route', 'Obtained automatically through other methods', 'By ARP', 'By DHCP snooping'], 'Local routes (L) are installed automatically.');
  cli('15.5', 'Configure a static host route to the server 209.165.200.238 via 198.51.100.2.', 'Branch(config)#', 'ip route 209.165.200.238 255.255.255.255 198.51.100.2', 'A host route uses the 255.255.255.255 mask.');
  cli('15.5', 'Configure an IPv6 static host route to 2001:db8:acad:2::238 via 2001:db8:acad:1::2.', 'Branch(config)#', 'ipv6 route 2001:db8:acad:2::238/128 2001:db8:acad:1::2', 'IPv6 host routes use /128.');
  cli('15.5', 'Configure the IPv6 host route to 2001:db8:acad:2::238 through serial 0/1/0 with the ISP link-local next hop fe80::2.', 'Branch(config)#', 'ipv6 route 2001:db8:acad:2::238/128 serial 0/1/0 fe80::2', 'A link-local next hop needs the exit interface.', ['ipv6 route 2001:db8:acad:2::238/128 s0/1/0 fe80::2']);
  mc('15.5', 'Which code marks a host route that IOS installs for an interface address?', ['L', 'C', 'S', 'H'], 'Local routes are /32 (IPv4) or /128 (IPv6).');
  tf('15.5', 'A host route is preferred over a default route for its destination.', true, 'It is the longest possible match.');
  mc('15.5', 'Why does IOS install local host routes?', ['To process packets addressed to the router itself efficiently', 'To forward broadcasts', 'To replace the connected route', 'To provide a default route'], 'They exist in addition to the connected (C) route.');

  card('15.5', 'Host routes', 'IPv4 /32 (255.255.255.255), IPv6 /128. Added automatically (L, local), statically, or by other methods.');
  card('15.5', 'Static host route examples', 'ip route 209.165.200.238 255.255.255.255 198.51.100.2\nipv6 route 2001:db8:acad:2::238/128 2001:db8:acad:1::2');
  card('15.5', 'IPv6 host route with a link-local next hop', 'no ipv6 route … (old route), then ipv6 route 2001:db8:acad:2::238/128 serial 0/1/0 fe80::2.');
  card('15.5', 'Local host routes', 'L entries: one per interface address, so the router recognises packets sent to itself.');
})(typeof window !== 'undefined' ? window : globalThis);
