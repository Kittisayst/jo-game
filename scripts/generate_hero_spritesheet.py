import os
from PIL import Image, ImageDraw

OUT_DIR = r"d:\developer\game\jo-game\public\assets\characters"
os.makedirs(OUT_DIR, exist_ok=True)

FRAME_W = 32
FRAME_H = 48
NUM_FRAMES = 12

def draw_hero_frame(frame_idx, b_col, h_col, v_col, c_col, boot_col):
    """
    Draw a single 32x48 frame for the hero spritesheet.
    Frame index:
      0..3: Idle
      4..9: Run
      10: Jump
      11: Fall
    """
    img = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    outline = (15, 23, 42, 255)

    if frame_idx in (0, 1, 2, 3):
        # IDLE ANIMATION
        # Breath y offset: 0, -1, -2, -1
        y_off = [0, -1, -2, -1][frame_idx]
        pulse = frame_idx in (1, 2)

        # Helmet
        draw.rounded_rectangle([6, 4 + y_off, 25, 20 + y_off], radius=4, fill=h_col, outline=outline)
        # Visor
        draw.rectangle([10, 10 + y_off, 24, 15 + y_off], fill=v_col)
        # Visor gleam
        gleam_w = 4 if pulse else 3
        draw.rectangle([12, 11 + y_off, 12 + gleam_w, 13 + y_off], fill=(255, 255, 255, 240))

        # Torso
        draw.rounded_rectangle([7, 19 + y_off, 24, 34 + y_off], radius=3, fill=b_col, outline=outline)
        # Chest Core
        core_pad = 1 if frame_idx == 2 else 0
        draw.ellipse([13 - core_pad, 23 + y_off - core_pad, 18 + core_pad, 28 + y_off + core_pad], fill=c_col, outline=outline)
        draw.point((15, 25 + y_off), fill=(255, 255, 255, 255))
        # Belt
        draw.rectangle([7, 33 + y_off, 24, 35 + y_off], fill=(30, 41, 59, 255))

        # Legs (grounded at 47)
        draw.rectangle([8, 36 + y_off, 14, 43], fill=b_col, outline=outline)
        draw.rounded_rectangle([7, 42, 15, 47], radius=2, fill=boot_col, outline=outline)

        draw.rectangle([17, 36 + y_off, 23, 43], fill=b_col, outline=outline)
        draw.rounded_rectangle([16, 42, 24, 47], radius=2, fill=boot_col, outline=outline)

        # Arms
        arm_x_off = 1 if frame_idx == 2 else 0
        draw.rectangle([4 - arm_x_off, 21 + y_off, 7 - arm_x_off, 31 + y_off], fill=h_col, outline=outline)
        draw.rectangle([24 + arm_x_off, 21 + y_off, 27 + arm_x_off, 31 + y_off], fill=h_col, outline=outline)

    elif 4 <= frame_idx <= 9:
        # RUN CYCLE (6 frames)
        run_step = frame_idx - 4
        # Leaned forward slightly (x_lean = +1)
        # Vertical bobbing: [0, 1, -1, 0, 1, -1]
        y_bob = [0, 1, -1, 0, 1, -1][run_step]

        # Helmet
        draw.rounded_rectangle([7, 4 + y_bob, 26, 20 + y_bob], radius=4, fill=h_col, outline=outline)
        draw.rectangle([11, 10 + y_bob, 25, 15 + y_bob], fill=v_col)
        draw.rectangle([13, 11 + y_bob, 16, 13 + y_bob], fill=(255, 255, 255, 240))

        # Torso
        draw.rounded_rectangle([8, 19 + y_bob, 25, 34 + y_bob], radius=3, fill=b_col, outline=outline)
        draw.ellipse([14, 23 + y_bob, 19, 28 + y_bob], fill=c_col, outline=outline)
        draw.point((16, 25 + y_bob), fill=(255, 255, 255, 255))
        draw.rectangle([8, 33 + y_bob, 25, 35 + y_bob], fill=(30, 41, 59, 255))

        # Legs per step:
        if run_step == 0:
            # Contact 1: Right leg forward, Left leg back
            draw.line([(19, 35 + y_bob), (23, 42), (25, 47)], fill=b_col, width=4)
            draw.rounded_rectangle([21, 43, 27, 47], radius=2, fill=boot_col, outline=outline)
            draw.line([(11, 35 + y_bob), (7, 40), (4, 44)], fill=b_col, width=4)
            draw.rounded_rectangle([2, 40, 8, 44], radius=2, fill=boot_col, outline=outline)
            # Arms
            draw.rectangle([3, 22 + y_bob, 7, 30 + y_bob], fill=h_col, outline=outline)
            draw.rectangle([25, 21 + y_bob, 29, 29 + y_bob], fill=h_col, outline=outline)

        elif run_step == 1:
            # Down/Push 1: Body low, right foot under hip, left kicking back
            draw.rectangle([16, 36 + y_bob, 22, 43], fill=b_col, outline=outline)
            draw.rounded_rectangle([15, 43, 23, 47], radius=2, fill=boot_col, outline=outline)
            draw.line([(10, 36 + y_bob), (4, 38), (2, 38)], fill=b_col, width=3)
            draw.rounded_rectangle([1, 36, 7, 40], radius=2, fill=boot_col, outline=outline)
            # Arms
            draw.rectangle([5, 23 + y_bob, 9, 31 + y_bob], fill=h_col, outline=outline)
            draw.rectangle([23, 22 + y_bob, 27, 30 + y_bob], fill=h_col, outline=outline)

        elif run_step == 2:
            # Passing / Lift 1: Left knee high forward, right leg extending
            draw.line([(18, 35 + y_bob), (24, 35 + y_bob), (24, 40)], fill=b_col, width=4)
            draw.rounded_rectangle([21, 38, 27, 42], radius=2, fill=boot_col, outline=outline)
            draw.line([(12, 35 + y_bob), (9, 41), (7, 45)], fill=b_col, width=4)
            draw.rounded_rectangle([5, 42, 11, 46], radius=2, fill=boot_col, outline=outline)
            # Arms swing
            draw.rectangle([6, 21 + y_bob, 10, 29 + y_bob], fill=h_col, outline=outline)
            draw.rectangle([22, 21 + y_bob, 26, 29 + y_bob], fill=h_col, outline=outline)

        elif run_step == 3:
            # Contact 2: Left leg forward, Right leg back
            draw.line([(11, 35 + y_bob), (19, 41), (25, 47)], fill=b_col, width=4)
            draw.rounded_rectangle([21, 43, 27, 47], radius=2, fill=boot_col, outline=outline)
            draw.line([(17, 35 + y_bob), (11, 40), (5, 44)], fill=b_col, width=4)
            draw.rounded_rectangle([3, 40, 9, 44], radius=2, fill=boot_col, outline=outline)
            # Arms
            draw.rectangle([25, 22 + y_bob, 29, 30 + y_bob], fill=h_col, outline=outline)
            draw.rectangle([3, 21 + y_bob, 7, 29 + y_bob], fill=h_col, outline=outline)

        elif run_step == 4:
            # Down/Push 2: Body low, left foot under hip, right kicking back
            draw.rectangle([16, 36 + y_bob, 22, 43], fill=b_col, outline=outline)
            draw.rounded_rectangle([15, 43, 23, 47], radius=2, fill=boot_col, outline=outline)
            draw.line([(12, 36 + y_bob), (5, 38), (3, 38)], fill=b_col, width=3)
            draw.rounded_rectangle([2, 36, 8, 40], radius=2, fill=boot_col, outline=outline)
            # Arms
            draw.rectangle([23, 23 + y_bob, 27, 31 + y_bob], fill=h_col, outline=outline)
            draw.rectangle([5, 22 + y_bob, 9, 30 + y_bob], fill=h_col, outline=outline)

        elif run_step == 5:
            # Passing / Lift 2: Right knee high forward, left leg extending
            draw.line([(12, 35 + y_bob), (24, 35 + y_bob), (24, 40)], fill=b_col, width=4)
            draw.rounded_rectangle([21, 38, 27, 42], radius=2, fill=boot_col, outline=outline)
            draw.line([(16, 35 + y_bob), (11, 41), (7, 45)], fill=b_col, width=4)
            draw.rounded_rectangle([5, 42, 11, 46], radius=2, fill=boot_col, outline=outline)
            # Arms swing
            draw.rectangle([22, 21 + y_bob, 26, 29 + y_bob], fill=h_col, outline=outline)
            draw.rectangle([6, 21 + y_bob, 10, 29 + y_bob], fill=h_col, outline=outline)

    elif frame_idx == 10:
        # JUMP (Rising tuck)
        # Helmet (tilted up slightly)
        draw.rounded_rectangle([6, 2, 25, 18], radius=4, fill=h_col, outline=outline)
        draw.rectangle([10, 7, 24, 12], fill=v_col)
        draw.rectangle([12, 8, 16, 10], fill=(255, 255, 255, 240))

        # Torso
        draw.rounded_rectangle([7, 17, 24, 31], radius=3, fill=b_col, outline=outline)
        draw.ellipse([13, 21, 18, 26], fill=c_col, outline=outline)
        draw.point((15, 23), fill=(255, 255, 255, 255))
        draw.rectangle([7, 30, 24, 32], fill=(30, 41, 59, 255))

        # Tucked Legs
        draw.rounded_rectangle([6, 33, 14, 40], radius=2, fill=b_col, outline=outline)
        draw.rounded_rectangle([5, 38, 14, 42], radius=2, fill=boot_col, outline=outline)
        draw.rounded_rectangle([17, 33, 25, 40], radius=2, fill=b_col, outline=outline)
        draw.rounded_rectangle([17, 38, 26, 42], radius=2, fill=boot_col, outline=outline)

        # Arms raised/bent ready
        draw.rectangle([3, 16, 7, 26], fill=h_col, outline=outline)
        draw.rectangle([24, 16, 28, 26], fill=h_col, outline=outline)

    elif frame_idx == 11:
        # FALL (Aerodynamic spread)
        # Helmet
        draw.rounded_rectangle([6, 6, 25, 22], radius=4, fill=h_col, outline=outline)
        draw.rectangle([10, 13, 24, 18], fill=v_col)
        draw.rectangle([12, 14, 15, 16], fill=(255, 255, 255, 240))

        # Torso
        draw.rounded_rectangle([7, 20, 24, 34], radius=3, fill=b_col, outline=outline)
        draw.ellipse([13, 24, 18, 29], fill=c_col, outline=outline)
        draw.point((15, 26), fill=(255, 255, 255, 255))
        draw.rectangle([7, 33, 24, 35], fill=(30, 41, 59, 255))

        # Extended legs downward
        draw.rectangle([6, 35, 13, 43], fill=b_col, outline=outline)
        draw.rounded_rectangle([5, 42, 13, 47], radius=2, fill=boot_col, outline=outline)
        draw.rectangle([18, 35, 25, 43], fill=b_col, outline=outline)
        draw.rounded_rectangle([18, 42, 26, 47], radius=2, fill=boot_col, outline=outline)

        # Arms flared outward
        draw.rectangle([2, 18, 6, 27], fill=h_col, outline=outline)
        draw.rectangle([25, 18, 29, 27], fill=h_col, outline=outline)

    return img

