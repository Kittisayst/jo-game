"""Draws the smith who works at the Workshop and the Forge while something is being made.

    python tools/art/build_smith.py

Writes public/assets/characters/npc_smith.png: 8 frames of 48x48 (384x48).
- frames 0-5: hammering (raise, top, swing, strike on the anvil with sparks, rebound), looped
- frames 6-7: cheering with the hammer up (the job is done)
The smith stands on the left of each frame and the anvil on the right. Flat placeholder art; updates
docs/asset-manifest.json.
"""

import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'public', 'assets', 'characters', 'npc_smith.png')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

OUTLINE = (15, 23, 42, 255)
SKIN = (240, 190, 150, 255)
HAIR = (120, 53, 15, 255)
SHIRT = (148, 163, 184, 255)
APRON = (234, 88, 12, 255)
APRON_DARK = (154, 52, 18, 255)
PANTS = (71, 85, 105, 255)
BOOT = (30, 41, 59, 255)
HANDLE = (146, 92, 44, 255)
IRON = (203, 213, 225, 255)
IRON_DARK = (100, 116, 139, 255)
STUMP = (120, 72, 34, 255)
SPARK = (253, 224, 71, 255)
SPARK_HOT = (255, 255, 255, 255)
HEAT = (251, 146, 60, 255)

# Hand position and whether the hammer head is up or down, per frame
HAMMER = [
    ((27, 21), 'up'),
    ((28, 15), 'up'),
    ((29, 12), 'up'),
    ((31, 22), 'fwd'),
    ((32, 29), 'strike'),
    ((30, 24), 'fwd'),
]
CHEER = [((27, 11), 'up'), ((28, 9), 'up')]


def frame(hand, mode, cheer=False, bob=0):
    image = Image.new('RGBA', (48, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(image)

    # Anvil on a stump
    d.rectangle([34, 41, 44, 47], fill=STUMP, outline=OUTLINE)
    d.polygon([(32, 33), (46, 33), (44, 36), (40, 37), (41, 40), (45, 41), (33, 41), (37, 40), (38, 37), (34, 36)], fill=IRON_DARK, outline=OUTLINE)
    d.rectangle([33, 32, 45, 34], fill=IRON, outline=OUTLINE)

    top = 20 + bob
    # Legs and boots
    d.rectangle([14, top + 16, 17, 44], fill=PANTS, outline=OUTLINE)
    d.rectangle([19, top + 16, 22, 44], fill=PANTS, outline=OUTLINE)
    d.rectangle([13, 44, 17, 46], fill=BOOT, outline=OUTLINE)
    d.rectangle([19, 44, 23, 46], fill=BOOT, outline=OUTLINE)
    # Body and apron
    d.rectangle([12, top, 24, top + 17], fill=SHIRT, outline=OUTLINE)
    d.rectangle([14, top + 4, 22, top + 17], fill=APRON, outline=OUTLINE)
    d.rectangle([14, top + 12, 22, top + 17], fill=APRON_DARK)
    # Head, hair and a headband
    d.ellipse([12, top - 14, 24, top - 2], fill=SKIN, outline=OUTLINE)
    d.rectangle([12, top - 14, 24, top - 10], fill=HAIR, outline=OUTLINE)
    d.rectangle([12, top - 10, 24, top - 9], fill=(220, 38, 38, 255))
    d.point([(19, top - 6), (22, top - 6)], fill=OUTLINE)
    # The other arm rests at the side (or waves when cheering)
    if cheer:
        d.line([(13, top + 2), (9, top - 8)], fill=SKIN, width=3)
    else:
        d.line([(13, top + 3), (11, top + 12)], fill=SKIN, width=3)
    # The hammer arm: shoulder to hand, then the hammer
    d.line([(23, top + 3), hand], fill=SKIN, width=3)
    hx, hy = hand
    if mode == 'up':
        d.line([(hx, hy), (hx + 1, hy - 8)], fill=HANDLE, width=2)
        d.rectangle([hx - 3, hy - 13, hx + 5, hy - 8], fill=IRON, outline=OUTLINE)
    elif mode == 'fwd':
        d.line([(hx, hy), (hx + 7, hy - 3)], fill=HANDLE, width=2)
        d.rectangle([hx + 6, hy - 7, hx + 11, hy + 1], fill=IRON, outline=OUTLINE)
    else:
        d.line([(hx, hy), (hx + 6, hy + 1)], fill=HANDLE, width=2)
        d.rectangle([hx + 4, hy - 3, hx + 9, hy + 3], fill=IRON, outline=OUTLINE)
        # Sparks fly off the hot iron
        for x, y, c in [(38, 27, SPARK), (41, 24, SPARK_HOT), (44, 28, SPARK), (36, 23, SPARK), (42, 30, SPARK_HOT)]:
            d.point([(x, y), (x + 1, y)], fill=c)
        d.rectangle([37, 31, 41, 32], fill=HEAT)
    return image


def main():
    frames = [frame(h, m) for h, m in HAMMER]
    frames += [frame(h, m, cheer=True, bob=-1 if i else 0) for i, (h, m) in enumerate(CHEER)]
    sheet = Image.new('RGBA', (48 * len(frames), 48), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (i * 48, 0))
    sheet.save(OUT)

    pixels = list(sheet.getdata())
    entry = {
        'path': 'assets/characters/npc_smith.png',
        'category': 'characters',
        'format': 'PNG',
        'mode': 'RGBA',
        'width': sheet.width,
        'height': sheet.height,
        'hasAlpha': True,
        'transparentPixels': sum(1 for p in pixels if p[3] == 0),
        'colorCount': len(set(p for p in pixels if p[3] != 0)),
        'bytes': os.path.getsize(OUT),
        'source': 'Original placeholder pixel art (tools/art/build_smith.py)',
        'license': 'MIT (Project Original)',
    }
    manifest = json.load(open(MANIFEST, encoding='utf-8'))
    by_path = {a['path']: a for a in manifest['assets']}
    if entry['path'] in by_path:
        by_path[entry['path']].update(entry)
    else:
        manifest['assets'].append(entry)
    newline = '\r\n' if '\r\n' in open(MANIFEST, encoding='utf-8', newline='').read() else '\n'
    open(MANIFEST, 'w', encoding='utf-8', newline='').write(json.dumps(manifest, ensure_ascii=False, indent=2).replace('\n', newline) + newline)
    print('wrote', OUT, sheet.size)


if __name__ == '__main__':
    main()
