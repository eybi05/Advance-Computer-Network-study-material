/* Module 12 — WLAN Concepts (SRWE v7, slides in SRWE_Module_12.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm12', num: 12, title: 'WLAN Concepts',
    objective: 'Explain how WLANs enable network connectivity.',
    deck: 'SRWE_Module_12.pptx',
    topics: [
      /* ------------------------------------------------------------------ 12.1 */
      {
        id: '12.1', title: 'Introduction to Wireless',
        objective: 'Describe WLAN technology and standards.', slides: '15–21',
        read: `
<h3>Benefits of wireless</h3>
<p>A <b>wireless LAN (WLAN)</b> is common in homes, offices and campuses. WLANs make <b>mobility</b> possible, and wireless infrastructures adapt quickly to changing needs and technologies.</p>

<h3>Types of wireless networks</h3>
<table class="t"><tr><th>Type</th><th>Scope</th></tr>
<tr><td><b>WPAN</b> (personal area)</td><td>Low power, short range (20–30 ft / 6–9 m). IEEE 802.15, 2.4 GHz. Bluetooth and Zigbee.</td></tr>
<tr><td><b>WLAN</b> (local area)</td><td>Medium-sized networks up to about 300 ft. IEEE 802.11, 2.4 or 5 GHz.</td></tr>
<tr><td><b>WMAN</b> (metropolitan area)</td><td>A city or district. Specific licensed frequencies.</td></tr>
<tr><td><b>WWAN</b> (wide area)</td><td>National or global. Specific licensed frequencies.</td></tr></table>

<h3>Wireless technologies</h3>
<ul>
  <li><b>Bluetooth</b>: IEEE WPAN standard for device pairing, up to 300 ft (100 m). <b>Bluetooth Low Energy (BLE)</b> supports mesh topologies for large-scale device networks; <b>Bluetooth Basic Rate/Enhanced Rate (BR/EDR)</b> supports point-to-point and is optimised for audio streaming.</li>
  <li><b>WiMAX</b> (Worldwide Interoperability for Microwave Access): an alternative to wired broadband, IEEE 802.16, up to 30 miles (50 km).</li>
  <li><b>Cellular broadband</b>: voice and data for phones, cars, tablets and laptops. GSM (internationally recognised) and CDMA (mainly in the US).</li>
  <li><b>Satellite broadband</b>: a directional dish aligned with a geostationary satellite; needs a clear line of sight. Used in rural areas without cable or DSL.</li>
</ul>
<div class="errata"><b>Slide errata (slide 17):</b> WiMAX (IEEE 802.16) is a <b>WMAN</b> technology, not a "WLAN standard" as the slide says.</div>

<h3>802.11 standards</h3>
<table class="t"><tr><th>Standard</th><th>Band</th><th>Notes</th></tr>
<tr><td>802.11</td><td>2.4 GHz</td><td>Up to 2 Mb/s.</td></tr>
<tr><td>802.11a</td><td>5 GHz</td><td>Up to 54 Mb/s; not interoperable with 802.11b or g.</td></tr>
<tr><td>802.11b</td><td>2.4 GHz</td><td>Up to 11 Mb/s; longer range than 802.11a and better through building structures.</td></tr>
<tr><td>802.11g</td><td>2.4 GHz</td><td>Up to 54 Mb/s; backward compatible with 802.11b.</td></tr>
<tr><td>802.11n</td><td>2.4 and 5 GHz</td><td>150–600 Mb/s; needs multiple antennas with <b>MIMO</b>.</td></tr>
<tr><td>802.11ac</td><td>5 GHz</td><td>450 Mb/s – 1.3 Gb/s; up to eight antennas.</td></tr>
<tr><td>802.11ax</td><td>2.4 and 5 GHz</td><td>High-Efficiency Wireless (<b>HEW</b>); can use the 1 GHz and 7 GHz bands.</td></tr></table>

<h3>Radio frequencies</h3>
<p>All wireless devices use the electromagnetic spectrum. WLANs use two bands:</p>
<ul><li><b>2.4 GHz (UHF)</b>: 802.11b/g/n/ax.</li><li><b>5 GHz (SHF)</b>: 802.11a/n/ac/ax.</li></ul>

<h3>Standards organizations</h3>
<ul>
  <li><b>ITU</b>: regulates the allocation of radio spectrum and satellite orbits.</li>
  <li><b>IEEE</b>: specifies how a radio frequency is modulated to carry information; maintains the IEEE 802 LAN/MAN standards.</li>
  <li><b>Wi-Fi Alliance</b>: an association of vendors that promotes WLANs and improves the interoperability of 802.11 products.</li>
</ul>`,
        understand: {
          big: 'WLANs are IEEE 802.11 networks in the 2.4 and 5 GHz bands; each newer standard adds speed (n, ac, ax) and the IEEE, ITU and Wi-Fi Alliance keep devices interoperable.',
          why: 'You need to place a technology in the right network type and match 802.11 standards to their band and speed.',
          keys: [
            'WPAN (802.15: Bluetooth, Zigbee), WLAN (802.11), WMAN, WWAN.',
            '2.4 GHz: b, g, n, ax. 5 GHz: a, n, ac, ax.',
            'a: 5 GHz 54 Mb/s. b: 2.4 GHz 11 Mb/s. g: 2.4 GHz 54 Mb/s. n: both bands, MIMO. ac: 5 GHz up to 1.3 Gb/s. ax: HEW.',
            '802.11a is not compatible with b/g; g is backward compatible with b.',
            'ITU: spectrum. IEEE: modulation and standards. Wi-Fi Alliance: interoperability.',
          ],
          traps: [
            { trap: 'Putting 802.11ac in the 2.4 GHz band.', fix: '802.11ac uses 5 GHz only; n and ax use both bands.' },
            { trap: 'Thinking 802.11a and 802.11g interoperate because both reach 54 Mb/s.', fix: 'They use different bands (5 GHz vs 2.4 GHz).' },
            { trap: 'Calling the Wi-Fi Alliance a standards body like the IEEE.', fix: 'It is a vendor association that promotes and certifies interoperability of 802.11 products.' },
          ],
          analogy: 'The bands are motorways: 2.4 GHz is the older, crowded road that goes further through walls; 5 GHz is the wider, newer road with more lanes but shorter reach.',
          explain: [
            { q: 'Which 802.11 standards can use both 2.4 GHz and 5 GHz?', a: '802.11n and 802.11ax.' },
            { q: 'Why does 802.11b have a longer range than 802.11a?', a: 'It uses 2.4 GHz, which travels further and penetrates building structures better than 5 GHz.' },
            { q: 'What does each organization do: ITU, IEEE, Wi-Fi Alliance?', a: 'ITU allocates spectrum, IEEE writes the 802.11 standards, the Wi-Fi Alliance certifies interoperability.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 12.2 */
      {
        id: '12.2', title: 'WLAN Components',
        objective: 'Describe the components of a WLAN infrastructure.', slides: '23–28',
        read: `
<h3>Wireless NICs</h3>
<p>Laptops, tablets, smartphones and even cars include integrated wireless NICs with a radio transmitter/receiver. A device without one can use a <b>USB wireless adapter</b>.</p>

<h3>Wireless home router</h3>
<p>Homes usually use a small wireless router that acts as:</p>
<ul><li>an <b>access point</b>, for wireless access;</li><li>a <b>switch</b>, to interconnect wired devices;</li><li>a <b>router</b>, providing the default gateway to other networks and the internet.</li></ul>

<h3>Wireless access points</h3>
<p>Clients use their wireless NIC to discover nearby APs, then <b>associate</b> and <b>authenticate</b> with one. After authentication they can use the network. (The slide shows Cisco Meraki Go access points.)</p>

<h3>AP categories</h3>
<div class="cols">
  <div><h4>Autonomous APs</h4><p>Standalone devices configured through a CLI or GUI. Each one works independently and is configured and managed manually by an administrator.</p></div>
  <div><h4>Controller-based APs</h4><p>Also called <b>lightweight APs (LAPs)</b>. They communicate with a <b>WLAN controller (WLC)</b> using the Lightweight Access Point Protocol (LWAPP) and are configured and managed automatically by the WLC. Useful when many APs are needed.</p></div>
</div>
<div class="errata"><b>Slide errata (slide 27):</b> "LWAN controller (WLC)" should be <b>WLAN</b> controller. The terms slide also writes "WLAC" for WLC. Topic 12.4 explains that today's controllers use <b>CAPWAP</b>, which is based on LWAPP.</div>

<h3>Wireless antennas</h3>
<ul>
  <li><b>Omnidirectional</b>: 360-degree coverage; ideal in houses and offices.</li>
  <li><b>Directional</b>: focus the signal in one direction; for example <b>Yagi</b> and <b>parabolic dish</b>.</li>
  <li><b>MIMO</b> (Multiple Input Multiple Output): multiple antennas (up to eight) to increase bandwidth.</li>
</ul>`,
        understand: {
          big: 'Wireless clients use a wireless NIC to associate with an AP; small sites use an all-in-one wireless router, larger sites use many lightweight APs managed by a WLC.',
          why: 'Choosing between autonomous and controller-based APs, and knowing what a home router contains, are common exam topics.',
          keys: [
            'Wireless NIC built in, or a USB wireless adapter.',
            'Home wireless router = AP + switch + router.',
            'Clients discover, authenticate and associate with an AP.',
            'Autonomous APs: configured one by one. Controller-based (lightweight) APs: managed by a WLC.',
            'Antennas: omnidirectional (360°), directional (Yagi, parabolic dish), MIMO (up to 8 antennas).',
          ],
          traps: [
            { trap: 'Thinking lightweight APs are configured individually.', fix: 'LAPs need no initial configuration; the WLC configures and manages them.' },
            { trap: 'Using an omnidirectional antenna for a point-to-point link between buildings.', fix: 'Directional antennas (Yagi, dish) focus the signal for long, narrow links.' },
          ],
          analogy: 'Autonomous APs are independent shops each run by its own manager; lightweight APs are franchise outlets run centrally from head office (the WLC).',
          explain: [
            { q: 'What three roles does a wireless home router combine?', a: 'Access point, Ethernet switch and router (default gateway).' },
            { q: 'When would you choose controller-based APs?', a: 'When many APs are needed, so they can be configured and managed centrally by a WLC.' },
            { q: 'What does MIMO do?', a: 'Uses multiple antennas (up to eight) to increase bandwidth.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 12.3 */
      {
        id: '12.3', title: 'WLAN Operation',
        objective: 'Explain how wireless technology enables WLAN operation.', slides: '30–37',
        read: `
<h3>802.11 topology modes</h3>
<ul>
  <li><b>Ad hoc</b>: clients connect peer to peer without an AP.</li>
  <li><b>Infrastructure</b>: clients connect to the network through an AP.</li>
  <li><b>Tethering</b>: a variation of ad hoc in which a smartphone or tablet with cellular data creates a personal hotspot.</li>
</ul>

<h3>BSS and ESS</h3>
<ul>
  <li><b>Basic Service Set (BSS)</b>: a single AP interconnects all its associated clients. Clients in different BSSs cannot communicate directly.</li>
  <li><b>Extended Service Set (ESS)</b>: two or more BSSs joined by a wired <b>distribution system</b>; clients in each BSS can communicate through the ESS.</li>
</ul>

<h3>802.11 frame structure</h3>
<p>Similar to an Ethernet frame, with more fields. Header: <b>Frame Control, Duration, Address 1, Address 2, Address 3, Sequence Control, Address 4</b>; then the <b>Payload</b> and the <b>FCS</b>.</p>

<h3>CSMA/CA</h3>
<p>WLANs are <b>half duplex</b>, and a client cannot hear while it sends, so it cannot detect collisions. WLANs use <b>carrier sense multiple access with collision avoidance</b>:</p>
<ol class="steps">
  <li>Listen to the channel to see if it is idle.</li>
  <li>Send a <b>Request to Send (RTS)</b> to the AP to ask for dedicated access.</li>
  <li>Receive a <b>Clear to Send (CTS)</b> from the AP.</li>
  <li>If no CTS arrives, wait a random time and start again.</li>
  <li>Transmit the data.</li>
  <li>Every transmission is <b>acknowledged</b>. No acknowledgment means the client assumes a collision and starts again.</li>
</ol>

<h3>Client and AP association</h3>
<p>Three stages: <b>discover</b> a wireless AP, <b>authenticate</b> with it, <b>associate</b> with it. Both sides must agree on:</p>
<ul>
  <li><b>SSID</b>: the network name.</li>
  <li><b>Password</b>: needed to authenticate.</li>
  <li><b>Network mode</b>: the 802.11 standard in use.</li>
  <li><b>Security mode</b>: WEP, WPA or WPA2.</li>
  <li><b>Channel settings</b>: the frequency band in use.</li>
</ul>

<h3>Passive and active discovery</h3>
<ul>
  <li><b>Passive mode</b>: the AP advertises its service with periodic broadcast <b>beacon</b> frames containing the SSID, supported standards and security settings.</li>
  <li><b>Active mode</b>: the client must know the SSID; it broadcasts a <b>probe request</b> on multiple channels.</li>
</ul>`,
        understand: {
          big: 'In infrastructure mode clients join an AP (BSS); several APs on a wired distribution system form an ESS. Clients avoid collisions with CSMA/CA (RTS/CTS and ACKs) and find APs from beacons or probes.',
          why: 'BSS vs ESS, CSMA/CA and the association steps are the core of how a WLAN works.',
          keys: [
            'Modes: ad hoc (no AP), infrastructure (AP), tethering (hotspot).',
            'BSS: one AP. ESS: several BSSs connected by a wired distribution system.',
            'WLANs are half duplex: CSMA/CA (avoid), not CSMA/CD (detect).',
            'CSMA/CA: listen, RTS, CTS, send, ACK; no CTS or no ACK → wait and retry.',
            'Association: discover → authenticate → associate; agree on SSID, password, network mode, security mode, channel.',
            'Passive: AP beacons. Active: client probe requests (needs the SSID).',
          ],
          traps: [
            { trap: 'Saying WLANs use CSMA/CD.', fix: 'A radio cannot hear while it transmits, so WLANs avoid collisions with CSMA/CA.' },
            { trap: 'Thinking clients in two BSSs talk directly.', fix: 'They communicate through the ESS distribution system.' },
            { trap: 'Confusing beacons and probes.', fix: 'Beacons come from the AP (passive); probe requests come from the client (active).' },
          ],
          analogy: 'CSMA/CA is a radio conversation: "Can I talk?" (RTS), "Go ahead" (CTS), the message, then "Received" (ACK). Silence means try again later.',
          explain: [
            { q: 'Why can a wireless client not detect collisions?', a: 'WLANs are half duplex and a radio cannot listen while it is sending.' },
            { q: 'What is the difference between a BSS and an ESS?', a: 'A BSS is one AP and its clients; an ESS joins several BSSs over a wired distribution system.' },
            { q: 'What parameters must a client and AP agree on to associate?', a: 'SSID, password, network mode (802.11 standard), security mode and channel.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 12.4 */
      {
        id: '12.4', title: 'CAPWAP Operation',
        objective: 'Explain how a WLC uses CAPWAP to manage multiple APs.', slides: '39–43',
        read: `
<h3>Introduction to CAPWAP</h3>
<ul>
  <li><b>Control and Provisioning of Wireless Access Points (CAPWAP)</b> lets a WLC manage multiple APs and WLANs.</li>
  <li>It is based on <b>LWAPP</b> but adds security with <b>Datagram Transport Layer Security (DTLS)</b>.</li>
  <li>It encapsulates and forwards WLAN client traffic between an AP and a WLC in tunnels over <b>UDP ports 5246 and 5247</b>.</li>
  <li>It runs over IPv4 and IPv6; IPv4 uses IP protocol 17 and IPv6 uses IP protocol 136.</li>
</ul>
<div class="errata"><b>Slide errata (slide 40):</b> CAPWAP is an <b>IETF</b> standard (RFC 5415), not an IEEE standard as the slide states, and "DLTS" is a typo for DTLS. UDP port 5246 carries control traffic and 5247 carries data.</div>

<h3>Split MAC architecture</h3>
<p>CAPWAP splits the functions of an AP between the AP and the WLC:</p>
<table class="t"><tr><th>AP MAC functions</th><th>WLC MAC functions</th></tr>
<tr><td>Beacons and probe responses</td><td>Authentication</td></tr>
<tr><td>Packet acknowledgments and retransmissions</td><td>Association and re-association of roaming clients</td></tr>
<tr><td>Frame queueing and packet prioritization</td><td>Frame translation to other protocols</td></tr>
<tr><td>MAC layer data encryption and decryption</td><td>Termination of 802.11 traffic on a wired interface</td></tr></table>

<h3>DTLS encryption</h3>
<p>DTLS secures the connection between the AP and the WLC. It is <b>enabled by default</b> for the CAPWAP <b>control</b> channel. <b>Data</b> encryption is <b>disabled by default</b> and needs a DTLS license on the WLC before it can be enabled on the AP.</p>

<h3>FlexConnect APs</h3>
<p>FlexConnect allows APs to be configured and controlled over a <b>WAN link</b> (for example in a branch office). Two modes:</p>
<ul>
  <li><b>Connected mode</b>: the WLC is reachable; the AP has CAPWAP connectivity through the tunnel and the WLC performs all CAPWAP functions.</li>
  <li><b>Standalone mode</b>: the WLC is unreachable; the AP takes over some WLC functions, such as switching client data locally and authenticating clients locally.</li>
</ul>`,
        understand: {
          big: 'CAPWAP tunnels traffic between lightweight APs and the WLC over UDP 5246/5247 and splits the work: time-critical radio tasks stay on the AP, management tasks move to the WLC.',
          why: 'Controller-based WLANs rely on CAPWAP, and the split-MAC table is a typical exam question.',
          keys: [
            'CAPWAP: WLC manages APs and WLANs; based on LWAPP plus DTLS.',
            'UDP 5246 (control) and 5247 (data); works over IPv4 and IPv6.',
            'AP: beacons/probe responses, ACKs and retransmissions, queueing/prioritisation, MAC encryption.',
            'WLC: authentication, association/roaming, frame translation, terminating 802.11 traffic on the wire.',
            'DTLS: control channel encrypted by default; data encryption off by default (needs a license).',
            'FlexConnect: connected mode (WLC reachable) vs standalone mode (local switching and authentication).',
          ],
          traps: [
            { trap: 'Putting authentication on the AP side of the split MAC.', fix: 'Authentication and association are WLC functions.' },
            { trap: 'Thinking DTLS encrypts all traffic by default.', fix: 'Only the control channel; data encryption requires a license and must be enabled.' },
          ],
          analogy: 'The AP is the shop counter handling the customers in real time; the WLC is head office approving memberships and keeping the records. CAPWAP is the secure pneumatic tube between them.',
          explain: [
            { q: 'Which UDP ports does CAPWAP use?', a: '5246 for control traffic and 5247 for data.' },
            { q: 'Name two AP and two WLC functions in the split MAC architecture.', a: 'AP: beacons and probe responses, ACKs and retransmissions (also queueing, encryption). WLC: authentication, association of roaming clients (also frame translation, termination of 802.11 traffic).' },
            { q: 'What happens to a FlexConnect AP when the WAN to the WLC fails?', a: 'It goes into standalone mode and can switch client traffic and authenticate clients locally.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 12.5 */
      {
        id: '12.5', title: 'Channel Management',
        objective: 'Describe channel management in a WLAN.', slides: '45–48',
        read: `
<h3>Frequency channel saturation</h3>
<p>If demand for one channel is too high, it becomes oversaturated and communication quality drops. Modulation techniques use channels more efficiently:</p>
<ul>
  <li><b>DSSS</b> (Direct-Sequence Spread Spectrum): spreads a signal over a larger frequency band. Used by 802.11b to avoid interference from other 2.4 GHz devices.</li>
  <li><b>FHSS</b> (Frequency-Hopping Spread Spectrum): rapidly switches the carrier among many channels; sender and receiver must be synchronised. Used by the original 802.11 standard.</li>
  <li><b>OFDM</b> (Orthogonal Frequency-Division Multiplexing): one channel uses multiple sub-channels on adjacent frequencies. Used by 802.11a/g/n/ac.</li>
</ul>

<h3>Channel selection</h3>
<ul>
  <li>The <b>2.4 GHz</b> band is divided into channels, each <b>22 MHz</b> wide and <b>5 MHz</b> from the next, so neighbouring channels overlap.</li>
  <li>Best practice for 802.11b/g/n WLANs with several APs: use the <b>non-overlapping channels 1, 6 and 11</b>.</li>
  <li>For <b>5 GHz</b> (802.11a/n/ac) there are <b>24 channels</b>, each <b>20 MHz</b> from the next. The course gives <b>36, 48 and 60</b> as non-overlapping channels: spacing them further apart keeps the side lobes of neighbouring channels from interfering.</li>
</ul>

<h3>Planning a WLAN deployment</h3>
<p>The number of users a WLAN supports depends on:</p>
<ul><li>the geographical layout of the facility;</li><li>the number of bodies and devices that fit in a space;</li><li>the data rates users expect;</li><li>the use of non-overlapping channels by multiple APs, and the transmit power settings.</li></ul>
<p>When planning AP locations, use the approximate <b>circular coverage area</b> of each AP, with some overlap between neighbouring APs (and different channels).</p>`,
        understand: {
          big: 'Neighbouring APs must use channels that do not overlap: 1, 6 and 11 in 2.4 GHz (22 MHz wide, 5 MHz apart), and widely spaced channels such as 36, 48, 60 in 5 GHz.',
          why: 'Channel planning is the difference between a fast WLAN and a slow one, and "1, 6, 11" is a guaranteed exam question.',
          keys: [
            'Channel saturation degrades quality.',
            'DSSS (802.11b), FHSS (original 802.11), OFDM (802.11a/g/n/ac).',
            '2.4 GHz: 22 MHz channels, 5 MHz apart → non-overlapping 1, 6, 11.',
            '5 GHz: 24 channels, 20 MHz apart → course answer 36, 48, 60.',
            'Planning: layout, density, data rates, non-overlapping channels and transmit power; circular coverage areas.',
          ],
          traps: [
            { trap: 'Putting neighbouring APs on channels 1, 2 and 3.', fix: 'Adjacent 2.4 GHz channels overlap; use 1, 6 and 11.' },
            { trap: 'Matching OFDM to 802.11b.', fix: '802.11b uses DSSS; OFDM is used by 802.11a/g/n/ac.' },
          ],
          analogy: 'Three conversations in one room are fine if they are at opposite corners (channels 1, 6, 11); side by side (1, 2, 3) everyone talks over everyone.',
          explain: [
            { q: 'Why do channels 1 and 2 interfere in the 2.4 GHz band?', a: 'Each channel is 22 MHz wide but only 5 MHz from the next, so neighbouring channels overlap.' },
            { q: 'Which factors limit how many users a WLAN supports?', a: 'Layout, density of people and devices, expected data rates, non-overlapping channels and transmit power.' },
          ],
          widgets: ['channels24'],
        },
      },
      /* ------------------------------------------------------------------ 12.6 */
      {
        id: '12.6', title: 'WLAN Threats',
        objective: 'Describe threats to WLANs.', slides: '50–54',
        read: `
<h3>Wireless security overview</h3>
<p>A WLAN is open to anyone within range of an AP who has the credentials to associate. Attacks come from outsiders, disgruntled employees and even employees by accident. Main threats:</p>
<ul><li><b>Interception of data</b></li><li><b>Wireless intruders</b></li><li><b>Denial of Service (DoS) attacks</b></li><li><b>Rogue APs</b></li></ul>

<h3>DoS attacks</h3>
<p>Wireless DoS can result from improperly configured devices, a malicious user deliberately interfering with wireless communication, or accidental interference. To minimise the risk: harden all devices, keep passwords secure, create backups, and make configuration changes off-hours.</p>

<h3>Rogue access points</h3>
<ul>
  <li>A <b>rogue AP</b> is an AP or wireless router connected to the corporate network <b>without authorization</b> and against policy.</li>
  <li>An attacker can use it to capture MAC addresses and data packets, gain access to network resources, or launch a man-in-the-middle attack.</li>
  <li>A personal hotspot can also act as a rogue AP, for example an authorized Windows host that is turned into a Wi-Fi AP.</li>
  <li>Prevention: configure <b>WLCs with rogue AP policies</b> and use monitoring software to watch the radio spectrum for unauthorized APs.</li>
</ul>

<h3>Man-in-the-middle attack</h3>
<p>The attacker sits between two parties to read or modify their traffic. A popular wireless version is the <b>evil twin AP</b>: a rogue AP with the <b>same SSID</b> as a legitimate AP. Defence starts with identifying the legitimate devices on the WLAN, which requires <b>authenticating users</b>; the network can then be monitored for abnormal devices or traffic.</p>`,
        understand: {
          big: 'Anyone in radio range is a potential attacker: they can intercept data, intrude, jam (DoS), plug in rogue APs or impersonate an AP (evil twin).',
          why: 'Recognising rogue APs and evil-twin MITM attacks, and how they are prevented, is expected knowledge.',
          keys: [
            'Threats: interception, intruders, DoS, rogue APs.',
            'DoS causes: misconfiguration, malicious interference, accidental interference.',
            'Rogue AP: unauthorized AP on the corporate network (a personal hotspot counts).',
            'Prevent rogue APs: WLC rogue AP policies and spectrum monitoring.',
            'Evil twin: rogue AP with the same SSID as a legitimate one (MITM). Defence: user authentication and monitoring.',
          ],
          traps: [
            { trap: 'Thinking a rogue AP must be installed by an outsider.', fix: 'Employees often create rogue APs, for example by turning a laptop into a hotspot.' },
            { trap: 'Thinking SSID cloaking stops evil twins.', fix: 'The attacker simply uses the same SSID; you need authentication and monitoring.' },
          ],
          analogy: 'An evil twin is a fake cash machine stuck in front of the real one: same look, same name, but it reads your card.',
          explain: [
            { q: 'What is an evil twin attack?', a: 'A rogue AP configured with the same SSID as a legitimate AP, used to intercept client traffic (man-in-the-middle).' },
            { q: 'How do organizations detect rogue APs?', a: 'WLC rogue AP policies and monitoring software that watches the radio spectrum.' },
          ],
          widgets: [],
        },
      },
      /* ------------------------------------------------------------------ 12.7 */
      {
        id: '12.7', title: 'Secure WLANs',
        objective: 'Describe WLAN security mechanisms.', slides: '56–63',
        read: `
<h3>SSID cloaking and MAC address filtering</h3>
<p>Two early features, still available on most APs and routers:</p>
<ul>
  <li><b>SSID cloaking</b>: the SSID beacon frame is disabled; clients must be configured with the SSID manually.</li>
  <li><b>MAC address filtering</b>: the administrator permits or denies clients by their MAC address. Devices with other MAC addresses cannot join.</li>
</ul>

<h3>Original 802.11 authentication methods</h3>
<ul>
  <li><b>Open system authentication</b>: no password; typical for free internet access in cafés, airports and hotels. The client must provide its own security, for example a VPN.</li>
  <li><b>Shared key authentication</b>: mechanisms such as WEP, WPA, WPA2 and WPA3 authenticate and encrypt data; the password is pre-shared between client and AP.</li>
</ul>

<h3>Shared key authentication methods</h3>
<table class="t"><tr><th>Method</th><th>Description</th></tr>
<tr><td><b>WEP</b></td><td>Original 802.11 specification: <b>RC4</b> encryption with a static key. No longer recommended and should never be used.</td></tr>
<tr><td><b>WPA</b></td><td>Wi-Fi Alliance standard that uses WEP but secures the data with the much stronger <b>TKIP</b>, which changes the key for each packet.</td></tr>
<tr><td><b>WPA2</b></td><td>Uses <b>AES</b>, currently considered the strongest encryption protocol.</td></tr>
<tr><td><b>WPA3</b></td><td>Next generation: uses the latest security methods, disallows legacy protocols and requires <b>Protected Management Frames (PMF)</b>.</td></tr></table>

<h3>Authenticating a home user</h3>
<ul>
  <li><b>Personal</b>: for home and small office networks. Users authenticate with a <b>pre-shared key (PSK)</b>; no authentication server is needed.</li>
  <li><b>Enterprise</b>: for enterprise networks. Requires a <b>RADIUS</b> server: the device is authenticated by the RADIUS server and users authenticate with <b>802.1X</b>, which uses the <b>Extensible Authentication Protocol (EAP)</b>.</li>
</ul>

<h3>Encryption methods</h3>
<ul>
  <li><b>TKIP</b>: used by WPA, supports legacy equipment; uses WEP but encrypts the Layer 2 payload with TKIP.</li>
  <li><b>AES</b>: used by WPA2, with <b>CCMP</b> (Counter Cipher Mode with Block Chaining Message Authentication Code Protocol), which lets the receiver detect whether encrypted and unencrypted bits were altered.</li>
</ul>

<h3>Authentication in the enterprise</h3>
<p>Enterprise mode needs an AAA RADIUS server. Three pieces of information are required:</p>
<ul>
  <li>The <b>RADIUS server IP address</b>.</li>
  <li>The <b>UDP port numbers</b>: <b>1812</b> for RADIUS authentication and <b>1813</b> for RADIUS accounting (or 1645 and 1646).</li>
  <li>A <b>shared key</b> that authenticates the AP with the RADIUS server.</li>
</ul>
<p>User authentication and authorization are handled by 802.1X, which provides centralised, server-based authentication of end users.</p>

<h3>WPA3</h3>
<p>WPA2 is no longer considered secure, so use WPA3 when available. Four features:</p>
<ul>
  <li><b>WPA3-Personal</b>: stops brute-force attacks with <b>Simultaneous Authentication of Equals (SAE)</b>.</li>
  <li><b>WPA3-Enterprise</b>: 802.1X/EAP, with a <b>192-bit</b> cryptographic suite, and no mixing with older protocols.</li>
  <li><b>Open networks</b>: no authentication, but <b>Opportunistic Wireless Encryption (OWE)</b> encrypts all traffic.</li>
  <li><b>IoT onboarding</b>: <b>Device Provisioning Protocol (DPP)</b> to onboard IoT devices quickly.</li>
</ul>`,
        understand: {
          big: 'Real WLAN security comes from authentication and encryption: WPA2 (AES/CCMP) or better WPA3, with Personal (PSK) for homes and Enterprise (RADIUS + 802.1X/EAP) for organizations. SSID cloaking and MAC filtering are only weak extras.',
          why: 'Choosing the right security mode and knowing which encryption goes with which standard are standard exam questions.',
          keys: [
            'SSID cloaking and MAC filtering are easy to bypass.',
            'Open authentication: no password; shared key: WEP, WPA, WPA2, WPA3.',
            'WEP: RC4, static key, never use. WPA: TKIP. WPA2: AES (CCMP). WPA3: PMF required.',
            'Personal = PSK, no server. Enterprise = RADIUS server + 802.1X/EAP.',
            'RADIUS: UDP 1812 authentication, 1813 accounting (or 1645/1646); needs server IP, ports and a shared key.',
            'WPA3: Personal (SAE), Enterprise (192-bit), Open (OWE), IoT onboarding (DPP).',
          ],
          traps: [
            { trap: 'Pairing TKIP with WPA2 as the recommended choice.', fix: 'WPA2 uses AES with CCMP; TKIP belongs to WPA and legacy devices.' },
            { trap: 'Thinking Personal mode needs a RADIUS server.', fix: 'Personal uses a pre-shared key; Enterprise needs RADIUS.' },
            { trap: 'Relying on SSID cloaking for security.', fix: 'The SSID still appears in other frames; use WPA2/WPA3.' },
          ],
          analogy: 'Personal mode is one shared door code for the family; Enterprise mode gives each employee their own badge checked by central security (RADIUS).',
          explain: [
            { q: 'What three pieces of information does an AP need to use a RADIUS server?', a: 'The server IP address, the UDP ports (1812/1813 or 1645/1646) and the shared key.' },
            { q: 'Why should WEP never be used?', a: 'It uses RC4 with a static key that is easy to crack.' },
            { q: 'What does WPA3-Personal use to resist brute-force attacks?', a: 'Simultaneous Authentication of Equals (SAE).' },
          ],
          widgets: [],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
