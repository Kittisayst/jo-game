"""Draws the 32x32 pixel-art icons of the Realm 1 armor pieces and the three effect potions.

    python tools/art/build_armor_potion_icons.py

Writes PNGs into public/assets/items/ and adds (or refreshes) their entries in docs/asset-manifest.json.
Simple flat shapes on purpose: they are placeholders until real art replaces them.
"""

import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'assets', 'items')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

OUTLINE = (30, 41, 59, 255)
IRON = (148, 163, 184, 255)
IRON_LIGHT = (203, 213, 225, 255)
IRON_DARK = (100, 116, 139, 255)
LEATHER = (146, 94, 52, 255)
GLASS = (226, 232, 240, 255)
CORK = (180, 120, 60, 255)


def canvas():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def helmet():
    image, d = canvas()
    d.pieslice([5, 6, 27, 28], 180, 360, fill=IRON, outline=OUTLINE)
    d.rectangle([5, 17, 27, 22], fill=IRON, outline=OUTLINE)
    d.rectangle([9, 17, 23, 20], fill=OUTLINE)  # visor slit
    d.rectangle([14, 6, 17, 16], fill=IRON_LIGHT)  # crest
    d.rectangle([7, 22, 10, 26], fill=IRON_DARK, outline=OUTLINE)
    d.rectangle([22, 22, 25, 26], fill=IRON_DARK, outline=OUTLINE)
    return image


def chestplate():
    image, d = canvas()
    d.polygon([(4, 8), (11, 5), (21, 5), (28, 8), (26, 14), (24, 27), (8, 27), (6, 14)], fill=IRON, outline=OUTLINE)
    d.rectangle([14, 8, 17, 26], fill=IRON_LIGHT)
    d.line([(8, 16), (24, 16)], fill=IRON_DARK, width=2)
    d.rectangle([5, 7, 9, 11], fill=IRON_DARK, outline=OUTLINE)
    d.rectangle([22, 7, 26, 11], fill=IRON_DARK, outline=OUTLINE)
    return image


def boots():
    image, d = canvas()
    for x in (4, 18):
        d.rectangle([x, 6, x + 9, 20], fill=LEATHER, outline=OUTLINE)
        d.rectangle([x, 20, x + 11, 26], fill=IRON, outline=OUTLINE)
        d.rectangle([x, 8, x + 9, 10], fill=IRON_DARK)
    return image


def potion(liquid, glow):
    image, d = canvas()
    d.rectangle([13, 4, 18, 8], fill=CORK, outline=OUTLINE)
    d.rectangle([14, 8, 17, 12], fill=GLASS, outline=OUTLINE)
    d.ellipse([6, 11, 25, 28], fill=GLASS, outline=OUTLINE)
    d.ellipse([8, 15, 23, 27], fill=liquid)
    d.ellipse([10, 17, 14, 21], fill=glow)
    return image


ICONS = {
    'iron-helmet': helmet,
    'iron-chestplate': chestplate,
    'iron-boots': boots,
    'strength-potion': lambda: potion((220, 38, 38, 255), (252, 165, 165, 255)),
    'armor-potion': lambda: potion((59, 130, 246, 255), (191, 219, 254, 255)),
    'speed-potion': lambda: potion((250, 204, 21, 255), (254, 249, 195, 255)),
}


def main():
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}

    for name, draw in ICONS.items():
        path = os.path.join(OUT, name + '.png')
        image = draw()
        image.save(path)

        pixels = list(image.getdata())
        entry = {
            'path': 'assets/items/%s.png' % name,
            'category': 'items',
            'format': 'PNG',
            'mode': 'RGBA',
            'width': 32,
            'height': 32,
            'hasAlpha': True,
            'transparentPixels': sum(1 for p in pixels if p[3] == 0),
            'colorCount': len(set(p for p in pixels if p[3] != 0)),
            'bytes': os.path.getsize(path),
            'source': 'Original placeholder pixel art (tools/art/build_armor_potion_icons.py)',
            'license': 'MIT (Project Original)',
        }
        if entry['path'] in by_path:
            by_path[entry['path']].update(entry)
        else:
            manifest['assets'].append(entry)

    newline = '\r\n' if '\r\n' in open(MANIFEST, encoding='utf-8', newline='').read() else '\n'
    text = json.dumps(manifest, ensure_ascii=False, indent=2).replace('\n', newline) + newline
    open(MANIFEST, 'w', encoding='utf-8', newline='').write(text)
    print('wrote', len(ICONS), 'icons')


if __name__ == '__main__':
    main()
