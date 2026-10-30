"""Draws the 32x32 pixel-art icons of the ten Portal shards and ten Portal blocks, one colour per Realm.

    python tools/art/build_portal_icons.py

The colour of each Realm comes from public/data/realms.json. Writes PNGs into public/assets/items/ and adds (or
refreshes) their entries in docs/asset-manifest.json. Flat placeholder art until real art replaces it.
"""

import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'assets', 'items')
REALMS = os.path.join(ROOT, 'public', 'data', 'realms.json')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

OUTLINE = (15, 23, 42, 255)
LIGHT_EDGE = (226, 232, 240, 255)


def hex_to_rgba(value, alpha=255):
    value = value.lstrip('#')
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), alpha)


def shade(color, factor):
    r, g, b, a = color
    return (min(255, int(r * factor)), min(255, int(g * factor)), min(255, int(b * factor)), a)


def shard(color):
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.polygon([(16, 3), (24, 12), (21, 28), (11, 28), (8, 12)], fill=color, outline=OUTLINE)
    d.polygon([(16, 3), (21, 12), (16, 28), (11, 28), (8, 12)], fill=shade(color, 0.8))
    d.polygon([(16, 5), (19, 11), (16, 11)], fill=shade(color, 1.4))
    d.line([(16, 3), (16, 28)], fill=OUTLINE, width=1)
    return image


def block(color):
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.rectangle([5, 6, 26, 27], fill=color, outline=OUTLINE)
    d.rectangle([5, 6, 26, 10], fill=shade(color, 1.3))
    d.rectangle([5, 23, 26, 27], fill=shade(color, 0.7))
    d.rectangle([12, 13, 19, 21], fill=OUTLINE)  # the doorway
    d.rectangle([13, 14, 18, 20], fill=shade(color, 1.5))
    d.rectangle([5, 6, 6, 27], fill=LIGHT_EDGE)
    return image


def main():
    realms = json.load(open(REALMS, encoding='utf-8'))['realms']
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}
    count = 0

    for realm in realms:
        color = hex_to_rgba(realm['color'])
        for item, draw in ((realm['shardItem'], shard), (realm['blockItem'], block)):
            path = os.path.join(OUT, item + '.png')
            image = draw(color)
            image.save(path)

            pixels = list(image.getdata())
            entry = {
                'path': 'assets/items/%s.png' % item,
                'category': 'items',
                'format': 'PNG',
                'mode': 'RGBA',
                'width': 32,
                'height': 32,
                'hasAlpha': True,
                'transparentPixels': sum(1 for p in pixels if p[3] == 0),
                'colorCount': len(set(p for p in pixels if p[3] != 0)),
                'bytes': os.path.getsize(path),
                'source': 'Original placeholder pixel art (tools/art/build_portal_icons.py)',
                'license': 'MIT (Project Original)',
            }
            if entry['path'] in by_path:
                by_path[entry['path']].update(entry)
            else:
                manifest['assets'].append(entry)
            count += 1

    newline = '\r\n' if '\r\n' in open(MANIFEST, encoding='utf-8', newline='').read() else '\n'
    open(MANIFEST, 'w', encoding='utf-8', newline='').write(json.dumps(manifest, ensure_ascii=False, indent=2).replace('\n', newline) + newline)
    print('wrote', count, 'icons')


if __name__ == '__main__':
    main()
