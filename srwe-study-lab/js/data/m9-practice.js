/* Module 9 — FHRP Concepts: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 9.1 =============================== */
  mc('9.1', 'What problem do first hop redundancy protocols solve?', ['Hosts lose off-LAN access when their single default gateway fails', 'Layer 2 loops between switches', 'IP address exhaustion', 'Slow DNS resolution'], 'Hosts have one gateway; an FHRP gives them a virtual one backed by several routers.');
  multi('9.1', 'Which two addresses do the routers in a virtual router group share? (Choose two.)', 2, ['A virtual IP address', 'A virtual MAC address', 'A loopback address', 'A link-local DNS address'], 'Hosts use the virtual IP as gateway and ARP resolves it to the virtual MAC.');
  order('9.1', 'Put the router failover steps in order.', ['The standby router stops seeing Hello messages from the forwarding router', 'The standby router takes over the forwarding role', 'Hosts keep sending to the same virtual IP and MAC without disruption'], 'The new forwarder uses both virtual addresses.');
  match('9.1', 'Match the FHRP to its description.', [['HSRP', 'Cisco proprietary, active and standby router'], ['VRRPv2', 'Non-proprietary, IPv4, virtual router master'], ['GLBP', 'Cisco proprietary with load balancing'], ['IRDP', 'Legacy router discovery, RFC 1256']], 'VRRPv3 adds IPv6; GLBP and HSRP have IPv6 versions too.');
  mc('9.1', 'Which FHRP is non-proprietary and supports both IPv4 and IPv6?', ['VRRPv3', 'HSRP', 'GLBP', 'IRDP'], 'VRRPv3 works in multivendor environments and supports both protocols.');
  mc('9.1', 'Which FHRP provides load balancing across the routers of a group?', ['GLBP', 'HSRP', 'VRRPv2', 'IRDP'], 'GLBP protects like HSRP/VRRP and also shares the load.');
  tf('9.1', 'After an FHRP failover, hosts must clear their ARP caches to reach the new active router.', false, 'The new active router uses the same virtual MAC, so the ARP entries stay valid.');
  mc('9.1', 'What does VRRP call the router that forwards traffic for the virtual router?', ['Virtual router master', 'Active virtual gateway', 'Designated router', 'Root bridge'], 'The other VRRP routers are backups.');
  tf('9.1', 'The physical router that forwards host traffic is transparent to the hosts.', true, 'Hosts only see the virtual IP and MAC.');
  mc('9.1', 'What is "first-hop redundancy"?', ['A network\'s ability to recover dynamically when its default gateway device fails', 'Having two NICs in every host', 'Using two DNS servers', 'Running two STP instances'], 'That is the definition in the deck.');

  card('9.1', 'Why FHRPs?', 'Hosts have one default gateway. If it fails they lose off-LAN access, even if another router is on the LAN. An FHRP makes several routers act as one virtual gateway.');
  card('9.1', 'Virtual router', 'Two or more routers share a virtual IP and virtual MAC. Hosts use the virtual IP as gateway; ARP returns the virtual MAC; the active router forwards.');
  card('9.1', 'FHRP options', 'HSRP and HSRP for IPv6 (Cisco), VRRPv2 (IPv4) and VRRPv3 (IPv4+IPv6, open standard), GLBP and GLBP for IPv6 (Cisco, load balancing), IRDP (legacy).');
  card('9.1', 'Router failover steps', '1. Standby stops seeing Hellos from the forwarder.\n2. Standby takes over forwarding.\n3. It uses the same virtual IP and MAC, so hosts see no disruption.');

  /* =============================== 9.2 =============================== */
  mc('9.2', 'What is the default HSRP priority?', ['100', '0', '128', '255'], 'Default 100, range 0–255.');
  mc('9.2', 'Which router becomes the HSRP active router?', ['The router with the highest priority', 'The router with the lowest priority', 'The router with the lowest IP address', 'The router that booted last'], 'Highest priority wins; ties go to the highest IPv4 address.');
  mc('9.2', 'Two HSRP routers have the same priority. Which becomes active?', ['The one with the highest IPv4 address', 'The one with the lowest IPv4 address', 'The one with the lowest MAC address', 'Neither; HSRP fails'], 'The highest IPv4 address breaks the tie.');
  mc('9.2', 'R1 (priority 150) reboots and R2 (priority 100) becomes active. R1 comes back. When does R1 become active again?', ['Only if standby preempt is configured on R1', 'Immediately, always', 'Never', 'After 300 seconds'], 'Without preemption the current active router keeps the role.');
  tf('9.2', 'With preemption enabled, a router with equal priority and a higher IP address takes over from the current active router.', false, 'Preemption needs a higher priority; a higher IP address alone does not preempt.');
  order('9.2', 'Put the HSRP states in order as a router becomes active.', ['Initial', 'Learn', 'Listen', 'Speak', 'Standby', 'Active'], 'The deck lists the first five; Active is the final state.');
  match('9.2', 'Match the HSRP state to its description.', [['Learn', 'Has not learned the virtual IP or heard the active router'], ['Listen', 'Knows the virtual IP but is neither active nor standby'], ['Speak', 'Sends Hellos and takes part in the election'], ['Standby', 'Candidate to become the next active router']], 'Initial is entered after a config change or when the interface comes up.');
  mc('9.2', 'How often do HSRP routers send Hellos by default?', ['Every 3 seconds', 'Every 2 seconds', 'Every 10 seconds', 'Every 30 seconds'], 'Hellos every 3 s; hold time 10 s.');
  mc('9.2', 'After how many seconds without a Hello does the standby router become active by default?', ['10', '3', '20', '15'], 'The hold time is 10 seconds.');
  cli('9.2', 'Make R1 the preferred HSRP router for group 1 with priority 150.', 'R1(config-if)#', 'standby 1 priority 150', 'standby [group] priority 0-255 in interface configuration mode.');
  cli('9.2', 'Allow R1 to take the active role back when it comes online with a higher priority (group 1).', 'R1(config-if)#', 'standby 1 preempt', 'standby [group] preempt.');
  cli('9.2', 'Set the virtual IP address of HSRP group 1 to 192.168.1.254.', 'R1(config-if)#', 'standby 1 ip 192.168.1.254', 'Hosts use this address as their default gateway.');
  mc('9.2', 'What is the lowest recommended hello timer for HSRP?', ['1 second', '3 seconds', '100 milliseconds', '4 seconds'], 'Do not set the hello below 1 s or the hold time below 4 s.');

  card('9.2', 'HSRP election', 'Highest priority wins (default 100, range 0–255). Tie → highest IPv4 address.');
  card('9.2', 'HSRP preemption', 'standby preempt lets a router with a higher priority take over the active role when it comes online. Equal priority + higher IP does not preempt.');
  card('9.2', 'HSRP states', 'Initial → Learn → Listen → Speak → Standby → Active.');
  card('9.2', 'HSRP timers', 'Hello every 3 s to the group multicast address; hold time 10 s. Do not go below 1 s hello / 4 s hold.');
  card('9.2', 'Basic HSRP configuration', 'interface g0/0/1\n standby 1 ip 192.168.1.254\n standby 1 priority 150\n standby 1 preempt\nVerify: show standby brief');
})(typeof window !== 'undefined' ? window : globalThis);
