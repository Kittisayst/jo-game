"""Upgrades frame 0 of tools/art/source/player-skin-cyber-blue.png into an authentic Adventurer (ນັກພະຈົນໄພ).

Key Adventurer Visual Features:
1. Wide-brim explorer hat (fedora / felt trail hat) with leather band, brass buckle, and turquoise feather.
2. Determined explorer face with confident eyes, hair tufts, and royal blue traveler neck scarf.
3. Rugged leather explorer vest over khaki/cream linen adventure shirt.
4. Cross-body leather satchel strap (bandolier) with brass buckle across chest.
5. Heavy leather field belt with brass buckle and hip pouch.
6. Rolled sleeves with leather explorer gloves/bracers.
7. Tough khaki explorer cargo trousers.
8. Deep trail leather boots with brass eyelets and treaded soles.
9. Preserves exact sample points for build_player.py pipeline.
"""
from PIL import Image

OUT_PATH = 'tools/art/source/player-skin-cyber-blue.png'
im = Image.open(OUT_PATH).convert('RGBA')

# Adventurer Color Palette
C_OUT    = (28, 25, 23, 255)       # #1c1917 Dark outline
C_OUT_LT = (41, 37, 36, 255)       # #292524 Softer outline

# Leather Explorer Hat & Vest (Rich saddle/chestnut leather)
C_HAT_D  = (68, 38, 20, 255)       # #442614 Deep leather shadow
C_HAT_M  = (107, 63, 32, 255)      # #6b3f20 Mid leather
C_HAT_L  = (138, 83, 44, 255)      # #8a532c Light leather
C_HAT_H  = (168, 104, 58, 255)     # #a8683a Highlight leather brim

# Hat Band & Belt Leather
C_BND_D  = (42, 24, 13, 255)       # #2a180d Darkest leather band
C_BND_M  = (61, 35, 18, 255)       # #3d2312 Band leather

# Brass / Gold Buckles
C_BRS_D  = (180, 83, 9, 255)       # #b45309 Antique bronze
C_BRS_M  = (245, 158, 11, 255)     # #f59e0b Brass / Gold
C_BRS_L  = (251, 191, 36, 255)     # #fbbf24 Bright brass

# Feather Accent on Hat
C_FTH_D  = (4, 120, 87, 255)       # #047857 Emerald shadow
C_FTH_L  = (16, 185, 129, 255)     # #10b981 Emerald bright

# Hair & Facial Features
C_HAIR_D = (45, 26, 14, 255)       # #2d1a0e Dark brown hair
C_HAIR_M = (74, 43, 24, 255)       # #4a2b18 Chestnut hair

# Face & Skin Tone
C_SKIN_D = (217, 119, 70, 255)     # #d97746 Warm shaded skin
C_SKIN_M = (245, 158, 110, 255)    # #f59e6e Natural skin
C_SKIN_L = (254, 215, 170, 255)    # #fed7aa Highlight skin
C_EYE_W  = (255, 255, 255, 255)    # Eye glint
C_EYE_P  = (15, 23, 42, 255)       # Pupil

# Traveler Neck Scarf (Vibrant Adventurer Blue)
C_SCF_D  = (3, 105, 161, 255)      # #0369a1 Deep blue
C_SCF_M  = (2, 132, 199, 255)      # #0284c7 Mid blue
C_SCF_L  = (56, 189, 248, 255)     # #38bdf8 Light blue highlight

# Linen / Khaki Adventure Shirt
C_SHR_D  = (194, 175, 138, 255)    # #c2af8a Shaded linen
C_SHR_M  = (226, 212, 181, 255)    # #e2d4b5 Mid linen
C_SHR_L  = (245, 238, 222, 255)    # #f5eedf Bright linen

