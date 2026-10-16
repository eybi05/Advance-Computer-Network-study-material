/* Module 10 — LAN Security Concepts (SRWE v7, slides in SRWE_Module_10.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm10', num: 10, title: 'LAN Security Concepts',
    objective: 'Explain how vulnerabilities compromise LAN security.',
    deck: 'SRWE_Module_10.pptx',
    topics: [
      /* ------------------------------------------------------------------ 10.1 */
      {
        id: '10.1', title: 'Endpoint Security',
        objective: 'Explain how to use endpoint security to mitigate attacks.', slides: '12–16',
        read: `
<h3>Network attacks today</h3>
<ul>
  <li><b>Distributed Denial of Service (DDoS)</b>: a coordinated attack from many devices, called <b>zombies</b>, to degrade or halt public access to an organization's website and resources.</li>
  <li><b>Data breach</b>: an organization's data servers or hosts are compromised to steal confidential information.</li>
  <li><b>Malware</b>: hosts are infected with malicious software. Ransomware such as <b>WannaCry</b> encrypts a host's data and locks it until a ransom is paid.</li>
</ul>

<h3>Network security devices</h3>
<table class="t"><tr><th>Device</th><th>Role</th></tr>
<tr><td><b>VPN-enabled router</b></td><td>Secure connection for remote users across a public network into the enterprise network. VPN services can be integrated into the firewall.</td></tr>
<tr><td><b>Next-Generation Firewall (NGFW)</b></td><td>Stateful packet inspection, application visibility and control, a next-generation IPS (<b>NGIPS</b>), advanced malware protection (<b>AMP</b>) and URL filtering.</td></tr>
<tr><td><b>Network Access Control (NAC)</b></td><td>Authentication, authorization and accounting (AAA) services; in large enterprises an appliance that manages access policies for many users and device types. Example: <b>Cisco Identity Services Engine (ISE)</b>.</td></tr></table>

<h3>Endpoint protection</h3>
<p>Endpoints are laptops, desktops, servers, IP phones and employee-owned devices (BYOD). They are especially exposed to malware that arrives through <b>email or web browsing</b>. Traditional host-based protection: <b>antivirus/antimalware</b>, <b>host-based firewalls</b> and <b>host-based intrusion prevention systems (HIPSs)</b>. Today endpoints are best protected by a combination of <b>NAC</b>, <b>AMP software</b>, an <b>email security appliance (ESA)</b> and a <b>web security appliance (WSA)</b>.</p>

<h3>Cisco Email Security Appliance (ESA)</h3>
<p>Monitors <b>SMTP</b>. It is updated by real-time feeds from <b>Cisco Talos</b>, which detects and correlates threats using a worldwide monitoring database; the ESA pulls this threat intelligence every <b>three to five minutes</b>. Functions:</p>
<ul><li>Block known threats.</li><li>Remediate against stealth malware that evaded initial detection.</li><li>Discard emails with bad links.</li><li>Block access to newly infected sites.</li><li>Encrypt content in outgoing email to prevent data loss.</li></ul>

<h3>Cisco Web Security Appliance (WSA)</h3>
<p>Mitigates <b>web-based threats</b> and controls web traffic. It combines advanced malware protection, application visibility and control, acceptable use policy controls and reporting. Features such as chat, messaging, video and audio can be allowed, limited by time and bandwidth, or blocked. It performs URL blacklisting, URL filtering, malware scanning, URL categorization, web application filtering, and encryption and decryption of web traffic.</p>`,
        understand: {
          big: 'Endpoints are the easiest way in, mostly through email and the web, so they are protected by NAC, AMP, the ESA (email) and the WSA (web) on top of host antivirus, firewalls and HIPS.',
          why: 'You need to recognise which security device or appliance addresses which threat.',
          keys: [
            'Common attacks: DDoS (zombies), data breach, malware (e.g. WannaCry ransomware).',
            'VPN router, NGFW (NGIPS, AMP, URL filtering), NAC (AAA, e.g. Cisco ISE).',
            'Endpoints: laptops, desktops, servers, IP phones, BYOD devices.',
            'Host-based: antivirus/antimalware, host firewall, HIPS.',
            'ESA: SMTP / email, Talos threat feeds every 3–5 minutes.',
            'WSA: web traffic: URL filtering and categorisation, malware scanning, application control.',
          ],
          traps: [
            { trap: 'Assigning email filtering to the WSA.', fix: 'ESA = email (SMTP). WSA = web.' },
            { trap: 'Thinking NAC is a firewall.', fix: 'NAC provides AAA and access policies (Cisco ISE); the NGFW filters traffic.' },
          ],
          analogy: 'Endpoint protection is building security: the ESA screens the post room, the WSA screens deliveries from the web, NAC checks badges at the door, and antivirus is the alarm inside each office.',
          explain: [
            { q: 'Which appliance stops a phishing email with a malicious link?', a: 'The Cisco ESA, which monitors SMTP and discards emails with bad links.' },
            { q: 'What does an NGFW add to a traditional stateful firewall?', a: 'Application visibility and control, an NGIPS, advanced malware protection and URL filtering.' },
            { q: 'What is a DDoS attack?', a: 'A coordinated attack from many compromised devices (zombies) to degrade or halt access to an organization\'s resources.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 10.2 */
      {
        id: '10.2', title: 'Access Control',
        objective: 'Explain how AAA and 802.1X are used to authenticate LAN endpoints and devices.', slides: '18–23',
        read: `
<h3>Authentication with a local password</h3>
<p>The simplest remote-access authentication is a login and password on the console, vty and aux lines:</p>
<pre class="cli">R1(config)# line vty 0 4
R1(config-line)# password ci5c0
R1(config-line)# login
R1(config-line)# transport input telnet</pre>
<p><b>SSH</b> is more secure: it needs a username and a password, which can be checked against a <b>local</b> database:</p>
<pre class="cli">R1(config)# ip domain-name example.com
R1(config)# crypto key generate rsa general-keys modulus 2048
R1(config)# username Admin secret Str0ng3rPa55w0rd
R1(config)# ssh version 2
R1(config)# line vty 0 4
R1(config-line)# transport input ssh
R1(config-line)# login local</pre>
<p>Limits of the local database: accounts must be configured on <b>every device</b> (not scalable), and there is <b>no fallback</b> authentication method.</p>

<h3>AAA components</h3>
<p><b>Authentication, Authorization and Accounting (AAA)</b> is the framework for access control on network devices: who may access (authenticate), what they may do (authorize), and what they did (accounting).</p>
<div class="cols">
  <div><h4>Authentication</h4>
  <p><b>Local AAA</b>: usernames and passwords are stored on the device; ideal for small networks.</p>
  <p><b>Server-based AAA</b>: the device asks a central AAA server, which holds all users and passwords. The device uses <b>RADIUS</b> or <b>TACACS+</b>. Better when there are many routers and switches.</p></div>
  <div><h4>Authorization and accounting</h4>
  <p><b>Authorization</b> is automatic after authentication; it uses a set of attributes to decide what the user can and cannot do.</p>
  <p><b>Accounting</b> collects and reports usage data for auditing or billing: start and stop times, executed commands, numbers of packets and bytes. Combined with authentication, the AAA server logs every EXEC and configuration command a user entered, with the username, date and time.</p></div>
</div>

<h3>802.1X</h3>
<p>IEEE 802.1X is a <b>port-based</b> access control and authentication protocol. It stops unauthorized workstations from using publicly accessible switch ports: each workstation is authenticated before the switch or LAN offers any service. Roles:</p>
<table class="t"><tr><th>Role</th><th>Description</th></tr>
<tr><td><b>Client (supplicant)</b></td><td>A device running 802.1X-compliant client software (wired or wireless).</td></tr>
<tr><td><b>Switch (authenticator)</b></td><td>The intermediary: asks the client for identity information, verifies it with the authentication server and relays the result. A wireless AP can also be the authenticator.</td></tr>
<tr><td><b>Authentication server</b></td><td>Validates the client's identity and tells the switch or AP whether the client may access the LAN.</td></tr></table>`,
        understand: {
          big: 'AAA controls who gets in (authentication), what they can do (authorization) and records what they did (accounting); 802.1X applies authentication to each switch port with a supplicant, an authenticator and an authentication server.',
          why: 'Securing device access and port access is the first line of LAN security, and the AAA/802.1X roles are standard exam questions.',
          keys: [
            'Line passwords are the simplest method; SSH with login local is better.',
            'Local database: not scalable, no fallback.',
            'AAA: Authentication, Authorization, Accounting.',
            'Local AAA for small networks; server-based AAA with RADIUS or TACACS+ for many devices.',
            'Accounting can log every command a user typed.',
            '802.1X roles: supplicant (client), authenticator (switch/AP), authentication server.',
          ],
          traps: [
            { trap: 'Mixing up authorization and accounting.', fix: 'Authorization = what you may do. Accounting = record of what you did.' },
            { trap: 'Calling the switch the authentication server in 802.1X.', fix: 'The switch is the authenticator; it relays to a separate authentication server.' },
            { trap: 'Thinking local AAA scales well.', fix: 'Accounts must be configured on every device; use a central AAA server for many devices.' },
          ],
          analogy: 'A hotel: the receptionist checks your ID (authentication), your key card opens only your floor (authorization), and the door log records when you came and went (accounting). With 802.1X, the switch port is the door and the receptionist checks with head office before opening it.',
          explain: [
            { q: 'Name the three AAA components and what each answers.', a: 'Authentication: who are you? Authorization: what may you do? Accounting: what did you do?' },
            { q: 'Why is server-based AAA better than local accounts for 50 switches?', a: 'Users are managed once on the AAA server instead of on every device, and changes apply everywhere.' },
            { q: 'Which device is the authenticator in wired 802.1X?', a: 'The switch.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 10.3 */
      {
        id: '10.3', title: 'Layer 2 Security Threats',
        objective: 'Identify Layer 2 vulnerabilities.', slides: '25–27',
        read: `
<h3>Layer 2 vulnerabilities</h3>
<p>The OSI layers work independently. Administrators protect Layers 3 to 7 with VPNs, firewalls and IPS devices, but <b>if Layer 2 is compromised, every layer above it is affected</b>. A threat actor with access to the internal network who captures Layer 2 frames makes upper-layer security useless.</p>
<p>Security is only as strong as the weakest link, and Layer 2 is considered that weak link. LANs used to be under one organization's control and everything on them was trusted; with BYOD and more sophisticated attacks, LANs are now much more vulnerable.</p>

<h3>Switch attack categories</h3>
<table class="t"><tr><th>Category</th><th>Examples</th></tr>
<tr><td>MAC table attacks</td><td>MAC address flooding.</td></tr>
<tr><td>VLAN attacks</td><td>VLAN hopping and VLAN double-tagging; attacks between devices on a common VLAN.</td></tr>
<tr><td>DHCP attacks</td><td>DHCP starvation and DHCP spoofing.</td></tr>
<tr><td>ARP attacks</td><td>ARP spoofing and ARP poisoning.</td></tr>
<tr><td>Address spoofing attacks</td><td>MAC address and IP address spoofing.</td></tr>
<tr><td>STP attacks</td><td>Spanning Tree Protocol manipulation.</td></tr></table>

<h3>Switch attack mitigation techniques</h3>
<table class="t"><tr><th>Solution</th><th>Prevents</th></tr>
<tr><td><b>Port security</b></td><td>Many attacks, including MAC address flooding and DHCP starvation.</td></tr>
<tr><td><b>DHCP snooping</b></td><td>DHCP starvation and DHCP spoofing.</td></tr>
<tr><td><b>Dynamic ARP Inspection (DAI)</b></td><td>ARP spoofing and ARP poisoning.</td></tr>
<tr><td><b>IP Source Guard (IPSG)</b></td><td>MAC and IP address spoofing.</td></tr></table>
<p>These Layer 2 solutions do not help if the <b>management protocols</b> are not secure:</p>
<ul>
  <li>Always use secure variants: <b>SSH, SCP, SFTP, SSL/TLS</b>.</li>
  <li>Consider an <b>out-of-band</b> management network.</li>
  <li>Use a dedicated <b>management VLAN</b> that carries nothing but management traffic.</li>
  <li>Use <b>ACLs</b> to filter unwanted access.</li>
</ul>`,
        understand: {
          big: 'Layer 2 is the weak link: if it is compromised, every layer above it is too. Each attack category has a matching switch feature: port security, DHCP snooping, DAI and IPSG.',
          why: 'Matching attacks to mitigations is one of the most frequent exam question types in modules 10 and 11.',
          keys: [
            'Compromised Layer 2 = all upper-layer security is useless.',
            'Categories: MAC table, VLAN, DHCP, ARP, address spoofing, STP attacks.',
            'Port security: MAC flooding, DHCP starvation.',
            'DHCP snooping: DHCP starvation and spoofing. DAI: ARP spoofing and poisoning. IPSG: MAC/IP spoofing.',
            'Secure management: SSH/SCP/SFTP/TLS, out-of-band management, a management VLAN, ACLs.',
          ],
          traps: [
            { trap: 'Matching DAI to DHCP attacks.', fix: 'DAI stops ARP attacks; DHCP snooping stops DHCP attacks (DAI depends on snooping\'s table).' },
            { trap: 'Assuming firewalls and VPNs protect the LAN at Layer 2.', fix: 'They work at Layer 3 and above; Layer 2 attacks happen inside the LAN.' },
          ],
          analogy: 'A bank with an armoured front door (firewall) but unlocked internal corridors (Layer 2): once inside, an intruder walks anywhere.',
          explain: [
            { q: 'Why can a Layer 2 compromise defeat a firewall and a VPN?', a: 'An attacker inside the LAN can capture or redirect frames before upper-layer protections apply.' },
            { q: 'Which feature mitigates ARP poisoning?', a: 'Dynamic ARP Inspection (DAI).' },
            { q: 'Name two ways to secure management access.', a: 'Any two of: SSH/SCP/SFTP/TLS, out-of-band management, a dedicated management VLAN, ACLs.' },
          ],
          widgets: ['l2mitigate'],
        },
      },
      /* ------------------------------------------------------------------ 10.4 */
      {
        id: '10.4', title: 'MAC Address Table Attack',
        objective: 'Explain how a MAC address table attack compromises LAN security.', slides: '29–31',
        read: `
<h3>Switch operation review</h3>
<p>A switch builds its MAC address table from the <b>source</b> MAC addresses of received frames and uses it to forward frames efficiently. The table is held in memory.</p>

<h3>MAC address table flooding</h3>
<ul>
  <li>Every MAC table has a <b>fixed size</b>. A MAC flooding attack bombards the switch with <b>fake source MAC addresses</b> until the table is full.</li>
  <li>The switch then treats frames as <b>unknown unicast</b> and floods incoming traffic out all ports <b>in the same VLAN</b>, without using the table.</li>
  <li>The threat actor can now capture frames sent between other hosts on the local LAN or VLAN.</li>
</ul>
<div class="note">Traffic is flooded only within the local LAN or VLAN, so the attacker only sees traffic in the VLAN it is connected to.</div>

<h3>Mitigation</h3>
<ul>
  <li>Tools such as <b>macof</b> make this fast: a Catalyst 6500 holds 132,000 MAC addresses, and macof can send up to <b>8,000 bogus frames per second</b>, filling the table within seconds.</li>
  <li>The attack also affects <b>other connected switches</b>: a full switch floods out every port, including links to other Layer 2 switches.</li>
  <li>Mitigate it with <b>port security</b>, which allows only a specified number of source MAC addresses on a port (module 11).</li>
</ul>`,
        understand: {
          big: 'Fill the MAC table with fake source addresses and the switch falls back to flooding, turning it into a hub inside that VLAN; port security limits how many MACs a port may learn.',
          why: 'MAC flooding is the textbook Layer 2 attack and the reason port security exists.',
          keys: [
            'MAC tables have a fixed size.',
            'Flooding attack: many fake source MACs → full table → frames flooded like unknown unicasts.',
            'Only traffic in the attacker\'s own VLAN is exposed.',
            'macof: up to 8,000 bogus frames per second; neighbouring switches are affected too.',
            'Mitigation: port security.',
          ],
          traps: [
            { trap: 'Thinking MAC flooding exposes traffic of every VLAN.', fix: 'Flooding stays within the attacker\'s VLAN.' },
            { trap: 'Thinking only the attacked switch is affected.', fix: 'Its flooding reaches other switches, which can also fill their tables.' },
          ],
          analogy: 'A receptionist\'s guest book with limited pages: an attacker fills it with fake names, and the receptionist starts shouting every message across the whole floor.',
          explain: [
            { q: 'What does a switch do when its MAC table is full?', a: 'It cannot learn new addresses, so it floods frames out all ports in the VLAN as unknown unicasts.' },
            { q: 'Which switch feature stops MAC flooding?', a: 'Port security, which limits the number of MAC addresses learned per port.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 10.5 */
      {
        id: '10.5', title: 'LAN Attacks',
        objective: 'Explain how LAN attacks compromise LAN security.', slides: '33–43',
        read: `
<h3>VLAN hopping</h3>
<p>Traffic from one VLAN is seen by another VLAN <b>without a router</b>. The threat actor makes a host behave like a switch: it spoofs 802.1Q and <b>DTP</b> signalling to bring up a trunk with a port in the default <b>dynamic</b> trunking mode. With a trunk, it can send and receive traffic in any VLAN.</p>

<h3>VLAN double-tagging</h3>
<ol class="steps">
  <li>The attacker sends a frame with <b>two 802.1Q tags</b>. The outer tag is the attacker's VLAN, which is the <b>native VLAN</b> of the trunk.</li>
  <li>The first switch reads only the outer tag, sees the native VLAN, strips the tag and forwards the frame out its native VLAN ports, including the trunk, <b>untagged</b>. The inner tag is untouched.</li>
  <li>The second switch sees the inner tag (the target VLAN) and forwards or floods the frame into that VLAN.</li>
</ol>
<p>The attack is <b>unidirectional</b> and works only when the attacker is on a port in the <b>same VLAN as the trunk's native VLAN</b>. It lets traffic reach hosts that access controls would otherwise block.</p>
<p><b>Mitigation:</b> disable trunking on all access ports; disable auto trunking on trunk links so trunks are enabled manually; make sure the native VLAN is only used for trunk links.</p>
<div class="errata"><b>Slide errata (slide 35):</b> "A threat actor is specific situations" should read "in specific situations".</div>

<h3>DHCP attacks</h3>
<p>Both are mitigated with <b>DHCP snooping</b>.</p>
<ul>
  <li><b>DHCP starvation</b>: a tool such as <b>Gobbler</b> leases the whole address scope with DHCP discover messages from bogus MAC addresses, creating a DoS for real clients.</li>
  <li><b>DHCP spoofing</b>: a <b>rogue DHCP server</b> gives clients false settings: a <b>wrong default gateway</b> (man-in-the-middle), a <b>wrong DNS server</b> (pointing users to malicious websites) or a <b>wrong IP address</b> (DoS).</li>
</ul>

<h3>ARP attacks</h3>
<p>Hosts broadcast ARP requests; the owner of the IP address sends an ARP reply. A host can also send an unsolicited reply, a <b>gratuitous ARP</b>, which others store in their ARP tables. An attacker sends gratuitous ARPs with its own MAC address and the IP address of the default gateway, so hosts send it their traffic: a man-in-the-middle. This is <b>ARP spoofing</b> and <b>ARP poisoning</b>, mitigated with <b>DAI</b>. IPv6 uses ICMPv6 Neighbor Discovery instead and has its own protections against Neighbor Advertisement spoofing.</p>

<h3>Address spoofing</h3>
<ul>
  <li><b>IP address spoofing</b>: hijacking another device's IP address or using a random one. Hard to mitigate inside the subnet the IP belongs to.</li>
  <li><b>MAC address spoofing</b>: the attacker sets its MAC to a target's MAC. The switch moves the MAC table entry to the attacker's port and forwards the target's frames to the attacker. When the target sends traffic the entry moves back, so the attacker keeps sending frames to hold it.</li>
  <li>There is no Layer 2 mechanism that lets a switch verify a source MAC. Mitigate with <b>IP Source Guard (IPSG)</b>.</li>
</ul>

<h3>STP attack</h3>
<p>The attacker broadcasts BPDUs with a lower bridge priority to become the <b>root bridge</b>, changing the topology so traffic flows through it. Mitigate with <b>BPDU Guard</b> on all access ports.</p>

<h3>CDP reconnaissance</h3>
<p>CDP is enabled on all Cisco devices by default and sends <b>unencrypted, unauthenticated</b> periodic broadcasts with the device's IP address, IOS version, platform, capabilities and native VLAN. A threat actor can use this to find vulnerabilities. Limit CDP: disable it on edge ports to untrusted devices.</p>
<pre class="cli">Switch(config)# no cdp run               ! globally
Switch(config)# cdp run
Switch(config-if)# no cdp enable         ! on one interface
Switch(config-if)# cdp enable</pre>
<p>LLDP is also vulnerable: <code>no lldp run</code> globally, or <code>no lldp transmit</code> and <code>no lldp receive</code> on an interface.</p>`,
        understand: {
          big: 'Each LAN attack abuses a protocol that trusts by default: DTP and native VLANs (VLAN hopping), DHCP (starvation, spoofing), ARP (poisoning), MAC learning (spoofing), BPDUs (root takeover) and CDP (reconnaissance).',
          why: 'Recognising an attack from its description and naming the mitigation is a core exam skill.',
          keys: [
            'VLAN hopping: spoofed DTP brings up a trunk. Double tagging: outer tag = native VLAN; unidirectional.',
            'VLAN fixes: no trunking on access ports, manual trunks, native VLAN only on trunks.',
            'DHCP starvation (Gobbler) and DHCP spoofing (rogue server) → DHCP snooping.',
            'ARP spoofing/poisoning with gratuitous ARP → DAI.',
            'MAC/IP address spoofing → IPSG.',
            'STP attack (lower priority BPDUs) → BPDU Guard. CDP reconnaissance → no cdp enable / no cdp run.',
          ],
          traps: [
            { trap: 'Thinking double tagging is bidirectional.', fix: 'Replies are not double-tagged, so the attack is one-way.' },
            { trap: 'Using DHCP snooping against ARP poisoning.', fix: 'ARP attacks need DAI (which relies on the snooping table).' },
            { trap: 'Disabling CDP everywhere, including links between your own switches, with no thought.', fix: 'The deck recommends limiting CDP, for example disabling it on edge ports to untrusted devices.' },
          ],
          analogy: 'A con artist in an office: wearing a fake uniform (MAC spoofing), handing out fake visitor badges (rogue DHCP), telling everyone "I am the post room" (ARP poisoning), or reading the staff directory left on the desk (CDP).',
          explain: [
            { q: 'Why must the attacker be in the native VLAN for double tagging?', a: 'The first switch strips only a native VLAN outer tag and sends the frame untagged over the trunk, exposing the inner tag to the next switch.' },
            { q: 'How does a rogue DHCP server create a man-in-the-middle attack?', a: 'It gives clients its own address as the default gateway, so their traffic passes through it.' },
            { q: 'What information can CDP reveal to an attacker?', a: 'The device IP address, IOS version, platform, capabilities and native VLAN.' },
          ],
          widgets: ['l2mitigate'],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
