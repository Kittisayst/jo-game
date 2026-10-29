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

// ---------------------------------------------------------------------------------------------
// Everything below uses one general pose builder: head/body offsets [dx, dy], two legs and an
// optional arm. The old hand-painted frames only had a fist stub; here the arm is its own layer.
//
// Arm: a sleeve (tube) from the shoulder to a glove, drawn in cell coordinates, then outlined.
//   { fwd: len, y }  sleeve goes forward from the shoulder (x=22) at row y
//   { up: len, x }   sleeve goes up from the shoulder row at column x
// The glove (cyan top, dark middle, blue bottom) sits at the free end. The glove is where the held
// item is gripped, so its centre is what the hand anchors are measured from later.
const armSprite = (name, arm, shoulderY) => sprite(name, { w: 32, h: 48, outline8: "k" }, (c) => {
  const glove = (gx, gy) => {
    c.rect(gx, gy, 5, 1, "c")
    c.rect(gx, gy + 1, 5, 2, "j")
    c.rect(gx, gy + 3, 5, 1, "b")
  }
  if (arm.fwd !== undefined) {
    const y = arm.y
    c.rect(21, y, arm.fwd, 4, "h")
    c.rect(21, y, arm.fwd, 1, "c")
    glove(21 + arm.fwd - 1, y)
  } else {
    const x = arm.x
    const top = shoulderY - arm.up
    c.rect(x, top, 4, arm.up + 3, "h")
    c.rect(x, top, 1, arm.up + 3, "c")
    glove(x - 1, top - 3)
  }
})

const pose = (name, { head = [0, 0], body = [0, 0], back, front, arm, legY = 34 }) => {
  const legs = (leg, side, fill, boot, hipX) => {
    const n = `_l${side}_${name}`
    sprite(n, { w: 20, h: 14, outline8: "k" }, (c) => {
      const lift = leg.lift ?? 0
      const thigh = leg.thigh ?? 5 - Math.max(0, lift - 4)
      const shin = leg.shin ?? 4 - Math.min(4, lift)
      c.rect(LEG_HIP, 0, 5, thigh, fill)
      if (shin > 0) c.rect(LEG_HIP + leg.knee, thigh, 5, shin, fill)
      c.rect(LEG_HIP + leg.foot, thigh + shin, 6, 4, boot)
      c.rect(LEG_HIP + leg.foot + 1, thigh + shin, 4, 1, "c")
    })
    return stamp(n, hipX + (leg.dx ?? 0) - LEG_HIP - 1, legY - 1)
  }
  const items = [legs(back, "b", "b", "j", 10), legs(front, "f", "h", "b", 15), stamp("_body", 4 + body[0], 18 + body[1]), stamp("_head", 9 + head[0], 5 + head[1])]
  if (arm) {
    armSprite(`_arm_${name}`, arm, 22 + body[1])
    items.push(stamp(`_arm_${name}`, body[0] - 1, -1))
  }
  sprite(name, F, ...items)
}
const STAND = { dx: 0, knee: 0, foot: 0 }

// Row 2: air (5 frames; chosen by vertical speed, not played): takeoff, rise, apex, fall, fall wide
pose("hero_air_0", { head: [0, 1], body: [0, 1], back: { dx: -1, knee: -1, foot: -1, lift: 1 }, front: { dx: 1, knee: 1, foot: 1, lift: 1 } })
pose("hero_air_1", { body: [0, -1], head: [0, -1], back: { dx: -2, knee: -2, foot: -3, lift: 4 }, front: { dx: 1, knee: 1, foot: 2, lift: 2 }, arm: { up: 6, x: 23 } })
pose("hero_air_2", { body: [0, -1], head: [0, -1], back: { dx: -1, knee: -1, foot: -2, lift: 4 }, front: { dx: 1, knee: 1, foot: 1, lift: 3 }, arm: { up: 7, x: 23 } })
pose("hero_air_3", { back: { dx: -2, knee: -1, foot: -1 }, front: { dx: 2, knee: 1, foot: 1 }, arm: { up: 5, x: 23 } })
pose("hero_air_4", { head: [0, 1], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, arm: { up: 4, x: 23 } })

