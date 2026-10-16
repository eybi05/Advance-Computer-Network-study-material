/* Module 1 — Basic Device Configuration (SRWE v7, slides in SRWE_Module_1.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm1', num: 1, title: 'Basic Device Configuration',
    objective: 'Configure devices using security best practices.',
    deck: 'SRWE_Module_1.pptx',
    topics: [
      /* ------------------------------------------------------------------ 1.1 */
      {
        id: '1.1', title: 'Configure a Switch with Initial Settings',
        objective: 'Configure initial settings on a Cisco switch.', slides: '13–23',
        read: `
<h3>The five-step boot sequence</h3>
<p>When a Cisco switch is powered on it runs through five steps, always in this order:</p>
<ol class="steps">
  <li><b>POST.</b> The power-on self-test program, stored in <b>ROM</b>, checks the CPU subsystem: the CPU, DRAM, and the part of flash that holds the file system.</li>
  <li><b>Boot loader starts.</b> The boot loader is a small program, also stored in ROM, that runs right after POST succeeds.</li>
  <li><b>Low-level CPU initialization.</b> The boot loader initializes the CPU registers, which control where physical memory is mapped, how much memory there is, and its speed.</li>
  <li><b>Flash file system initialization.</b> The boot loader initializes the flash file system on the system board.</li>
  <li><b>IOS is loaded.</b> The boot loader locates a default IOS image, loads it into memory, and hands control of the switch to IOS.</li>
</ol>

<h3>The <code>boot system</code> command</h3>
<p>The switch first tries to boot using the <b>BOOT environment variable</b>. If that variable is not set, it loads the first executable file it can find in flash. IOS then initializes the interfaces using the commands in the startup configuration, a file called <code>config.text</code> stored in flash.</p>
<pre class="cli">S1(config)# boot system flash:/c2960-lanbasek9-mz.150-2.SE/c2960-lanbasek9-mz.150-2.SE.bin</pre>
<table class="t"><tr><th>Part</th><th>Meaning</th></tr>
<tr><td><code>boot system</code></td><td>The main command (global configuration mode)</td></tr>
<tr><td><code>flash:</code></td><td>The storage device</td></tr>
<tr><td><code>c2960-lanbasek9-mz.150-2.SE/</code></td><td>The path (folder) in the file system</td></tr>
<tr><td><code>c2960-lanbasek9-mz.150-2.SE.bin</code></td><td>The IOS file name</td></tr></table>
<p>Use <code>show boot</code> to see which IOS file the BOOT variable currently points to.</p>

<h3>Switch LED indicators</h3>
<table class="t"><tr><th>LED</th><th>What it shows</th></tr>
<tr><td><b>SYST</b> (System)</td><td>Whether the system is receiving power and working properly.</td></tr>
<tr><td><b>RPS</b> (Redundant Power Supply)</td><td>Status of the redundant power supply.</td></tr>
<tr><td><b>STAT</b> (Port Status)</td><td>Green = port status mode is selected (the <b>default</b>). Each port LED then shows port status.</td></tr>
<tr><td><b>DUPLX</b> (Port Duplex)</td><td>Green = duplex mode selected. Each port LED then shows duplex.</td></tr>
<tr><td><b>SPEED</b> (Port Speed)</td><td>Green = speed mode selected. Each port LED then shows speed.</td></tr>
<tr><td><b>PoE</b> (Power over Ethernet)</td><td>Present only on PoE switches. Shows PoE status of the ports.</td></tr></table>
<p>The <b>Mode button</b> cycles through STAT, DUPLX, SPEED and PoE. When a mode is selected, each port LED means:</p>
<div class="scroll"><table class="t small"><tr><th></th><th>Off</th><th>Green</th><th>Blinking green</th><th>Amber</th><th>Blinking amber</th><th>Alternating green/amber</th></tr>
<tr><td><b>STAT</b></td><td>No link or shut down</td><td>Link up</td><td>Activity</td><td>Port blocked (preventing a loop)</td><td>Port blocked (preventing a loop)</td><td>Link fault</td></tr>
<tr><td><b>DUPLX</b></td><td>Half duplex</td><td>Full duplex</td><td>–</td><td>–</td><td>–</td><td>–</td></tr>
<tr><td><b>SPEED</b></td><td>10 Mb/s</td><td>100 Mb/s</td><td>1000 Mb/s</td><td>–</td><td>–</td><td>–</td></tr>
<tr><td><b>PoE</b> (port)</td><td>PoE off</td><td>PoE on</td><td>–</td><td>PoE disabled</td><td>PoE off due to fault</td><td>PoE denied (over budget)</td></tr>
<tr><td><b>RPS</b> (system LED)</td><td>Off / no RPS</td><td>RPS ready</td><td>RPS up but not available</td><td>RPS standby or fault</td><td>Internal PS failed, RPS providing power</td><td>–</td></tr></table></div>

<h3>Recovering from a system crash</h3>
<p>If IOS cannot be used because system files are missing or damaged, the <b>boot loader</b> gives you a command line with access to the files in flash. To reach it through a console connection:</p>
<ol class="steps">
  <li>Connect a PC to the console port with a console cable and start terminal emulation software.</li>
  <li>Unplug the switch power cord.</li>
  <li>Reconnect power and, <b>within 15 seconds</b>, press and hold the <b>Mode</b> button while the SYST LED is still flashing green.</li>
  <li>Keep holding until the SYST LED turns briefly amber and then solid green, then release.</li>
  <li>The boot loader prompt <code>switch:</code> appears.</li>
</ol>
<p>From the boot loader you can format the flash file system, reinstall IOS, and recover a lost password. For example, <code>dir</code> lists the files in a directory.</p>

<h3>Switch management access</h3>
<p>To manage a switch remotely it needs an <b>IP address and subnet mask</b>. To manage it from a <b>remote network</b> it also needs a <b>default gateway</b>, just like a host. The address goes on a <b>switch virtual interface (SVI)</b>: a virtual interface, not a physical port. Initial setup is done over the console cable.</p>
<p>By default all ports are in VLAN 1 and management happens through VLAN 1. Best practice is to use a different VLAN for management, for example VLAN 99.</p>
<h4>Step 1: Configure the management interface</h4>
<pre class="cli">S1# configure terminal
S1(config)# interface vlan 99
S1(config-if)# ip address 172.17.99.11 255.255.255.0
S1(config-if)# ipv6 address 2001:db8:acad:99::1/64
S1(config-if)# no shutdown
S1(config-if)# end
S1# copy running-config startup-config</pre>
<div class="note"><b>Note:</b> the SVI for VLAN 99 will not show <b>up/up</b> until VLAN 99 is created <i>and</i> a device is connected to a switch port in VLAN 99.</div>
<div class="note"><b>Note:</b> a Catalyst 2960 running IOS 15.0 needs <code>sdm prefer dual-ipv4-and-ipv6 default</code> followed by <code>reload</code> before it accepts IPv6 addresses.</div>
<h4>Step 2: Configure the default gateway</h4>
<pre class="cli">S1# configure terminal
S1(config)# ip default-gateway 172.17.99.1
S1(config)# end
S1# copy running-config startup-config</pre>
<p>No IPv6 default gateway is needed: the switch learns it from router advertisement (RA) messages.</p>
<h4>Step 3: Verify</h4>
<pre class="cli">S1# show ip interface brief
Interface      IP-Address     OK? Method Status   Protocol
Vlan99         172.17.99.11   YES manual down     down
S1# show ipv6 interface brief
Vlan99                 [down/down]
    FE80::C27B:BCFF:FEC4:A9C1
    2001:DB8:ACAD:99::1</pre>
<div class="note"><b>Important:</b> an IP address on the SVI is only for <b>remote management</b> of the switch. It does not let a Layer 2 switch route packets.</div>
<div class="errata"><b>Slide errata (slide 21):</b> the table shows <code>S1(config-if)# end</code> after <code>ip default-gateway</code>. That command is entered in global configuration mode, so the prompt is <code>S1(config)#</code>.</div>`,
        understand: {
          big: 'A switch boots from ROM code into IOS, and becomes manageable over the network only once its SVI has an address (and a default gateway, for remote networks).',
          why: 'Every lab starts here. If you cannot reach the switch remotely, the cause is almost always one of: no SVI address, SVI down (VLAN missing or no active port), or no default gateway.',
          keys: [
            'Boot order: POST (ROM), boot loader (ROM), CPU init, flash init, load IOS.',
            'BOOT variable set with <code>boot system</code>; check it with <code>show boot</code>. Startup config = <code>config.text</code> in flash.',
            'STAT is the default LED mode; the Mode button cycles STAT, DUPLX, SPEED, PoE.',
            'Crash recovery: hold Mode within 15 s of power-on until SYST goes amber then green; prompt <code>switch:</code>.',
            'Management = IP + mask on an SVI; remote management also needs <code>ip default-gateway</code>.',
            'An SVI is up/up only when its VLAN exists and at least one port in that VLAN is up.',
          ],
          traps: [
            { trap: 'Thinking an SVI address lets a Layer 2 switch route.', fix: 'It only provides management access. Routing needs a router or a Layer 3 switch with <code>ip routing</code>.' },
            { trap: 'Configuring <code>ip default-gateway</code> and expecting it to be used for IPv6.', fix: 'IPv6 switches learn the gateway from router advertisements.' },
            { trap: 'Expecting the SVI to come up right after <code>no shutdown</code>.', fix: 'The VLAN must exist and a port in it must be up.' },
            { trap: 'Mixing up which program runs POST.', fix: 'POST and the boot loader both live in ROM; IOS lives in flash.' },
          ],
          analogy: 'The SVI is the switch\'s own "desk phone" in a VLAN: it lets you call the switch to manage it, but it does not make the switch a telephone exchange (router).',
          explain: [
            { q: 'Why does a switch need a default gateway to be managed from another network, but not from its own subnet?', a: 'Replies to hosts on other subnets must be sent to a router. Without a default gateway the switch can answer only hosts in its own subnet.' },
            { q: 'Your SVI shows down/down. List two reasons.', a: 'The VLAN does not exist on the switch, or no port in that VLAN is up (or the SVI itself is shut down, which shows "administratively down").' },
            { q: 'What lets you recover a switch whose IOS file is corrupt?', a: 'The boot loader in ROM. Hold the Mode button during power-on to reach the switch: prompt.' },
          ],
          widgets: ['boot', 'leds'],
        },
      },
      /* ------------------------------------------------------------------ 1.2 */
      {
        id: '1.2', title: 'Configure Switch Ports',
        objective: 'Configure switch ports to meet network requirements.', slides: '24–37',
        read: `
<h3>Duplex communication</h3>
<p><b>Full duplex</b> lets both ends transmit and receive at the same time (bidirectional). It requires <b>microsegmentation</b>: a switch port with only one device connected, running full duplex. A full-duplex port has <b>no collision domain</b>.</p>
<p><b>Half duplex</b> is unidirectional: data flows one way at a time, which often causes collisions and performance problems.</p>
<p>Gigabit Ethernet and 10 Gb NICs require full duplex. In full duplex the NIC\'s collision-detection circuit is disabled, and you get 100% efficiency in both directions, doubling the potential use of the stated bandwidth.</p>

<h3>Configure duplex and speed</h3>
<p>The interface commands are <code>duplex</code> and <code>speed</code>. On Catalyst 2960 and 3560 the default for both is <b>auto</b>. 10/100/1000 ports run half or full duplex at 10 or 100 Mb/s, but <b>only full duplex at 1000 Mb/s</b>.</p>
<pre class="cli">S1# configure terminal
S1(config)# interface FastEthernet 0/1
S1(config-if)# duplex full
S1(config-if)# speed 100
S1(config-if)# end
S1# copy running-config startup-config</pre>
<ul>
  <li>Use <b>autonegotiation</b> when the other device\'s settings are unknown or may change.</li>
  <li>For known devices (servers, dedicated workstations, network devices) best practice is to <b>set speed and duplex manually</b>.</li>
  <li>When troubleshooting a port, always check duplex and speed. <b>Mismatched</b> settings cause connectivity problems, and a failed autonegotiation creates mismatches.</li>
  <li>Fiber ports such as 1000BASE-SX run at one preset speed and are always full duplex.</li>
</ul>

<h3>Auto-MDIX</h3>
<p>With <b>auto-MDIX</b> (automatic medium-dependent interface crossover) the port detects whether a straight-through or crossover cable is attached and adapts. Without it you must use straight-through cables to servers, workstations and routers, and crossover cables to other switches or repeaters.</p>
<pre class="cli">S1(config-if)# mdix auto
S1# show controllers ethernet-controller fa0/1 phy | include Auto-MDIX
 Auto-MDIX                             :  On   [AdminState=1   Flags=0x00052248]</pre>
<p>For auto-MDIX to work the interface <b>speed and duplex must both be auto</b>. It is enabled by default on Catalyst 2960 and 3560, but is not available on the older 2950 and 3550.</p>

<h3>Switch verification commands</h3>
<table class="t"><tr><th>Task</th><th>Command</th></tr>
<tr><td>Interface status and configuration</td><td><code>show interfaces [interface-id]</code></td></tr>
<tr><td>Startup configuration</td><td><code>show startup-config</code></td></tr>
<tr><td>Running configuration</td><td><code>show running-config</code></td></tr>
<tr><td>Flash file system</td><td><code>show flash</code></td></tr>
<tr><td>Hardware and software status</td><td><code>show version</code></td></tr>
<tr><td>Command history</td><td><code>show history</code></td></tr>
<tr><td>IP information about an interface</td><td><code>show ip interface [id]</code> / <code>show ipv6 interface [id]</code></td></tr>
<tr><td>MAC address table</td><td><code>show mac address-table</code> (older: <code>show mac-address-table</code>)</td></tr></table>
<pre class="cli">S1# show interfaces fastEthernet 0/18
FastEthernet0/18 is up, line protocol is up (connected)
  Hardware is Fast Ethernet, address is 0025.83e6.9092 (bia 0025.83e6.9092)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
  Full-duplex, 100Mb/s, media type is 10/100BaseTX</pre>

<h3>Network access layer issues</h3>
<p>The first line of <code>show interfaces</code> holds two states. The first (<b>FastEthernet0/18 is up</b>) is the <b>hardware layer</b>: is a carrier detected? The second (<b>line protocol is up</b>) is the <b>data link layer</b>: are keepalives received?</p>
<table class="t"><tr><th>Output</th><th>Likely problem</th></tr>
<tr><td>Interface <b>up</b>, line protocol <b>down</b></td><td>Encapsulation type mismatch, the other end is error-disabled, or a hardware problem.</td></tr>
<tr><td>Interface <b>down</b>, line protocol <b>down</b></td><td>No cable attached, or another interface problem. In a back-to-back connection the other end may be administratively down.</td></tr>
<tr><td><b>Administratively down</b></td><td>The interface was disabled manually with <code>shutdown</code>.</td></tr></table>

<h3>Interface input and output errors</h3>
<table class="t"><tr><th>Counter</th><th>Meaning</th></tr>
<tr><td><b>Input errors</b></td><td>Total of all received errors: runts, giants, no buffer, CRC, frame, overrun and ignored.</td></tr>
<tr><td><b>Runts</b></td><td>Frames smaller than the minimum (Ethernet: less than <b>64 bytes</b>). Usually a malfunctioning NIC; collisions can also cause them.</td></tr>
<tr><td><b>Giants</b></td><td>Frames larger than the maximum (Ethernet: more than <b>1,518 bytes</b>).</td></tr>
<tr><td><b>CRC</b></td><td>Calculated checksum differs from the received one. Usually media/cable problems: electrical interference, loose or damaged connections, wrong cabling. Many CRC errors mean too much noise on the link.</td></tr>
<tr><td><b>Output errors</b></td><td>Sum of all errors that stopped frames from being sent out the interface.</td></tr>
<tr><td><b>Collisions</b></td><td>Retransmissions because of collisions. <b>Normal in half duplex</b>; you should <b>never</b> see them on a full-duplex link.</td></tr>
<tr><td><b>Late collisions</b></td><td>A collision after <b>512 bits</b> of the frame were sent. Most common causes: excessive cable length and <b>duplex misconfiguration</b>.</td></tr></table>

<h3>Troubleshooting flow (no connection or bad connection)</h3>
<ol class="steps">
  <li>Run <code>show interfaces</code>. Is the interface up?</li>
  <li><b>No:</b> verify proper cables, check cables and connectors for damage, verify speed is set the same on both ends.</li>
  <li><b>Yes:</b> look for signs of EMI/noise and remove the sources; verify duplex is set properly on both ends.</li>
  <li>Problem solved? Done. Otherwise document the work and escalate.</li>
</ol>`,
        understand: {
          big: 'Speed and duplex must agree on both ends of a link, and the counters in show interfaces tell you which physical-layer problem you have.',
          why: 'Duplex mismatches are the classic "it works, but slowly" problem. Reading show interfaces quickly (status line plus error counters) is a core troubleshooting skill tested in labs and exams.',
          keys: [
            'Full duplex needs microsegmentation (one device per port) and has no collision domain.',
            '1000 Mb/s runs only in full duplex; fiber ports are always full duplex.',
            'Defaults are <code>duplex auto</code>, <code>speed auto</code>, <code>mdix auto</code>.',
            'Auto-MDIX needs speed and duplex set to auto.',
            '"up/down" = layer 2 problem (encapsulation, err-disabled peer); "down/down" = cable or physical problem; "administratively down" = shutdown.',
            'Runt < 64 bytes, giant > 1518 bytes, late collision after 512 bits.',
          ],
          traps: [
            { trap: 'Assuming collisions are always bad.', fix: 'They are normal in half duplex. On a full-duplex interface they indicate a problem.' },
            { trap: 'Setting only one side of a link to fixed full/100.', fix: 'The auto side cannot negotiate, falls back to half duplex, and you get a duplex mismatch with late collisions.' },
            { trap: 'Forcing speed and expecting auto-MDIX to keep working.', fix: 'Auto-MDIX requires both speed and duplex on auto.' },
          ],
          analogy: 'Half duplex is a walkie-talkie (one talks, others listen); full duplex is a phone call (both talk at once). A duplex mismatch is one person on a phone and the other on a walkie-talkie: they keep talking over each other.',
          explain: [
            { q: 'A port shows many late collisions. What are the two most likely causes?', a: 'A duplex mismatch (one side half, the other full), or a cable that is too long.' },
            { q: 'Why should you never see collisions on a full-duplex link?', a: 'Each direction has its own pair and only one device is on the segment, so frames cannot collide.' },
            { q: 'What does "FastEthernet0/1 is up, line protocol is down" tell you?', a: 'Layer 1 sees a carrier, but layer 2 keepalives fail: an encapsulation mismatch, an error-disabled far end, or a hardware fault.' },
          ],
          widgets: ['duplex', 'iferrors'],
        },
      },
      /* ------------------------------------------------------------------ 1.3 */
      {
        id: '1.3', title: 'Secure Remote Access',
        objective: 'Configure secure management access on a switch.', slides: '38–45',
        read: `
<h3>Telnet versus SSH</h3>
<div class="cols">
  <div><h4>Telnet: TCP port 23</h4><p>An older protocol that sends <b>everything in plaintext</b>: the username, the password and all session data. A threat actor with Wireshark can read the login (in the example: username <code>admin</code>, password <code>ccna</code>).</p></div>
  <div><h4>SSH: TCP port 22</h4><p>Provides an <b>encrypted</b> management connection. Authentication (username and password) and session data are encrypted. A threat actor can still see the session exists (by IP address) but not its contents. <b>SSH should replace Telnet.</b></p></div>
</div>

<h3>Verify the switch supports SSH</h3>
<p>SSH needs an IOS image with cryptographic features. In <code>show version</code>, an image name containing <b>k9</b> supports encryption.</p>
<pre class="cli">S1# show version
Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE7, RELEASE SOFTWARE (fc1)</pre>

<h3>Configure SSH: six steps</h3>
<p>Before you start, the switch needs a <b>unique hostname</b> and working network connectivity (SVI address, default gateway).</p>
<ol class="steps">
  <li><b>Verify SSH support:</b> <code>show ip ssh</code>. If IOS has no crypto features, the command is not recognized.</li>
  <li><b>Configure the IP domain:</b> <code>ip domain-name cisco.com</code></li>
  <li><b>Generate RSA key pairs:</b> <code>crypto key generate rsa</code>. Generating the key pair <b>automatically enables SSH</b>. (<code>crypto key zeroize rsa</code> deletes the keys and disables the SSH server.)</li>
  <li><b>Configure user authentication:</b> <code>username admin secret ccna</code> creates a local user.</li>
  <li><b>Configure the vty lines:</b> <code>line vty 0 15</code>, then <code>transport input ssh</code> (allow only SSH) and <code>login local</code> (check the local username database).</li>
  <li><b>Enable SSH version 2:</b> <code>ip ssh version 2</code>. By default both versions are supported, which <code>show ip ssh</code> reports as version 1.99.</li>
</ol>
<pre class="cli">S1# show ip ssh
S1# configure terminal
S1(config)# ip domain-name cisco.com
S1(config)# crypto key generate rsa
The name for the keys will be: S1.cisco.com
How many bits in the modulus [512]: 1024
% Generating 1024 bit RSA keys, keys will be non-exportable...[OK]
S1(config)# username admin secret ccna
S1(config)# line vty 0 15
S1(config-line)# transport input ssh
S1(config-line)# login local
S1(config-line)# exit
S1(config)# ip ssh version 2
S1(config)# exit</pre>

<h3>Verify SSH is operational</h3>
<p>From a PC use an SSH client (PuTTY, or <code>ssh -l admin 172.17.99.11</code>) to connect to the switch SVI address. After entering the username and password you are at the switch CLI.</p>
<pre class="cli">S1# show ip ssh
SSH Enabled - version 2.0
Authentication timeout: 120 secs; Authentication retries: 3
S1# show ssh
Connection Version Mode Encryption  Hmac         State           Username
0          2.0     IN   aes256-cbc  hmac-sha1    Session started admin
0          2.0     OUT  aes256-cbc  hmac-sha1    Session started admin</pre>
<div class="errata"><b>Slide errata (slide 42, step 6):</b> the slide says supporting both versions "is shown in the show ip ssh output as supporting version 2". The actual output for both versions is <b>version 1.99</b>; after <code>ip ssh version 2</code> it shows <b>version 2.0</b>.</div>`,
        understand: {
          big: 'Telnet exposes credentials in plaintext; SSH encrypts them. SSH needs a k9 image, a hostname, a domain name, RSA keys, local users, and vty lines restricted to SSH.',
          why: 'Securing management access is required in nearly every skills assessment, and the six steps are a favourite ordering question.',
          keys: [
            'Telnet = TCP 23, plaintext. SSH = TCP 22, encrypted.',
            '"k9" in the IOS image name = cryptographic support.',
            'Order: verify (show ip ssh), ip domain-name, crypto key generate rsa, username ... secret ..., line vty: transport input ssh + login local, ip ssh version 2.',
            'Generating RSA keys enables SSH; zeroizing them disables it.',
            'RSA keys need a non-default hostname and a domain name; SSH v2 needs keys of at least 768 bits.',
            '<code>show ip ssh</code> shows version/config; <code>show ssh</code> shows active sessions.',
          ],
          traps: [
            { trap: 'Running <code>crypto key generate rsa</code> while the hostname is still "Switch".', fix: 'IOS refuses: set a unique hostname and an IP domain name first.' },
            { trap: 'Using <code>login</code> instead of <code>login local</code> on the vty lines.', fix: '<code>login</code> checks the line password; <code>login local</code> checks the username database you created.' },
            { trap: 'Forgetting <code>transport input ssh</code>.', fix: 'Telnet would still be accepted on the vty lines.' },
          ],
          analogy: 'Telnet is a postcard: anyone handling it can read it. SSH is a sealed, locked envelope: the courier sees who it is for, not what is inside.',
          explain: [
            { q: 'Why does SSH need a domain name and a hostname?', a: 'The RSA key pair is named hostname.domain-name; IOS will not generate keys without both.' },
            { q: 'What two vty commands make the switch accept only SSH with local accounts?', a: '<code>transport input ssh</code> and <code>login local</code>.' },
            { q: 'Why is Telnet still supported if it is insecure?', a: 'Legacy compatibility and simple lab use on trusted networks; it should not be used on production networks.' },
          ],
          widgets: ['telnetssh', 'sshorder'],
        },
      },
      /* ------------------------------------------------------------------ 1.4 */
      {
        id: '1.4', title: 'Basic Router Configuration',
        objective: 'Configure basic settings on a router to route between two directly-connected networks, using CLI.', slides: '46–53',
        read: `
<h3>Basic router settings</h3>
<p>Routers and switches share a similar modal OS, command structure and many commands. These initial tasks should always be done: <b>name the device</b>, <b>set passwords</b>, configure a <b>banner</b>, and <b>save</b>.</p>
<pre class="cli">Router# configure terminal
Router(config)# hostname R1
R1(config)# enable secret class
R1(config)# line console 0
R1(config-line)# password cisco
R1(config-line)# login
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# password cisco
R1(config-line)# login
R1(config-line)# exit
R1(config)# service password-encryption
R1(config)# banner motd $ Authorized Access Only! $
R1(config)# end
R1# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]</pre>
<p>The banner provides <b>legal notification</b> that unauthorized access is prohibited. The character after <code>motd</code> (here <code>$</code>) is a delimiter that marks the start and end of the message.</p>

<h3>Dual-stack topology</h3>
<p>One difference between switches and routers is the interfaces they support. Layer 2 switches support LANs, so they have many FastEthernet/GigabitEthernet ports. Routers support LANs <b>and</b> WANs and connect different types of networks: for example ISR G2 routers have Gigabit Ethernet ports plus HWIC slots for serial, DSL and cable interfaces.</p>
<div class="scroll"><table class="t small"><tr><th>Link</th><th>IPv4</th><th>IPv6</th></tr>
<tr><td>R1 G0/0/0 to S1 (LAN 1)</td><td>192.168.10.1/24</td><td>2001:db8:acad:1::1/64</td></tr>
<tr><td>R1 G0/0/1 to S2 (LAN 2)</td><td>192.168.11.1/24</td><td>2001:db8:acad:2::1/64</td></tr>
<tr><td>R1 S0/1/0 to R2 (WAN)</td><td>209.165.200.225/30</td><td>2001:db8:acad:3::225/64</td></tr></table></div>

<h3>Configure router interfaces</h3>
<p>For an interface to be available it must be:</p>
<ul>
  <li><b>Configured with at least one IP address:</b> <code>ip address <i>ip mask</i></code> and/or <code>ipv6 address <i>ipv6/prefix</i></code>.</li>
  <li><b>Activated:</b> router LAN and WAN interfaces are <b>shut down by default</b>. Use <code>no shutdown</code>. It must also be connected to another device (hub, switch or router) for the physical layer to come up.</li>
  <li><b>Described (optional, recommended):</b> <code>description</code> of up to 240 characters. Very helpful in troubleshooting and for recording third-party contact details.</li>
</ul>
<pre class="cli">R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# description Link to LAN 1
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet 0/0/1
R1(config-if)# ip address 192.168.11.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:2::1/64
R1(config-if)# description Link to LAN 2
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface serial 0/1/0
R1(config-if)# ip address 209.165.200.225 255.255.255.252
R1(config-if)# ipv6 address 2001:db8:acad:3::225/64
R1(config-if)# description Link to R2
R1(config-if)# no shutdown</pre>

<h3>IPv4 loopback interfaces</h3>
<p>A <b>loopback</b> is a logical, software interface inside the router. It is not tied to a physical port, can never be connected to another device, and is <b>automatically up</b> while the router is running. That guarantees at least one interface is always available, which is useful for testing and management (for example, emulating networks behind the router). In labs you can create several loopbacks to simulate more networks; this course often uses one to simulate a link to the internet. Each loopback address must be unique.</p>
<pre class="cli">Router(config)# interface loopback 0
Router(config-if)# ip address 10.0.0.1 255.255.255.0</pre>`,
        understand: {
          big: 'A router interface forwards traffic only when it has an address, is administratively enabled (no shutdown), and is physically connected.',
          why: 'The "three conditions" (address, no shutdown, connected) explain most "my router interface is down" problems, and the basic security settings are graded in every lab.',
          keys: [
            'Always: hostname, enable secret, console and vty passwords with login, service password-encryption, banner motd, save.',
            'Router interfaces are shut down by default (switch ports are not).',
            'An interface needs an IP address + <code>no shutdown</code> + a physical connection.',
            'Descriptions: up to 240 characters, very useful in troubleshooting.',
            'Loopbacks are logical, always up, never cabled; each needs a unique address.',
          ],
          traps: [
            { trap: 'Forgetting <code>no shutdown</code> on router interfaces.', fix: 'They stay "administratively down" until you enable them.' },
            { trap: 'Using <code>enable password</code> instead of <code>enable secret</code>.', fix: 'enable secret is stored as a hash; enable password is weak (type 7 at best). If both exist, the secret wins.' },
            { trap: 'Expecting <code>service password-encryption</code> to strongly protect passwords.', fix: 'It only applies weak type 7 encoding to stop shoulder-surfing.' },
          ],
          analogy: 'A router interface is like a shop door: it needs an address on it (IP), the door unlocked (no shutdown), and a street outside (a cable to another device).',
          explain: [
            { q: 'Name the three things an interface needs to be available.', a: 'An IP address, to be activated with no shutdown, and a connection to another device.' },
            { q: 'Why is a loopback interface useful for testing?', a: 'It is always up while the router runs, so it gives a stable address and can simulate extra networks.' },
            { q: 'What does the motd banner protect against legally?', a: 'It gives notice that unauthorized access is prohibited, which supports legal action against intruders.' },
          ],
          widgets: ['ifready'],
        },
      },
      /* ------------------------------------------------------------------ 1.5 */
      {
        id: '1.5', title: 'Verify Directly Connected Networks',
        objective: 'Verify connectivity between two networks that are directly connected to a router.', slides: '54–63',
        read: `
<h3>Interface verification commands</h3>
<ul>
  <li><code>show ip interface brief</code> / <code>show ipv6 interface brief</code>: a summary of every interface with its address and status.</li>
  <li><code>show running-config interface <i>id</i></code>: the commands applied to one interface.</li>
  <li><code>show ip route</code> / <code>show ipv6 route</code>: the routing table in RAM. In IOS 15 an active interface creates <b>two</b> entries: <b>C</b> (connected network) and <b>L</b> (local address). Older IOS showed only C.</li>
  <li><code>show interfaces</code>: details and packet counts for all interfaces.</li>
  <li><code>show ip interface</code> / <code>show ipv6 interface</code>: IPv4/IPv6 details for interfaces.</li>
</ul>
<pre class="cli">R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   192.168.11.1    YES manual up                    up
Serial0/1/0            209.165.200.225 YES manual up                    up
Serial0/1/1            unassigned      YES unset  administratively down down</pre>
<p>Status <b>up</b> and Protocol <b>up</b> mean the interface works. Anything else points to a configuration or cabling problem.</p>

<h3>IPv6 link-local and multicast addresses</h3>
<p><code>show ipv6 interface brief</code> shows <b>two</b> addresses per interface: the global unicast address you configured, and a <b>link-local</b> address beginning with <b>FE80</b>. A link-local address is added automatically whenever a global unicast address is assigned. An IPv6 interface <b>must</b> have a link-local address; a global address is optional.</p>
<pre class="cli">R1# show ipv6 interface gigabitethernet 0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::7279:B3FF:FE92:3130
  Global unicast address(es):
    2001:DB8:ACAD:1::1, subnet is 2001:DB8:ACAD:1::/64
  Joined group address(es):
    FF02::1
    FF02::1:FF00:1
    FF02::1:FF92:3130</pre>
<p>The joined multicast groups begin with <b>FF02</b>: FF02::1 (all nodes), FF02::2 (all routers, when IPv6 routing is enabled) and the solicited-node addresses FF02::1:FFxx:xxxx.</p>

<h3>Verify routes</h3>
<pre class="cli">R1# show ip route
      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/0</pre>
<ul>
  <li><b>C</b> = directly connected network. When an interface with a global unicast address is up/up, its IPv6 prefix and length are added as a connected route.</li>
  <li><b>L</b> = local host route: the router\'s own address on that interface, with a <b>/32</b> mask (IPv4) or <b>/128</b> (IPv6) and an <b>administrative distance of 0</b>. It lets the router process packets addressed to itself efficiently.</li>
</ul>

<h3>Filter show command output</h3>
<p>Long output pauses after 24 lines with <code>--More--</code>: <b>Enter</b> shows the next line, <b>Spacebar</b> the next screen. <code>terminal length 0</code> turns pausing off.</p>
<p>Add a pipe <code>|</code> after a show command, then a filter and an expression:</p>
<table class="t"><tr><th>Filter</th><th>Shows</th></tr>
<tr><td><code>section</code></td><td>The entire section that starts with the expression</td></tr>
<tr><td><code>include</code></td><td>Only lines that match</td></tr>
<tr><td><code>exclude</code></td><td>All lines except those that match</td></tr>
<tr><td><code>begin</code></td><td>Everything from the first matching line onward</td></tr></table>
<pre class="cli">R1# show running-config | section line vty
R1# show ip interface brief | include up
R1# show ip interface brief | exclude unassigned
R1# show ip route | begin Gateway</pre>

<h3>Command history</h3>
<ul>
  <li><b>Ctrl+P</b> or <b>Up Arrow</b>: recall older commands. <b>Ctrl+N</b> or <b>Down Arrow</b>: move back toward recent ones.</li>
  <li>History is on by default and keeps the <b>last 10</b> command lines.</li>
  <li><code>show history</code> (privileged EXEC) displays the buffer.</li>
  <li><code>terminal history size <i>n</i></code> (user EXEC) changes the buffer size for the current session only.</li>
</ul>`,
        understand: {
          big: 'Verification is a routine: check status (brief), check the interface config, then check the routing table, filtering output to see only what matters.',
          why: 'Troubleshooting labs reward speed. Knowing which command answers which question, and filtering output, saves minutes in every assessment.',
          keys: [
            'Up/up = working. Admin down = shutdown. Down/down = cable or peer.',
            'Every IPv6 interface has a link-local FE80:: address; a global address is optional.',
            'C = connected network; L = local /32 (/128) host route, AD 0.',
            'Filters: section, include, exclude, begin (after a pipe).',
            'History: Up/Ctrl+P, Down/Ctrl+N; 10 lines by default; <code>terminal history size</code>.',
          ],
          traps: [
            { trap: 'Thinking the L route is a separate network.', fix: 'It is the router\'s own interface address, as a /32 (or /128) host route.' },
            { trap: 'Typing <code>show run | include</code> with the wrong case.', fix: 'Filter expressions are case-sensitive: <code>include Vlan</code> is not <code>include vlan</code>.' },
            { trap: 'Believing <code>terminal history size</code> is saved.', fix: 'It applies to the current session only.' },
          ],
          analogy: 'show ip interface brief is the dashboard warning lights; show interfaces is the full diagnostic printout; filters are the search box.',
          explain: [
            { q: 'Why does each active interface create two routes in IOS 15?', a: 'A C route for the connected network and an L route for the interface\'s own address.' },
            { q: 'Which filter would you use to see the whole line vty section of the running config?', a: '<code>show running-config | section line vty</code>' },
            { q: 'An interface has a global IPv6 address but you also see an FE80 address. Why?', a: 'A link-local address is created automatically whenever IPv6 is enabled on an interface; it is mandatory.' },
          ],
          widgets: ['ifstatus', 'routetable'],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
