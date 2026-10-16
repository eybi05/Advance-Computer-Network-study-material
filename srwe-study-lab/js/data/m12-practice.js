/* Module 12 — WLAN Concepts: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, card } = root.SRWE.QuizKit;

  /* =============================== 12.1 =============================== */
  match('12.1', 'Match the wireless network type to its description.', [['WPAN', 'Short range, IEEE 802.15, e.g. Bluetooth'], ['WLAN', 'IEEE 802.11, up to about 300 ft'], ['WMAN', 'A city or district, licensed frequencies'], ['WWAN', 'National or global coverage']], 'Personal, local, metropolitan, wide area.');
  match('12.1', 'Match the 802.11 standard to its band.', [['802.11a', '5 GHz only'], ['802.11b', '2.4 GHz only, 11 Mb/s'], ['802.11ac', '5 GHz, up to 1.3 Gb/s'], ['802.11n', '2.4 and 5 GHz with MIMO']], '802.11g is 2.4 GHz at 54 Mb/s; 802.11ax uses both bands.');
  mc('12.1', 'Which 802.11 standard is backward compatible with 802.11b?', ['802.11g', '802.11a', '802.11ac', 'None'], 'Both use 2.4 GHz; 802.11a uses 5 GHz.');
  mc('12.1', 'What does 802.11ax provide?', ['High-Efficiency Wireless (HEW)', 'Only 2 Mb/s', 'Bluetooth pairing', 'WiMAX backhaul'], '802.11ax uses 2.4 and 5 GHz and can use the 1 and 7 GHz bands.');
  match('12.1', 'Match the organization to its role.', [['ITU', 'Allocates radio spectrum and satellite orbits'], ['IEEE', 'Specifies modulation and maintains 802 standards'], ['Wi-Fi Alliance', 'Promotes interoperability of 802.11 products']], 'The Wi-Fi Alliance is a vendor association.');
  multi('12.1', 'Which three 802.11 standards can operate in the 2.4 GHz band? (Choose three.)', 3, ['802.11b', '802.11g', '802.11n', '802.11a', '802.11ac'], '2.4 GHz: b, g, n, ax.');
  mc('12.1', 'Which wireless technology is an IEEE 802.16 alternative to wired broadband with a range up to 30 miles?', ['WiMAX', 'Bluetooth', 'Zigbee', 'Satellite broadband'], 'WiMAX (a WMAN technology).');
  tf('12.1', '802.11a and 802.11b devices can communicate with each other.', false, '802.11a uses 5 GHz and is not interoperable with 802.11b or g.');
  mc('12.1', 'Which Bluetooth type is optimised for audio streaming over point-to-point links?', ['Bluetooth BR/EDR', 'Bluetooth Low Energy', 'Bluetooth mesh', 'Zigbee'], 'BLE supports mesh topologies for large-scale device networks.');

  card('12.1', 'Four wireless network types', 'WPAN (802.15, Bluetooth/Zigbee, 6–9 m), WLAN (802.11, ~300 ft), WMAN (city), WWAN (national/global).');
  card('12.1', '802.11 standards by band', '2.4 GHz: 802.11 (2 Mb/s), b (11), g (54), n, ax.\n5 GHz: a (54), n, ac (to 1.3 Gb/s), ax.');
  card('12.1', 'Wireless standards organizations', 'ITU: spectrum and orbits. IEEE: modulation and 802 standards. Wi-Fi Alliance: vendor association for interoperability.');
  card('12.1', 'Other wireless technologies', 'Bluetooth (BLE, BR/EDR), WiMAX (802.16, ~50 km), cellular broadband (GSM, CDMA), satellite broadband (line of sight).');

  /* =============================== 12.2 =============================== */
  multi('12.2', 'Which three functions does a wireless home router combine? (Choose three.)', 3, ['Access point', 'Switch', 'Router', 'WLC', 'RADIUS server', 'Satellite modem'], 'AP for wireless clients, switch for wired devices, router as default gateway.');
  mc('12.2', 'What are controller-based APs also called?', ['Lightweight APs (LAPs)', 'Autonomous APs', 'Rogue APs', 'Mesh routers'], 'They are configured and managed by a WLC.');
  mc('12.2', 'How is an autonomous AP configured?', ['Individually, through its own CLI or GUI', 'Automatically by a WLC', 'By DHCP option 43 only', 'It needs no configuration'], 'Each autonomous AP is configured and managed manually.');
  match('12.2', 'Match the antenna type to its use.', [['Omnidirectional', '360-degree coverage in homes and offices'], ['Directional (Yagi, dish)', 'Focuses the signal in one direction'], ['MIMO', 'Up to eight antennas to increase bandwidth']], 'Directional antennas suit long point-to-point links.');
  mc('12.2', 'A laptop has no built-in wireless NIC. What can be used?', ['A USB wireless adapter', 'A serial cable', 'An SFP module', 'A WLC'], 'Most devices have integrated wireless NICs.');
  order('12.2', 'Put the steps a client takes to use an AP in order.', ['Discover the AP', 'Authenticate', 'Associate'], 'After that the client can use network resources.');
  tf('12.2', 'Lightweight APs require manual configuration on each AP before they work.', false, 'The WLC configures and manages them automatically.');
  mc('12.2', 'Which protocol does the deck say LAPs use to talk to the WLC?', ['LWAPP', 'DTP', 'PAgP', 'HSRP'], 'Modern controllers use CAPWAP, which is based on LWAPP (topic 12.4).');

  card('12.2', 'Autonomous vs controller-based APs', 'Autonomous: standalone, configured one by one (CLI/GUI).\nController-based (lightweight): managed and configured automatically by a WLC (LWAPP/CAPWAP).');
  card('12.2', 'Wireless home router roles', 'Access point + Ethernet switch + router (default gateway to the internet).');
  card('12.2', 'Antenna types', 'Omnidirectional (360°), directional (Yagi, parabolic dish), MIMO (up to 8 antennas for more bandwidth).');
  card('12.2', 'Client steps with an AP', 'Discover → authenticate → associate, then use the network.');

  /* =============================== 12.3 =============================== */
  match('12.3', 'Match the topology mode to its description.', [['Ad hoc', 'Peer to peer without an AP'], ['Infrastructure', 'Clients connect through an AP'], ['Tethering', 'A phone shares its cellular data as a hotspot']], 'Tethering is a variation of ad hoc.');
  mc('12.3', 'What is an Extended Service Set (ESS)?', ['Two or more BSSs connected by a wired distribution system', 'A single AP and its clients', 'Two clients in ad hoc mode', 'A WLC and its RADIUS server'], 'Clients in each BSS can communicate through the ESS.');
  mc('12.3', 'Which access method do WLANs use?', ['CSMA/CA', 'CSMA/CD', 'Token passing', 'Full duplex with no contention'], 'A wireless client cannot hear while it sends, so it avoids collisions.');
  order('12.3', 'Put the CSMA/CA steps in order.', ['Listen until the channel is idle', 'Send an RTS to the AP', 'Receive a CTS from the AP', 'Transmit the data', 'Receive an acknowledgment'], 'No CTS or no ACK → wait a random time and start again.');
  multi('12.3', 'Which three parameters must a client and AP agree on to associate? (Choose three.)', 3, ['SSID', 'Security mode', 'Channel settings', 'MAC address table size', 'STP priority', 'Native VLAN'], 'Also the password and the network mode (802.11 standard).');
  mc('12.3', 'In passive discovery mode, how does a client learn about an AP?', ['The AP sends periodic broadcast beacon frames', 'The client sends probe requests', 'The client asks DHCP', 'The WLC phones the client'], 'In active mode the client sends probe requests and must know the SSID.');
  tf('12.3', 'WLANs operate in full duplex.', false, 'WLANs are half duplex.');
  mc('12.3', 'Which field is part of the 802.11 frame header but not the Ethernet header?', ['Address 4', 'Destination MAC', 'EtherType', 'Preamble'], 'The 802.11 header has Frame Control, Duration, Address 1–3, Sequence Control and Address 4.');
  mc('12.3', 'Clients in two different BSSs that are not part of an ESS want to communicate. What happens?', ['They cannot communicate', 'They communicate directly', 'They use CSMA/CD', 'They form an ad hoc network automatically'], 'Clients in different BSSs need the ESS distribution system.');

  card('12.3', 'BSS vs ESS', 'BSS: one AP interconnects its clients.\nESS: two or more BSSs joined by a wired distribution system; clients communicate through it.');
  card('12.3', 'CSMA/CA', 'Listen → RTS → CTS (none: wait random time) → send data → ACK (none: assume collision, retry). WLANs are half duplex.');
  card('12.3', 'Association parameters', 'SSID, password, network mode (802.11 standard), security mode (WEP/WPA/WPA2), channel.');
  card('12.3', 'Passive vs active discovery', 'Passive: AP broadcasts beacons (SSID, standards, security).\nActive: client broadcasts probe requests on several channels (must know the SSID).');
  card('12.3', '802.11 frame', 'Header (Frame Control, Duration, Address 1, 2, 3, Sequence Control, Address 4) + payload + FCS.');

  /* =============================== 12.4 =============================== */
  mc('12.4', 'What does CAPWAP do?', ['Lets a WLC manage multiple APs and WLANs', 'Encrypts traffic between two clients', 'Assigns IP addresses to clients', 'Bundles Ethernet links'], 'CAPWAP is based on LWAPP and adds DTLS security.');
  mc('12.4', 'Which UDP ports does CAPWAP use?', ['5246 and 5247', '67 and 68', '1812 and 1813', '546 and 547'], 'Control traffic on 5246, data on 5247.');
  multi('12.4', 'Which two are AP MAC functions in the split MAC architecture? (Choose two.)', 2, ['Beacons and probe responses', 'Packet acknowledgments and retransmissions', 'Authentication', 'Association of roaming clients'], 'Authentication and association belong to the WLC.');
  multi('12.4', 'Which two are WLC MAC functions in the split MAC architecture? (Choose two.)', 2, ['Authentication', 'Frame translation to other protocols', 'MAC layer data encryption', 'Frame queueing and prioritization'], 'Encryption and queueing stay on the AP.');
  mc('12.4', 'Which CAPWAP traffic does DTLS encrypt by default?', ['The control channel', 'All data traffic', 'Nothing', 'Only beacons'], 'Data encryption needs a DTLS license and must be enabled.');
  match('12.4', 'Match the FlexConnect mode to its condition.', [['Connected mode', 'The WLC is reachable and performs all CAPWAP functions'], ['Standalone mode', 'The WLC is unreachable; the AP switches traffic and authenticates locally'], ['CAPWAP tunnel', 'Carries control and data between the AP and the WLC']], 'FlexConnect lets APs be managed across a WAN.');
  tf('12.4', 'CAPWAP works over both IPv4 and IPv6.', true, 'The deck lists both.');
  mc('12.4', 'Which protocol is CAPWAP based on?', ['LWAPP', 'PAgP', 'RADIUS', 'SNMP'], 'CAPWAP extends LWAPP with DTLS.');

  card('12.4', 'CAPWAP', 'Control and Provisioning of Wireless Access Points: WLC manages APs/WLANs; based on LWAPP + DTLS; UDP 5246 (control) and 5247 (data); IPv4 and IPv6.');
  card('12.4', 'Split MAC architecture', 'AP: beacons/probe responses, ACKs/retransmissions, queueing/prioritisation, MAC encryption.\nWLC: authentication, association/roaming, frame translation, terminating 802.11 traffic on the wire.');
  card('12.4', 'DTLS in CAPWAP', 'Control channel encrypted by default. Data encryption disabled by default; needs a DTLS license on the WLC.');
  card('12.4', 'FlexConnect', 'Manage APs over a WAN. Connected mode: WLC reachable. Standalone mode: WLC unreachable; AP switches and authenticates locally.');

  /* =============================== 12.5 =============================== */
  mc('12.5', 'Which three 2.4 GHz channels are non-overlapping?', ['1, 6 and 11', '1, 2 and 3', '1, 5 and 9', '36, 48 and 60'], 'Each 2.4 GHz channel is 22 MHz wide and only 5 MHz from the next.');
  mc('12.5', 'Which channels does the course give as non-overlapping in the 5 GHz band?', ['36, 48 and 60', '1, 6 and 11', '1, 2 and 3', '149, 150 and 151'], '5 GHz channels are 20 MHz apart; the course spaces them as 36, 48, 60.');
  match('12.5', 'Match the modulation technique to its use.', [['DSSS', '802.11b, spreads the signal over a wider band'], ['FHSS', 'Original 802.11, hops between channels'], ['OFDM', '802.11a/g/n/ac, many sub-channels']], 'Sender and receiver must be synchronised for FHSS.');
  mc('12.5', 'How wide is each 2.4 GHz channel?', ['22 MHz', '5 MHz', '20 MHz', '40 MHz'], 'Channels are 22 MHz wide and spaced 5 MHz apart.');
  mc('12.5', 'How many channels does the deck list for the 5 GHz band (802.11a/n/ac)?', ['24', '11', '3', '14'], 'Each separated by 20 MHz.');
  multi('12.5', 'Which three factors affect how many users a WLAN supports? (Choose three.)', 3, ['The layout of the facility', 'The data rates users expect', 'Non-overlapping channels and transmit power', 'The colour of the AP', 'The VLAN ID', 'The STP mode'], 'Also the number of bodies and devices in a space.');
  tf('12.5', 'Neighbouring APs should use the same channel so clients can roam between them.', false, 'Neighbouring APs should use different, non-overlapping channels; roaming works with the same SSID.');
  mc('12.5', 'What happens when demand for one wireless channel is too high?', ['The channel becomes saturated and quality drops', 'The AP switches to 10 GHz', 'Clients use CSMA/CD', 'The channel splits automatically into VLANs'], 'Spread spectrum and OFDM help use channels more efficiently.');

  card('12.5', 'Non-overlapping channels', '2.4 GHz: 1, 6, 11 (22 MHz wide, 5 MHz apart).\n5 GHz: 24 channels 20 MHz apart; course answer 36, 48, 60.');
  card('12.5', 'DSSS, FHSS, OFDM', 'DSSS: spreads the signal (802.11b). FHSS: hops channels, synchronised (original 802.11). OFDM: many sub-channels (802.11a/g/n/ac).');
  card('12.5', 'WLAN capacity factors', 'Facility layout, number of people/devices, expected data rates, non-overlapping channels and transmit power.');
  card('12.5', 'AP placement', 'Plan with the approximate circular coverage area of each AP; overlapping cells use different channels.');

  /* =============================== 12.6 =============================== */
  multi('12.6', 'Which four are wireless threats listed in the deck? (Choose four.)', 4, ['Interception of data', 'Wireless intruders', 'DoS attacks', 'Rogue APs', 'VLAN double tagging', 'STP root takeover'], 'The last two are wired LAN attacks.');
  mc('12.6', 'What is a rogue AP?', ['An AP or wireless router connected to the corporate network without authorization', 'An AP with a broken antenna', 'An AP managed by a WLC', 'An AP on channel 14'], 'It can be used to capture traffic or launch MITM attacks.');
  mc('12.6', 'What is an evil twin attack?', ['A rogue AP uses the same SSID as a legitimate AP', 'Two APs on the same channel', 'A client with two NICs', 'A DoS attack using two jammers'], 'It is a wireless man-in-the-middle attack.');
  mc('12.6', 'How can organizations prevent rogue APs?', ['Configure WLCs with rogue AP policies and monitor the radio spectrum', 'Hide the SSID', 'Use only 2.4 GHz', 'Disable DHCP'], 'Monitoring software looks for unauthorized APs.');
  multi('12.6', 'Which three can cause a wireless DoS? (Choose three.)', 3, ['Improperly configured devices', 'A malicious user interfering with the signal', 'Accidental interference', 'Using WPA3', 'Using non-overlapping channels'], 'Harden devices, keep passwords secure, back up, change configs off-hours.');
  tf('12.6', 'A personal hotspot on an authorized laptop can act as a rogue AP.', true, 'For example a Windows host turned into a Wi-Fi AP.');
  mc('12.6', 'What is the first step in defeating a wireless MITM attack?', ['Identify legitimate devices by authenticating users', 'Turn off all APs', 'Switch to channel 6', 'Use WEP'], 'After that the network can be monitored for abnormal devices or traffic.');
  mc('12.6', 'Which practice reduces the risk of DoS from misconfiguration?', ['Make configuration changes off-hours and keep backups', 'Use default passwords', 'Disable logging', 'Use open authentication'], 'Also harden devices and keep passwords secure.');

  card('12.6', 'WLAN threats', 'Interception of data, wireless intruders, DoS attacks, rogue APs (and evil twin MITM).');
  card('12.6', 'Rogue AP', 'Unauthorized AP/wireless router (or hotspot) on the corporate network. Prevent with WLC rogue AP policies and spectrum monitoring.');
  card('12.6', 'Evil twin', 'Rogue AP with the same SSID as a legitimate AP → MITM. Defence: authenticate users, monitor for abnormal devices/traffic.');
  card('12.6', 'Reducing wireless DoS risk', 'Harden devices, keep passwords secure, create backups, make configuration changes off-hours.');

  /* =============================== 12.7 =============================== */
  match('12.7', 'Match the method to its encryption.', [['WEP', 'RC4 with a static key'], ['WPA', 'TKIP'], ['WPA2', 'AES'], ['WPA3', 'Latest methods, Protected Management Frames required']], 'Never use WEP.');
  mc('12.7', 'Which mode should a home user choose so no authentication server is needed?', ['Personal (PSK)', 'Enterprise', 'Open with RADIUS', 'WEP shared key'], 'Personal uses a pre-shared key.');
  mc('12.7', 'What does WPA2-Enterprise require?', ['A RADIUS server and 802.1X/EAP', 'Only a pre-shared key', 'MAC filtering', 'SSID cloaking'], 'Users authenticate with 802.1X through the RADIUS server.');
  multi('12.7', 'Which three pieces of information must be configured to use a RADIUS server? (Choose three.)', 3, ['The RADIUS server IP address', 'The UDP port numbers', 'A shared key', 'The client MAC addresses', 'The SSID of every client'], 'Ports 1812/1813 or 1645/1646.');
  mc('12.7', 'Which UDP port does RADIUS authentication use?', ['1812', '1813', '5246', '67'], '1813 is RADIUS accounting.');
  mc('12.7', 'Which WPA3 feature thwarts brute-force attacks in Personal mode?', ['SAE', 'OWE', 'DPP', 'TKIP'], 'Simultaneous Authentication of Equals.');
  match('12.7', 'Match the WPA3 feature to its purpose.', [['SAE', 'WPA3-Personal, resists brute force'], ['OWE', 'Encryption on open networks'], ['DPP', 'Onboarding IoT devices'], ['192-bit suite', 'WPA3-Enterprise']], 'WPA3 also requires Protected Management Frames.');
  mc('12.7', 'What does CCMP, used with AES in WPA2, allow the receiver to detect?', ['Whether the encrypted and unencrypted bits were altered', 'The client\'s location', 'Rogue APs', 'Channel overlap'], 'CCMP adds integrity protection.');
  tf('12.7', 'SSID cloaking and MAC address filtering are strong enough to secure a WLAN on their own.', false, 'They are early, weak features; use WPA2 or WPA3.');
  mc('12.7', 'Which authentication method needs no password and is typical in cafés and airports?', ['Open system authentication', 'Shared key authentication', 'WPA2-Enterprise', 'WPA3-Personal'], 'The client must provide its own security, for example a VPN.');

  card('12.7', 'Shared key methods', 'WEP (RC4, static key, never use), WPA (TKIP), WPA2 (AES-CCMP), WPA3 (latest, PMF required).');
  card('12.7', 'Personal vs Enterprise', 'Personal: pre-shared key, no server (home/SOHO).\nEnterprise: RADIUS server, users authenticate with 802.1X/EAP.');
  card('12.7', 'RADIUS settings on an AP/WLC', 'Server IP, UDP ports (1812 authentication, 1813 accounting; or 1645/1646), shared key.');
  card('12.7', 'WPA3 features', 'Personal: SAE. Enterprise: 802.1X/EAP with 192-bit suite. Open: OWE encryption. IoT: DPP onboarding.');
  card('12.7', 'SSID cloaking and MAC filtering', 'Cloaking hides the SSID beacon; MAC filtering permits/denies by MAC. Both are early, weak features.');
})(typeof window !== 'undefined' ? window : globalThis);
