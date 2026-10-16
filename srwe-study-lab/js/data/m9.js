/* Module 9 — FHRP Concepts (SRWE v7, slides in SRWE_Module_9.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm9', num: 9, title: 'FHRP Concepts',
    objective: 'Explain how FHRPs provide default gateway services in a redundant network.',
    deck: 'SRWE_Module_9.pptx',
    topics: [
      /* ------------------------------------------------------------------ 9.1 */
      {
        id: '9.1', title: 'First Hop Redundancy Protocols',
        objective: 'Explain the purpose and operation of first hop redundancy protocols.', slides: '11–15',
        read: `
<h3>Default gateway limitations</h3>
<ul>
  <li>End devices are usually configured with <b>one</b> default gateway IPv4 address.</li>
  <li>If that router interface fails, the LAN hosts lose connectivity outside the LAN, <b>even if</b> a redundant router or Layer 3 switch that could be the gateway exists on the same segment.</li>
  <li><b>First hop redundancy protocols (FHRPs)</b> provide alternate default gateways in switched networks where two or more routers connect to the same VLANs.</li>
</ul>

<h3>Router redundancy: the virtual router</h3>
<p>Several routers work together to look like <b>one virtual router</b> to the hosts. They share a virtual <b>IP address</b> and a virtual <b>MAC address</b>.</p>
<ul>
  <li>The virtual router's IPv4 address is configured as the hosts' default gateway.</li>
  <li>When a host ARPs for the gateway, the answer is the <b>virtual MAC address</b>. Frames to that MAC are processed by whichever router is currently active in the group.</li>
  <li>The hosts never know which physical router forwards their traffic.</li>
  <li>The redundancy protocol decides which router is active and when the standby router takes over. The transition is transparent to the end devices.</li>
</ul>
<p>The ability of a network to recover dynamically from the failure of the default gateway device is called <b>first-hop redundancy</b>.</p>

<h3>Steps for router failover</h3>
<ol class="steps">
  <li>The standby router stops seeing <b>Hello</b> messages from the forwarding router.</li>
  <li>The standby router takes over the forwarding role.</li>
  <li>Because the new forwarding router uses <b>both the virtual IPv4 and MAC addresses</b>, the hosts see no disruption.</li>
</ol>

<h3>FHRP options</h3>
<table class="t"><tr><th>FHRP</th><th>Description</th></tr>
<tr><td><b>HSRP</b></td><td>Hot Standby Router Protocol. Cisco proprietary; transparent failover of a first-hop IPv4 device with an active and a standby router.</td></tr>
<tr><td><b>HSRP for IPv6</b></td><td>Cisco; the same for IPv6. Virtual MAC from the group number, virtual IPv6 link-local from that MAC; RAs are sent for the virtual link-local while the group is active.</td></tr>
<tr><td><b>VRRPv2</b></td><td>Virtual Router Redundancy Protocol, <b>non-proprietary</b>, IPv4 only. One <b>virtual router master</b>; the others are backups.</td></tr>
<tr><td><b>VRRPv3</b></td><td>Supports IPv4 and IPv6; multivendor and more scalable than VRRPv2.</td></tr>
<tr><td><b>GLBP</b></td><td>Gateway Load Balancing Protocol, Cisco proprietary. Protects like HSRP/VRRP and also <b>load-balances</b> (load sharing) across the group.</td></tr>
<tr><td><b>GLBP for IPv6</b></td><td>The same for IPv6.</td></tr>
<tr><td><b>IRDP</b></td><td>ICMP Router Discovery Protocol, RFC 1256. A <b>legacy</b> solution that lets IPv4 hosts locate routers.</td></tr></table>
<div class="errata"><b>Slide errata (slide 15):</b> the HSRP row says "HRSP is a Cisco-proprietary FHRP"; it means HSRP.</div>`,
        understand: {
          big: 'An FHRP lets several routers share one virtual IP and MAC address, so hosts keep the same default gateway when a router fails.',
          why: 'Without an FHRP, the default gateway is a single point of failure for every host on the LAN.',
          keys: [
            'Hosts have one default gateway; if it fails they lose off-LAN access.',
            'Virtual router: shared virtual IPv4 and MAC address; the active router answers for both.',
            'Failover: standby misses Hellos → becomes the forwarder → keeps the same virtual IP and MAC.',
            'HSRP (Cisco), VRRPv2/v3 (open standard), GLBP (Cisco, load balancing), IRDP (legacy).',
            'VRRP calls its forwarding router the virtual router master.',
          ],
          traps: [
            { trap: 'Thinking hosts must be reconfigured after a failover.', fix: 'They keep the virtual IP and MAC as their gateway; nothing changes on the host.' },
            { trap: 'Calling VRRP Cisco proprietary.', fix: 'VRRP is non-proprietary; HSRP and GLBP are Cisco proprietary.' },
            { trap: 'Thinking HSRP load-balances by default.', fix: 'HSRP has one active forwarder per group; GLBP is the FHRP that load-balances.' },
          ],
          analogy: 'A shop with one phone number and two staff: whoever is on duty answers. If one goes home sick, the other picks up the same number and customers never notice.',
          explain: [
            { q: 'Why is a redundant router on the same LAN useless without an FHRP?', a: 'Hosts only know one gateway address; if that router fails they never try the other router.' },
            { q: 'Why does the virtual MAC matter during failover?', a: 'Hosts have it in their ARP cache; because the new active router uses the same MAC, frames keep flowing without new ARP requests.' },
            { q: 'Which FHRP would you use in a multivendor network?', a: 'VRRP (VRRPv3 for IPv4 and IPv6).' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 9.2 */
      {
        id: '9.2', title: 'HSRP',
        objective: 'Explain how HSRP operates.', slides: '17–20',
        read: `
<h3>HSRP overview</h3>
<p>Cisco provides HSRP and HSRP for IPv6 so hosts do not lose outside access when their default router fails. HSRP elects an <b>active</b> device, which routes the packets, and a <b>standby</b> device, which monitors the group and takes over quickly if the active device fails or pre-set conditions are met.</p>

<h3>HSRP priority and preemption</h3>
<ul>
  <li>By default the router with the <b>numerically highest IPv4 address</b> becomes active. It is better to control this.</li>
  <li><b>Priority</b> decides the active router: <b>highest priority wins</b>. Default <b>100</b>, range <b>0–255</b>. Configure it with <code>standby priority</code>.</li>
  <li>If the priorities are equal, the highest IPv4 address wins.</li>
  <li>By default, an active router <b>stays active</b> even if a router with a higher priority comes online later.</li>
  <li><b>Preemption</b> (<code>standby preempt</code>) lets a higher-priority router trigger a new election and take over.</li>
  <li>Preemption only works with a <b>higher priority</b>: a router with equal priority but a higher IP address does <b>not</b> preempt.</li>
  <li>Without preemption, the router that boots first becomes active if no other router is online during the election.</li>
</ul>
<pre class="cli">R1(config)# interface g0/0/1
R1(config-if)# standby 1 ip 192.168.1.254
R1(config-if)# standby 1 priority 150
R1(config-if)# standby 1 preempt
R1(config-if)# end
R1# show standby brief
Interface   Grp  Pri P State    Active          Standby         Virtual IP
Gig0/0/1    1    150 P Active   local           192.168.1.2     192.168.1.254</pre>

<h3>HSRP states and timers</h3>
<table class="t"><tr><th>State</th><th>Description</th></tr>
<tr><td>Initial</td><td>Entered after a configuration change or when an interface first comes up.</td></tr>
<tr><td>Learn</td><td>The router does not know the virtual IP yet and has not seen a Hello from the active router; it waits to hear from it.</td></tr>
<tr><td>Listen</td><td>Knows the virtual IP but is neither active nor standby; listens for Hellos.</td></tr>
<tr><td>Speak</td><td>Sends periodic Hellos and takes part in the election of the active and/or standby router.</td></tr>
<tr><td>Standby</td><td>Candidate to become the next active router; sends periodic Hellos.</td></tr>
<tr><td>Active</td><td>Forwards packets sent to the virtual MAC; sends periodic Hellos.</td></tr></table>
<div class="errata"><b>Slide errata (slide 20):</b> the state table stops at Standby. HSRP has a sixth state, <b>Active</b>, the router that forwards traffic for the group.</div>
<ul>
  <li>The active and standby routers send Hellos to the HSRP group multicast address every <b>3 seconds</b>.</li>
  <li>The standby becomes active if it hears no Hello for <b>10 seconds</b> (hold time).</li>
  <li>The timers can be lowered for faster failover, but not below <b>1 second</b> (hello) or <b>4 seconds</b> (hold), to avoid extra CPU use and unnecessary state changes.</li>
</ul>
<div class="note"><b>Packet Tracer 9.3.3 (HSRP Configuration Guide):</b> configure an active router and a standby router, then verify failover. The <a href="#lab-m9-hsrp">HSRP lab</a> in this app does the same in your own Packet Tracer.</div>`,
        understand: {
          big: 'HSRP elects one active router (highest priority, then highest IP) to forward for the virtual IP; the standby takes over after 10 s without Hellos; preempt lets a higher-priority router take the role back.',
          why: 'HSRP is the FHRP you configure and verify in the course; priority and preemption behaviour are classic exam questions.',
          keys: [
            'Active forwards; standby monitors and takes over.',
            'Priority: default 100, range 0–255, highest wins; tie → highest IPv4 address.',
            'standby preempt: a router with a higher priority takes over when it comes online.',
            'Equal priority + higher IP does not preempt.',
            'States: initial, learn, listen, speak, standby, active.',
            'Hello every 3 s, hold time 10 s. Minimums: hello 1 s, hold 4 s.',
          ],
          traps: [
            { trap: 'Thinking the lowest priority wins, as in STP.', fix: 'In HSRP the highest priority wins.' },
            { trap: 'Expecting a recovered higher-priority router to become active automatically.', fix: 'Without standby preempt, the current active router keeps the role.' },
            { trap: 'Saying the default active router is the one with the lowest IP.', fix: 'With equal priorities, the highest IPv4 address wins.' },
          ],
          analogy: 'Captain (active) and vice-captain (standby): the vice-captain takes over if the captain stops calling in for 10 seconds. With preempt, the official captain gets the armband back on return.',
          explain: [
            { q: 'R1 has priority 150 and preempt; R2 has the default priority. R1 reboots. Who is active during and after the reboot?', a: 'R2 during the reboot; R1 again afterwards, because preempt lets its higher priority take the role back.' },
            { q: 'Both routers have priority 100 and R2 has the higher IP. Who is active if they start together?', a: 'R2, because the highest IP address breaks the tie.' },
            { q: 'How long does the standby router wait before taking over, by default?', a: '10 seconds without a Hello (hold time); Hellos are sent every 3 seconds.' },
          ],
          widgets: ['hsrpelect'],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
