import os
from PIL import Image, ImageDraw

OUT_DIR = r"d:\developer\game\jo-game\public\assets\characters"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. Player Hero (32x48)
def create_player_sprite(skin_name, body_col, helm_col, visor_col, core_col, boot_col):
    img = Image.new("RGBA", (32, 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outline & Shadow base
    # Head & Helmet
    draw.rounded_rectangle([6, 4, 25, 20], radius=4, fill=helm_col, outline=(15, 23, 42, 255))
    # Glowing visor band
    draw.rectangle([10, 10, 24, 15], fill=visor_col)
    # Visor gleam
    draw.rectangle([12, 11, 15, 13], fill=(255, 255, 255, 240))

    # Torso Armor
    draw.rounded_rectangle([7, 19, 24, 34], radius=3, fill=body_col, outline=(15, 23, 42, 255))
    # Chest Core
    draw.ellipse([13, 23, 18, 28], fill=core_col, outline=(15, 23, 42, 255))
    draw.point((15, 25), fill=(255, 255, 255, 255))
    # Belt
    draw.rectangle([7, 33, 24, 35], fill=(30, 41, 59, 255))

    # Legs & Boots
    # Left leg
    draw.rectangle([8, 36, 14, 43], fill=body_col, outline=(15, 23, 42, 255))
    draw.rounded_rectangle([7, 42, 15, 47], radius=2, fill=boot_col, outline=(15, 23, 42, 255))
    # Right leg
    draw.rectangle([17, 36, 23, 43], fill=body_col, outline=(15, 23, 42, 255))
    draw.rounded_rectangle([16, 42, 24, 47], radius=2, fill=boot_col, outline=(15, 23, 42, 255))

    # Arms / Shoulders
    draw.rectangle([4, 21, 7, 31], fill=helm_col, outline=(15, 23, 42, 255))
    draw.rectangle([24, 21, 27, 31], fill=helm_col, outline=(15, 23, 42, 255))

    return img

# Import spritesheet creator to ensure player skins are 12-frame animated spritesheets
from generate_hero_spritesheet import create_hero_spritesheet, skins

for filename, b_col, h_col, v_col, c_col, boot_col in skins:
    create_hero_spritesheet(filename, b_col, h_col, v_col, c_col, boot_col)


# 2. Enemy Slime (32x28)
def create_slime_sprite():
    img = Image.new("RGBA", (32, 28), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Slime body (Bouncy rounded teardrop / dome)
    draw.ellipse([2, 4, 29, 26], fill=(168, 85, 247, 255), outline=(107, 33, 168, 255))
    draw.ellipse([4, 6, 27, 25], fill=(192, 132, 252, 255))
    
    # Bottom flat base
    draw.rectangle([4, 20, 27, 26], fill=(168, 85, 247, 255))
    draw.line([4, 26, 27, 26], fill=(107, 33, 168, 255), width=2)

    # Jelly highlight
    draw.ellipse([7, 8, 13, 13], fill=(255, 255, 255, 200))
    draw.ellipse([18, 9, 22, 12], fill=(255, 255, 255, 160))

    # Big Expressive Eyes
    # Left eye
    draw.ellipse([8, 13, 14, 20], fill=(255, 255, 255, 255), outline=(74, 4, 78, 255))
    draw.ellipse([10, 15, 13, 19], fill=(74, 4, 78, 255))
    draw.point((11, 16), fill=(255, 255, 255, 255))
    # Right eye
    draw.ellipse([18, 13, 24, 20], fill=(255, 255, 255, 255), outline=(74, 4, 78, 255))
    draw.ellipse([20, 15, 23, 19], fill=(74, 4, 78, 255))
    draw.point((21, 16), fill=(255, 255, 255, 255))

    # Cute blush
    draw.ellipse([5, 19, 8, 21], fill=(244, 63, 94, 180))
    draw.ellipse([24, 19, 27, 21], fill=(244, 63, 94, 180))

    return img

slime_img = create_slime_sprite()
slime_img.save(os.path.join(OUT_DIR, "enemy_slime.png"), "PNG")
print("Saved enemy_slime.png")


# 3. King Slime Boss (72x64)
def create_boss_sprite():
    img = Image.new("RGBA", (72, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Giant Slime Body
    draw.ellipse([4, 14, 67, 60], fill=(190, 18, 60, 255), outline=(136, 19, 55, 255))
    draw.ellipse([8, 17, 63, 58], fill=(225, 29, 72, 255))
    # Base
    draw.rectangle([10, 48, 61, 60], fill=(190, 18, 60, 255))
    draw.line([10, 60, 61, 60], fill=(136, 19, 55, 255), width=3)

    # Specular shine
    draw.ellipse([14, 22, 26, 30], fill=(255, 255, 255, 190))
    draw.ellipse([42, 24, 52, 29], fill=(255, 255, 255, 150))

    # Golden Crown on top
    # Crown base
    draw.rectangle([24, 10, 48, 14], fill=(234, 179, 8, 255), outline=(161, 98, 7, 255))
    # Crown peaks
    # Left peak
    draw.polygon([(24, 10), (28, 2), (32, 10)], fill=(250, 204, 21, 255), outline=(161, 98, 7, 255))
    # Center tall peak
    draw.polygon([(31, 10), (36, 0), (41, 10)], fill=(250, 204, 21, 255), outline=(161, 98, 7, 255))
    # Right peak
    draw.polygon([(40, 10), (44, 2), (48, 10)], fill=(250, 204, 21, 255), outline=(161, 98, 7, 255))
    # Crown center ruby jewel
    draw.polygon([(36, 4), (38, 7), (36, 10), (34, 7)], fill=(220, 38, 38, 255), outline=(153, 27, 27, 255))

    # Angry Boss Eyes
    # Left eye
    draw.ellipse([18, 30, 32, 44], fill=(255, 255, 255, 255), outline=(67, 10, 24, 255))
    draw.ellipse([23, 34, 30, 42], fill=(234, 88, 12, 255))
    draw.point((25, 36), fill=(255, 255, 255, 255))
    # Right eye
    draw.ellipse([40, 30, 54, 44], fill=(255, 255, 255, 255), outline=(67, 10, 24, 255))
    draw.ellipse([42, 34, 49, 42], fill=(234, 88, 12, 255))
    draw.point((44, 36), fill=(255, 255, 255, 255))

    # Angry V-Eyebrows
    draw.line([16, 27, 33, 33], fill=(67, 10, 24, 255), width=3)
    draw.line([56, 27, 39, 33], fill=(67, 10, 24, 255), width=3)

    return img

boss_img = create_boss_sprite()
boss_img.save(os.path.join(OUT_DIR, "boss_king_slime.png"), "PNG")
print("Saved boss_king_slime.png")

print("All Phase 4 character assets generated successfully!")
