/* Module 14 — Routing Concepts: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 14.1 =============================== */
  mc('14.1', 'A packet for 172.16.0.10 matches 172.16.0.0/12, 172.16.0.0/18 and 172.16.0.0/26. Which route is used?', ['172.16.0.0/26', '172.16.0.0/12', '172.16.0.0/18', 'The default route'], 'The longest match (most matching far-left bits) is always preferred.');
  mc('14.1', 'Destination 2001:db8:c000::99. Which entry does NOT match?', ['2001:db8:c000:5555::/64', '2001:db8:c000::/40', '2001:db8:c000::/48', 'All three match'], 'A /64 needs 64 matching bits; the fourth hextet differs.');
  multi('14.1', 'What are the two primary functions of a router? (Choose two.)', 2, ['Determine the best path to forward packets', 'Forward packets toward their destination', 'Assign MAC addresses', 'Prevent Layer 2 loops'], 'Path determination and packet forwarding.');
  mc('14.1', 'When is a directly connected network added to the routing table?', ['When the interface has an IP address and mask and is up and up', 'As soon as a cable is plugged in', 'After ipv6 unicast-routing', 'Only after a static route is added'], 'Both conditions are required.');
  mc('14.1', 'What prefix length does a default route have?', ['/0', '/32', '/8', '/128'], 'No bits need to match, so it matches every destination.');
  tf('14.1', 'The longest match is always the preferred route.', true, 'It is the most specific route that matches.');
  mc('14.1', 'What is another name for the default route?', ['Gateway of last resort', 'Local route', 'Child route', 'Floating route'], 'show ip route shows "Gateway of last resort is …".');
  multi('14.1', 'Which two ways does a router learn about remote networks? (Choose two.)', 2, ['Static routes', 'Dynamic routing protocols', 'ARP', 'DHCP'], 'Directly connected networks come from the interfaces themselves.');
  mc('14.1', 'A packet for 10.1.1.5 matches 10.0.0.0/8, 10.1.0.0/16 and 0.0.0.0/0. Which route is used?', ['10.1.0.0/16', '10.0.0.0/8', '0.0.0.0/0', 'None; the packet is dropped'], '16 matching bits is the longest match.');

  card('14.1', 'Longest match', 'The route whose prefix matches the most far-left bits of the destination address. Always preferred.');
  card('14.1', 'How a router builds its routing table', 'Directly connected networks (interface with address, up/up), remote networks via static routes or dynamic routing protocols, and a default route.');
  card('14.1', 'Default route', '0.0.0.0/0 or ::/0. Matches everything with 0 bits; used when nothing more specific matches. Also called the gateway of last resort.');
  card('14.1', 'When does a route match?', 'When at least prefix-length far-left bits of the destination equal the route prefix.');

  /* =============================== 14.2 =============================== */
  order('14.2', 'Put the packet forwarding decision process in order.', ['The frame arrives on the ingress interface', 'The router examines the destination IP and consults its routing table', 'The router finds the longest matching prefix', 'The router encapsulates the packet in a new frame and forwards it out the egress interface'], 'No match and no default route: drop.');
  multi('14.2', 'After choosing a route, which three things can a router do with a packet? (Choose three.)', 3, ['Forward it to a device on a directly connected network', 'Forward it to a next-hop router', 'Drop it', 'Flood it out every interface', 'Return it to the sender unchanged'], 'Routers never flood.');
  mc('14.2', 'A router forwards a packet to a remote network over Ethernet. Whose MAC address does it need?', ['The next-hop router\'s', 'The final destination host\'s', 'Its own', 'The broadcast MAC'], 'It looks up the next hop in its ARP table or neighbor cache.');
  mc('14.2', 'Which is the default packet forwarding mechanism on Cisco routers today?', ['Cisco Express Forwarding (CEF)', 'Process switching', 'Fast switching', 'Store-and-forward'], 'CEF uses a FIB and an adjacency table.');
  match('14.2', 'Match the forwarding mechanism to its description.', [['Process switching', 'The CPU looks up every packet'], ['Fast switching', 'Caches the result of the first packet of a flow'], ['CEF', 'Prebuilt FIB and adjacency table, change-triggered']], 'CEF is the most recent and the default.');
  tf('14.2', 'The source and destination IP addresses of a packet change at every router.', false, 'Only the data link frame is rebuilt at each hop.');
  mc('14.2', 'Which two tables does CEF build?', ['FIB and adjacency table', 'MAC table and ARP table', 'Topology table and neighbor table', 'CAM and TCAM'], 'They are updated when the topology changes, not per packet.');
  mc('14.2', 'Which Layer 2 protocols might a router use on a serial link?', ['PPP or HDLC', 'Ethernet only', '802.11', 'CSMA/CA'], 'The packet is encapsulated in the right frame type for each outgoing interface.');
  mc('14.2', 'What does a router do with a packet that has no matching route and there is no default route?', ['Drops it', 'Floods it', 'Sends it to the switch', 'Queues it until a route appears'], 'It also sends an ICMP message back to the source (module 16).');

  card('14.2', 'Packet forwarding decision', 'Ingress frame → destination IP → longest match → new frame → egress. Connected: resolve the destination MAC. Remote: resolve the next hop\'s MAC. No match: drop.');
  card('14.2', 'Process switching vs fast switching vs CEF', 'Process: CPU per packet. Fast: cache after the first packet. CEF (default): FIB + adjacency table, change-triggered.');
  card('14.2', 'What changes at each hop?', 'The data link frame (source/destination MAC, frame type). The IP packet and its addresses stay the same.');
  card('14.2', 'MAC resolution when forwarding', 'Directly connected destination: ARP/ND for the destination. Remote destination: ARP/ND for the next-hop router.');

  /* =============================== 14.3 =============================== */
  cli('14.3', 'Stop log messages from interrupting your typing on the console line.', 'R1(config-line)#', 'logging synchronous', 'A console line command.');
  cli('14.3', 'Allow both SSH and Telnet on the vty lines.', 'R1(config-line)#', 'transport input ssh telnet', 'The deck allows both in its review configuration.', ['transport input telnet ssh']);
  cli('14.3', 'Give this interface the link-local address fe80::1:a.', 'R1(config-if)#', 'ipv6 address fe80::1:a link-local', 'The link-local keyword is required.');
  cli('14.3', 'Show only the vty section of the running configuration.', 'R1#', 'show running-config | section line vty', '| section shows the whole section.');
  match('14.3', 'Match the output filter to what it shows.', [['section', 'The whole section that starts with the expression'], ['include', 'Only lines that match'], ['exclude', 'All lines except those that match'], ['begin', 'Everything from the first matching line']], 'Filters work with any show command.');
  multi('14.3', 'Which three commands verify a router\'s interfaces and routes? (Choose three.)', 3, ['show ip interface brief', 'show ip route', 'show running-config interface g0/0/0', 'show vlan brief', 'show mac address-table'], 'Also show interfaces, show ip interface and ping.');
  mc('14.3', 'How do you get the IPv6 version of show ip interface brief?', ['show ipv6 interface brief', 'show ip interface brief ipv6', 'show interfaces ipv6', 'show ipv6 brief'], 'Replace ip with ipv6.');
  tf('14.3', 'Router interfaces are up by default after you configure an IP address.', false, 'They need no shutdown.');
  mc('14.3', 'Which command saves the configuration so it survives a reload?', ['copy running-config startup-config', 'write terminal', 'show startup-config', 'reload'], 'The prompt asks for the destination filename [startup-config].');
  tf('14.3', 'Output filters such as | include can be used with any show command.', true, 'The deck notes that filters work in combination with any show command.');
  cli('14.3', 'Show only the lines of show ip interface brief that contain "up".', 'R1#', 'show ip interface brief | include up', '| include keeps matching lines.');

  card('14.3', 'Router baseline configuration', 'hostname, enable secret, line con 0 (logging synchronous, password, login), line vty 0 4 (password, login, transport input), service password-encryption, banner motd, ipv6 unicast-routing, interfaces (description, ip/ipv6 address, link-local, no shutdown), copy run start.');
  card('14.3', 'Router verification commands', 'show ip interface brief, show running-config interface X, show interfaces, show ip interface, show ip route, ping (and the ipv6 versions).');
  card('14.3', 'Output filters', '| section (whole section), | include (matching lines), | exclude (non-matching lines), | begin (from the first match).');
  card('14.3', 'Manual link-local address', 'ipv6 address fe80::1:a link-local (interface configuration).');

  /* =============================== 14.4 =============================== */
  match('14.4', 'Match the routing table code to its meaning.', [['L', 'Address assigned to a router interface'], ['C', 'Directly connected network'], ['S', 'Static route'], ['O', 'Learned through OSPF']], 'An asterisk marks a candidate default route.');
  mc('14.4', 'In "O 10.0.4.0/24 [110/50] via 10.0.3.2, 00:24:22, Serial0/1/1", what is 110?', ['The administrative distance', 'The metric', 'The hop count', 'The prefix length'], '[AD/metric].');
  mc('14.4', 'In the same entry, what is 50?', ['The metric', 'The administrative distance', 'The age of the route in seconds', 'The OSPF process ID'], 'Lower metrics are preferred.');
  match('14.4', 'Match the route source to its administrative distance.', [['Directly connected', '0'], ['Static route', '1'], ['OSPF', '110'], ['RIP', '120']], 'Internal EIGRP is 90, eBGP 20, iBGP 200.');
  mc('14.4', 'What prefix length does an IPv4 local route (L) have?', ['/32', '/24', '/0', '/128'], 'IPv6 local routes are /128.');
  mc('14.4', 'R1 can reach PC3\'s network but PC3\'s replies never arrive. Which routing table principle explains this?', ['Routing information about a path does not provide return routing information', 'Every router uses the same routing table', 'Static routes cannot be used for return traffic', 'Local routes are always /32'], 'Each router needs its own route back.');
  mc('14.4', 'Which route source is preferred: OSPF with metric 20, or a static route?', ['The static route, because its AD (1) is lower than OSPF\'s (110)', 'OSPF, because its metric is lower', 'Both are installed', 'Neither'], 'Different sources are compared by AD.');
  multi('14.4', 'Which three are primary uses of static routes? (Choose three.)', 3, ['Easy maintenance in small networks', 'A default route to any network without a more specific match', 'Routing to and from stub networks', 'Automatic rerouting after failures', 'Large, frequently changing networks'], 'Static routes do not adapt automatically.');
  tf('14.4', 'In the IPv4 routing table, directly connected networks always appear as child routes.', true, 'Because the local /32 address is a subnet of the classful network.');
  mc('14.4', 'Which next-hop address do IPv6 routing protocols use?', ['The next-hop router\'s link-local address', 'The next-hop router\'s GUA', 'ff02::1', 'The router\'s own loopback'], 'For example "via FE80::2:C, Serial0/1/1".');
  mc('14.4', 'What is a stub network?', ['A network accessed by a single route, through a router with only one neighbour', 'A network with no hosts', 'A network running OSPF', 'A network with two default routes'], 'Static routes are ideal for stub networks.');

  card('14.4', 'Routing table codes', 'L local (/32 or /128), C connected, S static, O OSPF, * candidate default.');
  card('14.4', 'Parts of a routing table entry', 'Route source, destination prefix/length, [AD/metric], next hop, timestamp, exit interface.');
  card('14.4', 'Administrative distances', 'Connected 0, static 1, EIGRP summary 5, eBGP 20, internal EIGRP 90, OSPF 110, IS-IS 115, RIP 120, external EIGRP 170, iBGP 200.');
  card('14.4', 'Three routing table principles', '1. Every router decides alone from its own table. 2. Tables differ between routers. 3. A path to a network does not provide the return path.');
  card('14.4', 'Parent and child routes', 'IPv4 tables keep the classful layout: a parent line (classful network, "is subnetted", no code) with indented child routes (the actual subnets). IPv6 tables are flat.');

  /* =============================== 14.5 =============================== */
  match('14.5', 'Match each feature to the correct statement from the static vs dynamic comparison.', [['Topology changes, dynamic routing', 'Adapts automatically'], ['Resource usage, static routing', 'No additional resources needed'], ['Security, dynamic routing', 'Must be configured'], ['Path predictability, static routing', 'Explicitly defined by the administrator']], 'Most networks use both.');
  multi('14.5', 'Which two are typical reasons to use static routes? (Choose two.)', 2, ['A default route to a service provider', 'Routing between stub networks', 'A network of hundreds of routers', 'Automatic failover after link failures'], 'Dynamic protocols handle the last two.');
  match('14.5', 'Match the protocol to its type.', [['RIPv2', 'Distance vector IGP'], ['OSPFv2', 'Link-state IGP'], ['BGP-4', 'Path vector EGP'], ['IS-IS', 'Link-state IGP for large networks']], 'EIGRP is also distance vector.');
  mc('14.5', 'Which is the only Exterior Gateway Protocol?', ['BGP', 'OSPF', 'EIGRP', 'RIP'], 'BGP exchanges routes between autonomous systems.');
  match('14.5', 'Match the protocol to its metric.', [['RIP', 'Hop count, maximum 15'], ['OSPF', 'Cost based on bandwidth'], ['EIGRP', 'Slowest bandwidth and delay']], 'Lowest metric = best path.');
  mc('14.5', 'Which protocol supports unequal-cost load balancing?', ['EIGRP', 'OSPF', 'RIP', 'BGP'], 'Equal-cost load balancing is automatic in dynamic protocols.');
  multi('14.5', 'Which three are main components of a dynamic routing protocol? (Choose three.)', 3, ['Data structures', 'Routing protocol messages', 'Algorithm', 'Access control lists', 'VLAN database'], 'Tables in RAM, messages between routers, and the best-path algorithm.');
  mc('14.5', 'How can static routes achieve equal-cost load balancing?', ['Configure several static routes to the same network with different next hops', 'Use the distance argument', 'Use ip route 0.0.0.0', 'They cannot'], 'The router then uses both exit interfaces.');
  tf('14.5', 'Dynamic routing protocols use CPU, memory and link bandwidth.', true, 'Static routes need no extra resources.');
  mc('14.5', 'Which IPv6 protocols correspond to RIPv2 and OSPFv2?', ['RIPng and OSPFv3', 'RIPv3 and OSPFv6', 'EIGRP and IS-IS', 'BGP-MP and RIPv1'], 'EIGRP for IPv6, IS-IS for IPv6 and BGP-MP complete the table.');

  card('14.5', 'Static vs dynamic routing', 'Static: simple, secure, predictable, no extra resources, but manual and does not scale.\nDynamic: adapts and scales, but uses CPU/memory/bandwidth and needs security configured.');
  card('14.5', 'Routing protocol classification', 'IGP distance vector: RIPv2/RIPng, EIGRP. IGP link-state: OSPFv2/v3, IS-IS. EGP path vector: BGP-4/BGP-MP.');
  card('14.5', 'Metrics', 'RIP: hop count (max 15). OSPF: cost (cumulative bandwidth). EIGRP: slowest bandwidth + delay (optionally load, reliability).');
  card('14.5', 'Load balancing', 'Equal-cost: automatic in dynamic protocols; static routes with different next hops. Unequal-cost: EIGRP only.');
  card('14.5', 'Purpose of dynamic routing protocols', 'Discover remote networks, keep routing information up to date, choose the best path, find a new path when the current one fails.');
})(typeof window !== 'undefined' ? window : globalThis);
