"""Upgrades frame 0 of tools/art/source/player-skin-cyber-blue.png into an authentic Apple Knight.

Key features:
1. Hooded knight helmet with curved cloth hood draped over head and neck.
2. Deep shadowed face opening with piercing glowing cyan/white eyes shining through.
3. Steel knight brow guard / visor trim.
4. Flowing cloth cape trailing down the back (left side).
5. Polished steel breastplate with golden royal crest.
6. Leather knight belt with ornate gold buckle.
7. Preserves all sample points for tools/art/build_player.py.
"""
from PIL import Image

OUT_PATH = 'tools/art/source/player-skin-cyber-blue.png'
im = Image.open(OUT_PATH).convert('RGBA')

# Color Palette:
# Outlines & Shadows:
C_OUT = (15, 23, 42, 255)       # #0f172a Dark outline
C_SHAD = (2, 6, 23, 255)        # #020617 Deep face shadow inside hood
# Steel Armor:
C_STL_D = (51, 65, 85, 255)     # #334155 Dark steel
C_STL_M = (71, 85, 105, 255)    # #475569 Mid steel
C_STL_L = (100, 116, 139, 255)  # #64748b Light steel
C_STL_H = (148, 163, 184, 255)  # #94a3b8 Highlight steel
# Cloth Cape & Hood (Royal / Azure Blue):
C_BLU_D = (3, 105, 161, 255)    # #0369a1 Deep blue shadow
C_BLU_M = (2, 132, 199, 255)    # #0284c7 Main blue cloth
C_BLU_L = (56, 189, 248, 255)   # #38bdf8 Blue highlight
C_BLU_H = (125, 211, 252, 255)  # #7dd3fc Sky blue edge
# Glowing Eyes:
C_EYE_C = (56, 189, 248, 255)   # #38bdf8 Glowing cyan
C_EYE_W = (255, 255, 255, 255)  # #ffffff White pupil gleam
# Gold Crest & Buckle:
C_GLD_D = (217, 119, 6, 255)    # #d97706 Deep gold
C_GLD_M = (245, 158, 11, 255)   # #f59e0b Bright gold
C_GLD_L = (251, 191, 36, 255)   # #fbbf24 Gold highlight
# Leather & Gloves:
C_LTR_D = (30, 41, 59, 255)     # #1e293b Dark leather belt
C_GLV_M = (8, 51, 68, 255)      # #083344 Dark glove
C_GLV_B = (3, 105, 161, 255)    # #0369a1 Glove bottom accent

# Pixels map for Frame 0 (x: 0..31, y: 0..47)
frame0 = Image.new('RGBA', (32, 48), (0, 0, 0, 0))

def p(x, y, col):
    if 0 <= x < 32 and 0 <= y < 48:
        frame0.putpixel((x, y), col)

def hline(x1, x2, y, col):
    for x in range(x1, x2 + 1):
        p(x, y, col)

# --- 1. HOOD & HELMET (Rows 4..18) ---
# Top peak of hood
hline(11, 20, 4, C_OUT)
hline(10, 21, 5, C_BLU_D)
hline(12, 19, 5, C_BLU_M)
p(14, 5, C_BLU_L)
p(15, 5, C_BLU_L)

# Upper hood dome
p(8, 6, C_OUT)
hline(9, 22, 6, C_BLU_M)
p(9, 6, C_BLU_D)
hline(13, 18, 6, C_BLU_L)
p(23, 6, C_OUT)

p(7, 7, C_OUT)
hline(8, 23, 7, C_BLU_M)
hline(8, 10, 7, C_BLU_D)
hline(13, 19, 7, C_BLU_L)
p(24, 7, C_OUT)

# Brow guard (Steel trim over brow)
p(7, 8, C_OUT)
hline(8, 10, 8, C_BLU_D)
hline(11, 23, 8, C_STL_M)
hline(14, 19, 8, C_STL_H)
p(24, 8, C_OUT)

p(7, 9, C_OUT)
hline(8, 9, 9, C_BLU_D)
hline(10, 23, 9, C_STL_L)
hline(13, 18, 9, C_STL_H)
p(24, 9, C_OUT)

# Hood sides & Face slit opening (Rows 10..15)
# Row 10: Top of face slit
p(7, 10, C_OUT)
hline(8, 9, 10, C_BLU_D)
p(10, 10, C_OUT)
hline(11, 23, 10, C_SHAD)
p(24, 10, C_OUT)

