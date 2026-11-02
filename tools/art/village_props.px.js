// Village props and pets for Knowledge Quest.
// Spec:
// - pet_dog: 24x20 frames (4 frames idle/wag strip = 96x20)
// - pet_chicken: 16x16 frames (4 frames peck/idle strip = 64x16)
// - stone_lantern: 24x44 frames (4 frames day/night glow strip = 96x44)
//
// Built with pxl: node .claude/skills/pxl-pixel-art/bin/pxl.js build tools/art/village_props.px.js --out tools/art/out

pal({
  // Base & outlines
  k: '#0f172a', // outline
  d: '#1e293b', // dark shadow
  w: '#ffffff', // pure white
  x: '#f8fafc', // crisp white
  m: '#94a3b8', // light gray
  s: '#475569', // mid stone gray
  S: '#334155', // dark stone gray

  // Dog colors (Golden Shiba)
  b: '#78350f', // deep fur shadow
  B: '#b45309', // golden brown coat
  c: '#d97706', // warm coat
  C: '#fde047', // cream highlight
  p: '#f472b6', // pink tongue
  r: '#dc2626', // red collar

  // Chicken colors
  e: '#e2e8f0', // feather shadow
  f: '#f8fafc', // white feather
  y: '#f59e0b', // beak/feet gold
  Y: '#fde047', // beak bright
  v: '#dc2626', // red comb/wattle
  V: '#ef4444', // bright red comb

  // Lantern stone & fire
  g: '#15803d', // moss green
  a: '#f59e0b', // amber flame
  A: '#fde047', // yellow flame
  o: '#ffffff', // flame core
})

// ============================================================================
// 1. LUCKY THE VILLAGE DOG (ໝານ້ອຍ ເຈົ້າໂຊກດີ)
// 24x20, 4-frame animated strip: sitting, breathing, wagging tail excitedly
// ============================================================================
anim('pet_dog', { w: 24, h: 20, frames: 4, fps: 4 }, (c) => {
  const bob = (c.frame === 1 || c.frame === 2) ? 1 : 0
  const tailUp = c.frame === 1 || c.frame === 3
  const tailLeft = c.frame === 2
  const panting = c.frame === 1 || c.frame === 2

  // Back paws / sitting hind legs
  c.rect(4, 16, 5, 3, 'b')
  c.rect(5, 17, 3, 2, 'C')
  c.rect(14, 16, 5, 3, 'b')
  c.rect(15, 17, 3, 2, 'C')

  // Front paws
  c.rect(9, 15 + bob, 3, 4 - bob, 'B')
  c.rect(9, 18, 3, 2, 'C')
  c.rect(13, 15 + bob, 3, 4 - bob, 'B')
  c.rect(13, 18, 3, 2, 'C')

  // Shiba dog body
  c.rect(6, 9 + bob, 12, 8, 'B')
  c.rect(7, 10 + bob, 10, 6, 'c')
  c.rect(8, 12 + bob, 8, 4, 'C') // cream chest fur

  // Red collar with tiny gold bell
  c.rect(8, 8 + bob, 9, 2, 'r')
  c.px(12, 10 + bob, 'C') // gold bell tag

  // Tail (animated wagging at back left)
  if (tailLeft) {
    c.line(4, 13 + bob, 1, 9 + bob, 'B', 2)
    c.px(1, 8 + bob, 'C') // white tail tip
  } else if (tailUp) {
    c.line(4, 13 + bob, 2, 7 + bob, 'B', 2)
    c.px(2, 6 + bob, 'C')
  } else {
    c.line(4, 13 + bob, 3, 10 + bob, 'B', 2)
    c.px(3, 9 + bob, 'C')
  }

  // Head
  c.rect(8, 2 + bob, 11, 8, 'B')
  c.rect(9, 3 + bob, 9, 6, 'c')

  // Cream muzzle / snout
  c.rect(13, 5 + bob, 6, 4, 'C')
  c.px(18, 5 + bob, 'k') // black nose button

  // Eyes
  if (panting) {
    // Happy squinting crescent eyes
    c.hline(11, 4 + bob, 2, 'k')
    c.hline(15, 4 + bob, 2, 'k')
  } else {
    c.px(11, 4 + bob, 'k')
    c.px(15, 4 + bob, 'k')
  }

  // Tongue out when panting
  if (panting) {
    c.rect(16, 8 + bob, 2, 2, 'p')
  }

  // Perky triangular ears
  c.poly([8, 3 + bob, 10, 3 + bob, 7, 0 + bob], 'b')
  c.px(8, 1 + bob, 'C') // inner ear
  c.poly([14, 3 + bob, 16, 3 + bob, 17, 0 + bob], 'b')
  c.px(16, 1 + bob, 'C')
})

