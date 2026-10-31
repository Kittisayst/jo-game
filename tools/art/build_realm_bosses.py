"""Builds unique pixel-art spritesheets for Realm 2 and Realm 3 bosses and mini-bosses:
- public/assets/characters/miniboss_crystal_warden.png (256x64: 4 frames of 64x64)
- public/assets/characters/miniboss_dune_sentinel.png (256x64: 4 frames of 64x64)
- public/assets/characters/boss_network_core.png (384x80: 4 frames of 96x80)
- public/assets/characters/boss_kernel_titan.png (384x80: 4 frames of 96x80)

Usage:
  python tools/art/build_realm_bosses.py
"""

import json
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CHARACTERS = os.path.join(ROOT, 'public', 'assets', 'characters')
MANIFEST = os.path.join(ROOT, 'docs', 'asset-manifest.json')

OUTLINE = (15, 23, 42, 255)       # #0f172a
WHITE = (248, 250, 252, 255)      # #f8fafc

# -------------------------------------------------------------
# 1. Realm 2 Mini-boss: Crystal Warden (64x64, 4 frames)
# -------------------------------------------------------------
def build_crystal_warden():
    sheet_w, sheet_h = 256, 64
    fw, fh = 64, 64
    sheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    bob = [0, 1, 1, 0]

    for f in range(4):
        im = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        y_off = bob[f]

        # Stone body chassis
        d.rounded_rectangle([14, 18 + y_off, 50, 60], radius=8, fill=(51, 65, 85, 255), outline=OUTLINE)
        d.rounded_rectangle([18, 22 + y_off, 46, 56], radius=6, fill=(30, 41, 59, 255))

        # Crystal shoulders (large angular prisms)
        # Left shoulder crystal
        d.polygon([(6, 26 + y_off), (16, 12 + y_off), (22, 26 + y_off), (14, 34 + y_off)], fill=(37, 99, 235, 255), outline=OUTLINE)
        d.polygon([(10, 24 + y_off), (16, 14 + y_off), (18, 24 + y_off)], fill=(96, 165, 250, 255))
        d.polygon([(14, 16 + y_off), (16, 14 + y_off), (17, 20 + y_off)], fill=WHITE)

        # Right shoulder crystal
        d.polygon([(58, 26 + y_off), (48, 12 + y_off), (42, 26 + y_off), (50, 34 + y_off)], fill=(37, 99, 235, 255), outline=OUTLINE)
        d.polygon([(54, 24 + y_off), (48, 14 + y_off), (46, 24 + y_off)], fill=(96, 165, 250, 255))
        d.polygon([(50, 16 + y_off), (48, 14 + y_off), (47, 20 + y_off)], fill=WHITE)

        # Head crest crystal
        d.polygon([(26, 16 + y_off), (32, 4 + y_off), (38, 16 + y_off)], fill=(29, 78, 216, 255), outline=OUTLINE)
        d.polygon([(29, 14 + y_off), (32, 6 + y_off), (35, 14 + y_off)], fill=(147, 197, 253, 255))

        # Center glowing cyan eye core
        core_r = 6 if f in (1, 2) else 5
        d.ellipse([32 - core_r - 2, 32 + y_off - core_r - 2, 32 + core_r + 2, 32 + y_off + core_r + 2], fill=(3, 105, 161, 255))
        d.ellipse([32 - core_r, 32 + y_off - core_r, 32 + core_r, 32 + y_off + core_r], fill=(56, 189, 248, 255), outline=OUTLINE)
        d.ellipse([30, 30 + y_off, 34, 34 + y_off], fill=WHITE)

        # Runic glowing seams
        d.rectangle([20, 44 + y_off, 44, 46 + y_off], fill=(6, 182, 212, 255))
        d.rectangle([28, 48 + y_off, 36, 52 + y_off], fill=(6, 182, 212, 255))

        # Heavy stone feet
        d.rounded_rectangle([10, 56, 26, 62], radius=3, fill=(30, 41, 59, 255), outline=OUTLINE)
        d.rounded_rectangle([38, 56, 54, 62], radius=3, fill=(30, 41, 59, 255), outline=OUTLINE)

        sheet.paste(im, (f * fw, 0))

    return sheet

