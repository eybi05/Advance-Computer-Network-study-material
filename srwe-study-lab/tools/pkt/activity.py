"""Packet Tracer activities (.pka) for the labs.

An activity holds three networks (your saved work, the starting network, the answer network), an
assessment tree that says which settings of the answer network are scored, and the instructions.
Here the starting network is the lab's .pkt network and the answer network is that plus the lab's
reference solution. The assessment tree is the one Packet Tracer itself generated for the answer
network (saved by finalize.py in tools/pkt/trees), with every setting the solution changes scored;
for a lab without a saved tree it is computed here for the settings whose values are known.
"""
import copy
import hashlib
import html
import re
import xml.etree.ElementTree as ET

import build as B

# Assessment-tree levels are (shown name, ID, eclass); the leaf also has a component (score group).
PORTS = ('Ports', 'Ports', '8')
DNS = ('DNS', 'DNS', '8')
CON = ('Console Line', 'Console Line', '4')
VTYS = ('VTY Lines', 'VTY Lines', '8')
VLANS = ('VLANS', 'VLANS', '5')
FLASH = ('Flash Files', 'Flash Files', '8')
LEAF = {
    'host': ('Host Name', 'Host Name', '8', 'Device Settings'),
    'secret': ('Enable Secret', 'Enable Secret', '8', 'Security'),
    'encrypt': ('Service Password Encryption', 'Service Password Encryption', '8', 'Security'),
    'banner': ('Banner MOTD', 'Banner motd', '8', 'Security'),
    'lookup': ('IP Domain-Lookup', 'IP Domain Lookup', '8', 'Device Settings'),
    'domain': ('IP Domain Name', 'IP Domain Name', '8', 'Device Settings'),
    'password': ('Password', 'Password', '8', 'Security'),
    'login': ('Login', 'Login', '4', 'Security'),
    'gateway': ('Default Gateway', 'Default Gateway', '0', 'IP Addressing'),
    'vlan': ('VLAN Name', 'VLAN Name', '5', 'VLANs'),
    'access': ('Access VLAN', 'Access VLAN', '5', 'VLANs'),
    'native': ('Native VLAN', 'Native VLAN', '5', 'VLANs'),
    'ip': ('IP Address', 'IP Address', '0', 'IP Addressing'),
    'mask': ('Subnet Mask', 'Subnet Mask', '0', 'IP Addressing'),
    'status': ('Port Status', 'Power', '4', 'Interfaces'),
    'desc': ('Description', 'Description', '8', 'Interfaces'),
    'saved': ('config.text', 'config.text', '8', 'Configuration Management'),
}
COMPONENTS = ['Device Settings', 'Security', 'VLANs', 'Interfaces', 'IP Addressing', 'Configuration Management', 'Connectivity']
ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'


