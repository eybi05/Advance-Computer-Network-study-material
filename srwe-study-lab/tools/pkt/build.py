#!/usr/bin/env python3
"""Build pt/<lab id>.pkt for every Packet Tracer lab in js/data/labs*.js.

Each file opens in Packet Tracer 9 with the lab's devices named and placed like the lab diagram,
every cable connected, the lab's starting configuration already in each switch and router, and the
PCs, laptops and servers addressed from the addressing table.

  python3 tools/pkt/build.py              # every lab
  python3 tools/pkt/build.py m3-vlans     # one or more labs by id

Needs node (to read the lab data) and libgcrypt. The device templates in tools/pkt/templates come
from extract.py. Output is deterministic: rebuilding an unchanged lab gives the same file.
"""
import copy
import gzip
import ipaddress
import json
import os
import random
import re
import subprocess
import sys
import uuid
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(APP, 'pt')
sys.path.insert(0, HERE)
import ptfile  # noqa: E402

# lab model -> (template, kind). Kinds: router, switch, l3switch (IOS); host (PC, laptop, server); rack, desk (no CLI).
MODELS = {
    '2960-24TT': ('2960-24TT', 'switch'),
    '3650-24PS': ('3650-24PS', 'l3switch'),
    'ISR4321': ('ISR4321', 'router'),
    'ISR4331': ('ISR4331', 'router'),
    'PC-PT': ('PC-PT', 'host'),
    'Server-PT': ('Server-PT', 'host'),
    'Laptop-PT': ('Laptop-PT', 'host'),
    'Laptop-PT + WPC300N': ('Laptop-PT-WPC300N', 'host'),
    'AccessPoint-PT': ('AccessPoint-PT', 'desk'),
    'LAP-PT (or 3702i)': ('LAP-PT', 'desk'),
    'WRT300N': ('Linksys-WRT300N', 'desk'),
    'WLC-3504': ('WLC-3504', 'rack'),
}
IOS = ('router', 'switch', 'l3switch')
CABLES = {'straight': 'eStraightThrough', 'cross': 'eCrossOver'}
DEFAULT_VLANS = {1: 'default', 1002: 'fddi-default', 1003: 'token-ring-default', 1004: 'fddinet-default', 1005: 'trnet-default'}
MAC_RE = re.compile(r'\b[0-9A-F]{4}\.[0-9A-F]{4}\.[0-9A-F]{4}\b')


def sub(parent, tag, text=None):
    el = ET.SubElement(parent, tag)
    el.text = text
    return el


def setv(parent, tag, text):
    el = parent.find(tag)
    if el is None:
        el = sub(parent, tag)
    el.text = text
    return el


def clear(el):
    for c in list(el):
        el.remove(c)
    el.text = None


_templates = {}


def template(name):
    if name not in _templates:
        with gzip.open(os.path.join(HERE, 'templates', name + '.xml.gz')) as f:
            _templates[name] = f.read()
    return ET.fromstring(_templates[name])


def eui64(mac):
    """'000B.BE5A.AAD9' -> 'FE80::20B:BEFF:FE5A:AAD9', the link-local address Packet Tracer derives."""
    b = bytes.fromhex(mac.replace('.', ''))
    e = bytes([b[0] ^ 2]) + b[1:3] + b'\xff\xfe' + b[3:]
    return 'FE80::' + ':'.join(format(int.from_bytes(e[i:i + 2], 'big'), 'X') for i in range(0, 8, 2))


def canon_if(name):
    """Any IOS spelling of an interface -> the full name Packet Tracer uses (g0/0/1 -> GigabitEthernet0/0/1)."""
    s = name.strip().replace(' ', '')
    m = re.match(r'(?i)(fastethernet|fa|f|gigabitethernet|gi|g|vlan|loopback|lo|port-channel|po)(\d[\d/.]*)$', s)
    if not m:
        return name.strip()
    kind = m.group(1).lower()
    full = ('FastEthernet' if kind.startswith('f') else 'GigabitEthernet' if kind.startswith('g') else 'Vlan' if kind == 'vlan'
            else 'Loopback' if kind.startswith('lo') else 'Port-channel')
    return full + m.group(2)


def lab_port(port):
    """A port as written in the lab data -> Packet Tracer's port name."""
    if re.match(r'(?i)port\s*\d', port):
        return 'Port ' + re.sub(r'\D', '', port)
    if re.match(r'(?i)ethernet\s*\d', port):
        return 'Ethernet ' + re.sub(r'\D', '', port)
    if port.lower() == 'internet':
        return 'Internet'
    return canon_if(port)


def expand_range(spec):
    """'fa0/1 - 2, fa0/6' -> ['FastEthernet0/1', 'FastEthernet0/2', 'FastEthernet0/6']."""
    out = []
    for part in spec.split(','):
        m = re.match(r'\s*(.*?)(\d+)\s*-\s*(\d+)\s*$', part)
        if m:
            out += [canon_if(m.group(1) + str(n)) for n in range(int(m.group(2)), int(m.group(3)) + 1)]
        elif part.strip():
            out.append(canon_if(part))
    return out


