/* Module 2 — Switching Concepts (SRWE v7, slides in SRWE_Module_2.pptx) */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  SRWE.content = SRWE.content || { modules: [] };

  SRWE.content.modules.push({
    id: 'm2', num: 2, title: 'Switching Concepts',
    objective: 'Explain how Layer 2 switches forward data.',
    deck: 'SRWE_Module_2.pptx',
    topics: [
      /* ------------------------------------------------------------------ 2.1 */
      {
        id: '2.1', title: 'Frame Forwarding',
        objective: 'Explain how frames are forwarded in a switched network.', slides: '12–19',
        read: `
<h3>Switching in networking</h3>
<ul>
  <li><b>Ingress</b>: a frame <b>entering</b> an interface. <b>Egress</b>: a frame <b>leaving</b> an interface.</li>
  <li>A switch forwards based on the <b>ingress interface</b> and the <b>destination MAC address</b>, using its <b>MAC address table</b>.</li>
  <li>A switch never forwards traffic out of the interface it was received on.</li>
</ul>

<h3>The MAC address table</h3>
<p>To choose the egress interface from the destination MAC, the switch must first learn where each device is. It builds the <b>MAC address table</b>, also called the <b>Content Addressable Memory (CAM) table</b>, by recording each frame\'s <b>source</b> MAC address together with the port it arrived on.</p>

<h3>Learn and forward: two steps</h3>
<ol class="steps">
  <li><b>Learn: examine the source address.</b> If the source MAC is not in the table, add it with the ingress port. If it is already there, reset its aging timer to <b>5 minutes</b> (300 seconds).</li>
  <li><b>Forward: examine the destination address.</b> If the destination MAC is in the table, forward the frame out of that port only. If it is not (an <b>unknown unicast</b>), or the frame is a broadcast, <b>flood</b> it out of all ports except the ingress port.</li>
</ol>
<div class="note"><b>Three possible actions</b> (from the instructor notes): a Layer 2 switch can <b>flood</b> (broadcast or unknown unicast), <b>forward</b> (known unicast), or <b>filter</b> (drop a frame whose destination is on the same port it came in on). A Layer 1 hub can only flood. A Layer 3 router forwards or drops, and <b>never floods</b>.</div>

<h3>Switch forwarding methods</h3>
<p>Switches make very fast decisions using application-specific integrated circuits (<b>ASICs</b>). After receiving a frame they use one of two methods:</p>
<div class="cols">
  <div><h4>Store-and-forward</h4><p>Receives the <b>entire frame</b> and checks that it is valid before forwarding. <b>Cisco\'s preferred method.</b></p>
  <ul><li><b>Error checking:</b> checks the Frame Check Sequence (FCS) for CRC errors and discards bad frames.</li>
  <li><b>Buffering:</b> the ingress port buffers the frame while checking the FCS, which also lets the switch handle different speeds on the ingress and egress ports.</li></ul>
  <p>Store-and-forward waits for the whole frame (up to about 9,200 bytes for jumbo frames) before deciding.</p></div>
  <div><h4>Cut-through</h4><p>Forwards the frame <b>as soon as the destination MAC</b> has been read and the egress port found.</p>
  <ul><li>Suited to switches that need latency <b>under 10 microseconds</b>.</li>
  <li>Does <b>not check the FCS</b>, so it can propagate errors.</li>
  <li>Too many propagated errors can cause bandwidth problems.</li>
  <li>Cannot support ports with different speeds from ingress to egress.</li></ul>
  <p><b>Fragment-free</b> is a variant: it waits until at least <b>64 bytes</b> have arrived, which <b>eliminates runts</b> (most errors and collisions happen in the first 64 bytes).</p></div>
</div>
<div class="note"><b>Compare (instructor notes):</b> store-and-forward removes CRC errors, runts and giants. Fragment-free removes only runts. Cut-through removes none.</div>`,
        understand: {
          big: 'A switch learns from source addresses and forwards on destination addresses; unknown destinations and broadcasts are flooded.',
          why: 'MAC learning explains how every LAN works, and the forwarding methods are a classic comparison question.',
          keys: [
            'Learn from the SOURCE MAC; forward using the DESTINATION MAC.',
            'MAC table = CAM table. Aging timer resets to 5 minutes when a known source is seen again.',
            'Unknown unicast or broadcast: flood out every port except the ingress port.',
            'Store-and-forward: whole frame, checks FCS, buffers (mixed speeds OK). Cisco preferred.',
            'Cut-through: forwards after the destination MAC; no FCS check; latency < 10 µs; same speeds only.',
            'Fragment-free: waits for 64 bytes and removes runts.',
          ],
          traps: [
            { trap: 'Saying the switch learns from the destination address.', fix: 'It learns only from source addresses; destinations are looked up.' },
            { trap: 'Thinking cut-through drops corrupted frames.', fix: 'It never sees the FCS before forwarding, so it propagates errors.' },
            { trap: 'Thinking a switch sends an unknown unicast back out the port it came in on.', fix: 'Flooding always excludes the ingress port.' },
          ],
          analogy: 'A mail room clerk who writes down each sender\'s desk when a letter arrives (learning), delivers letters to known desks directly, and shouts for unknown names across the whole office (flooding).',
          explain: [
            { q: 'PC A sends its first frame to PC B. What does the switch do?', a: 'It learns A\'s MAC on the ingress port, finds B unknown, and floods the frame out all other ports.' },
            { q: 'Why can store-and-forward handle a 100 Mb/s ingress and 1 Gb/s egress port?', a: 'It buffers the whole frame before sending, so the two ports do not need the same speed.' },
            { q: 'Which errors does fragment-free remove and why?', a: 'Runts, because it waits for at least 64 bytes before forwarding.' },
          ],
          widgets: ['maclearn', 'fwdmethods'],
        },
      },
      /* ------------------------------------------------------------------ 2.2 */
      {
        id: '2.2', title: 'Switching Domains',
        objective: 'Compare a collision domain to a broadcast domain.', slides: '20–23',
        read: `
<h3>Collision domains</h3>
<ul>
  <li>Switches <b>eliminate collision domains</b> and reduce congestion.</li>
  <li>With <b>full duplex</b> on a link, the collision domain is eliminated.</li>
  <li>If one or more devices run <b>half duplex</b>, there is a collision domain again: devices contend for bandwidth and collisions are possible.</li>
  <li>Most devices (Cisco, Microsoft) use <b>autonegotiation</b> for duplex and speed by default.</li>
</ul>
<div class="note"><b>Why it matters (instructor notes):</b> collision domains appear when the network is extended at Layer 1, for example with hubs (half duplex). The fix is a Layer 2 switch (full duplex, microsegmentation). But if autonegotiation fails and one side drops to half duplex, that link becomes a collision domain again.</div>

<h3>Broadcast domains</h3>
<ul>
  <li>A broadcast domain extends across <b>all Layer 1 and Layer 2 devices</b> on a LAN.</li>
  <li>Only a <b>Layer 3 device (router)</b> breaks up a broadcast domain (also called a MAC broadcast domain).</li>
  <li>The broadcast domain is all devices on the LAN that receive the broadcast.</li>
  <li>A switch that receives a broadcast <b>floods</b> it out of all interfaces except the ingress interface.</li>
  <li>Too many broadcasts cause congestion and poor performance.</li>
  <li>Adding Layer 1 or Layer 2 devices <b>expands</b> the broadcast domain.</li>
</ul>
<div class="note"><b>Remember:</b> switches extend broadcast domains, but they eliminate collision domains. A router interface listens to a broadcast on its LAN but never passes it on ("You shall not pass!").</div>

<h3>Alleviating network congestion</h3>
<p>Switches use the MAC address table and full duplex to eliminate collisions and avoid congestion. Other switch features that help:</p>
<table class="t"><tr><th>Feature</th><th>Function</th></tr>
<tr><td><b>Fast port speeds</b></td><td>Depending on the model, up to 100 Gb/s ports.</td></tr>
<tr><td><b>Fast internal switching</b></td><td>Fast internal bus or shared memory improves performance.</td></tr>
<tr><td><b>Large frame buffers</b></td><td>Temporary storage while processing large numbers of frames.</td></tr>
<tr><td><b>High port density</b></td><td>Many ports at lower cost; more traffic stays local, so less congestion.</td></tr></table>`,
        understand: {
          big: 'Each switch port (full duplex) is its own collision domain with no collisions; the whole switched LAN is one broadcast domain until a router or VLAN splits it.',
          why: 'Counting collision and broadcast domains in a topology is one of the most common exam questions.',
          keys: [
            'Hub: one collision domain for all its ports. Switch: one per port (none in full duplex).',
            'Router: each interface is a separate broadcast domain; routers do not forward broadcasts.',
            'Switches flood broadcasts out every port except the ingress port.',
            'More Layer 1/2 devices = bigger broadcast domain.',
            'Congestion relief: fast ports, fast internal switching, large buffers, high port density.',
          ],
          traps: [
            { trap: 'Believing switches break up broadcast domains.', fix: 'Only routers (Layer 3) do, or VLANs on a switch, which create separate broadcast domains.' },
            { trap: 'Counting a hub\'s ports as separate collision domains.', fix: 'All ports on a hub share one collision domain.' },
            { trap: 'Thinking a duplex mismatch cannot create collisions on a switched link.', fix: 'If one side falls back to half duplex, that link becomes a collision domain.' },
          ],
          analogy: 'A broadcast is a store intercom announcement. It should reach everyone in that store (the broadcast domain), but it would be chaos if it played in every store of the chain. The router is the wall between stores.',
          explain: [
            { q: 'A router connects two switches, each with 4 PCs. How many broadcast domains?', a: 'Two: one per router interface.' },
            { q: 'Why does a full-duplex switch port have no collision domain?', a: 'Only one device is on the segment and each direction has its own path, so frames cannot collide.' },
            { q: 'What happens to a broadcast when it reaches a router interface?', a: 'The router receives and processes it but does not forward it to its other interfaces.' },
          ],
          widgets: ['domains'],
        },
      },
    ],
  });
})(typeof window !== 'undefined' ? window : globalThis);
