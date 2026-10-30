"""Draws the placeholder art of the night creatures: three 32x28 walkers (4 frames each) and the Moon Dust icon.

    python tools/art/build_night_creatures.py

- public/assets/characters/{night_wisp,night_shade,night_scarab}.png: 128x28, four 32x28 frames (a slow bob).
- public/assets/items/moon-dust.png: 32x32 icon.

Updates docs/asset-manifest.json. Reuses the helpers of build_realm2_art.py. Flat placeholder art: a glowing
ghost (Realm 1), a dark crystal shade (Realm 2) and a sand scarab (Realm 3), each with bright eyes so it can be
seen in the dark.
"""

import json
import os

from PIL import Image, ImageDraw

from build_realm2_art import ITEMS, MANIFEST, OUTLINE, ROOT, entry_for, sheet

CHARACTERS = os.path.join(ROOT, 'public', 'assets', 'characters')

EYE = (255, 244, 160, 255)
WISP = (167, 139, 250, 255)
WISP_LIGHT = (221, 214, 254, 255)
SHADE = (51, 65, 120, 255)
SHADE_LIGHT = (96, 165, 250, 255)
SCARAB = (146, 98, 44, 255)
SCARAB_LIGHT = (251, 191, 36, 255)
DUST = (196, 181, 253, 255)
DUST_LIGHT = (245, 243, 255, 255)

# Per frame: how many pixels the body is squashed (a slow breathing bob)
BOB = [0, 1, 2, 1]


def wisp_frame(i):
    image = Image.new('RGBA', (32, 28), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    top = 5 + BOB[i]
    # a ghost: round head, a wavy hem
    d.ellipse([5, top, 27, top + 16], fill=WISP, outline=OUTLINE)
    d.rectangle([5, top + 9, 27, 24], fill=WISP, outline=None)
    for x in range(5, 27, 6):
        d.ellipse([x, 21, x + 6, 26 - (BOB[(i + x // 6) % 4])], fill=WISP, outline=OUTLINE)
    d.ellipse([9, top + 3, 15, top + 8], fill=WISP_LIGHT)
    d.ellipse([10, top + 7, 14, top + 11], fill=EYE, outline=OUTLINE)
    d.ellipse([18, top + 7, 22, top + 11], fill=EYE, outline=OUTLINE)
    return image


def shade_frame(i):
    image = Image.new('RGBA', (32, 28), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    top = 8 + BOB[i]
    # a low dark slime with crystal shards on its back
    d.ellipse([3, top, 29, 27], fill=SHADE, outline=OUTLINE)
    for x, h in ((9, 8), (15, 11), (21, 7)):
        d.polygon([(x, top + 3), (x + 3, top + 3 - h), (x + 6, top + 3)], fill=SHADE_LIGHT, outline=OUTLINE)
    d.ellipse([9, top + 6, 14, top + 11], fill=EYE, outline=OUTLINE)
    d.ellipse([18, top + 6, 23, top + 11], fill=EYE, outline=OUTLINE)
    return image


def scarab_frame(i):
    image = Image.new('RGBA', (32, 28), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    top = 10 + BOB[i]
    # a domed shell, a golden stripe, little legs that step
    for k, x in enumerate((6, 12, 18, 24)):
        step = 1 if (i + k) % 2 == 0 else 0
        d.line([(x, 24), (x - 2, 27 - step)], fill=OUTLINE, width=2)
    d.ellipse([3, top, 29, 26], fill=SCARAB, outline=OUTLINE)
    d.line([(16, top + 1), (16, 25)], fill=OUTLINE, width=1)
    d.arc([6, top + 2, 26, 26], 200, 340, fill=SCARAB_LIGHT, width=2)
    d.ellipse([20, top + 5, 25, top + 10], fill=EYE, outline=OUTLINE)
    d.ellipse([7, top + 5, 12, top + 10], fill=EYE, outline=OUTLINE)
    return image


def moon_dust_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    # a little pouch of glittering dust and a crescent
    d.polygon([(9, 14), (23, 14), (26, 28), (6, 28)], fill=(88, 72, 140, 255), outline=OUTLINE)
    d.rectangle([10, 10, 22, 15], fill=(60, 48, 100, 255), outline=OUTLINE)
    d.ellipse([11, 16, 21, 26], fill=DUST, outline=OUTLINE)
    d.ellipse([14, 17, 22, 25], fill=(88, 72, 140, 255))
    for x, y in ((6, 6), (25, 8), (16, 3), (27, 20)):
        d.rectangle([x, y, x + 1, y + 1], fill=DUST_LIGHT)
    return image


def main():
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}
    written = []

    creatures = {
        'night_wisp': wisp_frame,
        'night_shade': shade_frame,
        'night_scarab': scarab_frame,
    }
    for name, draw in creatures.items():
        # sheet() makes square cells; the walkers are 32x28 like the slimes they stand in for
        image = sheet([draw(i) for i in range(4)], 32).crop((0, 0, 128, 28))
        path = os.path.join(CHARACTERS, name + '.png')
        image.save(path)
        written.append((image, path, 'assets/characters/%s.png' % name, 'characters'))

    icon = moon_dust_icon()
    path = os.path.join(ITEMS, 'moon-dust.png')
    icon.save(path)
    written.append((icon, path, 'assets/items/moon-dust.png', 'items'))

    for image, path, relative, category in written:
        entry = entry_for(image, path, relative, category)
        entry['source'] = 'Original placeholder pixel art (tools/art/build_night_creatures.py)'
        if relative in by_path:
            by_path[relative].update(entry)
        else:
            manifest['assets'].append(entry)

    newline = '\r\n' if '\r\n' in open(MANIFEST, encoding='utf-8', newline='').read() else '\n'
    open(MANIFEST, 'w', encoding='utf-8', newline='').write(json.dumps(manifest, ensure_ascii=False, indent=2).replace('\n', newline) + newline)
    print('wrote', len(written), 'images')


if __name__ == '__main__':
    main()
