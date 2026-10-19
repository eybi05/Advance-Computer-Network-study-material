# SRWE Study Lab

A self-contained study system for **CCNA Switching, Routing and Wireless Essentials (SRWE) v7, modules 1–16**. It is built from the slide decks in the parent folder (`SRWE_Module_1.pptx` … `SRWE_Module_16.pptx`), including the content of their screenshots.

Every topic goes through four stages:

| Stage | What you do |
|---|---|
| **Read** | A lesson for each of the 64 course topics, covering every slide, with CLI examples and **slide errata** where the official deck is wrong. |
| **Understand** | The core idea, why it matters, an analogy, common traps, "explain it yourself" prompts with model answers, interactive visuals, and a 3-question check. |
| **Practice** | 676 quiz questions (multiple choice, choose-N, ordering, matching, true/false and **typed IOS commands**), 337 spaced-repetition flashcards, 30 command drills, and timed practice exams for each course checkpoint (modules 1–4, 5–6, 7–9, 10–13, 14–16) plus a final. |
| **Apply** | 28 labs that you build and configure in **your own Cisco Packet Tracer**. You paste the output of show commands, `ping` and `ipconfig` back into the lab page, and every task is checked from that output. Plus the **28 Packet Tracer activities your instructor shared**, with their instructions, topology and a place for your answers. |

Each topic shows four status lights (Read · Understand · Practice · Apply), like port LEDs on a switch.

## Start

Open **`index.html`** in Chrome, Firefox or Edge. You can also open `START-SRWE-STUDY-LAB.html`, which sits next to the slide decks. No installation or internet connection is needed. When you are online, the IBM Plex and JetBrains Mono fonts load from Google Fonts; offline, your system fonts are used.

```bash
xdg-open ~/Desktop/adv/srwe-study-lab/index.html
```

Progress, pasted lab output and answers are saved automatically in your browser (localStorage). To keep a copy or move it to another browser, use **Settings & progress → Create backup** and **Restore from text**.

## Packet Tracer labs

Each lab page has three parts:

1. **Build it in Packet Tracer**: a **ready-made activity (`.pka`) and network (`.pkt`)** (see below), a topology diagram, the Packet Tracer model of every device, the cabling (ports and cable type), the addressing table, Packet Tracer tips, and a **starting configuration** for each device with a Copy button. Paste it into the device's CLI to set up everything the lab is not about (or the faults, in troubleshooting labs).
2. **Tasks**: grouped in parts, each with a status light, a hint and the commands if you get stuck. Some tasks ask a question you answer from your own output (for example "which switch is the root bridge?"); GUI-only steps (wireless router, WLC) are ticked by you. A lab is complete when every task passes; if you finished it in Packet Tracer (for example with Check Results in the `.pka`) and do not want to paste output, click **Mark lab as done** at the top of the page or under the tasks. Click it again to undo.
3. **Check your work**: one tab per device with the commands to run (click a command to copy it). In Packet Tracer, run `terminal length 0`, run the commands, copy the CLI text (or a PC's Command Prompt text) and paste it into the tab. Tasks turn green as soon as the output shows they are done; a task that needs output you have not pasted says exactly what to paste and from which device. If you paste a device's output into the wrong tab, the page warns you.

**Ready-made files.** Every lab comes as a Packet Tracer 9 activity, `pt/<lab id>.pka`, and as a plain network, `pt/<lab id>.pkt`. Both hold the lab already built: the devices named and placed like the diagram, every cable, the starting configuration in each switch and router, and the PCs, laptops and servers addressed from the addressing table. The activity also has the tasks in its instructions window, and **Check Results** scores every setting the reference solution configures (hostname, passwords, VLANs, port modes, addresses, routes, OSPF, DHCP and so on). Pings, questions and show-command checks are still scored here, from your pasted output. Open a file with File > Open, or use the download buttons on the lab page. Wireless settings (SSIDs, WLC, home router) are yours to configure, as the labs ask.

After you change a lab's devices, cabling, addressing, starting configuration or solution, rebuild the files:

```bash
python3 tools/pkt/build.py            # all labs, or name lab ids to rebuild only those
python3 tools/pkt/finalize.py m3-vlans   # then refresh the scoring of the labs you changed (needs Packet Tracer)
python3 tools/pkt/build.py m3-vlans
```

`build.py` needs `node` and libgcrypt (standard on Linux). It clones devices from the templates in `tools/pkt/templates`; `tools/pkt/extract.py` refreshes those from a Packet Tracer install. The activity's assessment tree comes from `tools/pkt/trees`: `finalize.py` has Packet Tracer itself open and save each activity twice (answer network solved, and answer network as the starting network), so Packet Tracer writes every setting with its own name and value, and scores the ones the solution changes. It needs Packet Tracer 9, Xephyr and python3-xlib, and runs Packet Tracer on a private off-screen display with a copy of `~/pt`. `ptfile.py` reads and writes the `.pkt`/`.pka` format (and Packet Tracer's encrypted logs in `~/pt/logs`), so `python3 -c "import sys; sys.path.insert(0, 'tools/pkt'); import ptfile; print(ptfile.decode(open('pt/m3-vlans.pkt', 'rb').read())[:300])"` shows a file's XML.