// ============================================================================
// 2. CLUCKY THE VILLAGE CHICKEN (ແມ່ໄກ່ຄຳ)
// 16x16, 4-frame animated strip: standing, pecking ground, flapping
// ============================================================================
anim('pet_chicken', { w: 16, h: 16, frames: 4, fps: 4 }, (c) => {
  const peck = c.frame === 1 || c.frame === 2
  const flap = c.frame === 3

  // Yellow feet
  c.px(5, 14, 'y')
  c.px(6, 15, 'y')
  c.px(9, 14, 'y')
  c.px(10, 15, 'y')

  // Plump chicken body
  c.rect(3, 7, 9, 7, 'e')
  c.rect(4, 7, 8, 6, 'f')
  // Tail feathers
  c.poly([1, 6, 4, 8, 2, 10], 'e')
  c.px(1, 5, 'f')

  if (peck) {
    // Dipped head pecking the ground
    c.rect(10, 9, 4, 5, 'f')
    c.rect(13, 12, 3, 2, 'y') // beak touching ground
    c.px(15, 13, 'Y')
    c.px(11, 10, 'k')         // eye
    c.px(10, 8, 'v')          // comb
    c.px(12, 13, 'v')         // wattle
  } else {
    // Upright head
    c.rect(9, 3, 5, 6, 'f')
    c.rect(13, 5, 3, 2, 'y')  // beak
    c.px(15, 6, 'Y')
    c.px(11, 5, 'k')          // eye
    // Red comb on top of head
    c.rect(9, 1, 4, 2, 'v')
    c.px(10, 0, 'V')
    c.px(12, 0, 'V')
    // Red wattle under beak
    c.px(13, 7, 'v')
  }

  // Wing on side
  if (flap) {
    c.poly([5, 5, 9, 3, 8, 8], 'e')
    c.px(7, 4, 'f')
  } else {
    c.rect(5, 8, 5, 4, 'e')
    c.rect(6, 9, 3, 2, 'f')
  }
})

// ============================================================================
// 3. STONE LANTERN (ໂຄມໄຟຫີນບູຮານ Toro)
// 24x44, 4-frame strip: frame 0 = day (unlit), frames 1-3 = night (flickering warm flame)
// ============================================================================
anim('stone_lantern', { w: 24, h: 44, frames: 4, fps: 4 }, (c) => {
  const isNight = c.frame > 0

  // Stepped stone base
  c.rect(4, 40, 16, 4, 'S')
  c.rect(6, 37, 12, 3, 's')
  c.rect(8, 35, 8, 2, 'm')
  c.px(5, 41, 'g') // moss patch on base

  // Carved pillar
  c.rect(9, 21, 6, 14, 's')
  c.rect(10, 21, 4, 14, 'm')
  c.px(9, 26, 'g') // moss on pillar

  // Middle platform / lotus basin
  c.rect(5, 18, 14, 3, 'S')
  c.rect(6, 17, 12, 2, 's')
  c.rect(7, 16, 10, 2, 'm')

  // Light chamber / lattice box
  c.rect(6, 8, 12, 8, 'S')
  c.box(6, 8, 12, 8, 'k')
  // Stone corner pillars of chamber
  c.rect(6, 8, 2, 8, 's')
  c.rect(16, 8, 2, 8, 's')

  // Interior light chamber
  if (isNight) {
    // Glowing warm amber lantern flame
    c.rect(8, 9, 8, 6, 'a')
    if (c.frame === 1) {
      c.rect(10, 10, 4, 4, 'A')
      c.px(11, 11, 'o')
    } else if (c.frame === 2) {
      c.rect(9, 9, 6, 6, 'A')
      c.rect(10, 10, 4, 4, 'o')
    } else {
      c.rect(10, 10, 5, 4, 'A')
      c.px(12, 11, 'o')
    }
  } else {
    // Unlit stone interior by day
    c.rect(8, 9, 8, 6, 'd')
    c.px(11, 12, 's')
  }

  // Pagoda roof / eaves
  c.rect(2, 6, 20, 3, 'S')
  c.rect(3, 5, 18, 2, 's')
  c.rect(5, 3, 14, 2, 'm')
  c.rect(7, 2, 10, 2, 's')
  // Upturned pagoda roof corners
  c.px(1, 6, 'S')
  c.px(22, 6, 'S')

  // Jewel finial on peak
  c.rect(10, 0, 4, 2, 's')
  c.px(11, 0, 'm')
})