# ---------------------------------------------------------------- IOS running-config

GLOBAL_PREFIXES = ('interface ', 'line ', 'router ', 'ip dhcp pool ', 'ipv6 dhcp pool ', 'hostname ', 'ip route ', 'ipv6 route ',
                   'ip default-gateway ', 'ipv6 unicast-routing', 'ip dhcp excluded-address ', 'no ip domain', 'ip domain',
                   'enable ', 'service ', 'no service ', 'username ', 'banner ', 'spanning-tree mode ', 'spanning-tree vlan ',
                   'vlan ', 'no vlan ', 'crypto ', 'ip ssh ', 'ip routing', 'no ip routing', 'cdp run', 'no cdp run')
BLOCK_PREFIXES = ('interface ', 'line ', 'router ', 'ip dhcp pool ', 'ipv6 dhcp pool ')


class Config:
    """A running-config as an ordered list of [line, sublines]; sublines is None for a global line."""

    def __init__(self, lines):
        self.items = []
        for raw in lines:
            if raw.startswith(' ') and self.items:
                last = self.items[-1]
                if last[1] is None:
                    last[1] = []
                last[1].append(raw.strip())
            else:
                self.items.append([raw.rstrip(), [] if raw.startswith(BLOCK_PREFIXES) else None])

    def lines(self):
        out = []
        for head, subs in self.items:
            out.append(head)
            out += [' ' + s for s in subs or []]
        return out

    def find(self, pred):
        return [i for i, (h, s) in enumerate(self.items) if pred(h, s)]

    def block(self, head):
        for item in self.items:
            if item[0] == head and item[1] is not None:
                return item
        return None

    def insert(self, index, item):
        self.items.insert(index, item)
        return item

    def ifaces(self):
        return self.find(lambda h, s: h.startswith('interface '))

    def after_last(self, pred, fallback):
        idx = self.find(pred)
        return idx[-1] + 1 if idx else fallback()

    def interface(self, name):
        head = 'interface ' + name
        item = self.block(head)
        if item:
            return item
        if '.' in name:  # subinterface: after its parent and the parent's existing subinterfaces
            parent = name.split('.')[0]
            at = self.after_last(lambda h, s: h == 'interface ' + parent or h.startswith('interface ' + parent + '.'), lambda: self.after_last(lambda h, s: h.startswith('interface '), lambda: len(self.items)))
        elif name.startswith('Vlan'):
            at = self.after_last(lambda h, s: h.startswith('interface Vlan'), lambda: self.after_last(lambda h, s: h.startswith('interface '), lambda: len(self.items)))
        else:
            at = self.after_last(lambda h, s: h.startswith('interface '), lambda: len(self.items))
        self.insert(at, ['!', None])
        return self.insert(at + 1, [head, []])

    def section(self, head):
        """A router / DHCP pool block, created after the interfaces (routers) or before ip cef (pools)."""
        item = self.block(head)
        if item:
            return item
        if head.startswith(('ip dhcp pool', 'ipv6 dhcp pool')):
            at = self.top()
        else:
            at = self.after_last(lambda h, s: h.startswith(('interface ', 'router ')), lambda: len(self.items))
        self.insert(at, ['!', None])
        return self.insert(at + 1, [head, []])

    def top(self):
        """Just after hostname / enable / DHCP lines, where IOS lists them."""
        i = self.find(lambda h, s: h.startswith('hostname '))[0] + 1
        while i < len(self.items) and (self.items[i][0].startswith(('enable ', 'ip dhcp ', 'ipv6 dhcp ')) or self.items[i][1] is not None and self.items[i][0].startswith(('ip dhcp pool', 'ipv6 dhcp pool'))):
            i += 1
        return i

    def lines_for(self, spec):
        """'line vty 0 15' -> the existing vty blocks it covers, plus a new block for numbers past the last one."""
        m = re.match(r'line\s+(vty)\s+(\d+)(?:\s+(\d+))?', spec, re.I)
        if not m:
            head = 'line ' + ' '.join(spec.split()[1:]).replace('console', 'con')
            return [self.block(head) or self.insert(self.after_last(lambda h, s: h.startswith('line '), lambda: len(self.items)), [head, []])]
        a, b = int(m.group(2)), int(m.group(3) or m.group(2))
        found, last_end = [], -1
        for item in self.items:
            mm = re.match(r'line vty (\d+)(?: (\d+))?$', item[0])
            if mm and item[1] is not None:
                lo, hi = int(mm.group(1)), int(mm.group(2) or mm.group(1))
                last_end = max(last_end, hi)
                if lo <= b and hi >= a:
                    found.append(item)
        if b > last_end:
            at = self.after_last(lambda h, s: h.startswith('line vty'), lambda: len(self.items))
            found.append(self.insert(at, ['line vty %d %d' % (max(a, last_end + 1), b), ['login'] if found else []]))
        return found

    def put_global(self, line):
        low = line.lower()
        key = None
        if low.startswith('hostname '):
            key = 'hostname '
        elif low.startswith('spanning-tree mode '):
            key = 'spanning-tree mode '
        elif low in ('service password-encryption', 'no service password-encryption'):
            key = ('service password-encryption', 'no service password-encryption')
        elif low.startswith('ip default-gateway '):
            key = 'ip default-gateway '
        elif low.startswith('enable secret '):
            key = 'enable secret '
        if key:
            for item in self.items:
                if item[1] is None and item[0].lower().startswith(key):
                    item[0] = line
                    return
        if any(item[0] == line and item[1] is None for item in self.items):
            return
        if low.startswith(('enable ', 'ip dhcp excluded-address')):
            at = self.top()
        elif low.startswith(('ip route ', 'ipv6 route ')):
            at = self.after_last(lambda h, s: h == 'ip classless' or h.startswith(('ip route ', 'ipv6 route ')),
                                 lambda: self.after_last(lambda h, s: h.startswith(('interface ', 'router ')), lambda: len(self.items)))
        elif low.startswith('ip default-gateway'):
            at = self.after_last(lambda h, s: h.startswith('interface '), lambda: len(self.items))
        elif low.startswith('spanning-tree '):
            at = self.after_last(lambda h, s: h.startswith('spanning-tree '), lambda: self.ifaces()[0])
        else:
            at = self.find(lambda h, s: h.startswith(('spanning-tree ', 'interface ')))[0]
        self.insert(at, [line, None])