# Khaki Cargo Trousers
C_PNT_D  = (115, 96, 68, 255)      # #736044 Dark khaki shadow
C_PNT_M  = (143, 117, 78, 255)     # #8f754e Back fill (backFill sample)
C_PNT_L  = (191, 164, 119, 255)    # #bfa477 Front fill (frontFill sample)
C_PNT_H  = (214, 190, 149, 255)    # #d6be95 Highlight fold

# Trail Boots & Leather Gloves
C_GLV_M  = (8, 51, 68, 255)        # #083344 Glove mid (gloveMid sample)
C_GLV_B  = (3, 105, 161, 255)      # #0369a1 Glove bottom (gloveBot sample)
C_BOT_T  = (82, 49, 26, 255)       # #52311a Boot toe (backToe/frontToe samples)
C_BOT_B  = (59, 34, 18, 255)       # #3b2212 Boot sole (backBoot/frontBoot samples)
C_BOT_D  = (38, 21, 10, 255)       # #26150a Darkest tread

frame0 = Image.new('RGBA', (32, 48), (0, 0, 0, 0))

def p(x, y, col):
    if 0 <= x < 32 and 0 <= y < 48:
        frame0.putpixel((x, y), col)

def hline(x1, x2, y, col):
    for x in range(x1, x2 + 1):
        p(x, y, col)

# --- 1. EXPLORER HAT (Rows 2..9) ---
# Crown dome (curved top of fedora/explorer hat)
hline(12, 19, 2, C_OUT)
hline(11, 20, 3, C_HAT_D)
hline(13, 18, 3, C_HAT_L)
p(15, 3, C_HAT_H)
p(16, 3, C_HAT_H)

p(10, 4, C_OUT)
hline(11, 21, 4, C_HAT_M)
hline(13, 18, 4, C_HAT_L)
p(22, 4, C_OUT)

p(9, 5, C_OUT)
hline(10, 22, 5, C_HAT_M)
hline(13, 19, 5, C_HAT_L)
p(23, 5, C_OUT)

# Hat Band (Row 6..7) with antique brass buckle and feather
p(8, 6, C_OUT)
hline(9, 23, 6, C_BND_M)
p(9, 6, C_FTH_D)
p(10, 6, C_FTH_L)       # Emerald feather
p(14, 6, C_BRS_M)       # Brass buckle on band
p(15, 6, C_BRS_L)
p(24, 6, C_OUT)

p(8, 7, C_OUT)
hline(9, 23, 7, C_BND_D)
p(10, 7, C_FTH_D)
p(14, 7, C_BRS_D)
p(15, 7, C_BRS_M)
p(24, 7, C_OUT)

# Wide Explorer Brim (Row 8..9)
hline(6, 26, 8, C_OUT)
p(5, 9, C_OUT)
hline(6, 26, 9, C_HAT_M)
hline(10, 22, 9, C_HAT_L)
hline(14, 18, 9, C_HAT_H)  # Sunlit brim front
p(27, 9, C_OUT)

# --- 2. FACE, HAIR & NECK SCARF (Rows 10..18) ---
# Row 10: Under-brim shadow & hair
p(7, 10, C_OUT)
hline(8, 10, 10, C_HAIR_D)
hline(11, 24, 10, C_SKIN_D) # Under brim shadow
p(25, 10, C_HAIR_D)
p(26, 10, C_OUT)

# Row 11: Eyes, brow, and side hair
p(7, 11, C_OUT)
hline(8, 9, 11, C_HAIR_M)
p(10, 11, C_SKIN_D)
hline(11, 24, 11, C_SKIN_M)
# Left eye
p(14, 11, C_EYE_P)
p(15, 11, C_EYE_W)
# Right eye
p(19, 11, C_EYE_P)
p(20, 11, C_EYE_W)
p(25, 11, C_HAIR_M)
p(26, 11, C_OUT)

# Row 12: Cheekbones & nose
p(8, 12, C_OUT)
hline(9, 10, 12, C_HAIR_D)
hline(11, 23, 12, C_SKIN_M)
hline(15, 17, 12, C_SKIN_L) # Nose highlight
p(24, 12, C_SKIN_D)
p(25, 12, C_OUT)

