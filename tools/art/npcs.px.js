// NPC spritesheets for Knowledge Quest.
// Spec: 32x48 frames, 4 frames idle animation (128x48 total strip).
// Built using pxl DSL: node .claude/skills/pxl-pixel-art/bin/pxl.js build tools/art/npcs.px.js --out tools/art/out
// Output copied to public/assets/characters/

pal({
  // Base & outlines
  k: '#0f172a', // deep slate outline
  d: '#1e293b', // dark shadow
  w: '#ffffff', // pure white
  x: '#f8fafc', // crisp white / highlight
  m: '#94a3b8', // light slate / gray
  s: '#475569', // mid slate / steel
  S: '#64748b', // steel slate

  // Skin tones
  i: '#fef08a', // pale highlight
  I: '#fed7aa', // warm skin base
  j: '#fba86b', // warm skin shadow
  J: '#d97706', // deep skin contour

  // Scholar / Royal Blue
  b: '#172554', // deep navy
  B: '#1e3a8a', // royal blue
  u: '#2563eb', // bright scholar blue
  U: '#60a5fa', // blue highlight

  // Gold & Amber
  y: '#78350f', // deep bronze/gold shadow
  Y: '#b45309', // gold mid
  a: '#f59e0b', // rich gold
  A: '#fde047', // bright gold highlight

  // Forest & Herbal Green
  g: '#14532d', // deep forest green
  G: '#15803d', // hunter green
  l: '#22c55e', // lush plant green
  L: '#86efac', // herb highlight

  // Emerald Sinh
  e: '#064e3b', // emerald shadow
  E: '#047857', // emerald sinh base
  h: '#10b981', // emerald highlight

  // Traditional Sash Pink & Magenta
  p: '#831843', // deep rose
  P: '#db2777', // vibrant traditional pink
  q: '#f472b6', // soft sash pink
  Q: '#fbcfe8', // pink silk gleam

  // Martial Red & Shrine Hakama
  r: '#7f1d1d', // dark maroon
  R: '#991b1b', // crimson shadow
  v: '#dc2626', // vibrant crimson
  V: '#ef4444', // red highlight

  // Leather & Wood
  o: '#451a03', // dark boot leather
  O: '#78350f', // saddle leather
  t: '#92400e', // warm brown
  T: '#b45309', // golden wood / tan

  // Cyan & Cyber Glow
  c: '#0e7490', // cyan shadow
  C: '#06b6d4', // cyber cyan
  n: '#38bdf8', // glow cyan
  N: '#a5f3fc', // cyber white-cyan
})

// ============================================================================
// 1. HUNTER BOUNMY (ນາຍພານ ບຸນມີ) - Village x=1380
// Veteran ranger, forest green hood/tunic, leather vest, bow & quiver, feather cap
// ============================================================================
anim('npc_bounmy', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2

  // Boots
  c.rect(10, 44, 4, 3, 'o')
  c.rect(18, 44, 4, 3, 'o')
  c.box(9, 43, 6, 4, 'k')
  c.box(17, 43, 6, 4, 'k')

  // Brown tracker trousers
  c.rect(11, 34 + bob, 4, 10 - bob, 'O')
  c.rect(17, 34 + bob, 4, 10 - bob, 'O')
  c.vline(15, 36 + bob, 8 - bob, 'k')
  c.vline(16, 36 + bob, 8 - bob, 'k')

  // Forest green tunic
  c.rect(9, 24 + bob, 14, 11, 'g')
  c.rect(10, 24 + bob, 12, 10, 'G')

  // Leather vest over tunic
  c.rect(9, 23 + bob, 4, 9, 't')
  c.rect(19, 23 + bob, 4, 9, 't')
  c.rect(13, 31 + bob, 6, 3, 'O') // leather belt
  c.rect(15, 31 + bob, 2, 3, 'a') // brass belt buckle

  // Quiver strap running diagonally across chest
  c.line(10, 23 + bob, 21, 33 + bob, 'o', 2)
  c.line(10, 23 + bob, 21, 33 + bob, 'O', 1)

  // Left arm (resting on hip)
  c.rect(6, 24 + bob, 4, 8, 'G')
  c.rect(6, 31 + bob, 3, 3, 'o') // leather bracer
  c.rect(6, 33 + bob, 3, 2, 'I') // hand

  // Right arm (holding bow strap)
  c.rect(22, 24 + bob, 4, 8, 'G')
  c.rect(23, 31 + bob, 3, 3, 'o')
  c.rect(23, 33 + bob, 3, 2, 'I')

  // Bow curved on back
  c.line(5, 12 + bob, 5, 38 + bob, 't', 1)
  c.px(6, 11 + bob, 'T')
  c.px(6, 39 + bob, 'T')
  c.line(4, 13 + bob, 4, 37 + bob, 'm', 1) // bowstring

  // Quiver with arrows visible over right shoulder
  c.rect(24, 14 + bob, 4, 10, 'o')
  c.px(25, 12 + bob, 'w') // fletching 1
  c.px(27, 11 + bob, 'w') // fletching 2
  c.px(25, 13 + bob, 'v')
  c.px(27, 12 + bob, 'v')

  // Neck
  c.rect(14, 19 + bob, 4, 4, 'j')

  // Head / Face
  c.rect(9, 10 + bob, 14, 11, 'k')
  c.rect(10, 11 + bob, 12, 10, 'I')
  c.rect(10, 19 + bob, 12, 2, 'j') // chin shadow

  // Eyes & eyebrows
  if (blink) {
    c.hline(12, 15 + bob, 3, 'k')
    c.hline(17, 15 + bob, 3, 'k')
  } else {
    c.rect(12, 14 + bob, 3, 2, 'w')
    c.rect(17, 14 + bob, 3, 2, 'w')
    c.px(13, 15 + bob, 'k')
    c.px(18, 15 + bob, 'k')
  }
  c.hline(12, 13 + bob, 3, 'o') // eyebrows
  c.hline(17, 13 + bob, 3, 'o')
  c.px(15, 17 + bob, 'J')       // nose

  // Hunter cap & feather
  c.rect(8, 7 + bob, 16, 5, 'g')
  c.rect(9, 6 + bob, 14, 4, 'G')
  c.rect(7, 10 + bob, 18, 2, 'O') // cap brim
  // Golden pheasant feather waving
  const fOffset = (c.frame === 3) ? -1 : 0
  c.line(22, 8 + bob, 25 + fOffset, 2 + bob, 'a', 2)
  c.px(25 + fOffset, 1 + bob, 'A')
})