def if_key(cmd):
    t = cmd.lower().split()
    if t in (['shutdown'], ['no', 'shutdown']):
        return 'shutdown'
    if t[:3] == ['no', 'ip', 'address'] or (t[:2] == ['ip', 'address'] and 'secondary' not in t):
        return 'ip address'
    if t[:2] == ['ipv6', 'address'] and 'link-local' in t:
        return 'ipv6 link-local'
    if t[0] in ('duplex', 'speed', 'encapsulation', 'channel-group', 'description'):
        return t[0]
    if t[:2] == ['switchport', 'mode']:
        return 'switchport mode'
    if t[:3] in (['switchport', 'access', 'vlan'], ['switchport', 'trunk', 'native'], ['switchport', 'trunk', 'allowed']):
        return ' '.join(t[:3])
    return cmd.lower()


def line_key(cmd):
    t = cmd.lower().split()
    if t[0] in ('password', 'login', 'exec-timeout', 'privilege'):
        return t[0]
    if t[:2] == ['transport', 'input']:
        return 'transport input'
    return cmd.lower()


def merge(block, cmd, key):
    k = key(cmd)
    block[1][:] = [s for s in block[1] if key(s) != k]
    block[1].append(cmd)


def factory_config(engine, kind):
    """The template's running-config put back to factory defaults (the samples it came from were configured)."""
    cfg = Config([l.text or '' for l in engine.find('RUNNINGCONFIG')])
    drop = re.compile(r'(username |ip route |ipv6 route |no cdp run|enable |banner |ip domain|no ip domain|ip dhcp |ipv6 unicast-routing|'
                      r'ip default-gateway|crypto |ip ssh |router |ip access-list|access-list |ipv6 dhcp pool|spanning-tree vlan |'
                      r'aaa |ntp |snmp-server |logging )')
    items = []
    for head, subs in cfg.items:
        if drop.match(head):
            continue
        if head.startswith('hostname '):
            head = 'hostname ' + ('Router' if kind == 'router' else 'Switch')
        elif head.startswith('spanning-tree mode '):
            head = 'spanning-tree mode pvst'
        elif head == 'service password-encryption':
            head = 'no service password-encryption'
        elif head.startswith('interface '):
            name = head.split(None, 1)[1]
            if '.' in name or name.startswith(('Loopback', 'Tunnel', 'Port-channel')) or (name.startswith('Vlan') and name != 'Vlan1'):
                continue
            if name.startswith('Vlan'):
                subs = ['no ip address'] + (['shutdown'] if 'shutdown' in subs else [])
            elif kind == 'router':
                subs = ['no ip address', 'duplex auto', 'speed auto', 'shutdown']
            else:
                subs = []
        elif head.startswith('line '):
            subs = ['login'] if head.startswith('line vty') else []
        items.append([head, subs])
    cfg.items = items
    return cfg


