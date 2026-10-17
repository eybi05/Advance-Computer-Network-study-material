#!/usr/bin/env python3
"""Refresh the device templates in tools/pkt/templates from a Packet Tracer 9 install.

  python3 tools/pkt/extract.py --base ~/Documents/some-pt9-file.pkt [--activity some-pt9-activity.pka]
                               [--appimage /opt/pt/packettracer.AppImage]

--base is any file saved by your Packet Tracer 9.0.x. It supplies the file skeleton (version,
options, physical workspace, the rack's power distribution device) plus the PC-PT and 2960-24TT
templates, so it needs at least one PC-PT and one 2960-24TT. The other models come from the sample
networks that ship inside the AppImage. --activity is any activity saved by Packet Tracer 9: its
locking tree (what an activity may lock) is kept with every lock switched off. Only the templates
are committed; build.py does not need Packet Tracer.
"""
import argparse
import copy
import gzip
import os
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ptfile  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
IND = '06 Industrial -  OT/Industrial Cybersecurity and Monitoring/'
WLAN = '01 Networking/Wireless/Wireless LAN/'
# template name -> (sample file inside opt/pt/saves, or None for --base; model; index among that model)
SOURCES = {
    'PC-PT': (None, 'PC-PT', 0),
    '2960-24TT': (None, '2960-24TT', 0),
    'ISR4321': (IND + 'Firewall/isa3000_dmz.pkt', 'ISR4321', 0),
    'ISR4331': (IND + 'CyberObserver/CyberObserver_Threat_Mitigation.pkt', 'ISR4331', 0),
    '3650-24PS': ('01 Networking/3650/HotSwappablePower.pkt', '3650-24PS', 0),
    'Server-PT': (IND + 'Firewall/isa3000_dmz.pkt', 'Server-PT', 0),
    'Laptop-PT': ('01 Networking/HomeRouter/hr-isp-vlans-ip-dhcp.pkt', 'Laptop-PT', 0),
    'AccessPoint-PT': (WLAN + '802_11a_b_g_n.pkt', 'AccessPoint-PT', 0),
    'Linksys-WRT300N': ('04 IoT/Solution Examples/iot_street_data_collector.pkt', 'Linksys-WRT300N', 0),
    'WLC-3504': (WLAN + 'WLC/wlc_3504_startup_wizard.pkt', 'WLC-3504', 0),
    'LAP-PT': (WLAN + 'WLC/wlc_2504_simple_wlan.pkt', 'LAP-PT', 0),
}
WIRELESS_N_PORT = ('01 Networking/Wireless/5G/5G.pkt', 'TabletPC-PT', 0)


def load(path):
    # Packet Tracer writes control characters (banner delimiters, activity fields) that XML 1.0 forbids
    return ET.fromstring(re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f]', b'', ptfile.decode(open(path, 'rb').read())))


def device(root, model, index):
    found = [d for d in root.find('NETWORK/DEVICES') if d.find('ENGINE/TYPE').get('model') == model]
    if len(found) <= index:
        sys.exit('no %s #%d in the source file' % (model, index))
    return copy.deepcopy(found[index])


def wireless_laptop(laptop, tablet):
    """Laptop-PT with its wired NIC swapped for a Linksys-WPC300N, as the labs ask for."""
    d = copy.deepcopy(laptop)
    wport = next(p for p in tablet.iter('PORT') if p.findtext('TYPE') == 'eHostWirelessN')
    for mod in d.iter('MODULE'):
        if mod.findtext('MODEL') == 'PT-LAPTOP-NM-1CFE':
            mod.find('MODEL').text = 'Linksys-WPC300N'
            old = mod.find('PORT')
            mod.insert(list(mod).index(old), copy.deepcopy(wport))
            mod.remove(old)
            return d
    sys.exit('Laptop-PT template has no PT-LAPTOP-NM-1CFE module')


def base_skeleton(root):
    """The base file without its devices, links and drawings; keeps the rack's power distribution device."""
    net = root.find('NETWORK')
    devs = net.find('DEVICES')
    keep = set()
    for d in list(devs):
        if d.find('ENGINE/TYPE').text == 'Power Distribution Device' and not keep:
            keep.add(d.findtext('WORKSPACE/PHYSICAL').split(',')[-1])
        else:
            devs.remove(d)
    for tag in ('LINKS', 'SHAPETESTS'):
        for c in list(net.find(tag)):
            net.find(tag).remove(c)
    for parent in root.find('PHYSICALWORKSPACE').iter():
        kids = parent.find('CHILDREN')
        if kids is None:
            continue
        for n in list(kids.findall('NODE')):
            if n.findtext('TYPE') == '6' and n.findtext('UUID_STR') not in keep:
                kids.remove(n)
    for tag in ('LINES', 'RECTANGLES', 'ELLIPSES', 'POLYGONS', 'COMMAND_LOGS', 'GEOVIEW_GRAPHICSITEMS'):
        for c in list(root.find(tag)):
            root.find(tag).remove(c)
    opts = root.find('OPTIONS')
    for c in list(opts.find('RECENT_FILES')):
        opts.find('RECENT_FILES').remove(c)
    opts.find('LAST_LOGON_TIME').text = '0'
    prof = root.find('USER_PROFILE')
    prof.find('NAME').text = 'Guest'
    for tag in ('EMAIL', 'ADDITIONAL_INFO'):
        prof.find(tag).text = None
    return root


def unlocked(activity):
    """The activity's LOCKINGTREE with locking disabled and every lock off."""
    tree = copy.deepcopy(activity.find('LOCKINGTREE'))
    tree.set('enabled', 'no')
    for n in tree.iter('NODE'):
        n.set('on', 'no')
    return tree


def save(name, el):
    with open(os.path.join(OUT, name + '.xml.gz'), 'wb') as f:
        f.write(gzip.compress(ET.tostring(el, encoding='utf-8'), mtime=0))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--base', required=True)
    ap.add_argument('--activity')
    ap.add_argument('--appimage', default='/opt/pt/packettracer.AppImage')
    a = ap.parse_args()
    base = load(a.base)
    if not base.findtext('VERSION').startswith('9.'):
        sys.exit('--base must be saved by Packet Tracer 9')
    with tempfile.TemporaryDirectory() as tmp:
        off = subprocess.run([a.appimage, '--appimage-offset'], capture_output=True, text=True, check=True).stdout.strip()
        subprocess.run(['unsquashfs', '-q', '-f', '-no-xattrs', '-o', off, '-d', tmp, a.appimage, 'opt/pt/saves'], check=True, stdout=subprocess.DEVNULL)
        saves = os.path.join(tmp, 'opt/pt/saves')
        cache = {}

        def pick(src):
            path, model, index = src
            root = base if path is None else cache.setdefault(path, load(os.path.join(saves, path)))
            return device(root, model, index)
        os.makedirs(OUT, exist_ok=True)
        for name, src in SOURCES.items():
            save(name, pick(src))
        save('Laptop-PT-WPC300N', wireless_laptop(pick(SOURCES['Laptop-PT']), pick(WIRELESS_N_PORT)))
    if a.activity:
        save('locking', unlocked(load(a.activity)))
    save('base', base_skeleton(base))
    print('templates written to', OUT)


if __name__ == '__main__':
    main()