// ============================================================================
// 2. MASTER VANH (ອາຈານ ວັນ) - Village x=680
// Academy Scholar, royal indigo robe, gold embroidery, scholar hat, cyber-scroll
// ============================================================================
anim('npc_scholar', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2
  const scrollGlow = (c.frame === 1 || c.frame === 3) ? 'N' : 'n'

  // Shoes under long robe
  c.rect(11, 45, 3, 2, 'o')
  c.rect(18, 45, 3, 2, 'o')

  // Flowing scholar robe (long floor length)
  c.rect(8, 22 + bob, 16, 23 - bob, 'b')
  c.rect(9, 23 + bob, 14, 21 - bob, 'B')
  c.rect(11, 23 + bob, 10, 21 - bob, 'u')

  // Center gold ceremonial stole / sash
  c.rect(14, 22 + bob, 4, 22 - bob, 'a')
  c.rect(15, 23 + bob, 2, 20 - bob, 'A')
  c.rect(10, 31 + bob, 12, 3, 'a') // gold waist sash

  // Left sleeve & hand
  c.rect(5, 23 + bob, 4, 11, 'B')
  c.rect(5, 32 + bob, 4, 3, 'a') // gold sleeve cuff
  c.rect(6, 34 + bob, 3, 2, 'I') // hand

  // Right sleeve & hand holding glowing cyber-scroll
  c.rect(23, 23 + bob, 4, 9, 'B')
  c.rect(23, 30 + bob, 4, 2, 'a')
  c.rect(23, 31 + bob, 3, 2, 'I')

  // Glowing Cyber Scroll in right hand
  c.rect(24, 26 + bob, 6, 12, 'c')
  c.rect(25, 27 + bob, 4, 10, scrollGlow)
  c.rect(24, 25 + bob, 6, 2, 'a') // gold spindle top
  c.rect(24, 37 + bob, 6, 2, 'a') // gold spindle bottom
  // Scroll glyphs
  c.px(26, 29 + bob, 'w')
  c.px(27, 31 + bob, 'w')
  c.px(26, 33 + bob, 'w')

  // Neck & high collar
  c.rect(13, 18 + bob, 6, 4, 'a')
  c.rect(14, 18 + bob, 4, 3, 'j')

  // Head / Face
  c.box(9, 9 + bob, 14, 12, 'k')
  c.rect(10, 10 + bob, 12, 10, 'I')

  // Refined graying scholar beard
  c.poly([13, 19 + bob, 19, 19 + bob, 17, 23 + bob, 15, 23 + bob], 'm')
  c.line(14, 19 + bob, 18, 19 + bob, 'x', 1)

  // Spectacles / Glasses
  c.box(11, 13 + bob, 4, 3, 's')
  c.box(17, 13 + bob, 4, 3, 's')
  c.hline(14, 14 + bob, 4, 's') // glasses bridge
  c.px(12, 14 + bob, 'N')      // lens glint
  c.px(18, 14 + bob, 'N')

  // Eyes behind glasses
  if (blink) {
    c.hline(12, 14 + bob, 2, 'k')
    c.hline(18, 14 + bob, 2, 'k')
  } else {
    c.px(13, 14 + bob, 'k')
    c.px(19, 14 + bob, 'k')
  }

  // Scholar Cap (Square mortarboard style)
  c.rect(5, 5 + bob, 22, 4, 'b')
  c.rect(6, 6 + bob, 20, 2, 'B')
  c.rect(10, 8 + bob, 12, 3, 'b') // cap skull base
  // Gold button & swinging tassel
  c.px(16, 4 + bob, 'A')
  const tOffset = (c.frame === 3) ? -1 : (c.frame === 1 ? 1 : 0)
  c.line(16, 5 + bob, 24 + tOffset, 8 + bob, 'a', 1)
  c.rect(23 + tOffset, 9 + bob, 2, 4, 'A')
})

