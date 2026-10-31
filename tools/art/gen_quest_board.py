"""
Generates a crisp pixel-art Quest Notice Board for Knowledge Village.
Dimensions: 64x64 RGBA.
Features:
- Two wooden carved support pillars with iron braces.
- Wooden backboard with timber texture and subtle cyber-cyan border insets.
- Pinned scrolls and parchment notes with red/amber wax seals.
- Cyber neon glowing banner on top.
- Shadows and ground highlights.
"""
from PIL import Image, ImageDraw

def generate_quest_board():
    W, H = 64, 64
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Palette
    C_OUTLINE = (20, 16, 28, 255)
    C_WOOD_DARK = (78, 48, 28, 255)
    C_WOOD_MID = (124, 76, 44, 255)
    C_WOOD_LIGHT = (168, 110, 68, 255)
    C_WOOD_HIGHLIGHT = (206, 148, 98, 255)
    
    C_IRON_DARK = (30, 41, 59, 255)
    C_IRON_MID = (51, 65, 85, 255)
    C_IRON_LIGHT = (100, 116, 139, 255)

    C_CYAN_GLOW = (56, 189, 248, 255)
    C_CYAN_BRIGHT = (186, 230, 253, 255)
    
    C_PAPER_BG = (248, 241, 227, 255)
    C_PAPER_SHADOW = (214, 198, 168, 255)
    C_PAPER_INK = (100, 80, 65, 255)
    C_SEAL_RED = (220, 38, 38, 255)
    C_SEAL_GOLD = (234, 179, 8, 255)
    C_PIN_GREEN = (34, 197, 94, 255)

    # 1. Ground shadow
    draw.ellipse([8, 58, 55, 63], fill=(15, 23, 42, 90))

    # 2. Wooden Pillars (Left: x=10..15, Right: x=48..53, y=14..60)
    for px in [10, 48]:
        # Outline
        draw.rectangle([px, 14, px + 5, 59], fill=C_OUTLINE)
        # Inner pillar
        draw.rectangle([px + 1, 15, px + 4, 58], fill=C_WOOD_MID)
        # Highlight on left edge
        draw.line([(px + 1, 15), (px + 1, 58)], fill=C_WOOD_HIGHLIGHT)
        # Shadow on right edge
        draw.line([(px + 4, 15), (px + 4, 58)], fill=C_WOOD_DARK)
        # Iron base feet
        draw.rectangle([px - 1, 55, px + 6, 58], fill=C_IRON_MID)
        draw.line([(px - 1, 55), (px + 6, 55)], fill=C_IRON_LIGHT)
        draw.line([(px - 1, 58), (px + 6, 58)], fill=C_IRON_DARK)

    # 3. Main Board Frame (x=6..57, y=12..46)
    draw.rectangle([6, 12, 57, 46], fill=C_OUTLINE)
    draw.rectangle([7, 13, 56, 45], fill=C_WOOD_DARK)
    draw.rectangle([8, 14, 55, 44], fill=C_WOOD_MID)

    # Horizontal wood grain slats
    for y in [19, 25, 31, 37]:
        draw.line([(9, y), (54, y)], fill=C_WOOD_DARK)
        draw.line([(9, y + 1), (54, y + 1)], fill=C_WOOD_LIGHT)

    # Inner cork / board backplate (x=10..53, y=16..42)
    draw.rectangle([10, 16, 53, 42], fill=(92, 58, 34, 255))
    draw.rectangle([11, 17, 52, 41], fill=(112, 70, 40, 255))

    # Cyber glowing corner accents
    for cx, cy in [(11, 17), (51, 17), (11, 40), (51, 40)]:
        draw.rectangle([cx, cy, cx + 1, cy + 1], fill=C_CYAN_GLOW)

    # 4. Pinned Quest Papers / Scrolls
    # Note 1: Left larger parchment (x=13..25, y=19..37)
    draw.rectangle([13, 19, 25, 37], fill=C_OUTLINE)
    draw.rectangle([14, 20, 24, 36], fill=C_PAPER_BG)
    draw.line([(14, 36), (24, 36)], fill=C_PAPER_SHADOW)
    draw.line([(24, 20), (24, 36)], fill=C_PAPER_SHADOW)
    # Ink text lines
    draw.line([(16, 24), (22, 24)], fill=C_PAPER_INK)
    draw.line([(16, 27), (22, 27)], fill=C_PAPER_INK)
    draw.line([(16, 30), (20, 30)], fill=C_PAPER_INK)
    # Red wax seal at bottom
    draw.rectangle([18, 32, 20, 34], fill=C_SEAL_RED)
    draw.point((19, 33), fill=(254, 202, 202, 255))
    # Top pin
    draw.point((19, 19), fill=C_PIN_GREEN)

    # Note 2: Middle-top quest notice (x=27..38, y=18..31)
    draw.rectangle([27, 18, 38, 31], fill=C_OUTLINE)
    draw.rectangle([28, 19, 37, 30], fill=C_PAPER_BG)
    draw.line([(29, 22), (36, 22)], fill=C_PAPER_INK)
    draw.line([(29, 25), (35, 25)], fill=C_PAPER_INK)
    draw.line([(29, 28), (33, 28)], fill=C_PAPER_INK)
    # Gold star seal
    draw.point((33, 19), fill=C_SEAL_GOLD)
    # Pin
    draw.point((32, 18), fill=C_CYAN_BRIGHT)

    # Note 3: Right scroll with curled bottom (x=40..50, y=21..38)
    draw.rectangle([40, 21, 50, 37], fill=C_OUTLINE)
    draw.rectangle([41, 22, 49, 36], fill=C_PAPER_BG)
    draw.line([(42, 25), (48, 25)], fill=C_PAPER_INK)
    draw.line([(42, 28), (47, 28)], fill=C_PAPER_INK)
    draw.line([(42, 31), (48, 31)], fill=C_PAPER_INK)
    # Curled edge
    draw.line([(41, 36), (49, 36)], fill=C_PAPER_SHADOW)
    draw.rectangle([44, 33, 46, 35], fill=C_SEAL_RED)
    # Top pin
    draw.point((45, 21), fill=C_SEAL_GOLD)

    # 5. Top Cyber Header Plaque (x=16..47, y=6..13)
    draw.rectangle([16, 6, 47, 13], fill=C_OUTLINE)
    draw.rectangle([17, 7, 46, 12], fill=C_IRON_DARK)
    # Cyan neon glowing emblem / border
    draw.rectangle([18, 8, 45, 11], fill=(14, 116, 144, 255))
    draw.line([(19, 9), (44, 9)], fill=C_CYAN_GLOW)
    draw.line([(21, 10), (42, 10)], fill=C_CYAN_BRIGHT)

    # Scroll glyph icon in center of plaque
    draw.rectangle([30, 8, 33, 11], fill=(255, 255, 255, 255))
    draw.point((31, 9), fill=C_CYAN_GLOW)
    draw.point((32, 10), fill=C_CYAN_GLOW)

    # Corner brackets on plaque
    draw.point((17, 7), fill=C_IRON_LIGHT)
    draw.point((46, 7), fill=C_IRON_LIGHT)
    draw.point((17, 12), fill=C_IRON_LIGHT)
    draw.point((46, 12), fill=C_IRON_LIGHT)

    return img

if __name__ == '__main__':
    board = generate_quest_board()
    out_path = 'public/assets/environment/quest_board.png'
    board.save(out_path, format='PNG')
    print(f"Generated {out_path} ({board.size}, mode={board.mode})")

