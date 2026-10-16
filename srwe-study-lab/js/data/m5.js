/* Module 5 — STP Concepts (SRWE v7, slides in SRWE_Module_5.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm5', num: 5, title: 'STP Concepts',
    objective: 'Explain how STP enables redundancy in a Layer 2 network.',
    deck: 'SRWE_Module_5.pptx',
    topics: [
      /* ------------------------------------------------------------------ 5.1 */
      {
        id: '5.1', title: 'Purpose of STP',
        objective: 'Explain common problems in a redundant, Layer 2 switched network.', slides: '12–21',
        read: `
<h3>Redundancy in Layer 2 switched networks</h3>
<ul>
  <li>Redundancy is part of hierarchical design: it removes <b>single points of failure</b> so users keep their services when a path fails.</li>
  <li>Redundant networks need extra <b>physical</b> paths, but <b>logical</b> redundancy must be designed too.</li>
  <li>Redundant paths in a switched Ethernet network can create both physical and logical <b>Layer 2 loops</b>.</li>
  <li>Ethernet LANs need a <b>loop-free topology</b> with a single path between any two devices. A loop makes frames circulate until a link is disrupted.</li>
</ul>

<h3>Spanning Tree Protocol</h3>
<p><b>STP</b> is a loop-prevention protocol that allows redundancy while creating a loop-free Layer 2 topology. It <b>logically blocks</b> physical loops, so frames cannot circle forever. If a link fails, STP <b>recalculates</b> and opens previously blocked ports.</p>

<h3>Issues with redundant switch links</h3>
<p>Without STP, multiple paths between two devices create a Layer 2 loop, which causes:</p>
<ul>
  <li><b>MAC address table instability</b>: the same source MAC keeps arriving on different ports, so the table keeps changing.</li>
  <li><b>Link saturation</b> and <b>high CPU utilisation</b> on switches and end devices; the network becomes unusable.</li>
</ul>
<p>Layer 3 has a safety net: routers decrement the IPv4 <b>TTL</b> and the IPv6 <b>Hop Limit</b> and drop a packet at 0. <b>Ethernet has no such field</b>, so a switch would retransmit a looping frame forever. STP was developed specifically as the loop-prevention mechanism for Layer 2 Ethernet.</p>

<h3>Layer 2 loops and broadcast storms</h3>
<ul>
  <li>Without STP, <b>broadcast, multicast and unknown unicast</b> frames loop endlessly. (An unknown unicast is flooded out all ports except the ingress port, because the destination is not in the MAC table.)</li>
  <li>A <b>broadcast storm</b> is an abnormally high number of broadcasts overwhelming the network in a short time. It can disable a network within seconds. Causes: a Layer 2 loop or a hardware problem such as a faulty NIC.</li>
  <li>Broadcasts such as ARP requests are normal. Layer 2 multicasts are forwarded like broadcasts. IPv6 never uses Layer 2 broadcasts: ICMPv6 Neighbor Discovery uses Layer 2 multicasts (which still loop).</li>
  <li>A host caught in a loop is unreachable, and the switch no longer knows where to forward unicast frames.</li>
  <li>Spanning tree is <b>enabled by default</b> on Cisco switches.</li>
</ul>

<h3>The Spanning Tree Algorithm (STA)</h3>
<p>Invented by <b>Radia Perlman</b> at Digital Equipment Corporation and published in 1985. The STA selects a single <b>root bridge</b>, and every other switch finds its single least-cost path to it. Loops are prevented with strategically placed <b>blocking</b> ports.</p>
<ol class="steps">
  <li><b>Select a root bridge</b>: the reference point the spanning tree is built around.</li>
  <li><b>Block redundant paths</b>: only one logical path remains between all destinations; a blocked port does not send or receive user data.</li>
  <li><b>Create a loop-free topology</b>: each switch has a single path to the root, like branches of a tree.</li>
  <li><b>Recalculate on link failure</b>: the physical paths remain; STP unblocks ports when they are needed. Recalculation also happens when a switch or inter-switch link is added.</li>
</ol>
<div class="note"><b>Packet Tracer activity 5.1.9 (Investigate STP Loop Prevention):</b> build a three-switch triangle, watch STP block one port, then disable STP and see the loop. The <a href="#lab-m5-stp-observe">Investigate STP lab</a> in this app does the observation part with your own Packet Tracer.</div>`,
        understand: {
          big: 'Redundant switch links create loops; Ethernet frames have no TTL, so loops never die out on their own. STP keeps the cables but logically blocks just enough ports to leave one path.',
          why: 'Every switched network with redundancy depends on STP, and "why do we need STP?" is the first exam question about it.',
          keys: [
            'Redundancy = no single point of failure, but redundant Layer 2 paths = loops.',
            'Loop symptoms: broadcast storm, MAC table instability, link saturation, high CPU.',
            'Ethernet has no TTL/Hop Limit; IPv4 TTL and IPv6 Hop Limit only protect Layer 3.',
            'Broadcasts, multicasts and unknown unicasts loop; known unicasts can be duplicated.',
            'STA: elect a root bridge, block redundant paths, single least-cost path to the root, recalculate on failure.',
            'STP is on by default on Cisco switches.',
          ],
          traps: [
            { trap: 'Thinking a router-style TTL will eventually stop a looping frame.', fix: 'Frames have no TTL. Only the packet inside has one, and switches never look at it.' },
            { trap: 'Thinking STP removes redundant links.', fix: 'The links stay physically connected; STP only blocks ports logically and reopens them on failure.' },
            { trap: 'Thinking IPv6 is immune to loops because it has no broadcasts.', fix: 'Neighbor Discovery uses Layer 2 multicasts, which are flooded and loop just like broadcasts.' },
          ],
          analogy: 'A ring road with no exits: cars (frames) that enter keep circling and the traffic only grows. STP closes one segment of the ring with a gate that opens only if another segment is closed by an accident.',
          explain: [
            { q: 'Why does a broadcast storm grow instead of fading out?', a: 'Every switch floods each broadcast out of all other ports, so copies multiply on every loop and nothing in the Ethernet frame ever expires.' },
            { q: 'Why does a loop make the MAC table unstable?', a: 'Copies of the same frame arrive on different ports, so the switch keeps re-learning the source MAC on whichever port it saw last.' },
            { q: 'What does STP do when an active link fails?', a: 'It recalculates the tree and moves a previously blocked port to forwarding, restoring a path.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 5.2 */
      {
        id: '5.2', title: 'STP Operations',
        objective: 'Explain how STP operates in a simple switched network.', slides: '23–38',
        read: `
<h3>Steps to a loop-free topology</h3>
<p>Switches exchange <b>Bridge Protocol Data Units (BPDUs)</b> and run the STA in four steps:</p>
<ol class="steps"><li>Elect the <b>root bridge</b>.</li><li>Elect the <b>root ports</b>.</li><li>Elect the <b>designated ports</b>.</li><li>Elect the <b>alternate (blocked) ports</b>.</li></ol>

<h3>Bridge ID (BID)</h3>
<p>Every BPDU carries the sender's BID. The <b>lowest BID wins</b>. It has three fields:</p>
<table class="t"><tr><th>Field</th><th>Meaning</th></tr>
<tr><td><b>Bridge priority</b></td><td>Default <b>32768</b>. Range 0–61440 in increments of <b>4096</b>. Lower is preferred; 0 beats everything.</td></tr>
<tr><td><b>Extended system ID</b></td><td>The VLAN ID, added to the priority so each VLAN has its own BID (PVST).</td></tr>
<tr><td><b>MAC address</b></td><td>Tie-breaker: with equal priority and system ID, the lowest MAC (in hex) wins.</td></tr></table>

<h3>1. Elect the root bridge</h3>
<ul>
  <li>All switches in the broadcast domain take part. After boot, each switch sends BPDUs every <b>2 seconds</b> containing its own BID and the <b>Root ID</b> (the BID of the root it believes in).</li>
  <li>At first every switch claims to be the root. As BPDUs are exchanged, all switches agree on the lowest BID.</li>
  <li><b>Impact of default BIDs:</b> with defaults every switch has priority <b>32769</b> in VLAN 1 (32768 + extended system ID 1), so the <b>lowest MAC address</b> decides. Administrators should set a lower priority on the switch they want as root.</li>
</ul>

<h3>Root path cost</h3>
<p>The <b>internal root path cost</b> is the sum of the port costs along the path to the root. A switch adds the cost of the port that <b>received</b> the BPDU. Default costs depend on speed (Cisco uses the IEEE 802.1D <b>short</b> path costs for both STP and RSTP):</p>
<table class="t"><tr><th>Link speed</th><th>STP cost (802.1D-1998)</th><th>RSTP cost (802.1w-2004, long)</th></tr>
<tr><td>10 Gb/s</td><td>2</td><td>2,000</td></tr><tr><td>1 Gb/s</td><td>4</td><td>20,000</td></tr>
<tr><td>100 Mb/s</td><td>19</td><td>200,000</td></tr><tr><td>10 Mb/s</td><td>100</td><td>2,000,000</td></tr></table>
<p>Port cost is configurable, which lets an administrator steer the tree.</p>

<h3>2. Elect the root ports</h3>
<p>Every <b>non-root</b> switch selects <b>one root port</b>: the port with the lowest internal root path cost. Example: S2 can reach root S1 directly (cost 19) or through S3 (19 + 19 = 38), so its direct port F0/1 becomes the root port.</p>

<h3>3. Elect designated ports</h3>
<p>Every segment between two switches has <b>one designated port</b>: the port on that segment with the best (lowest) path cost to the root.</p>
<ul>
  <li>All ports on the root bridge are designated ports.</li>
  <li>If one end of a segment is a root port, the other end is a designated port.</li>
  <li>All ports attached to end devices are designated ports.</li>
  <li>On a segment between two non-root switches, the port on the switch with the lower-cost path to the root is designated.</li>
</ul>
<div class="errata"><b>Slide errata (slide 29):</b> the slide says the designated port "has the internal root path cost to the root bridge". A word is missing: it is the port with the <b>lowest</b> internal root path cost on that segment.</div>

<h3>4. Elect alternate (blocked) ports</h3>
<p>A port that is neither root nor designated becomes an <b>alternate</b> (or backup) port, in the <b>blocking/discarding</b> state. In the deck's example, F0/2 on S3 blocks; all other inter-switch ports forward. This is the loop-prevention part of STP.</p>

<h3>Equal-cost paths: the tie-breakers</h3>
<p>When a switch has several equal-cost paths to the root, it chooses its root port by, in order:</p>
<ol class="steps">
  <li><b>Lowest sender BID</b>: S2 has equal paths through S3 (BID 32769.5555.5555.5555) and S4 (32769.1111.1111.1111); the port towards S4 wins.</li>
  <li><b>Lowest sender port priority</b>: two links to the same neighbour tie on the BID; the neighbour's port priority (default <b>128</b>) is compared. Lowering the priority on one of the root's ports makes the adjacent port the root port.</li>
  <li><b>Lowest sender port ID</b>: if still tied, the lower port ID <b>on the sending switch</b> wins. S4's port connected to S1 F0/1 becomes root port (F0/6); S4 F0/5 becomes alternate. The receiver's own port numbers do not matter.</li>
</ol>

<h3>Timers and port states</h3>
<table class="t"><tr><th>Timer</th><th>Default</th><th>Range</th><th>Meaning</th></tr>
<tr><td>Hello</td><td>2 s</td><td>1–10 s</td><td>Interval between BPDUs.</td></tr>
<tr><td>Forward delay</td><td>15 s</td><td>4–30 s</td><td>Time spent in each of listening and learning.</td></tr>
<tr><td>Max age</td><td>20 s</td><td>6–40 s</td><td>How long a switch waits before changing the topology.</td></tr></table>
<p>Timers are set on the root bridge and dictate the values for the whole STP domain. A port must not jump straight from blocking to forwarding without knowing the topology, so 802.1D has five states (four operational, disabled is non-operational):</p>
<table class="t"><tr><th>State</th><th>BPDUs</th><th>MAC address table</th><th>Forwards data frames</th></tr>
<tr><td>Blocking</td><td>Receive only</td><td>No update</td><td>No</td></tr>
<tr><td>Listening</td><td>Receive and send</td><td>No update</td><td>No</td></tr>
<tr><td>Learning</td><td>Receive and send</td><td>Updating</td><td>No</td></tr>
<tr><td>Forwarding</td><td>Receive and send</td><td>Updating</td><td>Yes</td></tr>
<tr><td>Disabled</td><td>None</td><td>No update</td><td>No</td></tr></table>
<p>Blocking to forwarding normally takes max age (20 s) + listening (15 s) + learning (15 s) = up to <b>50 seconds</b>.</p>

<h3>Per-VLAN Spanning Tree</h3>
<p>In PVST versions, a separate STP instance runs <b>per VLAN</b>, each with its own root bridge, so different VLANs can use different roots. If every port is in VLAN 1 there is only one instance.</p>
<pre class="cli">S2# show spanning-tree vlan 1
VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    24577
             Address     0001.4320.ABCD
             Cost        19
             Port        1(FastEthernet0/1)
  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     000A.F3C4.5A01
Interface        Role Sts Cost      Prio.Nbr Type
---------------- ---- --- --------- -------- --------
Fa0/1            Root FWD 19        128.1    P2p
Fa0/2            Altn BLK 19        128.2    P2p</pre>`,
        understand: {
          big: 'Lowest BID becomes root; every other switch keeps its single cheapest path to the root (root port); each segment keeps one designated port; every other port blocks.',
          why: 'You must be able to predict the root bridge and every port role in a topology diagram, and read them from show spanning-tree.',
          keys: [
            'BID = priority (default 32768, steps of 4096) + extended system ID (VLAN) + MAC. Lowest wins.',
            'Default priority in VLAN 1 shows as 32769; ties are broken by the lowest MAC.',
            'Costs: 10 Gb/s 2, 1 Gb/s 4, 100 Mb/s 19, 10 Mb/s 100 (short costs).',
            'Root port: one per non-root switch, lowest root path cost. Designated port: one per segment. All root bridge ports are designated.',
            'Tie-breakers: lowest sender BID, then lowest sender port priority (default 128), then lowest sender port ID.',
            'Timers: hello 2 s, forward delay 15 s, max age 20 s. States: blocking, listening, learning, forwarding, disabled.',
          ],
          traps: [
            { trap: 'Choosing the root by the highest priority or the highest MAC.', fix: 'Everything in STP prefers the lowest value: BID, cost, priority, port ID.' },
            { trap: 'Comparing your own port IDs to break a tie.', fix: 'The tie-breakers use the sender\'s BID, the sender\'s port priority and the sender\'s port ID.' },
            { trap: 'Thinking the root bridge has a root port.', fix: 'The root bridge has no root port; all its ports are designated.' },
            { trap: 'Thinking learning state forwards frames.', fix: 'Learning only fills the MAC table; only forwarding forwards data.' },
          ],
          analogy: 'Choosing a meeting point (root) by the lowest employee number, then everyone takes their shortest route there. On every corridor where two people could walk, only the one closest to the meeting point keeps the door open; the other door is locked.',
          explain: [
            { q: 'All switches have default priority. How is the root chosen?', a: 'The priorities (32769 in VLAN 1) tie, so the switch with the lowest MAC address becomes root.' },
            { q: 'S3 has two paths to the root, cost 19 and cost 38. Which is its root port?', a: 'The port on the cost-19 path; the root port is the lowest internal root path cost.' },
            { q: 'Why does a port go through listening and learning before forwarding?', a: 'So it learns the topology and fills the MAC table before forwarding, instead of creating a temporary loop.' },
          ],
          widgets: ['stpelect'],
        },
      },
      /* ------------------------------------------------------------------ 5.3 */
      {
        id: '5.3', title: 'Evolution of STP',
        objective: 'Explain how Rapid PVST+ operates.', slides: '40–46',
        read: `
<h3>Different versions of STP</h3>
<p>"STP" is used loosely for all spanning tree variants. Strictly, IEEE 802.1D-2004 says STP has been <b>superseded by RSTP</b>. Cisco switches with IOS 15.0 or later run <b>PVST+</b> by default; Rapid PVST+ must be configured explicitly.</p>
<table class="t"><tr><th>Variety</th><th>Description</th></tr>
<tr><td><b>STP</b> (802.1D-1998)</td><td>Original standard. One spanning tree for the whole bridged network regardless of VLANs (Common Spanning Tree, CST).</td></tr>
<tr><td><b>PVST+</b></td><td>Cisco enhancement: a separate 802.1D instance per VLAN. Supports PortFast, UplinkFast, BackboneFast, BPDU guard, BPDU filter, root guard, loop guard.</td></tr>
<tr><td><b>802.1D-2004</b></td><td>Updated STP standard that incorporates 802.1w.</td></tr>
<tr><td><b>RSTP</b> (802.1w)</td><td>Faster convergence than STP.</td></tr>
<tr><td><b>Rapid PVST+</b></td><td>Cisco enhancement: a separate 802.1w (RSTP) instance per VLAN. Supports PortFast, BPDU guard, BPDU filter, root guard, loop guard.</td></tr>
<tr><td><b>MSTP</b></td><td>IEEE standard (inspired by Cisco MISTP) that maps multiple VLANs into the same instance.</td></tr>
<tr><td><b>MST</b></td><td>Cisco's MSTP: up to 16 RSTP instances, grouping VLANs with the same topology.</td></tr></table>

<h3>RSTP concepts</h3>
<ul>
  <li>RSTP (802.1w) supersedes 802.1D but stays <b>backward compatible</b>. Terminology and most parameters are unchanged, and the same algorithm chooses port roles.</li>
  <li>It recalculates much faster: a few hundred milliseconds in a well-designed network. An <b>alternate port can move to forwarding immediately</b> without waiting for the network to converge.</li>
  <li><b>Rapid PVST+</b> is Cisco's per-VLAN RSTP: an independent RSTP instance per VLAN.</li>
</ul>

<h3>RSTP port states and roles</h3>
<p>RSTP has only <b>three states</b>: <b>discarding</b> (802.1D disabled, blocking and listening merged), <b>learning</b> and <b>forwarding</b>.</p>
<p>Root and designated ports are the same as in STP. The old "blocked" role is split into two:</p>
<ul><li><b>Alternate port</b>: an alternate path to the root bridge.</li>
<li><b>Backup port</b>: a backup to a shared medium such as a hub (rare, because hubs are legacy).</li></ul>

<h3>PortFast and BPDU Guard</h3>
<ul>
  <li>Without PortFast, a port that comes up spends 15 s listening + 15 s learning = <b>30 seconds</b> before forwarding. DHCP clients can time out and end up with no valid IPv4 address.</li>
  <li><b>PortFast</b> moves an access port from blocking to forwarding <b>immediately</b>. Use it <b>only on access ports</b> to end devices. On a port to another switch it risks a loop.</li>
  <li>A PortFast port should never receive a BPDU (that would mean a switch is attached). <b>BPDU Guard</b> puts the port in the <b>errdisabled</b> state as soon as a BPDU arrives. An administrator must re-enable it manually.</li>
</ul>
<pre class="cli">S1(config)# spanning-tree mode rapid-pvst
S1(config)# interface fa0/6
S1(config-if)# spanning-tree portfast
S1(config-if)# spanning-tree bpduguard enable</pre>

<h3>Alternatives to STP</h3>
<p>Networks grew from a few switches to hierarchical designs with access, distribution and core layers, sometimes hundreds of switches and thousands of VLANs. STP adapted (RSTP, MSTP), but it does not converge as fast or as predictably as Layer 3 routing. Routing allows redundant paths and loops <b>without blocking ports</b>, so many designs now use <b>Layer 3 everywhere except at the access layer</b>: the access-to-distribution links are routed links.</p>`,
        understand: {
          big: 'RSTP keeps the STP election but converges in milliseconds; Rapid PVST+ runs one RSTP instance per VLAN; PortFast and BPDU Guard make access ports start instantly and stay safe.',
          why: 'Modern Cisco networks run Rapid PVST+ with PortFast on edge ports, and the exam tests the version table and the RSTP states and roles.',
          keys: [
            'Cisco IOS 15+ default: PVST+. Configure Rapid PVST+ with spanning-tree mode rapid-pvst.',
            'Per VLAN: PVST+ (802.1D) and Rapid PVST+ (802.1w). Many VLANs per instance: MSTP / MST (up to 16 instances).',
            'RSTP states: discarding, learning, forwarding (discarding = disabled + blocking + listening).',
            'RSTP roles: root, designated, alternate (other path to root), backup (redundant path to a shared segment).',
            'PortFast skips the 30 s of listening + learning. Access ports only.',
            'BPDU Guard err-disables a PortFast port that receives a BPDU.',
          ],
          traps: [
            { trap: 'Saying RSTP has five port states.', fix: 'RSTP has three: discarding, learning, forwarding.' },
            { trap: 'Enabling PortFast on a link between switches to speed it up.', fix: 'PortFast belongs only on edge ports; on inter-switch links it can create a temporary loop.' },
            { trap: 'Thinking BPDU Guard blocks only the BPDU.', fix: 'It error-disables the whole port; it stays down until you recover it.' },
            { trap: 'Confusing the alternate and backup roles.', fix: 'Alternate = another path to the root bridge. Backup = a second port onto the same shared segment.' },
          ],
          analogy: 'PortFast is a staff entrance: employees (end devices) walk straight in without the 30-second security check. BPDU Guard is the guard who locks that door the moment someone tries to drive a truck (a switch) through it.',
          explain: [
            { q: 'Why can DHCP fail on a switch port without PortFast?', a: 'The port spends about 30 seconds in listening and learning, and the client may give up on DHCP before the port forwards.' },
            { q: 'What is the difference between PVST+ and Rapid PVST+?', a: 'Both run one instance per VLAN, but PVST+ uses 802.1D and Rapid PVST+ uses 802.1w (RSTP) with faster convergence.' },
            { q: 'Why do many designs use Layer 3 links between access and distribution switches?', a: 'Routing allows redundant active paths and converges predictably, without STP blocking ports.' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