# Row 13: Mouth & confident adventurer expression
p(8, 13, C_OUT)
p(9, 13, C_HAIR_D)
hline(10, 23, 13, C_SKIN_M)
p(16, 13, C_SKIN_D)       # Mouth line
p(17, 13, C_SKIN_D)
p(24, 13, C_OUT)

# Row 14: Chin & jawline
p(9, 14, C_OUT)
hline(10, 22, 14, C_SKIN_M)
hline(14, 18, 14, C_SKIN_L)
p(23, 14, C_OUT)

# Row 15..17: Adventurer Blue Traveler Neck Scarf
hline(8, 23, 15, C_OUT)
p(8, 15, C_OUT)
hline(9, 22, 15, C_SCF_M)
hline(13, 18, 15, C_SCF_L)
p(23, 15, C_OUT)

p(8, 16, C_OUT)
hline(9, 23, 16, C_SCF_M)
hline(12, 17, 16, C_SCF_L)
p(14, 16, C_SCF_D)        # Scarf knot
p(24, 16, C_OUT)

p(8, 17, C_OUT)
hline(9, 23, 17, C_SCF_D)
hline(11, 16, 17, C_SCF_M)
p(24, 17, C_OUT)

# Row 18: Scarf tails drape over collar
p(8, 18, C_OUT)
hline(9, 23, 18, C_SCF_D)
p(13, 18, C_SCF_M)
p(14, 18, C_SCF_L)
p(24, 18, C_OUT)

# --- 3. TORSO, LEATHER VEST & SATCHEL STRAP (Rows 19..33) ---
# Row 19: Shoulders & Linen collar
p(7, 19, C_OUT)
hline(8, 10, 19, C_HAT_D)   # Leather vest shoulder
hline(11, 13, 19, C_SHR_M)  # Linen shirt collar
p(14, 19, C_BND_M)          # Satchel strap start
p(15, 19, C_BRS_M)          # Brass strap ring
hline(16, 19, 19, C_SHR_L)
hline(20, 22, 19, C_HAT_M)
p(23, 19, C_OUT)

# Row 20: Upper chest
p(7, 20, C_OUT)
hline(8, 10, 20, C_HAT_M)   # Left vest lapel
hline(11, 14, 20, C_SHR_M)
p(15, 20, C_BND_M)          # Satchel strap diagonal
hline(16, 19, 20, C_SHR_L)
hline(20, 22, 20, C_HAT_L)  # Right vest lapel
p(23, 20, C_OUT)

# Row 21: Chest & Vest pockets
p(6, 21, C_OUT)
hline(7, 10, 21, C_HAT_M)
p(9, 21, C_BND_D)           # Pocket trim
hline(11, 15, 21, C_SHR_M)
p(16, 21, C_BND_M)          # Satchel strap
hline(17, 19, 21, C_SHR_L)
hline(20, 23, 21, C_HAT_L)
p(21, 21, C_BND_D)          # Pocket trim
p(24, 21, C_OUT)

# Row 22: Mid chest with Satchel center buckle
p(6, 22, C_OUT)
hline(7, 10, 22, C_HAT_D)
hline(11, 15, 22, C_SHR_M)
p(16, 22, C_BRS_D)          # Brass satchel buckle
p(17, 22, C_BRS_L)
hline(18, 19, 22, C_SHR_L)
hline(20, 23, 22, C_HAT_M)
p(24, 22, C_OUT)

# Row 23: Lower chest
p(6, 23, C_OUT)
hline(7, 10, 23, C_HAT_M)
hline(11, 16, 23, C_SHR_M)
p(17, 23, C_BND_M)          # Satchel strap continues
p(18, 23, C_SHR_L)
hline(19, 23, 23, C_HAT_L)
p(24, 23, C_OUT)

