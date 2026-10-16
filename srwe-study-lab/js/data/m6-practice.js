/* Module 6 — EtherChannel: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 6.1 =============================== */
  mc('6.1', 'Why are two parallel links between S1 and S2 not both used without EtherChannel?', ['STP blocks one of them to prevent a loop', 'Switches cannot have two links to the same neighbour', 'Only one link can be a trunk', 'Duplex mismatch'], 'Parallel links form a loop, so STP blocks one.');
  mc('6.1', 'What is the logical interface created by EtherChannel called?', ['Port channel', 'Subinterface', 'SVI', 'Loopback'], 'The bundle appears as interface Port-channel N.');
  multi('6.1', 'Which three are advantages of EtherChannel? (Choose three.)', 3, ['Configuration is done once on the port-channel interface', 'Load balancing across the member links', 'STP sees one logical link, so the links are not blocked',
    'It works across different interface types, such as Fa and Gi together', 'It removes the need for VLANs', 'It replaces STP'], 'Members must be the same type; EtherChannel works together with STP.');
  mc('6.1', 'What is the maximum number of ports in one EtherChannel?', ['8', '2', '4', '16'], 'Up to eight compatibly configured ports: 800 Mb/s Fast EtherChannel or 8 Gb/s Gigabit EtherChannel.');
  mc('6.1', 'How many EtherChannels does a Catalyst 2960 support?', ['6', '2', '8', '64'], 'The deck lists six for the 2960.');
  match('6.1', 'Match the mode to its protocol behaviour.', [['desirable', 'PAgP, actively negotiates'], ['auto', 'PAgP, only answers'], ['active', 'LACP, actively negotiates'], ['passive', 'LACP, only answers'], ['on', 'No negotiation protocol']], 'PAgP: desirable/auto. LACP: active/passive. On: static.');
  multi('6.1', 'Which three mode combinations form an EtherChannel? (Choose three.)', 3, ['active – passive', 'desirable – auto', 'on – on', 'passive – passive', 'auto – auto', 'on – active'], 'One side must negotiate actively, and on only works with on.');
  mc('6.1', 'Which negotiation protocol should be used between a Cisco switch and another vendor\'s switch?', ['LACP', 'PAgP', 'DTP', 'CDP'], 'LACP is IEEE 802.3ad; PAgP is Cisco proprietary.');
  tf('6.1', 'Losing one physical link inside an EtherChannel causes STP to recalculate the topology.', false, 'The logical link stays up, so the topology does not change.');
  mc('6.1', 'How often does PAgP send its packets?', ['Every 30 seconds', 'Every 2 seconds', 'Every 10 seconds', 'Only once when the channel forms'], 'PAgP packets every 30 seconds manage the channel.');

  card('6.1', 'EtherChannel in one sentence', 'Bundles up to 8 identical physical Ethernet links into one logical link (port channel) that STP treats as a single port.');
  card('6.1', 'PAgP modes vs LACP modes', 'PAgP (Cisco): on, desirable (active), auto (passive).\nLACP (IEEE 802.3ad): on, active, passive.');
  card('6.1', 'Mode combinations that never form a channel', 'auto/auto, passive/passive, on with any negotiating mode, and PAgP with LACP.');
  card('6.1', 'EtherChannel restrictions', 'Same interface type; up to 8 ports; same speed, duplex and VLAN settings; trunks need the same native VLAN; 2960 supports 6 EtherChannels.');
  card('6.1', 'Bandwidth of a full EtherChannel', 'Up to 800 Mb/s (8 × Fast Ethernet) or 8 Gb/s (8 × Gigabit Ethernet), full duplex.');

  /* =============================== 6.2 =============================== */
  order('6.2', 'Put the LACP EtherChannel configuration steps in order.', ['interface range fa0/1 - 2', 'channel-group 1 mode active', 'interface port-channel 1', 'switchport mode trunk'], 'Members first, then the channel group, then settings on the port channel.');
  cli('6.2', 'Add the selected interfaces to channel group 1 using LACP, actively negotiating.', 'S1(config-if-range)#', 'channel-group 1 mode active', 'mode active = LACP active.');
  cli('6.2', 'Add the selected interfaces to channel group 2 using PAgP, actively negotiating.', 'S1(config-if-range)#', 'channel-group 2 mode desirable', 'mode desirable = PAgP active.');
  cli('6.2', 'Enter configuration mode for the logical interface of channel group 1.', 'S1(config)#', 'interface port-channel 1', 'Configure trunking and VLAN settings here.');
  tf('6.2', 'Settings configured on the port-channel interface are applied to all member interfaces.', true, 'Configuration on the port channel affects all members; the reverse is not true.');
  multi('6.2', 'Which two settings must match on all ports of a trunking EtherChannel? (Choose two.)', 2, ['Allowed VLAN range', 'Speed and duplex', 'Interface description', 'Port number'], 'Speed, duplex, VLAN membership and allowed VLANs must match. Descriptions and numbers do not matter; ports need not be contiguous.');
  mc('6.2', 'Which modes can a port channel use? (Pick the best answer.)', ['Access, trunk or routed', 'Trunk only', 'Access only', 'Routed only'], 'Trunk is the most common.');
  tf('6.2', 'The member interfaces of an EtherChannel must be physically next to each other.', false, 'There is no requirement that they are contiguous.');
  cli('6.2', 'Select Fa0/1 through Fa0/2 together.', 'S1(config)#', 'interface range fa0/1 - 2', 'interface range selects several interfaces at once.');
  mc('6.2', 'Members of a channel have different allowed VLAN lists and use PAgP desirable. What happens?', ['They do not form an EtherChannel', 'They form a channel that carries only the common VLANs', 'They form a channel and STP blocks one member', 'The switch merges the lists'], 'The allowed VLAN range must be the same on every interface.');

  card('6.2', 'Three steps to configure LACP', '1. interface range (select members)\n2. channel-group N mode active\n3. interface port-channel N → Layer 2 settings (e.g. switchport mode trunk)');
  card('6.2', 'Where do trunk settings for an EtherChannel go?', 'On interface port-channel N. They are applied to every member.');
  card('6.2', 'EtherChannel configuration guidelines', 'Supported interfaces (need not be contiguous), same speed and duplex, same VLAN or all trunks, same allowed VLAN range.');
  card('6.2', 'Command that creates the port channel', 'channel-group N mode {active | passive | desirable | auto | on} on the member interfaces.');

  /* =============================== 6.3 =============================== */
  match('6.3', 'Match the verification command to what it shows.', [['show etherchannel summary', 'One line per port channel with flags and members'], ['show interfaces port-channel', 'General status of the port-channel interface'],
    ['show etherchannel port-channel', 'Details of one port channel'], ['show interfaces etherchannel', 'The role of a member interface']], 'The summary is the one you use first.');
  mc('6.3', 'In show etherchannel summary, what does Po1(SU) mean?', ['Layer 2 port channel in use', 'Suspended and up', 'Standby unit', 'Shut down by the user'], 'S = Layer 2, U = in use.');
  mc('6.3', 'A member port shows (P). What does it mean?', ['Bundled in the port channel', 'PAgP is used', 'Port security is on', 'The port is passive'], 'P = bundled in the port channel.');
  multi('6.3', 'Which three mismatches stop ports from forming an EtherChannel? (Choose three.)', 3, ['Different native VLANs', 'Different allowed VLAN lists', 'mode on on one side and desirable on the other', 'Different interface descriptions', 'Different port numbers on each switch', 'Different hostnames'], 'Descriptions, port numbers and hostnames do not matter.');
  mc('6.3', 'S1 shows Po1(SD) with protocol "-". S1 uses mode on and S2 uses desirable. What is the fix?', ['Change S1 to desirable (remove and re-add the port channel)', 'Change S2 to auto', 'Shut down Po1 on S2', 'Change the native VLAN'], 'On never negotiates; S1 must also use PAgP (desirable or auto, with S2 desirable).');
  tf('6.3', 'The deck recommends removing interface port-channel 1 and re-adding the members with channel-group when you change the mode.', true, 'Changing it directly can cause STP errors that block or errdisable ports.');
  cli('6.3', 'Show one line of status for every port channel.', 'S1#', 'show etherchannel summary', 'show etherchannel summary is the quickest check.');
  cli('6.3', 'Remove port channel 1.', 'S1(config)#', 'no interface port-channel 1', 'This removes the logical interface so you can recreate the channel cleanly.');
  mc('6.3', 'Trunking is configured on Fa0/1 but not on Fa0/2 of the same channel. What is the recommendation?', ['Configure trunking on the port-channel interface and verify it there', 'Configure trunking only on the first member', 'Use mode on', 'Remove one of the ports'], 'The deck: do not configure trunking on individual members; configure and verify it on the EtherChannel.');

  card('6.3', 'Four EtherChannel verification commands', 'show interfaces port-channel\nshow etherchannel summary\nshow etherchannel port-channel\nshow interfaces etherchannel');
  card('6.3', 'Healthy vs broken in show etherchannel summary', 'Healthy: Po1(SU) with members (P).\nBroken: (SD)/(D) down, (s) suspended, (I) stand-alone, protocol "-" (mode on).');
  card('6.3', 'Common EtherChannel issues', 'Members in different VLANs or not all trunks; different native VLANs; trunking on some members only; different allowed VLANs; incompatible PAgP/LACP modes.');
  card('6.3', 'How to change the channel mode safely', 'no interface port-channel N, then interface range … and channel-group N mode <new mode>, then reconfigure interface port-channel N.');
})(typeof window !== 'undefined' ? window : globalThis);