# -------------------------------------------------------------
# 2. Realm 3 Mini-boss: Dune Sentinel (64x64, 4 frames)
# -------------------------------------------------------------
def build_dune_sentinel():
    sheet_w, sheet_h = 256, 64
    fw, fh = 64, 64
    sheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    bob = [0, 1, 1, 0]

    for f in range(4):
        im = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        y_off = bob[f]

        # Sandstone body chassis
        d.rounded_rectangle([14, 18 + y_off, 50, 60], radius=8, fill=(154, 52, 18, 255), outline=OUTLINE)
        d.rounded_rectangle([18, 22 + y_off, 46, 56], radius=6, fill=(120, 53, 15, 255))

        # Copper horn crests
        # Left horn
        d.polygon([(8, 14 + y_off), (18, 8 + y_off), (22, 22 + y_off), (12, 26 + y_off)], fill=(234, 88, 12, 255), outline=OUTLINE)
        d.polygon([(11, 16 + y_off), (17, 10 + y_off), (19, 18 + y_off)], fill=(253, 186, 116, 255))
        # Right horn
        d.polygon([(56, 14 + y_off), (46, 8 + y_off), (42, 22 + y_off), (52, 26 + y_off)], fill=(234, 88, 12, 255), outline=OUTLINE)
        d.polygon([(53, 16 + y_off), (47, 10 + y_off), (45, 18 + y_off)], fill=(253, 186, 116, 255))

        # Center copper solar plate
        d.ellipse([22, 24 + y_off, 42, 44 + y_off], fill=(194, 65, 12, 255), outline=OUTLINE)
        d.ellipse([25, 27 + y_off, 39, 41 + y_off], fill=(249, 115, 22, 255))

        # Glowing optic eye slits
        d.rectangle([24, 20 + y_off, 29, 23 + y_off], fill=(254, 240, 138, 255), outline=OUTLINE)
        d.rectangle([35, 20 + y_off, 40, 23 + y_off], fill=(254, 240, 138, 255), outline=OUTLINE)
        d.rectangle([26, 21 + y_off, 28, 22 + y_off], fill=WHITE)
        d.rectangle([37, 21 + y_off, 39, 22 + y_off], fill=WHITE)

        # Center glowing core
        core_r = 5 if f in (1, 2) else 4
        d.ellipse([32 - core_r, 34 + y_off - core_r, 32 + core_r, 34 + y_off + core_r], fill=(245, 158, 11, 255), outline=OUTLINE)
        d.ellipse([31, 33 + y_off, 33, 35 + y_off], fill=(254, 240, 138, 255))

        # Desert rune markings
        d.rectangle([22, 48 + y_off, 42, 50 + y_off], fill=(251, 191, 36, 255))
        d.rectangle([30, 52 + y_off, 34, 55 + y_off], fill=(251, 191, 36, 255))

        # Sandstone heavy base feet
        d.rounded_rectangle([10, 56, 26, 62], radius=3, fill=(120, 53, 15, 255), outline=OUTLINE)
        d.rounded_rectangle([38, 56, 54, 62], radius=3, fill=(120, 53, 15, 255), outline=OUTLINE)

        sheet.paste(im, (f * fw, 0))

    return sheet

