import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ARTIFACT_DIR = Path(r"C:\Users\kitti\.gemini\antigravity\brain\5c8d3e5f-c4eb-4208-aac1-57392e67a921")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

SPRITES_DIR = Path(r"d:\developer\game\jo-game\tools\art\out\sprites")
SHEET_PATH = Path(r"d:\developer\game\jo-game\public\assets\characters\player-skin-cyber-blue.png")

BG_DARK = (11, 15, 25, 255)
BG_CARD = (17, 24, 39, 255)
BORDER_COLOR = (30, 41, 59, 255)
CYAN_ACCENT = (56, 189, 248, 255)
GOLD_ACCENT = (245, 158, 11, 255)
WHITE = (248, 250, 252, 255)
MUTED_TEXT = (148, 163, 184, 255)

# Try loading Lao font
lao_font_path = r"C:\Windows\Fonts\LaoUIb.ttf"
if not os.path.exists(lao_font_path):
    lao_font_path = r"C:\Windows\Fonts\LaoUI.ttf"

try:
    font_title = ImageFont.truetype(lao_font_path, 22)
    font_sub = ImageFont.truetype(lao_font_path, 15)
    font_label = ImageFont.truetype(lao_font_path, 13)
    font_big = ImageFont.truetype(lao_font_path, 26)
except Exception:
    font_title = ImageFont.truetype("arial.ttf", 22)
    font_sub = ImageFont.truetype("arial.ttf", 15)
    font_label = ImageFont.truetype("arial.ttf", 13)
    font_big = ImageFont.truetype("arial.ttf", 26)