// Row 3: attack (6 frames, sword): raise behind, windup, swing, impact, follow-through, recover
pose("hero_attack_0", { back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 1, knee: 0, foot: 1 }, arm: { up: 7, x: 23 } })
pose("hero_attack_1", { head: [-1, 0], body: [-1, 0], back: { dx: -2, knee: -1, foot: -2 }, front: { dx: 2, knee: 1, foot: 1 }, arm: { up: 9, x: 22 } })
pose("hero_attack_2", { head: [1, 0], body: [1, 1], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, arm: { fwd: 6, y: 20 } })
pose("hero_attack_3", { head: [2, 1], body: [1, 1], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, arm: { fwd: 9, y: 23 } })
pose("hero_attack_4", { head: [1, 1], body: [1, 1], back: { dx: -2, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, arm: { fwd: 6, y: 27 } })
pose("hero_attack_5", { back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 1, knee: 0, foot: 1 }, arm: { fwd: 3, y: 26 } })

// Row 4: tool (6 frames): an overhead chop for the axe, pickaxe and hammer
pose("hero_tool_0", { back: STAND, front: STAND, arm: { fwd: 4, y: 26 } })
pose("hero_tool_1", { body: [0, -1], head: [0, -1], back: STAND, front: STAND, arm: { up: 7, x: 23 } })
pose("hero_tool_2", { head: [-1, -1], body: [-1, -1], back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 1, knee: 0, foot: 1 }, arm: { up: 10, x: 22 } })
pose("hero_tool_3", { head: [1, 2], body: [1, 1], back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 2, knee: 1, foot: 2 }, arm: { fwd: 6, y: 27 } })
pose("hero_tool_4", { head: [1, 3], body: [1, 2], back: { dx: -1, knee: 0, foot: -1, lift: 1 }, front: { dx: 2, knee: 1, foot: 2, lift: 1 }, arm: { fwd: 7, y: 29 }, legY: 35 })
pose("hero_tool_5", { back: STAND, front: STAND, arm: { fwd: 4, y: 26 } })

// Row 5: wall slide (2 frames): a hand up on the wall, legs scrabbling
pose("hero_wall_0", { back: { dx: -1, knee: -1, foot: -1, lift: 2 }, front: { dx: 0, knee: 0, foot: 0 }, arm: { up: 5, x: 23 } })
pose("hero_wall_1", { body: [0, 1], head: [0, 1], back: { dx: -1, knee: 0, foot: 0 }, front: { dx: 1, knee: 1, foot: 1, lift: 2 }, arm: { up: 5, x: 23 } })

// Row 6: hurt (3 frames): hit, stagger, recover
pose("hero_hurt_0", { head: [-1, -1], body: [-1, 0], back: { dx: -1, knee: -1, foot: -1 }, front: { dx: 2, knee: 1, foot: 2 }, arm: { up: 5, x: 24 } })
pose("hero_hurt_1", { head: [-2, 1], body: [-2, 0], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 1, knee: 1, foot: 1, lift: 1 }, arm: { fwd: 6, y: 22 } })
pose("hero_hurt_2", { head: [-1, 1], body: [-1, 1], back: { dx: -1, knee: 0, foot: -1, lift: 1 }, front: { dx: 1, knee: 0, foot: 1, lift: 1 } })

// Row 7: faint (6 frames, 8 fps): stagger, knees give, kneel, slump, sit, rest. The body is lowered
// and the legs fold short so the whole collapse stays inside the 32x48 cell.
pose("hero_faint_0", { head: [-1, 0], body: [-1, 0], back: { dx: -2, knee: -1, foot: -2 }, front: { dx: 1, knee: 1, foot: 1 } })
pose("hero_faint_1", { head: [-1, 3], body: [-1, 3], back: { dx: -2, knee: -1, foot: -2, thigh: 3, shin: 1 }, front: { dx: 2, knee: 1, foot: 2, thigh: 3, shin: 1 }, legY: 37 })
pose("hero_faint_2", { head: [0, 7], body: [0, 7], back: { dx: -2, knee: -1, foot: -3, thigh: 2, shin: 0 }, front: { dx: 2, knee: 0, foot: 2, thigh: 2, shin: 0 }, legY: 41 })
pose("hero_faint_3", { head: [2, 11], body: [1, 9], back: { dx: -3, knee: 0, foot: -3, thigh: 1, shin: 0 }, front: { dx: 3, knee: 0, foot: 3, thigh: 1, shin: 0 }, legY: 42 })
pose("hero_faint_4", { head: [3, 14], body: [1, 11], back: { dx: -3, knee: 0, foot: -3, thigh: 0, shin: 0 }, front: { dx: 4, knee: 0, foot: 3, thigh: 0, shin: 0 }, legY: 43 })
pose("hero_faint_5", { head: [3, 15], body: [1, 11], back: { dx: -3, knee: 0, foot: -3, thigh: 0, shin: 0 }, front: { dx: 4, knee: 0, foot: 3, thigh: 0, shin: 0 }, legY: 43 })
