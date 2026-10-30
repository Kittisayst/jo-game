"""Draws the Textbook diagrams for the 10 pages of book-ch3 (Operating Systems, lessons 21-1 to 30-1).

    python tools/art/build_ch3_diagrams.py

Writes public/assets/books/ch3-p1-*.svg ... ch3-p10-*.svg in the same look as the other diagrams (it reuses the
helpers of build_ch2_diagrams.py) and adds them to docs/asset-manifest.json. Simple placeholder diagrams.
"""

import json
import os

from build_ch2_diagrams import (CYAN, GOLD, GREEN, HEAD, MANIFEST, ROOT, VIOLET, arrow, box, label, line,
                                title)

BOOKS = os.path.join(ROOT, 'public', 'assets', 'books')
RED = '#f87171'


def os_role():
    s = title('OS ເປັນຕົວກາງ')
    s += box(12, 52, 96, 50, 'ໂປຣແກຣມ', CYAN, 'ເກມ · Word') + arrow(110, 77, 126, 77, both=True)
    s += box(128, 40, 104, 74, 'OS', GOLD, 'CPU · RAM · ໄຟລ໌') + arrow(234, 77, 250, 77, both=True)
    s += box(252, 52, 96, 50, 'ຮາດແວ', GREEN, 'ຈໍ · ເມົ້າ · ດິດ')
    s += label(180, 134, 'OS ຈັດການຊັບພະຍາກອນໃຫ້ທຸກໂປຣແກຣມ')
    return s


def os_types():
    s = title('ປະເພດຂອງ OS')
    s += box(12, 48, 104, 54, 'ຄອມພິວເຕີ', CYAN, 'Windows · macOS · Linux')
    s += box(128, 48, 104, 54, 'ໂທລະສັບ', GREEN, 'Android · iOS')
    s += box(244, 48, 104, 54, 'ເຊີບເວີ', VIOLET, 'Linux · Win Server')
    s += label(180, 130, 'Linux = Open Source (ເບິ່ງ ແລະ ແກ້ໂຄ້ດໄດ້)')
    return s


def gui_cli():
    s = title('GUI ແລະ CLI')
    s += '  <rect x="14" y="36" width="156" height="84" rx="6" fill="#1e293b" stroke="%s" stroke-width="2"/>\n' % CYAN
    s += label(92, 54, 'GUI', CYAN, 11)
    for x in (30, 70, 110):
        s += '  <rect x="%d" y="66" width="30" height="24" rx="4" fill="#0f172a" stroke="%s" stroke-width="1.5"/>\n' % (x, GOLD)
    s += label(92, 108, 'ໄອຄອນ · ເມນູ · ເມົ້າ')
    s += '  <rect x="190" y="36" width="156" height="84" rx="6" fill="#020617" stroke="%s" stroke-width="2"/>\n' % GREEN
    s += label(268, 54, 'CLI', GREEN, 11)
    s += '  <text x="202" y="76" fill="%s" font-family="monospace" font-size="11">$ cd Documents</text>\n' % GREEN
    s += '  <text x="202" y="92" fill="%s" font-family="monospace" font-size="11">$ ls</text>\n' % GREEN
    s += label(268, 108, 'ພິມຄຳສັ່ງເປັນຕົວໜັງສື')
    return s


def kernel():
    s = title('Kernel ຢູ່ແກນກາງ')
    s += '  <circle cx="180" cy="86" r="62" fill="#1e293b" stroke="%s" stroke-width="2"/>\n' % CYAN
    s += '  <circle cx="180" cy="86" r="34" fill="#0f172a" stroke="%s" stroke-width="2"/>\n' % GOLD
    s += label(180, 90, 'Kernel', GOLD, 11)
    s += label(180, 52, 'User space', CYAN, 9)
    s += label(180, 150, 'ໂປຣແກຣມ → System Call → Kernel → ຮາດແວ')
    s += box(8, 66, 62, 40, 'ແອັບ', GREEN)
    s += arrow(72, 86, 112, 86)
    s += box(290, 66, 62, 40, 'ຮາດແວ', VIOLET)
    s += arrow(248, 86, 288, 86)
    return s