def create_hero_spritesheet(skin_filename, b_col, h_col, v_col, c_col, boot_col):
    sheet = Image.new("RGBA", (FRAME_W * NUM_FRAMES, FRAME_H), (0, 0, 0, 0))
    for f in range(NUM_FRAMES):
        f_img = draw_hero_frame(f, b_col, h_col, v_col, c_col, boot_col)
        sheet.paste(f_img, (f * FRAME_W, 0))
    
    out_path = os.path.join(OUT_DIR, skin_filename)
    sheet.save(out_path, "PNG")
    print(f"Generated {skin_filename}: {sheet.size[0]}x{sheet.size[1]} with {NUM_FRAMES} frames.")

skins = [
    ("player-skin-cyber-blue.png", (2, 132, 199, 255), (15, 23, 42, 255), (56, 189, 248, 255), (245, 158, 11, 255), (3, 105, 161, 255)),
    ("player-skin-neon-ninja.png", (15, 23, 42, 255), (6, 78, 59, 255), (16, 185, 129, 255), (239, 68, 68, 255), (30, 41, 59, 255)),
    ("player-skin-cyber-knight.png", (100, 116, 139, 255), (51, 65, 85, 255), (239, 68, 68, 255), (251, 191, 36, 255), (71, 85, 105, 255)),
    ("player-skin-golden-runner.png", (245, 158, 11, 255), (120, 53, 15, 255), (34, 211, 238, 255), (255, 255, 255, 255), (180, 83, 9, 255)),
]

if __name__ == "__main__":
    for filename, b_col, h_col, v_col, c_col, boot_col in skins:
        create_hero_spritesheet(filename, b_col, h_col, v_col, c_col, boot_col)
