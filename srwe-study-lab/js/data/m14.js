/* Module 14 — Routing Concepts (SRWE v7, slides in SRWE_Module_14.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm14', num: 14, title: 'Routing Concepts',
    objective: 'Explain how routers use information in packets to make forwarding decisions.',
    deck: 'SRWE_Module_14.pptx',
    topics: [
      /* ------------------------------------------------------------------ 14.1 */
      {
        id: '14.1', title: 'Path Determination',
        objective: 'Explain how routers determine the best path.', slides: '12–17',
        read: `
<h3>Two functions of a router</h3>
<p>When a router receives an IP packet, it decides which interface to send it out of: this is <b>routing</b>. The exit may lead to the final destination or to another router. Each network a router connects to usually needs a separate interface. The router's two primary functions are to <b>determine the best path</b> using its routing table and to <b>forward packets</b> toward their destination.</p>

<h3>Best path = longest match</h3>
<ul>
  <li>Route entries are a <b>prefix</b> (network address) and a <b>prefix length</b>. For a match, a minimum number of far-left bits must be the same in the packet's destination address and the route; the prefix length sets that minimum.</li>
  <li>The <b>longest match</b> is the route with the greatest number of matching far-left bits. The longest match is <b>always</b> the preferred route.</li>
  <li>"Prefix length" is used for the network portion of both IPv4 and IPv6 addresses.</li>
</ul>

<h3>IPv4 longest match example</h3>
<p>Destination 172.16.0.10 (10101100.00010000.00000000.00001010) matches three entries:</p>
<table class="t"><tr><th>Route</th><th>Prefix in binary (first bits that must match)</th><th>Match?</th></tr>
<tr><td>172.16.0.0/12</td><td>10101100.0001</td><td>Yes, 12 bits</td></tr>
<tr><td>172.16.0.0/18</td><td>10101100.00010000.00</td><td>Yes, 18 bits</td></tr>
<tr><td>172.16.0.0/26</td><td>10101100.00010000.00000000.00</td><td>Yes, 26 bits: <b>longest match</b></td></tr></table>
<div class="errata"><b>Slide errata (slide 15):</b> the "Address in Binary" column repeats the destination address (…00001010) for all three route entries. The route prefixes are all 172.16.0.0, which in binary ends in …00000000; only the first /12, /18 or /26 bits are compared.</div>

<h3>IPv6 longest match example</h3>
<p>Destination 2001:db8:c000::99. Entry 2001:db8:c000::/40 matches 40 bits; 2001:db8:c000::/48 matches 48 bits (<b>longest match</b>); 2001:db8:c000:5555::/64 does <b>not</b> match, because its /64 needs 64 matching bits and the fourth hextet differs (0000 vs 5555).</p>

<h3>Building the routing table</h3>
<ul>
  <li><b>Directly connected networks</b>: added when a local interface has an IP address and mask and is <b>up and up</b>.</li>
  <li><b>Remote networks</b>: learned through <b>static routes</b> (configured manually) or <b>dynamic routing protocols</b>.</li>
  <li><b>Default route</b>: the next hop to use when no specific route matches. It can be static or learned dynamically. It has a <b>/0</b> prefix length, so no bits need to match: it is used when nothing matches more than 0 bits. It is also called the <b>gateway of last resort</b>.</li>
</ul>`,
        understand: {
          big: 'A router picks the route whose prefix matches the most leftmost bits of the destination (longest match); a /0 default route matches everything and is used only when nothing longer does.',
          why: 'Longest match is how every routing decision is made, and longest-match questions appear on every routing exam.',
          keys: [
            'Router functions: determine the best path, forward packets.',
            'A route matches if at least prefix-length leftmost bits match.',
            'Longest match (most matching bits) always wins.',
            'Routing table sources: directly connected (interface up/up), static, dynamic.',
            'Default route: 0.0.0.0/0 or ::/0, the gateway of last resort.',
          ],
          traps: [
            { trap: 'Choosing the route with the smallest network or the lowest administrative distance first.', fix: 'Among routes in the table, the most specific prefix (longest match) wins.' },
            { trap: 'Thinking a directly connected route appears as soon as an address is configured.', fix: 'The interface must also be up and up.' },
            { trap: 'Counting a /64 route as a match when only 48 bits agree.', fix: 'All 64 bits must match for a /64 route.' },
          ],
          analogy: 'Sorting mail: "Europe" fits, "Germany" fits better, "Berlin, Unter den Linden" fits best. The most specific address that still matches wins; "anywhere else" is the default.',
          explain: [
            { q: 'Destination 10.1.1.5 matches 10.0.0.0/8 and 10.1.1.0/24. Which route is used?', a: '10.1.1.0/24, because 24 matching bits is longer than 8.' },
            { q: 'When is the default route used?', a: 'Only when no other route matches more than 0 bits of the destination.' },
            { q: 'What two conditions add a directly connected network to the table?', a: 'An IP address and mask on the interface, and the interface being up and up.' },
          ],
          widgets: ['longestmatch'],
        },
      },
      /* ------------------------------------------------------------------ 14.2 */
      {
        id: '14.2', title: 'Packet Forwarding',
        objective: 'Explain how routers forward packets to the destination.', slides: '19–27',
        read: `
<h3>Packet forwarding decision process</h3>
<ol class="steps">
  <li>The data link frame with the IP packet arrives on the <b>ingress</b> interface.</li>
  <li>The router examines the destination IP address and consults its routing table.</li>
  <li>It finds the <b>longest matching prefix</b>.</li>
  <li>It encapsulates the packet in a new data link frame and forwards it out the <b>egress</b> interface, to the destination device or a next-hop router.</li>
</ol>
<p>If no route matches, the packet is dropped.</p>

<h3>Three possible outcomes</h3>
<ul>
  <li><b>Forward to a device on a directly connected network</b>: the router delivers the packet itself. On Ethernet it needs the destination's MAC address: <b>ARP</b> for IPv4, ICMPv6 Neighbor Discovery for IPv6.</li>
  <li><b>Forward to a next-hop router</b>: the destination is remote, so the packet goes to the next hop in the route entry. On Ethernet the router looks up the <b>next hop's</b> MAC address (ARP table or neighbor cache), not the destination's.</li>
  <li><b>Drop the packet</b>: no matching route and no default route.</li>
</ul>

<h3>End-to-end packet forwarding</h3>
<p>The forwarding function's main job is to <b>encapsulate</b> the packet in the right data link frame for the outgoing interface: Ethernet on a LAN, or for example PPP or HDLC on a serial link. At every hop the router strips the old frame and builds a new one; the IP packet itself travels end to end.</p>

<h3>Packet forwarding mechanisms</h3>
<table class="t"><tr><th>Mechanism</th><th>How it works</th></tr>
<tr><td><b>Process switching</b></td><td>Older. Every packet goes to the control plane, where the CPU looks up the routing table and chooses the exit interface, <b>for every packet</b>, even in the same stream.</td></tr>
<tr><td><b>Fast switching</b></td><td>Successor to process switching. The first packet of a flow is process-switched and the result stored in a <b>fast-switching cache</b>; later packets to the same destination reuse it without the CPU.</td></tr>
<tr><td><b>Cisco Express Forwarding (CEF)</b></td><td>Most recent and the <b>default</b>. Builds a <b>Forwarding Information Base (FIB)</b> and an <b>adjacency table</b>. Entries are <b>change-triggered</b> (topology changes), not packet-triggered; after convergence they hold everything needed to forward.</td></tr></table>`,
        understand: {
          big: 'For every packet a router finds the longest match, then either delivers it on a connected network (resolving the destination MAC), sends it to a next-hop router (resolving the next hop\'s MAC), or drops it. CEF does this from precomputed tables.',
          why: 'Understanding what changes and what stays the same at each hop explains every packet walk question.',
          keys: [
            'Ingress → lookup → longest match → new frame → egress.',
            'Directly connected: resolve the destination MAC (ARP / ND).',
            'Remote: resolve the next-hop router\'s MAC.',
            'No match and no default route: drop (and send ICMP to the source).',
            'The frame changes at every hop; the IP packet is the same end to end.',
            'Process switching (CPU per packet) → fast switching (cache) → CEF (FIB + adjacency, default).',
          ],
          traps: [
            { trap: 'Thinking the router ARPs for the final destination of a remote packet.', fix: 'It resolves the MAC of the next-hop router.' },
            { trap: 'Saying CEF tables are built per packet like fast switching.', fix: 'CEF tables are change-triggered and prebuilt; fast-switching caches are packet-triggered.' },
            { trap: 'Thinking the source and destination IP change at every router.', fix: 'Only the Layer 2 frame (MAC addresses) changes; the IP addresses stay the same.' },
          ],
          analogy: 'A parcel relay: each courier puts the same parcel (IP packet) in a new envelope (frame) addressed to the next courier, until the last one delivers it to the house.',
          explain: [
            { q: 'Which MAC address does a router look up when forwarding to a remote network over Ethernet?', a: 'The MAC address of the next-hop router.' },
            { q: 'What is the difference between fast switching and CEF?', a: 'Fast switching caches results after the first packet of a flow; CEF prebuilds a FIB and adjacency table that change only when the topology changes.' },
            { q: 'What happens to a packet with no matching route and no default route?', a: 'The router drops it.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 14.3 */
      {
        id: '14.3', title: 'Basic Router Configuration Review',
        objective: 'Configure basic settings on a router.', slides: '29–33',
        read: `
<h3>Configuration commands</h3>
<p>The deck's R1 connects LAN 1 (G0/0/0), LAN 2 (G0/0/1) and R2 (S0/1/1), dual-stack, with manually chosen link-local addresses:</p>
<pre class="cli">Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# enable secret class
R1(config)# line console 0
R1(config-line)# logging synchronous
R1(config-line)# password cisco
R1(config-line)# login
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# password cisco
R1(config-line)# login
R1(config-line)# transport input ssh telnet
R1(config-line)# exit
R1(config)# service password-encryption
R1(config)# banner motd #
Enter TEXT message. End with a new line and the #
WARNING: Unauthorized access is prohibited!
#
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# description Link to LAN 1
R1(config-if)# ip address 10.0.1.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1:a link-local
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet 0/0/1
R1(config-if)# description Link to LAN 2
R1(config-if)# ip address 10.0.2.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:2::1/64
R1(config-if)# ipv6 address fe80::1:b link-local
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface serial 0/1/1
R1(config-if)# description Link to R2
R1(config-if)# ip address 10.0.3.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:3::1/64
R1(config-if)# ipv6 address fe80::1:c link-local
R1(config-if)# no shutdown
R1(config-if)# exit
R1# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]</pre>

<h3>Verification commands</h3>
<ul>
  <li><code>show ip interface brief</code></li>
  <li><code>show running-config interface <i>interface-type number</i></code></li>
  <li><code>show interfaces</code></li>
  <li><code>show ip interface</code></li>
  <li><code>show ip route</code></li>
  <li><code>ping</code></li>
</ul>
<p>Replace <code>ip</code> with <code>ipv6</code> for the IPv6 versions.</p>

<h3>Filter command output</h3>
<p>Type a pipe <b>|</b> after a show command, then a filtering parameter and an expression:</p>
<table class="t"><tr><th>Parameter</th><th>Shows</th></tr>
<tr><td><code>section</code></td><td>The entire section that starts with the expression.</td></tr>
<tr><td><code>include</code></td><td>Only lines that match the expression.</td></tr>
<tr><td><code>exclude</code></td><td>All lines except those that match.</td></tr>
<tr><td><code>begin</code></td><td>Everything from the first line that matches.</td></tr></table>
<p>Filters work with any show command.</p>`,
        understand: {
          big: 'The router baseline is always the same: name, secrets and line passwords, encryption, banner, then dual-stack interfaces with descriptions and no shutdown, and save. Verify with show commands and filter them with | section/include/exclude/begin.',
          why: 'Every routing lab starts with this baseline, and filters make long outputs readable.',
          keys: [
            'hostname, enable secret, console and vty passwords with login, transport input, service password-encryption, banner motd.',
            'logging synchronous keeps log messages from breaking what you type.',
            'ipv6 unicast-routing, then ip address / ipv6 address / ipv6 address … link-local / description / no shutdown.',
            'copy running-config startup-config to save.',
            'Verify: show ip interface brief, show running-config interface, show interfaces, show ip interface, show ip route, ping (ipv6 versions too).',
            'Filters: | section, | include, | exclude, | begin.',
          ],
          traps: [
            { trap: 'Forgetting no shutdown on router interfaces.', fix: 'Router interfaces are administratively down by default.' },
            { trap: 'Using | include to see a whole configuration block.', fix: '| section shows the entire section; include shows only matching lines.' },
          ],
          analogy: 'The same pre-flight checklist before every flight: secure the cockpit, check every instrument, then file the flight plan (save).',
          explain: [
            { q: 'What does logging synchronous do on the console line?', a: 'It stops console messages from interrupting the command you are typing.' },
            { q: 'Which filter shows the whole vty configuration block of show running-config?', a: 'show running-config | section line vty' },
            { q: 'Which command shows the IPv6 addresses and status of all interfaces in one table?', a: 'show ipv6 interface brief' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 14.4 */
      {
        id: '14.4', title: 'IP Routing Table',
        objective: 'Describe the structure of a routing table.', slides: '35–48',
        read: `
<h3>Route sources and codes</h3>
<p>The routing table lists known networks from three sources: directly connected networks, static routes and dynamic routing protocols. Each entry has a code:</p>
<table class="t"><tr><th>Code</th><th>Meaning</th></tr>
<tr><td><b>L</b></td><td>Local: the address assigned to a router interface.</td></tr>
<tr><td><b>C</b></td><td>Directly connected network.</td></tr>
<tr><td><b>S</b></td><td>Static route.</td></tr>
<tr><td><b>O</b></td><td>Learned from another router through OSPF.</td></tr>
<tr><td><b>*</b></td><td>Candidate for a default route.</td></tr></table>

<h3>Routing table principles</h3>
<ol class="steps">
  <li><b>Every router decides alone</b>, using only its own routing table. R1 does not know what is in R2's table.</li>
  <li>One router's table does not necessarily match another's. R1 having a route to an internet network via R2 does not mean R2 knows that network.</li>
  <li><b>Routing information about a path does not provide return routing information.</b> R1 may know how to reach PC1, but not how to send PC1's reply back to PC3's network.</li>
</ol>

<h3>Routing table entries</h3>
<pre class="cli">O    10.0.4.0/24 [110/50] via 10.0.3.2, 00:24:22, Serial0/1/1</pre>
<ul>
  <li><b>Route source</b>: O (how the route was learned).</li>
  <li><b>Destination network</b>: 10.0.4.0/24 (prefix and prefix length).</li>
  <li><b>Administrative distance</b>: 110, the trustworthiness of the source (lower is preferred).</li>
  <li><b>Metric</b>: 50, the value to reach the network (lower is preferred).</li>
  <li><b>Next hop</b>: 10.0.3.2.</li>
  <li><b>Route timestamp</b>: 00:24:22, time since the route was learned.</li>
  <li><b>Exit interface</b>: Serial0/1/1.</li>
</ul>

<h3>Directly connected networks</h3>
<p>A router needs at least one active interface with an IP address and mask before it can learn remote networks. A connected network shows as <b>C</b> with its prefix. Each one also has a <b>local route</b>, <b>L</b>, with prefix length <b>/32</b> (IPv4) or <b>/128</b> (IPv6): the packet's destination must match every bit. Local routes let the router quickly recognise packets addressed <b>to itself</b>.</p>

<h3>Static routes</h3>
<p>Static routes are configured manually, define an explicit path and are not updated automatically. Three primary uses:</p>
<ul>
  <li>Easy maintenance in small networks that will not grow much.</li>
  <li>A single <b>default route</b> for every network without a more specific match, typically towards the next upstream router.</li>
  <li>Routing to and from <b>stub networks</b> (reached by a single route; the router has only one neighbour).</li>
</ul>

<h3>Dynamic routing protocols</h3>
<p>Routers share reachability and status of remote networks automatically: network discovery and routing table maintenance. OSPF routes show as <b>O</b> with the next hop (<i>via ip-address</i>); IPv6 routing protocols use the next hop's <b>link-local</b> address. (OSPF configuration is beyond the scope of this course.)</p>
<pre class="cli">R1# show ipv6 route
O   2001:DB8:ACAD:4::/64 [110/50]
     via FE80::2:C, Serial0/1/1</pre>

<h3>Default route</h3>
<p>Used when no specific route matches. IPv4: <b>0.0.0.0/0</b>; IPv6: <b>::/0</b>. Zero bits need to match.</p>

<h3>Structure of the IPv4 routing table</h3>
<p>The IPv4 table keeps the old <b>classful</b> layout (the lookup itself is classless). A subnet of a classful network is shown indented as a <b>child route</b>, under a less indented <b>parent route</b> that shows the classful network without a source code ("is variably subnetted" / "is subnetted"). Directly connected networks are always child routes, because the local /32 address is a subnet of the classful network.</p>
<pre class="cli">     192.168.1.0/24 is variably subnetted, 2 subnets, 2 masks
C       192.168.1.0/24 is directly connected, GigabitEthernet0/0/0
L       192.168.1.1/32 is directly connected, GigabitEthernet0/0/0
O    192.168.2.0/24 [110/65] via 192.168.12.2, 00:32:33, Serial0/0/0</pre>
<p>IPv6 never had classes, so every IPv6 entry is formatted and aligned the same way, with the next hop on a second line.</p>

<h3>Administrative distance</h3>
<p>A given prefix can appear only once in the table. If several sources know it, the one with the lowest <b>administrative distance (AD)</b>, the most "trustworthy", is installed.</p>
<table class="t"><tr><th>Route source</th><th>AD</th></tr>
<tr><td>Directly connected</td><td>0</td></tr><tr><td>Static route</td><td>1</td></tr><tr><td>EIGRP summary route</td><td>5</td></tr>
<tr><td>External BGP</td><td>20</td></tr><tr><td>Internal EIGRP</td><td>90</td></tr><tr><td>OSPF</td><td>110</td></tr>
<tr><td>IS-IS</td><td>115</td></tr><tr><td>RIP</td><td>120</td></tr><tr><td>External EIGRP</td><td>170</td></tr><tr><td>Internal BGP</td><td>200</td></tr></table>
<p>Normally only one dynamic routing protocol runs on a router.</p>`,
        understand: {
          big: 'Each routing table entry says where the route came from (code, AD), how good it is (metric), and where to send the packet (next hop, exit interface); each router decides alone, and a route to a network says nothing about the way back.',
          why: 'Reading show ip route and comparing administrative distances are core CCNA skills.',
          keys: [
            'Codes: L local (/32 or /128), C connected, S static, O OSPF, * default candidate.',
            'Principles: each router decides alone; tables differ; paths are not automatically symmetric.',
            'Entry: source, prefix, [AD/metric], next hop, timestamp, exit interface.',
            'Static routes: small stable networks, default routes, stub networks.',
            'IPv4 table: parent (classful) and child (subnet) routes. IPv6: flat.',
            'AD: connected 0, static 1, eBGP 20, EIGRP 90, OSPF 110, IS-IS 115, RIP 120, iBGP 200.',
          ],
          traps: [
            { trap: 'Comparing metrics between OSPF and RIP routes.', fix: 'Different sources are compared by administrative distance; metrics only compare routes from the same protocol.' },
            { trap: 'Assuming the return path exists because the forward path works.', fix: 'Routing information about a path does not provide return routing information.' },
            { trap: 'Reading [110/50] as metric 110.', fix: 'The first number is the AD, the second is the metric.' },
          ],
          analogy: 'Directions from different sources: a road sign (connected, AD 0) beats a friend\'s advice (static, AD 1), which beats an app\'s estimate (OSPF, AD 110). The metric is the app\'s estimated travel time.',
          explain: [
            { q: 'In "O 10.0.4.0/24 [110/50] via 10.0.3.2, 00:24:22, Serial0/1/1", identify the AD, metric, next hop and exit interface.', a: 'AD 110, metric 50, next hop 10.0.3.2, exit interface Serial0/1/1.' },
            { q: 'Why does a router install local (L) routes?', a: 'To recognise quickly packets addressed to the router itself; they match all 32 (or 128) bits.' },
            { q: 'OSPF and a static route both know 10.1.1.0/24. Which one is installed?', a: 'The static route, AD 1 versus OSPF\'s 110.' },
          ],
          widgets: ['longestmatch'],
        },
      },
      /* ------------------------------------------------------------------ 14.5 */
      {
        id: '14.5', title: 'Static and Dynamic Routing',
        objective: 'Compare static and dynamic routing concepts.', slides: '50–58',
        read: `
<h3>Static or dynamic?</h3>
<p>They are not mutually exclusive; most networks combine them.</p>
<div class="cols">
  <div><h4>Static routes are used</h4><ul>
  <li>as a default route forwarding packets to a service provider;</li>
  <li>for routes outside the routing domain that the dynamic protocol does not learn;</li>
  <li>when the administrator wants to define the path for a specific network explicitly;</li>
  <li>for routing between stub networks.</li></ul>
  <p>They suit small networks with one path to the outside, and add security for certain traffic or links that need more control.</p></div>
  <div><h4>Dynamic routing is used</h4><ul>
  <li>in networks of more than just a few routers;</li>
  <li>when a topology change must be handled automatically by finding another path;</li>
  <li>for scalability: as the network grows, new networks are learned automatically.</li></ul></div>
</div>
<table class="t"><tr><th>Feature</th><th>Dynamic routing</th><th>Static routing</th></tr>
<tr><td>Configuration complexity</td><td>Independent of network size</td><td>Increases with network size</td></tr>
<tr><td>Topology changes</td><td>Adapts automatically</td><td>Administrator intervention required</td></tr>
<tr><td>Scalability</td><td>Simple to complex topologies</td><td>Simple topologies</td></tr>
<tr><td>Security</td><td>Must be configured</td><td>Inherent</td></tr>
<tr><td>Resource usage</td><td>Uses CPU, memory and link bandwidth</td><td>No additional resources</td></tr>
<tr><td>Path predictability</td><td>Depends on topology and protocol</td><td>Explicitly defined by the administrator</td></tr></table>

<h3>Dynamic routing evolution</h3>
<p>Dynamic routing protocols have been used since the late 1980s; <b>RIPv1</b> was released in 1988 (some of its algorithms were used on ARPANET as early as 1969).</p>
<table class="t"><tr><th></th><th>Distance vector (IGP)</th><th>Link-state (IGP)</th><th>Path vector (EGP)</th></tr>
<tr><td>IPv4</td><td>RIPv2, EIGRP</td><td>OSPFv2, IS-IS</td><td>BGP-4</td></tr>
<tr><td>IPv6</td><td>RIPng, EIGRP for IPv6</td><td>OSPFv3, IS-IS for IPv6</td><td>BGP-MP</td></tr></table>
<p><b>IGPs</b> exchange routing information within a routing domain run by one organization. There is only one <b>EGP</b>: <b>BGP</b>, used between autonomous systems (organizations) and by ISPs on the internet. Distance vector, link-state and path vector describe the algorithm used to find the best path.</p>

<h3>Dynamic routing protocol concepts</h3>
<p>Purpose: discover remote networks, keep routing information up to date, choose the best path, and find a new best path when the current one fails. Main components:</p>
<ul>
  <li><b>Data structures</b>: tables or databases, kept in RAM.</li>
  <li><b>Routing protocol messages</b>: to discover neighbours, exchange routing information and maintain accurate information.</li>
  <li><b>Algorithm</b>: a finite list of steps to process routing information and determine the best path.</li>
</ul>
<p>The protocol offers its best route to the routing table; it is installed if no source with a lower AD has the same prefix.</p>

<h3>Best path and metrics</h3>
<p>The best path is the one with the <b>lowest metric</b>:</p>
<table class="t"><tr><th>Protocol</th><th>Metric</th></tr>
<tr><td>RIP</td><td><b>Hop count</b>; each router adds a hop; maximum 15 hops.</td></tr>
<tr><td>OSPF</td><td><b>Cost</b>, based on cumulative bandwidth; faster links cost less.</td></tr>
<tr><td>EIGRP</td><td>Based on the <b>slowest bandwidth and delay</b>; can include load and reliability.</td></tr></table>

<h3>Load balancing</h3>
<p>With two or more paths of <b>equal metric</b>, the router forwards packets over all of them: <b>equal-cost load balancing</b>. The table shows one destination with several exit interfaces. Dynamic protocols do this automatically; with static routes it happens when several static routes to the same network use different next hops. Only <b>EIGRP</b> supports <b>unequal-cost</b> load balancing.</p>`,
        understand: {
          big: 'Static routes are simple, secure and predictable but do not adapt or scale; dynamic protocols adapt and scale at the cost of resources. Most networks mix them. Within a protocol, the lowest metric wins, and equal metrics load-balance.',
          why: 'Choosing between static and dynamic routing, and knowing each protocol\'s metric, are standard exam questions.',
          keys: [
            'Static: default to ISP, routes outside the domain, explicit paths, stub networks.',
            'Dynamic: more than a few routers, automatic rerouting, scalability.',
            'Comparison: complexity, topology changes, scalability, security, resources, predictability.',
            'IGP: RIPv2/RIPng, EIGRP, OSPFv2/OSPFv3, IS-IS. EGP: BGP only.',
            'Metrics: RIP hop count (max 15), OSPF cost (bandwidth), EIGRP bandwidth and delay.',
            'Equal-cost load balancing is automatic; only EIGRP does unequal-cost.',
          ],
          traps: [
            { trap: 'Saying static routing adapts to failures.', fix: 'Static routes need administrator intervention when the topology changes.' },
            { trap: 'Calling OSPF a distance vector protocol.', fix: 'OSPF and IS-IS are link-state; RIP and EIGRP are distance vector; BGP is path vector.' },
            { trap: 'Thinking OSPF can do unequal-cost load balancing.', fix: 'Only EIGRP supports unequal-cost load balancing.' },
          ],
          analogy: 'Static routing is a printed map: reliable and private, but useless when a road closes. Dynamic routing is a satnav that reroutes, at the cost of battery and data.',
          explain: [
            { q: 'Give two situations where static routes are the better choice.', a: 'A default route to the ISP, a stub network, routes outside the routing domain, or an explicitly defined path.' },
            { q: 'Which protocol is the only EGP, and what is it used for?', a: 'BGP, to exchange routing information between autonomous systems (organizations and ISPs).' },
            { q: 'What metric does RIP use and what is its limit?', a: 'Hop count, with a maximum of 15 hops.' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
