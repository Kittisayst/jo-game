"""Draws the placeholder art of Realm 2 (Crystal Cave): three Resource nodes and three Material icons.

    python tools/art/build_realm2_art.py

- public/assets/environment/node_crystal_vein.png: 128x64, two 64x64 frames (whole, mined).
- public/assets/environment/node_blue_ore.png: 128x64, two 64x64 frames (whole, mined).
- public/assets/environment/node_cave_mushroom.png: 144x48, three 48x48 frames (grown, cut, Sapling).
- public/assets/items/{blue-ore,cave-mushroom,mushroom-spore}.png: 32x32 icons.
- public/assets/items/{axe-t2,pickaxe-t2,hammer-t2,blue-sword,blue-helmet,blue-chestplate,blue-boots}.png: the
  Realm 1 icon of the same kind re-coloured blue (placeholder until real art).

Updates docs/asset-manifest.json. Flat placeholder art until real art replaces it.
"""

import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ENV = os.path.join(ROOT, 'public', 'assets', 'environment')
ITEMS = os.path.join(ROOT, 'public', 'assets', 'items')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

OUTLINE = (15, 23, 42, 255)
ROCK = (71, 85, 105, 255)
ROCK_DARK = (51, 65, 85, 255)
CRYSTAL = (96, 165, 250, 255)
CRYSTAL_LIGHT = (191, 219, 254, 255)
CRYSTAL_DARK = (37, 99, 235, 255)
ORE = (59, 130, 246, 255)
ORE_LIGHT = (147, 197, 253, 255)
CAP = (167, 139, 250, 255)
CAP_DARK = (109, 40, 217, 255)
CAP_LIGHT = (221, 214, 254, 255)
STEM = (231, 229, 228, 255)
SOIL = (68, 64, 60, 255)


def rock_base(d, width=64):
    d.polygon([(6, 60), (12, 34), (30, 24), (50, 30), (58, 60)], fill=ROCK, outline=OUTLINE)
    d.polygon([(14, 60), (20, 42), (34, 36), (44, 44), (50, 60)], fill=ROCK_DARK)


def crystal_vein_frame(mined):
    image = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    rock_base(d)
    if mined:
        d.polygon([(26, 40), (32, 34), (38, 40), (36, 46), (28, 46)], fill=CRYSTAL_DARK, outline=OUTLINE)
        return image
    for points, fill in (
        ([(16, 44), (22, 14), (28, 44)], CRYSTAL),
        ([(28, 46), (36, 6), (44, 46)], CRYSTAL_LIGHT),
        ([(40, 46), (48, 20), (54, 46)], CRYSTAL),
    ):
        d.polygon(points, fill=fill, outline=OUTLINE)
    d.line([(36, 12), (36, 40)], fill=CRYSTAL, width=2)
    d.polygon([(22, 18), (24, 28), (20, 36)], fill=CRYSTAL_LIGHT)
    return image


def blue_ore_frame(mined):
    image = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    rock_base(d)
    nuggets = [(20, 40, 30, 50), (34, 32, 46, 44), (30, 46, 42, 56)] if not mined else [(30, 48, 36, 54)]
    for box in nuggets:
        d.ellipse(box, fill=ORE, outline=OUTLINE)
        d.ellipse((box[0] + 2, box[1] + 2, box[0] + 6, box[1] + 6), fill=ORE_LIGHT)
    return image


def mushroom_frame(kind):
    image = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.ellipse([8, 40, 40, 47], fill=SOIL)
    if kind == 'sapling':
        d.rectangle([22, 32, 25, 42], fill=STEM, outline=OUTLINE)
        d.ellipse([17, 26, 31, 35], fill=CAP, outline=OUTLINE)
        return image
    heights = [(12, 40, 20), (24, 40, 30), (35, 40, 16)] if kind == 'grown' else [(14, 40, 8), (26, 40, 8), (36, 40, 7)]
    for x, bottom, height in heights:
        top = bottom - height
        d.rectangle([x, top + (6 if kind == 'grown' else 0), x + 3, bottom], fill=STEM, outline=OUTLINE)
        if kind == 'grown':
            d.ellipse([x - 7, top - 2, x + 10, top + 10], fill=CAP, outline=OUTLINE)
            d.ellipse([x - 3, top, x + 1, top + 4], fill=CAP_LIGHT)
            d.ellipse([x + 3, top + 2, x + 6, top + 5], fill=CAP_DARK)
    return image


def sheet(frames, size):
    image = Image.new('RGBA', (size * len(frames), size), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        image.alpha_composite(frame, (i * size, 0))
    return image


def ore_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.polygon([(6, 26), (9, 12), (18, 6), (27, 13), (26, 26)], fill=ROCK, outline=OUTLINE)
    for box in ((10, 14, 17, 22), (17, 11, 24, 19), (15, 19, 23, 26)):
        d.ellipse(box, fill=ORE, outline=OUTLINE)
        d.ellipse((box[0] + 1, box[1] + 1, box[0] + 3, box[1] + 3), fill=ORE_LIGHT)
    return image


def mushroom_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.rectangle([13, 16, 19, 28], fill=STEM, outline=OUTLINE)
    d.ellipse([5, 6, 27, 20], fill=CAP, outline=OUTLINE)
    d.ellipse([10, 9, 14, 13], fill=CAP_LIGHT)
    d.ellipse([19, 12, 23, 16], fill=CAP_DARK)
    return image


def spore_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.polygon([(8, 14), (24, 14), (26, 27), (6, 27)], fill=(168, 124, 78, 255), outline=OUTLINE)
    d.rectangle([9, 11, 23, 15], fill=(120, 84, 48, 255), outline=OUTLINE)
    d.ellipse([12, 18, 19, 25], fill=CAP, outline=OUTLINE)
    d.ellipse([17, 20, 23, 26], fill=CAP_LIGHT, outline=OUTLINE)
    return image


GEAR = {
    'axe-t2': 'axe-t1', 'pickaxe-t2': 'pickaxe-t1', 'hammer-t2': 'hammer-t1', 'blue-sword': 'iron-sword',
    'blue-helmet': 'iron-helmet', 'blue-chestplate': 'iron-chestplate', 'blue-boots': 'iron-boots',
}


def blue_tint(source):
    """The same icon with its grey metal turned into the blue of Realm 2."""
    image = Image.open(os.path.join(ITEMS, source + '.png')).convert('RGBA')
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            lum = (r * 299 + g * 587 + b * 114) / 1000
            pixels[x, y] = (min(255, int(lum * 0.55 + 20)), min(255, int(lum * 0.8 + 40)), min(255, int(lum * 1.1 + 70)), a)
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
        'source': 'Original placeholder pixel art (tools/art/build_realm2_art.py)',
        'license': 'MIT (Project Original)',
    }


def main():
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}
    written = []

    nodes = {
        'node_crystal_vein': sheet([crystal_vein_frame(False), crystal_vein_frame(True)], 64),
        'node_blue_ore': sheet([blue_ore_frame(False), blue_ore_frame(True)], 64),
        'node_cave_mushroom': sheet([mushroom_frame('grown'), mushroom_frame('cut'), mushroom_frame('sapling')], 48),
    }
    for name, image in nodes.items():
        path = os.path.join(ENV, name + '.png')
        image.save(path)
        written.append((image, path, 'assets/environment/%s.png' % name, 'environment'))

    icons = {'blue-ore': ore_icon(), 'cave-mushroom': mushroom_icon(), 'mushroom-spore': spore_icon()}
    for name, source in GEAR.items():
        icons[name] = blue_tint(source)
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
