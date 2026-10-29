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

// ---------------------------------------------------------------------------------------------
// Legs as two movable parts. A leg is a thigh, a shin and a boot; `knee` and `foot` shift the shin
// and boot sideways (+ = forward), `lift` raises the foot by shortening the leg. Each leg gets its
// own 1px outline so the front leg reads as separate from the back leg.
const LEG_HIP = 8   // x of the leg inside its own sprite
const legSprite = (name, fill, bootFill, p) => sprite(name, { w: 20, h: 14, outline8: "k" }, (c) => {
  const thigh = 5 - Math.max(0, (p.lift ?? 0) - 4)
  const shin = 4 - Math.min(4, p.lift ?? 0)
  c.rect(LEG_HIP, 0, 5, thigh, fill)
  c.rect(LEG_HIP + p.knee, thigh, 5, shin, fill)
  c.rect(LEG_HIP + p.foot, thigh + shin, 6, 4, bootFill)
  c.rect(LEG_HIP + p.foot + 1, thigh + shin, 4, 1, "c")
})

// A running pose: back leg (dark) and front leg (light) with a hip shift each, body and head offsets.
const runPose = (name, { head = 0, body = 0, back, front }) => {
  legSprite(`_lb_${name}`, "b", "j", back)
  legSprite(`_lf_${name}`, "h", "b", front)
  sprite(name, F,
    stamp(`_lb_${name}`, 10 + (back.dx ?? 0) - LEG_HIP - 1, 33),
    stamp(`_lf_${name}`, 15 + (front.dx ?? 0) - LEG_HIP - 1, 33),
    stamp("_body", 4, 18 + body),
    stamp("_head", 9, 5 + head))
}

// Row 1: run (8 frames, 12 fps). Frames 0-3 the front leg leads, frames 4-7 the back leg leads.
//   contact -> down (body lowest) -> passing -> up (body highest, both feet off the ground)
runPose("hero_run_0", { back: { dx: -3, knee: -1, foot: -2, lift: 1 }, front: { dx: 3, knee: 1, foot: 2 } })
runPose("hero_run_1", { head: 1, body: 1, back: { dx: -2, knee: -2, foot: -3, lift: 4 }, front: { dx: 1, knee: 0, foot: 1 } })
runPose("hero_run_2", { back: { dx: 1, knee: 2, foot: 1, lift: 5 }, front: { dx: 0, knee: 0, foot: 0 } })
runPose("hero_run_3", { head: -1, body: -1, back: { dx: 2, knee: 1, foot: 2, lift: 2 }, front: { dx: -2, knee: -1, foot: -2, lift: 1 } })
runPose("hero_run_4", { back: { dx: 3, knee: 1, foot: 2 }, front: { dx: -3, knee: -1, foot: -2, lift: 1 } })
runPose("hero_run_5", { head: 1, body: 1, back: { dx: -1, knee: 0, foot: 1 }, front: { dx: 2, knee: -2, foot: -3, lift: 4 } })
runPose("hero_run_6", { back: { dx: 0, knee: 0, foot: 0 }, front: { dx: -1, knee: 2, foot: 1, lift: 5 } })
runPose("hero_run_7", { head: -1, body: -1, back: { dx: -2, knee: -1, foot: -2, lift: 1 }, front: { dx: 2, knee: 1, foot: 2, lift: 2 } })