# -------------------------------------------------------------
# 1. GENERATE PREVIEW 1: Apple Knight Hero Showcase
# -------------------------------------------------------------
def make_hero_showcase():
    W, H = 1000, 560
    img = Image.new("RGBA", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Header Card
    draw.rounded_rectangle([20, 16, W - 20, 72], radius=8, fill=BG_CARD, outline=BORDER_COLOR)
    draw.text((40, 24), "Apple Knight Hero Skin (Cyber-Blue Upgrade)", fill=CYAN_ACCENT, font=font_title)
    draw.text((40, 48), "ພາບລວມຕົວລະຄອນອັດສະວິນ: ໝວກເກາະມີຜ້າຄຸມ, ເກາະເຫຼັກ, ຕາເຮືອງແສງ ແລະ ທ່າທາງຕ່າງໆ", fill=MUTED_TEXT, font=font_sub)

    # Big Featured Hero Card (Left)
    card_l = [20, 88, 380, H - 20]
    draw.rounded_rectangle(card_l, radius=8, fill=BG_CARD, outline=BORDER_COLOR)
    draw.text((40, 104), "Featured: Idle Stance (6x Zoom)", fill=GOLD_ACCENT, font=font_sub)

    idle_0 = Image.open(SPRITES_DIR / "hero_cyber-blue_idle_0.png").convert("RGBA")
    idle_large = idle_0.resize((32 * 6, 48 * 6), Image.NEAREST)
    img.alpha_composite(idle_large, (94, 140))

    badges = [
        "Hooded Cowl: ຜ້າຄຸມຫົວສີຟ້າ ພ້ອມເງົາມືດ",
        "Glowing Eyes: ດວງຕາເຮືອງແສງ #38bdf8",
        "Knight Breastplate: ເກາະເຫຼັກ & ກາສັນຍະລັກທອງ",
        "Flowing Cape: ຜ້າຄຸມປິວສະບັດດ້ານຫຼັງ",
    ]
    for i, b in enumerate(badges):
        y_pos = 445 + i * 24
        draw.ellipse([40, y_pos + 4, 48, y_pos + 12], fill=CYAN_ACCENT)
        draw.text((56, y_pos), b, fill=WHITE, font=font_label)

    # Right Side: Poses Grid Card
    card_r = [400, 88, W - 20, H - 20]
    draw.rounded_rectangle(card_r, radius=8, fill=BG_CARD, outline=BORDER_COLOR)
    draw.text((420, 104), "Animation Poses (3x Zoom)", fill=CYAN_ACCENT, font=font_sub)

    poses = [
        ("hero_cyber-blue_run_1.png", "Run (ແລ່ນ/ພຸ່ງ)"),
        ("hero_cyber-blue_air_1.png", "Jump Rise (ໂດດຂຶ້ນ)"),
        ("hero_cyber-blue_air_3.png", "Jump Fall (ໂດດຕົກ)"),
        ("hero_cyber-blue_attack_2.png", "Sword Slash (ຟັນດາບ)"),
        ("hero_cyber-blue_wall_0.png", "Ledge Grab (ເກາະຂອບຜາ)"),
        ("hero_cyber-blue_hurt_0.png", "Hurt (ບາດເຈັບ)"),
    ]

    cell_w, cell_h = 180, 200
    start_x, start_y = 420, 136

    for idx, (filename, label) in enumerate(poses):
        c_idx = idx % 3
        r_idx = idx // 3
        cx = start_x + c_idx * cell_w
        cy = start_y + r_idx * cell_h

        draw.rounded_rectangle([cx, cy, cx + cell_w - 14, cy + cell_h - 14], radius=6, fill=(15, 23, 42, 255), outline=BORDER_COLOR)
        p_img = Image.open(SPRITES_DIR / filename).convert("RGBA")
        p_scaled = p_img.resize((32 * 3, 48 * 3), Image.NEAREST)
        img.alpha_composite(p_scaled, (cx + (cell_w - 14 - 96) // 2, cy + 18))
        draw.text((cx + 12, cy + cell_h - 36), label, fill=WHITE, font=font_label)

    out_file = ARTIFACT_DIR / "preview_apple_knight_hero.png"
    img.save(out_file)
    print(f"Saved {out_file}")

# -------------------------------------------------------------
# 2. GENERATE PREVIEW 2: Book Projectile & Touch Control Showcase
# -------------------------------------------------------------
def make_book_showcase():
    W, H = 920, 490
    img = Image.new("RGBA", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Header Card
    draw.rounded_rectangle([20, 16, W - 20, 72], radius=8, fill=BG_CARD, outline=BORDER_COLOR)
    draw.text((40, 24), "Magical Textbook Projectile (ປາປື້ມຕຳລາ) & Mobile Controls", fill=CYAN_ACCENT, font=font_title)
    draw.text((40, 48), "ປ່ຽນຈາກການປາ Apple ເປັນປາປື້ມຕຳລາວິເສດ [ປຸ່ມ U / X ແລະ ປຸ່ມສຳຜັດມືຖື]", fill=MUTED_TEXT, font=font_sub)

    # Left: Book Icon (10x zoom)
    card_l = [20, 88, 380, H - 20]
    draw.rounded_rectangle(card_l, radius=8, fill=BG_CARD, outline=BORDER_COLOR)
    draw.text((40, 104), "Textbook Projectile (10x Zoom)", fill=GOLD_ACCENT, font=font_sub)

    book_raw = Image.new("RGBA", (22, 22), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(book_raw)
    bdraw.rounded_rectangle([2, 2, 19, 19], radius=3, fill=(30, 58, 138, 255))
    bdraw.rectangle([2, 2, 5, 19], fill=(245, 158, 11, 255))
    bdraw.point((18, 3), fill=(251, 191, 36, 255))
    bdraw.point((18, 18), fill=(251, 191, 36, 255))
    bdraw.rectangle([6, 4, 17, 17], fill=(254, 240, 138, 255))
    bdraw.rectangle([10, 14, 12, 19], fill=(239, 68, 68, 255))

    book_big = book_raw.resize((22 * 10, 22 * 10), Image.NEAREST)
    img.alpha_composite(book_big, (80, 140))

    book_details = [
        "ຂະໜາດ Sprite: 22x22 px (Pixel Art)",
        "ຄວາມໄວ: 380 px/s ວິຖີໂຄ້ງ parabolic (520 px/s²)",
        "ການໝູນ: 720 deg/s ປິ່ນກາງອາກາດ",
        "ພະລັງໂຈມຕີ: 20 Damage + ຄູນຕາມ Hero Stat",
    ]
    for i, d in enumerate(book_details):
        y_pos = 380 + i * 22
        draw.text((40, y_pos), "• " + d, fill=MUTED_TEXT, font=font_label)

    # Right: Mobile Touch Controls preview
    card_r = [400, 88, W - 20, H - 20]
    draw.rounded_rectangle(card_r, radius=8, fill=BG_CARD, outline=BORDER_COLOR)
    draw.text((420, 104), "Mobile Virtual Touch Controls Cluster", fill=CYAN_ACCENT, font=font_sub)

    # Upper Row Buttons
    # Button 1: [Q] Cycle Weapon
    draw.ellipse([440, 150, 440 + 56, 150 + 56], fill=(15, 23, 42, 200), outline=CYAN_ACCENT, width=2)
    draw.text((454, 166), "[Q]", fill=WHITE, font=font_sub)

    # Button 2: [Book] Throw Book (NEW Glowing Blue Button!)
    draw.ellipse([520, 140, 520 + 74, 140 + 74], fill=(30, 58, 138, 240), outline=CYAN_ACCENT, width=3)
    draw.text((544, 154), "BOOK", fill=GOLD_ACCENT, font=font_label)
    draw.text((540, 174), "ປາປື້ມ", fill=WHITE, font=font_sub)

    # Button 3: [E] Interact
    draw.ellipse([620, 150, 620 + 56, 150 + 56], fill=(15, 23, 42, 200), outline=(251, 191, 36, 200), width=2)
    draw.text((636, 166), "[E]", fill=(251, 191, 36, 255), font=font_sub)

    # Lower combat row: Dash (52px), Attack (70px), Jump (80px)
    draw.ellipse([450, 256, 450 + 58, 256 + 58], fill=(245, 158, 11, 80), outline=(245, 158, 11, 200), width=2)
    draw.text((466, 272), "Dash", fill=WHITE, font=font_label)
    draw.text((466, 288), "ພຸ່ງ", fill=WHITE, font=font_label)

    draw.ellipse([530, 244, 530 + 76, 244 + 76], fill=(239, 68, 68, 100), outline=(239, 68, 68, 255), width=3)
    draw.text((548, 260), "Attack", fill=WHITE, font=font_label)
    draw.text((548, 278), "ໂຈມຕີ", fill=WHITE, font=font_sub)

    draw.ellipse([630, 234, 630 + 86, 234 + 86], fill=(14, 165, 233, 100), outline=CYAN_ACCENT, width=3)
    draw.text((652, 254), "Jump", fill=WHITE, font=font_sub)
    draw.text((656, 276), "ໂດດ", fill=WHITE, font=font_sub)

    draw.text((430, 366), "Combat Flow: ໂດດຂ້າມ -> ປາປື້ມຕຳລາ -> ພຸ່ງ -> ຟັນດາບ -> ເກາະຂອບຜາ", fill=GOLD_ACCENT, font=font_sub)
    draw.text((430, 400), "Ergonomic Layout: ທຸກປຸ່ມກວ້າງ 48–86px ຕາມມາດຕະຖານ Mobile Thumb Zone", fill=MUTED_TEXT, font=font_label)

    out_file = ARTIFACT_DIR / "preview_book_projectile.png"
    img.save(out_file)
    print(f"Saved {out_file}")

# -------------------------------------------------------------
# 3. GENERATE PREVIEW 3: Full Spritesheet (2x zoom) with labels
# -------------------------------------------------------------
def make_sheet_showcase():
    sheet = Image.open(SHEET_PATH).convert("RGBA")
    sw, sh = sheet.size  # 256 x 384
    scale = 2
    sheet_scaled = sheet.resize((sw * scale, sh * scale), Image.NEAREST)

    pad_left = 180
    pad_top = 70
    W = pad_left + sw * scale + 40
    H = pad_top + sh * scale + 40

    img = Image.new("RGBA", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)

    # Title
    draw.text((30, 20), "Full 8-Row Spritesheet (256x384, 2x Zoom)", fill=CYAN_ACCENT, font=font_title)

    # Checkerboard background
    cb_size = 16
    for y in range(pad_top, pad_top + sh * scale, cb_size):
        for x in range(pad_left, pad_left + sw * scale, cb_size):
            fill = (22, 30, 46, 255) if ((x + y) // cb_size) % 2 == 0 else (15, 23, 42, 255)
            draw.rectangle([x, y, x + cb_size, y + cb_size], fill=fill)

    img.alpha_composite(sheet_scaled, (pad_left, pad_top))
    draw.rectangle([pad_left - 1, pad_top - 1, pad_left + sw * scale + 1, pad_top + sh * scale + 1], outline=BORDER_COLOR)

    row_labels = [
        "Row 0: Idle (4 frames)",
        "Row 1: Run (8 frames)",
        "Row 2: Air (5 frames)",
        "Row 3: Attack (6 frames)",
        "Row 4: Tool (6 frames)",
        "Row 5: Wall/Cling (2 frames)",
        "Row 6: Hurt (3 frames)",
        "Row 7: Faint (6 frames)",
    ]

    row_h = 48 * scale
    for r, label in enumerate(row_labels):
        ry = pad_top + r * row_h
        draw.line([(20, ry), (pad_left - 10, ry)], fill=BORDER_COLOR)
        draw.text((24, ry + (row_h // 2) - 8), label, fill=GOLD_ACCENT if r in (0, 1, 2, 5) else MUTED_TEXT, font=font_label)

    out_file = ARTIFACT_DIR / "preview_hero_full_sheet.png"
    img.save(out_file)
    print(f"Saved {out_file}")

if __name__ == "__main__":
    make_hero_showcase()
    make_book_showcase()
    make_sheet_showcase()
    print("All 3 showcase preview images generated successfully with Lao fonts!")
