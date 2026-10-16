/* Module 5 — STP Concepts: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 5.1 =============================== */
  mc('5.1', 'What is the main purpose of the Spanning Tree Protocol?', [
    'To prevent Layer 2 loops while keeping redundant physical links',
    'To load-balance traffic over all redundant links',
    'To route packets between VLANs',
    'To assign IP addresses to switch ports'], 'STP logically blocks redundant paths so there is one loop-free path, and reopens them when needed.');
  multi('5.1', 'Which three problems does a Layer 2 loop cause? (Choose three.)', 3, [
    'Broadcast storms', 'MAC address table instability', 'High CPU utilisation and link saturation',
    'Duplex mismatches', 'IP address conflicts', 'Expired TTL on frames'], 'Looping frames multiply (storm), the source MAC flips between ports, and links and CPUs saturate.');
  mc('5.1', 'Why can a looping Ethernet frame circulate forever?', [
    'The Ethernet frame has no field like TTL or Hop Limit',
    'Switches reset the TTL of every frame',
    'Frames are always sent as unicast',
    'The FCS is recalculated by every switch'], 'IPv4 TTL and IPv6 Hop Limit are Layer 3 fields. Ethernet has no equivalent, so switches never discard a looping frame.');
  multi('5.1', 'Which two kinds of frames loop endlessly in a switched network without STP? (Choose two.)', 2, [
    'Broadcast frames', 'Unknown unicast frames', 'Frames to a MAC address in the MAC table only', 'Frames with a bad FCS'],
  'Broadcasts and unknown unicasts (and multicasts) are flooded out every port, so they circle the loop.');
  tf('5.1', 'IPv6 networks cannot suffer from Layer 2 loops because IPv6 has no broadcasts.', false, 'ICMPv6 Neighbor Discovery uses Layer 2 multicasts, which switches flood like broadcasts.');
  mc('5.1', 'Who invented the spanning tree algorithm?', ['Radia Perlman', 'Vint Cerf', 'Bob Metcalfe', 'Tim Berners-Lee'], 'Radia Perlman, at Digital Equipment Corporation, published it in 1985.');
  order('5.1', 'Put the STA\'s work in order.', ['Select a root bridge', 'Block redundant paths', 'Create a loop-free topology with one path to the root', 'Recalculate when a link fails'], 'The root is the reference point; redundant paths are blocked; the result is a tree; blocked ports open again after failures.');
  tf('5.1', 'Spanning tree is enabled by default on Cisco switches.', true, 'Cisco switches run PVST+ out of the box.');
  mc('5.1', 'A faulty NIC floods the LAN with broadcasts for seconds. What is this called?', ['A broadcast storm', 'A MAC flooding attack', 'A duplex mismatch', 'A routing loop'], 'A broadcast storm is an abnormally high number of broadcasts; loops and faulty hardware cause it.');
  tf('5.1', 'STP physically disconnects redundant cables.', false, 'The cables stay; STP blocks ports logically.');

  card('5.1', 'Three symptoms of a Layer 2 loop', 'Broadcast storm, MAC address table instability, link saturation and high CPU on switches and hosts.');
  card('5.1', 'Why does Ethernet need STP while routed IP does not need a loop protocol?', 'IP packets carry a TTL / Hop Limit that routers decrement and drop at 0. Ethernet frames have no such field.');
  card('5.1', 'What is a broadcast storm?', 'An abnormally high number of broadcasts overwhelming the network in a short time. Caused by a Layer 2 loop or faulty hardware such as a NIC.');
  card('5.1', 'The four things the STA does', '1. Select a root bridge\n2. Block redundant paths\n3. Create a loop-free topology (one path to the root)\n4. Recalculate when a link fails');
  card('5.1', 'Which frames loop without STP?', 'Broadcasts, multicasts and unknown unicasts (anything the switch floods).');

  /* =============================== 5.2 =============================== */
  order('5.2', 'Put the four steps of building a loop-free topology in order.', ['Elect the root bridge', 'Elect the root ports', 'Elect the designated ports', 'Elect the alternate (blocked) ports'], 'Root bridge first, then each switch\'s root port, then one designated port per segment; everything else blocks.');
  multi('5.2', 'Which three fields make up the bridge ID? (Choose three.)', 3, ['Bridge priority', 'Extended system ID', 'MAC address', 'Port cost', 'IP address of the SVI', 'Port priority'], 'BID = priority + extended system ID (VLAN) + MAC address.');
  mc('5.2', 'All switches use the default priority. Which switch becomes the root bridge for VLAN 1?', ['The switch with the lowest MAC address', 'The switch with the highest MAC address', 'The switch that booted first', 'The switch with the most ports'], 'Priorities tie at 32769, so the lowest MAC address (lowest BID) wins.');
  mc('5.2', 'What priority value does show spanning-tree display for a default switch in VLAN 10?', ['32778', '32768', '32769', '4096'], '32768 plus the extended system ID 10.');
  mc('5.2', 'In which increments can the bridge priority be set?', ['4096', '1', '1024', '32768'], 'Values from 0 to 61440 in steps of 4096.');
  match('5.2', 'Match the link speed to its default 802.1D (short) port cost.', [['10 Gb/s', '2'], ['1 Gb/s', '4'], ['100 Mb/s', '19'], ['10 Mb/s', '100']], 'Faster links cost less.');
  mc('5.2', 'S2 reaches the root directly over a 100 Mb/s link, or through S3 over two 100 Mb/s links. What is the root path cost of the best path?', ['19', '38', '4', '0'], 'The direct path costs 19; the path through S3 costs 19 + 19 = 38.');
  tf('5.2', 'The root bridge has one root port.', false, 'The root bridge has no root port; all of its ports are designated ports.');
  mc('5.2', 'Which port on a segment between two non-root switches becomes the designated port?', ['The port on the switch with the lower-cost path to the root', 'The port with the higher MAC address', 'Both ports', 'The port on the switch with fewer VLANs'], 'One designated port per segment: the one with the best path to the root.');
  order('5.2', 'Order the tie-breakers a switch uses when it has equal-cost paths to the root.', ['Lowest sender BID', 'Lowest sender port priority', 'Lowest sender port ID'], 'Note "sender": the values come from the neighbour that sent the BPDU.');
  mc('5.2', 'What is the default port priority?', ['128', '32768', '0', '4096'], 'Port priority defaults to 128 (the first part of Prio.Nbr in show spanning-tree).');
  match('5.2', 'Match each STP timer to its default value.', [['Hello', '2 seconds'], ['Forward delay', '15 seconds'], ['Max age', '20 seconds']], 'Timers are set on the root bridge.');
  match('5.2', 'Match the port state to what it does.', [['Blocking', 'Receives BPDUs only'], ['Listening', 'Sends and receives BPDUs, no MAC learning'], ['Learning', 'Updates the MAC table but does not forward data'], ['Forwarding', 'Forwards data frames']], 'Only forwarding passes user data.');
  tf('5.2', 'With PVST, each VLAN can have a different root bridge.', true, 'PVST runs one STP instance per VLAN.');
  cli('5.2', 'Display the spanning tree for VLAN 10.', 'S1#', 'show spanning-tree vlan 10', 'show spanning-tree vlan vlan-id shows the root ID, bridge ID and port roles for that VLAN.');
  mc('5.2', 'In show spanning-tree, which role and state does a blocked redundant port show?', ['Altn BLK', 'Root FWD', 'Desg FWD', 'Desg LRN'], 'An alternate port is in the blocking state.');

  card('5.2', 'Bridge ID: three fields and default priority', 'Bridge priority (default 32768, 0–61440 in steps of 4096) + extended system ID (the VLAN) + MAC address. Lowest BID wins.');
  card('5.2', 'Default 802.1D port costs', '10 Gb/s = 2\n1 Gb/s = 4\n100 Mb/s = 19\n10 Mb/s = 100');
  card('5.2', 'Rules for designated ports', 'One per segment. All root bridge ports are designated. Opposite a root port is a designated port. Ports to end devices are designated. Between non-root switches: the switch with the cheaper path to the root.');
  card('5.2', 'Root port tie-breakers, in order', '1. Lowest sender BID\n2. Lowest sender port priority (default 128)\n3. Lowest sender port ID');
  card('5.2', 'STP timers', 'Hello 2 s (1–10), forward delay 15 s (4–30), max age 20 s (6–40). Set on the root bridge.');
  card('5.2', 'Five 802.1D port states', 'Blocking, listening, learning, forwarding, disabled. Only forwarding forwards data; learning and forwarding update the MAC table.');
  card('5.2', 'Why 32769 in show spanning-tree?', 'Default priority 32768 + extended system ID 1 (VLAN 1).');

  /* =============================== 5.3 =============================== */
  match('5.3', 'Match the spanning tree variety to its description.', [
    ['STP (802.1D)', 'One tree for the whole network, regardless of VLANs'], ['PVST+', 'Cisco: one 802.1D instance per VLAN'], ['Rapid PVST+', 'Cisco: one 802.1w instance per VLAN'], ['MST', 'Cisco: up to 16 RSTP instances shared by groups of VLANs']],
  'MSTP/MST map many VLANs into one instance; PVST+ and Rapid PVST+ run one per VLAN.');
  mc('5.3', 'Which spanning tree mode do Cisco switches with IOS 15.0 or later run by default?', ['PVST+', 'Rapid PVST+', 'MST', 'RSTP without per-VLAN instances'], 'PVST+ is the default; Rapid PVST+ has to be configured.');
  multi('5.3', 'Which three are RSTP port states? (Choose three.)', 3, ['Discarding', 'Learning', 'Forwarding', 'Listening', 'Blocking', 'Disabled'], 'RSTP merges disabled, blocking and listening into discarding.');
  mc('5.3', 'Which RSTP role is a port that offers another path to the root bridge?', ['Alternate', 'Backup', 'Designated', 'Root'], 'Backup is a second port onto the same shared segment, which is rare now that hubs are gone.');
  mc('5.3', 'Without PortFast, how long does an access port take to start forwarding when a PC is connected?', ['About 30 seconds', 'About 2 seconds', 'Immediately', 'About 50 seconds'], '15 s listening plus 15 s learning.');
  mc('5.3', 'What does BPDU Guard do when a PortFast port receives a BPDU?', ['Puts the port in the error-disabled state', 'Drops the BPDU and keeps forwarding', 'Makes the port a root port', 'Lowers the bridge priority'], 'A BPDU means a switch is attached, so the port is shut down until an administrator recovers it.');
  tf('5.3', 'PortFast should be enabled on trunk links between switches to speed up convergence.', false, 'PortFast belongs only on access ports to end devices.');
  cli('5.3', 'Switch S1 to Rapid PVST+.', 'S1(config)#', 'spanning-tree mode rapid-pvst', 'spanning-tree mode rapid-pvst is a global configuration command.');
  cli('5.3', 'Enable PortFast on this access port.', 'S1(config-if)#', 'spanning-tree portfast', 'spanning-tree portfast in interface configuration mode.');
  cli('5.3', 'Enable BPDU Guard on this port.', 'S1(config-if)#', 'spanning-tree bpduguard enable', 'spanning-tree bpduguard enable in interface configuration mode.');
  mc('5.3', 'Why are many networks moving to Layer 3 links between access and distribution switches?', ['Routing allows redundant active paths without blocking ports and converges predictably', 'Layer 3 links need no IP addresses', 'STP cannot run on access switches', 'Routers do not support VLANs'], 'Routing protocols use loops safely and converge faster and more predictably than STP.');
  tf('5.3', 'RSTP is backward compatible with 802.1D STP.', true, '802.1w supersedes 802.1D while keeping backward compatibility.');

  card('5.3', 'Rapid PVST+ vs PVST+', 'Both run one instance per VLAN. PVST+ uses 802.1D (default on IOS 15+); Rapid PVST+ uses 802.1w RSTP and converges much faster.');
  card('5.3', 'RSTP port states and roles', 'States: discarding, learning, forwarding.\nRoles: root, designated, alternate (another path to the root), backup (another port on a shared segment).');
  card('5.3', 'PortFast', 'Moves an access port straight from blocking to forwarding, skipping 30 s of listening + learning. Only on ports to end devices.');
  card('5.3', 'BPDU Guard', 'Error-disables a (PortFast) port as soon as it receives a BPDU. Must be re-enabled manually (or by errdisable recovery).');
  card('5.3', 'MSTP / MST', 'MSTP: IEEE standard mapping many VLANs into one instance. MST: Cisco implementation, up to 16 RSTP instances.');
})(typeof window !== 'undefined' ? window : globalThis);