// ============================================================================
// 3. GRANDMA CHANTHY (ແມ່ເຖົ້າ ຈັນທີ) - Village x=950
// Herbalist, emerald sinh with tin-sinh border, pink pha biang sash, herb basket
// ============================================================================
anim('npc_chanthy', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2

  // Traditional sandals under sinh
  c.rect(11, 45, 3, 2, 'O')
  c.rect(18, 45, 3, 2, 'O')

  // Traditional Lao Sinh skirt
  c.rect(8, 25 + bob, 16, 20 - bob, 'e')
  c.rect(9, 26 + bob, 14, 18 - bob, 'E')

  // Intricate Tin-Sinh (ຕີນສິ້ນ) woven border pattern at hem
  c.rect(8, 41, 16, 4, 'a')
  c.rect(9, 42, 14, 2, 'v')
  for (let x = 9; x <= 22; x += 2) {
    c.px(x, 42, 'A')
    c.px(x + 1, 43, 'w')
  }

  // Blouse & Waist belt
  c.rect(9, 20 + bob, 14, 7, 'w')
  c.rect(9, 26 + bob, 14, 2, 'a') // silver/gold sinh belt

  // Traditional Pink Silk Sash (ຜ້າບ່ຽງ / ສະໄບ) draped over left shoulder
  c.line(10, 18 + bob, 17, 32 + bob, 'P', 3)
  c.line(10, 18 + bob, 17, 32 + bob, 'q', 1)
  c.px(11, 19 + bob, 'Q')
  c.px(13, 23 + bob, 'Q')
  c.px(15, 27 + bob, 'Q')
  // Gold broach pinning sash
  c.px(11, 20 + bob, 'A')

  // Left arm
  c.rect(6, 21 + bob, 3, 9, 'w')
  c.rect(6, 29 + bob, 3, 3, 'I')

  // Right arm carrying handwoven bamboo herb basket
  c.rect(21, 21 + bob, 3, 7, 'w')
  c.rect(22, 27 + bob, 3, 3, 'I')

  // Woven bamboo basket (ຕາກະຕ່າສານ)
  c.rect(22, 28 + bob, 9, 10, 't')
  c.box(22, 28 + bob, 9, 10, 'o')
  // Basket wicker weave
  c.line(23, 31 + bob, 30, 31 + bob, 'T', 1)
  c.line(23, 34 + bob, 30, 34 + bob, 'T', 1)
  c.line(26, 29 + bob, 26, 37 + bob, 'T', 1)
  // Fresh glowing green herbs & blossom overflowing basket
  c.circ(26, 26 + bob, 4, 'l')
  c.circ(28, 25 + bob, 3, 'L')
  c.px(25, 25 + bob, 'G')
  c.px(28, 26 + bob, 'q') // healing purple blossom
  c.px(24, 27 + bob, 'a') // ginseng flower

  // Neck
  c.rect(14, 17 + bob, 4, 3, 'j')

  // Head & warm kind face
  c.box(10, 9 + bob, 12, 10, 'k')
  c.rect(11, 10 + bob, 10, 8, 'I')
  c.rect(11, 17 + bob, 10, 2, 'j') // jaw contour

  // Grandmother eyes & kind smile
  if (blink) {
    c.hline(12, 14 + bob, 3, 'k')
    c.hline(17, 14 + bob, 3, 'k')
  } else {
    c.hline(12, 14 + bob, 3, 'k')
    c.px(13, 13 + bob, 'k')
    c.hline(17, 14 + bob, 3, 'k')
    c.px(18, 13 + bob, 'k')
  }
  c.px(15, 15 + bob, 'J')      // nose
  c.hline(14, 17 + bob, 4, 'p') // gentle smiling lips
  c.px(11, 15 + bob, 'q')      // rosy grandmotherly blush
  c.px(20, 15 + bob, 'q')

  // Silver-gray hair with traditional top bun (ເກົ້າຜົມ)
  c.rect(9, 7 + bob, 14, 4, 'm')
  c.rect(10, 6 + bob, 12, 3, 'x')
  c.circ(16, 5 + bob, 4, 'm')    // bun
  c.circ(16, 5 + bob, 3, 'x')
  // Gold hairpin (ປິ່ນປັກຜົມ)
  c.line(13, 4 + bob, 20, 2 + bob, 'a', 2)
  c.px(21, 1 + bob, 'A')
})

