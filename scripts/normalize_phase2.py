import os
from PIL import Image

BRAIN_DIR = r"C:\Users\kitti\.gemini\antigravity-ide\brain\19865946-8b19-4609-b9f5-202555dcb966"
OUT_DIR = r"d:\developer\game\jo-game\public\assets\environment"
os.makedirs(OUT_DIR, exist_ok=True)

def remove_black_bg(img: Image.Image, threshold=20):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        # Check if nearly black
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    # Crop to non-transparent bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img

# 1. Ground Tile
ground_path = os.path.join(BRAIN_DIR, "tile_ground_grass_1793087819547.jpg")
if os.path.exists(ground_path):
    img = Image.open(ground_path).convert("RGBA")
    # Resize to 64x64 with high quality resampling
    img_64 = img.resize((64, 64), Image.Resampling.LANCZOS)
    img_64.save(os.path.join(OUT_DIR, "tile_ground.png"), "PNG")
    print("Saved tile_ground.png (64x64)")

# 2. Door
door_path = os.path.join(BRAIN_DIR, "obj_door_1793087839846.jpg")
if os.path.exists(door_path):
    img = Image.open(door_path)
    img_trans = remove_black_bg(img, threshold=25)
    img_sized = img_trans.resize((84, 140), Image.Resampling.LANCZOS)
    img_sized.save(os.path.join(OUT_DIR, "door.png"), "PNG")
    print("Saved door.png (84x140)")

# 3. Goal Flag
flag_path = os.path.join(BRAIN_DIR, "obj_goal_flag_1793087862914.jpg")
if os.path.exists(flag_path):
    img = Image.open(flag_path)
    img_trans = remove_black_bg(img, threshold=25)
    # Preserve aspect ratio or set to 48x140
    img_sized = img_trans.resize((56, 140), Image.Resampling.LANCZOS)
    img_sized.save(os.path.join(OUT_DIR, "goal_flag.png"), "PNG")
    print("Saved goal_flag.png (56x140)")

# 4. Spikes
spike_path = os.path.join(BRAIN_DIR, "obj_spikes_1793087883539.jpg")
if os.path.exists(spike_path):
    img = Image.open(spike_path)
    img_trans = remove_black_bg(img, threshold=25)
    img_sized = img_trans.resize((64, 28), Image.Resampling.LANCZOS)
    img_sized.save(os.path.join(OUT_DIR, "spikes.png"), "PNG")
    print("Saved spikes.png (64x28)")

# 5. Platform
plat_path = os.path.join(BRAIN_DIR, "tile_platform_1793087913740.jpg")
if os.path.exists(plat_path):
    img = Image.open(plat_path)
    img_trans = remove_black_bg(img, threshold=25)
    img_sized = img_trans.resize((160, 32), Image.Resampling.LANCZOS)
    img_sized.save(os.path.join(OUT_DIR, "platform.png"), "PNG")
    print("Saved platform.png (160x32)")

print("All Phase 2 assets normalized successfully!")