The checker reads `show running-config`, `show startup-config`, `show vlan brief`, `show interfaces trunk`, `show interfaces`, `show ip interface (brief)`, `show ipv6 interface (brief)`, `show etherchannel summary`, `show spanning-tree`, `show spanning-tree summary`, `show ip route`, `show ipv6 route`, `show standby (brief)`, `show ip dhcp binding`, `show ipv6 dhcp pool`, `show port-security`, `show port-security interface`, `show ip dhcp snooping`, `show mac address-table`, `show cdp neighbors`, `show ip ssh`, `show version`, IOS `ping`/`traceroute`, and on PCs `ipconfig /all`, `ping`, `tracert`, `ssh` and `telnet`. Abbreviated commands (`sh run`, `sh ip int br`) are recognised, `--More--` prompts are ignored, and a paste without prompts is recognised by the shape of the output. Line passwords encrypted with `service password-encryption` (type 7) are decoded for checking.

| Module | Labs |
|---|---|
| 1 | Basic switch configuration · switch ports (duplex/speed) · SSH · basic router and dual-stack interfaces |
| 2 | MAC address tables |
| 3 | VLANs · 802.1Q trunks · troubleshoot VLANs and trunks |
| 4 | Router-on-a-stick · Layer 3 switch with OSPF · troubleshoot inter-VLAN routing |
| 5 | Investigate STP · root bridge, Rapid PVST+ and PortFast |
| 6 | LACP and PAgP EtherChannels · troubleshoot EtherChannel |
| 7 | DHCPv4 server, relay and client |
| 8 | SLAAC, stateless and stateful DHCPv6 |
| 9 | HSRP |
| 10 | CDP reconnaissance, local AAA and SSH |
| 11 | Switch security (all mitigations) · port security violation and recovery |
| 12 | Two access points in one ESS |
| 13 | Wireless home router · WLANs on a WLC (WPA2-PSK and WPA2-Enterprise with RADIUS) |
| 14 | Router configuration review and reading the routing table |
| 15 | IPv4/IPv6 static and default routes · floating static and host routes |
| 16 | Troubleshoot static and default routes |

## Instructor's labs

The Packet Tracer activities your instructor shared live in **`teacher's lab/`** next to this folder (`3.4.5 Packet Tracer - Configure Trunks.pka` and so on). **Apply → Instructor's labs** lists them by module, and each activity has a page with:

* a download button for the `.pka` (or open it from the folder with File > Open); Packet Tracer scores it with **Check Results**,
* the topology, drawn from the activity's own network (devices, models and cabling under **Devices and cabling**). For an activity that starts with an empty workspace (1.6.1, 6.4.1) it shows the devices you have to add,
* the activity's instructions (addressing table, objectives, parts and steps, command examples), with an answer box under every question. Answers are saved in your browser and in backups,
* **Mark as done**, and links to this app's labs and course topics on the same subject.

An activity covers the topic its number names (3.4.5 → topic 3.4); a module's closing activities (1.6.1, 3.6.1, 9.3.3 …) cover the whole module. A finished activity lights the topic's Apply LED, the study lab pages link to their instructor's activity, and the topic Apply tabs and module pages list them.

