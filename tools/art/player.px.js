// Player hero for Knowledge Quest, built from parts (head, body, legs) so each animation row
// is a table of offsets instead of 40 hand-painted grids. Plan: docs/plans/2026-10-30-player-sprite-rows.md
// Parts were cut from the cyber-blue skin so the character is unchanged.
//
// Build:  node .claude/skills/pxl-pixel-art/bin/pxl.js build tools/art/player.px.js --out tools/art/out --only "hero_*"

pal({
  k: "#0f172a",                                              // outline
  d: "#1e293b",                                              // deep shadow
  b: "#0369a1", h: "#0284c7", c: "#38bdf8", e: "#a5f3fc",    // cyber blue ramp (dark -> light)
  f: "#f8fafc",                                              // visor spark
  g: "#06b6d4",                                              // scarf
  i: "#f59e0b",                                              // belt
  j: "#083344",                                              // boots
})

const F = { w: 32, h: 48 }   // one animation cell

sprite("_head", `
  ..kkkkkkkkkk..
  .kbbbbbbbbbbk.
  kbbcccccccbbbk
  kddcccccccbbbk
  kdddbbbbbbbbbk
  kdddkkkkkkkkkk
  kdddkcefeeccck
  kdddkceeeeccck
  kdddkcccccccck
  kdddkcccccccck
  kdddkkkkkkkkkk
  kdddbbbbbbbbbk
  kdddbbbbbbbbbk
  kbbbbbbbbbbbbk`)
sprite("_body", `
  ...kk..............
  ..kgggggkkkkkkkkkk.
  .kkgggbbbhhhhhhhhk.
  kbbbggbbbhhhhccchk.
  kbbbkkbbbhhhcccchk.
  .kkk.kbbbhhhcccchk.
  .....kbbbhhicccchk.
  .....kbbbhhiiccchk.
  .....kbbbhhiicccck.
  .....kbbbhhhhjjjjk.
  .....kbbbhhhhjjjjk.
  .....kbbbhhhhbbbbk.
  .....kbbbhhhhccchk.
  .....kddddddiiiddk.
  .....kddddddiiiddk.
  .....kdddddddddddk.`)
sprite("_legs", `
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kjccccbccccbk
  kjjjjjbbbbbbk
  kjjjjjbbbbbbk
  kjjjjjbbbbbbk`)
sprite("_legs_squat", `
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kbbbbbhhhhhk.
  kjccccbccccbk
  kjjjjjbbbbbbk
  kjjjjjbbbbbbk
  kjjjjjbbbbbbk`)

// A pose: where each part goes. Legs sit on the ground line (their feet stay on row 46).
const hero = (name, { head = 0, body = 0, squat = false }) => sprite(name, F,
  stamp(squat ? "_legs_squat" : "_legs", 9, squat ? 35 : 34),
  stamp("_body", 4, 18 + body),
  stamp("_head", 9, 5 + head))

// Row 0: idle (4 frames, 6 fps): the head dips, then the chest, then it comes back up
hero("hero_idle_0", { head: 0, body: 0 })
hero("hero_idle_1", { head: 1, body: 0 })
hero("hero_idle_2", { head: 1, body: 1, squat: true })
hero("hero_idle_3", { head: 1, body: 0 })