def apply_start(cfg, cmds, vlans):
    """Merge a lab's starting commands (typed in global configuration mode) into cfg and the VLAN database."""
    mode, targets = None, []
    for raw in cmds:
        cmd = raw.strip()
        low = cmd.lower()
        if not cmd or cmd.startswith('!'):
            continue
        if low in ('enable', 'configure terminal', 'conf t', 'end', 'exit') or low.startswith(('copy ', 'write')):
            mode = None
            continue
        if mode and not low.startswith(GLOBAL_PREFIXES):
            if mode == 'if':
                for b in targets:
                    merge(b, cmd, if_key)
                    m = re.match(r'switchport access vlan (\d+)', low)
                    if m and vlans is not None:
                        vlans.setdefault(int(m.group(1)), 'VLAN%04d' % int(m.group(1)))
            elif mode == 'line':
                for b in targets:
                    merge(b, cmd, line_key)
            elif mode == 'vlan':
                if low.startswith('name '):
                    for v in targets:
                        vlans[v] = cmd.split(None, 1)[1]
            elif cmd not in targets[0][1]:
                targets[0][1].append(cmd)
            continue
        mode = None
        if low.startswith('interface range '):
            mode, targets = 'if', [cfg.interface(n) for n in expand_range(cmd.split(None, 2)[2])]
        elif low.startswith('interface '):
            mode, targets = 'if', [cfg.interface(canon_if(cmd.split(None, 1)[1]))]
        elif low.startswith('line '):
            mode, targets = 'line', cfg.lines_for(low)
        elif low.startswith(('router ', 'ip dhcp pool ', 'ipv6 dhcp pool ')):
            mode, targets = 'block', [cfg.section(cmd)]
        elif re.match(r'vlan [\d,\- ]+$', low):
            ids = [n for part in low[5:].split(',') for n in (range(int(part.split('-')[0]), int(part.split('-')[-1]) + 1))]
            for v in ids:
                vlans.setdefault(v, 'VLAN%04d' % v)
            mode, targets = 'vlan', ids
        elif re.match(r'no vlan \d+$', low):
            vlans.pop(int(low.split()[2]), None)
        else:
            cfg.put_global(cmd)


# ---------------------------------------------------------------- devices

class Lab:
    def __init__(self, lab):
        self.lab = lab
        self.rng = random.Random(lab['id'])
        self.macs = set()
        self.devices = {}  # id -> dict(el, kind, ref, addr, ports)

    def uuid(self):
        return '{%s}' % uuid.UUID(int=self.rng.getrandbits(128), version=4)

    def ref(self):
        return 'save-ref-id:%d' % self.rng.randrange(10 ** 18, 9 * 10 ** 18)

    def mem(self):
        return str(self.rng.randrange(10 ** 13, 10 ** 14))

    def mac(self):
        while True:
            b = bytes([0x00, self.rng.choice([0x01, 0x02, 0x03, 0x05, 0x06, 0x07, 0x0A, 0x0B, 0x0C, 0x0D, 0x10, 0x30, 0x50, 0x60, 0x90, 0xD0, 0xE0])]) + bytes(self.rng.getrandbits(8) for _ in range(4))
            s = b.hex().upper()
            mac = '%s.%s.%s' % (s[0:4], s[4:8], s[8:12])
            if mac not in self.macs:
                self.macs.add(mac)
                return mac

    def fresh(self, dev):
        """New MAC addresses (and the link-local addresses derived from them) for a cloned template."""
        text = ET.tostring(dev, encoding='unicode')
        repl = {}
        for old in sorted(set(MAC_RE.findall(text)) - {'0000.0000.0000', 'FFFF.FFFF.FFFF'}):
            new = self.mac()
            repl[old], repl[eui64(old)] = new, eui64(new)
        if repl:
            text = re.sub('|'.join(re.escape(k) for k in sorted(repl, key=len, reverse=True)), lambda m: repl[m.group(0)], text)
        return ET.fromstring(text)


def port_map(engine, kind):
    """Packet Tracer port name -> PORT element, for the devices whose ports the labs configure or cable."""
    ports = {}
    counts = {}
    for mod in engine.iter('MODULE'):
        model = mod.findtext('MODEL') or ''
        for i, p in enumerate(mod.findall('PORT')):
            t = p.findtext('TYPE')
            if model.startswith('ISR43'):
                ports['GigabitEthernet0/0/%d' % i] = p
            elif model == 'C3650-BUILTIN':
                ports['GigabitEthernet1/0/%d' % (i + 1)] = p
            elif model == 'C3650-SFP-BUILTIN':
                ports['GigabitEthernet1/1/%d' % (i + 1)] = p
            elif kind == 'switch' and t in ('eCopperFastEthernet', 'eCopperGigabitEthernet'):
                pre = 'FastEthernet0/' if t == 'eCopperFastEthernet' else 'GigabitEthernet0/'
                counts[pre] = counts.get(pre, 0) + 1
                ports[pre + str(counts[pre])] = p
            elif kind == 'host' and not ports and t in ('eCopperFastEthernet', 'eHostWirelessN'):
                ports['Wireless0' if t == 'eHostWirelessN' else 'FastEthernet0'] = p
    return ports


