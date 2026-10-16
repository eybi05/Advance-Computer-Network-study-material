/* Module 7 — DHCPv4: quiz questions and flashcards */
(function (root) {
  'use strict';
  const { mc, multi, order, match, tf, cli, card } = root.SRWE.QuizKit;

  /* =============================== 7.1 =============================== */
  order('7.1', 'Put the messages a client uses to obtain a new lease in order.', ['DHCPDISCOVER', 'DHCPOFFER', 'DHCPREQUEST', 'DHCPACK'], 'DORA: Discover, Offer, Request, Acknowledge.');
  mc('7.1', 'Which messages renew an existing lease, in order?', ['DHCPREQUEST, then DHCPACK', 'DHCPDISCOVER, then DHCPOFFER', 'DHCPOFFER, then DHCPACK', 'DHCPREQUEST, then DHCPOFFER'], 'Renewal is a two-step process: the client requests, the server acknowledges.');
  mc('7.1', 'How does a client send its DHCPDISCOVER?', ['As a broadcast', 'As a unicast to the DHCP server', 'As a multicast to 224.0.0.2', 'Through the default gateway'], 'It has no address and does not know the server.');
  mc('7.1', 'A client tries to renew its lease but the original server does not answer. What does the client do?', ['Broadcasts a DHCPREQUEST so another server can extend the lease', 'Keeps using the address forever', 'Starts with a DHCPOFFER', 'Sends a DHCPDECLINE'], 'After the timeout the client broadcasts its request.');
  tf('7.1', 'A DHCPv4 lease is typically between 24 hours and a week or more.', true, 'Administrators choose the lease period.');
  mc('7.1', 'What happens to a leased address when the lease expires and is not renewed?', ['It returns to the pool for reuse', 'It is permanently excluded', 'It is given to the default gateway', 'The server shuts down the interface'], 'That is why clients that move or power off do not hold addresses forever.');
  mc('7.1', 'Which device can act as the DHCPv4 server in a small branch office without a dedicated server?', ['A Cisco router', 'A Layer 2 switch with no IOS DHCP support', 'A hub', 'A patch panel'], 'Cisco IOS includes an optional, full-featured DHCPv4 server.');
  match('7.1', 'Match the DHCPv4 message to its sender.', [['DHCPDISCOVER', 'Client'], ['DHCPOFFER', 'Server'], ['DHCPREQUEST', 'Client, requesting the offered address'], ['DHCPACK', 'Server, confirming the lease']], 'Client and server alternate.');
  mc('7.1', 'On which UDP port does a DHCPv4 server listen?', ['67', '68', '53', '69'], 'Server 67, client 68.');
  tf('7.1', 'During renewal, the client first sends its DHCPREQUEST directly to the server that gave the lease.', true, 'Only if no DHCPACK arrives does it broadcast.');

  card('7.1', 'DORA', 'DHCPDISCOVER (client, broadcast) → DHCPOFFER (server) → DHCPREQUEST (client) → DHCPACK (server).');
  card('7.1', 'Lease renewal', 'DHCPREQUEST sent directly to the original server → DHCPACK. No ACK in time: broadcast DHCPREQUEST.');
  card('7.1', 'What is a DHCP lease?', 'A temporary assignment of an IPv4 address (and settings) from a pool, for a period the server chooses.');
  card('7.1', 'DHCPv4 UDP ports', 'Server: UDP 67. Client: UDP 68.');

  /* =============================== 7.2 =============================== */
  order('7.2', 'Put the steps to configure a Cisco IOS DHCPv4 server in order.', ['Exclude the statically assigned addresses', 'Define the pool name with ip dhcp pool', 'Configure the pool (network, default-router, ...)'], 'Exclude first, then create and configure the pool.');
  cli('7.2', 'Exclude the addresses 192.168.10.1 to 192.168.10.9 from DHCP.', 'R1(config)#', 'ip dhcp excluded-address 192.168.10.1 192.168.10.9', 'low-address and high-address define the range.');
  cli('7.2', 'Create a DHCP pool named LAN-POOL-1.', 'R1(config)#', 'ip dhcp pool LAN-POOL-1', 'The prompt changes to R1(dhcp-config)#.');
  cli('7.2', 'In the pool, define the network 192.168.10.0/24.', 'R1(dhcp-config)#', 'network 192.168.10.0 255.255.255.0', 'network network-number [mask | /prefix-length]', ['network 192.168.10.0 /24']);
  cli('7.2', 'In the pool, set the default gateway to 192.168.10.1.', 'R1(dhcp-config)#', 'default-router 192.168.10.1', 'default-router supplies the gateway to clients.');
  cli('7.2', 'In the pool, set the DNS server to 192.168.11.5.', 'R1(dhcp-config)#', 'dns-server 192.168.11.5', 'Up to eight DNS servers can be listed.');
  match('7.2', 'Match the verification command to what it shows.', [['show running-config | section dhcp', 'The DHCP configuration only'], ['show ip dhcp binding', 'IPv4 to MAC address bindings'], ['show ip dhcp server statistics', 'Counts of DHCP messages']], 'Bindings show which client has which address.');
  mc('7.2', 'Which command disables the DHCPv4 service on a router?', ['no service dhcp', 'no ip dhcp pool', 'no ip helper-address', 'shutdown dhcp'], 'The service is enabled by default.');
  mc('7.2', 'A PC is on a different subnet from the DHCPv4 server and gets no address. What must be configured on the router interface that faces the PC?', ['ip helper-address <server address>', 'ip address dhcp', 'service dhcp', 'ip dhcp pool'], 'The relay forwards the client broadcast as a unicast to the server.');
  cli('7.2', 'Relay DHCP broadcasts received on this interface to the server 192.168.11.6.', 'R1(config-if)#', 'ip helper-address 192.168.11.6', 'Configure it on the interface that receives the client broadcasts.');
  multi('7.2', 'Which three UDP services does ip helper-address forward by default? (Choose three.)', 3, ['DNS (53)', 'TFTP (69)', 'DHCP/BOOTP server (67)', 'HTTP (80)', 'SNMP (161)', 'SSH (22)'], 'The eight defaults: 37, 49, 53, 67, 68, 69, 137, 138.');
  mc('7.2', 'Which command verifies that an interface is configured as a DHCPv4 relay?', ['show ip interface', 'show ip dhcp binding', 'show ip route', 'show running-config | section pool'], 'show ip interface lists the helper address.');
  tf('7.2', 'You must bind a DHCPv4 pool to a router interface with an interface command.', false, 'IOS chooses the pool whose network matches; no interface binding is needed.');

  card('7.2', 'Three steps for an IOS DHCPv4 server', '1. ip dhcp excluded-address low [high]\n2. ip dhcp pool NAME\n3. network …, default-router … (+ dns-server, domain-name, lease)');
  card('7.2', 'DHCPv4 verification commands', 'show running-config | section dhcp\nshow ip dhcp binding\nshow ip dhcp server statistics');
  card('7.2', 'DHCPv4 relay', 'ip helper-address <server> on the interface that receives the client broadcasts. The router forwards them as unicasts. Verify with show ip interface.');
  card('7.2', 'UDP services forwarded by ip helper-address', '37 Time, 49 TACACS, 53 DNS, 67 DHCP server, 68 DHCP client, 69 TFTP, 137 NetBIOS name, 138 NetBIOS datagram.');
  card('7.2', 'Turn the DHCPv4 service off and on', 'no service dhcp / service dhcp (global configuration). On by default.');

  /* =============================== 7.3 =============================== */
  cli('7.3', 'Make this interface get its IPv4 address from the ISP\'s DHCP server.', 'SOHO(config-if)#', 'ip address dhcp', 'ip address dhcp makes the interface a DHCPv4 client.');
  mc('7.3', 'Which log message confirms that a router interface received an address by DHCP?', ['%DHCP-6-ADDRESS_ASSIGN', '%LINK-3-UPDOWN', '%SYS-5-CONFIG_I', '%LINEPROTO-5-UPDOWN'], 'It lists the interface, address, mask and hostname.');
  mc('7.3', 'Which Internet connection type does a typical home wireless router use by default?', ['Automatic Configuration - DHCP', 'Static IP', 'PPPoE', 'L2TP'], 'Home routers are preconfigured to get their WAN address automatically.');
  tf('7.3', 'To make a router a DHCPv4 client, you configure an ip dhcp pool on it.', false, 'A pool makes it a server. The client only needs ip address dhcp on the interface.');
  mc('7.3', 'Which column of show ip interface brief shows that an address was learned from DHCP?', ['Method', 'Status', 'Protocol', 'OK?'], 'The Method column shows DHCP instead of manual.');
  mc('7.3', 'You configured ip address dhcp on G0/0/1 but nothing happens. What did you most likely forget?', ['no shutdown', 'service dhcp', 'ip helper-address', 'ip routing'], 'Router interfaces are administratively down by default.');
  tf('7.3', 'A Cisco router can be a DHCPv4 server on one interface and a DHCPv4 client on another.', true, 'For example, a SOHO router gets its WAN address from the ISP and serves its LAN.');
  mc('7.3', 'Which device usually gives a SOHO router its WAN address by DHCP?', ['The ISP', 'A PC on the LAN', 'The local switch', 'A WLC'], 'The cable or DSL modem connects the router to the ISP, whose DHCP server assigns the address.');

  card('7.3', 'Router as DHCPv4 client', 'interface G0/0/1 → ip address dhcp → no shutdown. Verify: show ip interface (brief).');
  card('7.3', 'Home router WAN default', 'Internet connection type: Automatic Configuration - DHCP (the router is a DHCP client of the ISP).');
  card('7.3', 'How to spot a DHCP-learned address on a router', 'Method DHCP in show ip interface brief, or %DHCP-6-ADDRESS_ASSIGN in the log.');
  card('7.3', 'Server vs client on a router', 'Server: ip dhcp pool (+ excluded addresses). Client: ip address dhcp on an interface.');
})(typeof window !== 'undefined' ? window : globalThis);
