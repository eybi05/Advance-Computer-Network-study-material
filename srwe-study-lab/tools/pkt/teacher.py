#!/usr/bin/env python3
"""Import the instructor's Packet Tracer activities into js/data/teacher-labs.js.

The activities stay in the "teacher's lab" folder next to this app (the folder that holds the slide
decks); the lab pages link to them there. For each .pka this reads:

  * the activity number, module and title from the file name ("3.4.5 Packet Tracer - Configure Trunks.pka"),
  * the instructions Packet Tracer shows in the activity window (Word HTML), converted into the app's
    own markup: headings, steps, command examples, command output, tables, questions,
  * the topology (devices, models, positions, cables) for the lab page diagram. An activity that starts
    with an empty workspace gets the topology of its answer network: the devices you have to add.

  python3 tools/pkt/teacher.py      # after adding or replacing activities in the folder

Needs libgcrypt (ptfile.py). Output is deterministic.
"""
import glob
import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(os.path.dirname(APP), "teacher's lab")
OUT = os.path.join(APP, 'js', 'data', 'teacher-labs.js')
sys.path.insert(0, HERE)
import ptfile  # noqa: E402

NAME = re.compile(r'^(\d+)\.(\d+)\.(\d+)\s+Packet Tracer\s*-\s*(.+)\.pka$', re.I)

# Packet Tracer device type -> topology icon (js/app/labs.js ICONS)
KINDS = {
    'Router': 'router', 'Switch': 'switch', 'MultiLayerSwitch': 'l3switch', 'Pc': 'pc', 'Laptop': 'laptop', 'Server': 'server',
    'AccessPoint': 'ap', 'LightWeightAccessPoint': 'ap', 'WirelessLanController': 'wlc', 'WirelessRouter': 'wrouter',
    'WirelessRouterNewGeneration': 'wrouter', 'Cloud': 'cloud', 'CableModem': 'modem', 'IpPhone': 'phone', 'TabletPC': 'tablet', 'Pda': 'phone',
}
SKIP_KINDS = {'Power Distribution Device'}
CABLES = {'eStraightThrough': 'straight', 'eCrossOver': 'cross', 'eFiber': 'fiber', 'eConsole': 'console', 'eCoaxial': 'coax'}
LINK_TYPES = {'eSerial': 'serial', 'eCoaxial': 'coax', 'eFiber': 'fiber', 'eConsole': 'console'}

# Word paragraph style -> indent level of the converted block (the Cisco lab template indents 0.25in / 0.5in)
LEVEL = {'BodyTextL25': 1, 'BodyTextL25Bold': 1, 'SubStepAlpha': 1, 'SubStepNum': 1, 'Bulletlevel1': 1, 'ReflectionQ': 1, 'InstNoteRedL25': 1,
         'BodyTextL50': 2, 'CMD': 2, 'CMDOutput': 2, 'Bulletlevel2': 2, 'AnswerLineL50': 2}
ANSWER_LINE = re.compile(r'^\s*Type your answers? here\.?\s*$', re.I)
MARKER = re.compile(r'^\s*([a-z]|\d{1,2})[.)]\s+')
BULLET = re.compile(r'^\s*(?:<code>o</code>|[\u00b7\u2022\u25aa\uf0b7\uf0a7§o-])\s+')  # the glyph Word puts before a bullet's text


# ---------------------------------------------------------------- HTML tree

class Node:
    def __init__(self, tag, attrs=None):
        self.tag, self.attrs, self.children = tag, attrs or {}, []

    @property
    def cls(self):
        return self.attrs.get('class') or ''