def reset_port(p):
    for tag, val in (('IP', ''), ('SUBNET', ''), ('PORT_GATEWAY', ''), ('PORT_DNS', ''), ('PORT_DHCP_ENABLE', 'false'),
                     ('IPV6_ENABLED', 'false'), ('IPV6_ADDRESS_AUTOCONFIG', 'false'), ('IPV6_PORT_GATEWAY', ''),
                     ('IPV6_PORT_DHCP_ENABLED', 'false'), ('DHCP_SERVER_IP', '0.0.0.0')):
        if p.find(tag) is not None:
            p.find(tag).text = val
    if p.find('IPV6_ADDRESSES') is not None:
        clear(p.find('IPV6_ADDRESSES'))
    if p.findtext('IPV6_LINK_LOCAL') and p.find('IPV6_DEFAULT_LINK_LOCAL') is not None:
        p.find('IPV6_LINK_LOCAL').text = p.find('IPV6_DEFAULT_LINK_LOCAL').text


def v6_entry(parent, addr, plen):
    a = sub(parent, 'IPV6_ADDRESS')
    sub(a, 'ADDRESS', str(ipaddress.IPv6Address(addr)).upper())
    sub(a, 'PREFIX', str(plen))
    sub(a, 'TYPE', '0')


def configure_ios(engine, kind, cmds, saved=False, flash=False):
    """Apply cmds to the factory config; returns (Config, VLAN database or None).
    saved: also write startup-config (a device that starts powered off, or a solution that saves);
    flash: also store it as flash:config.text, where a 2960 keeps its startup-config."""
    cfg = factory_config(engine, kind)
    vlans = None
    if kind != 'router' and engine.find('VLANS') is not None:
        vlans = dict(DEFAULT_VLANS)
    apply_start(cfg, cmds or [], vlans if vlans is not None else {})
    rc = engine.find('RUNNINGCONFIG')
    clear(rc)
    for line in cfg.lines():
        sub(rc, 'LINE', line)
    clear(engine.find('STARTUPCONFIG'))
    if saved:
        for line in cfg.lines():
            sub(engine.find('STARTUPCONFIG'), 'LINE', line)
    if flash:
        save_to_flash(engine, cfg.lines())
    host = next(h for h, s in cfg.items if h.startswith('hostname ')).split(None, 1)[1]
    setv(engine, 'SYS_NAME', host)
    if vlans is not None:
        el = engine.find('VLANS')
        clear(el)
        for n in sorted(vlans):
            v = sub(el, 'VLAN')
            v.set('name', vlans[n])
            v.set('number', str(n))
            v.set('rspan', '0')
    for name, p in port_map(engine, kind).items():
        reset_port(p)
        b = cfg.block('interface ' + name)
        subs = b[1] if b else []
        p.find('POWER').text = 'false' if 'shutdown' in subs else 'true'
        for s in subs:
            t = s.split()
            if t[:2] == ['ip', 'address'] and len(t) >= 4 and t[2][0].isdigit():
                p.find('IP').text, p.find('SUBNET').text = t[2], t[3]
            elif t[:2] == ['ipv6', 'address'] and 'link-local' in t:
                p.find('IPV6_LINK_LOCAL').text = str(ipaddress.IPv6Address(t[2])).upper()
            elif t[:2] == ['ipv6', 'address'] and '/' in t[2]:
                addr, plen = t[2].split('/')
                v6_entry(p.find('IPV6_ADDRESSES'), addr, plen)
            elif t[0] == 'speed' and t[1].isdigit():
                p.find('SPEED').text, p.find('BANDWIDTH').text = t[1], str(int(t[1]) * 1000)
                p.find('AUTONEGOTIATESPEED').text = 'false'
                p.find('AUTONEGOTIATEBANDWIDTH').text = 'false'
            elif t[0] == 'duplex' and t[1] in ('full', 'half'):
                p.find('FULLDUPLEX').text = 'true' if t[1] == 'full' else 'false'
                p.find('AUTONEGOTIATEDUPLEX').text = 'false'
    return cfg, vlans


def save_to_flash(engine, lines):
    fs = next(f for f in engine.iter('FILE') if f.get('class') == 'CFileSystem' and f.findtext('NAME') == 'flash:')
    n = int(fs.findtext('FILE_COUNTER') or 0) + 1
    fs.find('FILE_COUNTER').text = str(n)
    f = sub(fs.find('FILES'), 'FILE')
    f.set('class', 'CFile')
    for tag, val in (('FILE_NUMBER', str(n)), ('NAME', 'config.text'), ('DATE_TIME', '0'), ('PERMISSION', '6')):
        sub(f, tag, val)
    content = sub(f, 'FILE_CONTENT')
    content.set('class', 'CConfigFileContent')
    conf = sub(content, 'CONFIG')
    for line in lines:
        sub(conf, 'LINE', line)


