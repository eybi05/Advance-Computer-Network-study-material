/* Module 13 — WLAN Configuration (SRWE v7, slides in SRWE_Module_13.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm13', num: 13, title: 'WLAN Configuration',
    objective: 'Implement a WLAN using a wireless router and WLC.',
    deck: 'SRWE_Module_13.pptx',
    topics: [
      /* ------------------------------------------------------------------ 13.1 */
      {
        id: '13.1', title: 'Remote Site WLAN Configuration',
        objective: 'Configure a WLAN to support a remote site.', slides: '14–23',
        read: `
<h3>The wireless router</h3>
<p>Remote workers, small branch offices and homes often use a small office/home router. These "integrated" routers include a switch for wired clients, a port for the internet connection (sometimes labelled <b>WAN</b>) and wireless components. They typically provide WLAN security, <b>DHCP</b>, integrated <b>NAT</b>, <b>QoS</b> and more, depending on the model. Cable or DSL modem configuration is usually done by the service provider.</p>
<div class="errata"><b>Slide errata (slide 14):</b> "Name Address Translation (NAT)" should be <b>Network</b> Address Translation.</div>

<h3>Log in to the wireless router</h3>
<p>Most wireless routers are preconfigured to connect and provide services. Default IP addresses, usernames and passwords are easy to find on the internet, so <b>change the defaults first</b>. Open a web browser to the default IP address; <b>admin</b> is a common default username and password.</p>

<h3>Basic network setup</h3>
<ol class="steps">
  <li>Log in to the router from a web browser.</li>
  <li>Change the default administrative password.</li>
  <li>Log in with the new password.</li>
  <li>Change the default DHCP IPv4 addresses (the LAN subnet).</li>
  <li>Renew the IP address on the client.</li>
  <li>Log in to the router at its new IP address.</li>
</ol>

<h3>Basic wireless setup</h3>
<ol class="steps">
  <li>View the WLAN defaults.</li>
  <li>Change the <b>network mode</b> (which 802.11 standard).</li>
  <li>Configure the <b>SSID</b>.</li>
  <li>Configure the <b>channel</b>, avoiding overlapping channels.</li>
  <li>Configure the <b>security mode</b>: Open, WPA, WPA2 Personal, WPA2 Enterprise, …</li>
  <li>Configure the <b>passphrase</b> required by the security mode.</li>
</ol>

<h3>Wireless mesh network</h3>
<p>One router may cover a small office or home. To go beyond about <b>45 metres indoors and 90 metres outdoors</b>, build a wireless mesh: add access points with the <b>same settings</b> except the <b>channel</b> (different channels prevent interference). Vendors make mesh networks (WMN) easy to set up with smartphone apps.</p>

<h3>NAT for IPv4</h3>
<p>The ISP gives the wireless router a public address; the LAN uses private addresses. <b>NAT</b> translates a private (local) source address into the public (global) address, and the reverse for returning packets. It shares one public IPv4 address among many devices by tracking the <b>source port numbers</b> of each session. If the ISP supports IPv6, each device gets a unique IPv6 address.</p>

<h3>Quality of Service</h3>
<p>QoS guarantees that time-sensitive traffic such as <b>voice and video</b> is prioritised over traffic that is less time-sensitive, such as email and web browsing. Some routers can also prioritise traffic on specific ports.</p>

<h3>Port forwarding</h3>
<p>Wireless routers block TCP and UDP ports by default to prevent unauthorized access. <b>Port forwarding</b> is a rule-based method of directing traffic between devices on separate networks, so a specific application can be reached. <b>Port triggering</b> temporarily forwards inbound ports to a specific device, only when a designated port range is used for an outbound request.</p>
<div class="note"><b>Packet Tracer 13.1.10 (Configure a Wireless Network):</b> connect to and configure a wireless router, connect wired and wireless devices, add an AP to extend coverage, and update the default settings. The <a href="#lab-m13-home-router">home router lab</a> does this in your own Packet Tracer.</div>`,
        understand: {
          big: 'A SOHO wireless router is AP + switch + router + DHCP + NAT in one box: change the defaults, set the LAN subnet, then the SSID, channel and WPA2 security.',
          why: 'Configuring a home or branch wireless router is a hands-on skill tested in labs and the skills exam.',
          keys: [
            'Change default admin credentials first.',
            'Network setup: new password → new LAN/DHCP subnet → renew client → log in at the new address.',
            'Wireless setup: network mode, SSID, channel, security mode, passphrase.',
            'Mesh beyond ~45 m indoors / 90 m outdoors: same settings, different channels.',
            'NAT: private to public using source port numbers. QoS: prioritise voice/video.',
            'Port forwarding (static rule) vs port triggering (opened by an outbound request).',
          ],
          traps: [
            { trap: 'Using the same channel on every mesh AP.', fix: 'Mesh APs share settings except the channel, which must differ to avoid interference.' },
            { trap: 'Forgetting to renew the client\'s address after changing the LAN subnet.', fix: 'The client still has an old address; renew it and browse to the new router IP.' },
            { trap: 'Confusing port forwarding and port triggering.', fix: 'Forwarding is always open; triggering opens only after a matching outbound request.' },
          ],
          analogy: 'NAT is the building\'s front desk: all post leaves with the building\'s address, and replies are routed to the right flat by the reference number (port) on each envelope.',
          explain: [
            { q: 'Why change the default administrative password first?', a: 'Default addresses, usernames and passwords are published on the internet.' },
            { q: 'How does NAT let many devices share one public IPv4 address?', a: 'It translates their private source addresses to the public address and keeps track of each session by source port number.' },
            { q: 'What is the difference between port forwarding and port triggering?', a: 'Forwarding permanently directs a port to a device; triggering opens inbound ports temporarily after a matching outbound request.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 13.2 */
      {
        id: '13.2', title: 'Configure a Basic WLAN on the WLC',
        objective: 'Configure a WLC WLAN to use the management interface and WPA2 PSK authentication.', slides: '25–36',
        read: `
<h3>WLC topology</h3>
<p>The AP is controller-based (a lightweight AP), so it needs no initial configuration; LAPs communicate with the WLC and are configured and managed automatically. Controller-based APs make sense when many APs are needed.</p>
<table class="t"><tr><th>Device</th><th>Interface</th><th>IP address</th><th>Mask</th></tr>
<tr><td>R1</td><td>F0/0</td><td>172.16.1.1</td><td>255.255.255.0</td></tr>
<tr><td>R1</td><td>F0/1.1</td><td>192.168.200.1</td><td>255.255.255.0</td></tr>
<tr><td>S1</td><td>VLAN 1</td><td>DHCP</td><td></td></tr>
<tr><td>WLC</td><td>Management</td><td>192.168.200.254</td><td>255.255.255.0</td></tr>
<tr><td>AP1</td><td>Wired 0</td><td>192.168.200.3</td><td>255.255.255.0</td></tr>
<tr><td>PC-A</td><td>NIC</td><td>172.16.1.254</td><td>255.255.255.0</td></tr>
<tr><td>PC-B / wireless laptop</td><td>NIC</td><td>DHCP</td><td></td></tr></table>
<p>S1's links to R1, the WLC and AP1 are 802.1Q trunks.</p>

<h3>Log in and look around</h3>
<ul>
  <li>Log in with the credentials set during initial setup. The <b>Network Summary</b> page is a dashboard of the configured WLANs, associated APs and active clients, and shows rogue APs and clients.</li>
  <li><b>Access Points</b> shows each AP's system information and performance: AP1 uses 192.168.200.3 and, thanks to <b>CDP</b>, the WLC knows it is connected to switch port Fa0/1. AP1 is a Cisco Aironet 1815i, which accepts a limited set of IOS commands.</li>
  <li>On a Cisco 3504 Wireless Controller, click <b>Advanced</b> (top right) for the advanced Summary page, from which all features are reachable.</li>
</ul>

<h3>Configure a WLAN</h3>
<p>WLCs have Layer 2 switch ports and virtual interfaces created in software, similar to VLAN interfaces. Each physical port can support many APs and WLANs; the ports are essentially <b>trunk</b> ports. Each AP can support multiple WLANs. Steps:</p>
<ol class="steps">
  <li><b>Create the WLAN</b>: WLANs > Create New > Go; profile name and SSID <b>Wireless_LAN</b>, ID 1.</li>
  <li><b>Apply and enable</b> the WLAN (Status: Enabled).</li>
  <li><b>Select the interface</b> that carries the WLAN traffic (Interface/Interface Group).</li>
  <li><b>Secure the WLAN</b> on the Security tab (for example WPA2 with PSK).</li>
  <li><b>Verify</b> it is operational in the WLANs menu.</li>
  <li><b>Monitor</b> it on the Monitor tab: the summary shows Wireless_LAN with one client.</li>
  <li><b>View client details</b> under Clients.</li>
</ol>
<div class="note">The deck says LAPs use LWAPP to talk to the WLC; current controllers use CAPWAP, which is based on LWAPP (module 12).</div>`,
        understand: {
          big: 'On a WLC you create a WLAN (profile + SSID), enable it, map it to an interface (which VLAN carries its traffic), secure it, then verify and monitor clients, while the lightweight APs are configured automatically.',
          why: 'Creating and securing a WLAN on a WLC is the main configuration task in module 13 and its Packet Tracer activities.',
          keys: [
            'LAPs need no initial configuration; the WLC manages them.',
            'Network Summary: WLANs, APs, clients, rogue APs and clients.',
            'CDP lets the WLC see which switch port an AP is on.',
            'WLC ports are essentially trunks; virtual interfaces are like VLAN interfaces.',
            'Steps: create → enable → select interface → secure → verify → monitor → client details.',
          ],
          traps: [
            { trap: 'Expecting to configure the SSID on the lightweight AP itself.', fix: 'WLANs are created on the WLC and pushed to its APs.' },
            { trap: 'Forgetting to enable the WLAN after creating it.', fix: 'Set Status to Enabled and Apply.' },
          ],
          analogy: 'The WLC is a TV studio: you create a channel (WLAN), decide which cable feed it uses (interface), lock it (security), and every transmitter (AP) starts broadcasting it.',
          explain: [
            { q: 'Why does a lightweight AP need no initial configuration?', a: 'It joins the WLC, which configures and manages it automatically.' },
            { q: 'What does selecting the interface for a WLAN decide?', a: 'Which WLC interface, and so which VLAN and subnet, carries the WLAN\'s client traffic.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 13.3 */
      {
        id: '13.3', title: 'Configure a WPA2 Enterprise WLAN on the WLC',
        objective: 'Configure a WLC WLAN to use a VLAN interface, a DHCP server, and WPA2 Enterprise authentication.', slides: '38–60',
        read: `
<h3>SNMP and RADIUS</h3>
<p>PC-A runs <b>SNMP</b> and <b>RADIUS</b> server software. The WLC should forward all SNMP log messages (<b>traps</b>) to the SNMP server, and use the RADIUS server for AAA: users enter their username and password, and RADIUS verifies them. A RADIUS server is <b>required</b> for WPA2 Enterprise. (Configuring the servers themselves is beyond this module.)</p>
<ul>
  <li><b>SNMP server</b>: MANAGEMENT > SNMP > Trap Receivers > New…; enter the community name and the server's IPv4 or IPv6 address; Apply.</li>
  <li><b>RADIUS server</b>: SECURITY > RADIUS > Authentication > New…; enter PC-A's IPv4 address and the <b>shared secret</b>; Apply. The new server appears in the list of RADIUS authentication servers.</li>
</ul>

<h3>A new VLAN interface</h3>
<p>Each WLAN on the WLC needs its own virtual interface. The WLC has five physical data ports that can carry multiple WLANs and interfaces. The new WLAN uses <b>VLAN 5</b> and 192.168.5.0/24, and R1 has a matching subinterface.</p>
<ol class="steps">
  <li>Create a new interface: CONTROLLER > Interfaces > New…</li>
  <li>Name and VLAN ID: <b>vlan5</b>, VLAN ID <b>5</b>; Apply.</li>
  <li>Port and address: physical port 1 (G1), interface address 192.168.5.254/24, gateway 192.168.5.1.</li>
  <li>DHCP server: primary DHCP server 192.168.5.1 (R1, which runs the DHCP pool).</li>
  <li>Apply and confirm the warning.</li>
  <li>Verify: the vlan5 interface appears in the Interfaces list with its address.</li>
</ol>

<h3>A DHCP scope on the WLC</h3>
<p>The WLC has an internal DHCP server too:</p>
<ol class="steps">
  <li>Internal DHCP Server > DHCP Scope > New…</li>
  <li>Name the scope <b>Wireless_Management</b>; Apply.</li>
  <li>Click the scope name in the DHCP Scopes list.</li>
  <li>Configure the pool (192.168.200.240 to .249, /24) and the default router (192.168.200.1), set Status <b>Enabled</b>, Apply.</li>
  <li>Verify the scope is listed and ready to be used by a WLAN.</li>
</ol>

<h3>A WPA2 Enterprise WLAN</h3>
<p>By default, new WLANs on the WLC use <b>WPA2 with AES</b>, and <b>802.1X</b> is the default key management protocol towards the RADIUS server.</p>
<ol class="steps">
  <li>Create a new WLAN: WLANs tab > Go.</li>
  <li>Enter the profile name and SSID, choose ID 5, Apply.</li>
  <li>Set Status to Enabled and choose <b>vlan5</b> as the Interface/Interface Group; Apply.</li>
  <li>Check the Security tab: WPA2, AES and 802.1X are the defaults.</li>
  <li>AAA Servers tab: select the RADIUS server configured earlier; Apply.</li>
  <li>Verify the new WLAN is listed and enabled under WLANs.</li>
</ol>
<div class="errata"><b>Slide errata:</b> slide 56 says "Advanced Encryption <i>System</i>"; AES is the Advanced Encryption <b>Standard</b>. Slide 73 lists RADIUS as "authentication, accounting, and auditing"; AAA is authentication, <b>authorization</b> and accounting.</div>`,
        understand: {
          big: 'WPA2 Enterprise on a WLC needs three building blocks: a RADIUS server entry (IP + shared secret), a VLAN interface for the WLAN with a DHCP source, and a WLAN mapped to that interface with 802.1X security pointing at the RADIUS server.',
          why: 'This is the enterprise way to run Wi-Fi: per-user credentials on their own VLAN.',
          keys: [
            'SNMP traps: MANAGEMENT > SNMP > Trap Receivers.',
            'RADIUS: SECURITY > RADIUS > Authentication > New (server IP + shared secret).',
            'Each WLAN needs its own interface: CONTROLLER > Interfaces > New (name, VLAN ID, port, IP, gateway, DHCP server).',
            'Internal DHCP scope: name, address range, default router, Enabled.',
            'New WLANs default to WPA2 + AES + 802.1X; select the RADIUS server under AAA Servers.',
          ],
          traps: [
            { trap: 'Mapping the enterprise WLAN to the management interface.', fix: 'Map it to its own VLAN interface (vlan5) so users land in the right subnet.' },
            { trap: 'Expecting WPA2 Enterprise to work without a RADIUS server.', fix: 'Enterprise mode requires a RADIUS (AAA) server.' },
            { trap: 'Forgetting the DHCP server on the new interface.', fix: 'Clients in VLAN 5 need a DHCP source: the interface\'s primary DHCP server or a WLC scope.' },
          ],
          analogy: 'Opening a new department: register the security office (RADIUS), give the department its own floor (VLAN interface) with a reception desk (DHCP), then put a badge reader (802.1X) on the department door (WLAN).',
          explain: [
            { q: 'What two values identify the RADIUS server on the WLC?', a: 'Its IP address and the shared secret (plus the ports, 1812/1813 by default).' },
            { q: 'Why create a new interface for the enterprise WLAN?', a: 'Each WLAN needs a virtual interface that maps it to a VLAN and subnet, with its gateway and DHCP server.' },
            { q: 'What security does a new WLAN get by default on the WLC?', a: 'WPA2 with AES and 802.1X key management.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 13.4 */
      {
        id: '13.4', title: 'Troubleshoot WLAN Issues',
        objective: 'Troubleshoot common wireless configuration issues.', slides: '62–69',
        read: `
<h3>Troubleshooting approach</h3>
<p>Problems can come from hardware, software and connectivity together. Troubleshooting follows a systematic method based on the scientific method:</p>
<table class="t"><tr><th>Step</th><th>Title</th><th>Description</th></tr>
<tr><td>1</td><td>Identify the problem</td><td>Talk to the user; tools help too.</td></tr>
<tr><td>2</td><td>Establish a theory of probable causes</td><td>Often more than one possible cause.</td></tr>
<tr><td>3</td><td>Test the theory to determine the cause</td><td>Try quick fixes; if they fail, research further.</td></tr>
<tr><td>4</td><td>Establish a plan of action and implement the solution</td><td>Once the exact cause is known.</td></tr>
<tr><td>5</td><td>Verify full system functionality and implement preventive measures</td><td>Make sure everything works and it does not happen again.</td></tr>
<tr><td>6</td><td>Document findings, actions and outcomes</td><td>Important for future reference.</td></tr></table>

<h3>Wireless client not connecting</h3>
<p>If there is <b>no connectivity</b>:</p>
<ul>
  <li>Check the PC's network configuration with <code>ipconfig</code>.</li>
  <li>Check it can reach the wired network: ping a known IP address.</li>
  <li>Reload drivers or try a different wireless NIC if needed.</li>
  <li>If the NIC works, check the client's security mode and encryption settings.</li>
</ul>
<p>If the PC works but the <b>wireless connection is poor</b>:</p>
<ul><li>Is the PC outside the planned coverage area (BSA)?</li><li>Check the client's channel settings.</li><li>Check for interference in the 2.4 GHz band.</li></ul>
<p>Then check that all devices are actually in place (consider physical security), powered on, and that cables and connectors are intact. If the physical plant is fine, ping the wired devices, including the AP. If it still fails, investigate the AP and its configuration, starting with its power status.</p>

<h3>When the network is slow</h3>
<p>To optimise dual-band routers and APs:</p>
<ul>
  <li><b>Upgrade wireless clients</b>: older 802.11b, g and even n devices slow the whole WLAN; ideally all devices support the same, highest standard.</li>
  <li><b>Split the traffic</b> between 2.4 GHz and 5 GHz, using them as two separate networks. 2.4 GHz suits basic internet traffic that is not time-sensitive; 5 GHz is much less crowded, has more channels and suits streaming multimedia.</li>
</ul>
<p>Dual-band devices use the <b>same network name</b> on both bands by default. The simplest way to segment the traffic is to rename one of the networks. To improve range, keep the AP free of obstructions such as furniture and tall appliances. If that is not enough, use a Wi-Fi range extender or Powerline wireless technology.</p>

<h3>Updating firmware</h3>
<p>Most wireless routers and APs have upgradable firmware that should be checked periodically; releases fix customer-reported problems and security vulnerabilities. On a WLC you can upgrade all the APs it controls. On a Cisco 3504: <b>WIRELESS > Access Points > Global Configuration</b>, then the <b>AP Image Pre-download</b> section at the bottom of the page.</p>`,
        understand: {
          big: 'Troubleshoot WLANs methodically: six steps from identifying the problem to documenting it, eliminating the client, then the physical layer, then the AP; fix slow WLANs by upgrading clients and splitting traffic across 2.4 and 5 GHz.',
          why: 'The six-step process and the WLAN-specific checks are tested in both the theory and the troubleshooting Packet Tracer activities.',
          keys: [
            '1 Identify, 2 theory, 3 test, 4 plan and implement, 5 verify and prevent, 6 document.',
            'No connectivity: ipconfig, ping the wired network, drivers or NIC, security and encryption settings.',
            'Poor connection: outside the BSA, channel settings, 2.4 GHz interference.',
            'Then: devices in place and powered, cables, ping the AP, then the AP itself.',
            'Slow WLAN: upgrade old clients; split 2.4 GHz and 5 GHz (rename one SSID).',
            'Firmware: upgrade APs from the WLC (AP Image Pre-download).',
          ],
          traps: [
            { trap: 'Starting by changing the AP configuration.', fix: 'Identify the problem and eliminate the client first, then the physical layer, then the AP.' },
            { trap: 'Skipping documentation once the problem is fixed.', fix: 'Step 6 is documenting findings, actions and outcomes.' },
            { trap: 'Putting streaming video on 2.4 GHz to "keep 5 GHz free".', fix: '5 GHz is less crowded with more channels, ideal for streaming.' },
          ],
          analogy: 'A doctor: listen to the patient (identify), suspect causes (theory), run tests, treat, check recovery and prevent relapse, then write the notes.',
          explain: [
            { q: 'List the six troubleshooting steps.', a: 'Identify the problem; establish a theory of probable causes; test the theory; establish a plan and implement the solution; verify full functionality and implement preventive measures; document findings, actions and outcomes.' },
            { q: 'A laptop connects but is slow. Name two causes to check.', a: 'It may be outside the coverage area (BSA), use the wrong channel, or suffer interference in the 2.4 GHz band.' },
            { q: 'Why split traffic between 2.4 GHz and 5 GHz?', a: '5 GHz is less crowded and has more channels, so time-sensitive traffic gets a cleaner band while basic traffic uses 2.4 GHz.' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
