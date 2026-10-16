/* Module 3 — VLANs (SRWE v7, slides in SRWE_Module_3.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm3', num: 3, title: 'VLANs',
    objective: 'Implement VLANs and trunking in a switched network.',
    deck: 'SRWE_Module_3.pptx',
    topics: [
      /* ------------------------------------------------------------------ 3.1 */
      {
        id: '3.1', title: 'Overview of VLANs',
        objective: 'Explain the purpose of VLANs in a switched network.', slides: '14–20',
        read: `
<h3>VLAN definitions</h3>
<p>VLANs are <b>logical</b> connections between similar devices, independent of where they are physically plugged in. Placing devices into VLANs:</p>
<ul>
  <li>Segments groups of devices that share the same switches (for example IT, HR and Sales on every floor).</li>
  <li>Makes the network more manageable:
    <ul><li>Broadcasts, multicasts and unicasts stay <b>inside their VLAN</b>.</li>
    <li>Each VLAN has its own <b>unique IP address range</b> (subnet).</li>
    <li>Broadcast domains become <b>smaller</b>.</li></ul></li>
</ul>

<h3>Benefits of a VLAN design</h3>
<table class="t"><tr><th>Benefit</th><th>Description</th></tr>
<tr><td><b>Smaller broadcast domains</b></td><td>Dividing the LAN into VLANs reduces the number of devices in each broadcast domain.</td></tr>
<tr><td><b>Improved security</b></td><td>Only users in the same VLAN can communicate with each other (without a Layer 3 device).</td></tr>
<tr><td><b>Improved IT efficiency</b></td><td>Devices with similar requirements are grouped, for example faculty and students.</td></tr>
<tr><td><b>Reduced cost</b></td><td>One switch can support several groups (VLANs).</td></tr>
<tr><td><b>Better performance</b></td><td>Smaller broadcast domains mean less traffic and more bandwidth.</td></tr>
<tr><td><b>Simpler management</b></td><td>Similar groups need similar applications and network resources.</td></tr></table>
<div class="errata"><b>Slide errata (slide 16):</b> the deck says dividing the LAN "reduces the number of broadcast domains". It is the opposite: VLANs <b>increase the number</b> of broadcast domains and <b>reduce the size</b> (number of devices) of each one.</div>

<h3>Types of VLANs</h3>
<table class="t"><tr><th>Type</th><th>What to know</th></tr>
<tr><td><b>Default VLAN</b></td><td><b>VLAN 1</b> is the default VLAN, the default native VLAN and the default management VLAN. It <b>cannot be deleted or renamed</b>. Cisco recommends moving these roles to other VLANs.</td></tr>
<tr><td><b>Data VLAN</b></td><td>Carries user-generated traffic (email, web). VLAN 1 is the default data VLAN because every port starts there.</td></tr>
<tr><td><b>Native VLAN</b></td><td>Used on <b>trunk links only</b>. All frames on an 802.1Q trunk are tagged <b>except</b> native VLAN frames.</td></tr>
<tr><td><b>Management VLAN</b></td><td>Carries management traffic (SSH, Telnet to the vty lines) and should be separate from user traffic. Typically the VLAN of the switch SVI.</td></tr>
<tr><td><b>Voice VLAN</b></td><td>A separate VLAN for VoIP, because voice needs assured bandwidth, high QoS priority, the ability to avoid congestion, and delay of <b>less than 150 ms</b> end to end. The entire network must be designed to support voice.</td></tr></table>
<pre class="cli">Switch# show vlan brief
VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Fa0/1, Fa0/2, Fa0/3, Fa0/4
                                                ... Gi0/1, Gi0/2
1002 fddi-default                     act/unsup
1003 token-ring-default               act/unsup
1004 fddinet-default                  act/unsup
1005 trnet-default                    act/unsup</pre>`,
        understand: {
          big: 'A VLAN is a separate broadcast domain (and subnet) created logically on switches, so groups can share hardware without sharing traffic.',
          why: 'VLANs are the foundation for modules 3 and 4, and VLAN types (default, data, native, management, voice) are frequent exam distractors.',
          keys: [
            'One VLAN = one broadcast domain = one IP subnet.',
            'Traffic stays inside its VLAN; crossing VLANs needs a router or Layer 3 switch.',
            'VLAN 1 = default + default native + default management VLAN; cannot be deleted or renamed.',
            'Native VLAN = untagged traffic on an 802.1Q trunk.',
            'Voice VLAN: assured bandwidth, high QoS priority, congestion avoidance, delay < 150 ms.',
          ],
          traps: [
            { trap: '"VLANs reduce the number of broadcast domains."', fix: 'They increase the number and shrink the size of each one.' },
            { trap: 'Thinking the native VLAN is used on access ports.', fix: 'Native VLAN applies only to 802.1Q trunks.' },
            { trap: 'Assuming VLAN 1 can be deleted once unused.', fix: 'VLAN 1 (and 1002–1005) can never be deleted.' },
          ],
          analogy: 'One big hall holding several classes (the switch). VLANs are walls built between the groups. Layer 2 can build walls but not doors; the doors come from Layer 3 (routing).',
          explain: [
            { q: 'Why does each VLAN need its own IP subnet?', a: 'Each VLAN is a separate broadcast domain, and hosts in different subnets must reach each other through a router, which matches the VLAN boundary.' },
            { q: 'Name three roles VLAN 1 has by default.', a: 'Default VLAN, default native VLAN, default management VLAN.' },
            { q: 'Why separate voice traffic into its own VLAN?', a: 'Voice needs guaranteed bandwidth, priority (QoS), low delay (<150 ms) and protection from congestion caused by data traffic.' },
          ],
          widgets: ['vlanbcast'],
        },
      },
      /* ------------------------------------------------------------------ 3.2 */
      {
        id: '3.2', title: 'VLANs in a Multi-Switched Environment',
        objective: 'Explain how a switch forwards frames based on VLAN configuration in a multi-switch environment.', slides: '21–29',
        read: `
<h3>VLAN trunks</h3>
<p>A <b>trunk</b> is a point-to-point link between two network devices that carries <b>more than one VLAN</b>. Cisco trunks:</p>
<ul><li>Carry more than one VLAN.</li><li>Extend VLANs across the entire network.</li><li>Support all VLANs by default.</li><li>Use <b>802.1Q</b> trunking.</li></ul>

<h3>Networks without and with VLANs</h3>
<p><b>Without VLANs</b>, every device on the switches receives all unicast, multicast and broadcast traffic: when PC1 broadcasts, the switches forward it out of every port.</p>
<p><b>With VLANs</b>, unicast, multicast and broadcast traffic is confined to its VLAN: PC1\'s broadcast (VLAN 10) goes only out of ports in VLAN 10, crossing the trunks to reach PC4 (also VLAN 10). Without a Layer 3 device, devices in different VLANs cannot communicate.</p>

<h3>VLAN identification with a tag (IEEE 802.1Q)</h3>
<p>The 802.1Q header is <b>4 bytes</b>, inserted into the Ethernet frame between the source MAC address and the Type/Length field. Because the frame changes, the <b>FCS must be recalculated</b>. When the frame is sent to an end device the tag is removed and the FCS recalculated again.</p>
<table class="t"><tr><th>Field</th><th>Size</th><th>Function</th></tr>
<tr><td><b>Type (TPID)</b></td><td>2 bytes</td><td>Hex value <code>0x8100</code>, the Tag Protocol ID.</td></tr>
<tr><td><b>User Priority</b></td><td>3 bits</td><td>Supports Layer 2 class of service (CoS) priority, values 0–7 (802.1p).</td></tr>
<tr><td><b>Canonical Format Identifier (CFI)</b></td><td>1 bit</td><td>Lets Token Ring frames be carried over Ethernet.</td></tr>
<tr><td><b>VLAN ID (VID)</b></td><td>12 bits</td><td>The VLAN number: 2<sup>12</sup> = <b>4096</b> IDs.</td></tr></table>
<div class="errata"><b>Slide errata (slide 25):</b> the User Priority row ends mid-sentence ("3-bit value that supports"); it supports CoS priority levels 0–7. Also, of the 4096 VLAN IDs, 0 and 4095 are reserved, so the usable range is 1–4094.</div>

<h3>Native VLANs and 802.1Q tagging</h3>
<ul>
  <li>Tagging is normally done on all VLANs.</li>
  <li>The native VLAN exists for legacy use, for example a hub between switches that cannot understand tags. Native VLAN frames cross the trunk <b>untagged</b>.</li>
  <li>Unless changed, <b>VLAN 1 is the native VLAN</b>.</li>
  <li>Both ends of a trunk must use the <b>same native VLAN</b> (otherwise CDP reports a native VLAN mismatch).</li>
  <li>Each trunk is configured separately, so different trunks can have different native VLANs.</li>
</ul>

<h3>Voice VLAN tagging</h3>
<p>A Cisco IP phone contains a <b>three-port switch</b> (port to the switch, port to the PC, internal phone ASIC). The access switch uses <b>CDP</b> to tell the phone which voice VLAN to use. The phone tags its own voice traffic and can set the Layer 2 <b>class of service (CoS)</b>, which is QoS for Layer 2. The phone may or may not tag frames from the PC.</p>
<table class="t"><tr><th>Traffic</th><th>Tagging</th></tr>
<tr><td>Voice VLAN</td><td>Tagged with an appropriate Layer 2 CoS priority value</td></tr>
<tr><td>Access (data) VLAN</td><td>Can also be tagged with a Layer 2 CoS priority value</td></tr>
<tr><td>Access (data) VLAN</td><td>Or not tagged (no Layer 2 CoS value)</td></tr></table>
<div class="errata"><b>Slide errata (slide 27):</b> the deck writes "Cost of Service (CoS)". CoS stands for <b>Class of Service</b>.</div>

<h3>Voice VLAN verification</h3>
<pre class="cli">S1# show interfaces fa0/18 switchport
Name: Fa0/18
Switchport: Enabled
Administrative Mode: static access
Operational Mode: static access
Administrative Trunking Encapsulation: negotiate
Operational Trunking Encapsulation: native
Negotiation of Trunking: Off
Access Mode VLAN: 20 (student)
Trunking Native Mode VLAN: 1 (default)
Administrative Native VLAN tagging: enabled
Voice VLAN: 150 (voice)</pre>`,
        understand: {
          big: 'Trunks carry many VLANs over one link by adding a 4-byte 802.1Q tag to each frame, except frames of the native VLAN, which travel untagged.',
          why: 'Understanding tagging explains why native VLAN mismatches leak traffic, why trunks need matching settings, and how router-on-a-stick (module 4) works.',
          keys: [
            '802.1Q tag = 4 bytes: TPID 0x8100 (2 bytes), Priority (3 bits), CFI (1 bit), VID (12 bits).',
            'Inserting or removing a tag means recalculating the FCS.',
            'Native VLAN frames are untagged; default native VLAN = 1; both ends must match.',
            'Different trunks may use different native VLANs.',
            'IP phone = 3-port switch; CDP tells it the voice VLAN; voice frames carry a CoS value.',
          ],
          traps: [
            { trap: 'Saying the 802.1Q tag is 4 bits or 12 bytes.', fix: 'The tag is 4 bytes; the VLAN ID field inside it is 12 bits.' },
            { trap: 'Thinking end devices receive tagged frames.', fix: 'Access ports remove the tag (and recalculate the FCS) before sending to a host.' },
            { trap: 'Thinking a native VLAN mismatch stops the trunk.', fix: 'The trunk still comes up, but untagged traffic leaks between the two native VLANs.' },
          ],
          analogy: 'The 802.1Q tag is a coloured luggage label added at check-in (trunk ingress) so every airport knows which flight (VLAN) a bag belongs to; it is removed at baggage claim (access port).',
          explain: [
            { q: 'Why must the FCS be recalculated when a tag is added?', a: 'The FCS covers the frame contents; adding 4 bytes changes the frame, so the old checksum would be wrong.' },
            { q: 'How many VLAN IDs can 12 bits represent?', a: '4096 (0–4095); 0 and 4095 are reserved, leaving 1–4094.' },
            { q: 'How does an IP phone learn which VLAN to tag voice frames with?', a: 'The switch tells it through CDP.' },
          ],
          widgets: ['dot1q', 'vlanbcast'],
        },
      },
      /* ------------------------------------------------------------------ 3.3 */
      {
        id: '3.3', title: 'VLAN Configuration',
        objective: 'Configure a switch port to be assigned to a VLAN based on requirements.', slides: '30–41',
        read: `
<h3>VLAN ranges on Catalyst switches</h3>
<p>Catalyst 2960 and 3650 switches support over 4000 VLAN IDs.</p>
<table class="t"><tr><th>Normal range: VLAN 1–1005</th><th>Extended range: VLAN 1006–4095</th></tr>
<tr><td>Used in small to medium businesses</td><td>Used by service providers and large organizations</td></tr>
<tr><td>1002–1005 reserved for legacy VLANs (Token Ring, FDDI)</td><td>Stored in the <b>running configuration</b></td></tr>
<tr><td>1 and 1002–1005 are created automatically and cannot be deleted</td><td>Support fewer VLAN features</td></tr>
<tr><td>Stored in the <b>vlan.dat</b> file in flash</td><td>Require VTP configuration (VTP transparent mode)</td></tr>
<tr><td>VTP can synchronize them between switches</td><td></td></tr></table>
<div class="note"><b>Real-world note:</b> VLAN 4095 is reserved, so in practice the extended range you can create is 1006–4094.</div>

<h3>Create a VLAN</h3>
<pre class="cli">Switch# configure terminal
Switch(config)# vlan vlan-id
Switch(config-vlan)# name vlan-name
Switch(config-vlan)# end</pre>
<p>Example: the student PC will be in VLAN 20.</p>
<pre class="cli">S1# configure terminal
S1(config)# vlan 20
S1(config-vlan)# name student
S1(config-vlan)# end</pre>
<p>If you do not name it, IOS uses <b>VLAN</b> plus the four-digit number, for example <code>VLAN0020</code>.</p>

<h3>Assign ports to a VLAN</h3>
<pre class="cli">S1# configure terminal
S1(config)# interface fa0/18
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 20
S1(config-if)# end</pre>
<p>After the port is in VLAN 20, the end device needs an address in that VLAN\'s subnet (here the student PC uses 172.17.20.22).</p>
<p>Use <code>interface range</code> to configure several ports at once, for example <code>interface range fa0/11 - 20</code>.</p>

<h3>Data and voice VLANs</h3>
<p>An access port can belong to <b>only one data VLAN</b>, but it can also have <b>one voice VLAN</b> for a phone with a PC connected behind it.</p>
<pre class="cli">S1(config)# vlan 20
S1(config-vlan)# name student
S1(config-vlan)# vlan 150
S1(config-vlan)# name VOICE
S1(config-vlan)# exit
S1(config)# interface fa0/18
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 20
S1(config-if)# mls qos trust cos
S1(config-if)# switchport voice vlan 150
S1(config-if)# end</pre>
<p>Newer Catalyst switches create a VLAN automatically if you assign a port to one that does not exist:</p>
<pre class="cli">% Access VLAN does not exist. Creating vlan 30</pre>
<p>QoS is beyond this course; the example uses <code>mls qos trust [cos | device cisco-phone | dscp | ip-precedence]</code>.</p>

<h3>Verify VLAN information</h3>
<p><code>show vlan [brief | id <i>vlan-id</i> | name <i>vlan-name</i> | summary]</code></p>
<table class="t"><tr><th>Option</th><th>Displays</th></tr>
<tr><td><code>brief</code></td><td>VLAN name, status and ports, one VLAN per line</td></tr>
<tr><td><code>id <i>vlan-id</i></code></td><td>Information about one VLAN number</td></tr>
<tr><td><code>name <i>vlan-name</i></code></td><td>Information about one VLAN name (1–32 ASCII characters)</td></tr>
<tr><td><code>summary</code></td><td>VLAN counts</td></tr></table>
<pre class="cli">S1# show vlan summary
Number of existing VLANs          : 7
 Number of existing VTP VLANs     : 7
 Number of existing extended VLANS     : 0
S1# show interface vlan 20
Vlan20 is up, line protocol is up
  Hardware is EtherSVI, address is 001f.6ddb.3ec1 (bia 001f.6ddb.3ec1)</pre>

<h3>Change VLAN port membership</h3>
<ul>
  <li>Re-enter <code>switchport access vlan <i>vlan-id</i></code> with the new VLAN, or</li>
  <li>use <code>no switchport access vlan</code> to put the port back in VLAN 1.</li>
  <li>Verify with <code>show vlan brief</code> or <code>show interfaces fa0/18 switchport</code>.</li>
</ul>

<h3>Delete VLANs</h3>
<ul>
  <li><code>no vlan <i>vlan-id</i></code> deletes one VLAN. <b>Caution:</b> first move its member ports to another VLAN, otherwise they become inactive.</li>
  <li><code>delete flash:vlan.dat</code> or <code>delete vlan.dat</code> deletes the whole VLAN database. Reload the switch afterwards.</li>
  <li><b>Factory default:</b> unplug all data cables, <code>erase startup-config</code>, delete <code>vlan.dat</code>, then reload.</li>
</ul>
<div class="errata"><b>Slide errata (slide 32):</b> the VLAN creation table ends with "Enter global configuration mode. Switch# configure terminal". That row is a copy mistake; after <code>end</code> you would normally save with <code>copy running-config startup-config</code>.</div>`,
        understand: {
          big: 'Create the VLAN, name it, then make the port an access port and assign it. Normal-range VLANs live in vlan.dat, not in the startup configuration.',
          why: 'VLAN configuration appears in every switching lab, and "where are VLANs stored?" is a favourite trick question.',
          keys: [
            'Normal 1–1005 (vlan.dat in flash); extended 1006–4095 (running config, needs VTP transparent).',
            '1 and 1002–1005 exist automatically and cannot be deleted.',
            'Unnamed VLAN 20 is called VLAN0020.',
            'Access port: <code>switchport mode access</code> + <code>switchport access vlan N</code>.',
            'One data VLAN plus one voice VLAN per access port.',
            'Deleting a VLAN leaves its ports inactive until reassigned or the VLAN is recreated.',
            'Factory reset of a switch = erase startup-config + delete vlan.dat + reload.',
          ],
          traps: [
            { trap: '"erase startup-config and reload removes all VLANs."', fix: 'VLANs survive because they are in vlan.dat; delete vlan.dat as well.' },
            { trap: 'Deleting a VLAN without moving its ports first.', fix: 'The ports become inactive and those hosts lose connectivity.' },
            { trap: 'Thinking an access port can carry two data VLANs.', fix: 'Only one data VLAN; the second VLAN allowed is the voice VLAN.' },
          ],
          analogy: 'vlan.dat is the switch\'s address book of VLANs, kept in a separate drawer from the configuration notebook (startup-config). Throwing away the notebook does not empty the drawer.',
          explain: [
            { q: 'You erased the startup config and reloaded, but VLAN 20 is still there. Why?', a: 'Normal-range VLANs are stored in vlan.dat in flash, which erase startup-config does not remove.' },
            { q: 'What happens to ports in VLAN 30 if you delete VLAN 30?', a: 'They stay assigned to VLAN 30 but become inactive until you reassign them or recreate VLAN 30.' },
            { q: 'Which command returns a port to VLAN 1?', a: '<code>no switchport access vlan</code>' },
          ],
          widgets: ['vlanrange'],
        },
      },
      /* ------------------------------------------------------------------ 3.4 */
      {
        id: '3.4', title: 'VLAN Trunks',
        objective: 'Configure a trunk port on a LAN switch.', slides: '42–49',
        read: `
<h3>Trunk configuration commands</h3>
<p>Trunks are Layer 2 links that carry traffic for all VLANs (unless restricted).</p>
<table class="t"><tr><th>Task</th><th>Command</th></tr>
<tr><td>Set the port to permanent trunking</td><td><code>switchport mode trunk</code></td></tr>
<tr><td>Set the native VLAN to something other than VLAN 1</td><td><code>switchport trunk native vlan <i>vlan-id</i></code></td></tr>
<tr><td>Specify the VLANs allowed on the trunk</td><td><code>switchport trunk allowed vlan <i>vlan-list</i></code></td></tr></table>

<h3>Trunk configuration example</h3>
<table class="t small"><tr><th>VLAN</th><th>Purpose</th><th>Subnet</th></tr>
<tr><td>10</td><td>Faculty/Staff</td><td>172.17.10.0/24</td></tr>
<tr><td>20</td><td>Students</td><td>172.17.20.0/24</td></tr>
<tr><td>30</td><td>Guests</td><td>172.17.30.0/24</td></tr>
<tr><td>99</td><td>Native</td><td>172.17.99.0/24</td></tr></table>
<pre class="cli">S1(config)# interface fa0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk native vlan 99
S1(config-if)# switchport trunk allowed vlan 10,20,30,99
S1(config-if)# end</pre>
<div class="note"><b>Note:</b> this assumes a 2960 (802.1Q only). Layer 3 switches that also support ISL (for example the Catalyst 3560) need <code>switchport trunk encapsulation dot1q</code> <b>before</b> <code>switchport mode trunk</code>.</div>

<h3>Verify the trunk</h3>
<pre class="cli">S1# show interfaces fa0/1 switchport
Name: Fa0/1
Switchport: Enabled
Administrative Mode: trunk
Operational Mode: trunk
Administrative Trunking Encapsulation: dot1q
Operational Trunking Encapsulation: dot1q
Negotiation of Trunking: On
Access Mode VLAN: 1 (default)
Trunking Native Mode VLAN: 99 (VLAN0099)
Administrative Native VLAN tagging: enabled
Voice VLAN: none
Trunking VLANs Enabled: ALL</pre>
<p>Check: administratively a trunk, operationally a trunk, encapsulation dot1q, native VLAN 99, and (in this output) all VLANs allowed. <code>show interfaces trunk</code> lists every operational trunk with its allowed and active VLANs.</p>
<div class="errata"><b>Slide errata (slide 45):</b> the screenshot shows <code>no switchport trunk native vlan 99</code>, yet the output shows native VLAN 99. The command that <b>sets</b> the native VLAN is <code>switchport trunk native vlan 99</code>; the <code>no</code> form resets it to VLAN 1.</div>

<h3>Reset the trunk to the default state</h3>
<pre class="cli">S1(config)# interface fa0/1
S1(config-if)# no switchport trunk allowed vlan
S1(config-if)# no switchport trunk native vlan
S1(config-if)# end</pre>
<p>Defaults: all VLANs allowed, native VLAN = VLAN 1. To turn the trunk back into an access port:</p>
<pre class="cli">S1(config)# interface fa0/1
S1(config-if)# switchport mode access
S1(config-if)# end
S1# show interfaces fa0/1 switchport
Administrative Mode: static access
Operational Mode: static access</pre>`,
        understand: {
          big: 'A trunk needs matching settings on both ends: trunk mode, the same native VLAN, and allowed lists that include the VLANs you need.',
          why: 'Most "same VLAN but different switches cannot ping" problems are trunk problems: not trunking, VLAN not allowed, or a native mismatch.',
          keys: [
            '<code>switchport mode trunk</code>, <code>switchport trunk native vlan N</code>, <code>switchport trunk allowed vlan LIST</code>.',
            'Allowed list options: a list, <code>add</code>, <code>remove</code>, <code>except</code>, <code>all</code>, <code>none</code>.',
            'Reset: <code>no switchport trunk allowed vlan</code> (all VLANs) and <code>no switchport trunk native vlan</code> (VLAN 1).',
            '<code>show interfaces trunk</code> shows only operational trunks.',
            'ISL-capable Layer 3 switches need <code>switchport trunk encapsulation dot1q</code> first.',
          ],
          traps: [
            { trap: 'Using <code>switchport trunk allowed vlan 30</code> to add VLAN 30.', fix: 'That REPLACES the list with only VLAN 30. Use <code>switchport trunk allowed vlan add 30</code>.' },
            { trap: 'Changing the native VLAN on one side only.', fix: 'Native VLAN mismatch: CDP warnings and leaking untagged traffic. Change both ends.' },
            { trap: 'Thinking a trunk port appears in <code>show vlan brief</code>.', fix: 'Trunk ports are not listed under any VLAN there; use <code>show interfaces trunk</code>.' },
          ],
          analogy: 'A trunk is a highway between two cities carrying cars from many companies (VLANs). The allowed list is which company cars may enter; the native VLAN is the one company whose cars drive without a logo.',
          explain: [
            { q: 'What does <code>switchport trunk allowed vlan remove 30</code> do to a trunk allowing all VLANs?', a: 'It allows every VLAN except 30 (1–29 and 31–4094).' },
            { q: 'Two switches are trunked, PCs in VLAN 20 on each side cannot ping. Name two trunk-related causes.', a: 'VLAN 20 is not in the allowed list on one side, or VLAN 20 does not exist on one switch (or one port is not actually trunking).' },
            { q: 'How do you return a trunk port to an access port?', a: '<code>switchport mode access</code> (and assign the access VLAN).' },
          ],
          widgets: ['allowed'],
        },
      },
      /* ------------------------------------------------------------------ 3.5 */
      {
        id: '3.5', title: 'Dynamic Trunking Protocol',
        objective: 'Configure Dynamic Trunking Protocol (DTP).', slides: '50–55',
        read: `
<h3>Introduction to DTP</h3>
<p>The <b>Dynamic Trunking Protocol (DTP)</b> is a <b>Cisco proprietary</b> protocol that negotiates trunking between switches.</p>
<ul>
  <li>On by default on Catalyst 2960 and 2950 switches.</li>
  <li><b>Dynamic auto</b> is the default mode on 2960 and 2950.</li>
  <li>Turn it off with <code>switchport nonegotiate</code>.</li>
  <li>Turn it back on by setting the interface to dynamic auto.</li>
  <li>Setting a port to static trunk or static access avoids negotiation problems.</li>
</ul>
<pre class="cli">S1(config-if)# switchport mode trunk
S1(config-if)# switchport nonegotiate
S1(config-if)# switchport mode dynamic auto</pre>

<h3>Negotiated interface modes</h3>
<table class="t"><tr><th>Option</th><th>Behaviour</th></tr>
<tr><td><code>access</code></td><td>Permanent access mode; negotiates to convert the neighbor link into an access link.</td></tr>
<tr><td><code>dynamic auto</code></td><td>Becomes a trunk only if the neighbor is set to <b>trunk</b> or <b>desirable</b> (passive).</td></tr>
<tr><td><code>dynamic desirable</code></td><td>Actively tries to become a trunk with neighbors set to auto or desirable.</td></tr>
<tr><td><code>trunk</code></td><td>Permanent trunk mode; negotiates to convert the neighbor link into a trunk.</td></tr></table>

<h3>Results of a DTP configuration</h3>
<div class="scroll"><table class="t dtp"><tr><th></th><th>Dynamic Auto</th><th>Dynamic Desirable</th><th>Trunk</th><th>Access</th></tr>
<tr><th>Dynamic Auto</th><td>Access</td><td class="y">Trunk</td><td class="y">Trunk</td><td>Access</td></tr>
<tr><th>Dynamic Desirable</th><td class="y">Trunk</td><td class="y">Trunk</td><td class="y">Trunk</td><td>Access</td></tr>
<tr><th>Trunk</th><td class="y">Trunk</td><td class="y">Trunk</td><td class="y">Trunk</td><td class="n">Limited connectivity</td></tr>
<tr><th>Access</th><td>Access</td><td>Access</td><td class="n">Limited connectivity</td><td>Access</td></tr></table></div>

<h3>Verify DTP mode</h3>
<p>The default DTP setting depends on the IOS version and platform. Use <code>show dtp interface</code> to see the current mode.</p>
<pre class="cli">S1# show dtp interface fa0/1
DTP information for FastEthernet0/1:
  TOS/TAS/TNS:                              ACCESS/AUTO/ACCESS
  TOT/TAT/TNT:                              NATIVE/NEGOTIATE/NATIVE
  FSM state:                                S2:ACCESS
  Enabled:                                  yes</pre>
<p><b>Best practice:</b> set interfaces statically to <b>access</b> or <b>trunk</b> and turn DTP off.</p>
<div class="note"><b>Instructor note:</b> a link with trunk on one side and access on the other has no proper communication ("limited connectivity").</div>`,
        understand: {
          big: 'DTP lets switch ports negotiate trunking: auto waits, desirable asks, trunk and access are fixed. Two auto ports never form a trunk.',
          why: 'The DTP results table is memorized for the exam, and understanding it explains why "nothing works between my new switches" when both sides are left at dynamic auto.',
          keys: [
            'DTP is Cisco proprietary; default mode on 2960 = dynamic auto.',
            'auto + auto = access; auto + desirable/trunk = trunk.',
            'desirable + desirable/auto/trunk = trunk; anything + access = access, except trunk + access = limited connectivity.',
            '<code>switchport nonegotiate</code> turns DTP off (not allowed on dynamic ports).',
            'Best practice: static access or trunk, DTP off.',
          ],
          traps: [
            { trap: '"dynamic auto on both ends forms a trunk."', fix: 'Both sides wait for the other to ask, so the link stays access.' },
            { trap: 'Using <code>switchport nonegotiate</code> on a dynamic port.', fix: 'IOS rejects it: nonegotiate only works with static access or trunk.' },
            { trap: 'Setting trunk + nonegotiate on one side and leaving the other at dynamic auto.', fix: 'No DTP frames are sent, so the auto side stays access: limited connectivity.' },
          ],
          analogy: 'Dynamic auto is a shy person who only dances if asked; dynamic desirable asks everyone; trunk is already dancing and invites others; access refuses to dance. Two shy people never dance.',
          explain: [
            { q: 'Switch A is dynamic desirable, switch B is dynamic auto. Result?', a: 'Trunk: desirable actively negotiates and auto agrees.' },
            { q: 'Why does Cisco recommend turning DTP off?', a: 'To avoid unpredictable negotiation results and stop rogue devices from negotiating a trunk.' },
            { q: 'Which command shows the DTP state of a port?', a: '<code>show dtp interface <i>id</i></code>' },
          ],
          widgets: ['dtp'],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
