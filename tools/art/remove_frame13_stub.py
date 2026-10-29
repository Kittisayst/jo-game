"""Removes the small white blade drawn in attack frame 13 of every player skin sheet.

The weapon is now a separate Held item image, so the stub would show a second weapon.
Clears columns 29-31, rows 23-28 of frame 13 and closes the fist's right edge with the outline.
Run from the repo root:  python tools/art/remove_frame13_stub.py
"""
import glob
from PIL import Image

FRAME = 13
OUTLINE = (0x0F, 0x17, 0x2A, 255)

for path in sorted(glob.glob('public/assets/characters/player-skin-*.png')):
    img = Image.open(path).convert('RGBA')
    left = FRAME * 32
    for x in range(29, 32):
        for y in range(23, 29):
            img.putpixel((left + x, y), (0, 0, 0, 0))
    for y in range(23, 29):
        img.putpixel((left + 29, y), OUTLINE)
    img.save(path)
    print('cleaned', path)
