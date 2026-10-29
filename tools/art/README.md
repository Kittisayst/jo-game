# Art sources

Pixel art that is drawn by code lives here, so it can be reviewed as a diff and rebuilt.

| Source | Output | Tool |
|---|---|---|
| `held-items.px.js` | `public/assets/held/*.png` (weapons/tools in the hero's hand) | pxl (`.claude/skills/pxl-pixel-art`, vendored from crsolver/claude-pxl, MIT) |
| `remove_frame13_stub.py` | one-off edit of `public/assets/characters/player-skin-*.png` | Python + Pillow |

## Rebuilding the held items

```bash
node .claude/skills/pxl-pixel-art/bin/pxl.js build tools/art/held-items.px.js --out tools/art/out
cp tools/art/out/sprites/*.png public/assets/held/
python .claude/skills/create-game-assets/scripts/asset_report.py public/assets/held/*.png --expect-size 32x32 --require-alpha
```

Look at `tools/art/out/_preview/*.png` before copying. `tools/art/out/` is not committed.
Spec (size, grip point, palette): `docs/plans/2026-10-30-held-items.md`.