// ============================================================================
// 4. SWORDSMAN KHAM (ນັກດາບ ຄຳ) - Village x=1660
// Martial master, crimson gi, white headband with fluttering tails, wooden bokken
// ============================================================================
anim('npc_kham', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2

  // Martial boots / wraps
  c.rect(10, 44, 4, 3, 'k')
  c.rect(18, 44, 4, 3, 'k')
  c.rect(10, 41, 4, 3, 'x') // white wraps on shins
  c.rect(18, 41, 4, 3, 'x')

  // Crimson martial pants
  c.rect(9, 32 + bob, 6, 10 - bob, 'R')
  c.rect(17, 32 + bob, 6, 10 - bob, 'R')
  c.rect(10, 32 + bob, 4, 9 - bob, 'v')
  c.rect(18, 32 + bob, 4, 9 - bob, 'v')

  // Crimson Gi torso
  c.rect(8, 21 + bob, 16, 12, 'R')
  c.rect(9, 22 + bob, 14, 10, 'v')

  // White V-neck inner wrap
  c.poly([13, 21 + bob, 19, 21 + bob, 16, 27 + bob], 'w')

  // Black Obi belt with tied knot and hanging ends
  c.rect(8, 30 + bob, 16, 3, 'k')
  c.rect(13, 31 + bob, 4, 3, 'd')
  c.rect(13, 33 + bob, 2, 5, 'k') // left belt tail
  c.rect(16, 33 + bob, 2, 4, 'k') // right belt tail

  // Left arm (resting on sword hilt)
  c.rect(5, 22 + bob, 4, 8, 'v')
  c.rect(5, 29 + bob, 4, 3, 'w')   // white wrist wrap
  c.rect(5, 31 + bob, 3, 3, 'I')   // fist

  // Right arm (ready stance)
  c.rect(23, 22 + bob, 4, 8, 'v')
  c.rect(23, 29 + bob, 4, 3, 'w')
  c.rect(24, 31 + bob, 3, 3, 'I')

  // Wooden practice bokken strapped diagonally across back
  c.line(6, 40 + bob, 27, 8 + bob, 't', 2)
  c.line(7, 39 + bob, 26, 9 + bob, 'T', 1)
  c.rect(24, 8 + bob, 4, 2, 'o')  // sword guard (tsuba)
  c.line(25, 7 + bob, 28, 4 + bob, 'O', 2) // sword handle

  // Neck
  c.rect(14, 18 + bob, 4, 3, 'j')

  // Head / Athletic face
  c.box(9, 8 + bob, 14, 12, 'k')
  c.rect(10, 9 + bob, 12, 10, 'I')
  c.rect(10, 17 + bob, 12, 2, 'j')

  // Determined eyes & battle scar on cheek
  if (blink) {
    c.hline(12, 14 + bob, 3, 'k')
    c.hline(17, 14 + bob, 3, 'k')
  } else {
    c.rect(12, 13 + bob, 3, 2, 'w')
    c.rect(17, 13 + bob, 3, 2, 'w')
    c.px(13, 14 + bob, 'k')
    c.px(18, 14 + bob, 'k')
  }
  c.line(11, 12 + bob, 14, 13 + bob, 'k', 1) // sharp brows
  c.line(19, 12 + bob, 16, 13 + bob, 'k', 1)
  c.px(15, 15 + bob, 'J')                  // nose
  c.hline(14, 17 + bob, 4, 'J')            // firm mouth
  c.line(11, 15 + bob, 13, 17 + bob, 'r', 1) // honorable warrior scar

  // Short spiky black hair
  c.rect(9, 6 + bob, 14, 4, 'k')
  c.px(10, 5 + bob, 'k')
  c.px(13, 5 + bob, 'k')
  c.px(18, 5 + bob, 'k')
  c.px(21, 5 + bob, 'k')

  // White Warrior Headband (ຜ້າໂພກຫົວ) across forehead
  c.rect(8, 8 + bob, 16, 3, 'w')
  c.rect(8, 9 + bob, 16, 1, 'm')
  // Fluttering headband tails floating in the wind
  const w1 = (c.frame === 0) ? 0 : (c.frame === 1 ? 1 : (c.frame === 2 ? 2 : 1))
  const w2 = (c.frame === 2) ? 0 : (c.frame === 3 ? 1 : (c.frame === 0 ? 2 : 1))
  c.line(6, 9 + bob, 1 - w1, 12 + bob, 'w', 2)
  c.line(6, 10 + bob, 2 - w2, 15 + bob, 'w', 2)
})

