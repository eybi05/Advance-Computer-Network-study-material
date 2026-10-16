/* Module 13 — WLAN Configuration: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, card } = root.SRWE.QuizKit;

  /* =============================== 13.1 =============================== */
  mc('13.1', 'What should be your first priority when setting up a new wireless router?', ['Change the default username and password', 'Change the channel', 'Enable QoS', 'Set up port forwarding'], 'Default credentials and addresses are published on the internet.');
  order('13.1', 'Put the basic network setup steps in order.', ['Log in to the router from a web browser', 'Change the default administrative password', 'Log in with the new password', 'Change the default DHCP IPv4 addresses', 'Renew the IP address', 'Log in at the new IP address'], 'From the deck.');
  order('13.1', 'Put the basic wireless setup steps in order.', ['View the WLAN defaults', 'Change the network mode', 'Configure the SSID', 'Configure the channel', 'Configure the security mode', 'Configure the passphrase'], 'From the deck.');
  mc('13.1', 'Beyond which approximate range should you build a wireless mesh?', ['45 m indoors and 90 m outdoors', '5 m indoors and 10 m outdoors', '300 m indoors', '1 km outdoors'], 'Add APs with the same settings except the channel.');
  mc('13.1', 'In a wireless mesh, which setting should differ between the APs?', ['The channel', 'The SSID', 'The security mode', 'The passphrase'], 'Different channels prevent interference.');
  mc('13.1', 'How does NAT share one public IPv4 address among many devices?', ['By tracking source port numbers for every session', 'By giving each device a public address', 'By using MAC addresses', 'By using VLANs'], 'NAT translates private to public and back using the port numbers.');
  match('13.1', 'Match the feature to its purpose.', [['QoS', 'Prioritise voice and video over email and web'], ['Port forwarding', 'Rule-based forwarding of a port to a device'], ['Port triggering', 'Temporarily open inbound ports after an outbound request'], ['NAT', 'Translate private addresses to a public address']], 'All are typical wireless router features.');
  multi('13.1', 'Which three services does a typical wireless home router provide? (Choose three.)', 3, ['DHCP', 'NAT', 'QoS', 'BGP routing', 'RADIUS server', 'EtherChannel'], 'Also WLAN security and a switch for wired clients.');
  tf('13.1', 'Cable or DSL modem configuration is usually done by the service provider.', true, 'On site or remotely.');

  card('13.1', 'Basic network setup (wireless router)', 'Log in → change admin password → log in again → change the LAN/DHCP subnet → renew the client address → log in at the new IP.');
  card('13.1', 'Basic wireless setup', 'View defaults → network mode → SSID → channel (non-overlapping) → security mode → passphrase.');
  card('13.1', 'Wireless mesh', 'Beyond ~45 m indoors / ~90 m outdoors: add APs with the same settings except the channel.');
  card('13.1', 'Port forwarding vs port triggering', 'Forwarding: a rule always sends a port to a device. Triggering: inbound ports open temporarily after an outbound request on a designated port range.');

  /* =============================== 13.2 =============================== */
  mc('13.2', 'Why does a lightweight AP need no initial configuration?', ['The WLC configures and manages it', 'It uses the factory SSID', 'It copies settings from the switch', 'It runs ad hoc mode'], 'Controller-based APs are managed centrally.');
  mc('13.2', 'Which WLC page is a dashboard of WLANs, APs, active clients and rogue devices?', ['Network Summary', 'Interfaces', 'DHCP Scope', 'Trap Receivers'], 'It gives a quick overview.');
  mc('13.2', 'How does the WLC know which switch port an AP is connected to?', ['Through CDP', 'Through DHCP', 'Through STP', 'Through ARP'], 'CDP is active on the network in the deck\'s example.');
  order('13.2', 'Put the basic WLAN configuration steps on the WLC in order.', ['Create the WLAN', 'Apply and enable the WLAN', 'Select the interface', 'Secure the WLAN', 'Verify the WLAN is operational', 'Monitor the WLAN'], 'Then view the client details.');
  tf('13.2', 'The physical ports of a WLC are essentially trunk ports.', true, 'They carry traffic from multiple VLANs.');
  mc('13.2', 'On a Cisco 3504 controller, how do you reach all features from the basic view?', ['Click Advanced in the upper right corner', 'Reboot into ROMMON', 'Use the AP console', 'Press the Mode button'], 'The Advanced Summary page gives access to everything.');
  multi('13.2', 'Which two statements about WLANs on a WLC are true? (Choose two.)', 2, ['Each AP can support multiple WLANs', 'Each physical WLC port can support many APs and WLANs', 'Each WLAN needs its own physical WLC port', 'APs cannot share an SSID'], 'Virtual interfaces map WLANs to VLANs.');
  mc('13.2', 'In the deck\'s topology, what is the WLC management address?', ['192.168.200.254', '192.168.200.1', '172.16.1.1', '192.168.200.3'], '192.168.200.3 is AP1, .1 is R1.');

  card('13.2', 'Basic WLAN on a WLC', 'Create the WLAN (profile, SSID, ID) → enable → select the interface → secure (Security tab) → verify (WLANs) → monitor (Monitor tab) → client details (Clients).');
  card('13.2', 'Lightweight APs and the WLC', 'LAPs need no initial configuration; they join the WLC, which configures and manages them. CDP shows the AP\'s switch port.');
  card('13.2', 'WLC interfaces and ports', 'Physical ports are essentially trunks carrying many VLANs; virtual interfaces (like VLAN interfaces) map WLANs to VLANs.');
  card('13.2', 'Network Summary page', 'Dashboard: configured WLANs, associated APs, active clients, rogue APs and clients.');

  /* =============================== 13.3 =============================== */
  mc('13.3', 'Which server is required for a WPA2 Enterprise WLAN?', ['RADIUS', 'SNMP', 'DNS', 'TFTP'], 'Users are authenticated by the RADIUS (AAA) server.');
  mc('13.3', 'Where do you configure the WLC to send SNMP traps to a server?', ['MANAGEMENT > SNMP > Trap Receivers', 'SECURITY > RADIUS > Authentication', 'CONTROLLER > Interfaces', 'WLANs > Create New'], 'Enter the community name and the server address.');
  mc('13.3', 'Where do you add a RADIUS server on the WLC?', ['SECURITY > RADIUS > Authentication > New', 'MANAGEMENT > SNMP', 'CONTROLLER > Interfaces', 'MONITOR > Clients'], 'Enter the server IP address and the shared secret.');
  order('13.3', 'Put the steps to create a new VLAN interface on the WLC in order.', ['Create a new interface', 'Configure the VLAN name and ID', 'Configure the port and interface address', 'Configure the DHCP server address', 'Apply and confirm', 'Verify the interfaces'], 'CONTROLLER > Interfaces > New…');
  mc('13.3', 'Which security does a newly created WLAN on the WLC use by default?', ['WPA2 with AES and 802.1X', 'Open authentication', 'WEP', 'WPA with TKIP'], 'You only need to select the RADIUS server on the AAA Servers tab.');
  mc('13.3', 'Why does every WLAN on the WLC need its own virtual interface?', ['To map the WLAN to its VLAN and subnet', 'To give each AP an IP address', 'To run STP', 'To encrypt CAPWAP'], 'The interface defines the VLAN, address, gateway and DHCP server.');
  multi('13.3', 'Which three settings do you configure for a WLC internal DHCP scope? (Choose three.)', 3, ['The scope name', 'The address pool', 'The default router', 'The RADIUS shared secret', 'The SSID', 'The trap community'], 'Then set the scope to Enabled.');
  tf('13.3', 'The WLAN in the deck\'s WPA2 Enterprise example is mapped to the interface vlan5.', true, 'It uses VLAN 5 and 192.168.5.0/24.');
  mc('13.3', 'What does AAA stand for, correcting the deck\'s summary slide?', ['Authentication, authorization and accounting', 'Authentication, accounting and auditing', 'Access, authority and audit', 'Authorization, availability and accounting'], 'Slide 73 says "auditing".');

  card('13.3', 'WPA2 Enterprise on a WLC: building blocks', 'RADIUS server (SECURITY > RADIUS > Authentication: IP + shared secret), VLAN interface (CONTROLLER > Interfaces), DHCP source, WLAN on that interface with 802.1X and the RADIUS server selected.');
  card('13.3', 'New WLC interface', 'Name + VLAN ID, physical port, interface IP/mask, gateway, primary DHCP server; Apply; verify in the Interfaces list.');
  card('13.3', 'WLC internal DHCP scope', 'Internal DHCP Server > DHCP Scope > New: name, then pool range, default router, Status Enabled, Apply.');
  card('13.3', 'SNMP traps on a WLC', 'MANAGEMENT > SNMP > Trap Receivers > New: community name and server IPv4/IPv6 address.');

  /* =============================== 13.4 =============================== */
  order('13.4', 'Put the six troubleshooting steps in order.', ['Identify the problem', 'Establish a theory of probable causes', 'Test the theory to determine the cause', 'Establish a plan of action and implement the solution', 'Verify full system functionality and implement preventive measures', 'Document findings, actions and outcomes'], 'Based on the scientific method.');
  multi('13.4', 'A wireless client has no connectivity. Which two checks come first? (Choose two.)', 2, ['Confirm its configuration with ipconfig', 'Ping a known address on the wired network', 'Upgrade the WLC firmware', 'Replace the switch'], 'Then drivers/NIC and the security settings.');
  multi('13.4', 'A PC is connected but the wireless connection is poor. Which three things should you check? (Choose three.)', 3, ['Whether the PC is outside the coverage area (BSA)', 'The channel settings on the client', 'Interference in the 2.4 GHz band', 'The STP root bridge', 'The HSRP priority'], 'From the deck.');
  multi('13.4', 'Which two methods optimise the bandwidth of dual-band routers and APs? (Choose two.)', 2, ['Upgrade old wireless clients', 'Split the traffic between 2.4 GHz and 5 GHz', 'Use channel 1 on every AP', 'Disable WPA2'], 'Older clients slow the entire WLAN.');
  mc('13.4', 'What is the simplest way to segment traffic between the two bands of a dual-band router?', ['Rename one of the wireless networks', 'Turn off DHCP', 'Use MAC filtering', 'Lower the transmit power'], 'Both bands use the same name by default.');
  mc('13.4', 'Which band is ideal for streaming multimedia?', ['5 GHz', '2.4 GHz', '900 MHz', 'It makes no difference'], '5 GHz is less crowded and has more channels.');
  mc('13.4', 'On a Cisco 3504 WLC, where do you find the AP Image Pre-download section?', ['WIRELESS > Access Points > Global Configuration', 'SECURITY > RADIUS', 'MANAGEMENT > SNMP', 'CONTROLLER > Interfaces'], 'It upgrades the firmware of all controlled APs.');
  tf('13.4', 'Furniture and tall appliances near an AP can shorten the range of a WLAN.', true, 'Keep the AP free of obstructions; otherwise consider a range extender or Powerline.');
  mc('13.4', 'Why should you check router and AP firmware periodically?', ['Releases fix reported problems and security vulnerabilities', 'Firmware expires after a year', 'It resets the passwords', 'It changes the SSID'], 'From the deck\'s summary.');

  card('13.4', 'Six troubleshooting steps', '1 Identify the problem. 2 Theory of probable causes. 3 Test the theory. 4 Plan and implement the solution. 5 Verify and prevent. 6 Document.');
  card('13.4', 'Client not connecting', 'ipconfig; ping the wired network; reload drivers / other NIC; check security mode and encryption. Poor link: BSA, channel, 2.4 GHz interference.');
  card('13.4', 'Slow WLAN fixes', 'Upgrade old clients (b/g/n slow everyone); split traffic between 2.4 GHz (basic) and 5 GHz (streaming); rename one band\'s SSID; remove obstructions; range extender or Powerline.');
  card('13.4', 'AP firmware on a WLC', 'WIRELESS > Access Points > Global Configuration > AP Image Pre-download (Cisco 3504).');
})(typeof window !== 'undefined' ? window : globalThis);
