/* Module 7 — DHCPv4 (SRWE v7, slides in SRWE_Module_7.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm7', num: 7, title: 'DHCPv4',
    objective: 'Implement DHCPv4 to operate across multiple LANs.',
    deck: 'SRWE_Module_7.pptx',
    topics: [
      /* ------------------------------------------------------------------ 7.1 */
      {
        id: '7.1', title: 'DHCPv4 Concepts',
        objective: 'Explain how DHCPv4 operates in a small- to medium-sized business network.', slides: '12–15',
        read: `
<h3>DHCPv4 server and client</h3>
<ul>
  <li>The <b>Dynamic Host Configuration Protocol for IPv4 (DHCPv4)</b> assigns IPv4 addresses and other settings dynamically. Desktop clients are most of the nodes, so this saves administrators a lot of time.</li>
  <li>A dedicated DHCPv4 server is scalable and easy to manage. In a small branch or SOHO, a <b>Cisco router</b> can be the DHCPv4 server instead; Cisco IOS includes a full-featured, optional DHCPv4 server.</li>
  <li>The server <b>leases</b> an address from a <b>pool</b> for a period it chooses, or until the client no longer needs it. Leases are typically 24 hours to a week or more.</li>
  <li>When a lease expires the client must ask again; it is usually given the same address.</li>
</ul>

<h3>DHCPv4 operation</h3>
<p>Client/server: the client uses the leased address until the lease expires and must contact the server periodically to extend it. Because of this, clients that move or power off do not keep addresses they no longer need: expired addresses go back to the pool.</p>

<h3>Steps to obtain a lease (DORA)</h3>
<ol class="steps">
  <li><b>DHCPDISCOVER</b>: the client broadcasts to find a server.</li>
  <li><b>DHCPOFFER</b>: a server offers an address and settings.</li>
  <li><b>DHCPREQUEST</b>: the client requests the offered address (broadcast, so other servers know their offers were declined).</li>
  <li><b>DHCPACK</b>: the server acknowledges and the lease starts.</li>
</ol>

<h3>Steps to renew a lease</h3>
<ol class="steps">
  <li><b>DHCPREQUEST</b>: before expiry, the client sends a request <b>directly</b> to the server that gave the lease. If no ACK comes back in time, it <b>broadcasts</b> another DHCPREQUEST so another server can extend the lease.</li>
  <li><b>DHCPACK</b>: the server verifies the lease and acknowledges.</li>
</ol>
<div class="note">By RFC 2131, DHCPOFFER and DHCPACK may be sent as unicast or broadcast. DHCPv4 uses UDP: the server listens on port <b>67</b>, the client on port <b>68</b>.</div>`,
        understand: {
          big: 'A DHCPv4 server leases addresses from a pool: Discover, Offer, Request, Acknowledge to get one; Request, Acknowledge to renew it.',
          why: 'Every client network depends on DHCP, and the DORA order and the renewal steps are standard exam questions.',
          keys: [
            'Lease: an address from a pool for a limited time, then it returns to the pool.',
            'Obtain: DHCPDISCOVER → DHCPOFFER → DHCPREQUEST → DHCPACK (DORA).',
            'Renew: DHCPREQUEST (unicast to the original server) → DHCPACK. If no answer, broadcast DHCPREQUEST.',
            'A Cisco router can be the DHCPv4 server for a small branch or SOHO.',
            'UDP 67 = server, UDP 68 = client.',
          ],
          traps: [
            { trap: 'Saying renewal repeats all four DORA messages.', fix: 'Renewal is two messages: DHCPREQUEST and DHCPACK.' },
            { trap: 'Thinking the Discover is sent to the server\'s IP address.', fix: 'The client has no address and does not know the server, so it broadcasts.' },
            { trap: 'Thinking a lease lasts forever once given.', fix: 'Leases expire; the client must renew or the address goes back to the pool.' },
          ],
          analogy: 'Renting a car: you ask at every counter (Discover), one counter offers a car (Offer), you say "that one please" (Request), and they hand you the keys (Ack). Before the rental ends you phone the same counter to extend.',
          explain: [
            { q: 'Why is DHCPDISCOVER a broadcast?', a: 'The client has no IP address yet and does not know where a DHCP server is.' },
            { q: 'What happens when a client\'s renewal request gets no reply?', a: 'It broadcasts another DHCPREQUEST so any other DHCP server can extend the lease.' },
            { q: 'Why do leases help when laptops move between networks?', a: 'Addresses a client no longer uses expire and return to the pool instead of being held forever.' },
          ],
          widgets: ['dora'],
        },
      },
      /* ------------------------------------------------------------------ 7.2 */
      {
        id: '7.2', title: 'Configure a Cisco IOS DHCPv4 Server',
        objective: 'Configure a router as a DHCPv4 server.', slides: '17–30',
        read: `
<h3>Three steps to configure the server</h3>
<ol class="steps">
  <li><b>Exclude addresses</b> that are assigned manually (routers, servers, printers): <code>ip dhcp excluded-address low-address [high-address]</code>. Enter it several times for several ranges.</li>
  <li><b>Define a pool</b>: <code>ip dhcp pool <i>pool-name</i></code> enters DHCP configuration mode, <code>Router(dhcp-config)#</code>.</li>
  <li><b>Configure the pool</b>: the address range and the default gateway are required; the rest is optional.</li>
</ol>
<table class="t"><tr><th>Task</th><th>Command</th></tr>
<tr><td>Define the address pool</td><td><code>network <i>network-number</i> [<i>mask</i> | /<i>prefix-length</i>]</code></td></tr>
<tr><td>Default router (gateway)</td><td><code>default-router <i>address</i> [<i>address2 … address8</i>]</code></td></tr>
<tr><td>DNS server</td><td><code>dns-server <i>address</i> [<i>address2 … address8</i>]</code></td></tr>
<tr><td>Domain name</td><td><code>domain-name <i>domain</i></code></td></tr>
<tr><td>Lease duration</td><td><code>lease {<i>days</i> [<i>hours</i> [<i>minutes</i>]] | infinite}</code></td></tr>
<tr><td>NetBIOS WINS server</td><td><code>netbios-name-server <i>address</i> …</code></td></tr></table>

<h3>Configuration example</h3>
<pre class="cli">R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.9
R1(config)# ip dhcp excluded-address 192.168.10.254
R1(config)# ip dhcp pool LAN-POOL-1
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# dns-server 192.168.11.5
R1(dhcp-config)# domain-name example.com
R1(dhcp-config)# end</pre>

<h3>Verification</h3>
<table class="t"><tr><th>Command</th><th>Shows</th></tr>
<tr><td><code>show running-config | section dhcp</code></td><td>Only the DHCPv4 configuration.</td></tr>
<tr><td><code>show ip dhcp binding</code></td><td>Every IPv4-to-MAC binding the service has leased.</td></tr>
<tr><td><code>show ip dhcp server statistics</code></td><td>Counts of DHCP messages sent and received.</td></tr></table>
<pre class="cli">R1# show ip dhcp binding
IP address       Client-ID/              Lease expiration        Type      State
                 Hardware address
192.168.10.10    0100.5056.b3ed.d8       Sep 15 2019 8:42 AM     Automatic Active</pre>
<p>On the client, <code>ipconfig /all</code> shows the DNS suffix, IPv4 address, mask, gateway, DHCP server and DNS server it received. No DHCP-specific configuration is needed on the router interface: a PC on 192.168.10.0/24 gets an address from the pool whose network matches.</p>

<h3>Disable the DHCPv4 server</h3>
<p>The service is <b>enabled by default</b>. <code>no service dhcp</code> disables it and <code>service dhcp</code> re-enables it (which has no effect without pools).</p>
<div class="note">Clearing DHCP bindings or restarting the service may temporarily cause duplicate IP addresses on the network.</div>

<h3>DHCPv4 relay</h3>
<p>Enterprise DHCP, DNS, TFTP and FTP servers usually sit in a central location, not on the clients' subnet, and clients find them with broadcasts. Routers do not forward broadcasts, so a client on another subnet gets no address. Configure the router interface that <b>receives</b> the client broadcasts as a <b>relay agent</b>:</p>
<pre class="cli">R1(config)# interface g0/0/0
R1(config-if)# ip helper-address 192.168.11.6
R1(config-if)# end</pre>
<p>R1 accepts the broadcast and forwards it as a <b>unicast</b> to 192.168.11.6. Verify with <code>show ip interface</code> ("Helper address is 192.168.11.6").</p>
<p>By default <code>ip helper-address</code> forwards eight UDP services:</p>
<table class="t"><tr><th>Port</th><th>Service</th><th>Port</th><th>Service</th></tr>
<tr><td>37</td><td>Time</td><td>68</td><td>DHCP/BOOTP client</td></tr>
<tr><td>49</td><td>TACACS</td><td>69</td><td>TFTP</td></tr>
<tr><td>53</td><td>DNS</td><td>137</td><td>NetBIOS name service</td></tr>
<tr><td>67</td><td>DHCP/BOOTP server</td><td>138</td><td>NetBIOS datagram service</td></tr></table>`,
        understand: {
          big: 'Exclude the static addresses, create a pool with a network and a default router, and add ip helper-address on remote router interfaces that must relay DHCP broadcasts.',
          why: 'Configuring and verifying an IOS DHCP server and a relay is a core skill for the labs and the skills exam.',
          keys: [
            'ip dhcp excluded-address low [high], repeated as needed, before clients ask.',
            'ip dhcp pool NAME → network, default-router (required); dns-server, domain-name, lease (optional).',
            'show running-config | section dhcp, show ip dhcp binding, show ip dhcp server statistics.',
            'The service is on by default; no service dhcp turns it off.',
            'ip helper-address on the interface facing the clients relays broadcasts as unicasts.',
            'Helper forwards 8 UDP services: 37, 49, 53, 67, 68, 69, 137, 138.',
          ],
          traps: [
            { trap: 'Forgetting to exclude the router\'s own address.', fix: 'Exclude every statically assigned address, including the gateway.' },
            { trap: 'Putting ip helper-address on the interface that faces the DHCP server.', fix: 'Configure it on the interface that receives the client broadcasts.' },
            { trap: 'Thinking the pool must be bound to an interface.', fix: 'IOS picks the pool whose network matches the interface (or relay address) the request arrived on.' },
          ],
          analogy: 'The excluded addresses are reserved seats; the pool is the remaining seats; the helper address is a receptionist who takes a shout from the lobby and phones it through to the booking office in another building.',
          explain: [
            { q: 'Why does a PC on a remote subnet get no address without a relay?', a: 'Its DHCPDISCOVER is a broadcast, and routers do not forward broadcasts.' },
            { q: 'Which two pool commands are required for clients to work?', a: 'network (the address range) and default-router (the gateway).' },
            { q: 'How do you check which client got which address?', a: 'show ip dhcp binding lists the IPv4 address to MAC bindings.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 7.3 */
      {
        id: '7.3', title: 'Configure a DHCPv4 Client',
        objective: 'Configure a router as a DHCPv4 client.', slides: '32–34',
        read: `
<h3>A Cisco router as a DHCPv4 client</h3>
<p>Sometimes the ISP provides addresses by DHCP. SOHO and branch routers then act as DHCPv4 clients, much like a PC. In the simplest case the router's Ethernet interface connects to a cable or DSL modem.</p>
<pre class="cli">SOHO(config)# interface G0/0/1
SOHO(config-if)# ip address dhcp
SOHO(config-if)# no shutdown
Sep 12 10:01:25.773: %DHCP-6-ADDRESS_ASSIGN: Interface GigabitEthernet0/0/1 assigned DHCP address
209.165.201.12, mask 255.255.255.224, hostname SOHO</pre>
<p>Here the ISP hands out addresses from 209.165.201.0/27. <code>show ip interface g0/0/1</code> confirms the interface is up and that the address was allocated by a DHCPv4 server; <code>show ip interface brief</code> shows the method <b>DHCP</b>.</p>
<div class="errata"><b>Slide errata (slide 33):</b> the text verifies with <code>show ip interface g0/1</code>, but the interface configured is G0/0/1.</div>

<h3>Home router as a DHCPv4 client</h3>
<p>Home routers are usually preconfigured to get their WAN address automatically, so customers can set them up easily. On the Packet Tracer wireless router, the Internet connection type defaults to <b>Automatic Configuration - DHCP</b>: the router asks the ISP (via the cable or DSL modem) for an IPv4 address. Other vendors have similar settings.</p>`,
        understand: {
          big: 'ip address dhcp turns a router interface into a DHCPv4 client, the way a home router gets its WAN address from the ISP.',
          why: 'Branch and SOHO routers often get their public address from the ISP by DHCP.',
          keys: [
            'Interface command: ip address dhcp (plus no shutdown).',
            'A %DHCP-6-ADDRESS_ASSIGN message shows the address and mask received.',
            'Verify with show ip interface (allocated by DHCP) or show ip interface brief (method DHCP).',
            'Home routers default to Automatic Configuration - DHCP on the Internet port.',
          ],
          traps: [
            { trap: 'Configuring ip dhcp pool on the router to get its own address.', fix: 'A pool makes the router a server. A client interface only needs ip address dhcp.' },
            { trap: 'Expecting the address to appear while the interface is shut down.', fix: 'Router interfaces are shut down by default; add no shutdown.' },
          ],
          analogy: 'The router stops being the landlord (server) and becomes a tenant asking the ISP for a flat.',
          explain: [
            { q: 'Which command makes G0/0/1 get its IPv4 address from the ISP?', a: 'ip address dhcp in interface configuration mode, with no shutdown.' },
            { q: 'How can you see that an address came from DHCP?', a: 'show ip interface brief lists DHCP in the Method column; show ip interface says the address was allocated by DHCP.' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
