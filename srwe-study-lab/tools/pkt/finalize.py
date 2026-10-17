#!/usr/bin/env python3
"""Have Packet Tracer itself write each lab's assessment tree (tools/pkt/trees/<lab id>.xml.gz).

  python3 tools/pkt/finalize.py [--fresh] [lab id ...]

For every lab, Packet Tracer opens and saves two versions of the activity: one whose answer
network is the solved lab, one whose answer network is the starting network. Saving makes
Packet Tracer regenerate the full assessment tree with its own names and values for every
setting. Every setting whose value the solution changes is scored (minus the noise listed in
SKIP), and the resulting tree is stored for build.py, which then needs no Packet Tracer.

Needs Packet Tracer 9 (/opt/pt/packettracer.AppImage), Xephyr and python3-xlib. Packet Tracer
runs on a private, off-screen X display with a copy of ~/pt, so your own session is not touched.
Saved files are cached in tools/pkt/.work; --fresh saves them again.
"""
import argparse
import glob
import gzip
import os
import re
import shutil
import signal
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import activity  # noqa: E402
import build as B  # noqa: E402
import ptfile  # noqa: E402

WORK = os.path.join(HERE, '.work')
TREES = os.path.join(HERE, 'trees')
APPIMAGE = '/opt/pt/packettracer.AppImage'
# Settings that change without being configured, or that only restate other items.
SKIP = [
    r'> IOS Configuration >', r'> Startup Config$', r'> Physical Location$', r'> Link to ', r'> Port Up$',
    r'> MAC Address$', r'> BIA$', r'> STP > VLANs > [^>]+ > VLAN Number$', r'> Custom Device Properties',
    r'> ARP Table', r'> MAC Table', r'> Routing Table', r'> CDP', r'> Neighbors', r'> Area Status', r'> Port Type$',
    r'> Bandwidth$', r'> Duplex$', r'^Instruction', r'^Resource', r'^ConnectivityTests', r'^CodeTesting', r'^Remote Network',
    r'^Encircling Tests', r'^Power Distribution Device', r'> Flash Files > vlan\.dat$',
]


# ---------------------------------------------------------------- Packet Tracer on a private display