def host_settings(lab):
    """Addressing-table rows for PCs, laptops and servers -> {device id: settings}."""
    devs = {d['id']: d for d in lab['devices']}
    rows = [r + [''] * (4 - len(r)) for r in lab['addressing']]

    def v4(s):
        m = re.search(r'(\d+\.\d+\.\d+\.\d+)(?:/(\d+))?', s)
        return (m.group(1), int(m.group(2) or 0)) if m else None

    def v6(s):
        out = []
        for a, plen in re.findall(r'([0-9A-Fa-f]{0,4}(?::[0-9A-Fa-f]{0,4}){2,})(?:/(\d+))?', s):
            try:
                ip = ipaddress.IPv6Address(a)
            except ValueError:
                continue
            out.append((str(ip), int(plen or 0)))
        return out

    def gateway(s):
        m = re.match(r'\s*(\S+)\s+(\S+)\s*$', s)
        if m and m.group(1) in devs:  # "R1 G0/0/0": that interface's addresses
            for r in rows:
                if r[0] == m.group(1) and canon_if(r[1]) == canon_if(m.group(2)):
                    s = r[2]
        g4 = v4(s)
        g6 = [a for a, _ in v6(s) if not a.startswith('fe80')] or [a for a, _ in v6(s)]
        return (g4[0] if g4 else ''), (g6[0] if g6 else '')

    out = {}
    for dev, _ifc, addr, gw in rows:
        names = [n.strip() for n in dev.split(',')]
        targets = []
        for n in names:
            if n in devs:
                targets.append(n)
            elif n in ('PCs', 'Laptops', 'Hosts'):
                want = {'PCs': ('pc',), 'Laptops': ('laptop',), 'Hosts': ('pc', 'laptop', 'server')}[n]
                targets += [d['id'] for d in lab['devices'] if d['type'] in want]
        for t in targets:
            if MODELS[devs[t]['model']][1] != 'host':
                continue
            s = out.setdefault(t, {'dhcp': False, 'v4': None, 'gw4': '', 'v6': [], 'gw6': '', 'auto6': False})
            low = addr.lower()
            if 'dhcp' in low and 'v6' not in low:
                s['dhcp'] = True
            elif v4(addr):
                s['v4'] = v4(addr)
            s['v6'] += [(a, p) for a, p in v6(addr) if p and not a.startswith('fe80')]
            if 'automatic' in low or 'slaac' in low:
                s['auto6'] = True
            g4, g6 = gateway(gw)
            s['gw4'] = s['gw4'] or (g4 if not s['dhcp'] else '')
            s['gw6'] = s['gw6'] or (g6 if s['v6'] else '')
    return out


def configure_host(engine, ports, s):
    for other in engine.iter('PORT'):
        reset_port(other)
    name, p = next(iter(ports.items()))
    p.find('POWER').text = 'true'
    setv(engine, 'GATEWAY', None)
    setv(engine, 'GATEWAYV6', None)
    dc = engine.find('DHCP_CLIENT/PORT_DATA_MAP')
    if dc is not None:
        clear(dc)
    if not s:
        return
    if s['dhcp']:
        p.find('PORT_DHCP_ENABLE').text = 'true'
        if dc is not None:
            sub(sub(dc, 'PORT_DATA_ENTRY'), 'PORT', name)
    elif s['v4']:
        ip, plen = s['v4']
        p.find('IP').text = ip
        p.find('SUBNET').text = str(ipaddress.IPv4Network('0.0.0.0/%d' % plen).netmask)
        p.find('PORT_GATEWAY').text = s['gw4']
        setv(engine, 'GATEWAY', s['gw4'] or None)
    if s['v6'] or s['auto6']:
        p.find('IPV6_ENABLED').text = 'true'
    if s['auto6']:
        p.find('IPV6_ADDRESS_AUTOCONFIG').text = 'true'
    elif s['v6']:
        for a, plen in s['v6']:
            v6_entry(p.find('IPV6_ADDRESSES'), a, plen)
        gw6 = str(ipaddress.IPv6Address(s['gw6'])).upper() if s['gw6'] else ''
        p.find('IPV6_PORT_GATEWAY').text = gw6
        setv(engine, 'GATEWAYV6', gw6 or None)


def quiet_server(engine):
    """Template servers come from configured samples: switch off DHCP, AAA and DNS like a new Server-PT."""
    for srv in engine.iter('DHCP_SERVER'):
        setv(srv, 'ENABLED', '0')
    acs = engine.find('ACS_SERVER')
    if acs is not None:
        setv(acs, 'ENABLED', '0')
        for tag in ('USERS', 'ACS_CLIENTS'):
            if acs.find(tag) is not None:
                clear(acs.find(tag))
    dns = engine.find('DNS_SERVER')
    if dns is not None:
        setv(dns, 'ENABLED', '0')
        if dns.find('NAMESERVER-DATABASE') is not None:
            clear(dns.find('NAMESERVER-DATABASE'))


# ---------------------------------------------------------------- file

def physical_tree(root):
    """UUIDs of Intercity > Home City > Corporate Office > Main Wiring Closet > Rack in the base file."""
    path = {}
    for n in root.find('PHYSICALWORKSPACE').iter('NODE'):
        t = n.findtext('TYPE')
        if t in ('0', '1', '2', '3', '4') and t not in path:
            path[t] = n
    return path


