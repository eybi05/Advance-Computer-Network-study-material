/* Module 15 — IP Static Routing (SRWE v7, slides in SRWE_Module_15.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm15', num: 15, title: 'IP Static Routing',
    objective: 'Configure IPv4 and IPv6 static routes.',
    deck: 'SRWE_Module_15.pptx',
    topics: [
      /* ------------------------------------------------------------------ 15.1 */
      {
        id: '15.1', title: 'Static Routes',
        objective: 'Describe the command syntax for static routes.', slides: '12–18',
        read: `
<h3>Types of static routes</h3>
<p>Static routes are common, even alongside a dynamic routing protocol. IPv4 and IPv6 both support:</p>
<ul><li>Standard static route</li><li>Default static route</li><li>Floating static route</li><li>Summary static route</li></ul>
<p>They are configured with the <code>ip route</code> and <code>ipv6 route</code> global configuration commands.</p>

<h3>Next-hop options</h3>
<table class="t"><tr><th>Type</th><th>What is specified</th></tr>
<tr><td><b>Next-hop route</b></td><td>Only the next-hop IP address.</td></tr>
<tr><td><b>Directly connected static route</b></td><td>Only the router's exit interface.</td></tr>
<tr><td><b>Fully specified static route</b></td><td>Both the next-hop IP address and the exit interface.</td></tr></table>

<h3>Command syntax</h3>
<pre class="cli">Router(config)# ip route network-address subnet-mask { ip-address | exit-intf [ip-address] } [distance]
Router(config)# ipv6 route ipv6-prefix/prefix-length { ipv6-address | exit-intf [ipv6-address] } [distance]</pre>
<p>Either the next-hop address, the exit interface, or both must be given. <code>distance</code> is the administrative distance (default 1); it is used for floating static routes. Most IPv6 parameters are the same as for IPv4.</p>

<h3>The dual-stack topology</h3>
<p>R1 (LAN 172.16.3.0/24, 2001:db8:acad:3::/64), R2 (LAN 172.16.1.0/24, 2001:db8:acad:1::/64) and R3 (LAN 192.168.2.0/24, 2001:db8:cafe:2::/64). R1–R2 uses 172.16.2.0/24 and 2001:db8:acad:2::/64 (R1 .1, R2 .2); R2–R3 uses 192.168.1.0/24 and 2001:db8:cafe:1::/64 (R2 .2, R3 .1). No static routes yet.</p>
<pre class="cli">R1# show ip route | begin Gateway
Gateway of last resort is not set
     172.16.0.0/16 is variably subnetted, 4 subnets, 2 masks
C       172.16.2.0/24 is directly connected, Serial0/1/0
L       172.16.2.1/32 is directly connected, Serial0/1/0
C       172.16.3.0/24 is directly connected, GigabitEthernet0/0/0
L       172.16.3.1/32 is directly connected, GigabitEthernet0/0/0
R1# ping 172.16.2.2
!!!!!
Success rate is 100 percent (5/5)
R1# ping 192.168.2.1
.....
Success rate is 0 percent (0/5)</pre>
<p>Each router knows only its connected networks: R1 can ping R2 but not the R3 LAN. The IPv6 table is the same; pinging 2001:db8:cafe:2::1 gives <code>% No valid route for destination</code>.</p>`,
        understand: {
          big: 'A static route names a destination prefix and how to reach it: a next-hop address, an exit interface, or both, plus an optional administrative distance.',
          why: 'Knowing the syntax and the three forms of static route is the basis for every static routing task.',
          keys: [
            'Four kinds: standard, default, floating, summary.',
            'Next-hop route: next-hop IP only. Directly connected: exit interface only. Fully specified: both.',
            'ip route network mask {next-hop | exit-intf [next-hop]} [distance].',
            'ipv6 route prefix/length {next-hop | exit-intf [next-hop]} [distance].',
            'Without static or dynamic routes, a router knows only its directly connected networks.',
          ],
          traps: [
            { trap: 'Using a prefix length in ip route (ip route 192.168.2.0/24 …).', fix: 'IPv4 static routes use a dotted subnet mask; only ipv6 route uses /length.' },
            { trap: 'Thinking the distance argument sets the metric.', fix: 'It sets the administrative distance (default 1), used for floating routes.' },
          ],
          analogy: 'A road sign that says "Town X: turn at the next junction (next hop)", "Town X: take exit 3 (exit interface)", or both.',
          explain: [
            { q: 'What are the three ways to specify where a static route sends packets?', a: 'Next-hop IP only, exit interface only (directly connected), or both (fully specified).' },
            { q: 'Why can R1 ping R2 but not the R3 LAN before any routes are added?', a: 'R1 knows only its directly connected networks; it has no route to 192.168.2.0/24.' },
          ],
          widgets: ['routetypes'],
        },
      },
      /* ------------------------------------------------------------------ 15.2 */
      {
        id: '15.2', title: 'Configure IP Static Routes',
        objective: 'Configure IPv4 and IPv6 static routes.', slides: '20–27',
        read: `
<h3>Next-hop static routes</h3>
<p>Only the next-hop address is given; the exit interface is derived from it.</p>
<pre class="cli">R1(config)# ip route 172.16.1.0 255.255.255.0 172.16.2.2
R1(config)# ip route 192.168.1.0 255.255.255.0 172.16.2.2
R1(config)# ip route 192.168.2.0 255.255.255.0 172.16.2.2
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 route 2001:db8:acad:1::/64 2001:db8:acad:2::2
R1(config)# ipv6 route 2001:db8:cafe:1::/64 2001:db8:acad:2::2
R1(config)# ipv6 route 2001:db8:cafe:2::/64 2001:db8:acad:2::2</pre>
<p>The table then shows <code>S 172.16.1.0/24 [1/0] via 172.16.2.2</code> and the IPv6 equivalents.</p>

<h3>Directly connected static routes</h3>
<p>The exit interface replaces the next hop:</p>
<pre class="cli">R1(config)# ip route 172.16.1.0 255.255.255.0 s0/1/0
R1(config)# ipv6 route 2001:db8:acad:1::/64 s0/1/0</pre>
<p>The table shows <code>S 172.16.1.0/24 is directly connected, Serial0/1/0</code>. A next-hop address is generally recommended; use directly connected static routes <b>only with point-to-point serial interfaces</b>.</p>

<h3>Fully specified static routes</h3>
<p>Both the exit interface and the next hop. Use it when the exit interface is a <b>multi-access</b> interface (Ethernet) and the next hop must be identified explicitly. The next hop must be directly connected to that exit interface.</p>
<pre class="cli">R1(config)# ip route 172.16.1.0 255.255.255.0 GigabitEthernet 0/0/1 172.16.2.2</pre>
<p>For IPv6 there is a case where a fully specified route is <b>required</b>: when the next hop is a <b>link-local</b> address.</p>
<pre class="cli">R1(config)# ipv6 route 2001:db8:acad:1::/64 fe80::2
%Interface has to be specified for a link-local nexthop
R1(config)# ipv6 route 2001:db8:acad:1::/64 s0/1/0 fe80::2</pre>
<p>Link-local addresses are not in the routing table and are only unique on one link; the same next-hop link-local address could exist on several networks. The table entry shows both: <code>via FE80::2, Serial0/1/0</code>.</p>

<h3>Verify static routes</h3>
<ul>
  <li><code>show ip route</code>, <code>show ipv6 route</code>, <code>ping</code>, <code>traceroute</code></li>
  <li><code>show ip route static</code></li>
  <li><code>show ip route <i>network</i></code></li>
  <li><code>show running-config | section ip route</code></li>
</ul>
<p>Replace <code>ip</code> with <code>ipv6</code> for the IPv6 versions.</p>`,
        understand: {
          big: 'Prefer next-hop static routes; use exit-interface-only routes just on point-to-point serial links; use fully specified routes on Ethernet when you must, and always for an IPv6 link-local next hop.',
          why: 'Configuring and verifying static routes is the main hands-on skill of modules 15 and 16.',
          keys: [
            'Next-hop: ip route 172.16.1.0 255.255.255.0 172.16.2.2.',
            'Directly connected: ip route … s0/1/0 (point-to-point serial only).',
            'Fully specified: ip route … g0/0/1 172.16.2.2.',
            'IPv6 needs ipv6 unicast-routing; a link-local next hop requires the exit interface.',
            'Verify: show ip route static, show ip route network, show running-config | section ip route, ping, traceroute.',
          ],
          traps: [
            { trap: 'ipv6 route 2001:db8:acad:1::/64 fe80::2 without an interface.', fix: 'IOS rejects it: a link-local next hop needs the exit interface.' },
            { trap: 'Using exit-interface-only static routes on Ethernet.', fix: 'Use a next hop (or fully specified) on multi-access interfaces.' },
            { trap: 'Forgetting ipv6 unicast-routing before IPv6 static routes.', fix: 'Without it the router does not forward IPv6 packets.' },
          ],
          analogy: 'On a private road (point-to-point serial) "take the road out" is enough; at a busy junction (Ethernet) you must name the house (next hop) too.',
          explain: [
            { q: 'Why is a fully specified route required for a link-local next hop?', a: 'Link-local addresses are only unique per link and not in the routing table, so IOS needs the exit interface to know which link.' },
            { q: 'What does the routing table show for a directly connected static route?', a: 'S network/len is directly connected, exit-interface.' },
            { q: 'Name two commands that show only the static routes.', a: 'show ip route static and show running-config | section ip route.' },
          ],
          widgets: ['routetypes'],
        },
      },
      /* ------------------------------------------------------------------ 15.3 */
      {
        id: '15.3', title: 'Configure IP Default Static Routes',
        objective: 'Configure IPv4 and IPv6 default static routes.', slides: '29–33',
        read: `
<h3>Default static route</h3>
<p>A default route matches <b>all</b> packets: one route that represents every network not in the routing table. It is used as the <b>gateway of last resort</b>. Default static routes are common on an edge router connected to a service provider, and on a <b>stub router</b> (one with only one upstream neighbour).</p>
<pre class="cli">Router(config)# ip route 0.0.0.0 0.0.0.0 {ip-address | exit-intf}
Router(config)# ipv6 route ::/0 {ipv6-address | exit-intf}</pre>
<p>An IPv4 default route is often called a <b>quad-zero</b> route: 0.0.0.0 0.0.0.0 matches any address.</p>

<h3>Configure and verify</h3>
<pre class="cli">R1(config)# ip route 0.0.0.0 0.0.0.0 172.16.2.2
R1(config)# ipv6 route ::/0 2001:db8:acad:2::2
R1# show ip route static
Gateway of last resort is 172.16.2.2 to network 0.0.0.0
S*    0.0.0.0/0 [1/0] via 172.16.2.2
R1# show ipv6 route static
S   ::/0 [1/0]
     via 2001:DB8:ACAD:2::2</pre>
<p>The <b>asterisk</b> after S marks a <b>candidate default route</b>, which is why it is chosen as the gateway of last resort. The <b>/0</b> mask means no bits have to match: as long as there is no more specific match, the default route matches every packet. The same is true for <b>::/0</b> in IPv6.</p>`,
        understand: {
          big: 'A default route (0.0.0.0/0, ::/0) matches every destination with zero bits, so it catches all traffic that no longer route matches: perfect for stub and edge routers.',
          why: 'Almost every branch or edge router has a default route towards its ISP or upstream router.',
          keys: [
            'ip route 0.0.0.0 0.0.0.0 next-hop (quad-zero). ipv6 route ::/0 next-hop.',
            'Used on stub routers and edge routers towards an ISP.',
            'S* = static candidate default; "Gateway of last resort is X to network 0.0.0.0".',
            'Used only when no more specific route matches (longest match first).',
          ],
          traps: [
            { trap: 'Thinking the default route overrides more specific routes.', fix: 'Longest match always wins; the default route is the last resort.' },
            { trap: 'Writing ipv6 route 0::0/128 for a default.', fix: 'The IPv6 default is ::/0.' },
          ],
          analogy: 'The "all other destinations" counter at an airport: you only go there if your city is not listed on any other gate.',
          explain: [
            { q: 'Why do stub routers usually need only a default route?', a: 'They have a single upstream neighbour, so all non-local traffic goes the same way.' },
            { q: 'What does the asterisk in S* mean?', a: 'The static route is a candidate default route, used as the gateway of last resort.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 15.4 */
      {
        id: '15.4', title: 'Configure Floating Static Routes',
        objective: 'Configure a floating static route to provide a backup connection.', slides: '35–37',
        read: `
<h3>Floating static routes</h3>
<ul>
  <li>A floating static route is a <b>backup path</b> for a primary static or dynamic route, used only when the primary is not available.</li>
  <li>It is configured with a <b>higher administrative distance</b> than the primary. If several paths exist, the router installs the one with the <b>lowest AD</b>.</li>
  <li>Static routes have AD <b>1</b> by default, so they beat dynamic routes. Raising a static route's AD makes it less desirable than another static route or a dynamic route, so it "floats" and stays out of the table while the better route is active.</li>
</ul>

<h3>Configure IPv4 and IPv6 floating static routes</h3>
<pre class="cli">R1(config)# ip route 0.0.0.0 0.0.0.0 172.16.2.2
R1(config)# ip route 0.0.0.0 0.0.0.0 10.10.10.2 5
R1(config)# ipv6 route ::/0 2001:db8:acad:2::2
R1(config)# ipv6 route ::/0 2001:db8:feed:10::2 5</pre>
<p><code>show ip route</code> and <code>show ipv6 route</code> list only the default routes via R2 (AD 1). The floating routes via R3 (AD 5) are <b>not</b> in the routing table.</p>

<h3>Test the floating static routes</h3>
<p>If R2 fails (here simulated by shutting down both of R2's serial interfaces), R1 logs that the link went down and its routing table now uses the backup:</p>
<pre class="cli">R1# show ip route static | begin Gateway
Gateway of last resort is 10.10.10.2 to network 0.0.0.0
S*    0.0.0.0/0 [5/0] via 10.10.10.2
R1# show ipv6 route static | begin ::
S   ::/0 [5/0]
     via 2001:DB8:FEED:10::2</pre>
<div class="note">The 10.10.10.0 and 2001:db8:feed:10:: backup link between R1 and R3 is not drawn in the deck's dual-stack topology figure; it is an extra link used only for this example.</div>`,
        understand: {
          big: 'A floating static route is a backup with a deliberately higher administrative distance: it stays hidden while the primary route exists and appears in the table only when the primary disappears.',
          why: 'Floating routes are the simplest way to add a backup path, and the AD rule is tested often.',
          keys: [
            'Backup path for a primary static or dynamic route.',
            'Configure with a higher AD: ip route 0.0.0.0 0.0.0.0 10.10.10.2 5.',
            'The lowest AD is installed; the floating route stays out of the table.',
            'When the primary fails, the floating route appears: S* 0.0.0.0/0 [5/0].',
            'To back up a dynamic route, the floating AD must be higher than that protocol\'s AD (e.g. above 110 for OSPF).',
          ],
          traps: [
            { trap: 'Expecting to see the floating route in show ip route while the primary is up.', fix: 'Only the route with the lowest AD is installed; the floating route is visible only in the configuration.' },
            { trap: 'Giving the backup route a lower AD than the primary.', fix: 'Then the backup becomes the primary. The floating route needs the higher AD.' },
          ],
          analogy: 'A spare tyre in the boot: it is there all the time, but you only drive on it when the main tyre is flat.',
          explain: [
            { q: 'Why is the floating route not in the routing table normally?', a: 'A route to the same prefix with a lower AD (the primary) is installed instead.' },
            { q: 'What AD would a floating static route need to back up an OSPF route?', a: 'Higher than 110, OSPF\'s administrative distance.' },
          ],
          widgets: ['adfloat'],
        },
      },
      /* ------------------------------------------------------------------ 15.5 */
      {
        id: '15.5', title: 'Configure Static Host Routes',
        objective: 'Configure IPv4 and IPv6 static host routes that direct traffic to a specific host.', slides: '39–44',
        read: `
<h3>Host routes</h3>
<p>A <b>host route</b> is an IPv4 address with a <b>32-bit</b> mask or an IPv6 address with a <b>128-bit</b> mask. It can be added to the routing table three ways:</p>
<ul>
  <li>Automatically, when an IP address is configured on the router (local route).</li>
  <li>As a static host route.</li>
  <li>Obtained automatically through other methods (later courses).</li>
</ul>

<h3>Automatically installed host routes</h3>
<p>IOS installs a <b>local host route</b> (code <b>L</b>) for every interface address, in addition to the connected route (C). It lets the router process packets addressed <b>to itself</b> efficiently.</p>

<h3>Static host routes</h3>
<p>A manually configured route to one destination device, such as a server: mask 255.255.255.255 (/32) for IPv4 and /128 for IPv6.</p>
<pre class="cli">Branch(config)# ip route 209.165.200.238 255.255.255.255 198.51.100.2
Branch(config)# ipv6 route 2001:db8:acad:2::238/128 2001:db8:acad:1::2
Branch(config)# exit</pre>
<p>Both tables show the host routes as static (S) entries, /32 and /128.</p>

<h3>IPv6 static host route with a link-local next hop</h3>
<p>The next hop can be the adjacent router's link-local address, but then the exit interface must be given. First remove the original route, then configure a fully specified one:</p>
<pre class="cli">Branch(config)# no ipv6 route 2001:db8:acad:2::238/128 2001:db8:acad:1::2
Branch(config)# ipv6 route 2001:db8:acad:2::238/128 serial 0/1/0 fe80::2</pre>`,
        understand: {
          big: 'A host route matches exactly one address (/32 or /128); routers create local host routes for their own addresses, and you can add static host routes to steer traffic for one server.',
          why: 'Host routes demonstrate longest match at its extreme and are a configuration objective of the module.',
          keys: [
            'Host route: IPv4 /32 (255.255.255.255), IPv6 /128.',
            'Local host routes (L) are installed automatically for interface addresses.',
            'Static host route: ip route 209.165.200.238 255.255.255.255 next-hop.',
            'IPv6: ipv6 route address/128 next-hop; with a link-local next hop also give the exit interface.',
            'A host route is the longest possible match, so it wins over any shorter route.',
          ],
          traps: [
            { trap: 'Using mask 255.255.255.0 for a host route.', fix: 'A host route uses 255.255.255.255 (/32).' },
            { trap: 'Adding the link-local version without removing the old IPv6 route.', fix: 'The deck removes the original route with no ipv6 route first.' },
          ],
          analogy: 'A host route is a sign for one specific building, more precise than any sign for the district or city around it.',
          explain: [
            { q: 'Why does a router install L routes?', a: 'To recognise packets addressed to its own interfaces efficiently; they are /32 or /128 host routes.' },
            { q: 'A default route and a host route both match a packet. Which is used?', a: 'The host route, because it is the longest match.' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