// ============================================================================
// 5. SHRINE MAIDEN NOY (ນາງນ້ອຍ ຜູ້ດູແລສານ) - Village x=2310
// Shrine keeper, white kimono, crimson hakama, golden kagura bell with streamers
// ============================================================================
anim('npc_noy', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2
  const bellGleam = (c.frame === 0 || c.frame === 2) ? 'A' : 'w'

  // White tabi & red-strapped sandals
  c.rect(11, 45, 3, 2, 'w')
  c.rect(18, 45, 3, 2, 'w')
  c.px(12, 45, 'v')
  c.px(19, 45, 'v')

  // Vermilion red Hakama pleated skirt
  c.rect(8, 25 + bob, 16, 20 - bob, 'R')
  c.rect(9, 26 + bob, 14, 18 - bob, 'v')
  c.vline(12, 27 + bob, 17 - bob, 'r') // pleat fold 1
  c.vline(16, 27 + bob, 17 - bob, 'r') // pleat fold 2
  c.vline(20, 27 + bob, 17 - bob, 'r') // pleat fold 3

  // Pristine white Kimono top
  c.rect(9, 20 + bob, 14, 7, 'w')
  c.rect(10, 20 + bob, 12, 6, 'x')
  // Red waist obi
  c.rect(8, 25 + bob, 16, 2, 'R')
  c.rect(14, 25 + bob, 4, 3, 'V') // knot

  // Kimono sleeves (wide bell sleeves)
  c.rect(5, 21 + bob, 4, 11, 'w')
  c.rect(5, 22 + bob, 3, 9, 'x')
  c.rect(6, 31 + bob, 2, 2, 'I') // left hand

  c.rect(23, 21 + bob, 4, 9, 'w')
  c.rect(24, 22 + bob, 3, 7, 'x')
  c.rect(24, 29 + bob, 2, 2, 'I') // right hand holding bell

  // Golden Kagura Shrine Bell (ກະດິ່ງທອງ)
  c.rect(25, 25 + bob, 5, 5, 'a')
  c.box(25, 25 + bob, 5, 5, 'Y')
  c.px(26, 26 + bob, bellGleam)
  c.line(27, 29 + bob, 27, 34 + bob, 'y', 1) // bell handle
  // Five-colored prayer streamers drifting from bell
  const sOffset = (c.frame === 1 || c.frame === 2) ? 1 : 0
  c.line(28, 29 + bob, 30 + sOffset, 36 + bob, 'v', 1) // red streamer
  c.line(29, 29 + bob, 31 + sOffset, 37 + bob, 'n', 1) // cyan streamer
  c.line(27, 30 + bob, 28 + sOffset, 38 + bob, 'A', 1) // gold streamer

  // Neck
  c.rect(14, 17 + bob, 4, 3, 'I')
  c.line(13, 19 + bob, 18, 24 + bob, 'v', 1) // red collar accent

  // Head / Serene face
  c.box(10, 9 + bob, 12, 10, 'k')
  c.rect(11, 10 + bob, 10, 8, 'I')
  c.rect(11, 17 + bob, 10, 2, 'j')

  // Gentle eyes & shy smile
  if (blink) {
    c.hline(12, 14 + bob, 3, 'k')
    c.hline(17, 14 + bob, 3, 'k')
  } else {
    c.rect(12, 13 + bob, 3, 2, 'w')
    c.rect(17, 13 + bob, 3, 2, 'w')
    c.px(13, 14 + bob, 'b') // deep dark eyes
    c.px(18, 14 + bob, 'b')
  }
  c.px(15, 15 + bob, 'J')      // nose
  c.hline(14, 17 + bob, 4, 'v') // ruby lips
  c.px(11, 15 + bob, 'q')      // soft blush
  c.px(20, 15 + bob, 'q')

  // Long midnight black hair with hime cut & red ribbon
  c.rect(9, 6 + bob, 14, 5, 'k')
  c.rect(8, 9 + bob, 2, 9, 'k')  // left hime sidelock
  c.rect(22, 9 + bob, 2, 9, 'k') // right hime sidelock
  // Red ceremonial hair ribbon loops
  c.rect(10, 5 + bob, 4, 2, 'v')
  c.rect(18, 5 + bob, 4, 2, 'v')
  c.px(16, 5 + bob, 'w')
})