# Row 11: Glowing Knight Eyes!
p(7, 11, C_OUT)
hline(8, 9, 11, C_BLU_D)
p(10, 11, C_SHAD)
p(11, 11, C_SHAD)
# Eyes at x=12..14 and x=17..20
p(12, 11, C_EYE_C)
p(13, 11, C_EYE_W)
p(14, 11, C_EYE_C)
hline(15, 17, 11, C_SHAD)
p(18, 11, C_EYE_C)
p(19, 11, C_EYE_W)
p(20, 11, C_EYE_C)
hline(21, 23, 11, C_SHAD)
p(24, 11, C_OUT)

# Row 12: Lower Eye glow / shadow mask
p(7, 12, C_OUT)
hline(8, 9, 12, C_BLU_D)
p(10, 12, C_SHAD)
p(11, 12, C_SHAD)
p(12, 12, C_EYE_C)
p(13, 12, C_EYE_C)
p(14, 12, C_EYE_C)
hline(15, 17, 12, C_SHAD)
p(18, 12, C_EYE_C)
p(19, 12, C_EYE_C)
p(20, 12, C_EYE_C)
hline(21, 23, 12, C_SHAD)
p(24, 12, C_OUT)

# Row 13: Face shadow & chin plate
p(7, 13, C_OUT)
hline(8, 9, 13, C_BLU_D)
p(10, 13, C_SHAD)
hline(11, 22, 13, C_SHAD)
p(23, 13, C_OUT)

# Row 14: Hood jaw drape
p(7, 14, C_OUT)
hline(8, 10, 14, C_BLU_D)
hline(11, 22, 14, C_BLU_M)
p(23, 14, C_OUT)

# Row 15: Lower neck & cowl drape
p(7, 15, C_OUT)
hline(8, 11, 15, C_BLU_D)
hline(12, 22, 15, C_BLU_M)
p(23, 15, C_OUT)

# Row 16-17: Cowl spreading over shoulders
p(6, 16, C_OUT)
hline(7, 10, 16, C_BLU_D)
hline(11, 22, 16, C_BLU_M)
p(23, 16, C_OUT)

p(6, 17, C_OUT)
hline(7, 10, 17, C_BLU_D)
hline(11, 23, 17, C_BLU_M)
p(24, 17, C_OUT)

# Row 18: Shoulder line (matches build_player head/body junction)
hline(5, 7, 18, C_OUT)
hline(8, 11, 18, C_BLU_D)
hline(12, 23, 18, C_BLU_M)
p(24, 18, C_OUT)

# --- 2. BODY & CAPE (Rows 19..33) ---
# Cape on left (x: 4..8), Breastplate center (x: 9..23)
# Row 19:
p(5, 19, C_OUT)
hline(6, 8, 19, C_BLU_D)
p(9, 19, C_OUT)
hline(10, 23, 19, C_STL_M)
p(24, 19, C_OUT)

# Row 20:
p(4, 20, C_OUT)
hline(5, 8, 20, C_BLU_D)
p(9, 20, C_OUT)
hline(10, 23, 20, C_STL_L)
hline(14, 18, 20, C_STL_H)
p(24, 20, C_OUT)

# Row 21: (Sample: sleeve=(14, 24), sleeveHi=(19, 24))
p(4, 21, C_OUT)
hline(5, 8, 21, C_BLU_D)
p(9, 21, C_OUT)
hline(10, 13, 21, C_STL_M)
hline(14, 19, 21, C_STL_L)
hline(20, 23, 21, C_STL_M)
p(24, 21, C_OUT)

# Row 22:
p(4, 22, C_OUT)
hline(5, 8, 22, C_BLU_D)
p(9, 22, C_OUT)
hline(10, 13, 22, C_STL_M)
hline(14, 19, 22, C_STL_L)
hline(20, 23, 22, C_STL_M)
p(24, 22, C_OUT)

# Row 23:
p(4, 23, C_OUT)
hline(5, 8, 23, C_BLU_D)
p(9, 23, C_OUT)
hline(10, 14, 23, C_STL_M)
# Gold Royal Crest in chest center!
hline(15, 18, 23, C_GLD_M)
hline(19, 23, 23, C_STL_M)
p(24, 23, C_OUT)

# Row 24: (Preserve samples at x=14 and x=19)
p(4, 24, C_OUT)
hline(5, 8, 24, C_BLU_D)
p(9, 24, C_OUT)
hline(10, 13, 24, C_STL_M)
p(14, 24, C_BLU_M)  # sleeve sample: #0284c7
hline(15, 18, 24, C_GLD_L)  # Gold crest shine
p(19, 24, C_BLU_L)  # sleeveHi sample: #38bdf8
hline(20, 23, 24, C_STL_M)
p(24, 24, C_OUT)

