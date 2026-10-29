"""
Generates the four Player Skin spritesheets with improved weapon-holding arm postures.
Each sheet is 512x48 (16 frames of 32x48).
The front arm is sculpted to bend, brace and grip at the exact Hand Anchor points:
- Idle (0..3): Bent elbow, forearm forward, firm fist at (19, 28)
- Run (4..9): Dynamic weapon-carry arm pump matching the run stride
- Jump (10): Raised arm with ready fist at (21, 22)
- Fall (11): Bracing arm with ready fist at (21, 24)
- Attack 12: Windup arm pulled back with fist at (6, 20)
- Attack 13: Full thrust/lunge arm with fist at (27, 25) (no blade stub)
- Attack 14: Follow-through arm swung down with fist at (23, 29)
- Wall 15: Wall-braking hand on right, waist/scabbard grip at (11, 27)
"""
from __future__ import annotations
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRATCH_DIR = r"C:\Users\kitti\.gemini\antigravity\brain\0f6c83ae-e45d-4eb0-9f76-c4b2371f8d51\scratch"
if SCRATCH_DIR not in sys.path:
    sys.path.insert(0, SCRATCH_DIR)

from PIL import Image
from pixel_art_core import (
    PAL,
    auto_outline,
    fill_rect,
    make_sheet,
    new_canvas,
    px,
)

ROOT = r"d:\developer\game\jo-game\public"
CHAR_DIR = os.path.join(ROOT, "assets", "characters")

SKIN_THEMES = {
    "cyber-blue": {
        "suit_dark": PAL["COBALT"],
        "suit_mid": PAL["BLUE"],
        "suit_light": PAL["SKY_NEON"],
        "helm_dark": PAL["SLATE_DARK"],
        "helm_mid": PAL["COBALT"],
        "visor": PAL["SKY_NEON"],
        "visor_hi": PAL["ICE"],
        "core": PAL["GOLD"],
        "belt": PAL["SLATE_DARK"],
        "boot": PAL["CYBER_DEEP"],
        "boot_hi": PAL["COBALT"],
        "glove": PAL["CYBER_DEEP"],
        "glove_hi": PAL["SKY_NEON"],
        "scarf": PAL["CYAN"],
        "style": "runner",
    },
    "neon-ninja": {
        "suit_dark": PAL["SLATE_DARK"],
        "suit_mid": PAL["SLATE_MID"],
        "suit_light": PAL["SLATE_LIGHT"],
        "helm_dark": PAL["LEAF_DEEP"],
        "helm_mid": PAL["SLATE_DARK"],
        "visor": PAL["LEAF_BRIGHT"],
        "visor_hi": PAL["LEAF_HIGH"],
        "core": PAL["CRIMSON"],
        "belt": PAL["CRIMSON"],
        "boot": PAL["SLATE_DARK"],
        "boot_hi": PAL["CRIMSON_DARK"],
        "glove": PAL["SLATE_DARK"],
        "glove_hi": PAL["CRIMSON"],
        "scarf": PAL["CRIMSON"],
        "style": "ninja",
    },
    "cyber-knight": {
        "suit_dark": PAL["SLATE_MID"],
        "suit_mid": PAL["SLATE_LIGHT"],
        "suit_light": PAL["STEEL"],
        "helm_dark": PAL["SLATE_MID"],
        "helm_mid": PAL["STEEL"],
        "visor": PAL["CRIMSON"],
        "visor_hi": PAL["RED_HIGH"],
        "core": PAL["LAMP_GLOW"],
        "belt": PAL["SLATE_DARK"],
        "boot": PAL["SLATE_MID"],
        "boot_hi": PAL["SPECULAR"],
        "glove": PAL["SLATE_MID"],
        "glove_hi": PAL["SPECULAR"],
        "scarf": PAL["CRIMSON"],
        "style": "knight",
    },
    "golden-runner": {
        "suit_dark": PAL["WOOD_LIGHT"],
        "suit_mid": PAL["OCHRE"],
        "suit_light": PAL["GOLD"],
        "helm_dark": PAL["WOOD_DARK"],
        "helm_mid": PAL["GOLD"],
        "visor": PAL["CYAN"],
        "visor_hi": PAL["ICE"],
        "core": PAL["WHITE"],
        "belt": PAL["WOOD_DARK"],
        "boot": PAL["WOOD_DARK"],
        "boot_hi": PAL["GOLD"],
        "glove": PAL["WOOD_DARK"],
        "glove_hi": PAL["GOLD"],
        "scarf": PAL["LAMP_GLOW"],
        "style": "solar",
    },
}


