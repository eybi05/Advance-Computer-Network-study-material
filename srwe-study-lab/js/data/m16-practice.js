/* Module 16 — Troubleshoot Static and Default Routes: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 16.1 =============================== */
  order('16.1', 'Put the steps of PC1\'s packet to PC3 in order.', ['PC1 sends the packet to its default gateway R1', 'R1 decapsulates it, finds a matching route and forwards it to R2', 'R2 processes it the same way and forwards it to R3', 'R3 finds PC3 on a directly connected network and resolves its MAC with ARP', 'R3 forwards the frame to PC3'], 'Every router decapsulates, looks up and re-encapsulates.');
  mc('16.1', 'R1 has no specific route to the destination but has a default static route. What does it do?', ['Uses the default route', 'Drops the packet', 'Floods the packet', 'Sends it back to PC1'], 'The default route is used when no specific route matches.');
  mc('16.1', 'R1 has no matching route and no default route. What does it do?', ['Drops the packet and sends an ICMP message to the source', 'Floods the packet out all interfaces', 'Forwards it to R2 anyway', 'Holds it until a route appears'], 'From the deck.');
  mc('16.1', 'Which router resolves PC3\'s MAC address?', ['R3, the router directly connected to PC3\'s network', 'R1', 'R2', 'PC1'], 'Earlier routers resolve only the next hop\'s MAC.');
  mc('16.1', 'In the frame R3 sends to PC3, what is the source MAC address?', ['The MAC of R3\'s G0/0/0 interface', 'PC1\'s MAC', 'R1\'s MAC', 'R2\'s MAC'], 'The destination MAC is PC3\'s.');
  tf('16.1', 'If R3 has no ARP entry for PC3, it sends an ARP request out its G0/0/0 interface.', true, 'PC3 answers with an ARP reply containing its MAC.');
  mc('16.1', 'What does every router on the path do to the frame it receives?', ['Removes it and builds a new frame for the next link', 'Forwards it unchanged', 'Changes the destination IP address', 'Adds a VLAN tag'], 'The IP packet is kept; the frame is rebuilt per link.');
  tf('16.1', 'R1 resolves PC3\'s MAC address before forwarding the packet to R2.', false, 'R1 resolves only the next hop (R2) on the link it uses.');

  card('16.1', 'Static route lookup outcomes', 'Matches a static route → use its next hop/exit interface. No specific match → default route (if any). No match at all → drop and send ICMP to the source.');
  card('16.1', 'Final hop of a routed packet', 'The last router ARPs for the destination host (if needed) and sends a frame: destination MAC = host, source MAC = its egress interface.');
  card('16.1', 'What changes per hop?', 'The frame (MAC addresses) is rebuilt at every router; the IP packet travels end to end unchanged.');
  card('16.1', 'Packet path PC1 → PC3', 'PC1 → default gateway R1 → R2 → R3 → ARP for PC3 → PC3.');

  /* =============================== 16.2 =============================== */
  match('16.2', 'Match the troubleshooting command to its purpose.', [['ping', 'Verify Layer 3 connectivity'], ['traceroute', 'Verify the path, hop by hop'], ['show ip route', 'Verify route entries'], ['show ip interface brief', 'Verify interface status and addresses'], ['show cdp neighbors', 'List directly connected Cisco devices (Layers 1–2)']], 'Extended pings add options such as the source interface.');
  multi('16.2', 'Which three are reasons networks fail, according to the deck? (Choose three.)', 3, ['An interface fails', 'A service provider drops a connection', 'An administrator enters a wrong configuration', 'STP is enabled', 'IPv6 is configured'], 'Links can also become oversaturated.');
  mc('16.2', 'R2 shows "S 172.16.3.0/24 [1/0] via 192.168.1.1", but 172.16.3.0/24 is behind R1 (172.16.2.1). What is the fix?', ['no ip route 172.16.3.0 255.255.255.0 192.168.1.1, then ip route 172.16.3.0 255.255.255.0 172.16.2.1', 'Add a default route on R2', 'Shut down the link to R3', 'Change the AD to 5'], 'Remove the wrong route and add the right one.');
  cli('16.2', 'Remove the wrong static route to 172.16.3.0/24 via 192.168.1.1.', 'R2(config)#', 'no ip route 172.16.3.0 255.255.255.0 192.168.1.1', 'Type the exact route with no in front of it.');
  cli('16.2', 'Add the correct route to 172.16.3.0/24 via R1 (172.16.2.1).', 'R2(config)#', 'ip route 172.16.3.0 255.255.255.0 172.16.2.1', 'The return path to PC1 now works.');
  mc('16.2', 'Pings from PC1 to PC3 fail, but R1 can ping R2 and R3. What should you check next?', ['The routing tables of the routers, in both directions', 'The PC1 NIC cable', 'The VLAN database', 'The DHCP pool'], 'Links work, so look for a wrong or missing route, including the return path.');
  mc('16.2', 'Which extended ping test does the deck use to check routing from PC1\'s LAN?', ['A ping from R1 sourced from its G0/0/0 interface to PC3', 'A ping from R2 to R1', 'A ping to 255.255.255.255', 'A ping from PC3 to itself'], 'Sourcing from the LAN interface tests the return route to that LAN.');
  tf('16.2', 'If PC1 can reach PC3\'s network, the routers must also know how to send PC3\'s replies back.', false, 'Routing information about a path does not provide return routing information.');
  mc('16.2', 'What does Cisco IOS traceroute rely on to identify each hop?', ['ICMP time exceeded messages', 'ICMP echo replies only', 'ARP replies', 'CDP messages'], 'The deck\'s table says "echo reply"; each hop actually answers with time exceeded.');
  mc('16.2', 'Which command shows directly connected Cisco devices with their IP addresses?', ['show cdp neighbors detail', 'show ip route', 'show arp', 'show interfaces trunk'], 'It also validates Layers 1 and 2.');

  card('16.2', 'Static route troubleshooting commands', 'ping (extended), traceroute, show ip route, show ip interface brief, show cdp neighbors (detail).');
  card('16.2', 'Typical static routing faults', 'Wrong next hop, wrong network or mask, missing return route, wrong or missing default route, interface down.');
  card('16.2', 'Fixing a wrong static route', 'no ip route <exact wrong route>, then ip route <correct route>. Verify with show ip route and ping.');
  card('16.2', 'Deck example fault', 'R2: S 172.16.3.0/24 via 192.168.1.1 (R3) instead of 172.16.2.1 (R1). PC3\'s replies to PC1 went the wrong way.');
})(typeof window !== 'undefined' ? window : globalThis);