def process():
    s = title('Process ແລະ Thread')
    s += box(14, 40, 150, 76, 'Process', CYAN, 'ໂປຣແກຣມທີ່ກຳລັງແລ່ນ')
    for x in (36, 76, 116):
        s += '  <rect x="%d" y="86" width="30" height="20" rx="4" fill="#0f172a" stroke="%s" stroke-width="1.5"/>\n' % (x, GREEN)
    s += label(90, 100, 'Thread', GREEN, 8)
    s += box(196, 40, 150, 76, 'Task Manager', GOLD, 'ເບິ່ງ Process ທັງໝົດ')
    s += '  <rect x="222" y="86" width="98" height="20" rx="4" fill="#7f1d1d" stroke="%s" stroke-width="1.5"/>\n' % RED
    s += label(271, 100, 'End Task', '#fecaca', 9)
    s += label(180, 138, 'ປິດໂປຣແກຣມທີ່ຄ້າງດ້ວຍ End Task')
    return s


def multitasking():
    s = title('ແບ່ງເວລາ CPU')
    s += box(150, 34, 60, 34, 'CPU', GOLD)
    colors = [CYAN, GREEN, VIOLET]
    for i, c in enumerate(colors):
        x = 24 + i * 112
        s += box(x, 96, 92, 34, 'ໂປຣແກຣມ %d' % (i + 1), c)
        s += arrow(180, 70, x + 46, 94, both=True)
    s += label(180, 150, 'Scheduler ສະຫຼັບໄປມາໄວຫຼາຍ → ເບິ່ງຄືແລ່ນພ້ອມກັນ', '#cbd5e1', 8.5)
    return s


def memory():
    s = title('RAM ແລະ Virtual Memory')
    s += box(14, 46, 130, 54, 'RAM', GREEN, 'ໄວ · ຊົ່ວຄາວ')
    s += arrow(146, 73, 210, 73, both=True) + label(178, 66, 'ບໍ່ພໍ!', RED, 9)
    s += box(212, 46, 134, 54, 'Virtual (Swap)', GOLD, 'ໃນດິດ · ຊ້າກວ່າ')
    s += label(180, 126, 'RAM ເຕັມ → OS ຢືມພື້ນທີ່ໃນດິດ')
    return s


def filesystem():
    s = title('ລະບົບໄຟລ໌ແບບຕົ້ນໄມ້')
    s += box(142, 30, 76, 26, 'C:', GOLD)
    s += line(180, 56, 180, 66, CYAN) + line(70, 66, 290, 66, CYAN)
    for x, name in ((30, 'Documents'), (142, 'Pictures'), (254, 'Games')):
        s += line(x + 38, 66, x + 38, 76, CYAN) + box(x, 76, 76, 26, name, GREEN)
    s += label(180, 124, 'NTFS · ext4 · APFS · ໄຟລ໌ມີຊື່ ນາມສະກຸນ ແລະ ສິດ', '#cbd5e1', 8.5)
    return s


def driver():
    s = title('Driver ແປຄຳສັ່ງ')
    s += box(8, 54, 88, 50, 'OS', GOLD) + arrow(98, 79, 124, 79)
    s += box(126, 54, 108, 50, 'Driver', CYAN, 'ຕົວແປຄຳສັ່ງ') + arrow(236, 79, 262, 79)
    s += box(264, 54, 88, 50, 'ເຄື່ອງພິມ', GREEN)
    s += label(180, 130, 'ບໍ່ມີ Driver ທີ່ຖືກຕ້ອງ → ໃຊ້ອຸປະກອນບໍ່ໄດ້', RED, 9)
    return s


def boot():
    s = title('ລຳດັບເປີດເຄື່ອງ (Boot)')
    s += box(8, 52, 78, 50, 'ເປີດໄຟ', GOLD) + arrow(88, 77, 100, 77)
    s += box(102, 52, 82, 50, 'BIOS/UEFI', CYAN, 'ກວດຮາດແວ') + arrow(186, 77, 198, 77)
    s += box(200, 52, 76, 50, 'Bootloader', VIOLET, 'ຫາ OS') + arrow(278, 77, 290, 77)
    s += box(292, 52, 62, 50, 'Kernel', GREEN, 'ລັອກອິນ')
    s += label(180, 130, 'Administrator = ສິດເຕັມ · ຜູ້ໃຊ້ທົ່ວໄປ = ສິດຈຳກັດ')
    return s


DIAGRAMS = {
    'ch3-p1-os-role': os_role,
    'ch3-p2-os-types': os_types,
    'ch3-p3-gui-cli': gui_cli,
    'ch3-p4-kernel': kernel,
    'ch3-p5-process': process,
    'ch3-p6-multitasking': multitasking,
    'ch3-p7-memory': memory,
    'ch3-p8-filesystem': filesystem,
    'ch3-p9-driver': driver,
    'ch3-p10-boot': boot,
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
            'source': 'Original procedural vector diagram (tools/art/build_ch3_diagrams.py)',
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