// ============================================================================
// 6. ARCHAEOLOGIST SOMCHAY (ນັກບູຮານຄະດີ ສົມຊາຍ) - Dungeon x=650
// Ruins researcher, safari khaki jacket, slouch hat, wire glasses, oil lantern
// ============================================================================
anim('npc_somchay', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2

  // Boots
  c.rect(10, 44, 4, 3, 'o')
  c.rect(18, 44, 4, 3, 'o')

  // Khaki field trousers
  c.rect(10, 33 + bob, 5, 11 - bob, 't')
  c.rect(17, 33 + bob, 5, 11 - bob, 't')

  // Khaki Safari Jacket with pockets
  c.rect(8, 22 + bob, 16, 12, 't')
  c.rect(9, 23 + bob, 14, 10, 'T')
  // Utility pockets with brass buttons
  c.box(10, 24 + bob, 4, 3, 'O')
  c.px(12, 25 + bob, 'a')
  c.box(18, 24 + bob, 4, 3, 'O')
  c.px(20, 25 + bob, 'a')
  // Heavy leather belt with buckle & canteen
  c.rect(8, 31 + bob, 16, 3, 'o')
  c.rect(15, 31 + bob, 3, 3, 'a')
  c.rect(7, 30 + bob, 3, 5, 's') // water canteen

  // Left arm (carrying map notebook)
  c.rect(5, 23 + bob, 4, 8, 'T')
  c.rect(5, 30 + bob, 4, 4, 'y') // leather journal cover
  c.rect(6, 31 + bob, 2, 3, 'i') // journal pages

  // Right arm holding brass dungeon oil lantern
  c.rect(23, 23 + bob, 4, 7, 'T')
  c.rect(23, 29 + bob, 3, 2, 'I') // hand holding wire handle

  // Glowing Brass Dungeon Lantern
  c.line(25, 28 + bob, 25, 31 + bob, 's', 1) // wire handle
  c.rect(23, 31 + bob, 6, 2, 'Y')            // lantern cap
  c.rect(23, 37 + bob, 6, 2, 'Y')            // lantern base
  c.box(23, 31 + bob, 6, 8, 'y')
  // Flickering amber flame inside glass
  if (c.frame === 0 || c.frame === 2) {
    c.rect(24, 33 + bob, 4, 4, 'a')
    c.rect(25, 34 + bob, 2, 2, 'A')
    c.px(25, 34 + bob, 'w')
  } else {
    c.rect(24, 33 + bob, 4, 4, 'Y')
    c.rect(25, 33 + bob, 3, 3, 'a')
    c.px(26, 34 + bob, 'w')
  }

  // Neck
  c.rect(14, 18 + bob, 4, 4, 'j')

  // Head & Cheerful adventure face
  c.box(9, 9 + bob, 14, 11, 'k')
  c.rect(10, 10 + bob, 12, 9, 'I')
  c.rect(10, 17 + bob, 12, 2, 'j') // chin

  // Round wire spectacles / glasses
  c.ring(13, 14 + bob, 2, 'a')
  c.ring(18, 14 + bob, 2, 'a')
  c.hline(15, 14 + bob, 2, 'a')
  c.px(14, 13 + bob, 'N') // lens glint
  c.px(19, 13 + bob, 'N')

  // Eyes behind glasses
  if (blink) {
    c.hline(12, 14 + bob, 2, 'k')
    c.hline(18, 14 + bob, 2, 'k')
  } else {
    c.px(13, 14 + bob, 'k')
    c.px(18, 14 + bob, 'k')
  }
  c.px(15, 16 + bob, 'J')      // nose
  c.hline(14, 18 + bob, 4, 'o') // explorer mustache

  // Explorer Pith / Slouch Hat with wide brim
  c.rect(6, 9 + bob, 20, 2, 't')  // wide brim
  c.rect(9, 5 + bob, 14, 5, 't')  // dome
  c.rect(10, 4 + bob, 12, 4, 'T') // dome highlight
  c.rect(9, 8 + bob, 14, 2, 'o')  // dark leather hatband
})

