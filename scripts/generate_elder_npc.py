import os
from PIL import Image, ImageDraw

OUT_DIR = r"d:\developer\game\jo-game\public\assets\characters"
os.makedirs(OUT_DIR, exist_ok=True)

def create_elder_sprite():
    img = Image.new("RGBA", (32, 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    outline = (15, 23, 42, 255)

    # 1. Elder Hat / Hood (Deep sapphire/indigo hood)
    draw.rounded_rectangle([7, 4, 25, 20], radius=5, fill=(30, 58, 138, 255), outline=outline)
    
    # 2. Face (Kind warm skin)
    draw.rectangle([10, 11, 22, 18], fill=(254, 215, 170, 255))
    # Eyes (Gentle eyes)
    draw.point((12, 13), fill=(15, 23, 42, 255))
    draw.point((20, 13), fill=(15, 23, 42, 255))
    # Eyebrows (White bushy eyebrows)
    draw.rectangle([11, 11, 14, 12], fill=(255, 255, 255, 255))
    draw.rectangle([18, 11, 21, 12], fill=(255, 255, 255, 255))

    # 3. White Beard (Long majestic flowing beard)
    draw.polygon([(9, 17), (23, 17), (19, 29), (13, 29)], fill=(241, 245, 249, 255), outline=outline)
    draw.line([(16, 17), (16, 27)], fill=(203, 213, 225, 255), width=1)

    # 4. Robe (Elder ceremonial robe: royal blue + gold trim)
    draw.rounded_rectangle([7, 21, 25, 43], radius=4, fill=(30, 58, 138, 255), outline=outline)
    # Gold trim down center
    draw.rectangle([15, 28, 17, 43], fill=(245, 158, 11, 255))
    # Gold sash/belt
    draw.rectangle([7, 32, 25, 34], fill=(245, 158, 11, 255))

    # 5. Feet / Slippers
    draw.rounded_rectangle([8, 43, 13, 47], radius=2, fill=(120, 53, 15, 255), outline=outline)
    draw.rounded_rectangle([19, 43, 24, 47], radius=2, fill=(120, 53, 15, 255), outline=outline)

    # 6. Wooden Staff with Glowing Crystal Orb
    # Staff pole (Right hand side)
    draw.line([(26, 8), (26, 46)], fill=(120, 53, 15, 255), width=2)
    # Crystal Orb on top
    draw.ellipse([23, 3, 29, 9], fill=(56, 189, 248, 255), outline=(14, 165, 233, 255))
    # Crystal gleam
    draw.point((25, 5), fill=(255, 255, 255, 255))

    return img

if __name__ == "__main__":
    elder_img = create_elder_sprite()
    out_path = os.path.join(OUT_DIR, "npc_elder.png")
    elder_img.save(out_path, "PNG")
    print(f"Generated {out_path} ({elder_img.size[0]}x{elder_img.size[1]})")
