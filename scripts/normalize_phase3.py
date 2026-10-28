import os
from PIL import Image

BRAIN_DIR = r"C:\Users\kitti\.gemini\antigravity-ide\brain\19865946-8b19-4609-b9f5-202555dcb966"
OUT_DIR = r"d:\developer\game\jo-game\public\assets\items"
os.makedirs(OUT_DIR, exist_ok=True)

def remove_white_bg(img: Image.Image, threshold=235):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        # Check if nearly pure white
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    # Crop to non-transparent bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img

items = [
    ("item_coin_1793088655131.jpg", "coin.png", (28, 28)),
    ("item_heart_1793088701946.jpg", "heart.png", (30, 30)),
    ("item_star_1793088730551.jpg", "star.png", (30, 30)),
    ("item_spring_1793088803752.jpg", "spring.png", (30, 30)),
]

for src_name, dest_name, target_size in items:
    src_path = os.path.join(BRAIN_DIR, src_name)
    if os.path.exists(src_path):
        img = Image.open(src_path)
        img_trans = remove_white_bg(img, threshold=240)
        img_sized = img_trans.resize(target_size, Image.Resampling.LANCZOS)
        dest_path = os.path.join(OUT_DIR, dest_name)
        img_sized.save(dest_path, "PNG")
        print(f"Saved {dest_name} ({target_size[0]}x{target_size[1]})")

print("All Phase 3 item assets normalized successfully!")
