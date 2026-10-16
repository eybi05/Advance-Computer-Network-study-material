/* Question bank. Conventions (the quiz shuffles options at run time):
 *   mc:    options[0] is the correct answer
 *   multi: the first n options are correct
 *   order: items are listed in the correct order
 *   match: pairs of [term, meaning]
 *   tf:    statement + true/false
 *   cli:   typed IOS command at the given prompt; abbreviations are accepted (js/app/cmd.js) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const Q = SRWE.quiz = [];
  const counters = {};
  const add = (o) => { counters[o.t] = (counters[o.t] || 0) + 1; o.id = 'q' + o.t + '-' + counters[o.t]; Q.push(o); };
  const mc = (t, q, o, ex) => add({ t, type: 'mc', q, o, ex });
  const multi = (t, q, n, o, ex) => add({ t, type: 'multi', q, n, o, ex });
  const order = (t, q, items, ex) => add({ t, type: 'order', q, items, ex });
  const match = (t, q, pairs, ex) => add({ t, type: 'match', q, pairs, ex });
  const tf = (t, q, ans, ex) => add({ t, type: 'tf', q, ans, ex });
  const cli = (t, q, spec, ex) => add(Object.assign({ t, type: 'cli', q, ex }, spec));


  /* =============================== 1.1 =============================== */
  mc('1.1', 'After a Cisco switch is powered on, what happens first?', [
    'The POST program in ROM checks the CPU, DRAM and part of flash',
    'The boot loader initializes the flash file system',
    'IOS applies the commands in config.text',
    'The boot loader initializes the CPU registers'],
  'POST (power-on self-test) is stored in ROM and runs first. The boot loader runs only after POST completes successfully.');
  order('1.1', 'Put the switch boot sequence in the correct order.', [
    'POST checks the CPU subsystem', 'The boot loader software starts', 'Low-level CPU initialization',
    'The flash file system is initialized', 'An IOS image is loaded and given control'],
  'POST and the boot loader both come from ROM. The boot loader initializes the CPU, then flash, then loads IOS.');
  mc('1.1', 'Where is the startup configuration of a Catalyst 2960 stored, and what is the file called?', [
    'In flash, in a file called config.text', 'In ROM, in a file called startup.cfg',
    'In RAM, in a file called running-config', 'In flash, in a file called vlan.dat'],
  'IOS initializes the interfaces from config.text, which is stored in flash. vlan.dat holds the VLAN database, not the configuration.');
  mc('1.1', 'Which global configuration command sets the BOOT environment variable?', [
    'boot system', 'show boot', 'boot loader', 'copy flash boot'],
  'boot system flash:/path/image.bin sets the BOOT variable. show boot only displays it.');
  mc('1.1', 'Which LED mode is selected on a Catalyst switch by default?', ['STAT', 'DUPLX', 'SPEED', 'PoE'],
    'Port status (STAT) is the default mode; the Mode button cycles to DUPLX, SPEED and PoE.');
  mc('1.1', 'SPEED mode is selected. A port LED is blinking green. What is the port speed?', ['1000 Mb/s', '100 Mb/s', '10 Mb/s', 'The port is blocked'],
    'In SPEED mode: off = 10 Mb/s, green = 100 Mb/s, blinking green = 1000 Mb/s.');
  mc('1.1', 'STAT mode is selected. A port LED is amber. What does it mean?', [
    'The port is blocked to prevent a loop', 'The link has a fault', 'The port runs half duplex', 'PoE was denied'],
  'In STAT mode amber (and blinking amber) means the port is blocked to prevent a loop. Alternating green/amber is a link fault.');
  mc('1.1', 'How do you reach the boot loader of a switch whose IOS is damaged?', [
    'Reconnect power and, within 15 seconds, hold the Mode button until SYST turns amber and then solid green',
    'Press Ctrl+Break during POST', 'Type boot at the Switch> prompt', 'Hold the Mode button for 15 seconds while IOS is running'],
  'The boot loader is reached through the console by holding Mode during power-on; the switch: prompt then appears.');
  multi('1.1', 'An administrator must manage a switch from a different network. Which two items are required? (Choose two.)', 2, [
    'An IP address and subnet mask on an SVI', 'A default gateway', 'An IP address on every physical port', 'The ip routing command', 'A loopback interface'],
  'Remote management needs an SVI address. Replies to other networks need ip default-gateway.');
  mc('1.1', 'After no shutdown, interface Vlan99 still shows down/down. What is the most likely reason?', [
    'VLAN 99 does not exist, or no port in VLAN 99 is up', 'SVIs only work after ip routing is enabled',
    'SVIs require a description', 'The default gateway is not configured'],
  'An SVI comes up only when its VLAN exists and at least one port in that VLAN is up.');
  mc('1.1', 'What must be done before IPv6 can be configured on the SVI of a Catalyst 2960 running IOS 15.0?', [
    'sdm prefer dual-ipv4-and-ipv6 default, then reload', 'ipv6 unicast-routing', 'ipv6 enable in global configuration', 'Nothing'],
  'The 2960 needs the dual-stack SDM template, which takes effect only after a reload.');
  mc('1.1', 'What is the purpose of an IP address on the SVI of a Layer 2 switch?', [
    'Remote management of the switch', 'Routing between VLANs', 'Acting as the default gateway for hosts', 'Spanning tree calculations'],
  'The SVI address is only for management; a Layer 2 switch does not route Layer 3 packets.');
  tf('1.1', 'A switch configured with an IPv6 address on its SVI also needs an IPv6 default gateway command.', false,
    'The switch learns its IPv6 default gateway from router advertisement (RA) messages.');
  cli('1.1', 'Configure S1 so it can be managed from remote networks through the router 172.17.99.1.', { prompt: 'S1(config)#', answer: 'ip default-gateway 172.17.99.1' },
  'ip default-gateway is a global configuration command on a Layer 2 switch.');
  cli('1.1', 'Enter interface configuration mode for the management SVI of VLAN 99.', { prompt: 'S1(config)#', answer: 'interface vlan 99' },
  'An SVI is configured with interface vlan vlan-id.');

  /* =============================== 1.2 =============================== */
  mc('1.2', 'Which statement about full-duplex communication is true?', [
    'It needs microsegmentation and the port has no collision domain', 'It requires a hub',
    'The NIC collision-detection circuit stays enabled', 'Data flows in only one direction at a time'],
  'Full duplex is bidirectional on a port with one device attached, so there are no collisions and collision detection is disabled.');
  mc('1.2', 'A 10/100/1000 switch port is set to 1000 Mb/s. Which duplex can it use?', ['Full duplex only', 'Half duplex only', 'Half or full', 'Auto only'],
    '10/100/1000 ports run half or full at 10/100 Mb/s but only full duplex at 1000 Mb/s.');
  mc('1.2', 'What is the best practice for a switch port connected to a server whose settings are known?', [
    'Manually configure speed and duplex', 'Leave speed and duplex on auto', 'Configure half duplex', 'Disable auto-MDIX'],
  'Autonegotiation suits unknown or changing devices; known devices should be set manually.');
  mc('1.2', 'What must be true for auto-MDIX to work on an interface?', [
    'Speed and duplex are both set to auto', 'A crossover cable is connected', 'Duplex is set to full', 'The port is a trunk'],
  'Auto-MDIX needs speed and duplex on auto to operate correctly.');
  mc('1.2', 'Which command shows only the auto-MDIX setting of Fa0/1?', [
    'show controllers ethernet-controller fa0/1 phy | include Auto-MDIX', 'show interfaces fa0/1 mdix',
    'show mdix fa0/1', 'show running-config | include mdix'],
  'The phy keyword shows the PHY details; the include filter narrows it to the Auto-MDIX line.');
  mc('1.2', 'show interfaces reports "FastEthernet0/1 is up, line protocol is down". What is a likely cause?', [
    'An encapsulation mismatch, or the far end is error-disabled', 'No cable is attached', 'The interface was shut down', 'Too many VLANs'],
  'Up/down means Layer 1 is fine but Layer 2 keepalives fail.');
  mc('1.2', 'What does "administratively down" indicate?', [
    'The shutdown command was applied', 'The cable is unplugged', 'There is a speed mismatch', 'There are many CRC errors'],
  'An interface is administratively down only when it has been disabled with shutdown.');
  mc('1.2', 'An Ethernet frame of 50 bytes is received. How is it counted?', ['As a runt', 'As a giant', 'As a CRC error', 'As a late collision'],
    'Ethernet frames shorter than 64 bytes are runts.');
  mc('1.2', 'An interface shows a large number of CRC errors. What does this usually indicate?', [
    'A media or cable problem, such as noise or damaged connections', 'The port runs half duplex', 'Too many MAC addresses', 'A wrong IP address'],
  'CRC errors usually mean electrical interference, loose or damaged connections, or wrong cabling.');
  mc('1.2', 'When is a collision called a late collision?', [
    'When it happens after 512 bits of the frame have been sent', 'When it happens in the first 64 bits',
    'When the frame is larger than 1518 bytes', 'When it happens during the preamble'],
  'A late collision occurs after the first 512 bits (64 bytes) have been transmitted.');
  multi('1.2', 'Which two are common causes of late collisions? (Choose two.)', 2, [
    'Excessive cable length', 'Duplex misconfiguration', 'A VLAN mismatch', 'A wrong default gateway', 'Auto-MDIX disabled'],
  'Cables that are too long and duplex mismatches are the most common causes.');
  tf('1.2', 'Collisions are normal on an interface configured for full duplex.', false,
    'Collisions are normal in half duplex but should never appear on a full-duplex interface.');
  order('1.2', 'Order the general process for troubleshooting a bad connection between a switch and another device.', [
    'Run show interfaces', 'Check whether the interface is up',
    'Down: check cables and speed. Up: check for noise and duplex', 'If unsolved, document the work and escalate'],
  'This is the flow chart from topic 1.2.8.');
  cli('1.2', 'Configure Fa0/1 for full duplex.', { prompt: 'S1(config-if)#', answer: 'duplex full' },
  'duplex full is an interface configuration command.');
  cli('1.2', 'Set Fa0/1 to 100 Mb/s.', { prompt: 'S1(config-if)#', answer: 'speed 100' },
  'speed 100 forces the port speed.');

  /* =============================== 1.3 =============================== */
  mc('1.3', 'Which statement describes Telnet?', [
    'It uses TCP port 23 and sends credentials in plaintext', 'It uses TCP port 22 and encrypts the session',
    'It uses UDP port 23', 'It encrypts only the password'],
  'Telnet sends the username, password and data in plaintext over TCP 23.');
  mc('1.3', 'Which port does SSH use?', ['TCP 22', 'TCP 23', 'UDP 22', 'TCP 443'],
    'SSH uses TCP port 22 and encrypts authentication and data.');
  mc('1.3', 'Which part of an IOS image name shows that it supports cryptographic features such as SSH?', ['k9', 'lanbase', 'mz', 'SE'],
    'An image name containing k9 (for example c2960-lanbasek9-mz) supports encryption.');
  order('1.3', 'Put the SSH configuration steps in order.', [
    'Verify SSH support (show ip ssh)', 'Configure the IP domain name', 'Generate RSA key pairs',
    'Configure local user authentication', 'Configure the vty lines', 'Enable SSH version 2'],
  'This is the six-step process from topic 1.3.4.');
  mc('1.3', 'Which command enables SSH on a switch as soon as it completes?', [
    'crypto key generate rsa', 'ip ssh version 2', 'transport input ssh', 'username admin secret ccna'],
  'Generating an RSA key pair automatically enables the SSH server.');
  mc('1.3', 'crypto key generate rsa returns "% Please define a domain-name first." What fixes this?', [
    'ip domain-name cisco.com', 'hostname S1', 'ip ssh version 2', 'username admin secret ccna'],
  'The key name is hostname.domain-name, so IOS needs a domain name.');
  mc('1.3', 'What does login local do on the vty lines?', [
    'Authenticates users against the local username database', 'Checks the line password',
    'Disables authentication', 'Enables SSH version 2'],
  'login checks the line password; login local checks usernames created with username ... secret ....');
  mc('1.3', 'show ip ssh reports "SSH Enabled - version 1.99". What does that mean?', [
    'Both SSH version 1 and version 2 are supported', 'Only version 1 is supported', 'Only version 2 is supported', 'SSH is disabled'],
  'Version 1.99 is how IOS reports support for both versions. After ip ssh version 2 it shows version 2.0.');
  mc('1.3', 'Which command deletes the RSA key pair and disables the SSH server?', [
    'crypto key zeroize rsa', 'no crypto key generate rsa', 'no ip ssh', 'crypto key remove rsa'],
  'Zeroizing the keys removes them; with no keys the SSH server is disabled.');
  multi('1.3', 'Which two vty line commands make a switch accept only SSH logins checked against local accounts? (Choose two.)', 2, [
    'transport input ssh', 'login local', 'login', 'password cisco', 'transport input all'],
  'transport input ssh blocks Telnet; login local uses the username database.');
  mc('1.3', 'Which command displays the active SSH sessions on a switch?', ['show ssh', 'show ip ssh', 'show sessions ssh', 'show crypto ssh'],
    'show ssh lists connections; show ip ssh shows the version and configuration.');
  tf('1.3', 'With SSH, a threat actor capturing packets can still see the IP addresses of the session.', true,
    'SSH encrypts the content, but the session itself (addresses and ports) is still visible.');
  cli('1.3', 'Generate a 1024-bit RSA key pair in one command.', { prompt: 'S1(config)#', answer: 'crypto key generate rsa general-keys modulus 1024', accept: ['crypto key generate rsa modulus 1024'] },
  'Adding modulus 1024 avoids the interactive prompt.');
  cli('1.3', 'Allow only SSH on the vty lines.', { prompt: 'S1(config-line)#', answer: 'transport input ssh' },
  'transport input ssh is a line configuration command.');
  cli('1.3', 'Enable SSH version 2.', { prompt: 'S1(config)#', answer: 'ip ssh version 2' },
  'ip ssh version 2 is entered in global configuration mode.');

  /* =============================== 1.4 =============================== */
  mc('1.4', 'What is the default state of Ethernet and serial interfaces on a Cisco router?', [
    'Administratively down', 'Up and up', 'Down and down until a cable is connected', 'Error-disabled'],
  'Router interfaces are shut down by default and need no shutdown.');
  multi('1.4', 'For a router interface to be available, which three conditions must be met? (Choose three.)', 3, [
    'It has at least one IP address', 'It is activated with no shutdown', 'It is connected to another device',
    'It has a description', 'It has a clock rate'],
  'An address, no shutdown and a physical connection are required; a description is only recommended.');
  mc('1.4', 'What is the maximum length of an interface description?', ['240 characters', '80 characters', '128 characters', '255 characters'],
    'Descriptions can be up to 240 characters.');
  mc('1.4', 'What is the main purpose of a message-of-the-day banner?', [
    'Legal notification that unauthorized access is prohibited', 'Displaying the IOS version',
    'Showing a message only to remote users', 'Backing up the configuration'],
  'The banner warns that unauthorized access is prohibited.');
  mc('1.4', 'Which statement describes a loopback interface?', [
    'A logical interface that is up whenever the router is running and can never be cabled',
    'A physical port used for testing cables', 'An interface that must be enabled after every reboot',
    'An interface that needs a crossover cable'],
  'Loopbacks are software interfaces, always up while the router functions.');
  mc('1.4', 'In banner motd $ Authorized Access Only! $, what is the role of the $ character?', [
    'It is a delimiter marking the start and end of the message', 'It is a variable', 'It starts a comment', 'It is a required keyword'],
  'Any character can be the delimiter, as long as it does not appear in the message.');
  mc('1.4', 'Both enable password and enable secret are configured. Which is used to enter privileged EXEC mode?', [
    'enable secret', 'enable password', 'Both are required', 'Whichever was configured first'],
  'enable secret always takes precedence over enable password.');
  mc('1.4', 'What does service password-encryption do?', [
    'Encodes plaintext passwords in the configuration with weak type 7 encryption', 'Hashes the enable secret',
    'Encrypts management traffic', 'Enables SSH'],
  'It hides passwords from casual viewing only; type 7 can be reversed easily.');
  mc('1.4', 'Which statement about routers and Layer 2 switches is true?', [
    'Routers support LAN and WAN interfaces; Layer 2 switches mainly have Ethernet LAN ports',
    'Only switches can have IPv6 addresses', 'Switches need no shutdown on every port', 'Routers cannot use console passwords'],
  'Routers connect different network types (serial, DSL, cable, Ethernet); Layer 2 switches support LANs.');
  cli('1.4', 'Enable interface G0/0/0 on R1.', { prompt: 'R1(config-if)#', answer: 'no shutdown' },
  'no shutdown activates the interface.');
  cli('1.4', 'Create loopback interface 0 on R1.', { prompt: 'R1(config)#', answer: 'interface loopback 0' },
  'interface loopback number creates the loopback and enters its configuration.');
  cli('1.4', 'Assign 2001:db8:acad:1::1/64 to the current interface.', { prompt: 'R1(config-if)#', answer: 'ipv6 address 2001:db8:acad:1::1/64' },
  'The prefix length is written directly after the address.');
  cli('1.4', 'Configure the message-of-the-day banner "Authorized Access Only!" using # as the delimiter.', { prompt: 'R1(config)#', answer: 'banner motd #Authorized Access Only!#' },
  'The delimiter must appear before and after the text.');

  /* =============================== 1.5 =============================== */
  mc('1.5', 'Which command quickly shows the IPv4 address and status of every interface?', [
    'show ip interface brief', 'show running-config', 'show interfaces', 'show ip route'],
  'show ip interface brief gives a one-line summary per interface.');
  mc('1.5', 'What does the code L mean in show ip route?', [
    'A local host route for the router\'s own interface address', 'A link-state route', 'A loopback network', 'A LISP route'],
  'L marks the /32 (IPv4) or /128 (IPv6) route for the interface address itself.');
  mc('1.5', 'What is the administrative distance of a local host route?', ['0', '1', '110', '255'],
    'Local and connected routes have an administrative distance of 0.');
  mc('1.5', 'What prefix length does an IPv6 local route have?', ['/128', '/64', '/32', '/0'],
    'IPv4 local routes are /32 and IPv6 local routes are /128.');
  mc('1.5', 'An interface shows an address beginning with FE80 that you did not configure. What is it?', [
    'The link-local address, created automatically', 'A global unicast address', 'A multicast address', 'A unique local address'],
  'Every IPv6 interface must have a link-local address; IOS creates one automatically.');
  mc('1.5', 'The multicast groups an IPv6 interface joins begin with which prefix?', ['FF02', 'FE80', '2001', 'FC00'],
    'For example FF02::1 (all nodes), FF02::2 (all routers) and FF02::1:FFxx:xxxx (solicited-node).');
  match('1.5', 'Match each output filter to what it shows.', [
    ['section', 'The whole section that starts with the expression'], ['include', 'Only the lines that match'],
    ['exclude', 'Every line except those that match'], ['begin', 'Everything from the first matching line onward']],
  'Filters follow a pipe after a show command.');
  mc('1.5', 'How many command lines does the history buffer keep by default?', ['10', '20', '24', '256'],
    'History is enabled by default with 10 lines.');
  mc('1.5', 'Which keys recall the previous command?', ['Ctrl+P or Up Arrow', 'Ctrl+N or Down Arrow', 'Ctrl+Z', 'Tab'],
    'Ctrl+P / Up goes back; Ctrl+N / Down goes forward.');
  mc('1.5', 'Which command stops output from pausing at --More--?', ['terminal length 0', 'terminal history size 0', 'no more', 'terminal monitor'],
    'terminal length 0 disables paging for the session.');
  tf('1.5', 'terminal history size 50 is saved in the running configuration and applies to all future sessions.', false,
    'It changes the buffer only for the current terminal session.');
  multi('1.5', 'In IOS 15, which two routing table entries does an active interface with an IPv4 address create? (Choose two.)', 2, [
    'A C (connected) route', 'An L (local) route', 'An S (static) route', 'An O (OSPF) route', 'A default route'],
  'Older IOS versions created only the C route.');
  cli('1.5', 'Show only the lines of show ip interface brief that contain the word "up".', { prompt: 'Router#', answer: 'show ip interface brief | include up' },
  'The include filter keeps matching lines; expressions are case-sensitive.');
  cli('1.5', 'Display only the vty line section of the running configuration.', { prompt: 'Router#', answer: 'show running-config | section line vty' },
  'section shows the matching header line and all its indented lines.');
  cli('1.5', 'Display the commands applied to G0/0/0 only.', { prompt: 'Router#', answer: 'show running-config interface g0/0/0' },
  'show running-config interface interface-id shows one interface.');

  /* =============================== 2.1 =============================== */
  mc('2.1', 'How does a switch learn MAC addresses?', [
    'By recording the source MAC address of each frame and the port it arrived on', 'From the destination MAC address of each frame',
    'From the source IP address', 'From ARP replies only'],
  'Learning uses source addresses; forwarding uses destination addresses.');
  mc('2.1', 'What is another name for the MAC address table?', ['CAM table', 'ARP table', 'Routing table', 'FIB'],
    'Content Addressable Memory (CAM) table.');
  mc('2.1', 'A frame arrives with an unknown destination MAC address. What does the switch do?', [
    'Floods it out of all ports except the ingress port', 'Drops it', 'Sends it back out the ingress port', 'Sends it to the router'],
  'Unknown unicasts and broadcasts are flooded out every port except the one they arrived on.');
  mc('2.1', 'A known source MAC address is seen again on the same port. What happens to its entry?', [
    'Its aging timer is reset to 5 minutes', 'It is deleted', 'Nothing', 'It becomes static'],
  'The entry is refreshed; the default aging time is 300 seconds.');
  mc('2.1', 'What does ingress mean?', ['A frame entering an interface', 'A frame leaving an interface', 'A frame being flooded', 'A frame being filtered'],
    'Ingress = entering; egress = exiting.');
  mc('2.1', 'Which switching method does Cisco prefer?', ['Store-and-forward', 'Cut-through', 'Fragment-free', 'Fast-forward'],
    'Store-and-forward checks every frame for errors before forwarding.');
  mc('2.1', 'Which method checks the FCS and discards frames with CRC errors?', ['Store-and-forward', 'Cut-through', 'Fragment-free', 'All three'],
    'Only store-and-forward receives the whole frame, including the FCS, before deciding.');
  mc('2.1', 'Fragment-free switching waits until how many bytes of the frame have arrived?', ['64', '14', '512', '1518'],
    'Waiting for 64 bytes eliminates runts, where most errors and collisions occur.');
  mc('2.1', 'Which errors does fragment-free switching eliminate?', ['Runts', 'CRC errors', 'Giants', 'All frame errors'],
    'It never sees the FCS, so it removes only runts. Store-and-forward removes CRC errors, runts and giants.');
  mc('2.1', 'Cut-through switching suits switches that need latency below what?', ['10 microseconds', '10 milliseconds', '150 milliseconds', '1 second'],
    'Cut-through starts forwarding as soon as the destination MAC is known.');
  multi('2.1', 'Which two are characteristics of store-and-forward switching? (Choose two.)', 2, [
    'It checks the FCS and discards bad frames', 'It buffers frames, so ingress and egress ports can have different speeds',
    'It forwards as soon as the destination MAC is read', 'It propagates corrupted frames', 'It is used only where latency must be under 10 µs'],
  'Error checking and buffering are its two primary characteristics.');
  mc('2.1', 'A frame arrives on Fa0/1. Its destination MAC is listed in the table on Fa0/1. What does the switch do?', [
    'Filters (drops) the frame', 'Floods it', 'Forwards it out Fa0/1', 'Forwards it out all trunks'],
  'A switch never sends a frame back out the port it arrived on.');
  mc('2.1', 'The MAC table is empty. PC-A on port 1 sends a frame to PC-B on port 3. What is in the table afterwards?', [
    'Only PC-A\'s MAC address, on port 1', 'PC-A and PC-B', 'Only PC-B', 'Nothing'],
  'The switch learns only the source (PC-A). PC-B is learned when PC-B sends a frame.');
  tf('2.1', 'Cut-through switching can forward frames between ports of different speeds.', false,
    'Cut-through cannot support different ingress and egress speeds; store-and-forward buffering can.');
  cli('2.1', 'Display the MAC address table of the switch.', { prompt: 'Switch#', answer: 'show mac address-table', accept: ['show mac-address-table'] },
  'Older IOS versions use show mac-address-table.');

  /* =============================== 2.2 =============================== */
  mc('2.2', 'Which device breaks up broadcast domains?', ['Router', 'Layer 2 switch', 'Hub', 'Repeater'],
    'Only a Layer 3 device separates broadcast domains.');
  mc('2.2', 'When does a switch link become part of a collision domain?', [
    'When one or more devices on it run half duplex', 'When it runs full duplex', 'When it is a trunk', 'When it carries several VLANs'],
  'With half duplex there is contention for bandwidth and collisions are possible.');
  mc('2.2', 'A router has two interfaces, each connected to a switch with three PCs. How many broadcast domains are there?', ['2', '1', '6', '8'],
    'Each router interface is the edge of one broadcast domain.');
  mc('2.2', 'Four PCs are connected to one hub. How many collision domains are there?', ['1', '4', '5', '0'],
    'A hub repeats every signal out of all ports, so all its ports share one collision domain.');
  mc('2.2', 'A switch receives a broadcast frame on port 2. What does it do?', [
    'Floods it out of every port except port 2', 'Drops it', 'Sends it only to the router port', 'Sends it out port 2 only'],
  'Broadcasts are flooded out all interfaces except the ingress interface.');
  mc('2.2', 'What happens to the broadcast domain when more switches are added to a LAN?', ['It expands', 'It is split', 'It is unchanged', 'It disappears'],
    'Layer 1 and Layer 2 devices extend broadcast domains.');
  multi('2.2', 'Which three switch features help alleviate congestion? (Choose three.)', 3, [
    'Large frame buffers', 'High port density', 'Fast internal switching', 'Flooding every unicast frame', 'Half-duplex ports'],
  'The four features in the course are fast port speeds, fast internal switching, large frame buffers and high port density.');
  mc('2.2', 'Why can too many broadcasts be a problem?', [
    'They cause congestion and poor network performance', 'They create collision domains', 'They disable the MAC table', 'They stop routing'],
  'Every device in the broadcast domain must process every broadcast.');
  tf('2.2', 'Switches extend broadcast domains but can eliminate collision domains.', true,
    'This is the summary statement of module 2.');
  tf('2.2', 'If autonegotiation fails and one side of a switch link falls back to half duplex, that link can have collisions.', true,
    'A half-duplex link is a collision domain, even on a switch.');

  /* =============================== 3.1 =============================== */
  mc('3.1', 'Which statement about VLANs is false?', [
    'VLANs make each broadcast domain larger', 'VLANs segment devices that share the same switches',
    'Each VLAN uses its own IP address range', 'Broadcasts stay inside their VLAN'],
  'VLANs create more, smaller broadcast domains.');
  mc('3.1', 'How does dividing a LAN into VLANs affect broadcast domains?', [
    'There are more broadcast domains, each with fewer devices', 'There are fewer broadcast domains',
    'There is a single broadcast domain', 'There is no effect'],
  'Each VLAN is its own broadcast domain.');
  mc('3.1', 'Which of these is NOT a default role of VLAN 1?', ['Voice VLAN', 'Default VLAN', 'Native VLAN', 'Management VLAN'],
    'VLAN 1 is the default, native and management VLAN. There is no default voice VLAN.');
  mc('3.1', 'Which VLAN carries untagged frames on an 802.1Q trunk?', ['Native VLAN', 'Management VLAN', 'Voice VLAN', 'Data VLAN'],
    'All frames on a trunk are tagged except frames of the native VLAN.');
  mc('3.1', 'What is the maximum one-way delay voice traffic should have?', ['Less than 150 ms', 'Less than 50 ms', 'Less than 300 ms', 'Less than 1 second'],
    'Voice needs delay below 150 ms from source to destination.');
  multi('3.1', 'Which three requirements make a separate voice VLAN necessary? (Choose three.)', 3, [
    'Assured bandwidth', 'High QoS priority', 'The ability to avoid congestion', 'Encryption of every call', 'Jumbo frames'],
  'Voice also needs delay below 150 ms.');
  mc('3.1', 'What is the management VLAN used for?', [
    'Management traffic such as SSH or Telnet to the switch', 'User email and web traffic', 'Untagged trunk traffic', 'IP phone calls'],
  'It is usually the VLAN of the switch SVI and should be kept separate from user traffic.');
  mc('3.1', 'Which VLANs can never be deleted on a Catalyst switch?', ['VLAN 1 and VLANs 1002–1005', 'Only VLAN 1', 'VLAN 1 to 1005', 'Any VLAN with ports assigned'],
    'They are created automatically and cannot be deleted.');
  match('3.1', 'Match each VLAN type to its description.', [
    ['Data VLAN', 'Carries user-generated traffic'], ['Native VLAN', 'Untagged traffic on an 802.1Q trunk'],
    ['Management VLAN', 'SSH/Telnet access to the switch'], ['Voice VLAN', 'VoIP with priority and low delay'],
    ['Default VLAN', 'VLAN 1, where all ports start']],
  'These are the five VLAN types in topic 3.1.3.');
  tf('3.1', 'Without a Layer 3 device, hosts in different VLANs cannot communicate.', true,
    'VLANs are separate broadcast domains and subnets; routing is needed between them.');

  /* =============================== 3.2 =============================== */
  mc('3.2', 'What is a VLAN trunk?', [
    'A point-to-point link that carries more than one VLAN', 'A link that carries only the native VLAN',
    'An access port with a voice VLAN', 'A link between a PC and a switch'],
  'Trunks extend VLANs across the network and support all VLANs by default.');
  mc('3.2', 'How large is the 802.1Q tag?', ['4 bytes', '4 bits', '12 bits', '2 bytes'],
    'The tag is 4 bytes: TPID (2 bytes) + priority (3 bits) + CFI (1 bit) + VID (12 bits).');
  mc('3.2', 'Which hexadecimal value is in the Type (TPID) field of an 802.1Q tag?', ['0x8100', '0x0800', '0x86DD', '0x0806'],
    '0x8100 identifies the frame as 802.1Q-tagged. (0x0800 is IPv4, 0x86DD IPv6, 0x0806 ARP.)');
  mc('3.2', 'How many bits is the VLAN ID field?', ['12', '3', '16', '8'], '12 bits give 4096 VLAN IDs.');
  mc('3.2', 'What does the 3-bit User Priority field support?', [
    'Layer 2 class of service (CoS) priority values', 'Token Ring frames', 'The VLAN number', 'The frame length'],
  'It carries a CoS value from 0 to 7, used for QoS.');
  mc('3.2', 'Why must the FCS be recalculated when a tag is added?', [
    'The frame contents change, so the old checksum is no longer valid', 'The FCS holds the VLAN ID',
    'Trunks use a different FCS algorithm', 'It is not recalculated'],
  'Adding or removing the 4-byte tag changes the frame, so the FCS is recalculated.');
  mc('3.2', 'Unless changed, which VLAN is the native VLAN?', ['VLAN 1', 'VLAN 99', 'VLAN 1002', 'There is none'], 'VLAN 1 is the default native VLAN.');
  mc('3.2', 'What happens if the two ends of a trunk have different native VLANs?', [
    'CDP reports a native VLAN mismatch and untagged traffic leaks between the two VLANs', 'The trunk is shut down',
    'All VLANs stop working', 'The switches use VLAN 1 automatically'],
  'Both ends must use the same native VLAN.');
  mc('3.2', 'How does a Cisco IP phone learn which voice VLAN to use?', ['From CDP messages sent by the switch', 'From DHCP option 150', 'From DTP', 'It is configured on the phone only'],
    'The switch uses CDP to tell the phone the voice VLAN.');
  mc('3.2', 'A Cisco IP phone contains which component that connects the switch, the PC and the phone?', [
    'A three-port switch', 'A router', 'A hub', 'A wireless access point'],
  'The phone has a 3-port switch: one port to the switch, one to the PC and one internal port for the phone.');
  mc('3.2', 'In a network without VLANs, PC1 sends a broadcast. Who receives it?', [
    'All devices connected to the switches', 'Only devices on the same switch', 'Only the router', 'Nobody'],
  'Without VLANs, switches flood broadcasts out of all ports.');
  match('3.2', 'Match each 802.1Q tag field to its function.', [
    ['Type (TPID)', '0x8100 identifies a tagged frame'], ['User Priority', '3-bit CoS value'],
    ['CFI', '1 bit for Token Ring frames on Ethernet'], ['VID', '12-bit VLAN identifier']],
  'Together the fields make up the 4-byte tag.');
  tf('3.2', 'Each trunk is configured separately, so different trunks can use different native VLANs.', true,
    'Only the two ends of the same trunk must match.');
  cli('3.2', 'Display the data and voice VLANs assigned to Fa0/18.', { prompt: 'Switch#', answer: 'show interfaces fa0/18 switchport' },
  'The switchport output includes "Access Mode VLAN" and "Voice VLAN".');

  /* =============================== 3.3 =============================== */
  mc('3.3', 'Where are normal-range VLANs stored?', ['In the vlan.dat file in flash', 'In the startup configuration', 'Only in RAM', 'In NVRAM with the running configuration'],
    'This is why erasing the startup configuration does not remove VLANs.');
  mc('3.3', 'According to the course, which range is the extended VLAN range?', ['1006–4095', '1–1005', '1002–1005', '4096–8191'],
    'Extended-range VLANs are stored in the running configuration and need VTP transparent mode. (4095 itself is reserved.)');
  mc('3.3', 'VLAN 20 is created without a name. What name does IOS give it?', ['VLAN0020', 'VLAN20', 'default', 'vlan-20'],
    'IOS uses VLAN plus the four-digit VLAN number.');
  order('3.3', 'Order the commands to make Fa0/18 an access port in VLAN 20.', [
    'configure terminal', 'interface fa0/18', 'switchport mode access', 'switchport access vlan 20', 'end'],
  'Enter interface mode, set access mode, then assign the VLAN.');
  mc('3.3', 'How many VLANs can an access port belong to?', [
    'One data VLAN, plus optionally one voice VLAN', 'Only one VLAN in total', 'Up to four data VLANs', 'All VLANs'],
  'A phone and a PC can share one access port this way.');
  mc('3.3', 'What does no switchport access vlan do?', ['Returns the port to VLAN 1', 'Deletes the VLAN', 'Shuts the port down', 'Makes the port a trunk'],
    'It removes the access VLAN assignment, so the port goes back to the default VLAN.');
  mc('3.3', 'VLAN 30 is deleted while Fa0/5 is still assigned to it. What happens to Fa0/5?', [
    'It becomes inactive until reassigned or until VLAN 30 is re-created', 'It moves to VLAN 1', 'It becomes a trunk', 'It is shut down'],
  'Always move member ports before deleting a VLAN.');
  mc('3.3', 'How do you return a switch to its factory default configuration?', [
    'Erase the startup configuration, delete vlan.dat, then reload', 'Erase the startup configuration and reload',
    'Delete vlan.dat only', 'Use no vlan 1'],
  'The course also says to unplug data cables first.');
  mc('3.3', 'Which command shows how many VLANs exist?', ['show vlan summary', 'show vlan brief', 'show vtp count', 'show interfaces vlan'],
    'show vlan summary shows the number of existing VLANs.');
  mc('3.3', 'On a newer Catalyst switch you assign a port to VLAN 30, which does not exist. What happens?', [
    'The switch creates VLAN 30 and shows "% Access VLAN does not exist. Creating vlan 30"', 'The command is rejected',
    'The port moves to VLAN 1', 'The port shuts down'],
  'Newer Catalyst switches create the missing VLAN automatically.');
  tf('3.3', 'Normal-range VLAN changes survive a reload even if the configuration is not saved.', true,
    'They are written to vlan.dat in flash, not to the running configuration.');
  cli('3.3', 'Create VLAN 20.', { prompt: 'S1(config)#', answer: 'vlan 20' },
    'vlan 20 creates the VLAN and enters VLAN configuration mode.');
  cli('3.3', 'Name the VLAN "student".', { prompt: 'S1(config-vlan)#', answer: 'name student' },
    'name is entered in VLAN configuration mode.');
  cli('3.3', 'Assign this access port to VLAN 20.', { prompt: 'S1(config-if)#', answer: 'switchport access vlan 20' },
  'switchport access vlan assigns the data VLAN.');
  cli('3.3', 'Assign voice VLAN 150 to this port.', { prompt: 'S1(config-if)#', answer: 'switchport voice vlan 150' },
  'An access port can carry one voice VLAN in addition to its data VLAN.');
  cli('3.3', 'Delete VLAN 30.', { prompt: 'S1(config)#', answer: 'no vlan 30' },
    'Move member ports to another VLAN first.');

  /* =============================== 3.4 =============================== */
  mc('3.4', 'Which command makes Fa0/1 a permanent trunk?', ['switchport mode trunk', 'switchport trunk enable', 'switchport mode dynamic desirable', 'trunk on'],
    'switchport mode trunk sets permanent trunking mode.');
  mc('3.4', 'Which command sets the native VLAN to 99?', ['switchport trunk native vlan 99', 'no switchport trunk native vlan 99', 'switchport native 99', 'vlan 99 native'],
    'The no form resets the native VLAN to 1.');
  mc('3.4', 'A trunk allows VLANs 10 and 20. How do you also allow VLAN 30 without removing the others?', [
    'switchport trunk allowed vlan add 30', 'switchport trunk allowed vlan 30', 'switchport trunk allowed vlan all', 'switchport access vlan 30'],
  'Without the add keyword, the list is replaced.');
  mc('3.4', 'A trunk allows VLANs 10 and 20. What does switchport trunk allowed vlan 30 do?', [
    'Replaces the list so only VLAN 30 is allowed', 'Adds VLAN 30 to the list', 'Removes VLAN 30', 'Nothing'],
  'Use add, remove or except to change a list instead of replacing it.');
  mc('3.4', 'Which command resets the allowed VLAN list to its default?', ['no switchport trunk allowed vlan', 'switchport trunk allowed vlan none', 'no switchport mode trunk', 'default vlan'],
    'After reset, all VLANs are allowed.');
  mc('3.4', 'What are the trunk defaults after the trunk settings are reset?', [
    'All VLANs allowed, native VLAN 1', 'No VLANs allowed, native VLAN 1', 'All VLANs allowed, native VLAN 99', 'Only VLAN 1 allowed'],
  'These are the factory defaults for an 802.1Q trunk.');
  mc('3.4', 'Which command lists every operational trunk with its allowed and active VLANs?', ['show interfaces trunk', 'show vlan brief', 'show trunk', 'show dtp'],
    'Trunk ports are not shown in show vlan brief.');
  mc('3.4', 'On a Layer 3 switch that also supports ISL, which command is needed before switchport mode trunk?', [
    'switchport trunk encapsulation dot1q', 'switchport nonegotiate', 'no switchport', 'ip routing'],
  'The switch must know which trunking encapsulation to use.');
  mc('3.4', 'In show interfaces fa0/1 switchport, which line confirms the port is actually trunking?', [
    'Operational Mode: trunk', 'Administrative Mode: trunk', 'Negotiation of Trunking: On', 'Trunking VLANs Enabled: ALL'],
  'The administrative mode is what you configured; the operational mode is what is really happening.');
  tf('3.4', 'Trunk ports appear in the Ports column of show vlan brief.', false, 'Use show interfaces trunk to see trunk ports.');
  cli('3.4', 'Set the native VLAN of this trunk to 99.', { prompt: 'S1(config-if)#', answer: 'switchport trunk native vlan 99' }, 'Both ends of the trunk must use the same native VLAN.');
  cli('3.4', 'Allow only VLANs 10, 20, 30 and 99 on this trunk.', { prompt: 'S1(config-if)#', answer: 'switchport trunk allowed vlan 10,20,30,99' }, 'The list is comma-separated with no spaces.');
  cli('3.4', 'Change this trunk back into an access port.', { prompt: 'S1(config-if)#', answer: 'switchport mode access' },
  'The port becomes an access port administratively and operationally.');

  /* =============================== 3.5 =============================== */
  mc('3.5', 'Which statement describes DTP?', ['It is Cisco proprietary', 'It is an IEEE standard', 'It assigns VLAN IDs', 'It tags frames'],
    'The Dynamic Trunking Protocol negotiates trunking between Cisco switches.');
  mc('3.5', 'What is the default DTP mode on Catalyst 2960 switches?', ['dynamic auto', 'dynamic desirable', 'trunk', 'access'],
    'The default can vary by IOS and platform; on the 2960 and 2950 it is dynamic auto.');
  mc('3.5', 'Both ends of a link are set to dynamic auto. What is the result?', ['Access', 'Trunk', 'Limited connectivity', 'The link is shut down'],
    'Both sides wait passively, so no trunk forms.');
  mc('3.5', 'One end is dynamic desirable and the other is dynamic auto. What is the result?', ['Trunk', 'Access', 'Limited connectivity', 'No link'],
    'Desirable actively negotiates and auto agrees.');
  mc('3.5', 'One end is trunk and the other is access. What is the result?', ['Limited connectivity', 'Trunk', 'Access', 'The link negotiates to auto'],
    'Mixing a static trunk with a static access port does not work properly.');
  mc('3.5', 'Which command stops DTP negotiation on an interface?', ['switchport nonegotiate', 'no dtp', 'switchport mode dynamic auto', 'no switchport trunk'],
    'Use it together with a static mode (access or trunk).');
  mc('3.5', 'What is the DTP best practice?', [
    'Set interfaces statically to access or trunk and turn DTP off', 'Set every port to dynamic desirable',
    'Leave every port on dynamic auto', 'Use DTP to create all trunks'],
  'Static modes avoid unpredictable negotiation.');
  mc('3.5', 'Which command shows the current DTP mode of Fa0/1?', ['show dtp interface fa0/1', 'show interfaces fa0/1 dtp', 'show trunk dtp', 'show vlan dtp'],
    'Look at the TOS/TAS/TNS line.');
  mc('3.5', 'What happens if you enter switchport nonegotiate on a port in dynamic auto mode?', [
    'The command is rejected', 'The port becomes a trunk', 'The port becomes an access port', 'DTP is turned off'],
  'IOS reports a conflict between nonegotiate and dynamic status.');
  match('3.5', 'Match each switchport mode to its behaviour.', [
    ['access', 'Permanent access port'], ['dynamic auto', 'Trunks only if the neighbor asks (trunk or desirable)'],
    ['dynamic desirable', 'Actively tries to form a trunk'], ['trunk', 'Permanent trunk port']],
  'This is the negotiated interface modes table from topic 3.5.2.');
  cli('3.5', 'Turn off DTP negotiation on this static trunk.', { prompt: 'S1(config-if)#', answer: 'switchport nonegotiate' },
  'nonegotiate stops the port from sending DTP frames.');
  cli('3.5', 'Make this port actively try to form a trunk.', { prompt: 'S1(config-if)#', answer: 'switchport mode dynamic desirable' },
  'Desirable forms a trunk with neighbors set to trunk, desirable or auto.');

  /* =============================== 4.1 =============================== */
  mc('4.1', 'What is inter-VLAN routing?', ['Forwarding traffic from one VLAN to another', 'Tagging frames on a trunk', 'Negotiating trunks', 'Assigning ports to VLANs'],
    'It needs a router or a Layer 3 switch.');
  mc('4.1', 'Which inter-VLAN routing option is the most scalable?', ['A Layer 3 switch using SVIs', 'Router-on-a-stick', 'Legacy inter-VLAN routing', 'A hub with several VLANs'],
    'Layer 3 switching suits medium to large organizations.');
  mc('4.1', 'What limits legacy inter-VLAN routing?', [
    'It needs one physical router interface per VLAN', 'It needs a Layer 3 switch', 'It supports only one VLAN', 'It cannot use IPv4'],
  'Routers have few physical interfaces, so it does not scale.');
  mc('4.1', 'According to the course, router-on-a-stick does not scale beyond about how many VLANs?', ['50', '5', '500', '4094'],
    'All VLAN traffic shares one physical router interface.');
  mc('4.1', 'How is the router interface configured for router-on-a-stick?', [
    'As an 802.1Q trunk divided into subinterfaces', 'As an access port in VLAN 1', 'With one IP address for all VLANs', 'As a routed port with no switchport'],
  'Each subinterface handles one VLAN.');
  mc('4.1', 'What is the main disadvantage of a Layer 3 switch for inter-VLAN routing?', ['Cost', 'Speed', 'Latency', 'Scalability'],
    'Layer 3 switches are faster and more scalable, but more expensive.');
  multi('4.1', 'Which two are advantages of inter-VLAN routing on a Layer 3 switch? (Choose two.)', 2, [
    'It is faster because routing happens in hardware', 'No external link to a router is needed for routing',
    'It is the cheapest option', 'It supports only one VLAN', 'It needs one cable per VLAN'],
  'It also has lower latency and can use EtherChannel trunks for more bandwidth.');
  mc('4.1', 'With router-on-a-stick, how does a frame from VLAN 10 to VLAN 20 leave the router?', [
    'Out of the same physical interface, tagged with VLAN 20', 'Out of a second physical interface, untagged',
    'Out of the same interface, still tagged VLAN 10', 'It is dropped'],
  'The router re-tags the frame for the exit subinterface.');
  mc('4.1', 'What are subinterfaces?', [
    'Software-based virtual interfaces on one physical interface', 'Physical ports on a module', 'VLANs on a switch', 'Loopback interfaces'],
  'Each has its own IP address and VLAN assignment.');
  match('4.1', 'Match each inter-VLAN routing method to its description.', [
    ['Legacy', 'One router interface per VLAN; no longer used'], ['Router-on-a-stick', 'One router trunk with a subinterface per VLAN'],
    ['Layer 3 switch', 'SVIs routed in hardware inside the switch']],
  'These are the three options from topic 4.1.1.');

  /* =============================== 4.2 =============================== */
  mc('4.2', 'Which command creates the subinterface for VLAN 10 on G0/0/1?', ['interface g0/0/1.10', 'interface vlan 10', 'subinterface g0/0/1 10', 'encapsulation dot1q 10'],
    'The syntax is the physical interface, a period, and the subinterface number.');
  mc('4.2', 'Which command makes a subinterface respond to VLAN 10 traffic?', ['encapsulation dot1Q 10', 'switchport access vlan 10', 'vlan 10', 'ip vlan 10'],
    'encapsulation dot1Q vlan_id associates the subinterface with the VLAN.');
  mc('4.2', 'When is the native keyword added to the encapsulation dot1Q command?', [
    'When the native VLAN is not VLAN 1', 'Always', 'Never', 'Only for the management VLAN'],
  'By default VLAN 1 is native, so the keyword is only needed for a different native VLAN.');
  mc('4.2', 'What happens to the subinterfaces if the physical interface is shut down?', ['They are all disabled', 'They keep working', 'Only the native one works', 'They move to another interface'],
    'Enable the physical interface with no shutdown after creating the subinterfaces.');
  mc('4.2', 'How must the switch port connected to a router-on-a-stick be configured?', ['As a trunk', 'As an access port in VLAN 1', 'As a routed port', 'Shut down'],
    'The router needs tagged frames for every VLAN.');
  tf('4.2', 'The subinterface number must match the VLAN number.', false, 'It is customary, not required; the VLAN comes from the encapsulation command.');
  mc('4.2', 'PC1 pings PC2 in another VLAN and the reply shows TTL=127. What does this show?', [
    'The reply crossed one router from a Windows host (initial TTL 128)', 'The reply crossed 127 routers', 'The ping failed', 'The PC uses IPv6'],
  'Each router decrements the TTL by one.');
  order('4.2', 'Order the R1 configuration for VLAN 10 on router-on-a-stick.', [
    'interface g0/0/1.10', 'encapsulation dot1Q 10', 'ip address 192.168.10.1 255.255.255.0', 'interface g0/0/1', 'no shutdown'],
  'Encapsulation must be set before the IP address, and the physical interface must be enabled.');
  multi('4.2', 'Which two commands help verify router-on-a-stick? (Choose two.)', 2, [
    'show ip route', 'show interfaces trunk', 'show vtp status', 'show spanning-tree root', 'show dtp'],
  'The course also lists show ip interface brief and show interfaces.');
  mc('4.2', 'Why might the first pings to another VLAN time out before replies arrive?', [
    'ARP is still resolving addresses along the path', 'The trunk is renegotiating', 'The router is rebooting', 'The TTL is too low'],
  'Once the ARP entries exist, the following pings succeed.');
  mc('4.2', 'What does each router subinterface IP address usually serve as?', ['The default gateway for its VLAN', 'The router ID', 'The SVI of the switch', 'The native VLAN'],
    'Hosts in VLAN 10 use the G0/0/1.10 address as their gateway.');
  cli('4.2', 'Create the subinterface for VLAN 20 on G0/0/1.', { prompt: 'R1(config)#', answer: 'interface g0/0/1.20' },
  'The prompt changes to R1(config-subif)#.');
  cli('4.2', 'Associate this subinterface with VLAN 20.', { prompt: 'R1(config-subif)#', answer: 'encapsulation dot1Q 20' },
  'Without encapsulation, IOS will not accept an IP address on the subinterface.');
  cli('4.2', 'Give this subinterface the address 192.168.20.1/24.', { prompt: 'R1(config-subif)#', answer: 'ip address 192.168.20.1 255.255.255.0' },
  'This address is the default gateway for VLAN 20.');

  /* =============================== 4.3 =============================== */
  mc('4.3', 'Which command must be entered on a Layer 3 switch for IPv4 inter-VLAN routing?', ['ip routing', 'ipv6 unicast-routing', 'no switchport', 'router ospf 10'],
    'Without ip routing, SVIs answer only in their own VLAN.');
  mc('4.3', 'How is a routed port created on a Layer 3 switch?', ['no switchport on the interface', 'switchport mode routed', 'interface vlan', 'ip routing on the interface'],
    'The port then behaves like a router interface and can have an IP address.');
  mc('4.3', 'Which command creates an SVI?', ['interface vlan vlan-id', 'vlan vlan-id', 'switchport access vlan', 'encapsulation dot1q'],
    'It is the same command used for the management SVI.');
  order('4.3', 'Order the steps to configure inter-VLAN routing on a Layer 3 switch.', [
    'Create the VLANs', 'Create the SVI VLAN interfaces', 'Configure the access ports', 'Enable IP routing'],
  'This is the four-step process from topic 4.3.3.');
  mc('4.3', 'PCs in VLAN 10 on D1 use which default gateway?', ['The IP address of D1\'s VLAN 10 SVI', 'The router R1', 'The IP address of the routed port', 'None'],
    'Each SVI address is the gateway for its VLAN.');
  mc('4.3', 'Hosts can ping their own SVI, but not hosts in other VLANs on the same Layer 3 switch. What is most likely missing?', [
    'ip routing', 'A trunk', 'switchport mode access', 'A description'],
  'IP routing must be enabled to route between SVIs.');
  mc('4.3', 'Why are D1\'s VLANs advertised with OSPF in the second scenario?', [
    'So R1 learns D1\'s VLAN networks and D1 learns R1\'s networks', 'To create the VLANs', 'To negotiate trunks', 'To enable SSH'],
  'Other Layer 3 devices need routes to reach the VLAN subnets.');
  mc('4.3', 'A routed port on a Layer 3 switch is similar to what?', ['A physical interface on a router', 'An access port', 'A trunk port', 'An SVI'],
    'It is a Layer 3 interface with its own IP address.');
  order('4.3', 'Order the steps to configure D1 to route with R1.', [
    'Configure the routed port', 'Enable routing', 'Configure routing (OSPF)', 'Verify routing', 'Verify connectivity'],
  'This is the five-step process from topic 4.3.7.');
  tf('4.3', 'Layer 3 switch inter-VLAN routing is simpler to configure than router-on-a-stick.', true, 'No subinterfaces or trunk to a router are needed.');
  cli('4.3', 'Enable IPv4 routing on D1.', { prompt: 'D1(config)#', answer: 'ip routing' }, 'ip routing is a global configuration command.');
  cli('4.3', 'Convert G1/0/1 into a routed port.', { prompt: 'D1(config-if)#', answer: 'no switchport' },
    'After no switchport you can assign an IP address.');
  cli('4.3', 'Create the SVI for VLAN 10.', { prompt: 'D1(config)#', answer: 'interface vlan 10' },
    'Then add the gateway address and no shutdown.');

  /* =============================== 4.4 =============================== */
  mc('4.4', 'What should you check first when inter-VLAN routing fails?', ['The physical layer, such as cables in the wrong ports', 'The OSPF configuration', 'The IOS version', 'The enable secret'],
    'Start at Layer 1, then work through VLANs, ports, trunks and the router.');
  mc('4.4', 'show interfaces fa0/6 switchport shows "Access Mode VLAN: 10 (Inactive)". What is wrong?', [
    'VLAN 10 does not exist on the switch', 'Fa0/6 is a trunk', 'The router is down', 'The PC has the wrong gateway'],
  'Re-create VLAN 10 or reassign the port.');
  mc('4.4', 'With router-on-a-stick, what is the most common cause of inter-VLAN failures on the switch?', [
    'A misconfigured trunk port', 'A wrong hostname', 'A missing banner', 'A wrong console password'],
  'Check the port to the router with show interfaces trunk.');
  mc('4.4', 'A PC has the correct IP address, mask and gateway but cannot ping its gateway. What is a likely cause?', [
    'Its switch access port is in the wrong VLAN', 'The router has the wrong hostname', 'The trunk native VLAN is 1', 'OSPF is not configured'],
  'Verify with show vlan brief or show interfaces switchport.');
  mc('4.4', 'show interfaces | include Gig|802.1Q shows "Vlan ID 100" under G0/0/1.10. How do you fix it?', [
    'Enter encapsulation dot1Q 10 on G0/0/1.10', 'Create VLAN 100 on the switch', 'Change the PC gateway', 'Shut down G0/0/1.10'],
  'The subinterface must use the VLAN that its hosts are in.');
  mc('4.4', 'The switch port to the router does not appear in show interfaces trunk. Which command should you use next?', [
    'show running-config interface for that port', 'show ip route', 'show vlan summary', 'show ip ssh'],
  'It shows how the port is actually configured.');
  match('4.4', 'Match each issue to a command that verifies it.', [
    ['Missing VLANs', 'show vlan brief'], ['Switch trunk port issues', 'show interfaces trunk'],
    ['Switch access port issues', 'show interfaces switchport'], ['Router configuration issues', 'show ip interface brief']],
  'From the common inter-VLAN issues table in topic 4.4.1.');
  mc('4.4', 'A deleted VLAN is re-created. What happens to the ports that were assigned to it?', [
    'They become active again in that VLAN automatically', 'They stay inactive', 'They move to VLAN 1', 'They become trunks'],
  'Ports keep their VLAN association while the VLAN is missing.');
  multi('4.4', 'Which three are reasons a VLAN can be missing? (Choose three.)', 3, [
    'It was never created', 'It was deleted by accident', 'It is not allowed on the trunk', 'The PC is shut down', 'The router has no hostname'],
  'All three stop traffic for that VLAN.');
  mc('4.4', 'Router-on-a-stick configuration problems are usually related to what?', ['Subinterface misconfigurations', 'Console passwords', 'The banner', 'The IOS image'],
    'Check subinterface status and VLAN IDs.');
  cli('4.4', 'Show only the lines of show interfaces that contain "Gig" or "802.1Q".', { prompt: 'Router#', answer: 'show interfaces | include Gig|802.1Q' },
  'The | inside the expression means OR.');
  cli('4.4', 'Check which VLAN Fa0/6 belongs to, with the switchport details.', { prompt: 'Switch#', answer: 'show interfaces fa0/6 switchport' },
  'Look at the Access Mode VLAN line.');
})(typeof window !== 'undefined' ? window : globalThis);
