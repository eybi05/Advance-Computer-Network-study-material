/* Module 4 — Inter-VLAN Routing (SRWE v7, slides in SRWE_Module_4.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm4', num: 4, title: 'Inter-VLAN Routing',
    objective: 'Troubleshoot inter-VLAN routing on Layer 3 devices.',
    deck: 'SRWE_Module_4.pptx',
    topics: [
      /* ------------------------------------------------------------------ 4.1 */
      {
        id: '4.1', title: 'Inter-VLAN Routing Operation',
        objective: 'Describe options for configuring inter-VLAN routing.', slides: '12–17',
        read: `
<h3>What is inter-VLAN routing?</h3>
<p>Hosts in one VLAN cannot communicate with hosts in another VLAN unless a <b>router</b> or a <b>Layer 3 switch</b> provides routing. <b>Inter-VLAN routing</b> is the process of forwarding traffic from one VLAN to another.</p>
<table class="t"><tr><th>Option</th><th>Verdict</th></tr>
<tr><td><b>Legacy inter-VLAN routing</b></td><td>A legacy solution. It does not scale well.</td></tr>
<tr><td><b>Router-on-a-stick</b></td><td>Acceptable for small to medium-sized networks.</td></tr>
<tr><td><b>Layer 3 switch with SVIs</b></td><td>The most scalable solution, for medium to large organizations.</td></tr></table>

<h3>Legacy inter-VLAN routing</h3>
<p>A router with several Ethernet interfaces, each connected to a switch port in a different VLAN. Each router interface is the default gateway for its VLAN subnet (for example G0/0/0 = 192.168.10.1 for VLAN 10 and G0/0/1 = 192.168.20.1 for VLAN 20).</p>
<p>It works, but it is <b>not scalable</b>: you need <b>one physical router interface per VLAN</b>, and routers have few interfaces. It is no longer implemented and is described only for explanation.</p>

<h3>Router-on-a-stick</h3>
<p>Overcomes the legacy limit: only <b>one physical Ethernet interface</b> routes traffic between many VLANs.</p>
<ul>
  <li>The router interface is configured as an <b>802.1Q trunk</b> and connected to a trunk port on a Layer 2 switch.</li>
  <li>The router interface is divided into <b>subinterfaces</b>: software-based virtual interfaces on one physical interface.</li>
  <li>Each subinterface gets its own IP address and VLAN assignment, in the subnet of its VLAN.</li>
  <li>Tagged traffic arriving on the trunk goes to the matching subinterface. After the routing decision, if the exit is another 802.1Q subinterface, the frame is <b>re-tagged with the new VLAN</b> and sent back out the same physical interface.</li>
</ul>
<div class="note"><b>Note:</b> router-on-a-stick does not scale beyond about <b>50 VLANs</b>.</div>

<h3>Inter-VLAN routing on a Layer 3 switch</h3>
<p>The modern method uses <b>Layer 3 switches</b> and <b>switched virtual interfaces (SVIs)</b>. (A Layer 3 switch is also called a multilayer switch.) Inter-VLAN SVIs are created the same way as the management SVI; although virtual, each SVI does the job of a router interface for its VLAN.</p>
<p>Advantages:</p>
<ul>
  <li>Much <b>faster</b> than router-on-a-stick: everything is switched and routed in hardware.</li>
  <li>No external link from the switch to a router is needed for routing.</li>
  <li>Not limited to one link: Layer 2 EtherChannels can be used as trunks between switches for more bandwidth.</li>
  <li><b>Lower latency</b>: data does not leave the switch to be routed.</li>
  <li>More commonly deployed in campus LANs than routers.</li>
</ul>
<p>The only disadvantage: Layer 3 switches are <b>more expensive</b>.</p>`,
        understand: {
          big: 'Something at Layer 3 must route between VLANs: one router port per VLAN (legacy), subinterfaces on one router trunk (router-on-a-stick), or SVIs inside a Layer 3 switch.',
          why: 'Choosing and comparing the three methods is a standard exam question, and knowing their limits explains real design choices.',
          keys: [
            'Legacy: one router interface per VLAN; does not scale.',
            'Router-on-a-stick: one router interface as an 802.1Q trunk with one subinterface per VLAN; up to about 50 VLANs.',
            'Layer 3 switch: one SVI per VLAN, routing in hardware; fastest and most scalable; costs more.',
            'Each subinterface or SVI is the default gateway for its VLAN.',
            'Router-on-a-stick traffic goes up and back down the same link (re-tagged with the new VLAN).',
          ],
          traps: [
            { trap: 'Thinking router-on-a-stick needs one cable per VLAN.', fix: 'That is legacy inter-VLAN routing. Router-on-a-stick uses one trunk link.' },
            { trap: 'Saying a Layer 3 switch\'s main disadvantage is speed.', fix: 'It is faster; the disadvantage is cost.' },
            { trap: 'Forgetting that traffic between VLANs needs a Layer 3 device even on the same switch.', fix: 'A Layer 2 switch alone cannot forward between VLANs.' },
          ],
          analogy: 'Legacy is one door per room; router-on-a-stick is one revolving door that spins people between rooms; a Layer 3 switch puts the doors inside the building\'s walls.',
          explain: [
            { q: 'Why does legacy inter-VLAN routing not scale?', a: 'It needs one physical router interface per VLAN, and routers have a limited number of interfaces.' },
            { q: 'What happens to a frame from VLAN 10 to VLAN 20 on a router-on-a-stick?', a: 'It arrives tagged VLAN 10 on subinterface .10, is routed, and leaves the same physical interface tagged VLAN 20 via subinterface .20.' },
            { q: 'Give two advantages of Layer 3 switching for inter-VLAN routing.', a: 'Hardware switching makes it faster with lower latency; no external router link is needed; EtherChannel can add bandwidth.' },
          ],
          widgets: ['intervlan'],
        },
      },
      /* ------------------------------------------------------------------ 4.2 */
      {
        id: '4.2', title: 'Router-on-a-Stick Inter-VLAN Routing',
        objective: 'Configure router-on-a-stick inter-VLAN routing.', slides: '18–27',
        read: `
<h3>Scenario</h3>
<p>R1 G0/0/1 connects to S1 F0/5, and S1 F0/1 connects to S2 F0/1. Both links are <b>trunks</b>. PC1 (192.168.10.10/24, gateway .1) is in VLAN 10 on S1 F0/6; PC2 (192.168.20.10/24, gateway .1) is in VLAN 20 on S2 F0/18. The switch SVIs are in VLAN 99 (S1 192.168.99.2, S2 192.168.99.3).</p>
<table class="t"><tr><th>Subinterface</th><th>VLAN</th><th>IP address</th></tr>
<tr><td>G0/0/1.10</td><td>10</td><td>192.168.10.1/24</td></tr>
<tr><td>G0/0/1.20</td><td>20</td><td>192.168.20.1/24</td></tr>
<tr><td>G0/0/1.99</td><td>99</td><td>192.168.99.1/24</td></tr></table>
<div class="errata"><b>Slide errata (slides 19 and 39):</b> the table lists the VLAN 99 subinterface as <code>.30</code>, but the configuration on slide 23 uses <code>G0/0/1.99</code>. The number after the dot does not have to match the VLAN, but matching it is the convention, so this course uses <code>.99</code>.</div>
<p>Before configuration, PC1 and PC2 cannot ping each other (different networks), and only S1 and S2 can ping each other. The switches need VLANs and trunks, and the router needs inter-VLAN routing.</p>

<h3>S1 VLAN and trunking configuration</h3>
<ol class="steps"><li>Create and name the VLANs.</li><li>Create the management interface.</li><li>Configure access ports.</li><li>Configure trunking ports.</li></ol>
<pre class="cli">S1(config)# vlan 10
S1(config-vlan)# name LAN10
S1(config-vlan)# vlan 20
S1(config-vlan)# name LAN20
S1(config-vlan)# vlan 99
S1(config-vlan)# name Management
S1(config-vlan)# exit
S1(config)# interface vlan 99
S1(config-if)# ip add 192.168.99.2 255.255.255.0
S1(config-if)# no shut
S1(config-if)# exit
S1(config)# ip default-gateway 192.168.99.1
S1(config)# interface fa0/6
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 10
S1(config-if)# no shut
S1(config-if)# exit
S1(config)# interface fa0/1
S1(config-if)# switchport mode trunk
S1(config-if)# no shut
S1(config-if)# exit
S1(config)# interface fa0/5
S1(config-if)# switchport mode trunk
S1(config-if)# no shut
S1(config-if)# end</pre>
<h3>S2 VLAN and trunking configuration</h3>
<pre class="cli">S2(config)# vlan 10
S2(config-vlan)# name LAN10
S2(config-vlan)# exit
S2(config)# vlan 20
S2(config-vlan)# name LAN20
S2(config-vlan)# exit
S2(config)# vlan 99
S2(config-vlan)# name Management
S2(config-vlan)# exit
S2(config)# interface vlan 99
S2(config-if)# ip add 192.168.99.3 255.255.255.0
S2(config-if)# no shut
S2(config-if)# exit
S2(config)# ip default-gateway 192.168.99.1
S2(config)# interface fa0/18
S2(config-if)# switchport mode access
S2(config-if)# switchport access vlan 20
S2(config-if)# no shut
S2(config-if)# exit
S2(config)# interface fa0/1
S2(config-if)# switchport mode trunk
S2(config-if)# no shut
S2(config-if)# end</pre>

<h3>R1 subinterface configuration</h3>
<p>Create a subinterface for each VLAN with <code>interface <i>interface_id.subinterface_id</i></code>. Matching the subinterface number to the VLAN number is customary, not required. Each subinterface needs two commands:</p>
<ul>
  <li><code>encapsulation dot1q <i>vlan_id</i> [native]</code>: makes the subinterface respond to 802.1Q traffic of that VLAN. Add <code>native</code> only when the native VLAN is not VLAN 1.</li>
  <li><code>ip address <i>ip-address subnet-mask</i></code>: usually the default gateway of that VLAN.</li>
</ul>
<p>Each subinterface must be on a <b>unique subnet</b>. When all subinterfaces exist, enable the <b>physical</b> interface with <code>no shutdown</code>. If the physical interface is disabled, <b>all its subinterfaces are disabled</b>.</p>
<pre class="cli">R1(config)# interface G0/0/1.10
R1(config-subif)# description Default Gateway for VLAN 10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip add 192.168.10.1 255.255.255.0
R1(config-subif)# exit
R1(config)# interface G0/0/1.20
R1(config-subif)# description Default Gateway for VLAN 20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip add 192.168.20.1 255.255.255.0
R1(config-subif)# exit
R1(config)# interface G0/0/1.99
R1(config-subif)# description Default Gateway for VLAN 99
R1(config-subif)# encapsulation dot1Q 99
R1(config-subif)# ip add 192.168.99.1 255.255.255.0
R1(config-subif)# exit
R1(config)# interface G0/0/1
R1(config-if)# description Trunk link to S1
R1(config-if)# no shut
R1(config-if)# end</pre>

<h3>Verify</h3>
<p>From a host: check its configuration with <code>ipconfig</code>, then <code>ping</code> a host in another VLAN.</p>
<pre class="cli">C:\Users\PC1> ping 192.168.20.10
Reply from 192.168.20.10: bytes=32 time&lt;1ms TTL=127
C:\Users\PC1> ping 192.168.99.2
Request timed out.
Request timed out.
Reply from 192.168.99.2: bytes=32 time=2ms TTL=254</pre>
<p>The first replies may time out while ARP resolves addresses along the path. TTL=127 shows the reply crossed one router (128 − 1).</p>
<p>On the router and switches: <code>show ip route</code>, <code>show ip interface brief</code>, <code>show interfaces</code>, <code>show interfaces trunk</code>.</p>`,
        understand: {
          big: 'Router-on-a-stick = switch port to the router is a trunk + one router subinterface per VLAN (encapsulation dot1Q N + gateway IP) + no shutdown on the physical interface.',
          why: 'This is the most common inter-VLAN lab and skills-assessment task, and its failure points are exactly what module 4.4 asks you to troubleshoot.',
          keys: [
            'Switch port toward the router must be a trunk.',
            'One subinterface per VLAN: <code>interface G0/0/1.10</code>, <code>encapsulation dot1Q 10</code>, <code>ip address</code>.',
            'encapsulation must come before the IP address on a subinterface.',
            'Each subinterface IP = default gateway of its VLAN, in a unique subnet.',
            'no shutdown on the physical interface enables all subinterfaces.',
            'Use <code>native</code> on the encapsulation command only if the native VLAN is not 1.',
          ],
          traps: [
            { trap: 'Leaving the switch port to the router as an access port.', fix: 'Tagged frames for the subinterfaces cannot pass; configure <code>switchport mode trunk</code>.' },
            { trap: 'Typing the wrong VLAN in <code>encapsulation dot1Q</code> (e.g. 100 instead of 10).', fix: 'The subinterface never receives that VLAN\'s frames; hosts cannot reach their gateway.' },
            { trap: 'Running <code>no shutdown</code> on each subinterface but not on the physical interface.', fix: 'Subinterfaces stay down while the physical interface is shut.' },
          ],
          analogy: 'One road (the trunk) into a building with several reception desks (subinterfaces); each visitor\'s badge colour (VLAN tag) decides which desk serves them.',
          explain: [
            { q: 'Why must the switch port connected to the router be a trunk?', a: 'The router needs frames tagged with each VLAN ID so it can deliver them to the right subinterface.' },
            { q: 'What two commands does each subinterface need?', a: '<code>encapsulation dot1Q <i>vlan</i></code> and <code>ip address <i>ip mask</i></code>.' },
            { q: 'A ping from PC1 to PC2 shows TTL=127. What does that tell you?', a: 'The reply came from a Windows host (initial TTL 128) after crossing one router.' },
          ],
          widgets: ['intervlan'],
        },
      },
      /* ------------------------------------------------------------------ 4.3 */
      {
        id: '4.3', title: 'Inter-VLAN Routing using Layer 3 Switches',
        objective: 'Configure inter-VLAN routing using Layer 3 switching.', slides: '28–36',
        read: `
<h3>Layer 3 switch inter-VLAN routing</h3>
<p>Router-on-a-stick is simple for small and medium networks, but large enterprises need a faster, more scalable method. Enterprise campus LANs use Layer 3 switches, which use <b>hardware-based switching</b> to reach higher packet rates than routers. They are common in distribution-layer wiring closets.</p>
<p>A Layer 3 switch can:</p>
<ul>
  <li>Route from one VLAN to another using multiple <b>SVIs</b>.</li>
  <li>Convert a Layer 2 switchport into a Layer 3 interface, a <b>routed port</b>, which behaves like a router\'s physical interface.</li>
</ul>
<p>SVIs are created with the same <code>interface vlan <i>vlan-id</i></code> command used for the management SVI. Create one Layer 3 SVI for each routable VLAN.</p>

<h3>Scenario and configuration</h3>
<p>Layer 3 switch D1: PC1 (192.168.10.10/24, gateway 192.168.10.1) on G1/0/6 in VLAN 10; PC2 (192.168.20.10/24, gateway 192.168.20.1) on G1/0/18 in VLAN 20.</p>
<ol class="steps">
  <li><b>Create the VLANs</b> (10 and 20).</li>
  <li><b>Create the SVI VLAN interfaces.</b> Each SVI address is the default gateway for its VLAN.</li>
  <li><b>Configure access ports</b> in the right VLANs.</li>
  <li><b>Enable IP routing</b> with <code>ip routing</code>. This command is <b>required</b> for inter-VLAN routing on a Layer 3 switch (IPv4).</li>
</ol>
<pre class="cli">D1(config)# vlan 10
D1(config-vlan)# name LAN10
D1(config-vlan)# vlan 20
D1(config-vlan)# name LAN20
D1(config-vlan)# exit
D1(config)# interface vlan 10
D1(config-if)# description Default Gateway SVI for 192.168.10.0/24
D1(config-if)# ip add 192.168.10.1 255.255.255.0
D1(config-if)# no shut
D1(config-if)# exit
D1(config)# interface vlan 20
D1(config-if)# description Default Gateway SVI for 192.168.20.0/24
D1(config-if)# ip add 192.168.20.1 255.255.255.0
D1(config-if)# no shut
D1(config-if)# exit
D1(config)# interface GigabitEthernet1/0/6
D1(config-if)# description Access port to PC1
D1(config-if)# switchport mode access
D1(config-if)# switchport access vlan 10
D1(config-if)# exit
D1(config)# interface GigabitEthernet1/0/18
D1(config-if)# description Access port to PC2
D1(config-if)# switchport mode access
D1(config-if)# switchport access vlan 20
D1(config-if)# exit
D1(config)# ip routing</pre>
<p>Verify from a host with <code>ipconfig</code> and <code>ping</code>. Layer 3 switch inter-VLAN routing is <b>simpler to configure</b> than router-on-a-stick.</p>

<h3>Routing on a Layer 3 switch</h3>
<p>If the VLANs must be reachable by other Layer 3 devices, they must be advertised with static or dynamic routing, which needs a <b>routed port</b>. A routed port is created with <code>no switchport</code> on a Layer 2 port connected to another Layer 3 device; it can then be given an IPv4 address.</p>
<p>Scenario: D1 now connects to R1 (D1 G1/0/1 = 10.10.10.2/24, R1 G0/0/1 = 10.10.10.1/24). R1 advertises 10.10.10.0/24 and 10.20.20.0/24 with OSPF, and a server sits on 10.20.20.0/24.</p>
<ol class="steps">
  <li><b>Configure the routed port:</b> <code>no switchport</code>, IP address and mask, enable it.</li>
  <li><b>Enable routing:</b> <code>ip routing</code>.</li>
  <li><b>Configure routing:</b> here single-area OSPFv2.</li>
  <li><b>Verify routing:</b> <code>show ip route</code>.</li>
  <li><b>Verify connectivity:</b> <code>ping</code>.</li>
</ol>
<pre class="cli">D1(config)# interface GigabitEthernet1/0/1
D1(config-if)# description routed Port Link to R1
D1(config-if)# no switchport
D1(config-if)# ip address 10.10.10.2 255.255.255.0
D1(config-if)# no shut
D1(config-if)# exit
D1(config)# ip routing
D1(config)# router ospf 10
D1(config-router)# network 192.168.10.0 0.0.0.255 area 0
D1(config-router)# network 192.168.20.0 0.0.0.255 area 0
D1(config-router)# network 10.10.10.0 0.0.0.3 area 0
D1(config-router)# end
D1# show ip route | begin Gateway
Gateway of last resort is not set
O        10.20.20.0/24 [110/2] via 10.10.10.1, 00:00:11, GigabitEthernet1/0/1</pre>
<div class="note"><b>Note:</b> OSPF is taught in another course. In this module the OSPF commands are always given to you.</div>`,
        understand: {
          big: 'A Layer 3 switch routes between VLANs with SVIs (one per VLAN, each the VLAN gateway) once ip routing is enabled; a routed port (no switchport) connects it to other routers.',
          why: 'Layer 3 switching is the modern campus design, and forgetting ip routing is the number one mistake in its labs.',
          keys: [
            'Steps: create VLANs, create SVIs (gateways), assign access ports, <code>ip routing</code>.',
            '<code>ip routing</code> is required for IPv4 inter-VLAN routing on a Layer 3 switch.',
            'Routed port: <code>no switchport</code> + IP address; behaves like a router interface.',
            'To reach other networks, advertise VLAN subnets with static or dynamic routing (OSPF in this module).',
            'Layer 3 switching is simpler to configure than router-on-a-stick.',
          ],
          traps: [
            { trap: 'Creating SVIs but forgetting <code>ip routing</code>.', fix: 'Each SVI answers pings in its own VLAN, but nothing is routed between VLANs.' },
            { trap: 'Trying to put an IP address on a Layer 2 switchport.', fix: 'Use <code>no switchport</code> first to make it a routed port (or use an SVI).' },
            { trap: 'Thinking an SVI comes up without any active port in its VLAN.', fix: 'An SVI needs the VLAN and at least one up port in it.' },
          ],
          analogy: 'SVIs are virtual doors built into the switch\'s internal walls; <code>ip routing</code> unlocks them. A routed port is a real front door leading to another building (router).',
          explain: [
            { q: 'Inter-VLAN pings fail on a new Layer 3 switch, but each PC can ping its own SVI. What is missing?', a: '<code>ip routing</code>.' },
            { q: 'What does <code>no switchport</code> do?', a: 'It converts the Layer 2 switchport into a Layer 3 routed port that can have an IP address.' },
            { q: 'Why does D1 need OSPF in the second scenario?', a: 'So R1 learns D1\'s VLAN subnets and D1 learns R1\'s networks; otherwise neither knows routes to the other\'s networks.' },
          ],
          widgets: ['intervlan'],
        },
      },
      /* ------------------------------------------------------------------ 4.4 */
      {
        id: '4.4', title: 'Troubleshoot Inter-VLAN Routing',
        objective: 'Troubleshoot common inter-VLAN configuration issues.', slides: '37–45',
        read: `
<h3>Common inter-VLAN issues</h3>
<p>All inter-VLAN problems are connectivity problems. First check the <b>physical layer</b> (is a cable in the wrong port?). Then work through this table:</p>
<div class="scroll"><table class="t"><tr><th>Issue</th><th>How to fix</th><th>How to verify</th></tr>
<tr><td><b>Missing VLANs</b></td><td>Create (or re-create) the VLAN. Make sure the host port is in the correct VLAN.</td><td><code>show vlan [brief]</code><br><code>show interfaces switchport</code><br><code>ping</code></td></tr>
<tr><td><b>Switch trunk port issues</b></td><td>Make sure trunks are configured correctly, are trunk ports, and are enabled.</td><td><code>show interfaces trunk</code><br><code>show running-config</code></td></tr>
<tr><td><b>Switch access port issues</b></td><td>Assign the correct VLAN; make sure the port is an access port and enabled; the host may be in the wrong subnet.</td><td><code>show interfaces switchport</code><br><code>show running-config interface</code><br><code>ipconfig</code></td></tr>
<tr><td><b>Router configuration issues</b></td><td>The subinterface IPv4 address is wrong, or the subinterface is assigned to the wrong VLAN ID.</td><td><code>show ip interface brief</code><br><code>show interfaces</code></td></tr></table></div>
<div class="errata"><b>Slide errata (slide 38):</b> the last row says the subinterface "is assigned to the VLAN ID"; it means the <b>wrong</b> VLAN ID.</div>

<h3>Missing VLANs</h3>
<p>A VLAN can be missing because it was never created, was accidentally deleted, or is not allowed on the trunk. When a VLAN is deleted, its ports become <b>inactive</b>: they stay associated with that VLAN until you assign them to another VLAN or re-create it. Re-creating the VLAN automatically reassigns the hosts.</p>
<pre class="cli">S1(config)# do show interface fa0/6 switchport
Name: Fa0/6
Switchport: Enabled
Administrative Mode: static access
Operational Mode: static access
Access Mode VLAN: 10 (Inactive)</pre>

<h3>Switch trunk port issues</h3>
<p>With legacy inter-VLAN routing, a common cause is a router port connected to a switch port in the wrong VLAN. With router-on-a-stick, the most common cause is a <b>misconfigured trunk port</b>. Check the port to the router with <code>show interface trunk</code>; if it is missing from the output, examine it with <code>show running-config interface X</code>.</p>
<pre class="cli">S1# show interface trunk
Port        Mode         Encapsulation  Status        Native vlan
Fa0/1       on           802.1q         trunking      1
Port        Vlans allowed on trunk
Fa0/1       1-4094</pre>
<p>In this example Fa0/5 (to R1) is missing from the list, so it is not trunking.</p>

<h3>Switch access port issues</h3>
<p>A typical sign: the PC has the correct IP address, mask and default gateway, but <b>cannot ping its default gateway</b>. Check the port VLAN with <code>show vlan brief</code>, <code>show interface X switchport</code> or <code>show running-config interface X</code>.</p>
<pre class="cli">S1# show interface fa0/6 switchport
Administrative Mode: static access
Operational Mode: static access
Access Mode VLAN: 1 (default)</pre>
<p>Here Fa0/6 should be in VLAN 10 but is in VLAN 1.</p>

<h3>Router configuration issues</h3>
<p>Router-on-a-stick problems are usually <b>subinterface misconfigurations</b>. Check status with <code>show ip interface brief</code>, then check which VLAN each subinterface uses. <code>show interfaces</code> gives a lot of extra output, so filter it:</p>
<pre class="cli">R1# show interfaces | include Gig|802.1Q
GigabitEthernet0/0/1.10 is up, line protocol is up
  Encapsulation 802.1Q Virtual LAN, Vlan ID  100.
GigabitEthernet0/0/1.20 is up, line protocol is up
  Encapsulation 802.1Q Virtual LAN, Vlan ID  20.</pre>
<p>Subinterface .10 was configured for VLAN 100 instead of 10. Fix it with <code>encapsulation dot1Q 10</code> on G0/0/1.10.</p>`,
        understand: {
          big: 'Troubleshoot inter-VLAN routing layer by layer: cables, VLAN exists, access port in the right VLAN, trunk up and allowing the VLAN, then the router subinterface (VLAN ID and IP) or SVI and ip routing.',
          why: 'Troubleshooting labs (4.4.8, 4.4.9) and the skills assessment give you a broken network; a fixed checklist finds every fault quickly.',
          keys: [
            'Missing VLAN: ports show "(Inactive)"; re-create the VLAN or reassign ports.',
            'Router-on-a-stick: the most common fault is the switch port to the router not trunking.',
            'Access port fault sign: correct host settings but no ping to the gateway.',
            'Router fault: wrong encapsulation VLAN ID or wrong subinterface IP.',
            'Filter: <code>show interfaces | include Gig|802.1Q</code> lists each subinterface and its VLAN ID.',
          ],
          traps: [
            { trap: 'Jumping straight to the router configuration.', fix: 'Start at Layer 1 and the switch: cables, VLANs, access ports, trunks.' },
            { trap: 'Assuming a port shown in show interfaces trunk carries every VLAN.', fix: 'Check the "allowed" and "allowed and active" lines for the VLAN in question.' },
            { trap: 'Fixing the switch but forgetting the PC\'s own IP settings.', fix: 'A host in the wrong subnet or with the wrong gateway fails even when the network is correct.' },
          ],
          analogy: 'Like checking a car that will not start: fuel (cables), ignition key (VLAN exists), the right road (access VLAN), the highway is open (trunk), and the destination address is right (gateway and subinterface).',
          explain: [
            { q: 'A PC can ping its gateway but not a PC in another VLAN on another switch. Where do you look?', a: 'The trunk between the switches (trunking, allowed VLANs, VLAN exists on both) and the other host\'s access port, IP settings and the other VLAN\'s gateway.' },
            { q: 'show interfaces fa0/6 switchport shows "Access Mode VLAN: 10 (Inactive)". What happened?', a: 'VLAN 10 does not exist on the switch (deleted or never created).' },
            { q: 'Which filtered command shows each router subinterface with its VLAN ID?', a: '<code>show interfaces | include Gig|802.1Q</code>' },
          ],
          widgets: ['tshoot'],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
