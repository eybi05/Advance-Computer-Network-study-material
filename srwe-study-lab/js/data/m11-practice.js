/* Module 11 — Switch Security Configuration: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 11.1 =============================== */
  mc('11.1', 'switchport port-security is rejected with "FastEthernet0/1 is a dynamic port". What must you do first?', ['switchport mode access', 'no shutdown', 'switchport nonegotiate', 'spanning-tree portfast'], 'Port security works only on ports set manually to access (or trunk).');
  match('11.1', 'Match the port security default to its value.', [['Maximum MAC addresses', '1'], ['Violation mode', 'shutdown'], ['Aging time', '0 mins (no aging)']], 'Just entering switchport port-security uses these defaults.');
  match('11.1', 'Match the violation mode to its behaviour.', [['shutdown', 'Error-disables the port, logs and counts'], ['restrict', 'Drops offending frames, logs and counts'], ['protect', 'Drops offending frames silently']], 'Protect is the least secure mode.');
  multi('11.1', 'Which three ways can a port learn secure MAC addresses? (Choose three.)', 3, ['Manually configured', 'Dynamically learned', 'Dynamically learned – sticky', 'From the DHCP snooping table', 'From CDP', 'From the ARP cache'], 'Static, dynamic (not saved) and sticky (saved in the running-config).');
  mc('11.1', 'Which secure MAC addresses are written into the running configuration?', ['Sticky addresses (and manually configured ones)', 'Dynamically learned addresses', 'All addresses in the MAC table', 'None'], 'Sticky addresses are added to the running-config; saving it stores them in NVRAM.');
  cli('11.1', 'Allow at most 4 secure MAC addresses on this port.', 'S1(config-if)#', 'switchport port-security maximum 4', 'The default maximum is 1.');
  cli('11.1', 'Make the port learn secure addresses and save them in the running configuration.', 'S1(config-if)#', 'switchport port-security mac-address sticky', 'Sticky learning.');
  cli('11.1', 'Set the violation mode so frames are dropped and logged but the port stays up.', 'S1(config-if)#', 'switchport port-security violation restrict', 'restrict drops, logs and increments the counter.');
  cli('11.1', 'Remove secure addresses that have been inactive for the aging time.', 'S1(config-if)#', 'switchport port-security aging type inactivity', 'The other aging type is absolute.');
  mc('11.1', 'A port in shutdown mode is error-disabled after a violation. How do you bring it back (after removing the rogue device)?', ['shutdown, then no shutdown', 'no shutdown only', 'clear mac address-table', 'reload'], 'The deck: first shutdown, then no shutdown.');
  mc('11.1', 'show port-security interface fa0/18 shows Port Status Secure-shutdown. What does it mean?', ['The port was error-disabled by a violation', 'Port security is disabled', 'The port is administratively down by choice', 'The port is learning sticky addresses'], 'The violation counter also increments.');
  mc('11.1', 'Which command lists all secure MAC addresses on all interfaces?', ['show port-security address', 'show mac address-table count', 'show port-security interface', 'show running-config | include sticky'], 'show port-security address lists configured and learned secure MACs.');
  tf('11.1', 'In restrict mode, the security violation counter increments.', true, 'Restrict and shutdown increment it; protect does not.');
  multi('11.1', 'Which two actions secure unused switch ports? (Choose two.)', 2, ['Shut them down', 'Assign them to an unused VLAN', 'Make them trunks', 'Enable PortFast only'], 'Shut down and park in an unused VLAN.');

  card('11.1', 'Port security defaults', 'Maximum 1 MAC address, violation mode shutdown, no aging. Requires switchport mode access (or trunk).');
  card('11.1', 'Violation modes', 'shutdown (default): err-disabled, syslog, counter.\nrestrict: drop, syslog, counter.\nprotect: drop only (least secure).');
  card('11.1', 'Three kinds of secure MAC addresses', 'Static (switchport port-security mac-address X), dynamic (learned, not saved), sticky (learned and written to the running-config).');
  card('11.1', 'Recover an err-disabled port', 'Remove the cause, then interface X → shutdown → no shutdown.');
  card('11.1', 'Port security aging', 'switchport port-security aging time <min> and aging type {absolute | inactivity}. Static aging per port: aging static.');
  card('11.1', 'Port security verification', 'show port-security (all ports), show port-security interface X (details), show port-security address (secure MACs), show run (sticky entries).');

  /* =============================== 11.2 =============================== */
  order('11.2', 'Put the steps to mitigate VLAN hopping in the order of the deck.', ['switchport mode access on non-trunking ports', 'Disable unused ports and put them in an unused VLAN', 'switchport mode trunk on trunk ports', 'switchport nonegotiate on trunk ports', 'Set the native VLAN to a VLAN other than 1'], 'Access ports, unused ports, static trunks, DTP off, native VLAN.');
  cli('11.2', 'Stop this trunk port from sending DTP frames.', 'S1(config-if)#', 'switchport nonegotiate', 'nonegotiate disables DTP.');
  cli('11.2', 'Change the native VLAN of this trunk to VLAN 999.', 'S1(config-if)#', 'switchport trunk native vlan 999', 'Use a VLAN other than VLAN 1.');
  multi('11.2', 'Which three are ways to launch a VLAN hopping attack? (Choose three.)', 3, ['Spoof DTP messages from a host', 'Introduce a rogue switch and enable trunking', 'Double-tag frames in the native VLAN', 'Flood the MAC address table', 'Send gratuitous ARPs', 'Lease every DHCP address'], 'The other three are MAC, ARP and DHCP attacks.');
  mc('11.2', 'Which command prevents a port from becoming a trunk through DTP?', ['switchport mode access', 'switchport nonegotiate on an access port only', 'spanning-tree portfast', 'no cdp enable'], 'switchport mode access disables trunk negotiation on non-trunking ports.');
  tf('11.2', 'switchport mode trunk on its own stops the port from sending DTP frames.', false, 'A static trunk still sends DTP; add switchport nonegotiate.');
  mc('11.2', 'In the deck\'s example, why are Fa0/17–20 put in VLAN 1000?', ['They are unused ports parked in an unused VLAN', 'VLAN 1000 is the native VLAN', 'They are trunks', 'VLAN 1000 is the voice VLAN'], 'Unused ports go into a VLAN with nothing in it.');
  mc('11.2', 'Which command, applied to a range, makes Fa0/21–24 static trunks with DTP off and native VLAN 999? Choose the missing one: switchport mode trunk, ____, switchport trunk native vlan 999.', ['switchport nonegotiate', 'switchport access vlan 999', 'switchport mode dynamic desirable', 'switchport port-security'], 'That is the deck\'s configuration.');

  card('11.2', 'Five steps against VLAN hopping', '1. switchport mode access (non-trunk ports)\n2. Shut down unused ports, put them in an unused VLAN\n3. switchport mode trunk (trunks)\n4. switchport nonegotiate (trunks)\n5. switchport trunk native vlan <not 1>');
  card('11.2', 'Three VLAN hopping methods', 'Spoofed DTP from a host, a rogue switch with trunking, double tagging in the native VLAN.');
  card('11.2', 'switchport nonegotiate', 'Stops a port from sending DTP frames; use it on static trunks (and it is pointless on dynamic ports).');
  card('11.2', 'Unused port best practice', 'switchport mode access, switchport access vlan <unused>, shutdown.');

  /* =============================== 11.3 =============================== */
  order('11.3', 'Put the DHCP snooping steps in order.', ['ip dhcp snooping (global)', 'ip dhcp snooping trust on trusted ports', 'ip dhcp snooping limit rate on untrusted ports', 'ip dhcp snooping vlan <list>'], 'The order used in the deck.');
  mc('11.3', 'Which ports should be trusted for DHCP snooping?', ['Ports leading to the DHCP server and uplinks', 'All access ports', 'All ports', 'No ports'], 'Access ports stay untrusted.');
  mc('11.3', 'Why is port security not enough against every DHCP starvation attack?', ['The tool can use the real interface MAC as the source and put fake MACs only in the DHCP payload', 'Port security does not work on access ports', 'DHCP uses IPv6', 'Port security only checks destination MACs'], 'Then the source MAC looks legitimate.');
  cli('11.3', 'Trust this interface for DHCP snooping.', 'S1(config-if)#', 'ip dhcp snooping trust', 'Configure it on the uplink to the DHCP server.');
  cli('11.3', 'Limit this untrusted interface to 6 DHCP packets per second.', 'S1(config-if)#', 'ip dhcp snooping limit rate 6', 'Rate limiting applies to untrusted ports.');
  cli('11.3', 'Enable DHCP snooping for VLANs 5, 10 and 50 to 52.', 'S1(config)#', 'ip dhcp snooping vlan 5,10,50-52', 'Snooping must be enabled per VLAN as well as globally.');
  mc('11.3', 'What is recorded in the DHCP snooping binding table?', ['The client MAC address, its assigned IP address, lease, VLAN and interface', 'The DHCP server\'s configuration', 'Every frame on the VLAN', 'The STP root bridge'], 'show ip dhcp snooping binding shows it.');
  tf('11.3', 'DHCP snooping drops DHCPOFFER messages that arrive on untrusted ports.', true, 'That is how it blocks rogue DHCP servers.');
  mc('11.3', 'Which command shows whether DHCP snooping is enabled and which ports are trusted?', ['show ip dhcp snooping', 'show ip dhcp binding', 'show dhcp server', 'show interfaces trunk'], 'show ip dhcp snooping binding shows the clients.');
  mc('11.3', 'Which other feature requires DHCP snooping?', ['Dynamic ARP Inspection', 'HSRP', 'EtherChannel', 'Port security'], 'DAI validates ARP against the snooping binding table.');

  card('11.3', 'DHCP snooping configuration', 'ip dhcp snooping\ninterface <uplink> → ip dhcp snooping trust\ninterface range <access> → ip dhcp snooping limit rate 6\nip dhcp snooping vlan <list>');
  card('11.3', 'Trusted vs untrusted (snooping)', 'Trusted: explicitly configured; uplinks, server ports (DHCP servers allowed).\nUntrusted (default): access ports; server messages dropped, client messages rate-limited.');
  card('11.3', 'DHCP snooping binding table', 'Client MAC + assigned IP + lease + VLAN + interface. Used by DAI. show ip dhcp snooping binding.');
  card('11.3', 'Snooping with an IOS DHCP server', 'If clients stop getting addresses, add no ip dhcp snooping information option (the server rejects option 82 inserted by the switch).');

  /* =============================== 11.4 =============================== */
  mc('11.4', 'What does Dynamic ARP Inspection require?', ['DHCP snooping', 'Port security', 'BPDU Guard', 'HSRP'], 'It validates ARP against the snooping bindings.');
  order('11.4', 'Put the DAI implementation guidelines in order.', ['Enable DHCP snooping globally', 'Enable DHCP snooping on selected VLANs', 'Enable DAI on selected VLANs', 'Configure trusted interfaces for snooping and ARP inspection'], 'From the deck.');
  cli('11.4', 'Enable Dynamic ARP Inspection for VLAN 10.', 'S1(config)#', 'ip arp inspection vlan 10', 'DAI is enabled per VLAN.');
  cli('11.4', 'Trust this uplink for ARP inspection.', 'S1(config-if)#', 'ip arp inspection trust', 'Uplinks are trusted; access ports are not.');
  cli('11.4', 'Make DAI check the source MAC, destination MAC and IP addresses, all in one command.', 'S1(config)#', 'ip arp inspection validate src-mac dst-mac ip', 'Each validate command overwrites the previous one, so put all checks on one line.');
  match('11.4', 'Match the DAI validation option to its check.', [['src-mac', 'Ethernet source MAC = sender MAC in the ARP body'], ['dst-mac', 'Ethernet destination MAC = target MAC in the ARP body'], ['ip', 'No invalid IPs such as 0.0.0.0 or multicasts in the ARP body']], 'Use them together on one line.');
  mc('11.4', 'You enter ip arp inspection validate src-mac, then ip arp inspection validate ip. Which check is active?', ['Only ip', 'src-mac and ip', 'Only src-mac', 'None'], 'Only one validate command is kept; the newest overwrites.');
  multi('11.4', 'Which two things does DAI do on untrusted ports? (Choose two.)', 2, ['Intercepts ARP requests and replies and checks their IP-to-MAC bindings', 'Drops and logs invalid ARP replies', 'Assigns IP addresses', 'Blocks BPDUs'], 'It can also err-disable a port that exceeds the ARP rate.');
  tf('11.4', 'Access ports should normally be trusted for ARP inspection.', false, 'Access ports are untrusted; uplinks are trusted.');

  card('11.4', 'Dynamic ARP Inspection', 'Validates ARP on untrusted ports against the DHCP snooping binding table; drops and logs invalid replies; can err-disable a port that exceeds the ARP rate.');
  card('11.4', 'DAI configuration', 'ip dhcp snooping; ip dhcp snooping vlan 10; ip arp inspection vlan 10; uplink: ip dhcp snooping trust + ip arp inspection trust.');
  card('11.4', 'ip arp inspection validate', 'Options src-mac, dst-mac, ip. Only one command is kept, so list all checks in one: ip arp inspection validate src-mac dst-mac ip.');
  card('11.4', 'Trust rule for DAI', 'Access ports untrusted; uplinks to switches and routers trusted.');

  /* =============================== 11.5 =============================== */
  cli('11.5', 'Enable PortFast on this access port.', 'S1(config-if)#', 'spanning-tree portfast', 'Only on ports to end devices.');
  cli('11.5', 'Enable PortFast on all access ports at once.', 'S1(config)#', 'spanning-tree portfast default', 'Global command.');
  cli('11.5', 'Enable BPDU Guard on this interface.', 'S1(config-if)#', 'spanning-tree bpduguard enable', 'A BPDU then error-disables the port.');
  cli('11.5', 'Enable BPDU Guard on all PortFast ports at once.', 'S1(config)#', 'spanning-tree portfast bpduguard default', 'Global command.');
  mc('11.5', 'Which command shows whether PortFast and BPDU Guard are enabled by default on the switch?', ['show spanning-tree summary', 'show spanning-tree root', 'show port-security', 'show ip dhcp snooping'], 'It lists Portfast Default and PortFast BPDU Guard Default.');
  mc('11.5', 'Which attack do PortFast and BPDU Guard mitigate?', ['STP manipulation (root bridge spoofing)', 'DHCP starvation', 'ARP poisoning', 'MAC flooding'], 'The attacker sends BPDUs to become root; BPDU Guard shuts the port.');
  mc('11.5', 'Which command enables automatic recovery of ports disabled by BPDU Guard?', ['errdisable recovery cause bpduguard', 'errdisable recovery cause psecure_violation', 'spanning-tree recovery', 'no spanning-tree bpduguard'], 'The deck shows psecure_violation, which is the cause for port security.');
  tf('11.5', 'PortFast should be enabled on links between switches.', false, 'It can create a spanning-tree loop; use it only on access ports.');
  mc('11.5', 'An end-user port with PortFast receives a BPDU because someone plugged in a switch. With BPDU Guard enabled, what happens?', ['The port is error-disabled', 'The new switch becomes root', 'The BPDU is ignored and the port keeps forwarding', 'The port becomes a trunk'], 'BPDU Guard error-disables the port immediately.');
  multi('11.5', 'Which two commands verify PortFast on a single interface? (Choose two.)', 2, ['show running-config interface fa0/1', 'show spanning-tree interface fa0/1 detail', 'show ip interface brief', 'show vlan brief'], 'show spanning-tree summary verifies the global default.');

  card('11.5', 'PortFast commands', 'Interface: spanning-tree portfast. Global (all access ports): spanning-tree portfast default.');
  card('11.5', 'BPDU Guard commands', 'Interface: spanning-tree bpduguard enable. Global: spanning-tree portfast bpduguard default.');
  card('11.5', 'Verifying PortFast / BPDU Guard', 'Global: show spanning-tree summary or show running-config | begin span. Interface: show running-config interface X, show spanning-tree interface X detail.');
  card('11.5', 'errdisable recovery causes', 'BPDU Guard: errdisable recovery cause bpduguard. Port security: errdisable recovery cause psecure_violation.');
})(typeof window !== 'undefined' ? window : globalThis);
