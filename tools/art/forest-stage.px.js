// Forest Stage art for Knowledge Quest: ground tile, grass-top platform, 3-layer parallax backdrop and decor.
// Original art (palette and shapes are ours); the layering idea follows modern pixel platformers.
//
// Built with pxl, then copied (and the backdrop upscaled 2x) by build_forest_stage.py:
//   python tools/art/build_forest_stage.py
//   node .claude/skills/pxl-pixel-art/bin/pxl.js build tools/art/forest-stage.px.js --out tools/art/out

pal({
  k: '#2a1830', // outline
  // rock / soil (purple-brown)
  R: '#4d3548', r: '#6b4a5e', q: '#8d6a78',
  // grass
  d: '#2c6a3a', G: '#3f9040', g: '#6cc04a', h: '#b4e86a',
  // stone and bark
  S: '#625a75', s: '#8a7f9a', t: '#b5adc4',
  B: '#5e3b2a', b: '#8a5a3a',
  // sky
  A: '#58aee9', C: '#86c8f0', D: '#b4def5', E: '#dff1fa',
  // cloud
  w: '#ffffff', W: '#d9ecf8', v: '#b9d7ea',
  // far hills, mid trees
  x: '#9ccbc0', y: '#82b9ae',
  m: '#5f9d70', n: '#4a8460', o: '#3a6b52',
  // flowers
  p: '#f06a8a', Y: '#ffd75a',
})
ramps('kdGgh', 'kRrq', 'kSst', 'kBb')

// ---------------------------------------------------------------- ground: 64x64, tiles sideways
// Strata run every 16 px and the joints swap sides line by line, so wall_forest (the rock body under a raised
// ground block) continues the pattern of the ground tile above it without a seam.
function strata (c, lines, skipTop) {
  lines.forEach(({ y, off }) => {
    if (!skipTop || y > skipTop) c.hline(0, y, 64, 'R')
    for (let x = off; x < 64; x += 32) c.vline(x, y + 2, Math.min(14, 64 - (y + 2)), 'R')
    if (!skipTop || y > skipTop) c.hline(0, y + 1, 64, 'q')
  })
}

sprite('ground_forest', { w: 64, h: 64 },
  rect(0, 0, 64, 64, 'r'),
  (c) => strata(c, [{ y: 20, off: 16 }, { y: 36, off: 0 }, { y: 52, off: 16 }], 0),
  // grass cap with scalloped drips (period 8 divides 64)
  rect(0, 0, 64, 8, 'g'),
  rect(0, 8, 64, 3, 'G'),
  (c) => {
    for (let x = 0; x < 64; x += 8) {
      c.rect(x + 1, 11, 5, 2, 'G')
      c.rect(x + 2, 13, 3, 1, 'd')
    }
    for (let x = 3; x < 64; x += 16) c.rect(x, 0, 6, 2, 'h')
    c.hline(0, 8, 64, 'd')
  })

// the rock under a raised block: tiles in both directions
sprite('wall_forest', { w: 64, h: 64 },
  rect(0, 0, 64, 64, 'r'),
  (c) => {
    // the cell above line y=4 belongs to the joints of the line before (y=-12, joints at 16 and 48)
    c.vline(16, 0, 4, 'R'); c.vline(48, 0, 4, 'R')
    strata(c, [{ y: 4, off: 0 }, { y: 20, off: 16 }, { y: 36, off: 0 }, { y: 52, off: 16 }], -1)
  })

// ---------------------------------------------------------------- platform: 160x28
sprite('_plat_half', { w: 158, h: 26, mx: true, outline: 'k' },
  poly([0, 7, 79, 7, 79, 17, 70, 21, 58, 25, 44, 25, 30, 21, 16, 16, 4, 11, 0, 9], 'r'),
  poly([0, 11, 79, 11, 79, 14, 60, 22, 40, 22, 18, 15, 4, 12], 'R'),
  rect(0, 0, 79, 7, 'g'),
  rect(0, 7, 79, 3, 'G'),
  (c) => {
    for (let x = 2; x < 79; x += 8) { c.rect(x, 10, 4, 2, 'G'); c.px(x + 1, 12, 'd') }
    for (let x = 4; x < 79; x += 13) c.rect(x, 0, 5, 2, 'h')
    c.hline(0, 7, 79, 'd')
    for (let x = 10; x < 79; x += 19) c.px(x, 14 + (x % 3), 'q')
  })
sprite('platform_forest', { w: 160, h: 28 }, stamp('_plat_half', 0, 0))

// ---------------------------------------------------------------- decor
sprite('bush_a', { w: 48, h: 24, mx: true, outline: 'k' },
  ellipse(24, 22, 24, 6, 'G'),
  circ(10, 14, 9, 'g'), circ(19, 10, 10, 'g'), circ(23, 16, 8, 'g'),
  shade([0, 18, 24, 6], 1),
  scatter('_leaf', 0, 4, 24, 18, 10, { on: 'g', clip: true }))
sprite('_leaf', 'hh\n.h')

sprite('bush_b', { w: 32, h: 16, mx: true, outline: 'k' },
  ellipse(16, 15, 16, 4, 'G'),
  circ(9, 9, 7, 'g'), circ(15, 7, 7, 'g'),
  shade([0, 12, 16, 4], 1))

sprite('tuft', { w: 20, h: 10 },
  line(3, 9, 2, 3, 'G'), line(7, 9, 7, 1, 'g'), line(11, 9, 12, 2, 'G'), line(15, 9, 17, 4, 'g'),
  line(9, 9, 9, 4, 'h'))

