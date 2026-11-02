"""Builds all NPC spritesheets with pxl and copies them to public/assets/characters/.

Usage:
    python tools/art/build_npcs.py

Assets created:
- npc_bounmy.png (Hunter Bounmy, Village x=1380, 128x48: 4 frames)
- npc_scholar.png (Master Vanh, Village x=680, 128x48: 4 frames)
- npc_chanthy.png (Grandma Chanthy, Village x=950, 128x48: 4 frames)
- npc_kham.png (Swordsman Kham, Village x=1660, 128x48: 4 frames)
- npc_noy.png (Shrine Maiden Noy, Village x=2310, 128x48: 4 frames)
- npc_somchay.png (Archaeologist Somchay, Dungeon x=650, 128x48: 4 frames)
- npc_guide_keo.png (Guide Keo, Stage 1 x=320, 128x48: 4 frames)
- npc_thong.png (Uncle Thong, Stage 5 x=360, 128x48: 4 frames)
- npc_dr_cyber.png (Dr. Cyber, Stage 10 x=280, 128x48: 4 frames)
"""

import json
import os
import shutil
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PXL = os.path.join(ROOT, '.claude', 'skills', 'pxl-pixel-art', 'bin', 'pxl.js')
SRC_PX = os.path.join(ROOT, 'tools', 'art', 'npcs.px.js')
OUT_DIR = os.path.join(ROOT, 'tools', 'art', 'out')
CHAR_DIR = os.path.join(ROOT, 'public', 'assets', 'characters')
STAGES_PATH = os.path.join(ROOT, 'public', 'data', 'stages.json')


def build_and_copy():
    # 1. Run pxl build
    cmd = ['node', PXL, 'build', SRC_PX, '--out', OUT_DIR]
    print('Running:', ' '.join(cmd))
    res = subprocess.run(cmd, check=True)

    # 2. Copy generated anims
    anims_dir = os.path.join(OUT_DIR, 'anims')
    os.makedirs(CHAR_DIR, exist_ok=True)
    for f in os.listdir(anims_dir):
        if f.startswith('npc_') and f.endswith('.png'):
            src = os.path.join(anims_dir, f)
            dst = os.path.join(CHAR_DIR, f)
            shutil.copy2(src, dst)
            print(f'Copied {f} -> {dst}')

    # 3. Update public/data/stages.json roles
    if os.path.exists(STAGES_PATH):
        with open(STAGES_PATH, 'r', encoding='utf-8') as sf:
            stages_data = json.load(sf)

        roles_map = {
            'npc-guide-keo': 'npc-guide-keo',
            'npc-thong': 'npc-thong',
            'npc-dr-cyber': 'npc-dr-cyber',
        }

        updated = 0
        def update_obj(obj):
            nonlocal updated
            if isinstance(obj, dict):
                if obj.get('kind') == 'npc' and obj.get('id') in roles_map:
                    if obj.get('role') != roles_map[obj['id']]:
                        obj['role'] = roles_map[obj['id']]
                        updated += 1
                for v in obj.values():
                    update_obj(v)
            elif isinstance(obj, list):
                for item in obj:
                    update_obj(item)

        update_obj(stages_data)

        if updated > 0:
            with open(STAGES_PATH, 'w', encoding='utf-8') as sf:
                json.dump(stages_data, sf, ensure_ascii=False, indent=2)
            print(f'Updated {updated} NPC roles in public/data/stages.json')


if __name__ == '__main__':
    build_and_copy()
