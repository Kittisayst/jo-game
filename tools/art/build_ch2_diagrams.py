"""Draws the Textbook diagrams for the pages of book-ch2 added in Phase 10 (lessons 14-1 to 20-1).

    python tools/art/build_ch2_diagrams.py

Writes public/assets/books/ch2-p4-*.svg ... ch2-p10-*.svg in the same look as the Realm 1 diagrams
(dark panel, grid, coloured boxes) and adds them to docs/asset-manifest.json. Simple placeholder diagrams.
"""

import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BOOKS = os.path.join(ROOT, 'public', 'assets', 'books')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

FONT = 'Noto Sans Lao, sans-serif'
CYAN, GREEN, GOLD, VIOLET = '#38bdf8', '#22c55e', '#f59e0b', '#a78bfa'
HEAD = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 156" width="360" height="156">
  <defs>
    <pattern id="grid" width="18" height="18" patternUnits="userSpaceOnUse">
      <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#1e293b" stroke-width="1"/>
    </pattern>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
    </marker>
  </defs>
  <rect width="360" height="156" rx="10" fill="#0f172a"/>
  <rect width="360" height="156" rx="10" fill="url(#grid)"/>
  <rect x="1.5" y="1.5" width="357" height="153" rx="9" fill="none" stroke="#334155" stroke-width="1.5"/>
