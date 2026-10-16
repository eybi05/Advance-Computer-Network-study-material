/* Flashcards: f = prompt, b = answer. Reviewed with spaced repetition. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const C = SRWE.cards = [];
  const n = {};
  const card = (t, f, b) => { n[t] = (n[t] || 0) + 1; C.push({ id: 'c' + t + '-' + n[t], t, f, b }); };

  /* 1.1 */
  card('1.1', 'The five steps of the switch boot sequence', '1. POST (ROM)\n2. Boot loader starts (ROM)\n3. Low-level CPU initialization\n4. Flash file system initialization\n5. IOS image loaded, control given to IOS');
  card('1.1', 'What does POST test?', 'The CPU subsystem: the CPU, DRAM and the part of flash that makes up the flash file system.');
  card('1.1', 'Command that sets the BOOT environment variable', 'boot system flash:/path/image.bin (global configuration)');
  card('1.1', 'Name and location of a switch startup configuration', 'config.text, stored in flash');
  card('1.1', 'Command to see which IOS file the BOOT variable points to', 'show boot');
  card('1.1', 'Default LED mode and the modes the Mode button cycles through', 'STAT is the default. Mode cycles STAT, DUPLX, SPEED, PoE.');
  card('1.1', 'SPEED mode: off / green / blinking green', 'Off = 10 Mb/s, green = 100 Mb/s, blinking green = 1000 Mb/s');
  card('1.1', 'STAT mode: amber means…', 'The port is blocked to prevent a loop (alternating green/amber = link fault).');
  card('1.1', 'How to reach the boot loader after a crash', 'Console cable, unplug power, plug back in and within 15 s hold Mode until SYST goes amber then solid green. Prompt: switch:');
  card('1.1', 'What a switch needs for remote management (two items, plus one for remote networks)', 'An IP address and subnet mask on an SVI; a default gateway (ip default-gateway) to be managed from other networks.');
  card('1.1', 'When does an SVI become up/up?', 'When its VLAN exists and at least one port in that VLAN is up (and the SVI is not shut down).');
  card('1.1', '2960 command needed before IPv6 on the SVI', 'sdm prefer dual-ipv4-and-ipv6 default, then reload');

  /* 1.2 */
  card('1.2', 'Full duplex requirements and effect', 'Microsegmentation (one device per port). No collision domain; collision detection disabled; both directions at once.');
  card('1.2', 'Which duplex is allowed at 1000 Mb/s?', 'Full duplex only.');
  card('1.2', 'Default speed, duplex and MDIX on a 2960 port', 'speed auto, duplex auto, mdix auto');
  card('1.2', 'Requirement for auto-MDIX to work', 'Speed and duplex both set to auto.');
  card('1.2', 'Verify auto-MDIX on Fa0/1', 'show controllers ethernet-controller fa0/1 phy | include Auto-MDIX');
  card('1.2', '"up / line protocol down" means…', 'Layer 1 OK, Layer 2 failing: encapsulation mismatch, err-disabled far end, or hardware problem.');
  card('1.2', '"down / down" means…', 'No cable or another physical problem; the other end may be administratively down.');
  card('1.2', 'Runt vs giant', 'Runt: Ethernet frame < 64 bytes. Giant: > 1518 bytes.');
  card('1.2', 'Late collision: definition and two causes', 'A collision after 512 bits of the frame. Causes: excessive cable length, duplex misconfiguration.');
  card('1.2', 'Many CRC errors suggest…', 'Media/cable problems: noise, interference, loose or damaged connections, wrong cabling.');

  /* 1.3 */
  card('1.3', 'Telnet vs SSH: ports and security', 'Telnet TCP 23, plaintext. SSH TCP 22, encrypted authentication and data.');
  card('1.3', 'How to tell an IOS image supports SSH', 'The image name contains "k9" (show version).');
  card('1.3', 'Six SSH configuration steps', '1. show ip ssh\n2. ip domain-name\n3. crypto key generate rsa\n4. username … secret …\n5. line vty: transport input ssh + login local\n6. ip ssh version 2');
  card('1.3', 'What enables the SSH server?', 'Generating the RSA key pair (crypto key generate rsa).');
  card('1.3', 'What disables SSH by removing keys?', 'crypto key zeroize rsa');
  card('1.3', 'Prerequisites for crypto key generate rsa', 'A hostname other than Switch/Router and an IP domain name.');
  card('1.3', 'login vs login local', 'login = check the line password. login local = check the local username database.');
  card('1.3', 'show ip ssh says version 1.99', 'Both SSH v1 and v2 are supported. After ip ssh version 2 it shows 2.0.');
  card('1.3', 'show ip ssh vs show ssh', 'show ip ssh = version and settings. show ssh = active SSH sessions.');

  /* 1.4 */
  card('1.4', 'Basic router settings always configured', 'Hostname, enable secret, console and vty passwords with login, service password-encryption, banner motd, save.');
  card('1.4', 'Three conditions for a router interface to be available', 'An IP address, activated with no shutdown, connected to another device.');
  card('1.4', 'Default state of router interfaces', 'Administratively down (shutdown).');
  card('1.4', 'Maximum interface description length', '240 characters');
  card('1.4', 'Purpose of banner motd', 'Legal notice that unauthorized access is prohibited.');
  card('1.4', 'Loopback interface properties', 'Logical, internal, never cabled, automatically up while the router runs; unique address each.');
  card('1.4', 'enable secret vs enable password', 'enable secret is hashed and takes precedence if both are set.');
  card('1.4', 'What service password-encryption does', 'Applies weak type 7 encoding to plaintext passwords in the configuration.');

  /* 1.5 */
  card('1.5', 'Fast status summary of all interfaces', 'show ip interface brief / show ipv6 interface brief');
  card('1.5', 'Routing table codes C and L', 'C = directly connected network. L = local host route (the interface\'s own address, /32 or /128, AD 0).');
  card('1.5', 'IPv6 link-local address', 'Begins with FE80; created automatically; every IPv6 interface must have one.');
  card('1.5', 'Multicast groups an IPv6 router interface joins', 'FF02::1 (all nodes), FF02::2 (all routers), FF02::1:FFxx:xxxx (solicited-node).');
  card('1.5', 'The four show filters', 'section, include, exclude, begin (after a | pipe)');
  card('1.5', 'Stop --More-- paging', 'terminal length 0');
  card('1.5', 'History keys and default size', 'Ctrl+P/Up = older, Ctrl+N/Down = newer. Default 10 lines.');
  card('1.5', 'Change history size for this session', 'terminal history size n (not saved)');

  /* 2.1 */
  card('2.1', 'Ingress vs egress', 'Ingress = frame entering an interface. Egress = frame leaving.');
  card('2.1', 'What does a switch learn, and from which field?', 'The source MAC address and the port it arrived on.');
  card('2.1', 'Other name for the MAC address table', 'CAM table (Content Addressable Memory)');
  card('2.1', 'Unknown unicast or broadcast: switch action', 'Flood out of all ports except the ingress port.');
  card('2.1', 'MAC table aging time', '5 minutes (300 s); reset whenever the source is seen again.');
  card('2.1', 'Store-and-forward: two characteristics', 'Error checking (FCS/CRC, bad frames dropped) and buffering (allows different port speeds). Cisco preferred.');
  card('2.1', 'Cut-through characteristics', 'Forwards after the destination MAC; no FCS check (propagates errors); latency < 10 µs; same speeds only.');
  card('2.1', 'Fragment-free', 'Cut-through variant that waits for 64 bytes, eliminating runts.');
  card('2.1', 'Three things a Layer 2 switch can do with a frame', 'Flood (broadcast/unknown), forward (known unicast), filter (destination on the same port).');

  /* 2.2 */
  card('2.2', 'What breaks up broadcast domains?', 'Only a Layer 3 device (router) — or VLANs on switches.');
  card('2.2', 'When does a switch link become a collision domain?', 'When a device on it runs half duplex.');
  card('2.2', 'Hub with 4 PCs: collision domains?', 'One (all hub ports share it).');
  card('2.2', 'Effect of adding switches on the broadcast domain', 'It grows: Layer 1 and Layer 2 devices extend broadcast domains.');
  card('2.2', 'Four switch features that relieve congestion', 'Fast port speeds, fast internal switching, large frame buffers, high port density.');
  card('2.2', 'Summary: switches and domains', 'Switches extend broadcast domains but eliminate collision domains (full duplex).');

  /* 3.1 */
  card('3.1', 'What is a VLAN?', 'A logical group of devices forming its own broadcast domain and IP subnet, independent of physical location.');
  card('3.1', 'Six benefits of VLANs', 'Smaller broadcast domains, improved security, IT efficiency, reduced cost, better performance, simpler management.');
  card('3.1', 'Roles of VLAN 1', 'Default VLAN, default native VLAN, default management VLAN. Cannot be deleted or renamed.');
  card('3.1', 'Data VLAN', 'Carries user-generated traffic (email, web).');
  card('3.1', 'Native VLAN', 'Used only on 802.1Q trunks; its frames are sent untagged.');
  card('3.1', 'Management VLAN', 'For SSH/Telnet to the switch; usually the SVI VLAN; separate from users.');
  card('3.1', 'Voice VLAN requirements', 'Assured bandwidth, high QoS priority, congestion avoidance, delay < 150 ms.');

  /* 3.2 */
  card('3.2', 'What is a trunk?', 'A point-to-point link carrying more than one VLAN (802.1Q).');
  card('3.2', '802.1Q tag size and fields', '4 bytes: Type/TPID 0x8100 (2 bytes), Priority (3 bits), CFI (1 bit), VID (12 bits).');
  card('3.2', 'Why recalculate the FCS when tagging?', 'Adding (or removing) the tag changes the frame, so the old checksum is invalid.');
  card('3.2', 'How many VLAN IDs fit in 12 bits?', '4096 (0 and 4095 reserved, so 1–4094 usable).');
  card('3.2', 'Native VLAN rules', 'Default VLAN 1; untagged; must match on both ends of a trunk; may differ between trunks.');
  card('3.2', 'Native VLAN mismatch symptom', 'CDP-4-NATIVE_VLAN_MISMATCH messages; untagged traffic leaks between the two VLANs.');
  card('3.2', 'How a Cisco IP phone learns its voice VLAN', 'From CDP messages sent by the switch.');
  card('3.2', 'Cisco IP phone internal design', 'A three-port switch: switch uplink, PC port, internal phone ASIC port.');
  card('3.2', 'CoS', 'Class of Service: Layer 2 QoS priority carried in the 802.1Q priority bits.');

  /* 3.3 */
  card('3.3', 'Normal-range VLANs', '1–1005; stored in vlan.dat in flash; 1002–1005 legacy; 1 and 1002–1005 cannot be deleted.');
  card('3.3', 'Extended-range VLANs', '1006–4095 (per course); stored in the running config; need VTP transparent mode; fewer features.');
  card('3.3', 'Create and name VLAN 20', 'vlan 20\nname student');
  card('3.3', 'Default name of an unnamed VLAN 20', 'VLAN0020');
  card('3.3', 'Assign Fa0/18 to VLAN 20', 'interface fa0/18\nswitchport mode access\nswitchport access vlan 20');
  card('3.3', 'Configure a data and a voice VLAN on one port', 'switchport access vlan 20\nmls qos trust cos\nswitchport voice vlan 150');
  card('3.3', 'Return a port to VLAN 1', 'no switchport access vlan');
  card('3.3', 'What happens to ports of a deleted VLAN?', 'They become inactive until reassigned or the VLAN is re-created.');
  card('3.3', 'Factory-reset a switch completely', 'erase startup-config, delete vlan.dat, reload (unplug data cables first).');
  card('3.3', 'show vlan options', 'brief, id vlan-id, name vlan-name, summary');

  /* 3.4 */
  card('3.4', 'Three trunk configuration commands', 'switchport mode trunk\nswitchport trunk native vlan N\nswitchport trunk allowed vlan LIST');
  card('3.4', 'Add VLAN 30 to the allowed list without replacing it', 'switchport trunk allowed vlan add 30');
  card('3.4', 'Reset a trunk to defaults', 'no switchport trunk allowed vlan (all VLANs)\nno switchport trunk native vlan (VLAN 1)');
  card('3.4', 'Show all operational trunks', 'show interfaces trunk');
  card('3.4', 'Line that proves a port is really trunking', 'Operational Mode: trunk (in show interfaces X switchport)');
  card('3.4', 'Extra step on ISL-capable Layer 3 switches', 'switchport trunk encapsulation dot1q before switchport mode trunk');
  card('3.4', 'Turn a trunk back into an access port', 'switchport mode access');

  /* 3.5 */
  card('3.5', 'DTP', 'Dynamic Trunking Protocol: Cisco proprietary trunk negotiation. Default on 2960 = dynamic auto.');
  card('3.5', 'auto + auto = ?', 'Access');
  card('3.5', 'auto + desirable = ?', 'Trunk');
  card('3.5', 'trunk + access = ?', 'Limited connectivity');
  card('3.5', 'desirable + access = ?', 'Access');
  card('3.5', 'Turn DTP off', 'switchport nonegotiate (only with static access or trunk)');
  card('3.5', 'Verify DTP', 'show dtp interface X');
  card('3.5', 'DTP best practice', 'Set ports statically to access or trunk and disable DTP.');

  /* 4.1 */
  card('4.1', 'Three inter-VLAN routing options', 'Legacy (one router port per VLAN), router-on-a-stick (subinterfaces on one trunk), Layer 3 switch (SVIs).');
  card('4.1', 'Legacy inter-VLAN routing limitation', 'Needs one physical router interface per VLAN; does not scale.');
  card('4.1', 'Router-on-a-stick scaling limit', 'About 50 VLANs.');
  card('4.1', 'Subinterface', 'A software-based virtual interface on one physical interface, with its own IP and VLAN.');
  card('4.1', 'Layer 3 switch advantages', 'Hardware routing (faster, low latency), no external router link, EtherChannel trunks, common in campus LANs.');
  card('4.1', 'Layer 3 switch disadvantage', 'Cost.');

  /* 4.2 */
  card('4.2', 'Create the VLAN 10 subinterface on G0/0/1', 'interface g0/0/1.10');
  card('4.2', 'Two commands on each subinterface', 'encapsulation dot1Q vlan-id [native]\nip address ip mask');
  card('4.2', 'When to use the native keyword', 'When the native VLAN is not VLAN 1.');
  card('4.2', 'Physical interface shut down → subinterfaces?', 'All subinterfaces are disabled. Enable with no shutdown on the physical interface.');
  card('4.2', 'Switch port facing the router-on-a-stick', 'Must be a trunk (switchport mode trunk).');
  card('4.2', 'Router-on-a-stick verification commands', 'show ip route, show ip interface brief, show interfaces, show interfaces trunk, ping');
  card('4.2', 'Reply TTL=127 from a Windows PC means…', 'One router hop (128 − 1).');

  /* 4.3 */
  card('4.3', 'Four steps: Layer 3 switch inter-VLAN routing', 'Create VLANs, create SVIs, configure access ports, ip routing.');
  card('4.3', 'Command required for inter-VLAN routing on a Layer 3 switch', 'ip routing');
  card('4.3', 'Create a routed port', 'no switchport (then ip address, no shutdown)');
  card('4.3', 'Why configure OSPF on D1?', 'To advertise the VLAN subnets to R1 and learn R1\'s networks.');
  card('4.3', 'Five steps to route with R1', 'Configure routed port, enable routing, configure routing, verify routing (show ip route), verify connectivity (ping).');
  card('4.3', 'Symptom of missing ip routing', 'PCs can ping their own SVI but not hosts in other VLANs.');

  /* 4.4 */
  card('4.4', 'Four common inter-VLAN issue types', 'Missing VLANs, switch trunk port issues, switch access port issues, router configuration issues.');
  card('4.4', '"Access Mode VLAN: 10 (Inactive)" means…', 'VLAN 10 does not exist on the switch.');
  card('4.4', 'Most common router-on-a-stick fault', 'The switch port to the router is not a properly configured trunk.');
  card('4.4', 'Host has correct IP settings but cannot ping its gateway', 'Likely an access port in the wrong VLAN (or not an access port / disabled).');
  card('4.4', 'Find subinterface VLAN IDs quickly', 'show interfaces | include Gig|802.1Q');
  card('4.4', 'Three reasons a VLAN may be missing', 'Never created, accidentally deleted, not allowed on the trunk.');
  card('4.4', 'Verify missing VLANs', 'show vlan [brief], show interfaces switchport, ping');
})(typeof window !== 'undefined' ? window : globalThis);
