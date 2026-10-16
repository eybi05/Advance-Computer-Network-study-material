/* Module 10 — LAN Security Concepts: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 10.1 =============================== */
  match('10.1', 'Match the attack to its description.', [['DDoS', 'Coordinated attack from many zombies to halt access'], ['Data breach', 'Servers or hosts compromised to steal confidential data'], ['Malware', 'Hosts infected with malicious software, e.g. ransomware']], 'WannaCry is an example of ransomware.');
  mc('10.1', 'Which appliance monitors SMTP and blocks emails with bad links?', ['Cisco ESA', 'Cisco WSA', 'Cisco ISE', 'A VPN router'], 'ESA = Email Security Appliance.');
  mc('10.1', 'Which appliance performs URL filtering, URL categorization and malware scanning of web traffic?', ['Cisco WSA', 'Cisco ESA', 'A DHCP server', 'A WLC'], 'WSA = Web Security Appliance.');
  mc('10.1', 'Cisco Identity Services Engine (ISE) is an example of which kind of device?', ['Network Access Control (NAC)', 'Next-generation firewall', 'Email security appliance', 'Wireless controller'], 'NAC provides AAA services and access policies.');
  multi('10.1', 'Which three features does a next-generation firewall provide? (Choose three.)', 3, ['Stateful packet inspection', 'A next-generation IPS', 'URL filtering', 'DHCP snooping', 'Port security', 'Spanning tree'], 'NGFW: stateful inspection, application visibility and control, NGIPS, AMP and URL filtering.');
  mc('10.1', 'How often does the Cisco ESA pull threat intelligence from Cisco Talos?', ['Every three to five minutes', 'Once a day', 'Every 30 seconds', 'Once a week'], 'Real-time feeds pulled every 3–5 minutes.');
  multi('10.1', 'Which three are traditional host-based endpoint protections? (Choose three.)', 3, ['Antivirus/antimalware', 'Host-based firewall', 'HIPS', 'DHCP snooping', 'HSRP', 'EtherChannel'], 'The deck lists these three as traditional host-based features.');
  tf('10.1', 'Endpoints are mostly attacked through email and web browsing.', true, 'That is why the ESA and WSA are part of endpoint protection.');
  mc('10.1', 'Which device gives remote users a secure connection across a public network into the enterprise?', ['A VPN-enabled router', 'A Layer 2 switch', 'A WLC', 'A hub'], 'VPN services can also be integrated into the firewall.');

  card('10.1', 'ESA vs WSA', 'ESA (Email Security Appliance): monitors SMTP, blocks threats and bad links, encrypts outgoing mail; Talos feeds every 3–5 min.\nWSA (Web Security Appliance): web traffic: URL filtering/categorisation, malware scanning, application control.');
  card('10.1', 'Network security devices', 'VPN-enabled router, Next-Generation Firewall (stateful inspection, AVC, NGIPS, AMP, URL filtering), NAC (AAA, e.g. Cisco ISE).');
  card('10.1', 'Best endpoint protection today', 'NAC + AMP software + ESA + WSA (on top of antivirus, host firewall and HIPS).');
  card('10.1', 'Three common attacks in the news', 'DDoS (zombies), data breach, malware (e.g. WannaCry ransomware).');

  /* =============================== 10.2 =============================== */
  match('10.2', 'Match the AAA component to its question.', [['Authentication', 'Who are you?'], ['Authorization', 'What are you allowed to do?'], ['Accounting', 'What did you do?']], 'AAA controls access, permissions and auditing.');
  multi('10.2', 'Which two are limitations of the local database method? (Choose two.)', 2, ['Accounts must be configured on every device', 'There is no fallback authentication method', 'It cannot store passwords', 'It only works with Telnet'], 'The deck lists both: not scalable and no fallback.');
  multi('10.2', 'Which two protocols does a router use to talk to a central AAA server? (Choose two.)', 2, ['RADIUS', 'TACACS+', 'SNMP', 'CDP'], 'Server-based AAA uses RADIUS or TACACS+.');
  mc('10.2', 'Which AAA component can log every command a user entered, with the username and time?', ['Accounting', 'Authentication', 'Authorization', 'Auditing VLAN'], 'Accounting collects and reports usage data.');
  match('10.2', 'Match the 802.1X role to the device.', [['Supplicant', 'Client running 802.1X software'], ['Authenticator', 'Switch or wireless AP'], ['Authentication server', 'Validates the client identity']], 'The switch relays between the client and the server.');
  mc('10.2', 'When is local AAA authentication most appropriate?', ['In a small network', 'When there are hundreds of routers', 'When a fallback method is mandatory', 'Never'], 'Server-based AAA is better with many devices.');
  tf('10.2', 'Authorization requires users to perform extra steps after they log in.', false, 'AAA authorization is automatic after authentication.');
  cli('10.2', 'On the vty lines, authenticate users against the local user database.', 'R1(config-line)#', 'login local', 'login local uses the username/secret entries.');
  mc('10.2', 'What does IEEE 802.1X provide?', ['Port-based access control and authentication', 'Link aggregation', 'VLAN tagging', 'Rapid spanning tree'], '802.1X authenticates each device before the switch port offers services.');

  card('10.2', 'AAA', 'Authentication (who), Authorization (what you may do, automatic after login), Accounting (what you did: times, commands, packets, bytes).');
  card('10.2', 'Local vs server-based AAA', 'Local: users stored on the device; small networks.\nServer-based: central AAA server via RADIUS or TACACS+; many devices.');
  card('10.2', '802.1X roles', 'Supplicant (client software), authenticator (switch or AP), authentication server (validates identity).');
  card('10.2', 'Limits of the local password database', 'Configured on every device (not scalable) and no fallback method.');

  /* =============================== 10.3 =============================== */
  match('10.3', 'Match the mitigation to the attacks it prevents.', [['Port security', 'MAC address flooding, DHCP starvation'], ['DHCP snooping', 'DHCP starvation and DHCP spoofing'], ['Dynamic ARP Inspection', 'ARP spoofing and ARP poisoning'], ['IP Source Guard', 'MAC and IP address spoofing']], 'Learn this table well; module 11 configures each feature.');
  match('10.3', 'Match the attack category to an example.', [['VLAN attacks', 'Double-tagging'], ['DHCP attacks', 'Rogue DHCP server'], ['ARP attacks', 'ARP poisoning'], ['STP attacks', 'Spoofing the root bridge']], 'MAC table attacks (flooding) and address spoofing complete the list.');
  mc('10.3', 'Why is Layer 2 considered the weak link?', ['If Layer 2 is compromised, every layer above it is affected', 'Layer 2 has no addresses', 'Firewalls operate only at Layer 2', 'Layer 2 is always encrypted'], 'Upper-layer protections are useless if frames can be captured or redirected.');
  multi('10.3', 'Which three practices secure management access? (Choose three.)', 3, ['Use SSH, SCP, SFTP and TLS', 'Use a dedicated management VLAN', 'Use ACLs to filter access', 'Use Telnet with strong passwords', 'Put management traffic in the native VLAN', 'Disable spanning tree'], 'Also consider out-of-band management.');
  tf('10.3', 'VPNs and firewalls protect a LAN against Layer 2 attacks from inside.', false, 'They protect Layers 3 to 7; Layer 2 attacks need switch features.');
  mc('10.3', 'Which feature mitigates MAC and IP address spoofing?', ['IP Source Guard', 'BPDU Guard', 'PortFast', 'DTP'], 'IPSG checks the source addresses of traffic on a port.');
  mc('10.3', 'Why do LANs face more threats today than in the past?', ['BYOD and more sophisticated attacks', 'Switches no longer use MAC tables', 'IPv4 has run out', 'Cables are faster'], 'LANs were traditionally trusted; BYOD changed that.');
  tf('10.3', 'Layer 2 security features are ineffective if the management protocols are not secured.', true, 'Attackers can simply reconfigure the switch.');

  card('10.3', 'Six switch attack categories', 'MAC table attacks, VLAN attacks, DHCP attacks, ARP attacks, address spoofing attacks, STP attacks.');
  card('10.3', 'Four Layer 2 mitigations', 'Port security, DHCP snooping, Dynamic ARP Inspection (DAI), IP Source Guard (IPSG).');
  card('10.3', 'Secure management strategies', 'Secure protocols (SSH, SCP, SFTP, SSL/TLS), out-of-band management, dedicated management VLAN, ACLs.');
  card('10.3', 'Why Layer 2 matters', 'If Layer 2 is compromised, all layers above it are affected; it is the weak link.');

  /* =============================== 10.4 =============================== */
  mc('10.4', 'What happens when a switch\'s MAC address table is full?', ['It floods incoming frames out all ports in the VLAN', 'It drops every frame', 'It shuts down all ports', 'It forwards frames to the default gateway only'], 'Unknown destinations are flooded, so an attacker can capture traffic.');
  mc('10.4', 'What does a MAC flooding attack send to the switch?', ['Frames with many fake source MAC addresses', 'Frames with a fake destination MAC address', 'BPDUs with priority 0', 'DHCP offers'], 'Fake source MACs fill the table.');
  mc('10.4', 'Which tool is used in the deck as an example of a MAC flooding tool?', ['macof', 'Gobbler', 'Wireshark', 'nmap'], 'macof can send up to 8,000 bogus frames per second.');
  tf('10.4', 'After a MAC flooding attack, the attacker can capture traffic from all VLANs on the switch.', false, 'Flooding stays within the attacker\'s VLAN.');
  mc('10.4', 'Which feature mitigates MAC address table overflow attacks?', ['Port security', 'DHCP snooping', 'HSRP', 'BPDU Guard'], 'Port security limits the number of MAC addresses per port.');
  tf('10.4', 'A MAC flooding attack can also affect other switches connected to the attacked switch.', true, 'The flooded frames reach other switches, which may fill their tables too.');
  mc('10.4', 'How does a switch build its MAC address table?', ['From the source MAC addresses of received frames', 'From the destination MAC addresses', 'From DHCP bindings', 'From ARP replies only'], 'Learning always uses the source address.');
  mc('10.4', 'How many MAC addresses can the Catalyst 6500 in the deck\'s example store?', ['132,000', '8,000', '4,096', '1,024'], 'macof can fill it within seconds at 8,000 frames per second.');

  card('10.4', 'MAC address table flooding', 'Fake source MACs fill the fixed-size table; the switch then floods frames out all ports in the VLAN, so the attacker captures traffic in that VLAN.');
  card('10.4', 'macof', 'MAC flooding tool: up to 8,000 bogus frames per second (a Catalyst 6500 table holds 132,000 entries).');
  card('10.4', 'Mitigation of MAC flooding', 'Port security: limit the number of source MAC addresses learned on a port.');
  card('10.4', 'Scope of MAC flooding', 'Only the attacker\'s VLAN, but flooding can spread to other connected switches.');

  /* =============================== 10.5 =============================== */
  mc('10.5', 'How does a basic VLAN hopping attack work?', ['The attacker\'s host spoofs DTP to form a trunk with the switch', 'The attacker floods the MAC table', 'The attacker sends gratuitous ARPs', 'The attacker leases every DHCP address'], 'A trunk gives access to all VLANs.');
  mc('10.5', 'A VLAN double-tagging attack works only when the attacker is connected to a port in which VLAN?', ['The native VLAN of the trunk', 'VLAN 1002', 'The voice VLAN', 'The management VLAN of the router'], 'The first switch strips the outer native-VLAN tag.');
  tf('10.5', 'A VLAN double-tagging attack is bidirectional.', false, 'It is unidirectional; replies are not double-tagged.');
  multi('10.5', 'Which three steps mitigate VLAN hopping and double-tagging? (Choose three.)', 3, ['Disable trunking on access ports', 'Disable auto trunking so trunks are configured manually', 'Use the native VLAN only for trunk links', 'Enable DTP desirable everywhere', 'Put users in VLAN 1', 'Disable spanning tree'], 'From the deck\'s trunk security guidelines.');
  match('10.5', 'Match the attack to its mitigation.', [['DHCP starvation', 'DHCP snooping'], ['ARP poisoning', 'Dynamic ARP Inspection'], ['STP manipulation', 'BPDU Guard'], ['MAC address spoofing', 'IP Source Guard']], 'Port security also helps against DHCP starvation.');
  mc('10.5', 'Which tool performs a DHCP starvation attack?', ['Gobbler', 'macof', 'ping', 'traceroute'], 'Gobbler leases the whole scope with bogus MAC addresses.');
  multi('10.5', 'Which three false settings can a rogue DHCP server hand out? (Choose three.)', 3, ['A wrong default gateway', 'A wrong DNS server', 'A wrong IP address', 'A wrong switch hostname', 'A wrong VLAN name', 'A wrong STP priority'], 'Wrong gateway = MITM, wrong DNS = malicious sites, wrong IP = DoS.');
  mc('10.5', 'What is a gratuitous ARP?', ['An unsolicited ARP reply', 'An ARP request for the default gateway', 'An ARP reply with no MAC address', 'An IPv6 Neighbor Solicitation'], 'Hosts store it in their ARP tables, which attackers abuse.');
  mc('10.5', 'Which information is sent in CDP advertisements?', ['IP address, IOS version, platform, capabilities and native VLAN', 'Passwords and usernames', 'The MAC address table', 'DHCP bindings'], 'CDP is unencrypted and unauthenticated.');
  cli('10.5', 'Disable CDP on this edge interface.', 'S1(config-if)#', 'no cdp enable', 'no cdp enable disables CDP on one interface.');
  cli('10.5', 'Disable CDP on the whole device.', 'S1(config)#', 'no cdp run', 'no cdp run is the global command.');
  mc('10.5', 'Which commands disable LLDP on one interface?', ['no lldp transmit and no lldp receive', 'no lldp run', 'no cdp enable', 'lldp disable'], 'no lldp run disables LLDP globally.');

  card('10.5', 'VLAN double-tagging', 'Attacker in the native VLAN sends a frame with two tags. Switch 1 strips the outer (native) tag and forwards untagged; switch 2 reads the inner tag. One-way only.');
  card('10.5', 'VLAN attack mitigation', 'Disable trunking on access ports, disable auto trunking (manual trunks), use the native VLAN only on trunks.');
  card('10.5', 'DHCP starvation vs spoofing', 'Starvation: Gobbler leases every address (DoS). Spoofing: rogue server gives wrong gateway/DNS/IP. Both: DHCP snooping.');
  card('10.5', 'ARP spoofing / poisoning', 'Gratuitous ARPs claiming the gateway\'s IP with the attacker\'s MAC → MITM. Mitigation: DAI.');
  card('10.5', 'STP attack and CDP reconnaissance', 'STP: attacker sends low-priority BPDUs to become root → BPDU Guard on access ports.\nCDP: leaks IP, IOS, platform, native VLAN → no cdp enable (edge ports) / no cdp run.');
})(typeof window !== 'undefined' ? window : globalThis);
