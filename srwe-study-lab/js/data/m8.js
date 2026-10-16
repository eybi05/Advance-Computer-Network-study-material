/* Module 8 — SLAAC and DHCPv6 (SRWE v7, slides in SRWE_Module_8.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm8', num: 8, title: 'SLAAC and DHCPv6',
    objective: 'Configure dynamic address allocation in IPv6 networks.',
    deck: 'SRWE_Module_8.pptx',
    topics: [
      /* ------------------------------------------------------------------ 8.1 */
      {
        id: '8.1', title: 'IPv6 GUA Assignment',
        objective: 'Explain how an IPv6 host can acquire its IPv6 configuration.', slides: '12–15',
        read: `
<h3>IPv6 host configuration</h3>
<ul>
  <li>On a router, a <b>global unicast address (GUA)</b> is configured manually with <code>ipv6 address <i>ipv6-address/prefix-length</i></code>.</li>
  <li>A Windows host can also be configured manually, but typing GUAs is slow and error-prone, so most hosts acquire their GUA <b>dynamically</b>.</li>
</ul>

<h3>The host link-local address</h3>
<ul>
  <li>With automatic addressing selected, the host uses an ICMPv6 <b>Router Advertisement (RA)</b> to configure itself.</li>
  <li>The <b>link-local address (LLA)</b> is created automatically as soon as the host boots and the Ethernet interface is active.</li>
  <li>Without a router on the segment, the host has an LLA but <b>no GUA</b>, because nothing tells it the network prefix.</li>
  <li>The <b>%</b> and number at the end of a Windows LLA (for example <code>fe80::…%11</code>) is the <b>Zone ID</b> or <b>Scope ID</b>: it ties the LLA to one interface.</li>
</ul>

<h3>Dynamic GUA assignment</h3>
<p>An IPv6-enabled router sends RAs periodically. A host can get a GUA through <b>stateless</b> or <b>stateful</b> services; every method in this module uses the RA to <b>suggest</b> what the host should do. The host operating system normally follows the suggestion, but the decision is ultimately the host's.</p>

<h3>The three RA flags</h3>
<table class="t"><tr><th>Flag</th><th>Name</th><th>When set to 1, it tells the host…</th></tr>
<tr><td><b>A</b></td><td>Address Autoconfiguration</td><td>use <b>SLAAC</b> to create its own GUA from the prefix in the RA.</td></tr>
<tr><td><b>O</b></td><td>Other Configuration</td><td>other information (such as DNS) is available from a <b>stateless DHCPv6</b> server.</td></tr>
<tr><td><b>M</b></td><td>Managed Address Configuration</td><td>get the GUA from a <b>stateful DHCPv6</b> server.</td></tr></table>
<p>The combination of A, O and M tells the host which of the dynamic options to use:</p>
<table class="t"><tr><th>Method</th><th>A</th><th>O</th><th>M</th></tr>
<tr><td>SLAAC only (the default)</td><td>1</td><td>0</td><td>0</td></tr>
<tr><td>SLAAC with stateless DHCPv6</td><td>1</td><td>1</td><td>0</td></tr>
<tr><td>Stateful DHCPv6</td><td>0 (recommended)</td><td>–</td><td>1</td></tr></table>`,
        understand: {
          big: 'An IPv6 host always makes its own link-local address; for a global address it follows the RA flags: A = build it yourself, O = ask DHCPv6 for extras, M = ask DHCPv6 for the address.',
          why: 'Every IPv6 addressing method in this module is controlled by these three flags.',
          keys: [
            'Routers: GUA configured manually with ipv6 address.',
            'Hosts create an LLA automatically; no router means no GUA.',
            'The %n after a Windows LLA is the zone (scope) ID.',
            'Router Advertisements suggest the method; the host decides.',
            'A flag: SLAAC. O flag: stateless DHCPv6 for other settings. M flag: stateful DHCPv6 for the address.',
          ],
          traps: [
            { trap: 'Thinking a host needs a router to get a link-local address.', fix: 'The LLA is created automatically when the interface comes up; only the GUA needs the RA.' },
            { trap: 'Mixing up O and M.', fix: 'O = Other information (DNS) only. M = Managed: the address itself comes from DHCPv6.' },
            { trap: 'Believing the router forces the host to obey the RA.', fix: 'The RA only suggests; the host OS makes the final decision.' },
          ],
          analogy: 'The RA is a signpost at the network entrance: A = "build your own house on this street", O = "ask the office for the phone book", M = "the office assigns your house".',
          explain: [
            { q: 'A PC is on a switch with no router. Which IPv6 addresses does it have?', a: 'Only a link-local address; without an RA it learns no prefix, so it has no GUA.' },
            { q: 'What do A=1, O=1, M=0 tell a host?', a: 'Create a GUA with SLAAC, and get other settings such as DNS from a stateless DHCPv6 server.' },
            { q: 'What does fe80::1%11 mean on Windows?', a: 'Link-local address fe80::1 on the interface with zone (scope) ID 11.' },
          ],
          widgets: ['raflags'],
        },
      },
      /* ------------------------------------------------------------------ 8.2 */
      {
        id: '8.2', title: 'SLAAC',
        objective: 'Explain the operation of SLAAC.', slides: '17–23',
        read: `
<h3>SLAAC overview</h3>
<ul>
  <li>Not every network has a DHCPv6 server, but every IPv6 device needs a GUA. <b>Stateless Address Autoconfiguration (SLAAC)</b> lets a host create its own unique GUA without a DHCPv6 server.</li>
  <li><b>Stateless</b>: no server keeps track of which addresses are in use.</li>
  <li>Routers send RAs periodically (every <b>200 seconds</b>) with the prefix and other information; a host can also ask for one with a <b>Router Solicitation (RS)</b>.</li>
  <li>SLAAC can be deployed as <b>SLAAC only</b> or <b>SLAAC with DHCPv6</b>.</li>
</ul>

<h3>Enabling SLAAC</h3>
<p>R1 G0/0/1 has GUA 2001:db8:acad:1::1/64 and LLA fe80::1, and is in the all-nodes group ff02::1. To send RAs, R1 must join the <b>all-routers group ff02::2</b>, which happens with <code>ipv6 unicast-routing</code>:</p>
<pre class="cli">R1(config)# ipv6 unicast-routing
R1(config)# exit
R1# show ipv6 interface G0/0/1 | section Joined
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1</pre>
<p>R1 now sends RAs every 200 seconds to the all-nodes address <b>ff02::1</b>.</p>

<h3>SLAAC-only method</h3>
<p>The default RA has <b>A = 1</b> (use the prefix and create your own interface ID) and <b>O = 0, M = 0</b> (use only the information in the RA: DNS, MTU and default gateway). <code>ipconfig</code> on PC1 shows a GUA built from R1's prefix, and the <b>default gateway is the LLA of R1 G0/0/1</b> (the source address of the RA).</p>

<h3>ICMPv6 RS messages</h3>
<p>A router sends an RA every 200 seconds or when it receives an RS. A host that has just booted sends an RS to the all-routers address <b>ff02::2</b>; the router answers with an RA to the all-nodes address <b>ff02::1</b>, and the host builds its GUA.</p>

<h3>Generating the interface ID</h3>
<p>The host takes the 64-bit prefix from the RA and creates the remaining 64-bit interface ID:</p>
<ul>
  <li><b>Randomly generated</b>: by the operating system; this is what Windows 10 does.</li>
  <li><b>EUI-64</b>: from the 48-bit MAC address with <b>fffe</b> inserted in the middle. Some systems avoid it for privacy, because the MAC address is visible in the IPv6 address.</li>
</ul>
<p>Windows, Linux and macOS let the user choose either method.</p>

<h3>Duplicate Address Detection (DAD)</h3>
<p>To make sure its GUA is unique, a SLAAC host sends an ICMPv6 <b>Neighbor Solicitation (NS)</b> to a specially built <b>solicited-node multicast address</b> that contains the last 24 bits of its address. If no <b>Neighbor Advertisement (NA)</b> comes back, the address is virtually guaranteed to be unique. If an NA arrives, the address is taken and the host must generate a new interface ID.</p>
<div class="note">DAD is not strictly required: a 64-bit interface ID allows about 18 quintillion values. The IETF still recommends it, and most operating systems perform DAD on every unicast address, however it was configured.</div>
<div class="errata"><b>Slide errata (slide 20):</b> "an IPv6 GUS" is a typo for GUA.</div>`,
        understand: {
          big: 'With SLAAC the router only advertises the prefix (RA); the host adds its own interface ID (random or EUI-64), checks it with DAD, and uses the router\'s link-local address as its gateway.',
          why: 'SLAAC is the default IPv6 addressing method on Cisco routers once ipv6 unicast-routing is on.',
          keys: [
            'ipv6 unicast-routing makes the router join ff02::2 and send RAs.',
            'RA every 200 s to ff02::1, or in reply to an RS sent to ff02::2.',
            'Default RA: A=1, O=0, M=0 (SLAAC only).',
            'Interface ID: random (Windows 10) or EUI-64 (MAC + fffe).',
            'DAD: NS to the solicited-node multicast address; an NA reply means duplicate.',
            'The host\'s IPv6 default gateway is the router\'s link-local address.',
          ],
          traps: [
            { trap: 'Expecting RAs without ipv6 unicast-routing.', fix: 'Without it the router is not in the all-routers group and sends no RAs.' },
            { trap: 'Thinking the host\'s gateway is the router\'s GUA.', fix: 'It is the link-local address that sourced the RA.' },
            { trap: 'Saying SLAAC is stateful because the router "assigns" the address.', fix: 'The router only gives the prefix; no device tracks which addresses are used.' },
          ],
          analogy: 'The router announces the street name (prefix); each family picks its own house number (interface ID) and shouts it once to check no one else has it (DAD).',
          explain: [
            { q: 'Which two multicast groups are involved in RS/RA?', a: 'Hosts send RS to ff02::2 (all routers); routers send RA to ff02::1 (all nodes).' },
            { q: 'How does EUI-64 build an interface ID?', a: 'It splits the 48-bit MAC address in half and inserts fffe in the middle (and flips the 7th bit).' },
            { q: 'What happens if a host receives an NA during DAD?', a: 'The address is already in use, so the host generates a new interface ID.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 8.3 */
      {
        id: '8.3', title: 'DHCPv6',
        objective: 'Explain the operation of DHCPv6.', slides: '25–29',
        read: `
<h3>DHCPv6 operation steps</h3>
<p>Stateless DHCPv6 needs SLAAC; stateful DHCPv6 does not. Whenever the RA says to use DHCPv6:</p>
<ol class="steps">
  <li>The host sends an <b>RS</b>.</li>
  <li>The router answers with an <b>RA</b>.</li>
  <li>The host sends a DHCPv6 <b>SOLICIT</b> to find a server.</li>
  <li>The DHCPv6 server responds with an <b>ADVERTISE</b>.</li>
  <li>The host responds to the server (a <b>REQUEST</b>, or an INFORMATION-REQUEST for stateless).</li>
  <li>The server sends a <b>REPLY</b>.</li>
</ol>
<div class="note">Server-to-client DHCPv6 messages use UDP destination port <b>546</b>; client-to-server messages use UDP destination port <b>547</b>.</div>

<h3>Stateless DHCPv6</h3>
<p>The host uses the RA for its address (SLAAC) and asks a DHCPv6 server only for <b>additional information</b> such as DNS. The server keeps no list of bindings, which is why it is "stateless". The RA contains the prefix and prefix length, <b>A = 1</b>, <b>O = 1</b> and M = 0.</p>
<pre class="cli">R1(config-if)# ipv6 nd other-config-flag
R1(config-if)# end
R1# show ipv6 interface g0/0/1 | begin ND
  ND DAD is enabled, number of DAD attempts: 1
  ND reachable time is 30000 milliseconds (using 30000)
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
  Hosts use stateless autoconfig for addresses.
  Hosts use DHCP to obtain other configuration.</pre>
<p><code>no ipv6 nd other-config-flag</code> returns the interface to the default SLAAC-only option (O = 0).</p>

<h3>Stateful DHCPv6</h3>
<p>The host contacts the DHCPv6 server for <b>all</b> its addressing except the default gateway, which is still the link-local source of the RA. The server keeps a list of bindings ("stateful"). The RA sets <b>M = 1</b>.</p>
<pre class="cli">R1(config-if)# ipv6 nd managed-config-flag
R1(config-if)# end
R1# show ipv6 interface g0/0/1 | begin ND
  …
  Hosts use DHCP to obtain routable addresses.</pre>
<div class="errata"><b>Slide errata (slide 28):</b> the slide describes the stateful RA as "A flag set to 0 informing the host to contact a DHCPv6 server" and "O flag set to 0 informing the host to contact a DHCPv6 server". It is the <b>M flag = 1</b> that sends the host to the stateful DHCPv6 server. A = 0 only tells the host not to build its own SLAAC address, and the O flag does not matter when M = 1.</div>`,
        understand: {
          big: 'Stateless DHCPv6 = SLAAC address + DHCPv6 for extras (O flag). Stateful DHCPv6 = the address itself from DHCPv6 (M flag). The gateway always comes from the RA.',
          why: 'You must know which flag to set for each method and what the host gets from where.',
          keys: [
            'Steps: RS, RA, SOLICIT, ADVERTISE, REQUEST (or INFORMATION-REQUEST), REPLY.',
            'UDP 546 = to clients, UDP 547 = to servers.',
            'Stateless: A=1, O=1 (ipv6 nd other-config-flag). Server keeps no bindings.',
            'Stateful: M=1 (ipv6 nd managed-config-flag). Server keeps bindings.',
            'show ipv6 interface shows "Hosts use DHCP to obtain other configuration" or "…routable addresses".',
            'The default gateway is always learned from the RA (router\'s LLA), never from DHCPv6.',
          ],
          traps: [
            { trap: 'Expecting DHCPv6 to give the default gateway.', fix: 'DHCPv6 has no default-gateway option; hosts use the link-local source of the RA.' },
            { trap: 'Swapping 546 and 547.', fix: 'Clients listen on 546; servers listen on 547.' },
            { trap: 'Setting other-config-flag for stateful DHCPv6.', fix: 'Stateful needs managed-config-flag (M). other-config-flag (O) is for stateless.' },
          ],
          analogy: 'Stateless: you build your own house (SLAAC) and only ask the town hall for the bus timetable (DNS). Stateful: the town hall assigns your house and keeps a register of who lives where.',
          explain: [
            { q: 'Why is stateless DHCPv6 called stateless?', a: 'The server only hands out settings such as DNS and keeps no record of which host uses which address.' },
            { q: 'Which interface command turns on the M flag?', a: 'ipv6 nd managed-config-flag.' },
            { q: 'Where does a stateful DHCPv6 client get its default gateway?', a: 'From the RA: the router\'s link-local address.' },
          ],
          widgets: ['raflags'],
        },
      },
      /* ------------------------------------------------------------------ 8.4 */
      {
        id: '8.4', title: 'Configure DHCPv6 Server',
        objective: 'Configure a stateful and stateless DHCPv6 server.', slides: '31–39',
        read: `
<h3>DHCPv6 router roles</h3>
<ul>
  <li><b>DHCPv6 server</b>: provides stateless or stateful DHCPv6 services.</li>
  <li><b>DHCPv6 client</b>: a router interface acquires its IPv6 configuration from a server.</li>
  <li><b>DHCPv6 relay agent</b>: forwards DHCPv6 between clients and a server on another network.</li>
</ul>

<h3>Stateless DHCPv6 server (five steps)</h3>
<p>The router must advertise the prefix in its RAs (SLAAC):</p>
<ol class="steps">
  <li><code>ipv6 unicast-routing</code></li>
  <li><code>ipv6 dhcp pool <i>POOL-NAME</i></code></li>
  <li>Pool options, for example <code>dns-server <i>X:X:X:X:X:X:X:X</i></code> and <code>domain-name <i>name</i></code>.</li>
  <li>Bind the pool to the interface: <code>ipv6 dhcp server <i>POOL-NAME</i></code>.</li>
  <li>Set the O flag: <code>ipv6 nd other-config-flag</code>. A stays 1, so clients still use SLAAC.</li>
</ol>
<pre class="cli">R1(config)# ipv6 unicast-routing
R1(config)# ipv6 dhcp pool IPV6-STATELESS
R1(config-dhcpv6)# dns-server 2001:db8:acad:1::254
R1(config-dhcpv6)# domain-name example.com
R1(config-dhcpv6)# exit
R1(config)# interface g0/0/1
R1(config-if)# ipv6 dhcp server IPV6-STATELESS
R1(config-if)# ipv6 nd other-config-flag</pre>
<p>Verify the hosts with <code>ipconfig /all</code>.</p>

<h3>Stateless DHCPv6 client (router)</h3>
<ol class="steps"><li><code>ipv6 unicast-routing</code></li>
<li>Create an LLA: it appears when a GUA is configured, or without a GUA with <code>ipv6 enable</code>. IOS uses EUI-64 for the interface ID.</li>
<li>Use SLAAC: <code>ipv6 address autoconfig</code>.</li>
<li>Verify the GUA with <code>show ipv6 interface brief</code>.</li>
<li>Verify the other information (DNS, domain) with <code>show ipv6 dhcp interface g0/0/1</code>.</li></ol>

<h3>Stateful DHCPv6 server (five steps)</h3>
<ol class="steps">
  <li><code>ipv6 unicast-routing</code></li>
  <li><code>ipv6 dhcp pool <i>POOL-NAME</i></code></li>
  <li>Pool options: <code>address prefix <i>prefix/length</i></code>, <code>dns-server</code>, <code>domain-name</code> and more.</li>
  <li>Bind the pool: <code>ipv6 dhcp server <i>POOL-NAME</i></code>.</li>
  <li>Set the M flag with <code>ipv6 nd managed-config-flag</code>, and clear the A flag with <code>ipv6 nd prefix default no-autoconfig</code> so clients do not also build a SLAAC address.</li>
</ol>
<pre class="cli">R1(config)# ipv6 dhcp pool IPV6-STATEFUL
R1(config-dhcpv6)# address prefix 2001:db8:acad:1::/64
R1(config-dhcpv6)# dns-server 2001:4860:4860::8888
R1(config-dhcpv6)# domain-name example.com
R1(config-dhcpv6)# exit
R1(config)# interface g0/0/1
R1(config-if)# ipv6 dhcp server IPV6-STATEFUL
R1(config-if)# ipv6 nd managed-config-flag
R1(config-if)# ipv6 nd prefix default no-autoconfig</pre>

<h3>Stateful DHCPv6 client (router)</h3>
<p><code>ipv6 unicast-routing</code>, an LLA (<code>ipv6 enable</code>), then <code>ipv6 address dhcp</code> on the interface. Verify with <code>show ipv6 interface brief</code> and <code>show ipv6 dhcp interface g0/0/1</code>.</p>
<div class="errata"><b>Slide errata (slide 35):</b> the slide headed "Configure a Stateful DHCPv6 Client" says "five steps to configure and verify a router as a <b>stateless</b> DHCPv6 client". It means stateful (the step uses <code>ipv6 address dhcp</code>). Slide 34 also has a typo, "DHS server", for DNS server.</div>

<h3>Verification</h3>
<pre class="cli">R1# show ipv6 dhcp pool
DHCPv6 pool: IPV6-STATEFUL
  Address allocation prefix: 2001:DB8:ACAD:1::/64 valid 172800 preferred 86400 (2 in use, 0 conflicts)
  DNS server: 2001:4860:4860::8888
  Domain name: example.com
  Active clients: 2</pre>
<p><code>show ipv6 dhcp binding</code> shows each client's link-local address and the GUA the server assigned. Only a stateful server keeps this; a stateless server has no bindings.</p>

<h3>DHCPv6 relay agent</h3>
<p>If the server is on another network, configure the router interface that faces the clients as a relay:</p>
<pre class="cli">R1(config)# interface gigabitethernet 0/0/1
R1(config-if)# ipv6 dhcp relay destination 2001:db8:acad:1::2 G0/0/0</pre>
<p><code>ipv6 dhcp relay destination <i>ipv6-address</i> [<i>interface-type interface-number</i>]</code>. The egress interface is only required when the next-hop address is a link-local address. Verify with <code>show ipv6 dhcp interface</code> and <code>show ipv6 dhcp binding</code>, and check the hosts with <code>ipconfig /all</code>.</p>`,
        understand: {
          big: 'Both servers use the same recipe (unicast-routing, pool, options, bind with ipv6 dhcp server); the interface flag decides the method: other-config-flag for stateless, managed-config-flag (plus no-autoconfig) for stateful.',
          why: 'You configure and verify DHCPv6 servers, clients and relays in the labs and the skills exam.',
          keys: [
            'Server steps: ipv6 unicast-routing → ipv6 dhcp pool NAME → options → ipv6 dhcp server NAME on the interface → flag.',
            'Stateless flag: ipv6 nd other-config-flag. Stateful: ipv6 nd managed-config-flag + ipv6 nd prefix default no-autoconfig.',
            'Stateful pools need address prefix X/64; stateless pools only need options such as dns-server.',
            'Router as client: ipv6 enable, then ipv6 address autoconfig (stateless) or ipv6 address dhcp (stateful).',
            'Verify: show ipv6 dhcp pool, show ipv6 dhcp binding (stateful only), show ipv6 dhcp interface.',
            'Relay: ipv6 dhcp relay destination SERVER [exit-intf] on the client-facing interface.',
          ],
          traps: [
            { trap: 'Forgetting ipv6 dhcp server POOL on the interface.', fix: 'Creating the pool is not enough; bind it to the interface that faces the clients.' },
            { trap: 'Leaving A=1 on a stateful network and wondering why hosts have two GUAs.', fix: 'ipv6 nd prefix default no-autoconfig clears the A flag.' },
            { trap: 'Expecting bindings on a stateless server.', fix: 'Only a stateful server keeps bindings.' },
          ],
          analogy: 'The pool is the menu, ipv6 dhcp server puts the menu in one restaurant (interface), and the flag on the door tells guests whether to order only drinks (O) or the whole meal (M).',
          explain: [
            { q: 'List the five steps for a stateless DHCPv6 server.', a: 'ipv6 unicast-routing, ipv6 dhcp pool, pool options (dns-server, domain-name), ipv6 dhcp server on the interface, ipv6 nd other-config-flag.' },
            { q: 'When must ipv6 dhcp relay destination include an interface?', a: 'When the destination (next hop) is a link-local address.' },
            { q: 'How do you make a router interface a stateful DHCPv6 client?', a: 'ipv6 unicast-routing, ipv6 enable for an LLA, then ipv6 address dhcp on the interface.' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