// ============================================================================
// 7. GUIDE KEO (ແກ້ວ ຜູ້ນຳທາງ) - Stage 1 x=320
// Scout guide, bright blue travel cloak, adventurer beret, compass pendant
// ============================================================================
anim('npc_guide_keo', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2

  // Boots
  c.rect(10, 44, 4, 3, 'o')
  c.rect(18, 44, 4, 3, 'o')

  // Trousers
  c.rect(11, 33 + bob, 4, 11 - bob, 'd')
  c.rect(17, 33 + bob, 4, 11 - bob, 'd')

  // Traveler tunic & belt
  c.rect(9, 23 + bob, 14, 11, 't')
  c.rect(9, 31 + bob, 14, 3, 'o') // belt
  c.rect(15, 31 + bob, 2, 3, 'a') // brass buckle

  // Bright Blue Scout Cloak
  c.rect(7, 21 + bob, 18, 10, 'u')
  c.rect(8, 22 + bob, 16, 8, 'U')
  // Gold compass clasp at throat
  c.circ(16, 21 + bob, 2, 'a')
  c.px(16, 21 + bob, 'n') // compass needle

  // Left arm
  c.rect(5, 23 + bob, 3, 8, 'u')
  c.rect(5, 30 + bob, 3, 3, 'I')

  // Right arm holding rolled navigation map
  c.rect(24, 23 + bob, 3, 7, 'u')
  c.rect(24, 29 + bob, 3, 3, 'I')
  c.rect(25, 26 + bob, 4, 9, 'i') // rolled map scroll
  c.rect(25, 30 + bob, 4, 1, 'v') // ribbon tie

  // Neck
  c.rect(14, 18 + bob, 4, 3, 'I')

  // Head & youthful friendly face
  c.box(10, 9 + bob, 12, 10, 'k')
  c.rect(11, 10 + bob, 10, 8, 'I')
  c.rect(11, 17 + bob, 10, 2, 'j')

  // Big expressive eyes & cheerful smile
  if (blink) {
    c.hline(12, 14 + bob, 3, 'k')
    c.hline(17, 14 + bob, 3, 'k')
  } else {
    c.rect(12, 13 + bob, 3, 2, 'w')
    c.rect(17, 13 + bob, 3, 2, 'w')
    c.px(13, 14 + bob, 'B')
    c.px(18, 14 + bob, 'B')
  }
  c.px(15, 15 + bob, 'J')
  c.hline(14, 17 + bob, 4, 'v') // friendly smile

  // Brown scout hair & Blue Beret with silver pin
  c.rect(9, 7 + bob, 14, 4, 'O')
  c.rect(8, 5 + bob, 15, 4, 'B')
  c.rect(9, 4 + bob, 12, 3, 'u')
  c.px(21, 5 + bob, 'w') // silver pin
})

// ============================================================================
// 8. UNCLE THONG (ລຸງທອງ) - Stage 5 x=360
// Veteran miner, yellow hardhat with headlamp, denim overalls, shoulder pickaxe
// ============================================================================
anim('npc_thong', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const blink = c.frame === 2
  const lampGleam = (c.frame === 1 || c.frame === 3) ? 'w' : 'A'

  // Heavy steel-toed work boots
  c.rect(9, 44, 5, 3, 'o')
  c.rect(18, 44, 5, 3, 'o')
  c.rect(9, 43, 5, 1, 's')
  c.rect(18, 43, 5, 1, 's')

  // Rugged Denim Overalls
  c.rect(8, 25 + bob, 16, 18 - bob, 'B')
  c.rect(9, 26 + bob, 14, 16 - bob, 'u')
  // Flannel work shirt underneath
  c.rect(7, 21 + bob, 18, 6, 'R')
  c.px(9, 22 + bob, 'w')
  c.px(12, 22 + bob, 'w')
  c.px(19, 22 + bob, 'w')
  c.px(22, 22 + bob, 'w')
  // Overall suspender straps & brass buckles
  c.rect(11, 23 + bob, 2, 8, 'b')
  c.rect(19, 23 + bob, 2, 8, 'b')
  c.px(11, 26 + bob, 'a')
  c.px(19, 26 + bob, 'a')

  // Heavy duty leather work gloves
  c.rect(5, 23 + bob, 4, 8, 'R')
  c.rect(5, 30 + bob, 4, 4, 'O') // left glove

  c.rect(23, 21 + bob, 4, 7, 'R')
  c.rect(23, 27 + bob, 4, 4, 'O') // right glove holding pickaxe

  // Heavy Iron Mining Pickaxe resting on shoulder
  c.line(22, 33 + bob, 27, 10 + bob, 't', 2) // wooden haft
  c.line(20, 11 + bob, 31, 8 + bob, 's', 3)  // iron pick head
  c.line(21, 11 + bob, 30, 9 + bob, 'm', 1)
  c.px(31, 8 + bob, 'w')                     // sharpened point

  // Neck
  c.rect(13, 18 + bob, 6, 4, 'j')

  // Broad weathered miner face
  c.box(8, 9 + bob, 16, 11, 'k')
  c.rect(9, 10 + bob, 14, 9, 'I')
  c.rect(9, 17 + bob, 14, 2, 'j')

  // Thick gray miner mustache & sideburns
  c.rect(11, 16 + bob, 10, 3, 'm')
  c.rect(12, 16 + bob, 8, 2, 'x')
  c.rect(8, 12 + bob, 2, 5, 'm')
  c.rect(22, 12 + bob, 2, 5, 'm')

  // Eyes & bushy brows
  if (blink) {
    c.hline(11, 13 + bob, 3, 'k')
    c.hline(18, 13 + bob, 3, 'k')
  } else {
    c.px(12, 13 + bob, 'k')
    c.px(19, 13 + bob, 'k')
  }
  c.hline(11, 12 + bob, 4, 'm') // bushy gray eyebrows
  c.hline(17, 12 + bob, 4, 'm')
  c.rect(14, 14 + bob, 4, 2, 'J') // broad nose

  // Yellow Safety Miner Hardhat
  c.rect(7, 7 + bob, 18, 3, 'a')  // hardhat brim
  c.rect(9, 4 + bob, 14, 5, 'A')  // dome
  c.rect(10, 3 + bob, 12, 3, 'a')
  // Mounted Electric Headlamp
  c.rect(14, 5 + bob, 4, 4, 'd')
  c.rect(15, 6 + bob, 2, 2, lampGleam)
})

