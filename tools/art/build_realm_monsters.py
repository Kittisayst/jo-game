"""Builds pixel-art spritesheets for Realm 2 and Realm 3 monsters:
- public/assets/characters/enemy_crystal_slime.png (128x28, 4 frames of 32x28)
- public/assets/characters/enemy_crystal_golem.png (192x40, 4 frames of 48x40)
- public/assets/characters/enemy_sand_slime.png (128x28, 4 frames of 32x28)
- public/assets/characters/enemy_sand_golem.png (192x40, 4 frames of 48x40)

Usage:
  python tools/art/build_realm_monsters.py
"""

import json
import os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHARACTERS = os.path.join(ROOT, 'public', 'assets', 'characters')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

def hex_to_rgba(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)

def recolor_image(src_path, color_map):
    im = Image.open(src_path).convert('RGBA')
    pixels = im.load()
    w, h = im.size
    rgba_map = {hex_to_rgba(k): hex_to_rgba(v) for k, v in color_map.items()}

    for y in range(h):
        for x in range(w):
            px = pixels[x, y]
            if px in rgba_map:
                pixels[x, y] = rgba_map[px]
    return im

def main():
    os.makedirs(CHARACTERS, exist_ok=True)
    slime_src = os.path.join(CHARACTERS, 'enemy_slime.png')
    golem_src = os.path.join(CHARACTERS, 'enemy_rock_golem.png')

    # 1. Crystal Slime (Realm 2)
    crystal_slime_map = {
        '#14532d': '#1e3a8a',
        '#15803d': '#1d4ed8',
        '#22c55e': '#2563eb',
        '#86efac': '#93c5fd',
        '#fde047': '#67e8f9',
    }
    c_slime = recolor_image(slime_src, crystal_slime_map)
    c_slime_path = os.path.join(CHARACTERS, 'enemy_crystal_slime.png')
    c_slime.save(c_slime_path)
    print('Wrote', os.path.relpath(c_slime_path, ROOT), c_slime.size)

    # 2. Crystal Golem (Realm 2)
    crystal_golem_map = {
        '#1e293b': '#0f172a',
        '#334155': '#1e3a8a',
        '#64748b': '#2563eb',
        '#94a3b8': '#60a5fa',
        '#e2e8f0': '#bae6fd',
        '#d97706': '#0284c7',
        '#f59e0b': '#38bdf8',
        '#fde047': '#a5f3fc',
    }
    c_golem = recolor_image(golem_src, crystal_golem_map)
    c_golem_path = os.path.join(CHARACTERS, 'enemy_crystal_golem.png')
    c_golem.save(c_golem_path)
    print('Wrote', os.path.relpath(c_golem_path, ROOT), c_golem.size)

    # 3. Sand Slime (Realm 3)
    sand_slime_map = {
        '#14532d': '#78350f',
        '#15803d': '#9a3412',
        '#22c55e': '#d97706',
        '#86efac': '#fde047',
        '#fde047': '#10b981',
    }
    s_slime = recolor_image(slime_src, sand_slime_map)
    s_slime_path = os.path.join(CHARACTERS, 'enemy_sand_slime.png')
    s_slime.save(s_slime_path)
    print('Wrote', os.path.relpath(s_slime_path, ROOT), s_slime.size)

    # 4. Sand Golem (Realm 3)
    sand_golem_map = {
        '#1e293b': '#451a03',
        '#334155': '#78350f',
        '#64748b': '#b45309',
        '#94a3b8': '#d97706',
        '#e2e8f0': '#fde047',
        '#d97706': '#9a3412',
        '#f59e0b': '#ea580c',
        '#fde047': '#fef08a',
    }
    s_golem = recolor_image(golem_src, sand_golem_map)
    s_golem_path = os.path.join(CHARACTERS, 'enemy_sand_golem.png')
    s_golem.save(s_golem_path)
    print('Wrote', os.path.relpath(s_golem_path, ROOT), s_golem.size)

if __name__ == '__main__':
    main()

