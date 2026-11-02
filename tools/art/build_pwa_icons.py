"""Builds the app icons of the installable (PWA) game from the 64x64 pixel-art crest.

    python tools/art/build_pwa_icons.py

Reads public/assets/ui/logo_crest.png and writes into public/icons/: icon-192.png, icon-512.png,
icon-maskable-512.png (the crest inside the 80% safe zone, for round and squircle masks) and apple-touch-icon.png
(180x180, iOS does not use transparency). The crest is enlarged with nearest-neighbour so the pixels stay sharp, on
the dark colour of the title screen.
"""

import os

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SOURCE = os.path.join(ROOT, 'public', 'assets', 'ui', 'logo_crest.png')
OUT = os.path.join(ROOT, 'public', 'icons')

BACKGROUND = (11, 7, 32, 255)  # #0b0720, the Title scene background


def icon(crest: Image.Image, size: int, fill: float) -> Image.Image:
    """The crest scaled by a whole number of pixels to about `fill` of the icon, centred on the background."""
    scale = max(1, int(size * fill) // crest.width)
    scaled = crest.resize((crest.width * scale, crest.height * scale), Image.NEAREST)
    canvas = Image.new('RGBA', (size, size), BACKGROUND)
    canvas.alpha_composite(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2))
    return canvas


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    crest = Image.open(SOURCE).convert('RGBA')
    icon(crest, 192, 0.86).save(os.path.join(OUT, 'icon-192.png'))
    icon(crest, 512, 0.86).save(os.path.join(OUT, 'icon-512.png'))
    icon(crest, 512, 0.62).save(os.path.join(OUT, 'icon-maskable-512.png'))
    icon(crest, 180, 0.80).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))
    print('wrote', ', '.join(sorted(os.listdir(OUT))))


if __name__ == '__main__':
    main()