# Row 24: Waist level (Crucial for samples: sleeve (14, 24) and sleeveHi (19, 24))
p(6, 24, C_OUT)
hline(7, 10, 24, C_HAT_D)
p(11, 24, C_SHR_D)
p(12, 24, C_SHR_M)
p(13, 24, C_SHR_M)
p(14, 24, C_HAT_M)          # SAMPLE 'sleeve': (14, 24) -> Leather vest / sleeve tone
hline(15, 17, 24, C_SHR_M)
p(18, 24, C_BND_M)          # Satchel strap
p(19, 24, C_HAT_L)          # SAMPLE 'sleeveHi': (19, 24) -> Highlight vest / sleeve
hline(20, 23, 24, C_HAT_M)
p(24, 24, C_OUT)

# Row 25: Forearms / vest lower hem
p(6, 25, C_OUT)
hline(7, 10, 25, C_HAT_M)
hline(11, 18, 25, C_SHR_M)
p(19, 25, C_BND_M)
hline(20, 23, 25, C_HAT_L)
p(24, 25, C_OUT)

# Row 26: Hands & Leather Gloves start
p(6, 26, C_OUT)
hline(7, 10, 26, C_GLV_M)
hline(11, 17, 26, C_SHR_D)
p(18, 26, C_GLV_M)
p(19, 26, C_BND_M)
hline(20, 23, 26, C_GLV_M)
p(24, 26, C_OUT)

# Row 27: Gloves mid (SAMPLE 'gloveMid': (18, 27))
p(6, 27, C_OUT)
hline(7, 10, 27, C_GLV_M)
hline(11, 17, 27, C_BND_D)   # Satchel pouch on hip
p(18, 27, C_GLV_M)          # SAMPLE 'gloveMid': (18, 27)
hline(19, 23, 27, C_GLV_M)
p(24, 27, C_OUT)

# Row 28: Gloves lower
p(6, 28, C_OUT)
hline(7, 10, 28, C_GLV_B)
hline(11, 17, 28, C_BND_D)
p(18, 28, C_GLV_B)
hline(19, 23, 28, C_GLV_B)
p(24, 28, C_OUT)

# Row 29: Gloves bottom (SAMPLE 'gloveBot': (18, 29))
p(6, 29, C_OUT)
hline(7, 10, 29, C_GLV_B)
hline(11, 17, 29, C_BND_D)
p(18, 29, C_GLV_B)          # SAMPLE 'gloveBot': (18, 29)
hline(19, 23, 29, C_GLV_B)
p(24, 29, C_OUT)

# Row 30: Belt Line upper
p(7, 30, C_OUT)
hline(8, 22, 30, C_BND_D)   # Leather belt base
p(23, 30, C_OUT)

# Row 31: Belt & Brass Belt Buckle
p(7, 31, C_OUT)
hline(8, 13, 31, C_BND_M)   # Belt leather
p(14, 31, C_BRS_D)          # Brass belt buckle
p(15, 31, C_BRS_M)
p(16, 31, C_BRS_L)
p(17, 31, C_BRS_D)
hline(18, 22, 31, C_BND_M)
p(23, 31, C_OUT)

# Row 32: Belt lower & pouch buckle
p(8, 32, C_OUT)
hline(9, 21, 32, C_BND_D)
p(11, 32, C_BRS_M)          # Side pouch brass clip
p(15, 32, C_BRS_M)          # Buckle tongue
p(22, 32, C_OUT)

# Row 33: Trousers top / pelvis
p(8, 33, C_OUT)
hline(9, 21, 33, C_PNT_D)
p(22, 33, C_OUT)

