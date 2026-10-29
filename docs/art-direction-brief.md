# Art Direction Brief — ພະຈົນໄພຄວາມຮູ້ (Knowledge Quest)

## Game frame

- **Player fantasy:** Young vocational-college explorer in a peaceful Cyber-Village who gains real power through computer-science knowledge, crafts tools and blades, and defeats ancient hardware monsters.
- **Core verbs:** Read & study, pass exams, harvest resources (chop, mine, gather), craft & upgrade, jump/dodge, slash with sword, repair gates.
- **Engine and renderer:** Phaser 4.0 WebGL (`pixelArt: true`, Nearest-neighbor sampling, `roundPixels` active) + React 19 modal UI overlay.
- **Target platforms:** Desktop and mobile web browsers (16:9 landscape).
- **Camera/view/facing:** 2D orthographic side-scrolling view; ground top at `y = 656` (`GROUND_HEIGHT = 64` inside `1280×720`); default sprite facing is **right** (`flipX = true` for left).
- **Native viewport and common display scale:** `1280×720` (`Phaser.Scale.FIT`, centered).
- **Typical asset size on screen:** Player & NPCs `32×48`, standard enemies `32×28` to `48×40`, mini-boss `64×64`, chapter boss `96×80`, village buildings `160×176` to `176×208`, resource nodes `48×48` to `80×112`, ground tiles `64×64`, UI item icons `32×32`.

## Visual system

- **Shape language:** Chunky, readable 16-bit proportions. Friendly village structures and NPCs use rounded timber/ roofs and warm lantern shapes; hazards, golems, and the Hardware Overlord use angular plates, sharp crystal facets, and circuit geometry.
- **Silhouette priorities:**
  - Player skins: distinct helmet visor + weapon swing arc; arms and legs separate cleanly during run/jump.
  - Village buildings: unique roofline silhouette per function (Library = domed/book crest, Academy = clock/pediment tower, Workshop = gear/shed awning, Forge = stone chimney + anvil).
  - Enemies: low rounded blob (Forest Slime) vs wide craggy shoulders (Rock Golem) vs tall horned crystal-knight (Cave Guardian) vs broad hovering/stomping circuit-mech with crown (Hardware Overlord).
- **Value structure:** 3–4 value steps per material ramp against mid-dark low-contrast backgrounds so foreground actors always lead contrast.
- **Palette roles and exact swatches ("Cyber-Village 32"):**
  - **Outline / Ink:** `#0f172a` (outer 1px silhouette outline), `#1e293b` (deep shadow)
  - **Neutral Stone / Steel:** `#334155`, `#64748b`, `#94a3b8`, `#e2e8f0`
  - **Wood & Warm Lantern:** `#451a03`, `#78350f`, `#b45309`, `#d97706`, `#f59e0b`, `#fef08a`
  - **Forest & Healing:** `#052e16`, `#14532d`, `#15803d`, `#22c55e`, `#86efac`
  - **Knowledge / Cyber Accent:** `#083344`, `#0369a1`, `#0284c7`, `#06b6d4`, `#38bdf8`, `#a5f3fc`
  - **Arcane / Boss / Danger:** `#3b0764`, `#6d28d9`, `#a855f7`, `#7f1d1d`, `#dc2626`, `#ef4444`
- **Materials and surface cues:** Crisp pixel clusters (no noisy per-pixel grain); wood uses horizontal/vertical plank lines; stone uses bevelled block clusters; cyber circuits use 1–2px high-value neon traces (`#38bdf8`, `#f59e0b`).
- **Edge/line treatment:** Hard `1px` `#0f172a` pixel outline on all interactive actors, nodes, buildings, and icons; zero semi-transparent anti-aliased fringe against alpha.
- **Lighting direction and contrast:** Consistent **top-left** key light (`45°`) with subtle cyan/amber rim accents on cyber elements.
- **Detail density and focal hierarchy:** Highest detail on character faces/visors, building emblems, and resource focal cues (ore glints, crystal cores); low-frequency shapes on parallax backgrounds.
- **Motion character:** Snappy arcade timing — 4-frame idle breathe, 6-frame run, 3-frame slash, 2-state intact/harvested resource nodes.
- **Explicit exclusions:** No baked white/checkerboard backgrounds, no blurry bilinear upscales, no mixed emoji sprites inside the Phaser canvas, no text baked inside raster world sprites.

## Technical contract

- **Asset dimensions/aspect:** Multiples of `4px` (prefer `8px`); exact frame grids on horizontal strip spritesheets.
- **Alpha/background:** PNG RGBA (`alpha = 0` exterior verified via `asset_report.py --require-alpha`) for all sprites, tiles, buildings, props, and icons; seamless horizontal `1280×720` / `1376×720` backgrounds.
- **Grid/tile/frame size:** Ground tiles `64×64`; player & NPC frames `32×48`; item icons `32×32`.
- **Anchor/pivot/baseline:** Characters, enemies, buildings, and ground props align feet/base to the bottom edge of the frame (`bottom-center` ground contact) with physics hitboxes flush to the bottom pixel.
- **Filtering/mipmaps/compression:** Nearest-neighbor (`pixelArt: true` in Phaser; `image-rendering: pixelated` in CSS).
- **Color space:** sRGB.
- **Naming and folders:**
  - `public/assets/backgrounds/` — seamless stage & hub backdrops
  - `public/assets/environment/` — tiles, platforms, hazards, village buildings, resource nodes, gates, waypoints, props
  - `public/assets/characters/` — player skin sheets, NPC sheets, enemy/miniboss/boss sheets
  - `public/assets/vfx/` — weapon slash spritesheets
  - `public/assets/items/` — `32×32` item icons matching `items.json` IDs
  - `public/assets/ui/` — dialogue portraits & title crest
  - `public/assets/books/` — clean SVG diagrams for textbook pages

