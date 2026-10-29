"""Builds the player skin sheets (public/assets/characters/player-skin-<id>.png, 256x384).

  python tools/art/build_player.py            # build, pack and write the sheets
  python tools/art/build_player.py --preview  # build and pack into tools/art/out only

1. Cuts head / body / legs of each skin out of its source sheet (tools/art/source/, frame 0)
   and samples the colours of its limbs.
2. Writes tools/art/out/player.px.js = palette + SKINS data + tools/art/player-poses.js.
3. Runs pxl, then packs every frame into the sheet grid: row = animation, column = frame,
   cell (col*32, row*48). Layout is the contract in docs/plans/2026-10-30-player-sprite-rows.md.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'tools' / 'art'
OUT = ART / 'out'
SKINS = ['cyber-blue', 'neon-ninja', 'cyber-knight', 'golden-runner']
COLUMNS = 8
CELL_W, CELL_H = 32, 48
ROWS = [('idle', 4), ('run', 8), ('air', 5), ('attack', 6), ('tool', 6), ('wall', 2), ('hurt', 3), ('faint', 6)]

# Sample points in frame 0 of every skin (the layouts are the same, only colours and trims differ)
SAMPLES = {
    'outline': (9, 38), 'backFill': (12, 38), 'frontFill': (17, 38), 'backToe': (12, 43), 'frontToe': (17, 43),
    'backBoot': (12, 44), 'frontBoot': (17, 44), 'sleeve': (14, 24), 'sleeveHi': (19, 24),
    'gloveMid': (18, 27), 'gloveBot': (18, 29),
}
PALETTE_KEYS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


def hexc(px):
    return '#%02x%02x%02x' % px[:3]


def build_source():
    sheets = {s: Image.open(ART / 'source' / f'player-skin-{s}.png').convert('RGBA') for s in SKINS}
    keys = {}

    def key(px):
        if px[3] == 0:
            return '.'
        h = hexc(px)
        if h not in keys:
            keys[h] = PALETTE_KEYS[len(keys)]
        return keys[h]

    def grid(im, y0, y1, skip=None):
        rows = []
        for y in range(y0, y1 + 1):
            row = ''
            for x in range(CELL_W):
                row += '.' if skip and skip(x, y) else key(im.getpixel((x, y)))
            rows.append(row)
        return rows

    skins_js = []
    for s, im in sheets.items():
        # Head: rows 0-18 (the bottom row only from x=9, its left part is the body's neck)
        head = grid(im, 0, 18, skip=lambda x, y: y == 18 and x < 9)
        body = grid(im, 18, 33, skip=lambda x, y: y == 18 and x >= 9)
        legs = grid(im, 34, 46)
        squat = legs[:5] + legs[6:]
        colors = {k: hexc(im.getpixel(v)) for k, v in SAMPLES.items()}
        tpl = lambda rows: '`\n' + '\n'.join('  ' + r for r in rows) + '`'
        skins_js.append(
            f'  {{ id: "{s}", colors: {colors!r},\n    head: {tpl(head)},\n    body: {tpl(body)},\n    legs: {tpl(legs)},\n    legsSquat: {tpl(squat)} }}'
            .replace("'", '"'))
    pal = ',\n'.join(f'  {k}: "{h}"' for h, k in keys.items())
    return f'pal({{\n{pal}\n}})\n\nconst SKINS = [\n' + ',\n'.join(skins_js) + '\n]\n\n'


# Animation timing, and the angle the held item points in each frame (0 = up, + = towards the facing side)
ANIMATIONS = {
    'idle':   {'fps': 6,  'loop': True,  'angles': [30, 30, 30, 30]},
    'run':    {'fps': 12, 'loop': True,  'angles': [45] * 8},
    'air':    {'fps': 0,  'loop': False, 'angles': [20, 10, 0, 20, 30]},
    'attack': {'fps': 24, 'loop': False, 'angles': [-20, -60, 45, 90, 135, 60]},
    'tool':   {'fps': 16, 'loop': False, 'angles': [45, -20, -50, 100, 120, 45]},
    'wall':   {'fps': 8,  'loop': True,  'angles': [0, 0]},
    'hurt':   {'fps': 12, 'loop': False, 'angles': [20, 60, 30]},
    'faint':  {'fps': 8,  'loop': False, 'angles': [30, 30, 20, 10, 0, 0], 'hidden': True},
}


def find_fist(sheet, row, col, glove_color, below_color):
    """The fist is the dark glove block (5 wide, 2 tall) of the arm layer, or else the 4-wide pocket on the torso.

    A boot is also dark and 5-6 wide, so the block must have the glove's blue row right below it
    (a boot has a third dark row there instead).
    """
    def px(x, y):
        p = sheet.getpixel((col * CELL_W + x, row * CELL_H + y))
        return hexc(p) if p[3] else None

    for width in (5, 4):
        for y in range(0, 44):
            for x in range(0, CELL_W - width + 1):
                dark = all(px(x + i, y + j) == glove_color for i in range(width) for j in (0, 1))
                cap = all(px(x + i, y + 2) == below_color for i in range(width))
                if dark and cap:
                    return [x + width / 2, y + 1]
    raise SystemExit(f'no fist found in row {row} col {col}')


def write_animations(sheet, glove_color, below_color):
    animations = {}
    for r, (name, frames) in enumerate(ROWS):
        spec = ANIMATIONS[name]
        assert len(spec['angles']) == frames, name
        anchors = []
        for c in range(frames):
            x, y = find_fist(sheet, r, c, glove_color, below_color)
            anchors.append({'x': x, 'y': y, 'angle': spec['angles'][c], 'front': True, **({'hidden': True} if spec.get('hidden') else {})})
        animations[name] = {'row': r, 'frames': frames, 'fps': spec['fps'], 'loop': spec['loop'], 'anchors': anchors}
    data = {'frame': {'width': CELL_W, 'height': CELL_H, 'columns': COLUMNS}, 'animations': animations}
    path = ROOT / 'public' / 'data' / 'player-animations.json'
    # one animation per block, one anchor per line, so a change shows up as a small diff
    lines = ['{', '  "frame": ' + json.dumps(data['frame']) + ',', '  "animations": {']
    for i, (name, a) in enumerate(animations.items()):
        head = {k: v for k, v in a.items() if k != 'anchors'}
        lines.append(f'    "{name}": {json.dumps(head)[:-1]}, "anchors": [')
        lines.append(',\n'.join('      ' + json.dumps(an) for an in a['anchors']))
        lines.append('    ]}' + (',' if i < len(animations) - 1 else ''))
    lines += ['  }', '}', '']
    path.write_text('\n'.join(lines), encoding='utf-8', newline='\n')
    print('wrote', path.relative_to(ROOT))


def main():
    preview = '--preview' in sys.argv
    OUT.mkdir(exist_ok=True)
    src = build_source() + (ART / 'player-poses.js').read_text(encoding='utf-8')
    (OUT / 'player.px.js').write_text(src, encoding='utf-8')

    pxl = ROOT / '.claude' / 'skills' / 'pxl-pixel-art' / 'bin' / 'pxl.js'
    subprocess.run(['node', str(pxl), 'build', str(OUT / 'player.px.js'), '--out', str(OUT), '--no-preview'],
                   check=True, cwd=ROOT, stdout=subprocess.DEVNULL)

    target = OUT / 'sheets' if preview else ROOT / 'public' / 'assets' / 'characters'
    target.mkdir(exist_ok=True, parents=True)
    for s in SKINS:
        sheet = Image.new('RGBA', (COLUMNS * CELL_W, len(ROWS) * CELL_H), (0, 0, 0, 0))
        for r, (anim, frames) in enumerate(ROWS):
            for i in range(frames):
                frame = Image.open(OUT / 'sprites' / f'hero_{s}_{anim}_{i}.png').convert('RGBA')
                assert frame.size == (CELL_W, CELL_H), (s, anim, i, frame.size)
                sheet.alpha_composite(frame, (i * CELL_W, r * CELL_H))
        sheet.save(target / f'player-skin-{s}.png')
        print('wrote', (target / f'player-skin-{s}.png').relative_to(ROOT), sheet.size)
        if s == 'cyber-blue' and not preview:
            # every skin shares the layout, so the first skin's gloves give the anchors
            write_animations(sheet, '#083344', '#0369a1')


if __name__ == '__main__':
    main()