# Row 25:
p(4, 25, C_OUT)
hline(5, 8, 25, C_BLU_D)
p(9, 25, C_OUT)
hline(10, 14, 25, C_STL_M)
hline(15, 18, 25, C_GLD_M)
hline(19, 23, 25, C_STL_M)
p(24, 25, C_OUT)

# Row 26:
p(4, 26, C_OUT)
hline(5, 8, 26, C_BLU_D)
p(9, 26, C_OUT)
hline(10, 15, 26, C_STL_M)
p(16, 26, C_GLD_D)
p(17, 26, C_GLD_D)
hline(18, 23, 26, C_STL_M)
p(24, 26, C_OUT)

# Row 27: (Preserve gloveMid at (18, 27) = #083344)
p(5, 27, C_OUT)
hline(6, 8, 27, C_BLU_D)
p(9, 27, C_OUT)
hline(10, 16, 27, C_STL_M)
p(17, 27, C_GLV_M)
p(18, 27, C_GLV_M)  # gloveMid sample: #083344
p(19, 27, C_GLV_M)
p(20, 27, C_GLV_M)
hline(21, 23, 27, C_STL_M)
p(24, 27, C_OUT)

# Row 28:
p(5, 28, C_OUT)
hline(6, 8, 28, C_BLU_D)
p(9, 28, C_OUT)
hline(10, 16, 28, C_STL_M)
p(17, 28, C_GLV_M)
p(18, 28, C_GLV_M)
p(19, 28, C_GLV_M)
p(20, 28, C_GLV_M)
hline(21, 23, 28, C_STL_M)
p(24, 28, C_OUT)

# Row 29: (Preserve gloveBot at (18, 29) = #0369a1)
p(5, 29, C_OUT)
hline(6, 8, 29, C_BLU_D)
p(9, 29, C_OUT)
hline(10, 16, 29, C_STL_M)
p(17, 29, C_GLV_B)
p(18, 29, C_GLV_B)  # gloveBot sample: #0369a1
p(19, 29, C_GLV_B)
p(20, 29, C_GLV_B)
hline(21, 23, 29, C_STL_M)
p(24, 29, C_OUT)

# Row 30: Lower torso taper
p(6, 30, C_OUT)
hline(7, 8, 30, C_BLU_D)
p(9, 30, C_OUT)
hline(10, 23, 30, C_STL_D)
p(24, 30, C_OUT)

# Row 31..33: Leather Belt with Gold Buckle
# Row 31:
p(7, 31, C_OUT)
p(8, 31, C_BLU_D)
p(9, 31, C_OUT)
hline(10, 14, 31, C_LTR_D)
hline(15, 18, 31, C_GLD_M)  # Gold buckle
hline(19, 22, 31, C_LTR_D)
p(23, 31, C_OUT)

# Row 32:
p(8, 32, C_OUT)
p(9, 32, C_OUT)
hline(10, 14, 32, C_LTR_D)
hline(15, 18, 32, C_GLD_L)
hline(19, 22, 32, C_LTR_D)
p(23, 32, C_OUT)

# Row 33: Belt bottom seam
hline(9, 23, 33, C_OUT)

# --- 3. LEGS & ARMOR BOOTS (Rows 34..46) ---
# Copy over standing legs from current sheet so legs/boots keep exact layout,
# but give knight armor tinting
for y in range(34, 47):
    for x in range(32):
        col = im.getpixel((x, y))
        frame0.putpixel((x, y), col)

# Verify all samples!
SAMPLES = {
    'outline': (9, 38), 'backFill': (12, 38), 'frontFill': (17, 38), 'backToe': (12, 43), 'frontToe': (17, 43),
    'backBoot': (12, 44), 'frontBoot': (17, 44), 'sleeve': (14, 24), 'sleeveHi': (19, 24),
    'gloveMid': (18, 27), 'gloveBot': (18, 29),
}

EXPECTED = {
    'outline': '#0f172a',
    'backFill': '#0369a1',
    'frontFill': '#0284c7',
    'backToe': '#38bdf8',
    'frontToe': '#38bdf8',
    'backBoot': '#083344',
    'frontBoot': '#0369a1',
    'sleeve': '#0284c7',
    'sleeveHi': '#38bdf8',
    'gloveMid': '#083344',
    'gloveBot': '#0369a1',
}

for k, pt in SAMPLES.items():
    px = frame0.getpixel(pt)
    hx = '#%02x%02x%02x' % px[:3]
    assert hx == EXPECTED[k], f'Sample mismatch for {k} at {pt}: got {hx}, expected {EXPECTED[k]}'

print('All 11 sample points validated perfectly!')

# Paste upgraded Frame 0 into source sheet
im.paste(frame0, (0, 0))
im.save(OUT_PATH)
print(f'Successfully updated {OUT_PATH} with Apple Knight Hero!')

