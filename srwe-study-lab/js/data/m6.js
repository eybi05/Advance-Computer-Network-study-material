/* Module 6 — EtherChannel (SRWE v7, slides in SRWE_Module_6.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm6', num: 6, title: 'EtherChannel',
    objective: 'Troubleshoot EtherChannel on switched links.',
    deck: 'SRWE_Module_6.pptx',
    topics: [
      /* ------------------------------------------------------------------ 6.1 */
      {
        id: '6.1', title: 'EtherChannel Operation',
        objective: 'Describe EtherChannel technology.', slides: '12–21',
        read: `
<h3>Link aggregation</h3>
<p>Sometimes one link between devices does not give enough bandwidth or redundancy. You could add more cables, but <b>STP blocks the redundant links</b> to prevent loops. You need a way to use redundant links that STP will not block: <b>EtherChannel</b>.</p>
<p>EtherChannel is a link aggregation technology that groups several physical Ethernet links into <b>one logical link</b>. It gives fault tolerance, load sharing, more bandwidth and redundancy between switches, routers and servers. Cisco originally built it to group Fast Ethernet or Gigabit Ethernet switch ports.</p>
<p>The virtual interface that results is a <b>port channel</b> (<code>interface port-channel N</code>).</p>

<h3>Advantages</h3>
<ul>
  <li>Most configuration is done <b>once on the port-channel interface</b>, so the links stay consistent.</li>
  <li>Uses existing ports: no need to upgrade to a faster, more expensive link.</li>
  <li><b>Load balancing</b> happens across the links in the same EtherChannel.</li>
  <li>STP sees <b>one logical link</b>. With one EtherChannel between two switches all its links are active. With several EtherChannels between two switches, STP may block a whole bundle.</li>
  <li>Losing one physical link inside the channel does <b>not change the topology</b>.</li>
</ul>

<h3>Implementation restrictions</h3>
<ul>
  <li>Interface types cannot be mixed: no Fast Ethernet and Gigabit Ethernet in one channel.</li>
  <li>Up to <b>eight</b> compatibly configured ports per EtherChannel: up to 800 Mb/s (Fast EtherChannel) or 8 Gb/s (Gigabit EtherChannel), full duplex.</li>
  <li>A Catalyst 2960 supports up to <b>six</b> EtherChannels.</li>
  <li>Member configuration must be consistent on both devices: if one side's ports are trunks, the other side's must be trunks with the same native VLAN. All ports must be Layer 2 ports.</li>
  <li>Configuration on the port-channel interface affects every member interface.</li>
</ul>

<h3>Negotiation protocols</h3>
<p>EtherChannels can be negotiated with <b>PAgP</b> or <b>LACP</b>, or configured statically (unconditionally) without either.</p>
<div class="cols">
  <div><h4>PAgP (Cisco proprietary)</h4>
  <p>Port Aggregation Protocol ("Pag-P"). PAgP packets every <b>30 seconds</b> negotiate the channel, check configuration consistency, and manage link additions and failures. The channel joins STP as a single port.</p>
  <ul><li><b>On</b>: channel without PAgP; no packets exchanged.</li>
  <li><b>Desirable</b>: actively starts negotiation.</li>
  <li><b>Auto</b>: passive; only answers PAgP packets.</li></ul></div>
  <div><h4>LACP (IEEE 802.3ad)</h4>
  <p>Link Aggregation Control Protocol: an open standard, so it works in <b>multivendor</b> networks. Same benefits as PAgP. Cisco devices support both.</p>
  <ul><li><b>On</b>: channel without LACP.</li>
  <li><b>Active</b>: actively starts negotiation.</li>
  <li><b>Passive</b>: only answers LACP packets.</li></ul></div>
</div>
<p>All ports must have the same <b>speed, duplex and VLAN information</b>. Changing a port after the channel exists changes all the other channel ports too.</p>

<h3>Mode combinations</h3>
<table class="t"><tr><th>S1</th><th>S2</th><th>Channel?</th></tr>
<tr><td>On</td><td>On</td><td>Yes</td></tr>
<tr><td>On</td><td>Desirable/Auto or Active/Passive</td><td><b>No</b></td></tr>
<tr><td>Desirable / Active</td><td>Desirable / Active</td><td>Yes</td></tr>
<tr><td>Desirable / Active</td><td>Auto / Passive</td><td>Yes</td></tr>
<tr><td>Auto / Passive</td><td>Auto / Passive</td><td><b>No</b>: both wait for the other</td></tr></table>
<p>Mode <b>on</b> only works with <b>on</b>. Because <b>on</b> does not negotiate, nothing checks that all links end on the other switch or that the configuration is compatible.</p>`,
        understand: {
          big: 'EtherChannel bundles up to eight identical links into one logical port channel, so STP sees one link and all physical links carry traffic.',
          why: 'It is the standard way to add bandwidth and redundancy between switches, and the mode table is a favourite exam question.',
          keys: [
            'Without EtherChannel, STP blocks redundant parallel links.',
            'Logical interface: port channel. Configure it once on interface port-channel N.',
            'Up to 8 ports per channel; same type, speed, duplex and VLAN settings; 2960: up to 6 EtherChannels.',
            'PAgP (Cisco): on, desirable (active), auto (passive). Packets every 30 s.',
            'LACP (IEEE 802.3ad): on, active, passive. Multivendor.',
            'Works: on/on, active with active or passive, desirable with desirable or auto. Fails: passive/passive, auto/auto, on with any negotiating mode.',
          ],
          traps: [
            { trap: 'Pairing mode on with desirable or active.', fix: 'On sends no negotiation packets, so the other side never forms the channel. On only pairs with on.' },
            { trap: 'Mixing PAgP and LACP modes (desirable with active).', fix: 'Both ends must use the same protocol.' },
            { trap: 'Thinking passive/passive or auto/auto forms a channel.', fix: 'Both sides wait for the other; someone must actively negotiate.' },
            { trap: 'Mixing FastEthernet and GigabitEthernet ports in one channel.', fix: 'All members must be the same type and speed.' },
          ],
          analogy: 'Four single-lane roads between two towns, where the traffic police (STP) closed three to avoid circular traffic. EtherChannel turns them into one four-lane motorway, so nothing needs closing.',
          explain: [
            { q: 'Why does STP not block the links of an EtherChannel?', a: 'STP sees the bundle as one logical link (one port), so there is no loop between the two switches.' },
            { q: 'S1 uses LACP active and S2 uses LACP passive. Does a channel form?', a: 'Yes: the active side starts negotiation and the passive side answers.' },
            { q: 'What is the danger of mode on?', a: 'There is no negotiation, so mismatched or miswired links are not detected.' },
          ],
          widgets: ['ecmodes'],
        },
      },
      /* ------------------------------------------------------------------ 6.2 */
      {
        id: '6.2', title: 'Configure EtherChannel',
        objective: 'Configure EtherChannel.', slides: '23–26',
        read: `
<h3>Configuration guidelines</h3>
<ul>
  <li><b>EtherChannel support</b>: all Ethernet interfaces must support it; they do not need to be physically contiguous.</li>
  <li><b>Speed and duplex</b>: the same on every interface in the channel.</li>
  <li><b>VLAN match</b>: all interfaces in the same access VLAN, or all trunks.</li>
  <li><b>Range of VLANs</b>: a trunking EtherChannel needs the same allowed VLAN range on every interface. Otherwise the ports do not form a channel, even in auto or desirable mode.</li>
</ul>
<p>If these settings must change, change them on the <b>port-channel interface</b>. Configuration on the port channel is applied to all members; configuration on an individual member does not affect the port channel and can make it incompatible.</p>
<p>The port channel can be an <b>access</b> port, a <b>trunk</b> (most common) or a <b>routed</b> port.</p>

<h3>LACP configuration: three steps</h3>
<ol class="steps">
  <li>Select the member interfaces with <code>interface range</code>.</li>
  <li>Create the port channel with <code>channel-group <i>identifier</i> mode active</code> (LACP).</li>
  <li>Configure Layer 2 settings on <code>interface port-channel <i>identifier</i></code>, for example a trunk with allowed VLANs.</li>
</ol>
<pre class="cli">S1(config)# interface range FastEthernet 0/1 - 2
S1(config-if-range)# channel-group 1 mode active
Creating a port-channel interface Port-channel 1
S1(config-if-range)# exit
S1(config)# interface port-channel 1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk allowed vlan 1,2,20</pre>
<p>For PAgP use <code>mode desirable</code> or <code>mode auto</code>; for a static channel use <code>mode on</code>.</p>
<div class="note"><b>Packet Tracer 6.2.4 (Configure EtherChannel):</b> PAgP between S1 and S3, LACP between S1 and S2, and a redundant channel. The <a href="#lab-m6-etherchannel">EtherChannel lab</a> here follows the same idea.</div>`,
        understand: {
          big: 'Select the members with interface range, put them in a channel group with a mode, then configure the logical port-channel interface.',
          why: 'You will configure EtherChannel in labs and the skills exam; the order of the commands and where settings go matter.',
          keys: [
            'interface range fa0/1 - 2 → channel-group 1 mode active|passive|desirable|auto|on.',
            'The channel-group command creates interface Port-channel 1.',
            'Trunk/VLAN settings go on interface port-channel 1; they apply to all members.',
            'All members: same speed, duplex, access VLAN or trunk mode, native VLAN and allowed VLANs.',
            'A port channel can be access, trunk or routed.',
          ],
          traps: [
            { trap: 'Configuring the trunk on just one member port afterwards.', fix: 'Configure trunking on the port-channel interface so every member matches.' },
            { trap: 'Using different allowed VLAN lists on the members.', fix: 'Members with different allowed VLANs do not bundle, even with auto/desirable.' },
            { trap: 'Forgetting that channel-group needs a mode.', fix: 'channel-group 1 mode active (or passive, desirable, auto, on).' },
          ],
          analogy: 'Gather the cables into one bundle (interface range + channel-group), then label the bundle, not each wire (interface port-channel).',
          explain: [
            { q: 'Which command creates the logical interface Port-channel 1?', a: 'channel-group 1 mode … on the member interfaces creates it automatically.' },
            { q: 'Where do you set switchport mode trunk for an EtherChannel?', a: 'On interface port-channel N; it is pushed to all member interfaces.' },
            { q: 'Two members have different allowed VLAN lists. What happens?', a: 'The ports are incompatible and do not form the EtherChannel.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 6.3 */
      {
        id: '6.3', title: 'Verify and Troubleshoot EtherChannel',
        objective: 'Troubleshoot EtherChannel.', slides: '28–35',
        read: `
<h3>Verify EtherChannel</h3>
<table class="t"><tr><th>Command</th><th>Shows</th></tr>
<tr><td><code>show interfaces port-channel</code></td><td>General status of the port-channel interface.</td></tr>
<tr><td><code>show etherchannel summary</code></td><td>One line per port channel: flags, protocol and member ports.</td></tr>
<tr><td><code>show etherchannel port-channel</code></td><td>Details about a specific port channel.</td></tr>
<tr><td><code>show interfaces etherchannel</code></td><td>The role of a physical member interface.</td></tr></table>
<pre class="cli">S1# show etherchannel summary
Flags:  D - down        P - bundled in port-channel
        I - stand-alone s - suspended
        R - Layer3      S - Layer2
        U - in use      N - not in use, no aggregation
Number of channel-groups in use: 1
Group  Port-channel  Protocol    Ports
------+-------------+-----------+---------------------------
1      Po1(SU)         LACP      Fa0/1(P)    Fa0/2(P)</pre>
<p><b>SU</b> = Layer 2 and in use; <b>P</b> = bundled. <b>SD</b> or <b>(D)</b> means down; <b>(s)</b> suspended; <b>(I)</b> stand-alone.</p>

<h3>Common issues</h3>
<p>All interfaces in an EtherChannel need the same speed and duplex, the same native and allowed VLANs on trunks, and the same access VLAN on access ports. Typical problems:</p>
<ul>
  <li>Member ports are not in the same VLAN, or not all trunks. Ports with <b>different native VLANs</b> cannot form an EtherChannel.</li>
  <li>Trunking configured on some members but not all. Configure trunking on the port channel and verify it there.</li>
  <li>Different allowed VLAN ranges: no channel, even with PAgP auto or desirable.</li>
  <li>Incompatible PAgP/LACP negotiation modes on the two ends.</li>
</ul>

<h3>Troubleshooting example</h3>
<ol class="steps">
  <li><b>View the summary</b>: <code>show etherchannel summary</code> shows <code>Po1(SD)</code> with protocol <b>-</b> and members <code>Fa0/1(D) Fa0/2(D)</code>: the channel is down.</li>
  <li><b>View the configuration</b>: <code>show run | begin interface port-channel</code> shows S1 members in <code>channel-group 1 mode on</code> and S2 members in <code>mode desirable</code>: incompatible modes.</li>
  <li><b>Correct it</b>: on S1, remove and re-create the channel with PAgP desirable.</li>
  <li><b>Verify</b>: the summary now shows <code>Po1(SU)</code>, protocol <b>PAgP</b>, members <code>(P)</code>.</li>
</ol>
<pre class="cli">S1(config)# no interface port-channel 1
S1(config)# interface range fa0/1 - 2
S1(config-if-range)# channel-group 1 mode desirable
Creating a port-channel interface Port-channel 1
S1(config-if-range)# no shutdown
S1(config-if-range)# interface port-channel 1
S1(config-if)# switchport mode trunk
S1(config-if)# end</pre>
<p>EtherChannel and STP must interoperate, so the order of commands matters. That is why the port channel is <b>removed and re-added</b> with <code>channel-group</code> instead of being changed in place; changing it directly can put ports into blocking or errdisabled.</p>
<div class="errata"><b>Slide errata (slide 33):</b> the screenshot enters the <code>interface range fa0/1 - 2</code> / <code>channel-group 1 mode desirable</code> / <code>no shutdown</code> lines twice. Once is enough; the commands above show the sequence without the duplicate.</div>`,
        understand: {
          big: 'show etherchannel summary tells you at a glance: SU and P mean working; SD, D, s or I mean find the mismatch in mode, VLANs, trunking, speed or duplex.',
          why: 'EtherChannel faults are almost always configuration mismatches, and the exam expects you to read the flags and find the mismatch.',
          keys: [
            'show etherchannel summary: one line per channel with flags, protocol and members.',
            'Good: Po1(SU), members (P). Bad: (SD), (D) down, (s) suspended, (I) stand-alone.',
            'Mismatches that break a channel: modes, native VLAN, allowed VLANs, trunk vs access, access VLAN, speed, duplex.',
            'To change the mode: no interface port-channel N, then channel-group N mode … again.',
            'Protocol column "-" means no negotiation protocol (mode on).',
          ],
          traps: [
            { trap: 'Reading Po1(SD) as working because the port channel exists.', fix: 'D means down. You need U (in use) and members with P.' },
            { trap: 'Changing the channel mode directly on an existing channel.', fix: 'Remove the port channel and re-add the members with channel-group, as the deck shows.' },
            { trap: 'Assuming native VLAN mismatches only cause CDP warnings.', fix: 'Members with different native VLANs cannot bundle at all.' },
          ],
          analogy: 'The summary is a dashboard light: green (SU/P) means the motorway is open; any other letter tells you which lane is closed and why to look.',
          explain: [
            { q: 'show etherchannel summary shows Po1(SD) with protocol "-". What is your first suspicion?', a: 'Mode on on one side with a negotiating mode (or nothing) on the other: the channel is down.' },
            { q: 'Name three settings that must match on all member ports.', a: 'Any three of: speed, duplex, access VLAN or trunk mode, native VLAN, allowed VLAN list.' },
            { q: 'How do you change S1 from mode on to desirable safely?', a: 'no interface port-channel 1, then interface range fa0/1 - 2 and channel-group 1 mode desirable, then reconfigure the port channel.' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
