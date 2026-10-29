"""Draws the six held-item sprites (public/assets/held/*.png) pixel by pixel.

Spec (docs/plans/2026-10-30-held-items.md): 32x32 RGBA, pointing straight up, grip at (16, 26),
Cyber-Village 32 palette, 1px #0f172a outline, top-left light, no semi-transparent pixels.
Colours follow the matching 32x32 UI icons so both read as the same object.

Run from the repo root:  python tools/art/draw_held_items.py
"""
from pathlib import Path
from PIL import Image

SIZE = 32
OUTLINE = (0x0F, 0x17, 0x2A, 255)
OUT = Path('public/assets/held')


def hexc(value: str):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


class Canvas:
    def __init__(self):
        self.px = {}

    def rect(self, x0, y0, x1, y1, color):
        """Fills columns x0..x1 and rows y0..y1 (inclusive)."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.px[(x, y)] = hexc(color)

    def dot(self, x, y, color):
        self.px[(x, y)] = hexc(color)

    def save(self, name):
        img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
        filled = set(self.px)
        # 1px outline around every filled pixel (8-neighbourhood), drawn under the fill
        for (x, y) in filled:
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (x + dx, y + dy)
                    if n not in filled and 0 <= n[0] < SIZE and 0 <= n[1] < SIZE:
                        img.putpixel(n, OUTLINE)
        for (x, y), color in self.px.items():
            img.putpixel((x, y), color)
        OUT.mkdir(parents=True, exist_ok=True)
        img.save(OUT / f'{name}.png')


def handle(c, y0, y1, dark, light):
    """Two-pixel handle on columns 15-16, lit from the left, with wrap bands."""
    c.rect(15, y0, 15, y1, light)
    c.rect(16, y0, 16, y1, dark)
    for y in range(y0 + 1, y1 + 1, 3):
        c.rect(15, y, 16, y, dark)


def sword(name, blade_light, blade_dark, edge, guard, guard_light, grip_dark, grip_light, pommel, gem=None, wide=False):
    c = Canvas()
    left = 14 if wide else 15
    right = 17 if wide else 16
    # tip
    c.dot(15, 2, edge)
    c.rect(15, 3, 16, 3, blade_light)
    # blade, light on the left, dark on the right, bright edge line down the left side
    c.rect(left, 4, right, 19, blade_dark)
    c.rect(left, 4, 15, 19, blade_light)
    c.rect(left, 4, left, 18, edge)
    if wide:
        c.rect(16, 6, 16, 17, blade_light)
    # cross-guard
    c.rect(11, 20, 20, 21, guard)
    c.rect(11, 20, 20, 20, guard_light)
    if gem:
        c.rect(15, 20, 16, 21, gem)
    handle(c, 22, 28, grip_dark, grip_light)
    c.rect(15, 29, 16, 29, pommel)
    c.save(name)


def axe():
    c = Canvas()
    handle(c, 4, 29, '#b45309', '#d97706')
    # head on the facing side: socket, cheek, bright cutting edge
    c.rect(17, 5, 18, 11, '#64748b')
    c.rect(19, 4, 23, 12, '#94a3b8')
    c.rect(19, 4, 23, 4, '#e2e8f0')
    c.rect(24, 3, 24, 13, '#f8fafc')
    c.rect(19, 12, 22, 12, '#64748b')
    c.save('axe-t1')


def pickaxe():
    c = Canvas()
    handle(c, 7, 29, '#9a3412', '#b45309')
    # head: centre socket and two curved arms
    c.rect(13, 3, 18, 6, '#64748b')
    c.rect(13, 3, 18, 3, '#94a3b8')
    c.rect(6, 4, 12, 5, '#94a3b8')
    c.rect(19, 4, 25, 5, '#94a3b8')
    c.rect(6, 4, 12, 4, '#f8fafc')
    c.rect(19, 4, 25, 4, '#e2e8f0')
    c.rect(4, 6, 6, 6, '#94a3b8')
    c.rect(25, 6, 27, 6, '#94a3b8')
    c.dot(4, 7, '#f8fafc')
    c.dot(27, 7, '#f8fafc')
    c.save('pickaxe-t1')


def hammer():
    c = Canvas()
    handle(c, 11, 29, '#b45309', '#d97706')
    c.rect(10, 3, 21, 9, '#64748b')
    c.rect(10, 3, 21, 4, '#94a3b8')
    c.rect(10, 3, 10, 9, '#f8fafc')
    c.rect(14, 3, 17, 9, '#f59e0b')
    c.rect(14, 3, 17, 3, '#fde047')
    c.save('hammer-t1')


if __name__ == '__main__':
    sword('wooden-sword', '#f59e0b', '#d97706', '#fde047', '#78350f', '#9a3412', '#78350f', '#9a3412', '#f59e0b')
    sword('iron-sword', '#e2e8f0', '#94a3b8', '#f8fafc', '#334155', '#94a3b8', '#0369a1', '#0284c7', '#f59e0b')
    sword('crystal-sword', '#a5f3fc', '#a855f7', '#f8fafc', '#6d28d9', '#a855f7', '#3b0764', '#6d28d9', '#38bdf8', gem='#ec4899', wide=True)
    axe()
    pickaxe()
    hammer()
    print('wrote', sorted(p.name for p in OUT.glob('*.png')))