class PacketTracer:
    def __init__(self):
        from Xlib import display  # python3-xlib
        self.num = next(n for n in range(20, 60) if not os.path.exists('/tmp/.X11-unix/X%d' % n))
        self.xephyr = subprocess.Popen(['Xephyr', ':%d' % self.num, '-screen', '1280x800+5000+5000', '-nolisten', 'tcp', '-ac', '-br'],
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(50):
            if os.path.exists('/tmp/.X11-unix/X%d' % self.num):
                break
            time.sleep(0.2)
        time.sleep(1)
        self.display = display.Display(':%d' % self.num)
        self.home = os.path.join(WORK, 'home')
        self.pt = None

    def fresh_home(self):
        shutil.rmtree(self.home, ignore_errors=True)
        os.makedirs(self.home)
        shutil.copytree(os.path.expanduser('~/pt'), os.path.join(self.home, 'pt'), ignore=shutil.ignore_patterns('logs'))
        os.makedirs(os.path.join(self.home, 'pt', 'logs'))
        if os.path.exists(os.path.expanduser('~/.packettracer')):
            shutil.copy(os.path.expanduser('~/.packettracer'), self.home)

    def log(self):
        lines = []
        for f in sorted(glob.glob(os.path.join(self.home, 'pt', 'logs', '*.log'))):
            lines += [ptfile.decode_log_line(l.strip()) for l in open(f) if l.strip()]
        return lines

    def open(self, path, limit=120):
        self.fresh_home()
        env = dict(os.environ, HOME=self.home, DISPLAY=':%d' % self.num)
        self.pt = subprocess.Popen([APPIMAGE, path], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        t0 = time.time()
        while time.time() - t0 < limit:
            time.sleep(1)
            log = self.log()
            if any('File failed to open' in l for l in log):
                raise RuntimeError('Packet Tracer could not open ' + path)
            if any('File Open finished' in l for l in log):
                time.sleep(3)
                return
        raise RuntimeError('Packet Tracer did not open %s within %ds' % (path, limit))

    def key(self, *names):
        from Xlib import X, XK
        from Xlib.ext import xtest
        codes = [self.display.keysym_to_keycode(XK.string_to_keysym(n)) for n in names]
        for c in codes:
            xtest.fake_input(self.display, X.KeyPress, c)
        for c in reversed(codes):
            xtest.fake_input(self.display, X.KeyRelease, c)
        self.display.sync()

    def click(self, x, y):
        from Xlib import X
        from Xlib.ext import xtest
        xtest.fake_input(self.display, X.MotionNotify, x=x, y=y)
        xtest.fake_input(self.display, X.ButtonPress, 1)
        xtest.fake_input(self.display, X.ButtonRelease, 1)
        self.display.sync()

    def save(self, path, limit=60):
        before = os.path.getmtime(path)
        self.click(700, 9)  # the empty end of the menu bar: focuses the main window
        time.sleep(0.5)
        self.key('Escape')
        time.sleep(0.5)
        self.key('Control_L', 's')
        t0 = time.time()
        while time.time() - t0 < limit:
            time.sleep(1)
            if os.path.getmtime(path) != before:
                size = -1
                while size != os.path.getsize(path):
                    size = os.path.getsize(path)
                    time.sleep(1.5)
                return
        raise RuntimeError('Packet Tracer did not save ' + path)

    def close(self):
        if self.pt:
            try:
                os.killpg(self.pt.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            self.pt = None

    def quit(self):
        self.close()
        self.xephyr.kill()


# ---------------------------------------------------------------- trees

def load_tree(path):
    raw = ptfile.decode(open(path, 'rb').read())
    raw = re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f]', b'', raw)
    i, j = raw.index(b'<COMPARISONS'), raw.index(b'</COMPARISONS>') + len(b'</COMPARISONS>')
    return ET.fromstring(raw[i:j])


def leaves(tree):
    """{path of IDs: (path of shown names, NAME element)} for every leaf."""
    out = {}

    def walk(n, ids, names):
        nm = n.find('NAME')
        ids, names = ids + (n.findtext('ID'),), names + (nm.text,)
        if nm.get('headNode') == 'false':
            out[ids[1:]] = (names[1:], nm)
        for c in n.findall('NODE'):
            walk(c, ids, names)
    walk(tree.find('NODE'), (), ())
    return out


def select(answer_tree, start_tree, lab):
    """Score the leaves the solution changes; returns the answer tree with checkTypes set."""
    before = {k: nm.get('nodeValue') for k, (_, nm) in leaves(start_tree).items()}
    # the usual value of a setting across its siblings of the same kind (Vlan interfaces, subinterfaces,
    # VLANs, vty lines), or across all siblings when the starting network has none of that kind
    kind = lambda k: k[:-2] + (re.sub(r'\d+', '#', k[-2]),) + k[-1:]
    usual, usual_kind = {}, {}
    for k, v in before.items():
        if len(k) >= 2:
            usual.setdefault(k[:-2] + k[-1:], Counter())[v] += 1
            usual_kind.setdefault(kind(k), Counter())[v] += 1
    common = lambda c: c.most_common(1)[0][0] if c else None

    def default(k):
        return common(usual_kind.get(kind(k))) if kind(k) in usual_kind else common(usual.get(k[:-2] + k[-1:]))
    dhcp_hosts = {d for d, s in B.host_settings(lab).items() if s['dhcp']}
    for n in answer_tree.iter('NODE'):
        n.find('NAME').set('checkType', '0')
    chosen = []
    for ids, (names, nm) in leaves(answer_tree).items():
        shown = ' > '.join(names)
        value = nm.get('nodeValue')
        if before.get(ids) == value or any(re.search(p, shown) for p in SKIP):
            continue
        if ids not in before and (value in ('', '0.0.0.0', '0') or len(ids) >= 2 and default(ids) == value):
            continue  # a new interface, VLAN or process brings defaults along; only its configured values count
        if names[0] in dhcp_hosts:
            continue  # a DHCP client's settings depend on when it got its lease
        if re.search(r'> STP > VLANs > [^>]+ > Priority$', shown) and value == '32768':
            continue
        if names[-1] == 'Router ID' and not any(c.strip().startswith('router-id') for c in lab['solution'].get(names[0], [])):
            continue  # picked from the interface addresses when the process starts, not configured
        chosen.append((ids, names, nm))
    # 'line vty 0 15' sets sixteen lines: score the first and last only
    vty = {}
    for ids, names, nm in chosen:
        m = re.match(r'VTY Line (\d+)$', names[2]) if len(names) > 3 and names[1] == 'VTY Lines' else None
        if m:
            vty.setdefault((names[0], names[3]), []).append(int(m.group(1)))
    for ids, names, nm in chosen:
        if len(names) > 3 and names[1] == 'VTY Lines':
            lines = vty.get((names[0], names[3]), [])
            if lines and int(names[2].split()[-1]) not in (min(lines), max(lines)):
                continue
        nm.set('checkType', '2')
    # parents of scored leaves are partially checked
    def mark(n):
        hit = False
        for c in n.findall('NODE'):
            hit |= mark(c)
        nm = n.find('NAME')
        if nm.get('checkType') == '2':
            return True
        if hit:
            nm.set('checkType', '1')
        return hit
    mark(answer_tree.find('NODE'))
    return answer_tree


def prune(tree):
    """Keep the standard top nodes and the branches that hold scored leaves (Packet Tracer
    rebuilds the rest on its next save); keeps the stored trees small."""
    def keep(n):
        for c in list(n.findall('NODE')):
            if not keep(c):
                n.remove(c)
        return n.find('NAME').get('checkType') in ('1', '2')
    root = tree.find('NODE')
    for c in list(root.findall('NODE')):
        if c.findtext('ID') in ('Instruction', 'Resource', 'ConnectivityTests', 'CodeTesting'):
            for k in c.iter('NODE'):
                k.find('NAME').set('checkType', '0')
            continue
        if not keep(c):
            root.remove(c)
    root.find('NAME').set('checkType', '1')
    return tree


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--fresh', action='store_true')
    ap.add_argument('ids', nargs='*')
    a = ap.parse_args()
    import json
    labs = json.loads(subprocess.run(['node', os.path.join(HERE, 'labs.js')], capture_output=True, text=True, check=True).stdout)
    labs = [l for l in labs if not a.ids or l['id'] in a.ids]
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(TREES, exist_ok=True)
    pt = None
    try:
        for lab in labs:
            saved = {}
            for kind, calibrate in (('answer', False), ('start', True)):
                path = os.path.join(WORK, '%s.%s.pka' % (lab['id'], kind))
                if a.fresh or not os.path.exists(path):
                    with open(path, 'wb') as f:
                        f.write(ptfile.encode(activity.build(lab, calibrate=calibrate)[0]))
                    pt = pt or PacketTracer()
                    try:
                        pt.open(path)
                        pt.save(path)
                    except BaseException:
                        os.remove(path)  # not saved by Packet Tracer: never reuse it from the cache
                        raise
                    pt.close()
                saved[kind] = load_tree(path)
            tree = prune(select(saved['answer'], saved['start'], lab))
            ET.indent(tree, space=' ')
            with open(os.path.join(TREES, lab['id'] + '.xml.gz'), 'wb') as f:
                f.write(gzip.compress(ET.tostring(tree, encoding='utf-8', short_empty_elements=False), mtime=0))
            print('%-28s %d scored items' % (lab['id'], len(activity.scored_items(tree))), flush=True)
    finally:
        if pt:
            pt.quit()


if __name__ == '__main__':
    main()
