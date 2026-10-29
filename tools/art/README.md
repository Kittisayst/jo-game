# Art sources

Pixel art that is drawn by code lives here, so it can be reviewed as a diff and rebuilt.

| Source | Output | Tool |
|---|---|---|
| `held-items.px.js` | `public/assets/held/*.png` (weapons/tools in the hero's hand) | pxl (`.claude/skills/pxl-pixel-art`, vendored from crsolver/claude-pxl, MIT) |
| `build_player.py` + `player-poses.js` + `source/` | `public/assets/characters/player-skin-*.png` (256×384 sheets) and `public/data/player-animations.json` | pxl + Pillow (`python tools/art/build_player.py`) |

## Rebuilding the held items

```bash
node .claude/skills/pxl-pixel-art/bin/pxl.js build tools/art/held-items.px.js --out tools/art/out
cp tools/art/out/sprites/*.png public/assets/held/
python .claude/skills/create-game-assets/scripts/asset_report.py public/assets/held/*.png --expect-size 32x32 --require-alpha
```

Look at `tools/art/out/_preview/*.png` before copying. `tools/art/out/` is not committed.
Spec (size, grip point, palette): `docs/plans/2026-10-30-held-items.md`.

## Rebuilding the player sheets

```bash
python tools/art/build_player.py            # writes public/assets/characters/*.png and public/data/player-animations.json
python tools/art/build_player.py --preview  # only writes tools/art/out/sheets/ (nothing in public/)
```

`source/` holds the old one-row skin sheets: frame 0 of each is cut into head / body / legs, so every skin keeps its own look.
`player-poses.js` is the single table of poses (offsets per frame); change a pose there and rebuild.
The hand anchors in `player-animations.json` are measured from the glove of each frame; only the angles are typed in `build_player.py`.
