"""Builds the forest Stage art: runs pxl on forest-stage.px.js, then copies the pieces into public/assets.

    python tools/art/build_forest_stage.py

- public/assets/environment/tile_ground_forest.png (64x64, tiles sideways), tile_wall_forest.png (64x64, the rock body
  of a raised ground block, tiles both ways), platform_forest.png (160x28)
- public/assets/environment/decor_forest_*.png: bush_a, bush_b, tuft, flowers, rock_a, rock_b, pillar_stone, tree_big
- public/assets/backgrounds/forest_{sky,clouds,hills,trees}.png: 1280x720 (drawn at 640x360, upscaled 2x
  with nearest neighbour). The clouds, hills and trees repeat sideways without a seam.

Which texture goes where is in public/data/scenery.json, not in code.
"""

import os
import subprocess

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'tools', 'art', 'out')
ENV = os.path.join(ROOT, 'public', 'assets', 'environment')
BG = os.path.join(ROOT, 'public', 'assets', 'backgrounds')
PXL = os.path.join(ROOT, '.claude', 'skills', 'pxl-pixel-art', 'bin', 'pxl.js')

ENV_SPRITES = {
    'ground_forest': 'tile_ground_forest.png',
    'wall_forest': 'tile_wall_forest.png',
    'platform_forest': 'platform_forest.png',
    'bush_a': 'decor_forest_bush_a.png',
    'bush_b': 'decor_forest_bush_b.png',
    'tuft': 'decor_forest_tuft.png',
    'flowers': 'decor_forest_flowers.png',
    'rock_a': 'decor_forest_rock_a.png',
    'rock_b': 'decor_forest_rock_b.png',
    'pillar_stone': 'decor_forest_pillar.png',
    'tree_big': 'decor_forest_tree.png',
}
SCENES = {
    'forest_sky': 'forest_sky.png',
    'forest_clouds': 'forest_clouds.png',
    'forest_hills': 'forest_hills.png',
    'forest_trees': 'forest_trees.png',
}


def main():
    subprocess.run(['node', PXL, 'build', os.path.join(ROOT, 'tools', 'art', 'forest-stage.px.js'), '--out', OUT, '--no-preview'], check=True)
    for name, target in ENV_SPRITES.items():
        Image.open(os.path.join(OUT, 'sprites', name + '.png')).save(os.path.join(ENV, target))
    for name, target in SCENES.items():
        image = Image.open(os.path.join(OUT, 'scenes', name + '.png')).convert('RGBA')
        image.resize((image.width * 2, image.height * 2), Image.NEAREST).save(os.path.join(BG, target), optimize=True)
    print('forest Stage art written')


if __name__ == '__main__':
    main()