sprite('flowers', { w: 24, h: 12 },
  line(4, 11, 4, 5, 'G'), line(12, 11, 12, 3, 'G'), line(20, 11, 20, 6, 'G'),
  rect(3, 3, 3, 3, 'p'), px(4, 4, 'Y'),
  rect(11, 1, 3, 3, 'Y'), px(12, 2, 'w'),
  rect(19, 4, 3, 3, 'p'), px(20, 5, 'Y'))

sprite('rock_a', { w: 36, h: 16, mx: true, outline: 'k' },
  poly([0, 15, 1, 8, 6, 3, 13, 1, 18, 2, 18, 15], 's'),
  poly([0, 15, 0, 11, 18, 9, 18, 15], 'S'),
  hline(5, 4, 8, 't'))
sprite('rock_b', { w: 22, h: 10, mx: true, outline: 'k' },
  poly([0, 9, 1, 4, 5, 1, 11, 0, 11, 9], 's'),
  poly([0, 9, 0, 7, 11, 6, 11, 9], 'S'),
  hline(3, 2, 5, 't'))

sprite('pillar_stone', { w: 36, h: 48, mx: true, outline: 'k' },
  rect(2, 4, 16, 44, 's'),
  (c) => {
    for (let i = 0; i < 6; i++) {
      const y = 8 + i * 7
      c.hline(2, y, 16, 'S')
      c.vline(i % 2 ? 7 : 12, y - 6, 6, 'S')
    }
  },
  rect(0, 0, 18, 5, 't'), hline(0, 4, 18, 's'),
  shade([0, 38, 18, 10], 1),
  rect(2, 4, 3, 44, 's'), light([3, 20, 1, 30], 1))

sprite('tree_big', { w: 88, h: 150, mx: true, outline: 'k' },
  rect(36, 70, 8, 80, 'b'),
  rect(40, 70, 4, 80, 'B'),
  poly([30, 150, 36, 134, 44, 150], 'b'),
  circ(30, 54, 24, 'g'), circ(40, 30, 21, 'g'), circ(18, 70, 16, 'g'), circ(42, 76, 14, 'g'),
  shade([0, 80, 44, 30], 1),
  scatter('_leaf', 0, 8, 44, 84, 26, { on: 'g', clip: true }),
  scatter('_leafd', 0, 40, 44, 50, 12, { on: 'g', clip: true }))
sprite('_leafd', 'GG\nG.')

// ---------------------------------------------------------------- backdrop (640x360, shown 2x)
scene('forest_sky', { w: 640, h: 360 },
  grad(0, 0, 640, 360, 'ACDE', 'v', 0.6))

// clouds stay clear of the edges, so the layer repeats without a seam
sprite('_cloud_a', { w: 64, h: 24 },
  ellipse(32, 18, 30, 6, 'W'),
  circ(20, 14, 9, 'w'), circ(34, 10, 11, 'w'), circ(46, 15, 8, 'w'),
  ellipse(32, 19, 28, 4, 'w'),
  hline(8, 21, 48, 'W'))
sprite('_cloud_b', { w: 40, h: 16 },
  ellipse(20, 12, 19, 4, 'W'),
  circ(14, 9, 6, 'w'), circ(24, 7, 7, 'w'), circ(30, 10, 5, 'w'),
  hline(5, 14, 30, 'W'))
scene('forest_clouds', { w: 640, h: 360 },
  stamp('_cloud_a', 40, 36), stamp('_cloud_b', 150, 70), stamp('_cloud_a', 270, 24, { flip: 'x' }),
  stamp('_cloud_b', 380, 54), stamp('_cloud_a', 470, 88), stamp('_cloud_b', 580, 30))

// far hills: a sum of sines with whole numbers of waves, so the layer repeats seamlessly
scene('forest_hills', { w: 640, h: 360 }, (c) => {
  const T = Math.PI * 2 / 640
  for (let x = 0; x < 640; x++) {
    const y = Math.round(214 + 22 * Math.sin(x * T * 2 + 1) + 12 * Math.sin(x * T * 5 + 2) + 5 * Math.sin(x * T * 11))
    c.rect(x, y, 1, 360 - y, 'x')
    c.rect(x, y + 14 + Math.round(4 * Math.sin(x * T * 7)), 1, 360, 'y')
    c.px(x, y, 'y')
  }
})

// mid tree line: round and pointed crowns, each drawn three times so one that crosses an edge wraps
scene('forest_trees', { w: 640, h: 360 }, (c) => {
  const r = c.rng(7)
  const base = 300
  const trees = []
  for (let i = 0; i < 16; i++) {
    const x = Math.round(i * 40 + 10 + r() * 20)
    trees.push({ x, h: 56 + Math.round(r() * 44), w: 14 + Math.round(r() * 10), pine: r() < 0.5, tone: r() < 0.5 ? 'm' : 'n' })
  }
  for (const dx of [-640, 0, 640]) {
    for (const t of trees) {
      const x = t.x + dx
      c.rect(x - 1, base - 18, 3, 24, 'B')
      if (t.pine) {
        for (let k = 0; k < 4; k++) {
          const wy = t.w - k * 3
          c.poly([x - wy, base - 14 - k * (t.h / 5), x, base - 36 - k * (t.h / 5) - 10, x + wy, base - 14 - k * (t.h / 5)], k % 2 ? t.tone : 'o')
        }
      } else {
        c.ellipse(x, base - 30 - t.h / 4, t.w, t.h / 2.2, t.tone)
        c.ellipse(x - 3, base - 36 - t.h / 4, t.w - 6, t.h / 3.2, 'm')
        c.ellipse(x + 4, base - 20, t.w - 4, 9, 'o')
      }
    }
  }
  c.rect(0, base + 6, 640, 60, 'o')
})