def node(proto, name, x, y, uid):
    n = copy.deepcopy(proto)
    n.find('X').text, n.find('Y').text = str(x), str(y)
    n.find('NAME').text = name
    n.find('UUID_STR').text = uid
    return n


def workspace(dev, ctx, x, y, parent_path, container, own, px, py, pxn, pyn):
    old = dev.find('WORKSPACE')
    if old is not None:
        dev.remove(old)
    w = sub(dev, 'WORKSPACE')
    lg = sub(w, 'LOGICAL')
    sub(lg, 'X', str(x))
    sub(lg, 'Y', str(y))
    sub(lg, 'DEVCLUSTERID', '1-1')
    sub(lg, 'CUSTOM_IMAGE_LOGICAL')
    sub(lg, 'CUSTOM_IMAGE_PHYSICAL')
    sub(lg, 'MEM_ADDR', ctx.mem())
    dev_addr = sub(lg, 'DEV_ADDR', ctx.mem()).text
    phys = parent_path + ([container] if container != parent_path[-1] else []) + [own]
    sub(w, 'PHYSICAL', ','.join(phys))
    c = sub(w, 'PHYSICAL_CPUR')
    for tag, val in (('X_PN', pxn), ('Y_PN', pyn), ('X', px), ('Y', py), ('SLOT', 0), ('SUBSLOT', 0), ('PARENT_PATH', ','.join(parent_path)),
                     ('CONTAINER_ID', container), ('ICP_CONTAINER_SCENE_X', 0), ('ICP_CONTAINER_SCENE_Y', 0), ('ORIGINAL_DEVICE_UUID', ctx.uuid())):
        sub(c, tag, str(val))
    return dev_addr


def description(lab):
    parts = ['SRWE lab: ' + lab['title'], '', lab['goal'], '', lab['scenario']]
    if lab['ptNotes']:
        parts += ['', 'Packet Tracer notes:'] + ['- ' + n for n in lab['ptNotes']]
    parts += ['', 'Starting configurations, PC addressing and cabling are already in this file. Tasks and checks: SRWE Study Lab, lab ' + lab['id'] + '.']
    return '\n'.join(parts)


def solution_for(lab, dev):
    """(IOS commands, notes) from the lab's reference solution; notes are GUI steps written as text."""
    sol = lab.get('solution', {}).get(dev) or []
    return ([], sol[1:]) if sol[:1] == ['#'] else (sol, [])