def md5crypt(password, salt='mERr'):
    """'enable secret' as IOS shows it ($1$ MD5-crypt); Packet Tracer always uses the salt mERr."""
    pw, sl = password.encode(), salt.encode()
    alt = hashlib.md5(pw + sl + pw).digest()
    ctx = pw + b'$1$' + sl + (alt * (len(pw) // 16 + 1))[:len(pw)]
    i = len(pw)
    while i:
        ctx += b'\0' if i & 1 else pw[:1]
        i >>= 1
    final = hashlib.md5(ctx).digest()
    for i in range(1000):
        c = (pw if i & 1 else final) + (sl if i % 3 else b'') + (pw if i % 7 else b'') + (final if i & 1 else pw)
        final = hashlib.md5(c).digest()
    out = ''
    for a, b, c, n in ((0, 6, 12, 4), (1, 7, 13, 4), (2, 8, 14, 4), (3, 9, 15, 4), (4, 10, 5, 4), (None, None, 11, 2)):
        v = (final[a] << 16 if a is not None else 0) | (final[b] << 8 if b is not None else 0) | final[c]
        for _ in range(n):
            out += ITOA64[v & 63]
            v >>= 6
    return '$1$%s$%s' % (salt, out)


def leaf(key, *levels):
    name, ident, eclass, comp = LEAF[key]
    return tuple(levels) + ((name, ident, eclass),), comp


def ios_items(info):
    """(path, value, component) for the settings of an IOS device that the assessment can score."""
    cfg, kind = info['cfg'], info['kind']
    glob = [h for h, s in cfg.items if s is None]
    out = []

    def add(key, value, *levels):
        path, comp = leaf(key, *levels)
        out.append((path, value, comp))

    add('host', next(h for h in glob if h.startswith('hostname ')).split(None, 1)[1])
    secret = next((h.split()[2:] for h in glob if h.startswith('enable secret ')), None)
    add('secret', '' if not secret else secret[1] if secret[0] == '5' else md5crypt(' '.join(secret)))
    add('encrypt', '1' if 'service password-encryption' in glob else '0')
    banner = next((h[len('banner motd '):] for h in glob if h.startswith('banner motd ')), '')
    if banner:
        banner = banner[1:banner.index(banner[0], 1)] if banner[0] in banner[1:] else banner[1:]
    add('banner', banner)
    add('lookup', '0' if any(h in ('no ip domain-lookup', 'no ip domain lookup') for h in glob) else '1', DNS)
    add('domain', next((h.split()[-1] for h in glob if re.match(r'ip domain[- ]name ', h)), ''), DNS)
    lines = [(CON, cfg.block('line con 0'))]
    for h, s in cfg.items:
        m = re.match(r'line vty (\d+)(?: (\d+))?$', h)
        if m and s is not None:
            lines += [(('VTY Line %d' % n, str(n), '4'), (h, s)) for n in range(int(m.group(1)), int(m.group(2) or m.group(1)) + 1)]
    for level, blk in lines:
        if not blk:
            continue
        levels = (level,) if level is CON else (VTYS, level)
        pw = next((s.split(None, 1)[1] for s in blk[1] if s.startswith('password ') and not s.startswith('password 7 ')), '')
        add('password', pw, *levels)
        if 'login local' not in blk[1]:
            add('login', '1' if 'login' in blk[1] else '0', *levels)
    switch = kind in ('switch', 'l3switch')
    if switch:
        add('gateway', next((h.split()[2] for h in glob if h.startswith('ip default-gateway ')), '0.0.0.0'))
        for n, name in sorted((info['vlans'] or {}).items()):
            add('vlan', name, VLANS, ('VLAN %d' % n, str(n), '5'))
    for h, s in cfg.items:
        if not h.startswith('interface ') or s is None:
            continue
        name = h.split(None, 1)[1]
        port = (name, name, '8')
        physical = name in info['ports']
        routed = kind == 'router' or name.startswith('Vlan') or 'no switchport' in s
        if switch and physical and not routed:
            add('access', next((x.split()[3] for x in s if x.startswith('switchport access vlan ')), '1'), PORTS, port)
            add('native', next((x.split()[4] for x in s if x.startswith('switchport trunk native vlan ')), '1'), PORTS, port)
        if routed:
            ip = next((x.split()[2:4] for x in s if re.match(r'ip address \d', x)), ['0.0.0.0', '0.0.0.0'])
            add('ip', ip[0], PORTS, port)
            add('mask', ip[1], PORTS, port)
        if '.' not in name:
            add('status', '0' if 'shutdown' in s else '1', PORTS, port)
        add('desc', next((x.split(None, 1)[1] for x in s if x.startswith('description ')), ''), PORTS, port)
    if info.get('saved') and info['model'] == '2960-24TT':
        add('saved', 'config.text', FLASH)
    return out


def host_items(info):
    s = info.get('host')
    if not s or s['dhcp'] or not s['v4']:
        return []
    port = next(iter(info['ports']))
    ip, plen = s['v4']
    mask = str(B.ipaddress.IPv4Network('0.0.0.0/%d' % plen).netmask)
    return [leaf('ip', PORTS, (port, port, '8')) + (ip,), leaf('mask', PORTS, (port, port, '8')) + (mask,), leaf('gateway') + (s['gw4'] or '0.0.0.0',)]


def items(info):
    if info['kind'] in B.IOS:
        return ios_items(info)
    if info['kind'] == 'host':
        return [(p, v, c) for p, c, v in host_items(info)]
    return []


def scored(start, answer):
    """Settings the solution changes: {device: [(path, value, component)]}. Of a run of changed vty
    lines only the first and last are scored, so 'line vty 0 15' is worth two points, not thirty-two."""
    out = {}
    for dev, info in answer.devices.items():
        before = {p: v for p, v, _ in items(start.devices[dev])}
        # a setting that is new in the answer (a new SVI, VLAN or file) is scored only if it holds a value
        changed = [(p, v, c) for p, v, c in items(info) if before.get(p) != v and (p in before or v not in ('', '0.0.0.0'))]
        vty = sorted({int(p[1][1]) for p, _, _ in changed if p[0] == VTYS})
        keep = {vty[0], vty[-1]} if vty else set()
        changed = [(p, v, c) for p, v, c in changed if p[0] != VTYS or int(p[1][1]) in keep]
        if changed:
            out[dev] = changed
    return out


def tree_node(parent, name, ident, eclass, head, value='', comp=None, points=None, check='0', translate=False):
    n = B.sub(parent, 'NODE')
    nm = B.sub(n, 'NAME', name)
    for k, v in (('checkType', check), ('eclass', eclass), ('headNode', 'true' if head else 'false'), ('incorrectFeedback', ''),
                 ('nodeValue', value), ('obfuscateName', 'false'), ('overrideDBGrading', 'false')):
        nm.set(k, v)
    if translate:
        nm.set('translate', 'true')
    nm.set('variableEnabled', 'false' if head else 'true')
    nm.set('variableName', '')
    i = B.sub(n, 'ID', ident)
    if translate:
        i.set('translate', 'true')
    B.sub(n, 'COMPONENTS', comp)
    B.sub(n, 'POINTS', points)
    return n


def comparisons(graded):
    root = ET.Element('COMPARISONS')
    net = tree_node(root, 'Network', 'Network', '8', True, check='1')
    ins = tree_node(net, 'Instruction', 'Instruction', '8', True, comp='Other', points='0')
    tree_node(ins, 'User Note', 'ID_USERNOTE', '8', False, '1', 'Other', '1')
    res = tree_node(net, 'Resource', 'Resource', '8', True)
    tree_node(res, 'wattage', 'wattage', '8', False, '0', 'Other', '1')
    tree_node(res, 'cost', 'cost', '8', False, '0', 'Other', '1')
    tree_node(net, 'ConnectivityTests', 'ConnectivityTests', '8', True, comp='Other', points='0')
    tree_node(net, 'CodeTesting', 'CodeTesting', '8', True, comp='Other', points='0')
    for dev, rows in graded.items():
        dn = tree_node(net, dev, dev, '8', True, check='1', translate=True)
        made = {}
        for path, value, comp in rows:
            parent, key = dn, ()
            for name, ident, eclass in path[:-1]:
                key += (ident,)
                if key not in made:
                    made[key] = tree_node(parent, name, ident, eclass, True, check='1')
                parent = made[key]
            name, ident, eclass = path[-1]
            tree_node(parent, name, ident, eclass, False, value, comp, '1', check='2')
    return root


def scored_items(tree):
    """[(path of shown names, value)] for the scored leaves of an assessment tree."""
    out = []

    def walk(n, path):
        nm = n.find('NAME')
        path = path + (nm.text,)
        if nm.get('checkType') == '2' and nm.get('headNode') == 'false':
            out.append((path[1:], nm.get('nodeValue')))
        for c in n.findall('NODE'):
            walk(c, path)
    walk(tree.find('NODE'), ())
    return out


def instructions(lab, items):
    e = html.escape
    banner = next((v for p, v in items if p[-1] == 'Banner MOTD'), None)
    parts, order = {}, []
    for t in lab['tasks']:
        if t['part'] not in parts:
            parts[t['part']] = []
            order.append(t['part'])
        note = ''
        if t['kind'] != 'check':
            note = ' <i>(question: answer it in the SRWE Study Lab)</i>'
        elif t['meta'] and t['meta'][0] == 'banner' and banner:
            note = ' Packet Tracer checks the exact text: <b>%s</b>' % e(banner)
        parts[t['part']].append('<li>%s%s</li>' % (e(t['text']), note))
    rows = ''.join('<tr>%s</tr>' % ''.join('<td>%s</td>' % e(str(c)) for c in (r + ['', '', '', ''])[:4]) for r in lab['addressing'])
    out = ['<html><head><style>body{font-family:Arial,sans-serif;font-size:10pt} table{border-collapse:collapse} '
           'td,th{border:1px solid #999;padding:2px 6px;text-align:left} h2{font-size:13pt} h3{font-size:11pt;margin-bottom:2px}</style></head><body>',
           '<h2>SRWE lab: %s</h2>' % e(lab['title']), '<p><b>Goal:</b> %s</p>' % e(lab['goal']), '<p>%s</p>' % e(lab['scenario'])]
    if rows:
        out.append('<h3>Addressing</h3><table><tr><th>Device</th><th>Interface</th><th>Address</th><th>Default gateway</th></tr>%s</table>' % rows)
    out.append('<h3>Tasks</h3>')
    for part in order:
        out.append('<p><b>%s</b></p><ol>%s</ol>' % (e(part), ''.join(parts[part])))
    if lab['ptNotes']:
        out.append('<h3>Packet Tracer notes</h3><ul>%s</ul>' % ''.join('<li>%s</li>' % e(n) for n in lab['ptNotes']))
    if items:
        out.append('<h3>Your score</h3><p>Click <b>Check Results</b> below. Packet Tracer scores %d configuration item%s. '
                   'Pings, questions and show-command checks are scored in the SRWE Study Lab app (lab %s).</p>'
                   % (len(items), '' if len(items) == 1 else 's', e(lab['id'])))
    else:
        out.append('<h3>Your score</h3><p>This lab has no command-line configuration for Packet Tracer to score: you observe, '
                   'answer questions or use device GUIs. Check your work in the SRWE Study Lab app (lab %s).</p>' % e(lab['id']))
    out.append('</body></html>')
    return '\n'.join(out)


ACTIVITY_VALUE = '��\x01�y9#\x11���\x02'  # identical in every activity Packet Tracer saves


def build(lab, tree=None, calibrate=False):
    """(activity XML, scored items). tree: an assessment tree saved by finalize.py, used instead of
    the computed one. calibrate: the answer network is the starting network; finalize.py has
    Packet Tracer save that version to learn the starting value of every setting."""
    start, sctx = B.network(lab)
    answer, actx = B.network(lab, solved=not calibrate)
    if tree is None:
        tree = comparisons(scored(sctx, actx))
    items = scored_items(tree)
    user = copy.deepcopy(start)
    for net in (user, start, answer):
        for tag in ('CEPS', 'EXT_PORT_MGR') + (() if net is user else ('PIXMAPBANK', 'MOVIEBANK', 'COMMAND_LOGS')):
            if net.find(tag) is not None:
                net.remove(net.find(tag))
    a = ET.Element('PACKETTRACER5_ACTIVITY')
    B.sub(a, 'VERSION', start.findtext('VERSION'))
    a.extend([user, start, answer, copy.deepcopy(tree)])
    init = B.sub(a, 'INITIALSETUP')
    tree_node(init, 'Network', 'Network', '8', True, comp='Other', points='0')
    B.sub(init, 'LOAD_INIT_TREE', 'false')
    a.append(B.template('locking'))
    a.append(copy.deepcopy(start.find('OPTIONS')))
    act = B.sub(a, 'ACTIVITY')
    for k, v in (('COUNTDOWNLEFT', '600000'), ('COUNTDOWNMS', '600000'), ('COUNTDOWN_EXPIRED', '0'), ('ELAPSED', '0'), ('ENABLED', 'no'),
                 ('FORWARD_ANS_SIM_MS', '0'), ('PASS', ''), ('TIMERTYPE', '0'), ('VALUE', ACTIVITY_VALUE)):
        act.set(k, v)
    ins = B.sub(act, 'INSTRUCTIONS')
    ins.set('enable_tab', 'false')
    ins.set('layout', '0')
    page = B.sub(ins, 'PAGE', instructions(lab, items))
    for k, v in (('tabify', '0'), ('title', ''), ('translate', 'true')):
        page.set(k, v)
    notes = B.sub(B.sub(act, 'INSTRUCTION_DIALOG'), 'USER_NOTES')
    notes.set('isDirty', 'false')
    notes.set('tabify', '0')
    vm = B.sub(a, 'VARIABLE_MANAGER')
    for tag in ('SEED_POOLS', 'NUMBER_POOLS', 'STRING_POOLS', 'IP_POOLS', 'VARIABLES_POOLS'):
        B.sub(vm, tag)
    B.sub(a, 'OVERALL_INCOMPLETE_FEEDBACK', '<html><body>Not complete yet. Open <b>Assessment Items</b> to see which settings are still missing.</body></html>').set('translate', 'true')
    B.sub(a, 'OVERALL_COMPLETE_FEEDBACK', '<html><body>Well done: every scored item is correct. Finish the questions in the SRWE Study Lab app.</body></html>').set('translate', 'true')
    B.sub(a, 'UNLOCK_ASSESSMENT_ITEM_PERCENT', '100')
    B.sub(a, 'DYNAMIC_PERCENTAGE_FEEDBACK', 'true').set('TYPE', '2')
    B.sub(a, 'USER_PROFILE_LOCKED', 'false')
    B.sub(a, 'USER_PROFILE_NOGUEST', 'false')
    B.sub(a, 'COMPONENT_LIST', ', '.join(['Other', 'Physical', 'Ip', 'ACL', 'Routing', 'Switching', 'NAT'] + COMPONENTS))
    B.sub(a, 'CLEAN_ACTIVITY', 'false')
    a.append(copy.deepcopy(start.find('SCRIPT_MODULE')))
    B.sub(B.sub(a, 'AUTHOR'), 'INFO', 'Original Author:SRWE Study Lab<br>Comments:%s<br>' % html.escape(lab['id']))
    B.sub(a, 'OBJECT_LOCATIONS').set('INDEX', '')
    B.sub(a, 'START_TIMESTAMP')
    B.sub(a, 'CEPS')
    B.sub(a, 'EXT_PORT_MGR')
    # Packet Tracer's assessment-tree reader only accepts the tree laid out the way Packet Tracer
    # writes it: one element per line, indented, empty elements as <X></X>. A compact tree fails
    # with "not compatible with this version".
    ET.indent(a, space=' ')
    return ET.tostring(a, encoding='unicode', short_empty_elements=False).encode('utf-8'), items