When your instructor shares more activities, put the `.pka` files in `teacher's lab/` (keep Cisco's file names, `<n.n.n> Packet Tracer - <title>.pka`) and run:

```bash
python3 tools/pkt/teacher.py      # rewrites js/data/teacher-labs.js
```

It reads each activity with `ptfile.py` and converts the instructions from the Word HTML Packet Tracer stores into the app's own markup; the files themselves are not changed.

The labs target Cisco Packet Tracer 8/9 (2960-24TT switches, ISR4321/ISR4331 routers, a 3650-24PS Layer 3 switch, WRT300N, AccessPoint-PT, WLC-3504).

## Command drills and typed commands

Drills are short guided sequences like the course's Syntax Checker activities: you type each command at the prompt shown, and show commands print a sample of their output. Typed answers in drills and quizzes accept IOS abbreviations (`conf t`, `sw mo tr`, `int g0/0/1.10`, `sh ip int br | i up`) and short or long interface names; values such as addresses, VLAN IDs and names must be exact.

## Slide errata noted in the lessons

* M1 slide 21: `ip default-gateway` is a global configuration command. M1 slide 42: SSH versions 1 and 2 together show as version 1.99.
* M3 slides 16, 25, 27, 32, 45 and M4 slides 19/38/39: see the lessons (broadcast domains, CoS, native VLAN command, subinterface numbering).
* M5 slide 29: the designated port has the **lowest** root path cost on its segment.
* M6 slide 33: the screenshot enters the same commands twice.
* M7 slide 33: the interface verified is G0/0/1, not G0/1.
* M8 slide 28: it is the **M flag**, not A/O = 0, that sends a host to a stateful DHCPv6 server. Slide 35 says "stateless" for the stateful client.
* M9 slide 15: "HRSP" is HSRP; slide 20 omits the **Active** state.
* M10 slide 35: "is specific situations".
* M11 slide 50: BPDU Guard recovery is `errdisable recovery cause bpduguard`; slide 21's screenshot shows Secure-shutdown in restrict mode; slide 22 says every violation err-disables the port (only shutdown mode does); the terms slide misspells commands.
* M12: WiMAX is a WMAN technology; CAPWAP is an IETF (not IEEE) standard; "LWAN controller" means WLAN controller.
* M13: "Name Address Translation" is Network Address Translation; AES is the Advanced Encryption Standard; AAA is authentication, authorization and accounting.
* M14 slide 15: the binary column repeats the destination address for every route.
* M16 slide 16: traceroute relies on ICMP time exceeded messages, not echo replies.

## Tests

```bash
node tests/pt.test.js     # Packet Tracer output parsers and the grading engine, on sample IOS / PC output
node tests/data.test.js   # every script parses; every lesson, question, card, drill and widget; every lab passes on its solved output and fails on its starting output; every instructor activity is imported, with clean instructions and a consistent topology
node tests/ui.test.js     # end-to-end in headless Google Chrome: labs (paste, grade, reload), instructor activities, drills, all topic quizzes, exams, flashcards, widgets, every topic and lab page, mobile
```

The lab tests build Packet Tracer-style output from each lab's own starting and solution configuration (`tests/render.js`, `tests/labs.fixtures.js`). Set `UI_SHOTS=1` to keep screenshots from the UI test in `tests/.qa/`.

## Project layout

```
index.html              app shell (open this)
css/app.css             design system (dark and light themes)
js/app/cmd.js           typed IOS command checker (abbreviations, interface names, values)
js/pt/check.js          Packet Tracer output parsers, evidence and task grading
js/data/m1–m16.js       lessons (Read + Understand) per module
js/data/quiz.js, cards.js           modules 1–4 questions and flashcards
js/data/practice-kit.js, mN-practice.js   modules 5–16 questions and flashcards
js/data/drills.js, drills2.js       command drills
js/data/labkit.js, labs1–3.js       Packet Tracer labs and their check builders
js/data/teacher-labs.js             instructor's activities (generated by tools/pkt/teacher.py)
js/data/reference.js, reference2.js command reference and glossary
js/app/                 core (storage, router, progress), views, widgets, widgets2, practice, labs, teacher, main
tools/pkt/              Packet Tracer file tools: build.py, finalize.py, teacher.py (imports the instructor's activities)
tests/                  Node and Chrome tests
```

Content is plain data, so it is easy to extend. Add a question with the helpers in `practice-kit.js` (put the correct option first; options are shuffled), a lab to `labs3.js` (devices, cabling, starting configuration, tasks with `check(h)` functions built from `labkit.js`, what to `collect`, and a solution) plus its solved output in `tests/labs.fixtures.js`, then run `node tests/data.test.js`.
