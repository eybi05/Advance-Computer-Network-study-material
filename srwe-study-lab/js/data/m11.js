/* Module 11 — Switch Security Configuration (SRWE v7, slides in SRWE_Module_11.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm11', num: 11, title: 'Switch Security Configuration',
    objective: 'Configure switch security to mitigate LAN attacks.',
    deck: 'SRWE_Module_11.pptx',
    topics: [
      /* ------------------------------------------------------------------ 11.1 */
      {
        id: '11.1', title: 'Implement Port Security',
        objective: 'Implement port security to mitigate MAC address table attacks.', slides: '12–30',
        read: `
<h3>Secure unused ports</h3>
<p>Secure every switch port before the switch goes into production. A simple first step: <b>shut down all unused ports</b>. Re-enable a port later with <code>no shutdown</code>. Use a range to save typing:</p>
<pre class="cli">Switch(config)# interface range type module/first-number - last-number</pre>

<h3>Mitigate MAC address table attacks</h3>
<p><b>Port security</b> is the simplest and most effective way to stop MAC table overflow attacks. It limits the number of valid MAC addresses on a port: the administrator configures them manually or lets the switch learn a limited number. Each received frame's source MAC is compared with the secure list. With a limit of one, port security also stops unauthorized devices from using the port.</p>

<h3>Enable port security</h3>
<pre class="cli">S1(config)# interface f0/1
S1(config-if)# switchport port-security
Command rejected: FastEthernet0/1 is a dynamic port.
S1(config-if)# switchport mode access
S1(config-if)# switchport port-security
S1(config-if)# end</pre>
<p>Port security works only on ports manually set to <b>access</b> (or trunk; trunk port security is outside this course). Layer 2 ports default to dynamic auto, so the first attempt is rejected. With just <code>switchport port-security</code>, the defaults are: violation mode <b>shutdown</b> and a maximum of <b>1</b> MAC address. A connected device's MAC is learned automatically as a secure MAC.</p>
<div class="note">If you enable port security on an active port with more than one device behind it, the port goes into the error-disabled state.</div>
<p>Other options appear with <code>switchport port-security ?</code>: <code>aging</code>, <code>mac-address</code>, <code>maximum</code> and <code>violation</code>.</p>

<h3>Limit and learn MAC addresses</h3>
<p><code>switchport port-security maximum <i>value</i></code> sets the limit (default 1; the highest value depends on the switch, 8192 in the example). Three ways to get secure addresses:</p>
<ol class="steps">
  <li><b>Manually configured</b>: <code>switchport port-security mac-address <i>mac-address</i></code> for each address.</li>
  <li><b>Dynamically learned</b>: the current source MAC is secured automatically, but <b>not</b> added to the running configuration; after a reboot it is learned again.</li>
  <li><b>Dynamically learned – sticky</b>: <code>switchport port-security mac-address sticky</code> learns addresses and "sticks" them into the running configuration. Saving the configuration stores them in NVRAM.</li>
</ol>
<pre class="cli">S1(config)# interface fa0/1
S1(config-if)# switchport mode access
S1(config-if)# switchport port-security
S1(config-if)# switchport port-security maximum 4
S1(config-if)# switchport port-security mac-address aaaa.bbbb.1234
S1(config-if)# switchport port-security mac-address sticky
S1(config-if)# end</pre>
<p>Here one address is configured and up to three more are learned (sticky). Verify with <code>show port-security interface fa0/1</code> and <code>show port-security address</code>.</p>

<h3>Port security aging</h3>
<p>Aging removes secure addresses without deleting them by hand. Two types:</p>
<ul><li><b>Absolute</b>: the addresses are deleted after the aging time.</li><li><b>Inactivity</b>: they are deleted if inactive for the aging time.</li></ul>
<pre class="cli">Switch(config-if)# switchport port-security aging {static | time time | type {absolute | inactivity}}
S1(config-if)# switchport port-security aging time 10
S1(config-if)# switchport port-security aging type inactivity</pre>
<p>Aging of static secure addresses can be enabled or disabled per port.</p>

<h3>Violation modes</h3>
<p>A violation occurs when a frame's source MAC is not in the secure list (and the maximum is reached). <code>switchport port-security violation {shutdown | restrict | protect}</code>:</p>
<table class="t"><tr><th>Mode</th><th>Discards offending traffic</th><th>Sends syslog</th><th>Increments violation counter</th><th>Shuts down the port</th></tr>
<tr><td><b>shutdown</b> (default)</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes: error-disabled, port LED off</td></tr>
<tr><td><b>restrict</b></td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td></tr>
<tr><td><b>protect</b></td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr></table>
<p><b>Protect</b> is the least secure: it silently drops frames. Restrict and protect keep dropping until enough secure addresses are removed or the maximum is raised.</p>
<div class="errata"><b>Slide errata (slide 22):</b> the slide says that when a MAC differs from the secure list "a port violation occurs and the port enters the error-disabled state". That is only true for the default <b>shutdown</b> mode. <b>Slide 21</b>'s screenshot shows <i>Port Status: Secure-shutdown</i> next to <i>Violation Mode: Restrict</i>; in restrict mode the port stays up (Secure-up). The slide text "The show port-security command confirms the changes. interface command to verify" is garbled: the command is <code>show port-security interface</code>.</div>

<h3>Ports in the error-disabled state</h3>
<pre class="cli">%PM-4-ERR_DISABLE: psecure-violation error detected on Fa0/18, putting Fa0/18 in err-disable state
%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 000c.292b.4c75 on port FastEthernet0/18.
%LINEPROTO-5-UPDOWN: Line protocol on Interface FastEthernet0/18, changed state to down
%LINK-3-UPDOWN: Interface FastEthernet0/18, changed state to down</pre>
<p>No traffic passes. <code>show interface</code> shows <b>err-disabled</b>, <code>show port-security interface</code> shows <b>Secure-shutdown</b>, and the violation counter goes up by 1. Remove the unauthorized device first, then re-enable the port with <code>shutdown</code> followed by <code>no shutdown</code>.</p>

<h3>Verify port security</h3>
<pre class="cli">S1# show port-security
Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action
                (Count)       (Count)          (Count)
---------------------------------------------------------------------------
      Fa0/1              1            0                  0         Shutdown
S1# show port-security interface fastethernet 0/18
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Shutdown
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1
Sticky MAC Addresses       : 0
Last Source Address:Vlan   : 0025.83e6.4b01:1
Security Violation Count   : 0</pre>
<p>Sticky addresses appear in the running configuration (<code>switchport port-security mac-address sticky 0025.83e6.4b02</code>). <code>show port-security address</code> lists every secure MAC on all interfaces.</p>`,
        understand: {
          big: 'Port security limits which and how many source MAC addresses a port accepts; when a limit is broken, the violation mode decides: shutdown (err-disable), restrict (drop and log) or protect (drop silently).',
          why: 'Port security is the main defence against MAC flooding and rogue devices, and its defaults and violation modes are favourite exam questions.',
          keys: [
            'Shut down unused ports (interface range … / shutdown).',
            'Port security needs switchport mode access (or trunk); dynamic ports reject it.',
            'Defaults: maximum 1, violation shutdown.',
            'Secure addresses: static (mac-address), dynamic (not saved), sticky (saved in the running-config).',
            'Aging: absolute or inactivity (switchport port-security aging time / type).',
            'Violation modes: shutdown (err-disabled, syslog, counter), restrict (drop, syslog, counter), protect (drop only).',
            'Recover an err-disabled port: shutdown then no shutdown.',
          ],
          traps: [
            { trap: 'Enabling port security on a port still in dynamic auto.', fix: 'Set switchport mode access first, or the command is rejected.' },
            { trap: 'Thinking restrict shuts the port down.', fix: 'Only shutdown mode error-disables the port; restrict and protect just drop.' },
            { trap: 'Expecting dynamically learned (non-sticky) addresses after a reboot.', fix: 'Only sticky addresses are written to the running-config (and kept if you save it).' },
            { trap: 'Typing only no shutdown to recover an err-disabled port.', fix: 'Use shutdown first, then no shutdown, after removing the cause.' },
          ],
          analogy: 'A guest list on the door. Shutdown: the bouncer locks the door when a stranger arrives. Restrict: the stranger is turned away and noted in the logbook. Protect: the stranger is turned away silently.',
          explain: [
            { q: 'What happens with the default port security settings when a second device is plugged into the port?', a: 'Maximum 1 is exceeded, so the port goes error-disabled (shutdown mode), a syslog message is sent and the counter increments.' },
            { q: 'Why use sticky learning?', a: 'The switch learns the addresses automatically and saves them in the running-config, so they survive a reboot once saved.' },
            { q: 'Which violation mode would you choose to drop rogue frames but keep the legitimate user online and be alerted?', a: 'restrict: it drops, logs and counts, without shutting the port down.' },
          ],
          widgets: ['psecmodes'],
        },
      },
      /* ------------------------------------------------------------------ 11.2 */
      {
        id: '11.2', title: 'Mitigate VLAN Attacks',
        objective: 'Explain how to configure DTP and native VLAN to mitigate VLAN attacks.', slides: '32–33',
        read: `
<h3>VLAN attacks review</h3>
<p>A VLAN hopping attack can be launched three ways:</p>
<ul>
  <li>Spoofing DTP messages from the attacking host so the switch starts trunking; the attacker then sends traffic tagged with the target VLAN.</li>
  <li>Introducing a rogue switch and enabling trunking; the attacker reaches all VLANs of the victim switch.</li>
  <li>A double-tagging (double-encapsulated) attack, which abuses the way switch hardware processes tags.</li>
</ul>

<h3>Steps to mitigate VLAN hopping</h3>
<ol class="steps">
  <li>Disable DTP on non-trunking ports: <code>switchport mode access</code>.</li>
  <li>Disable unused ports and put them in an <b>unused VLAN</b>.</li>
  <li>Manually enable trunks: <code>switchport mode trunk</code>.</li>
  <li>Disable DTP on trunk ports: <code>switchport nonegotiate</code>.</li>
  <li>Set the native VLAN to something other than VLAN 1: <code>switchport trunk native vlan <i>vlan_number</i></code>.</li>
</ol>
<pre class="cli">S1(config)# interface range fa0/1 - 16
S1(config-if-range)# switchport mode access
S1(config-if-range)# exit
S1(config)# interface range fa0/17 - 20
S1(config-if-range)# switchport mode access
S1(config-if-range)# switchport access vlan 1000
S1(config-if-range)# exit
S1(config)# interface range fa0/21 - 24
S1(config-if-range)# switchport mode trunk
S1(config-if-range)# switchport nonegotiate
S1(config-if-range)# switchport trunk native vlan 999
S1(config-if-range)# end</pre>
<p>Fa0/1–16 are access ports; Fa0/17–20 are unused and parked in VLAN 1000; Fa0/21–24 are static trunks with DTP off and native VLAN 999.</p>`,
        understand: {
          big: 'Never let a port negotiate a trunk: access ports are access, trunks are static with nonegotiate, unused ports are parked in an unused VLAN, and the native VLAN is not VLAN 1.',
          why: 'These five steps appear in almost every switch-hardening configuration and exam scenario.',
          keys: [
            'VLAN hopping: spoofed DTP, a rogue switch, or double tagging.',
            'switchport mode access on every non-trunk port.',
            'Unused ports: shutdown and an unused VLAN.',
            'Trunks: switchport mode trunk + switchport nonegotiate.',
            'Native VLAN: not VLAN 1 (switchport trunk native vlan 999).',
          ],
          traps: [
            { trap: 'Leaving ports in dynamic auto because nothing is connected.', fix: 'Default dynamic ports can be turned into trunks by an attacker; set them to access.' },
            { trap: 'Thinking switchport mode trunk alone stops DTP.', fix: 'The port still sends DTP frames; add switchport nonegotiate.' },
            { trap: 'Keeping the native VLAN at 1 with user ports in VLAN 1.', fix: 'Use a dedicated native VLAN that no access port uses.' },
          ],
          analogy: 'Lock every internal door that is not a corridor (access mode), weld shut the corridors\' automatic doors so nobody can open new ones (nonegotiate), and store spare keys in an empty room (unused VLAN).',
          explain: [
            { q: 'Which command stops a trunk port from sending DTP frames?', a: 'switchport nonegotiate.' },
            { q: 'Why park unused ports in an unused VLAN as well as shutting them down?', a: 'If a port is ever enabled by mistake, a device on it lands in a VLAN with nothing in it.' },
            { q: 'Why should the native VLAN not be VLAN 1?', a: 'Double tagging needs the attacker to be in the native VLAN; a dedicated native VLAN with no access ports removes that possibility.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 11.3 */
      {
        id: '11.3', title: 'Mitigate DHCP Attacks',
        objective: 'Explain how to configure DHCP snooping to mitigate DHCP attacks.', slides: '35–39',
        read: `
<h3>DHCP attack review</h3>
<ul>
  <li><b>DHCP starvation</b> uses a tool such as Gobbler to create a DoS for clients. Port security stops it when Gobbler uses a different source MAC for every request.</li>
  <li>But Gobbler can use the interface's real MAC as the Ethernet source and put different addresses only in the DHCP payload. Port security is then useless.</li>
  <li><b>DHCP spoofing</b> needs more protection: <b>DHCP snooping</b> with trusted ports.</li>
</ul>

<h3>DHCP snooping</h3>
<ul>
  <li>Filters DHCP messages and <b>rate-limits</b> DHCP traffic on <b>untrusted</b> ports.</li>
  <li>Devices under administrative control (switches, routers, servers) are trusted sources. <b>Trusted</b> interfaces (trunk links, server ports) must be configured explicitly.</li>
  <li>Devices outside the network and all access ports are normally untrusted.</li>
  <li>Snooping builds the <b>DHCP snooping binding table</b>: the source MAC of a device on an untrusted port and the IP address the server gave it, bound together.</li>
</ul>

<h3>Steps to implement DHCP snooping</h3>
<ol class="steps">
  <li>Enable it globally: <code>ip dhcp snooping</code>.</li>
  <li>On trusted ports: <code>ip dhcp snooping trust</code>.</li>
  <li>On untrusted ports, limit DHCP discover messages: <code>ip dhcp snooping limit rate <i>packets-per-second</i></code>.</li>
  <li>Enable it per VLAN or range: <code>ip dhcp snooping vlan <i>vlan-list</i></code>.</li>
</ol>
<pre class="cli">S1(config)# ip dhcp snooping
S1(config)# interface f0/1
S1(config-if)# ip dhcp snooping trust
S1(config-if)# exit
S1(config)# interface range f0/5 - 24
S1(config-if-range)# ip dhcp snooping limit rate 6
S1(config-if)# exit
S1(config)# ip dhcp snooping vlan 5,10,50-52
S1(config)# end</pre>
<p>F0/1 faces the DHCP server and is trusted; F0/5–24 are untrusted and limited to 6 packets per second.</p>

<h3>Verify</h3>
<pre class="cli">S1# show ip dhcp snooping
Switch DHCP snooping is enabled
DHCP snooping is configured on following VLANs:
5,10,50-52
Interface                  Trusted    Allow option    Rate limit (pps)
FastEthernet0/1            yes        yes             unlimited
FastEthernet0/5            no         no              6
S1# show ip dhcp snooping binding
MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface
00:03:47:B5:9F:AD   192.168.10.10    193185      dhcp-snooping   5    FastEthernet0/5</pre>
<div class="note">DHCP snooping is also required by Dynamic ARP Inspection. In Packet Tracer and IOS labs, if clients stop getting addresses from a router-based DHCP server after you enable snooping, add <code>no ip dhcp snooping information option</code> (the switch inserts option 82, which the IOS DHCP server rejects by default).</div>`,
        understand: {
          big: 'DHCP snooping trusts only the ports that lead to real DHCP servers, rate-limits DHCP on the access ports, and records which MAC got which IP in a binding table.',
          why: 'It stops rogue DHCP servers and starvation, and DAI depends on its binding table.',
          keys: [
            'Port security stops simple starvation; snooping also stops payload-based starvation and spoofing.',
            'Trusted: uplinks and server ports, configured explicitly. Untrusted: access ports (default).',
            'Steps: ip dhcp snooping → trust on trusted ports → limit rate on untrusted ports → ip dhcp snooping vlan.',
            'Binding table: MAC, IP, lease, VLAN, interface.',
            'Verify: show ip dhcp snooping, show ip dhcp snooping binding.',
          ],
          traps: [
            { trap: 'Enabling snooping globally and forgetting the VLANs.', fix: 'Snooping does nothing until ip dhcp snooping vlan lists the VLANs.' },
            { trap: 'Forgetting to trust the uplink to the DHCP server.', fix: 'Offers arriving on an untrusted port are dropped, so clients get no address.' },
            { trap: 'Rate-limiting the trusted uplink.', fix: 'Limit the untrusted access ports; trusted ports show unlimited.' },
          ],
          analogy: 'Only the official post office door (trusted port) may deliver DHCP offers; side doors (access ports) may only send requests, and only a few per second.',
          explain: [
            { q: 'Why can port security not stop every DHCP starvation attack?', a: 'The tool can use one real source MAC and put fake client MACs only inside the DHCP payload.' },
            { q: 'What does an untrusted port do with a DHCPOFFER?', a: 'It drops it, because servers are only allowed behind trusted ports.' },
            { q: 'What is stored in the DHCP snooping binding table?', a: 'Each client\'s MAC address, assigned IP address, lease time, VLAN and interface.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 11.4 */
      {
        id: '11.4', title: 'Mitigate ARP Attacks',
        objective: 'Explain how to configure ARP inspection to mitigate ARP attacks.', slides: '41–45',
        read: `
<h3>Dynamic ARP Inspection</h3>
<p>In an ARP attack, the threat actor sends unsolicited ARP replies with its own MAC address and the default gateway's IP address. To stop ARP spoofing and poisoning, the switch must relay only valid ARP requests and replies. <b>DAI requires DHCP snooping</b> and:</p>
<ul>
  <li>Does not relay invalid or gratuitous ARP replies to other ports in the same VLAN.</li>
  <li>Intercepts all ARP requests and replies on <b>untrusted</b> ports.</li>
  <li>Checks each intercepted packet for a valid IP-to-MAC binding (from the snooping table).</li>
  <li>Drops and logs invalid ARP replies to prevent poisoning.</li>
  <li>Error-disables the interface if the configured number of ARP packets is exceeded.</li>
</ul>

<h3>DAI implementation guidelines</h3>
<ol class="steps"><li>Enable DHCP snooping globally.</li><li>Enable DHCP snooping on the selected VLANs.</li><li>Enable DAI on the selected VLANs.</li><li>Configure trusted interfaces for both DHCP snooping and ARP inspection.</li></ol>
<p>Generally, make all access ports untrusted and all uplinks to other switches trusted.</p>
<pre class="cli">S1(config)# ip dhcp snooping
S1(config)# ip dhcp snooping vlan 10
S1(config)# ip arp inspection vlan 10
S1(config)# interface fa0/24
S1(config-if)# ip dhcp snooping trust
S1(config-if)# ip arp inspection trust</pre>
<p>S1 connects two VLAN 10 users; Fa0/24 is the uplink to the router, trusted for both features.</p>

<h3>Extra validation checks</h3>
<ul>
  <li><b>Destination MAC</b>: the Ethernet destination MAC must match the target MAC in the ARP body.</li>
  <li><b>Source MAC</b>: the Ethernet source MAC must match the sender MAC in the ARP body.</li>
  <li><b>IP address</b>: invalid or unexpected IP addresses in the ARP body (0.0.0.0, 255.255.255.255, all multicasts) are dropped.</li>
</ul>
<pre class="cli">S1(config)# ip arp inspection validate src-mac
S1(config)# ip arp inspection validate dst-mac
S1(config)# ip arp inspection validate ip
S1(config)# do show run | include validate
ip arp inspection validate ip
S1(config)# ip arp inspection validate src-mac dst-mac ip
S1(config)# do show run | include validate
ip arp inspection validate src-mac dst-mac ip</pre>
<p>Only <b>one</b> <code>ip arp inspection validate</code> command is kept: each new one <b>overwrites</b> the previous one. Put all the checks you want on the same line.</p>`,
        understand: {
          big: 'DAI checks every ARP packet on untrusted ports against the DHCP snooping binding table and drops forged replies; trusted uplinks are not checked.',
          why: 'DAI is the specific defence against ARP spoofing and poisoning, and it only works together with DHCP snooping.',
          keys: [
            'DAI requires DHCP snooping (it uses the binding table).',
            'Untrusted ports: ARP is intercepted and validated. Trusted ports: not checked.',
            'Steps: ip dhcp snooping, ip dhcp snooping vlan, ip arp inspection vlan, trust the uplinks for both.',
            'Access ports untrusted; uplinks to switches and routers trusted.',
            'ip arp inspection validate src-mac dst-mac ip: all checks on one line; a new command overwrites the old one.',
          ],
          traps: [
            { trap: 'Enabling DAI without DHCP snooping.', fix: 'Without the snooping binding table, DAI has nothing to validate against.' },
            { trap: 'Entering three separate validate commands and expecting all three.', fix: 'Each overwrites the previous; use one command with all keywords.' },
            { trap: 'Trusting access ports for ARP inspection.', fix: 'Trust only uplinks; access ports must stay untrusted.' },
          ],
          analogy: 'A border guard with the official residents\' register (snooping table): anyone claiming "I live at this address" is checked against it, and liars are turned back.',
          explain: [
            { q: 'Why does DAI depend on DHCP snooping?', a: 'It validates ARP packets against the IP-to-MAC bindings that DHCP snooping recorded.' },
            { q: 'Which ports should be trusted for ARP inspection?', a: 'Uplinks to other switches and routers; access ports stay untrusted.' },
            { q: 'You enter validate src-mac, then validate ip. Which check is active?', a: 'Only ip; the second command overwrote the first.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 11.5 */
      {
        id: '11.5', title: 'Mitigate STP Attacks',
        objective: 'Explain how to configure PortFast and BPDU Guard to mitigate STP attacks.', slides: '47–50',
        read: `
<h3>PortFast and BPDU Guard</h3>
<p>Attackers can spoof the root bridge and change the topology. Mitigate STP attacks with:</p>
<ul>
  <li><b>PortFast</b>: brings a port straight from blocking to forwarding, skipping listening and learning. Apply it to all end-user access ports.</li>
  <li><b>BPDU Guard</b>: immediately error-disables a port that receives a BPDU. Like PortFast, only on interfaces attached to end devices.</li>
</ul>

<h3>Configure PortFast</h3>
<p>Only on access ports: PortFast on inter-switch links can create a spanning-tree loop.</p>
<pre class="cli">S1(config)# interface fa0/1
S1(config-if)# switchport mode access
S1(config-if)# spanning-tree portfast
%Warning: portfast should only be enabled on ports connected to a single
 host. Connecting hubs, concentrators, switches, bridges, etc... to this
 interface when portfast is enabled, can cause temporary bridging loops.
 Use with CAUTION
%Portfast has been configured on FastEthernet0/1 but will only
 have effect when the interface is in a non-trunking mode.
S1(config-if)# exit
S1(config)# spanning-tree portfast default
%Warning: this command enables portfast by default on all interfaces. …</pre>
<p><code>spanning-tree portfast</code> on an interface; <code>spanning-tree portfast default</code> globally enables it on all access ports. Verify globally with <code>show running-config | begin span</code> or <code>show spanning-tree summary</code>, and per interface with <code>show running-config interface <i>type/number</i></code> or <code>show spanning-tree interface <i>type/number</i> detail</code>.</p>

<h3>Configure BPDU Guard</h3>
<p>An access port can receive an unexpected BPDU by accident or because someone connected an unauthorized switch. With BPDU Guard, the port is error-disabled and must be re-enabled manually or recovered automatically with <code>errdisable recovery</code>.</p>
<pre class="cli">S1(config)# interface fa0/1
S1(config-if)# spanning-tree bpduguard enable
S1(config-if)# exit
S1(config)# spanning-tree portfast bpduguard default
S1(config)# end
S1# show spanning-tree summary
Switch is in pvst mode
Root bridge for: none
Extended system ID           is enabled
Portfast Default             is enabled
PortFast BPDU Guard Default  is enabled
Portfast BPDU Filter Default is disabled
Loopguard Default            is disabled
EtherChannel misconfig guard is enabled
UplinkFast                   is disabled
BackboneFast                 is disabled
Configured Pathcost method used is short</pre>
<p><code>spanning-tree bpduguard enable</code> on an interface; <code>spanning-tree portfast bpduguard default</code> enables it on all PortFast ports.</p>
<div class="errata"><b>Slide errata (slide 50):</b> automatic recovery for BPDU Guard is <code>errdisable recovery cause bpduguard</code>. The slide shows <code>errdisable recovery cause psecure_violation</code>, which is the cause for port security violations. The "New Terms and Commands" slide also misspells <code>spanning-tree portfast bpduguard default</code> as "porfast", lists the non-existent <code>show switchport port-security</code> (it is <code>show port-security</code>), and is titled "LAN Security Concepts" instead of "Switch Security Configuration".</div>`,
        understand: {
          big: 'Edge ports get PortFast (no 30-second wait) and BPDU Guard (any BPDU shuts the port), so no device on an access port can join or take over spanning tree.',
          why: 'This is how you stop an attacker from becoming the root bridge, and it also helps DHCP clients get addresses quickly.',
          keys: [
            'PortFast: skip listening and learning; only on access ports to end devices.',
            'Interface: spanning-tree portfast. Global: spanning-tree portfast default (all access ports).',
            'BPDU Guard: a received BPDU error-disables the port.',
            'Interface: spanning-tree bpduguard enable. Global: spanning-tree portfast bpduguard default.',
            'Verify: show spanning-tree summary, show running-config | begin span, show spanning-tree interface x detail.',
            'Automatic recovery: errdisable recovery cause bpduguard.',
          ],
          traps: [
            { trap: 'Enabling PortFast on trunk links.', fix: 'Only on access ports; on trunks it has no effect, and on switch links it risks loops.' },
            { trap: 'Thinking BPDU Guard only drops BPDUs.', fix: 'It error-disables the whole port.' },
            { trap: 'Using errdisable recovery cause psecure_violation for BPDU Guard.', fix: 'That cause is for port security; BPDU Guard uses cause bpduguard.' },
          ],
          analogy: 'PortFast is an express lane at the entrance; BPDU Guard is the alarm that closes the lane the moment someone tries to drive a delivery truck (a switch) through it.',
          explain: [
            { q: 'What happens when an attacker connects a switch to a BPDU Guard port and sends BPDUs?', a: 'The port is error-disabled immediately, so the attacker cannot influence the root election.' },
            { q: 'Which global commands enable PortFast and BPDU Guard on all access ports?', a: 'spanning-tree portfast default and spanning-tree portfast bpduguard default.' },
            { q: 'How can you confirm the global PortFast and BPDU Guard defaults?', a: 'show spanning-tree summary lists "Portfast Default" and "PortFast BPDU Guard Default".' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