def draw_fist(c: Image.Image, x: int, y: int, theme: dict, w: int = 4, h: int = 4):
    """Draws a crisp 16-bit clenched gauntlet/glove with highlight and cuff."""
    fill_rect(c, x, y, w, h, theme["glove"])
    # Knuckle / upper highlight
    fill_rect(c, x, y, w, 1, theme["glove_hi"])
    # Palm shadow
    fill_rect(c, x, y + h - 1, w, 1, theme["suit_dark"])


def draw_player_frame(theme: dict, frame_idx: int) -> Image.Image:
    """Draws a single 32x48 right-facing character frame with weapon-holding arms."""
    c = new_canvas(32, 48)
    style = theme["style"]

    lean_x = 0
    bob_y = 0
    back_leg = (-2, 0)
    front_leg = (3, 0)
    back_arm_pose = "counter" # or "raised", "back", "wall"
    scarf_wave = 0

    if frame_idx in (0, 1, 2, 3):
        # Idle breathing
        bob_y = 1 if frame_idx in (1, 2) else 0
        scarf_wave = 1 if frame_idx in (2, 3) else 0
        back_leg = (-3, 0)
        front_leg = (2, 0)
        back_arm_dx = -4
        back_arm_dy = bob_y
    elif 4 <= frame_idx <= 9:
        step = frame_idx - 4
        lean_x = 1
        # Run stride cycle
        run_poses = [
            # bob_y, bldx, bldy, fldx, fldy, back_arm_dx
            (0, -6, -2, 5, 0, 4),
            (1, -3, 0, 3, -1, 2),
            (0, 1, -3, -2, 0, -3),
            (0, 5, 0, -6, -2, -5),
            (1, 3, -1, -3, 0, -2),
            (0, -2, 0, 1, -3, 3),
        ]
        by, bldx, bldy, fldx, fldy, badx = run_poses[step]
        bob_y = by
        back_leg = (bldx, bldy)
        front_leg = (fldx, fldy)
        back_arm_dx = badx
        back_arm_dy = bob_y - 1
        scarf_wave = (step % 3) - 1
    elif frame_idx == 10:
        # Jump
        bob_y = -2
        lean_x = 1
        back_leg = (-4, -3)
        front_leg = (4, -5)
        back_arm_dx = -5
        back_arm_dy = 2
        scarf_wave = 2
    elif frame_idx == 11:
        # Fall
        bob_y = -1
        back_leg = (-3, -1)
        front_leg = (3, -3)
        back_arm_dx = -5
        back_arm_dy = -2
        scarf_wave = -3
    elif frame_idx == 12:
        # Attack 12: Windup (pulling weapon back)
        lean_x = -1
        bob_y = 1
        back_leg = (-4, 0)
        front_leg = (3, 0)
        back_arm_dx = 3 # counter-balances forward
        back_arm_dy = 1
        scarf_wave = -1
    elif frame_idx == 13:
        # Attack 13: Lunge Strike / Thrust
        lean_x = 2
        bob_y = 1
        back_leg = (-5, 0)
        front_leg = (5, 0)
        back_arm_dx = -7 # flung back for torque
        back_arm_dy = 1
        scarf_wave = 2
    elif frame_idx == 14:
        # Attack 14: Follow-through
        lean_x = 1
        bob_y = 0
        back_leg = (-4, 0)
        front_leg = (4, 0)
        back_arm_dx = -5
        back_arm_dy = 0
        scarf_wave = 1
    else:
        # Frame 15: Wall-slide
        lean_x = -1
        bob_y = -1
        back_leg = (-3, -2)
        front_leg = (2, -4)
        back_arm_dx = -4
        back_arm_dy = -2
        scarf_wave = -2

    cx = 15 + lean_x
    head_y = 6 + bob_y
    torso_y = 20 + bob_y

    # --- 1. Scarf / Cape / Plume behind body ---
    if style == "ninja":
        fill_rect(c, cx - 9, torso_y - 1 + scarf_wave, 6, 3, theme["scarf"])
        fill_rect(c, cx - 12, torso_y + 1 + scarf_wave, 5, 2, PAL["CRIMSON_DARK"])
    elif style == "knight":
        fill_rect(c, cx - 6, head_y - 3, 7, 3, theme["scarf"])
        fill_rect(c, cx - 9, head_y - 1 + scarf_wave, 5, 3, PAL["CRIMSON_DARK"])
    elif style == "solar":
        fill_rect(c, cx - 8, torso_y + 1, 5, 11 + scarf_wave, PAL["OCHRE"])
        fill_rect(c, cx - 7, torso_y + 2, 3, 8, PAL["LAMP_GLOW"])
    else:
        fill_rect(c, cx - 8, torso_y - 1 + scarf_wave, 5, 3, theme["scarf"])
        fill_rect(c, cx - 10, torso_y + 1 + scarf_wave, 3, 2, PAL["COBALT"])

    # --- 2. Back Arm (behind torso/legs) ---
    if frame_idx != 15:
        ba_x = cx + back_arm_dx
        ba_y = torso_y + 2 + back_arm_dy
        fill_rect(c, ba_x - 1, ba_y, 4, 7, theme["suit_dark"])
        draw_fist(c, ba_x - 1, ba_y + 6, theme, 4, 3)

    # --- 3. Legs ---
    for idx, (ldx, ldy) in enumerate([back_leg, front_leg]):
        is_front = idx == 1
        lx = cx + ldx - 2
        foot_bottom = 47 + ldy
        leg_top = torso_y + 13
        leg_h = max(4, foot_bottom - leg_top - 4)
        pant_col = theme["suit_mid"] if is_front else theme["suit_dark"]
        boot_col = theme["boot_hi"] if is_front else theme["boot"]
        fill_rect(c, lx, leg_top, 5, leg_h, pant_col)
        fill_rect(c, lx, foot_bottom - 4, 6, 4, boot_col)
        fill_rect(c, lx + 1, foot_bottom - 4, 4, 1, theme["suit_light"])

    # --- 4. Torso ---
    fill_rect(c, cx - 5, torso_y, 11, 14, theme["suit_mid"])
    fill_rect(c, cx - 5, torso_y, 3, 13, theme["suit_dark"])
    fill_rect(c, cx + 2, torso_y + 1, 3, 10, theme["suit_light"])
    if style in ("knight", "solar"):
        fill_rect(c, cx - 7, torso_y, 15, 4, theme["suit_light"])
        fill_rect(c, cx - 6, torso_y + 1, 13, 1, PAL["SPECULAR"] if style == "knight" else PAL["LAMP_CORE"])
    # Chest core emblem
    fill_rect(c, cx, torso_y + 4, 3, 3, theme["core"])
    px(c, cx + 1, torso_y + 4, PAL["WHITE"])
    # Belt
    fill_rect(c, cx - 5, torso_y + 11, 11, 3, theme["belt"])
    fill_rect(c, cx + 1, torso_y + 11, 3, 2, PAL["GOLD"])

    # --- 5. Head / Helmet (13x14, facing right) ---
    fill_rect(c, cx - 5, head_y + 1, 12, 12, theme["helm_mid"])
    fill_rect(c, cx - 4, head_y, 10, 13, theme["helm_mid"])
    fill_rect(c, cx - 5, head_y + 2, 3, 10, theme["helm_dark"])
    fill_rect(c, cx - 3, head_y + 1, 7, 2, theme["suit_light"])
    if style == "solar":
        fill_rect(c, cx - 6, head_y + 2, 3, 5, PAL["LAMP_GLOW"])
        px(c, cx - 7, head_y + 1, PAL["WHITE"])
    elif style == "knight":
        fill_rect(c, cx + 1, head_y - 1, 4, 3, PAL["GOLD"])

    # Visor
    fill_rect(c, cx - 2, head_y + 4, 9, 6, PAL["INK"])
    if style == "knight":
        fill_rect(c, cx - 1, head_y + 5, 8, 2, theme["visor"])
        fill_rect(c, cx + 3, head_y + 5, 2, 5, theme["visor"])
        px(c, cx + 4, head_y + 5, theme["visor_hi"])
    elif style == "ninja":
        fill_rect(c, cx - 1, head_y + 6, 8, 2, theme["visor"])
        fill_rect(c, cx + 3, head_y + 6, 3, 1, theme["visor_hi"])
    else:
        fill_rect(c, cx - 1, head_y + 5, 8, 4, theme["visor"])
        fill_rect(c, cx, head_y + 5, 4, 2, theme["visor_hi"])
        px(c, cx + 1, head_y + 5, PAL["WHITE"])

    # --- 6. Front Arm: Sculpted for Holding Weapons at Hand Anchors ---
    shoulder_x = cx + 1
    shoulder_y = torso_y + 2

    if frame_idx in (0, 1, 2, 3):
        # Idle (0..3): Shoulder -> bent upper arm -> forearm reaching forward -> fist at (19, 28)
        # Anchor is at (19, 28 + bob_y)
        fist_x = 18
        fist_y = 27 + (1 if frame_idx == 2 else 0)
        # Shoulder joint
        fill_rect(c, shoulder_x, shoulder_y, 4, 3, theme["suit_light"])
        # Upper arm angling down & forward
        fill_rect(c, shoulder_x + 1, shoulder_y + 2, 3, 3, theme["suit_light"])
        # Forearm reaching forward to fist
        fill_rect(c, shoulder_x + 2, shoulder_y + 4, 3, 3, theme["suit_mid"])
        # Clenched glove/fist wrapped around the weapon grip at (19, 28)
        draw_fist(c, fist_x - 1, fist_y - 1, theme, 4, 4)

    elif 4 <= frame_idx <= 9:
        # Run cycle (4..9): Dynamic weapon-carry posture
        step = frame_idx - 4
        # Anchors: 4: (21, 27), 5: (20, 27), 6: (19, 28), 7: (21, 27), 8: (20, 27), 9: (19, 28)
        anchors_run = [(21, 27), (20, 27), (19, 28), (21, 27), (20, 27), (19, 28)]
        ax, ay = anchors_run[step]
        # Shoulder
        fill_rect(c, shoulder_x, shoulder_y, 4, 3, theme["suit_light"])
        # Arm connects from shoulder to anchor
        mid_x = (shoulder_x + ax - 2) // 2
        mid_y = (shoulder_y + ay - 2) // 2
        fill_rect(c, shoulder_x + 1, shoulder_y + 2, 3, 3, theme["suit_light"])
        fill_rect(c, mid_x, mid_y, 4, 3, theme["suit_mid"])
        # Fist at anchor
        draw_fist(c, ax - 2, ay - 2, theme, 4, 4)

    elif frame_idx == 10:
        # Jump: Raised arm ready to strike, fist at (21, 22)
        fill_rect(c, shoulder_x, shoulder_y - 1, 4, 3, theme["suit_light"])
        fill_rect(c, shoulder_x + 1, shoulder_y, 4, 3, theme["suit_mid"])
        draw_fist(c, 19, 20, theme, 4, 4)

    elif frame_idx == 11:
        # Fall: Fist at (21, 24)
        fill_rect(c, shoulder_x, shoulder_y, 4, 3, theme["suit_light"])
        fill_rect(c, shoulder_x + 1, shoulder_y + 2, 4, 3, theme["suit_mid"])
        draw_fist(c, 19, 22, theme, 4, 4)

    elif frame_idx == 12:
        # Attack 12: Windup! Front arm reaches backward over the shoulder to fist at (6, 20)
        # Front arm drawn in front of body reaching back-upward
        fill_rect(c, cx - 3, torso_y + 1, 4, 4, theme["suit_light"])
        fill_rect(c, cx - 6, torso_y, 4, 4, theme["suit_mid"])
        # Glove holding weapon hilt at anchor (6, 20)
        draw_fist(c, 5, 18, theme, 4, 4)

    elif frame_idx == 13:
        # Attack 13: Full lunge thrust/strike! Arm fully extended horizontally to fist at (27, 25)
        # Bicep from shoulder
        fill_rect(c, cx + 2, torso_y + 2, 4, 4, theme["suit_light"])
        # Extended forearm
        fill_rect(c, cx + 6, torso_y + 2, 5, 4, theme["suit_mid"])
        # Wrist / Gauntlet cuff
        fill_rect(c, cx + 10, torso_y + 2, 2, 4, theme["glove_hi"])
        # Closed fist gripping at (27, 25) (x: 25..28, y: 23..26)
        draw_fist(c, 25, 23, theme, 4, 4)

    elif frame_idx == 14:
        # Attack 14: Follow-through! Arm swung down and across with fist at (23, 29)
        fill_rect(c, cx + 1, torso_y + 3, 4, 4, theme["suit_light"])
        fill_rect(c, cx + 4, torso_y + 6, 4, 4, theme["suit_mid"])
        # Fist at (23, 29)
        draw_fist(c, 21, 27, theme, 4, 4)

    else:
        # Frame 15: Wall-slide
        # Right hand braces against the wall (x=21..24, y=24..27)
        fill_rect(c, cx + 1, torso_y + 2, 4, 3, theme["suit_light"])
        fill_rect(c, cx + 4, torso_y + 3, 4, 3, theme["suit_mid"])
        # Wall palm/hand bracing
        draw_fist(c, cx + 6, torso_y + 4, theme, 4, 4)
        # Left hand resting at waist/scabbard (11, 27)
        draw_fist(c, 9, 25, theme, 4, 4)

    return auto_outline(c, PAL["INK"], keep_bottom_flat=True)


def generate_player_skins() -> None:
    for skin_id, theme in SKIN_THEMES.items():
        frames = [draw_player_frame(theme, i) for i in range(16)]
        sheet = make_sheet(frames)
        out_path = os.path.join(CHAR_DIR, f"player-skin-{skin_id}.png")
        sheet.save(out_path)
        print(f"Generated {out_path} ({sheet.size})")


if __name__ == "__main__":
    generate_player_skins()