# --- 4. LEGS & KHAKI CARGO TROUSERS (Rows 34..40) ---
# Crucial samples: outline (9, 38), backFill (12, 38), frontFill (17, 38)
for y in range(34, 41):
    p(8, y, C_OUT)
    p(9, y, C_OUT)          # SAMPLE 'outline': (9, 38)
    hline(10, 13, y, C_PNT_M) # Back leg (SAMPLE 'backFill' (12, 38))
    p(14, y, C_PNT_D)       # Inseam shadow
    hline(15, 19, y, C_PNT_L) # Front leg (SAMPLE 'frontFill' (17, 38))
    p(20, y, C_PNT_H)       # Front crease highlight
    p(21, y, C_OUT)

# Add knee patch detailing
p(11, 36, C_HAT_D)
p(12, 36, C_HAT_D)
p(16, 36, C_HAT_D)
p(17, 36, C_HAT_D)
p(18, 36, C_HAT_M)

# --- 5. TRAIL LEATHER BOOTS (Rows 41..47) ---
# Crucial samples:
# backToe (12, 43), frontToe (17, 43)
# backBoot (12, 44), frontBoot (17, 44)
p(8, 41, C_OUT)
p(9, 41, C_OUT)
hline(10, 13, 41, C_BOT_T)  # Boot cuffs
p(14, 41, C_OUT)
hline(15, 20, 41, C_BOT_T)
p(21, 41, C_OUT)

p(8, 42, C_OUT)
p(9, 42, C_OUT)
hline(10, 13, 42, C_BOT_T)  # Boot shaft
p(12, 42, C_BRS_M)          # Brass eyelet
p(14, 42, C_OUT)
hline(15, 20, 42, C_BOT_T)
p(18, 42, C_BRS_M)          # Brass eyelet
p(21, 42, C_OUT)

# Row 43: Boot vamp (Toe sample level)
p(8, 43, C_OUT)
p(9, 43, C_OUT)
hline(10, 13, 43, C_BOT_T)  # SAMPLE 'backToe': (12, 43)
p(14, 43, C_OUT)
hline(15, 21, 43, C_BOT_T)  # SAMPLE 'frontToe': (17, 43)
p(22, 43, C_OUT)

# Row 44: Boot sole base (Boot sample level)
p(8, 44, C_OUT)
p(9, 44, C_OUT)
hline(10, 13, 44, C_BOT_B)  # SAMPLE 'backBoot': (12, 44)
p(14, 44, C_OUT)
hline(15, 21, 44, C_BOT_B)  # SAMPLE 'frontBoot': (17, 44)
p(22, 44, C_OUT)

# Row 45: Tread / welt
p(8, 45, C_OUT)
hline(9, 13, 45, C_BOT_D)
p(14, 45, C_OUT)
hline(15, 22, 45, C_BOT_D)
p(23, 45, C_OUT)

# Row 46: Tread bottom
p(8, 46, C_OUT)
hline(9, 13, 46, C_OUT)
p(14, 46, C_OUT)
hline(15, 22, 46, C_OUT)
p(23, 46, C_OUT)

# Validate all 11 sample points
SAMPLES = {
    'outline': (9, 38), 'backFill': (12, 38), 'frontFill': (17, 38),
    'backToe': (12, 43), 'frontToe': (17, 43),
    'backBoot': (12, 44), 'frontBoot': (17, 44),
    'sleeve': (14, 24), 'sleeveHi': (19, 24),
    'gloveMid': (18, 27), 'gloveBot': (18, 29),
}

print('=== Verifying Adventurer Sample Points ===')
for name, (x, y) in SAMPLES.items():
    color = frame0.getpixel((x, y))
    assert color[3] > 0, f'Sample point {name} at ({x}, {y}) is transparent!'
    hex_col = '#%02x%02x%02x' % color[:3]
    print(f'  {name:10s} at ({x:2d}, {y:2d}): {hex_col}')

# Paste into source sheet at frame 0
im.paste(frame0, (0, 0), frame0)
im.save(OUT_PATH)
print(f'Successfully updated {OUT_PATH} with Adventurer Frame 0!')
