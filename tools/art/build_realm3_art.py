"""Draws the placeholder art of Realm 3 (Desert): two Resource nodes, three Material icons and the copper gear icons.

    python tools/art/build_realm3_art.py

- public/assets/environment/node_copper_vein.png: 128x64, two 64x64 frames (whole, mined).
- public/assets/environment/node_cactus_patch.png: 144x48, three 48x48 frames (grown, cut, Sapling).
- public/assets/items/{copper-ore,cactus-pulp,cactus-seed}.png: 32x32 icons.
- public/assets/items/{axe-t3,pickaxe-t3,hammer-t3,copper-sword,copper-helmet,copper-chestplate,copper-boots}.png:
  the Realm 1 icon of the same kind re-coloured copper (placeholder until real art).

Updates docs/asset-manifest.json. Reuses the helpers of build_realm2_art.py. Flat placeholder art.
"""

import json
import os

from PIL import Image, ImageDraw

from build_realm2_art import ITEMS, ENV, MANIFEST, OUTLINE, entry_for, sheet

SAND = (202, 160, 98, 255)
SAND_DARK = (160, 118, 66, 255)
COPPER = (234, 130, 52, 255)
COPPER_LIGHT = (253, 186, 116, 255)
COPPER_DARK = (154, 78, 28, 255)
CACTUS = (74, 160, 84, 255)
CACTUS_DARK = (38, 107, 52, 255)
CACTUS_LIGHT = (134, 214, 142, 255)
PINK = (244, 114, 182, 255)
SOIL = (120, 84, 50, 255)

GEAR = {
    'axe-t3': 'axe-t1', 'pickaxe-t3': 'pickaxe-t1', 'hammer-t3': 'hammer-t1', 'copper-sword': 'iron-sword',
    'copper-helmet': 'iron-helmet', 'copper-chestplate': 'iron-chestplate', 'copper-boots': 'iron-boots',
}


def desert_rock(d):
    d.polygon([(6, 60), (12, 34), (30, 24), (50, 30), (58, 60)], fill=SAND, outline=OUTLINE)
    d.polygon([(14, 60), (20, 42), (34, 36), (44, 44), (50, 60)], fill=SAND_DARK)


def copper_vein_frame(mined):
    image = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    desert_rock(d)
    nuggets = [(18, 38, 30, 50), (34, 30, 48, 44), (28, 46, 42, 58), (40, 44, 52, 56)] if not mined else [(30, 48, 36, 54)]
    for box in nuggets:
        d.ellipse(box, fill=COPPER, outline=OUTLINE)
        d.ellipse((box[0] + 2, box[1] + 2, box[0] + 6, box[1] + 6), fill=COPPER_LIGHT)
    return image


def cactus_frame(kind):
    image = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.ellipse([8, 40, 40, 47], fill=SOIL)
    if kind == 'sapling':
        d.rectangle([21, 30, 26, 42], fill=CACTUS, outline=OUTLINE)
        d.ellipse([20, 26, 27, 33], fill=PINK, outline=OUTLINE)
        return image
    if kind == 'cut':
        d.rectangle([20, 36, 27, 42], fill=CACTUS_DARK, outline=OUTLINE)
        return image
    d.rectangle([19, 12, 28, 42], fill=CACTUS, outline=OUTLINE)
    d.rectangle([21, 14, 23, 40], fill=CACTUS_LIGHT)
    d.rectangle([8, 22, 19, 28], fill=CACTUS, outline=OUTLINE)
    d.rectangle([8, 14, 14, 28], fill=CACTUS, outline=OUTLINE)
    d.rectangle([28, 18, 39, 24], fill=CACTUS, outline=OUTLINE)
    d.rectangle([34, 10, 40, 24], fill=CACTUS, outline=OUTLINE)
    d.ellipse([20, 8, 27, 15], fill=PINK, outline=OUTLINE)
    return image


def copper_ore_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.polygon([(6, 26), (9, 12), (18, 6), (27, 13), (26, 26)], fill=SAND_DARK, outline=OUTLINE)
    for box in ((10, 14, 17, 22), (17, 11, 24, 19), (15, 19, 23, 26)):
        d.ellipse(box, fill=COPPER, outline=OUTLINE)
        d.ellipse((box[0] + 1, box[1] + 1, box[0] + 3, box[1] + 3), fill=COPPER_LIGHT)
    return image


def cactus_pulp_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.ellipse([6, 8, 26, 28], fill=CACTUS, outline=OUTLINE)
    d.ellipse([10, 12, 16, 18], fill=CACTUS_LIGHT)
    for x, y in ((14, 6), (20, 8), (9, 9)):
        d.line([(x, y), (x, y - 3)], fill=OUTLINE, width=1)
    return image


def cactus_seed_icon():
    image = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)
    d.polygon([(8, 14), (24, 14), (26, 27), (6, 27)], fill=(168, 124, 78, 255), outline=OUTLINE)
    d.rectangle([9, 11, 23, 15], fill=(120, 84, 48, 255), outline=OUTLINE)
    d.rectangle([14, 17, 18, 25], fill=CACTUS, outline=OUTLINE)
    d.ellipse([13, 15, 19, 20], fill=PINK, outline=OUTLINE)
    return image


def copper_tint(source):
    """The same icon with its grey metal turned into copper."""
    image = Image.open(os.path.join(ITEMS, source + '.png')).convert('RGBA')
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            lum = (r * 299 + g * 587 + b * 114) / 1000
            pixels[x, y] = (min(255, int(lum * 0.9 + 70)), min(255, int(lum * 0.6 + 36)), min(255, int(lum * 0.3 + 14)), a)
    return image


def main():
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}
    written = []

    nodes = {
        'node_copper_vein': sheet([copper_vein_frame(False), copper_vein_frame(True)], 64),
        'node_cactus_patch': sheet([cactus_frame('grown'), cactus_frame('cut'), cactus_frame('sapling')], 48),
    }
    for name, image in nodes.items():
        path = os.path.join(ENV, name + '.png')
        image.save(path)
        written.append((image, path, 'assets/environment/%s.png' % name, 'environment'))

    icons = {'copper-ore': copper_ore_icon(), 'cactus-pulp': cactus_pulp_icon(), 'cactus-seed': cactus_seed_icon()}
    for name, source in GEAR.items():
        icons[name] = copper_tint(source)
    for name, image in icons.items():
        path = os.path.join(ITEMS, name + '.png')
        image.save(path)
        written.append((image, path, 'assets/items/%s.png' % name, 'items'))

    for image, path, relative, category in written:
        entry = entry_for(image, path, relative, category)
        entry['source'] = 'Original placeholder pixel art (tools/art/build_realm3_art.py)'
        if relative in by_path:
            by_path[relative].update(entry)
        else:
            manifest['assets'].append(entry)

    newline = '\r\n' if '\r\n' in open(MANIFEST, encoding='utf-8', newline='').read() else '\n'
    open(MANIFEST, 'w', encoding='utf-8', newline='').write(json.dumps(manifest, ensure_ascii=False, indent=2).replace('\n', newline) + newline)
    print('wrote', len(written), 'images')


if __name__ == '__main__':
    main()