class Tree(HTMLParser):
    VOID = {'br', 'img', 'meta', 'link', 'hr', 'input', 'col', 'wbr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, dict(attrs))
        self.stack[-1].children.append(n)
        if tag not in self.VOID:
            self.stack.append(n)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def parse_html(text):
    body = text[text.find('<body'):] if '<body' in text else text
    t = Tree()
    t.feed(body)
    t.close()
    return t.root


def plain(n):
    return ''.join(c if isinstance(c, str) else plain(c) for c in n.children)


def squash(s):
    return re.sub(r'\s+', ' ', s.replace('\xa0', ' ')).strip()


def inline(n):
    """A paragraph's content as escaped HTML, keeping bold, italics and inline commands."""
    s = re.sub(r'[ \t]+', ' ', runs(n))
    s = re.sub(r'</(b|i|code)>(\s*)<\1>', r'\2', s)  # Word splits runs: <b>show</b><b> vlan</b>
    s = re.sub(r'<(b|i|code)>(\s+)', r'\2<\1>', s)
    s = re.sub(r'(\s+)</(b|i|code)>', r'</\2>\1', s)
    return s.strip()


def runs(n):
    out = []
    for c in n.children:
        if isinstance(c, str):
            out.append(html.escape(c.replace('\r', ' ').replace('\n', ' ').replace('\xa0', ' '), quote=False))
            continue
        style = c.attrs.get('style') or ''
        if c.tag == 'span' and 'font:7.0pt' in style.replace(' ', ''):  # Word's padding after a list number
            out.append(' ')
            continue
        inner = runs(c)
        if c.tag in ('b', 'strong') and inner.strip():
            out.append('<b>%s</b>' % inner)
        elif c.tag in ('i', 'em') and inner.strip():
            out.append('<i>%s</i>' % inner)
        elif c.tag == 'br':
            out.append('<br>')
        elif c.tag == 'span' and ('CMDChar' in c.cls or 'Courier' in style) and inner.strip():
            out.append('<code>%s</code>' % inner)
        else:
            out.append(inner)
    return ''.join(out)


def blocks(n):
    """Paragraphs, headings and tables in document order (wrapping divs flattened)."""
    for c in n.children:
        if isinstance(c, str):
            continue
        if c.tag in ('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table'):
            yield c
        else:
            yield from blocks(c)


def table(t):
    rows = []
    for tr in walk(t, 'tr'):
        cells = []
        for td in [c for c in tr.children if not isinstance(c, str) and c.tag in ('td', 'th')]:
            paras = [p for p in walk(td, 'p')] or [td]
            text = '<br>'.join(x for x in (inline(p) for p in paras) if x)
            head = td.tag == 'th' or any('TableHeading' in p.cls for p in paras)
            attrs = ''.join(' %s="%s"' % (k, td.attrs[k]) for k in ('rowspan', 'colspan') if (td.attrs.get(k) or '1') != '1' and td.attrs[k].isdigit())
            cells.append('<%s%s>%s</%s>' % ('th' if head else 'td', attrs, text, 'th' if head else 'td'))
        if cells:
            rows.append('<tr>%s</tr>' % ''.join(cells))
    return '<div class="scroll"><table class="t small compact">%s</table></div>' % ''.join(rows) if rows else ''


def walk(n, tag):
    for c in n.children:
        if isinstance(c, str):
            continue
        if c.tag == tag:
            yield c
        elif c.tag != 'table':
            yield from walk(c, tag)


def instructions(text):
    """(title, HTML, number of questions, objectives) from the activity's instructions page."""
    root = parse_html(text)
    title, items, objectives, section = '', [], [], ''
    for b in blocks(root):
        if b.tag == 'table':
            items.append(('table', 0, table(b)))
            continue
        cls = b.cls
        words = squash(plain(b))
        if cls == 'MsoTitle':
            title = title or words
            continue
        if not words:
            continue
        if b.tag == 'h4' or (cls == 'ConfigWindow' and re.match(r'^Questions?:?$', words)):
            items.append(('qmark', 0, words.lower().startswith('questions')))
            continue
        if cls == 'ConfigWindow' or 'Answer' in cls or ANSWER_LINE.match(words):
            continue  # Packet Tracer window markers and "Type your answers here." lines
        if b.tag == 'h1':
            section = words.lower()
        elif section.startswith('objective') and b.tag == 'p':
            objectives.append(BULLET.sub('', words) if cls.startswith('Bullet') else words)
        if b.tag in ('h1', 'h2', 'h3'):
            items.append(('h', {'h1': 3, 'h2': 4, 'h3': 5}[b.tag], html.escape(words, quote=False)))
            continue
        level = LEVEL.get(cls, 0)
        if cls == 'CMD':
            items.append(('cmd', level, squash(plain(b))))
        elif cls == 'CMDOutput':
            items.append(('out', level, plain(b).replace('\r', '').replace('\n', ' ').replace('\xa0', ' ').rstrip()))
        elif cls.startswith('Bulletlevel'):
            items.append(('li', level, BULLET.sub('', inline(b), count=1)))
        elif cls == 'ReflectionQ':
            items.append(('rq', level, inline(b)))
        elif cls == 'InstNoteRedL25':
            items.append(('note', level, inline(b)))
        else:
            items.append(('p', level, inline(b)))

    out, questions, i = [], 0, 0

    def para(level, body):
        m = MARKER.match(re.sub(r'<[^>]+>', '', body))
        if m:  # "a. text" -> hanging marker
            mk = m.group(0).strip()
            body = re.sub(r'^\s*(<b>)?\s*' + re.escape(mk) + r'\s*', r'\1', body, count=1)
            return '<p class="l%d sub"><span class="mk">%s</span>%s</p>' % (level, html.escape(mk, quote=False), body)
        note = ' tl-note' if re.match(r'^(<b>)?Note:', body) else ''
        return '<p class="l%d%s">%s</p>' % (level, note, body)

    def question(level, body):
        nonlocal questions
        questions += 1
        return '<div class="tl-q l%d" data-q="%d">%s</div>' % (max(level, 1), questions - 1, para(0, body).replace('<p class="l0', '<p class="qt'))

    while i < len(items):
        kind, level, body = items[i]
        if kind in ('cmd', 'out'):
            lines = []
            while i < len(items) and items[i][0] == kind:
                lines.append(html.escape(items[i][2], quote=False))
                i += 1
            out.append('<pre class="%s l%d">%s</pre>' % ('cli' if kind == 'cmd' else 'out', level, '\n'.join(lines)))
            continue
        if kind == 'li':  # two levels: a level-2 bullet nests under the level-1 bullet before it
            parts, nested = ['<ul class="l%d">' % level], False
            for k in range(i, len(items) + 1):
                if k == len(items) or items[k][0] != 'li':
                    break
                if items[k][1] > level and k > i:
                    parts.append(('' if nested else '<ul>') + '<li>%s</li>' % items[k][2])
                    nested = True
                else:
                    parts.append(('</ul>' if nested else '') + ('</li>' if k > i else '') + '<li>%s' % items[k][2])
                    nested = False
            parts.append(('</ul>' if nested else '') + '</li></ul>')
            out.append(''.join(parts))
            i = k
            continue
        if kind == 'qmark':
            i += 1
            first = True
            while i < len(items) and items[i][0] in ('p', 'rq'):
                _, lv2, b2 = items[i]
                txt = re.sub(r'<[^>]+>', '', b2).strip()
                if not first and (not ('?' in txt or txt.endswith(':')) or MARKER.match(txt)):
                    break
                out.append(question(lv2, b2))
                i += 1
                first = False
                if not body:  # "Question:" covers one paragraph, "Questions:" the run of questions after it
                    break
            continue
        if kind == 'rq':
            out.append(question(level, body))
        elif kind == 'h':
            out.append('<h%d>%s</h%d>' % (level, body, level))
        elif kind == 'note':
            out.append('<p class="l%d tl-note">%s</p>' % (level, body))
        elif kind == 'table':
            out.append(body)
        else:
            out.append(para(level, body))
        i += 1
    return title, '\n'.join(out), questions, objectives


# ---------------------------------------------------------------- topology

def network_xml(xml):
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', xml.decode('utf-8', 'replace'))
    return ET.fromstring(text), text


def topology(root):
    """(devices, links, taken from the answer network?) of the activity's starting network."""
    nets = [p.find('NETWORK') for p in root.findall('PACKETTRACER5')]
    pick, answer = nets[0], False
    if not pick.find('DEVICES').findall('DEVICE'):
        pick, answer = nets[-1], True
    devices, refs, order = [], {}, []
    for d in pick.find('DEVICES').findall('DEVICE'):
        e = d.find('ENGINE')
        t = e.find('TYPE')
        name = e.findtext('NAME') or ''
        order.append(name)
        refs[e.findtext('SAVE_REF_ID') or ''] = name
        if t.text in SKIP_KINDS:
            continue
        lg = d.find('WORKSPACE/LOGICAL')
        devices.append({'id': name, 'type': KINDS.get(t.text, 'pc'), 'model': t.get('model') or t.text,
                        'px': float(lg.findtext('X') or 0), 'py': float(lg.findtext('Y') or 0)})
    names = {d['id'] for d in devices}
    links = []
    for l in pick.find('LINKS').findall('LINK'):
        c = l.find('CABLE')
        ends = []
        for tag in ('FROM', 'TO'):
            ref = c.findtext(tag) or ''
            ends.append(refs.get(ref) or (order[int(ref)] if ref.isdigit() and int(ref) < len(order) else ref))
        ports = [p.text or '' for p in c.findall('PORT')]
        if len(ports) < 2 or not all(e in names for e in ends):
            continue
        kind = LINK_TYPES.get(l.findtext('TYPE')) or CABLES.get(c.findtext('TYPE') or '', 'straight')
        links.append([ends[0], ports[0], ends[1], ports[1], kind])
    # Place devices on the app's grid (x 0-100, drawn x10). Packet Tracer packs devices tighter than the app's
    # icons and port labels allow, so stretch each layout to about the app's own width, and further when the
    # devices typically sit closer than an icon (the lower quartile of nearest-neighbour distances, so one
    # tight pair does not shrink the whole diagram).
    if devices:
        near = sorted(min((((a['px'] - b['px']) ** 2 + (a['py'] - b['py']) ** 2) ** 0.5 for b in devices if b is not a), default=100) for a in devices)
        gap = near[len(near) // 4] or 100
        x0, y0 = min(d['px'] for d in devices), min(d['py'] for d in devices)
        span = max(max(d['px'] for d in devices) - x0, (max(d['py'] for d in devices) - y0) * 1.6) or 1
        s = max(1.0, min(2.4, max(115 / gap, 880 / span)))
        for d in devices:
            d['x'] = round((d.pop('px') - x0) * s / 10, 1)
            d['y'] = round((d.pop('py') - y0) * s / 10, 1)
    return devices, links, answer


# ---------------------------------------------------------------- main

def read(path):
    m = NAME.match(os.path.basename(path))
    if not m:
        return None
    xml = ptfile.decode(open(path, 'rb').read())
    root, text = network_xml(xml)
    page = re.search(r'<INSTRUCTIONS[^>]*>.*?<PAGE[^>]*><!\[CDATA\[(.*?)\]\]></PAGE>', text, re.S)
    title, body, questions, objectives = instructions(page.group(1)) if page else ('', '', 0, [])
    devices, links, answer = topology(root)
    version = re.match(r'(\d+\.\d+\.\d+)', root.findtext('VERSION') or '')
    return {
        'id': '.'.join(m.group(1, 2, 3)), 'module': int(m.group(1)),
        'title': re.sub(r'^Packet Tracer\s*-\s*', '', title).strip() or m.group(4).strip(),
        'file': os.path.basename(path), 'version': version.group(1) if version else '',
        'objectives': objectives, 'devices': devices, 'links': links, 'emptyStart': answer, 'questions': questions, 'html': body,
    }


def main():
    files = sorted(glob.glob(os.path.join(SRC, '*.pka')))
    if not files:
        sys.exit('no .pka files in ' + SRC)
    labs = []
    for f in files:
        lab = read(f)
        if lab is None:
            print('skipped (name is not "<n.n.n> Packet Tracer - <title>.pka"): ' + os.path.basename(f))
            continue
        labs.append(lab)
        print('%-8s %-60s %2d devices, %2d cables, %2d questions%s' % (lab['id'], lab['title'][:60], len(lab['devices']), len(lab['links']),
                                                                    lab['questions'], ', topology from the answer network' if lab['emptyStart'] else ''))
    key = lambda l: tuple(int(x) for x in l['id'].split('.'))
    labs.sort(key=key)
    rel = os.path.relpath(SRC, APP).replace(os.sep, '/') + '/'
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('/* Your instructor\'s Packet Tracer activities, imported from "%s" by tools/pkt/teacher.py. Do not edit by hand:\n'
                ' * add or replace .pka files in that folder and run the script again. */\n' % rel)
        f.write('(function (root) {\n  \'use strict\';\n  const SRWE = root.SRWE = root.SRWE || {};\n')
        f.write('  SRWE.teacherDir = %s;\n' % json.dumps(rel, ensure_ascii=False))
        f.write('  SRWE.teacherLabs = [\n')
        for lab in labs:
            f.write('    %s,\n' % json.dumps(lab, ensure_ascii=False, separators=(',', ':')))
        f.write('  ];\n})(typeof window !== \'undefined\' ? window : globalThis);\n')
    print('%d activities -> %s' % (len(labs), os.path.relpath(OUT, APP)))


if __name__ == '__main__':
    main()