# -------------------------------------------------------------
# 3. Realm 2 Boss: Network Core Overlord (96x80, 4 frames)
# -------------------------------------------------------------
def build_network_core_boss():
    sheet_w, sheet_h = 384, 80
    fw, fh = 96, 80
    sheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    bob = [0, 1, 1, 0]

    for f in range(4):
        im = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        y_off = bob[f]

        # Heavy cyber-server chassis (96x80)
        d.rounded_rectangle([10, 14 + y_off, 86, 78], radius=14, fill=(51, 65, 85, 255), outline=OUTLINE)
        d.rounded_rectangle([16, 20 + y_off, 80, 72], radius=10, fill=(15, 23, 42, 255))

        # Top optical transmission bus
        d.rectangle([28, 6 + y_off, 68, 16 + y_off], fill=(3, 105, 161, 255), outline=OUTLINE)
        d.rectangle([32, 8 + y_off, 64, 12 + y_off], fill=(56, 189, 248, 255))
        # 3 Optical antennas
        d.polygon([(36, 6 + y_off), (38, 2 + y_off), (40, 6 + y_off)], fill=(103, 232, 249, 255), outline=OUTLINE)
        d.polygon([(46, 6 + y_off), (48, 0 + y_off), (50, 6 + y_off)], fill=WHITE, outline=OUTLINE)
        d.polygon([(56, 6 + y_off), (58, 2 + y_off), (60, 6 + y_off)], fill=(103, 232, 249, 255), outline=OUTLINE)

        # Dual packet stream scanners (eyes)
        d.rectangle([24, 28 + y_off, 40, 36 + y_off], fill=(2, 132, 199, 255), outline=OUTLINE)
        d.rectangle([56, 28 + y_off, 72, 36 + y_off], fill=(2, 132, 199, 255), outline=OUTLINE)
        d.rectangle([26, 30 + y_off, 38, 34 + y_off], fill=(103, 232, 249, 255))
        d.rectangle([58, 30 + y_off, 70, 34 + y_off], fill=(103, 232, 249, 255))
        d.rectangle([28, 31 + y_off, 32, 33 + y_off], fill=WHITE)
        d.rectangle([60, 31 + y_off, 64, 33 + y_off], fill=WHITE)

        # Giant Central Network Core (pulsing cyan reactor)
        core_r = 13 if f in (1, 2) else 11
        d.ellipse([48 - core_r - 3, 52 + y_off - core_r - 3, 48 + core_r + 3, 52 + y_off + core_r + 3], fill=(3, 105, 161, 255))
        d.ellipse([48 - core_r, 52 + y_off - core_r, 48 + core_r, 52 + y_off + core_r], fill=(56, 189, 248, 255), outline=OUTLINE)
        d.ellipse([48 - (core_r // 2), 52 + y_off - (core_r // 2), 48 + (core_r // 2), 52 + y_off + (core_r // 2)], fill=WHITE)

        # Server port arrays on left and right
        for row in range(3):
            # Left LEDs
            led_color = (16, 185, 129, 255) if (f + row) % 2 == 0 else (239, 68, 68, 255)
            d.rectangle([20, 44 + row * 8 + y_off, 24, 48 + row * 8 + y_off], fill=led_color, outline=OUTLINE)
            # Right LEDs
            led_color2 = (56, 189, 248, 255) if (f + row) % 2 == 1 else (245, 158, 11, 255)
            d.rectangle([72, 44 + row * 8 + y_off, 76, 48 + row * 8 + y_off], fill=led_color2, outline=OUTLINE)

        # Gold PCIe / Bus connector pins along the base
        for pin_x in range(24, 73, 6):
            d.rectangle([pin_x, 72, pin_x + 3, 77], fill=(245, 158, 11, 255), outline=OUTLINE)

        sheet.paste(im, (f * fw, 0))

    return sheet

# -------------------------------------------------------------
# 4. Realm 3 Boss: Kernel Titan (96x80, 4 frames)
# -------------------------------------------------------------
def build_kernel_titan_boss():
    sheet_w, sheet_h = 384, 80
    fw, fh = 96, 80
    sheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
    bob = [0, 1, 1, 0]

    for f in range(4):
        im = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        y_off = bob[f]

        # Heavy bronze / copper industrial chassis (96x80)
        d.rounded_rectangle([10, 14 + y_off, 86, 78], radius=14, fill=(154, 52, 18, 255), outline=OUTLINE)
        d.rounded_rectangle([16, 20 + y_off, 80, 72], radius=10, fill=(69, 26, 3, 255))

        # Heavy copper exhaust stack chimneys (CPU cooling)
        d.rectangle([24, 4 + y_off, 34, 16 + y_off], fill=(234, 88, 12, 255), outline=OUTLINE)
        d.rectangle([62, 4 + y_off, 72, 16 + y_off], fill=(234, 88, 12, 255), outline=OUTLINE)
        d.rectangle([26, 6 + y_off, 32, 10 + y_off], fill=(253, 186, 116, 255))
        d.rectangle([64, 6 + y_off, 70, 10 + y_off], fill=(253, 186, 116, 255))

        # Central processing crest
        d.polygon([(40, 16 + y_off), (48, 4 + y_off), (56, 16 + y_off)], fill=(245, 158, 11, 255), outline=OUTLINE)
        d.polygon([(44, 14 + y_off), (48, 8 + y_off), (52, 14 + y_off)], fill=(254, 240, 138, 255))

        # Dual glowing molten logic optics (eyes)
        d.rectangle([24, 28 + y_off, 40, 36 + y_off], fill=(249, 115, 22, 255), outline=OUTLINE)
        d.rectangle([56, 28 + y_off, 72, 36 + y_off], fill=(249, 115, 22, 255), outline=OUTLINE)
        d.rectangle([26, 30 + y_off, 38, 34 + y_off], fill=(254, 240, 138, 255))
        d.rectangle([58, 30 + y_off, 70, 34 + y_off], fill=(254, 240, 138, 255))
        d.rectangle([28, 31 + y_off, 32, 33 + y_off], fill=WHITE)
        d.rectangle([60, 31 + y_off, 64, 33 + y_off], fill=WHITE)

        # Central OS Kernel Core (molten register reactor)
        core_r = 13 if f in (1, 2) else 11
        d.ellipse([48 - core_r - 3, 52 + y_off - core_r - 3, 48 + core_r + 3, 52 + y_off + core_r + 3], fill=(194, 65, 12, 255))
        d.ellipse([48 - core_r, 52 + y_off - core_r, 48 + core_r, 52 + y_off + core_r], fill=(249, 115, 22, 255), outline=OUTLINE)
        d.ellipse([48 - (core_r // 2), 52 + y_off - (core_r // 2), 48 + (core_r // 2), 52 + y_off + (core_r // 2)], fill=(254, 240, 138, 255))

        # Memory register bank arrays (green logic lights)
        for row in range(3):
            # Left memory bank
            mem_col = (16, 185, 129, 255) if (f + row) % 2 == 0 else (52, 211, 153, 255)
            d.rectangle([20, 44 + row * 8 + y_off, 24, 48 + row * 8 + y_off], fill=mem_col, outline=OUTLINE)
            # Right memory bank
            mem_col2 = (52, 211, 153, 255) if (f + row) % 2 == 0 else (16, 185, 129, 255)
            d.rectangle([72, 44 + row * 8 + y_off, 76, 48 + row * 8 + y_off], fill=mem_col2, outline=OUTLINE)

        # Heavy copper treads / base plates
        d.rounded_rectangle([18, 70, 44, 78], radius=3, fill=(120, 53, 15, 255), outline=OUTLINE)
        d.rounded_rectangle([52, 70, 78, 78], radius=3, fill=(120, 53, 15, 255), outline=OUTLINE)

        sheet.paste(im, (f * fw, 0))

    return sheet

def main():
    os.makedirs(CHARACTERS, exist_ok=True)

    # 1. Crystal Warden
    cw = build_crystal_warden()
    cw_path = os.path.join(CHARACTERS, 'miniboss_crystal_warden.png')
    cw.save(cw_path)
    print('Wrote', os.path.relpath(cw_path, ROOT), cw.size)

    # 2. Dune Sentinel
    ds = build_dune_sentinel()
    ds_path = os.path.join(CHARACTERS, 'miniboss_dune_sentinel.png')
    ds.save(ds_path)
    print('Wrote', os.path.relpath(ds_path, ROOT), ds.size)

    # 3. Network Core Boss
    nc = build_network_core_boss()
    nc_path = os.path.join(CHARACTERS, 'boss_network_core.png')
    nc.save(nc_path)
    print('Wrote', os.path.relpath(nc_path, ROOT), nc.size)

    # 4. Kernel Titan Boss
    kt = build_kernel_titan_boss()
    kt_path = os.path.join(CHARACTERS, 'boss_kernel_titan.png')
    kt.save(kt_path)
    print('Wrote', os.path.relpath(kt_path, ROOT), kt.size)

if __name__ == '__main__':
    main()