// ============================================================================
// 4. HERO'S COZY COTTAGE (ເຮືອນພັກວິລະບຸລຸດ)
// 160x160 building sprite: timber log walls, stone chimney, window with flowerbox, door
// ============================================================================
sprite('building_cottage', { w: 160, h: 160 }, (c) => {
  // 1. Stone Foundation
  c.rect(10, 144, 140, 16, 'S')
  c.rect(14, 146, 132, 14, 's')
  for (let x = 16; x < 140; x += 16) {
    c.vline(x, 146, 14, 'k')
    c.hline(14, 153, 132, 'k')
  }

  // 2. Timber Log Walls (Cozy wooden planks)
  c.rect(16, 70, 128, 76, 'b')
  c.rect(18, 72, 124, 72, 'B')
  for (let y = 72; y < 144; y += 12) {
    c.hline(18, y, 124, 'b')
    c.hline(18, y + 1, 124, 'c')
  }
  c.rect(16, 70, 8, 76, 'b')
  c.rect(136, 70, 8, 76, 'b')

  // 3. Stone Brick Chimney on left roof
  c.rect(26, 8, 20, 70, 'S')
  c.box(26, 8, 20, 70, 'k')
  c.rect(24, 6, 24, 6, 's')
  for (let y = 14; y < 65; y += 8) {
    c.hline(27, y, 18, 'k')
    c.vline((y % 16 === 0) ? 36 : 31, y - 8, 8, 'k')
  }

  // 4. Pitched Cedar Shingle Roof
  c.poly([8, 74, 80, 16, 152, 74], 'r')
  c.poly([14, 72, 80, 20, 146, 72], 'c')
  c.line(8, 74, 80, 16, 'k', 3)
  c.line(80, 16, 152, 74, 'k', 3)
  c.rect(76, 12, 8, 8, 'c')
  c.px(80, 10, 'C')

  // Attic round window
  c.circ(80, 48, 10, 'b')
  c.circ(80, 48, 8, 'C')
  c.hline(72, 48, 16, 'k')
  c.vline(80, 40, 16, 'k')

  // 5. Hero's Oak Doorway (Center-left)
  c.rect(34, 94, 30, 52, 'b')
  c.box(34, 94, 30, 52, 'k')
  c.rect(36, 96, 26, 50, 'B')
  c.rect(38, 98, 22, 22, 'c')
  c.rect(38, 124, 22, 20, 'c')
  c.px(60, 120, 'C')

  // 6. Cozy Window with Curtains & Flowerbox (Right)
  c.rect(80, 92, 44, 36, 'b')
  c.box(80, 92, 44, 36, 'k')
  c.rect(82, 94, 40, 32, 'C')
  c.vline(102, 94, 32, 'b')
  c.hline(82, 110, 40, 'b')
  c.poly([82, 94, 92, 94, 84, 114, 82, 114], 'r')
  c.poly([122, 94, 112, 94, 120, 114, 122, 114], 'r')
  // Flowerbox
  c.rect(78, 128, 48, 8, 'b')
  c.circ(86, 126, 3, 'r')
  c.circ(96, 125, 4, 'C')
  c.circ(108, 126, 3, 'p')
  c.circ(118, 125, 4, 'g')

  // 7. Hero Trophy Plaque above Door
  c.rect(40, 80, 18, 8, 'C')
  c.box(40, 80, 18, 8, 'b')
  c.px(48, 84, 'v')
})