"""


def title(text):
    return '  <text x="180" y="20" text-anchor="middle" fill="#e2e8f0" font-family="%s" font-size="12" font-weight="bold">%s</text>\n' % (FONT, text)


def box(x, y, w, h, label, color, sub=None):
    out = '  <rect x="%d" y="%d" width="%d" height="%d" rx="6" fill="#1e293b" stroke="%s" stroke-width="2"/>\n' % (x, y, w, h, color)
    cy = y + h / 2 + (0 if sub else 4)
    out += '  <text x="%d" y="%d" text-anchor="middle" fill="%s" font-family="%s" font-size="11" font-weight="bold">%s</text>\n' % (x + w / 2, cy, color, FONT, label)
    if sub:
        out += '  <text x="%d" y="%d" text-anchor="middle" fill="#cbd5e1" font-family="%s" font-size="8.5">%s</text>\n' % (x + w / 2, cy + 14, FONT, sub)
    return out


def arrow(x1, y1, x2, y2, both=False):
    start = ' marker-start="url(#arrow)"' if both else ''
    return '  <line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="2" marker-end="url(#arrow)"%s/>\n' % (x1, y1, x2, y2, CYAN, start)


def label(x, y, text, color='#cbd5e1', size=9):
    return '  <text x="%d" y="%d" text-anchor="middle" fill="%s" font-family="%s" font-size="%s">%s</text>\n' % (x, y, color, FONT, size, text)


def dot(x, y, color, r=7):
    return '  <circle cx="%d" cy="%d" r="%d" fill="#0f172a" stroke="%s" stroke-width="2"/>\n' % (x, y, r, color)


def line(x1, y1, x2, y2, color):
    return '  <line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="2"/>\n' % (x1, y1, x2, y2, color)


def network_devices():
    s = title('ອຸປະກອນເຄືອຂ່າຍ')
    s += box(12, 52, 70, 50, 'ISP', GOLD, 'ອິນເຕີເນັດ') + arrow(84, 77, 100, 77)
    s += box(102, 52, 70, 50, 'MODEM', CYAN, 'ແປງສັນຍານ') + arrow(174, 77, 190, 77)
    s += box(192, 52, 70, 50, 'ROUTER', GREEN, 'ແຈກ IP') + arrow(264, 77, 280, 77)
    s += box(282, 52, 68, 50, 'SWITCH', VIOLET, 'ເຊື່ອມ LAN')
    s += label(180, 134, 'ISP → Modem → Router → Switch → ຄອມພິວເຕີ')
    return s


def topology():
    s = title('Topology: Star · Bus · Ring')
    # star
    s += dot(60, 80, GREEN, 9)
    for x, y in ((60, 44), (24, 80), (96, 80), (60, 116)):
        s += line(60, 80, x, y, GREEN) + dot(x, y, GREEN, 6)
    s += label(60, 146, 'Star', GREEN, 10)
    # bus
    s += line(140, 80, 220, 80, GOLD)
    for x in (150, 175, 200, 220):
        s += line(x, 80, x, 56 if x % 2 else 104, GOLD) + dot(x, 56 if x % 2 else 104, GOLD, 6)
    s += label(180, 146, 'Bus', GOLD, 10)
    # ring
    s += '  <circle cx="300" cy="80" r="30" fill="none" stroke="%s" stroke-width="2"/>\n' % VIOLET
    for x, y in ((300, 50), (330, 80), (300, 110), (270, 80)):
        s += dot(x, y, VIOLET, 6)
    s += label(300, 146, 'Ring', VIOLET, 10)
    return s


def wifi():
    s = title('Wi-Fi ແລະ Bluetooth')
    s += box(20, 56, 76, 44, 'ROUTER', GREEN, 'Wi-Fi')
    for r in (22, 36, 50):
        s += '  <path d="M %d %d A %d %d 0 0 1 %d %d" fill="none" stroke="%s" stroke-width="2"/>\n' % (110, 78 - r, r, r, 110, 78 + r, CYAN)
    s += box(180, 34, 80, 36, 'ແລັບທັອບ', CYAN) + box(180, 88, 80, 36, 'ໂທລະສັບ', CYAN)
    s += box(280, 56, 66, 44, 'ຫູຟັງ', VIOLET, 'Bluetooth')
    s += arrow(262, 106, 280, 84, both=True)
    s += label(180, 146, 'Wi-Fi = ຄື້ນວິທະຍຸ · Bluetooth = ໄລຍະໃກ້')
    return s


def web():
    s = title('ເວັບໄຊ ແລະ ບຣາວເຊີ')
    s += box(12, 54, 90, 50, 'BROWSER', CYAN, 'Chrome · Firefox') + arrow(104, 79, 124, 79, both=True)
    s += box(126, 54, 108, 50, 'URL', GOLD, 'https://www.example.com') + arrow(236, 79, 256, 79, both=True)
    s += box(258, 54, 90, 50, 'WEB SERVER', GREEN, 'ເກັບໜ້າເວັບ')
    s += label(180, 134, 'https = ເຂົ້າລະຫັດ ປອດໄພກວ່າ http')
    return s


def dns():
    s = title('DNS ແປງຊື່ເປັນ IP')
    s += box(12, 54, 110, 50, 'www.example.com', GOLD, 'ຊື່ໂດເມນ') + arrow(124, 79, 140, 79)
    s += box(142, 54, 76, 50, 'DNS', CYAN, 'ສະໝຸດໂທລະສັບ') + arrow(220, 79, 236, 79)
    s += box(238, 54, 110, 50, '192.0.2.10', GREEN, 'IP Address')
    s += label(180, 134, 'ຄົນຈື່ຊື່ · ຄອມພິວເຕີໃຊ້ IP')
    return s


def email():
    s = title('ອີເມວ (Email)')
    s += box(12, 54, 90, 50, 'ຜູ້ສົ່ງ', CYAN, 'me@example.com') + arrow(104, 79, 124, 79)
    s += box(126, 54, 108, 50, 'MAIL SERVER', GOLD, 'ຮັບ ແລະ ສົ່ງຕໍ່') + arrow(236, 79, 256, 79)
    s += box(258, 54, 90, 50, 'ຜູ້ຮັບ', GREEN, 'you@example.com')
    s += label(180, 134, 'ຢ່າຕອບອີເມວທີ່ຂໍລະຫັດຜ່ານ', '#fca5a5')
    return s


def cloud():
    s = title('Upload · Download · Cloud')
    s += box(20, 56, 90, 44, 'ເຄື່ອງເຮົາ', CYAN)
    s += box(250, 56, 90, 44, 'CLOUD', GREEN, 'ເກັບໃນອິນເຕີເນັດ')
    s += arrow(112, 66, 248, 66) + label(180, 60, 'Upload ↑', GOLD, 10)
    s += arrow(248, 90, 112, 90) + label(180, 108, 'Download ↓', VIOLET, 10)
    s += label(180, 138, 'Backup = ສຳຮອງໄວ້ອີກບ່ອນ')
    return s


DIAGRAMS = {
    'ch2-p4-network-devices': network_devices,
    'ch2-p5-topology': topology,
    'ch2-p6-wifi': wifi,
    'ch2-p7-web': web,
    'ch2-p8-dns': dns,
    'ch2-p9-email': email,
    'ch2-p10-cloud': cloud,
}


def main():
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}
    for name, build in DIAGRAMS.items():
        relative = 'assets/books/%s.svg' % name
        open(os.path.join(ROOT, 'public', relative), 'w', encoding='utf-8', newline='\n').write(HEAD + build() + '</svg>\n')
        entry = {
            'path': relative,
            'category': 'book-diagram',
            'format': 'SVG',
            'viewBox': '0 0 360 156',
            'source': 'Original procedural vector diagram (tools/art/build_ch2_diagrams.py)',
            'license': 'MIT (Project Original)',
        }
        if relative in by_path:
            by_path[relative].update(entry)
        else:
            manifest['assets'].append(entry)

    newline = '\r\n' if '\r\n' in open(MANIFEST, encoding='utf-8', newline='').read() else '\n'
    open(MANIFEST, 'w', encoding='utf-8', newline='').write(json.dumps(manifest, ensure_ascii=False, indent=2).replace('\n', newline) + newline)
    print('wrote', len(DIAGRAMS), 'diagrams')


if __name__ == '__main__':
    main()