// ============================================================================
// 9. DR. CYBER (ດຣ. ໄຊເບີ) - Stage 10 x=280
// High-tech scientist, sleek white lab coat, holographic visor, cyber datapad
// ============================================================================
anim('npc_dr_cyber', { w: 32, h: 48, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const padPulse = (c.frame === 1 || c.frame === 3) ? 'N' : 'n'

  // Cybernetic boots
  c.rect(10, 44, 4, 3, 's')
  c.rect(18, 44, 4, 3, 's')
  c.px(11, 45, 'n') // cyan LED sole
  c.px(19, 45, 'n')

  // Sleek dark tech trousers
  c.rect(10, 33 + bob, 4, 11 - bob, 'd')
  c.rect(18, 33 + bob, 4, 11 - bob, 'd')

  // Futuristic White Lab Coat
  c.rect(7, 21 + bob, 18, 16 - bob, 'w')
  c.rect(8, 22 + bob, 16, 14 - bob, 'x')
  // Cyan neon fiber-optic seam piping
  c.vline(11, 22 + bob, 14 - bob, 'C')
  c.vline(20, 22 + bob, 14 - bob, 'C')
  // Dark tech undershirt & cyber badge
  c.rect(13, 21 + bob, 6, 8, 'd')
  c.px(14, 23 + bob, 'n') // holographic ID badge

  // Right arm (Cybernetic prosthetic arm)
  c.rect(23, 22 + bob, 4, 7, 'w')  // coat sleeve
  c.rect(24, 28 + bob, 3, 5, 's')  // chrome robotic forearm
  c.px(25, 29 + bob, 'C')         // conduit line
  c.rect(24, 33 + bob, 3, 2, 'm')  // robotic fingers

  // Left arm holding floating translucent holographic datapad
  c.rect(5, 22 + bob, 4, 7, 'w')
  c.rect(5, 28 + bob, 3, 4, 'I')

  // Holographic Datapad
  c.rect(3, 26 + bob, 7, 10, 'c')
  c.box(3, 26 + bob, 7, 10, padPulse)
  // Data waveform lines
  c.hline(4, 28 + bob, 5, 'w')
  c.hline(4, 31 + bob, 4, 'n')
  c.hline(4, 33 + bob, 5, 'N')

  // High cyber collar
  c.rect(12, 17 + bob, 8, 4, 'w')
  c.px(13, 18 + bob, 'C')
  c.px(18, 18 + bob, 'C')

  // Head & cybernetic jawline
  c.box(9, 8 + bob, 14, 11, 'k')
  c.rect(10, 9 + bob, 12, 9, 'I')
  c.rect(10, 16 + bob, 12, 2, 's') // cybernetic jaw implant

  // Holographic Cyber-Visor across eyes
  c.rect(9, 12 + bob, 14, 4, 'c')
  c.rect(10, 13 + bob, 12, 2, 'n')
  c.rect(12, 13 + bob, 4, 1, 'w')  // visor gleam
  c.rect(18, 13 + bob, 2, 1, 'w')

  c.px(15, 16 + bob, 'J')       // nose
  c.hline(14, 17 + bob, 4, 'J') // calm analytical mouth

  // Sleek swept-back dark hair with teal cybernetic streak
  c.rect(9, 6 + bob, 14, 4, 'k')
  c.rect(10, 5 + bob, 12, 3, 'd')
  c.hline(11, 6 + bob, 6, 'C')   // teal hair streak
})
