"""Draws the Sapling frames of the small plants, the fiber grass node, and the three Realm 1 Seed icons.

    python tools/art/build_plants_and_seeds.py

- public/assets/environment/node_herb.png: keeps its first two 48x48 frames (grown, cut) and gets a third (Sapling).
- public/assets/environment/node_fiber_grass.png: new 3-frame sheet (grown, cut, Sapling).
- public/assets/items/{herb-seed,fiber-seed,oak-sapling}.png: 32x32 icons.

Updates docs/asset-manifest.json. Flat placeholder art until real art replaces it.
"""

import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ENV = os.path.join(ROOT, 'public', 'assets', 'environment')
ITEMS = os.path.join(ROOT, 'public', 'assets', 'items')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

OUTLINE = (6, 40, 30, 255)
GREEN = (34, 197, 94, 255)
GREEN_DARK = (21, 128, 61, 255)
GREEN_LIGHT = (134, 239, 172, 255)
STRAW = (217, 179, 78, 255)
STRAW_DARK = (161, 122, 38, 255)
SOIL = (120, 80, 50, 255)
SEED = (120, 72, 36, 255)
SEED_LIGHT = (190, 130, 70, 255)


def sapling_frame():
    """A tiny sprout: two leaves on a short stem in a mound of soil, at the bottom of a 48x48 cell."""
    image = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.ellipse([14, 38, 34, 47], fill=SOIL, outline=OUTLINE)
    d.rectangle([23, 28, 25, 40], fill=GREEN_DARK)
    d.ellipse([12, 22, 24, 31], fill=GREEN, outline=OUTLINE)
    d.ellipse([25, 19, 38, 29], fill=GREEN_LIGHT, outline=OUTLINE)
    return image


def grass_frame(tall=True):
    image = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    blades = [(10, 40, 6), (16, 40, 14), (22, 40, 18), (28, 40, 16), (34, 40, 11), (39, 40, 5)]
    for x, bottom, height in blades:
        top = bottom - (height if tall else 3)
        d.rectangle([x, top, x + 3, bottom], fill=STRAW if tall else STRAW_DARK, outline=STRAW_DARK)
    if tall:
        d.rectangle([12, 18, 36, 22], fill=STRAW, outline=STRAW_DARK)
    d.rectangle([8, 40, 42, 44], fill=SOIL)
    return image


def seed_icon(color, light):
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.polygon([(8, 14), (24, 14), (26, 27), (6, 27)], fill=(168, 124, 78, 255), outline=OUTLINE)  # pouch
    d.rectangle([9, 11, 23, 15], fill=(120, 84, 48, 255), outline=OUTLINE)
    d.ellipse([12, 18, 19, 25], fill=color, outline=OUTLINE)
    d.ellipse([17, 20, 23, 26], fill=light, outline=OUTLINE)
    return image


def sapling_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.ellipse([8, 22, 24, 30], fill=SOIL, outline=OUTLINE)
    d.rectangle([15, 12, 17, 24], fill=(101, 67, 33, 255))
    d.ellipse([6, 4, 18, 16], fill=GREEN, outline=OUTLINE)
    d.ellipse([14, 2, 27, 14], fill=GREEN_LIGHT, outline=OUTLINE)
    return image


def sheet(frames):
    image = Image.new('RGBA', (48 * len(frames), 48), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        image.alpha_composite(frame, (i * 48, 0))
    return image


def entry_for(image, path, relative, category):
    pixels = list(image.getdata())
    return {
        'path': relative,
        'category': category,
        'format': 'PNG',
        'mode': 'RGBA',
        'width': image.width,
        'height': image.height,
        'hasAlpha': True,
        'transparentPixels': sum(1 for p in pixels if p[3] == 0),
        'colorCount': len(set(p for p in pixels if p[3] != 0)),
        'bytes': os.path.getsize(path),
        'source': 'Original placeholder pixel art (tools/art/build_plants_and_seeds.py)',
        'license': 'MIT (Project Original)',
    }


def main():
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}
    written = []

    # herb: keep the existing grown and cut frames, add the Sapling
    herb_path = os.path.join(ENV, 'node_herb.png')
    herb = Image.open(herb_path).convert('RGBA')
    herb_sheet = sheet([herb.crop((0, 0, 48, 48)), herb.crop((48, 0, 96, 48)), sapling_frame()])
    herb_sheet.save(herb_path)
    written.append((herb_sheet, herb_path, 'assets/environment/node_herb.png', 'environment'))

    grass_path = os.path.join(ENV, 'node_fiber_grass.png')
    grass_sheet = sheet([grass_frame(True), grass_frame(False), sapling_frame()])
    grass_sheet.save(grass_path)
    written.append((grass_sheet, grass_path, 'assets/environment/node_fiber_grass.png', 'environment'))

    icons = {
        'herb-seed': seed_icon((34, 197, 94, 255), (134, 239, 172, 255)),
        'fiber-seed': seed_icon((217, 179, 78, 255), (253, 230, 138, 255)),
        'oak-sapling': sapling_icon(),
    }
    for name, image in icons.items():
        path = os.path.join(ITEMS, name + '.png')
        image.save(path)
        written.append((image, path, 'assets/items/%s.png' % name, 'items'))

    for image, path, relative, category in written:
        entry = entry_for(image, path, relative, category)
        if relative in by_path:
            by_path[relative].update(entry)
        else:
            manifest['assets'].append(entry)

    newline = '\r\n' if '\r\n' in open(MANIFEST, encoding='utf-8', newline='').read() else '\n'
    open(MANIFEST, 'w', encoding='utf-8', newline='').write(json.dumps(manifest, ensure_ascii=False, indent=2).replace('\n', newline) + newline)
    print('wrote', len(written), 'images')


if __name__ == '__main__':
    main()