def network(lab, solved=False):
    """The lab network as a PACKETTRACER5 element, plus the Lab context describing its devices.
    solved=True applies the reference solution on top of the starting configuration (an activity's
    answer network). Both versions get the same device ids, MACs and positions."""
    ctx = Lab(lab)
    root = template('base')
    net = root.find('NETWORK')
    devs_el, links_el = net.find('DEVICES'), net.find('LINKS')
    tree = physical_tree(root)
    uid = {t: n.findtext('UUID_STR') for t, n in tree.items()}
    proto = next(n for n in tree['4'].find('CHILDREN').findall('NODE'))  # the power distribution device's node
    office, rack = tree['2'].find('CHILDREN'), tree['4'].find('CHILDREN')
    desk_i = rack_i = 0
    hosts = host_settings(lab)
    for d in lab['devices']:
        if d['model'] not in MODELS:
            sys.exit('%s: no template for model %r' % (lab['id'], d['model']))
        tname, kind = MODELS[d['model']]
        dev = ctx.fresh(template(tname))
        e = dev.find('ENGINE')
        e.find('NAME').text = d['id']
        if d['model'] != '3650-24PS':  # the 3650 ships without a power supply; the lab has you fit one and power on
            e.find('POWER').text = 'true'
        ref = ctx.ref()
        if e.find('SAVE_REF_ID') is None:
            apps = e.find('USER_APPS')
            e.insert(list(e).index(apps) + 1 if apps is not None else len(e), ET.Element('SAVE_REF_ID'))
        e.find('SAVE_REF_ID').text = ref
        if e.find('SERIALNUMBER') is not None and e.findtext('SERIALNUMBER'):
            e.find('SERIALNUMBER').text = re.sub(r'\d', lambda m: str(ctx.rng.randrange(10)), e.findtext('SERIALNUMBER'))
        ports = port_map(e, kind)
        cmds, notes = solution_for(lab, d['id']) if solved else ([], [])
        info = {'kind': kind, 'model': d['model'], 'engine': e, 'ports': ports}
        if kind in IOS:
            saves = any(re.match(r'(copy run|wr)', c.strip().lower()) for c in cmds)
            info['cfg'], info['vlans'] = configure_ios(e, kind, (lab['start'].get(d['id']) or []) + cmds,
                                                       saved=saves or e.findtext('POWER') != 'true', flash=saves and d['model'] == '2960-24TT')
            info['saved'] = saves
        elif kind == 'host':
            s = copy.deepcopy(hosts.get(d['id']))
            for n in notes:  # "Default Gateway: 192.168.20.1" in a GUI step fixes the host's gateway
                m = re.search(r'Default Gateway:\s*([\d.]+)', n)
                if m and s:
                    s['gw4'] = m.group(1)
            configure_host(e, ports, s)
            info['host'] = s
            if d['model'] == 'Server-PT':
                quiet_server(e)
        else:
            for p in e.iter('PORT'):
                if p.find('POWER') is not None:
                    p.find('POWER').text = 'true'
        own = ctx.uuid()
        x, y = round(60 + d['x'] * 8), round(60 + d['y'] * 7)
        if kind in IOS or kind == 'rack':
            rack_i += 1
            px = 4 + 6 * (rack_i - 1)
            rack.append(node(proto, d['id'], px, 0, own))
            path = [uid['0'], uid['1'], uid['2'], uid['3']]
            dev_addr = workspace(dev, ctx, x, y, path, uid['4'], own, px, 0, round(0.09 + 0.03 * rack_i, 5), 0.26)
        else:
            desk_i += 1
            px, py = 86 * desk_i, 215
            office.append(node(proto, d['id'], px, py, own))
            path = [uid['0'], uid['1'], uid['2']]
            dev_addr = workspace(dev, ctx, x, y, path, uid['2'], own, px, py, px / 2000, py / 2000)
        devs_el.append(dev)
        info.update(ref=ref, addr=dev_addr)
        ctx.devices[d['id']] = info
    for a, pa, b, pb, cable in lab['links']:
        if cable == 'wireless':
            continue
        if cable not in CABLES:
            sys.exit('%s: cable %r is not supported' % (lab['id'], cable))
        ends = []
        for dev_id, port in ((a, pa), (b, pb)):
            info = ctx.devices[dev_id]
            name = next(iter(info['ports'])) if port == 'NIC' else lab_port(port)
            if info['kind'] in IOS + ('host',) and name not in info['ports']:
                sys.exit('%s: %s has no port %s' % (lab['id'], dev_id, name))
            ends.append((info, name))
        link = sub(links_el, 'LINK')
        sub(link, 'TYPE', 'eCopper')
        c = sub(link, 'CABLE')
        sub(c, 'LENGTH', '35.3635')
        sub(c, 'FUNCTIONAL', 'true')
        sub(c, 'FROM', ends[0][0]['ref'])
        sub(c, 'PORT', ends[0][1])
        sub(c, 'TO', ends[1][0]['ref'])
        sub(c, 'PORT', ends[1][1])
        sub(c, 'FROM_DEVICE_MEM_ADDR', ends[0][0]['addr'])
        sub(c, 'TO_DEVICE_MEM_ADDR', ends[1][0]['addr'])
        sub(c, 'FROM_PORT_MEM_ADDR', ctx.mem())
        sub(c, 'TO_PORT_MEM_ADDR', ctx.mem())
        sub(c, 'GEO_VIEW_COLOR', '#6ba72e')
        sub(c, 'IS_MANAGED_IN_RACK_VIEW', 'false')
        sub(c, 'TYPE', CABLES[cable])
    net.find('DESCRIPTION').text = description(lab)
    return root, ctx


def to_bytes(root):
    return ET.tostring(root, encoding='unicode').encode('utf-8')


def saved_tree(lab_id):
    """The assessment tree finalize.py saved for a lab, or None."""
    path = os.path.join(HERE, 'trees', lab_id + '.xml.gz')
    if not os.path.exists(path):
        return None
    with gzip.open(path) as f:
        return ET.fromstring(f.read())


def main():
    import activity  # imports this module as build
    labs = json.loads(subprocess.run(['node', os.path.join(HERE, 'labs.js')], capture_output=True, text=True, check=True).stdout)
    want = set(sys.argv[1:])
    unknown = want - {l['id'] for l in labs}
    if unknown:
        sys.exit('unknown lab id: ' + ', '.join(sorted(unknown)))
    os.makedirs(OUT, exist_ok=True)
    for lab in labs:
        if want and lab['id'] not in want:
            continue
        with open(os.path.join(OUT, lab['id'] + '.pkt'), 'wb') as f:
            f.write(ptfile.encode(to_bytes(network(lab)[0])))
        tree = saved_tree(lab['id'])
        xml, items = activity.build(lab, tree)
        with open(os.path.join(OUT, lab['id'] + '.pka'), 'wb') as f:
            f.write(ptfile.encode(xml))
        print('pt/%s.pkt/.pka  %d devices, %d cables, %d scored items (%s)' % (lab['id'], len(lab['devices']),
              sum(1 for l in lab['links'] if l[4] != 'wireless'), len(items), 'Packet Tracer tree' if tree is not None else 'computed'))


if __name__ == '__main__':
    main()
