/* Module 16 — Troubleshoot Static and Default Routes (SRWE v7, slides in SRWE_Module_16.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm16', num: 16, title: 'Troubleshoot Static and Default Routes',
    objective: 'Troubleshoot static and default route configurations.',
    deck: 'SRWE_Module_16.pptx',
    topics: [
      /* ------------------------------------------------------------------ 16.1 */
      {
        id: '16.1', title: 'Packet Processing with Static Routes',
        objective: 'Explain how a router processes packets when a static route is configured.', slides: '11–13',
        read: `
<h3>Static routes and packet forwarding</h3>
<p>PC1 (on R1's LAN) sends a packet to PC3 (on R3's LAN), across R1–R2–R3.</p>
<ol class="steps">
  <li>PC1 addresses the packet to PC3 and sends it to its <b>default gateway</b>, R1.</li>
  <li>R1 receives the packet on G0/0/0, <b>decapsulates</b> it and searches its routing table for the destination:
    <ul><li>If it matches a <b>static route</b>, R1 uses it to find the next-hop address or exit interface.</li>
    <li>If no specific route matches, R1 uses the <b>default static route</b> (if one is configured).</li>
    <li>If nothing matches, R1 <b>drops</b> the packet and sends an <b>ICMP message</b> back to the source (PC1).</li></ul></li>
  <li>With a match, R1 encapsulates the packet in a new frame and forwards it out S0/1/0 to R2.</li>
  <li>R2 receives it on S0/1/0, decapsulates and processes it the same way, finds a match, and sends it out S0/1/1 towards R3.</li>
  <li>R3 receives it and finds that PC3's address is on its directly connected G0/0/0 network. It looks up PC3's MAC address in its <b>ARP table</b>; if there is no entry, it sends an <b>ARP request</b> out G0/0/0 and PC3 answers with an <b>ARP reply</b>.</li>
  <li>R3 encapsulates the packet in a new frame with <b>PC3's MAC</b> as the destination and <b>G0/0/0's MAC</b> as the source, and forwards it. PC3 receives and processes it.</li>
</ol>`,
        understand: {
          big: 'At every router the packet is de-encapsulated, looked up (static route, then default route, else drop with ICMP) and re-encapsulated; only the last router resolves the destination host\'s MAC with ARP.',
          why: 'Tracing a packet hop by hop is the foundation of troubleshooting static routing.',
          keys: [
            'Host → default gateway.',
            'Each router: decapsulate → lookup → re-encapsulate → forward.',
            'Lookup order in effect: specific static route, else default route, else drop + ICMP to the source.',
            'The last router ARPs for the destination host (if not cached).',
            'Final frame: destination MAC = host, source MAC = the router\'s egress interface.',
          ],
          traps: [
            { trap: 'Thinking R1 ARPs for PC3.', fix: 'Only R3, which is directly connected to PC3, resolves PC3\'s MAC address.' },
            { trap: 'Thinking a router silently drops unroutable packets.', fix: 'It drops them and sends an ICMP message back to the source.' },
          ],
          analogy: 'A letter passed between post offices: each one opens the outer envelope, reads the address, and puts it in a new envelope for the next office; only the last one knows the recipient\'s front door.',
          explain: [
            { q: 'What does R1 do with a packet that matches no route and has no default route?', a: 'Drops it and sends an ICMP message back to the source.' },
            { q: 'Which device resolves PC3\'s MAC address, and how?', a: 'R3, the router directly connected to PC3\'s network, from its ARP table or with an ARP request.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 16.2 */
      {
        id: '16.2', title: 'Troubleshoot IPv4 Static and Default Route Configuration',
        objective: 'Troubleshoot common static and default route configuration issues.', slides: '15–17',
        read: `
<h3>Network changes</h3>
<p>Networks fail for many reasons: an interface fails, a service provider drops a connection, links become oversaturated, or an administrator enters a wrong configuration. Administrators must pinpoint and solve the problem quickly, so they must know the tools that isolate routing problems.</p>

<h3>Common troubleshooting commands</h3>
<table class="t"><tr><th>Command</th><th>Use</th></tr>
<tr><td><code>ping</code></td><td>Verify Layer 3 connectivity to a destination. Extended pings offer more options (such as the source interface).</td></tr>
<tr><td><code>traceroute</code></td><td>Verify the path to the destination network, hop by hop.</td></tr>
<tr><td><code>show ip route</code></td><td>Display the routing table and verify the route entries for a destination.</td></tr>
<tr><td><code>show ip interface brief</code></td><td>Display the status and IP address of each interface.</td></tr>
<tr><td><code>show cdp neighbors</code></td><td>List directly connected Cisco devices; also validates Layers 1 and 2. (<code>show cdp neighbors detail</code> adds addresses.)</td></tr></table>
<div class="errata"><b>Slide errata (slide 16):</b> the table says traceroute "uses ICMP echo reply messages". Cisco IOS traceroute sends UDP probes with increasing TTL values and identifies each hop from the ICMP <b>time exceeded</b> messages that come back (Windows <code>tracert</code> sends ICMP echo requests); it is not based on echo replies.</div>

<h3>Solve a connectivity problem</h3>
<p>PC1 cannot reach PC3. Method:</p>
<ol class="steps">
  <li>Ping from PC1 to PC3 fails.</li>
  <li>An <b>extended ping</b> from R1, sourced from G0/0/0 (PC1's LAN), to PC3 fails.</li>
  <li>Pings from R1's S0/1/0 to R2 succeed, and pings from R1 to R3 succeed: the links work.</li>
  <li>R2's routing table reveals the problem:</li>
</ol>
<pre class="cli">R2# show ip route | begin Gateway
Gateway of last resort is not set
     172.16.0.0/16 is variably subnetted, 5 subnets, 2 masks
C       172.16.1.0/24 is directly connected, GigabitEthernet0/0/0
L       172.16.1.1/32 is directly connected, GigabitEthernet0/0/0
C       172.16.2.0/24 is directly connected, Serial0/1/0
L       172.16.2.2/32 is directly connected, Serial0/1/0
S       172.16.3.0/24 [1/0] via 192.168.1.1
     192.168.1.0/24 is variably subnetted, 2 subnets, 2 masks
C       192.168.1.0/24 is directly connected, Serial0/1/1
L       192.168.1.2/32 is directly connected, Serial0/1/1
S    192.168.2.0/24 [1/0] via 192.168.1.1</pre>
<p>The route to R1's LAN, 172.16.3.0/24, points to <b>192.168.1.1 (R3)</b> instead of <b>172.16.2.1 (R1)</b>. Replies from PC3 to PC1 are sent the wrong way. Remove the wrong route and add the correct one:</p>
<pre class="cli">R2(config)# no ip route 172.16.3.0 255.255.255.0 192.168.1.1
R2(config)# ip route 172.16.3.0 255.255.255.0 172.16.2.1</pre>
<div class="errata"><b>Slide errata (slide 17):</b> the output shows "Serial0/l/0" with a lowercase letter l instead of the digit 1.</div>
<div class="note">The deck's summary lists the commands as ping, traceroute, show ip route, show ip interface brief and <b>show cdp neighbors detail</b>.</div>`,
        understand: {
          big: 'Troubleshoot static routing hop by hop: ping and traceroute to find where it breaks, show ip interface brief and show cdp neighbors for the links, and show ip route on each router to find the wrong or missing route, including the return path.',
          why: 'Most static routing faults are a wrong next hop, a wrong prefix or mask, or a missing return route, and the exam expects you to spot them in output.',
          keys: [
            'Causes: failed interface, provider outage, saturation, wrong configuration.',
            'Tools: ping (extended), traceroute, show ip route, show ip interface brief, show cdp neighbors (detail).',
            'Work hop by hop and check both directions (forward and return).',
            'Fix a wrong static route: no ip route … (exact old route), then ip route … (correct).',
            'Typical faults: wrong next hop, wrong network or mask, missing return route, wrong default route.',
          ],
          traps: [
            { trap: 'Only checking the forward path.', fix: 'Routing information about a path does not provide return routing information; check the reply path too.' },
            { trap: 'Adding the correct route without removing the wrong one.', fix: 'Both stay in the configuration; with equal AD the router may load-balance over a bad path. Remove the wrong route.' },
            { trap: 'Thinking traceroute relies on ICMP echo replies.', fix: 'It relies on ICMP time exceeded messages from each hop.' },
          ],
          analogy: 'Finding a broken pipe: open each valve in turn (ping hop by hop), check the pipe map at each junction (routing tables), and remember the return pipe.',
          explain: [
            { q: 'Pings from R1 to R2 and R3 work, but PC1 cannot reach PC3. Where do you look next?', a: 'At the routing tables (show ip route) of each router, in both directions, for wrong or missing routes.' },
            { q: 'What was wrong in the deck\'s example and how was it fixed?', a: 'R2 routed 172.16.3.0/24 via 192.168.1.1 (R3) instead of 172.16.2.1 (R1). The route was removed with no ip route and re-added with the correct next hop.' },
            { q: 'Which command checks Layer 1 and 2 to directly connected Cisco neighbours?', a: 'show cdp neighbors (detail).' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
