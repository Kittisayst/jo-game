// Player poses for Knowledge Quest: one table of offsets, applied to every skin.
// Plan: docs/plans/2026-10-30-player-sprite-rows.md.  Run `python tools/art/build_player.py`.
//
// build_player.py puts a `SKINS` array in front of this file. Each skin has the head/body/legs
// pieces cut from its own source sheet (tools/art/source/) and the colours of its limbs, so every
// skin keeps its own look. A pose says where each piece goes; the sprite sheet row is the animation.
//
// Sheet rows (8 columns): idle 4, run 8, air 5, attack 6, tool 6, wall 2, hurt 3, faint 6.

const F = { w: 32, h: 48 }
const LEG_HIP = 8          // x of the leg inside its own little sprite
const BASE_LEG_Y = 34      // hip row of a standing hero

for (const s of SKINS) {
  const c = s.colors

  sprite(`_head_${s.id}`, s.head)
  sprite(`_body_${s.id}`, s.body)
  sprite(`_legs_${s.id}`, s.legs)
  sprite(`_legs_squat_${s.id}`, s.legsSquat)

  // A leg is a thigh, a shin and a boot. `knee` and `foot` shift the shin and boot sideways
  // (+ = forward), `lift` raises the foot by shortening the leg. Each leg has its own outline.
  const leg = (name, p, fill, boot, toe) => {
    sprite(name, { w: 20, h: 14, outline8: c.outline }, (cv) => {
      const lift = p.lift ?? 0
      const thigh = p.thigh ?? 5 - Math.max(0, lift - 4)
      const shin = p.shin ?? 4 - Math.min(4, lift)
      cv.rect(LEG_HIP, 0, 5, thigh, fill)
      if (shin > 0) cv.rect(LEG_HIP + p.knee, thigh, 5, shin, fill)
      cv.rect(LEG_HIP + p.foot, thigh + shin, 6, 4, boot)
      cv.rect(LEG_HIP + p.foot + 1, thigh + shin, 4, 1, toe)
    })
  }

  // Arm: a sleeve from the shoulder to a glove, outlined. The glove is where a held item is gripped.
  //   { fwd: len, y }  forward from the shoulder at row y      { up: len, x }  up at column x
  const arm = (name, a, shoulderY) => {
    sprite(name, { w: 32, h: 48, outline8: c.outline }, (cv) => {
      const glove = (gx, gy) => {
        cv.rect(gx, gy, 5, 1, c.sleeveHi)
        cv.rect(gx, gy + 1, 5, 2, c.gloveMid)
        cv.rect(gx, gy + 3, 5, 1, c.gloveBot)
      }
      if (a.fwd !== undefined) {
        cv.rect(21, a.y, a.fwd, 4, c.sleeve)
        cv.rect(21, a.y, a.fwd, 1, c.sleeveHi)
        glove(21 + a.fwd - 1, a.y)
      } else {
        const top = shoulderY - a.up
        cv.rect(a.x, top, 4, a.up + 3, c.sleeve)
        cv.rect(a.x, top, 1, a.up + 3, c.sleeveHi)
        glove(a.x - 1, top - 3)
      }
    })
  }

  // One pose. `legs: "stand"` uses the skin's own painted legs; otherwise two movable legs.
  const pose = (key, { head = [0, 0], body = [0, 0], back, front, armSpec, legY = BASE_LEG_Y, legs }) => {
    const name = `hero_${s.id}_${key}`
    const items = []
    if (legs === 'stand' || legs === 'squat') {
      items.push(stamp(legs === 'squat' ? `_legs_squat_${s.id}` : `_legs_${s.id}`, 0, legs === 'squat' ? 35 : 34))
    } else {
      leg(`_lb_${name}`, back, c.backFill, c.backBoot, c.backToe)
      leg(`_lf_${name}`, front, c.frontFill, c.frontBoot, c.frontToe)
      items.push(stamp(`_lb_${name}`, 10 + (back.dx ?? 0) - LEG_HIP - 1, legY - 1))
      items.push(stamp(`_lf_${name}`, 15 + (front.dx ?? 0) - LEG_HIP - 1, legY - 1))
    }
    items.push(stamp(`_body_${s.id}`, body[0], 18 + body[1]))
    items.push(stamp(`_head_${s.id}`, head[0], head[1]))
    if (armSpec) {
      arm(`_arm_${name}`, armSpec, 22 + body[1])
      items.push(stamp(`_arm_${name}`, body[0] - 1, -1))
    }
    sprite(name, F, ...items)
  }
  const STAND = { dx: 0, knee: 0, foot: 0 }

  // Row 0: idle (4 frames, 6 fps)
  pose('idle_0', { legs: 'stand' })
  pose('idle_1', { legs: 'stand', head: [0, 1] })
  pose('idle_2', { legs: 'squat', head: [0, 1], body: [0, 1] })
  pose('idle_3', { legs: 'stand', head: [0, 1] })

  // Row 1: run (8 frames, 12 fps): contact, down, passing, up; then the other leg leads
  pose('run_0', { back: { dx: -3, knee: -1, foot: -2, lift: 1 }, front: { dx: 3, knee: 1, foot: 2 } })
  pose('run_1', { head: [0, 1], body: [0, 1], back: { dx: -2, knee: -2, foot: -3, lift: 4 }, front: { dx: 1, knee: 0, foot: 1 } })
  pose('run_2', { back: { dx: 1, knee: 2, foot: 1, lift: 5 }, front: STAND })
  pose('run_3', { head: [0, -1], body: [0, -1], back: { dx: 2, knee: 1, foot: 2, lift: 2 }, front: { dx: -2, knee: -1, foot: -2, lift: 1 } })
  pose('run_4', { back: { dx: 3, knee: 1, foot: 2 }, front: { dx: -3, knee: -1, foot: -2, lift: 1 } })
  pose('run_5', { head: [0, 1], body: [0, 1], back: { dx: -1, knee: 0, foot: 1 }, front: { dx: 2, knee: -2, foot: -3, lift: 4 } })
  pose('run_6', { back: STAND, front: { dx: -1, knee: 2, foot: 1, lift: 5 } })
  pose('run_7', { head: [0, -1], body: [0, -1], back: { dx: -2, knee: -1, foot: -2, lift: 1 }, front: { dx: 2, knee: 1, foot: 2, lift: 2 } })

  // Row 2: air (5 frames; picked by vertical speed): takeoff, rise, apex, fall, fall wide
  pose('air_0', { head: [0, 1], body: [0, 1], back: { dx: -1, knee: -1, foot: -1, lift: 1 }, front: { dx: 1, knee: 1, foot: 1, lift: 1 } })
  pose('air_1', { head: [0, -1], body: [0, -1], back: { dx: -2, knee: -2, foot: -3, lift: 4 }, front: { dx: 1, knee: 1, foot: 2, lift: 2 }, armSpec: { up: 6, x: 23 } })
  pose('air_2', { head: [0, -1], body: [0, -1], back: { dx: -1, knee: -1, foot: -2, lift: 4 }, front: { dx: 1, knee: 1, foot: 1, lift: 3 }, armSpec: { up: 7, x: 23 } })
  pose('air_3', { back: { dx: -2, knee: -1, foot: -1 }, front: { dx: 2, knee: 1, foot: 1 }, armSpec: { up: 5, x: 23 } })
  pose('air_4', { head: [0, 1], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, armSpec: { up: 4, x: 23 } })

  // Row 3: attack (6 frames, 24 fps): raise, windup, swing, impact, follow-through, recover
  pose('attack_0', { back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 1, knee: 0, foot: 1 }, armSpec: { up: 7, x: 23 } })
  pose('attack_1', { head: [-1, 0], body: [-1, 0], back: { dx: -2, knee: -1, foot: -2 }, front: { dx: 2, knee: 1, foot: 1 }, armSpec: { up: 9, x: 22 } })
  pose('attack_2', { head: [1, 0], body: [1, 1], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, armSpec: { fwd: 6, y: 20 } })
  pose('attack_3', { head: [2, 1], body: [1, 1], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, armSpec: { fwd: 7, y: 23 } })
  pose('attack_4', { head: [1, 1], body: [1, 1], back: { dx: -2, knee: -1, foot: -2 }, front: { dx: 3, knee: 1, foot: 2 }, armSpec: { fwd: 6, y: 27 } })
  pose('attack_5', { back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 1, knee: 0, foot: 1 }, armSpec: { fwd: 3, y: 26 } })

  // Row 4: tool (6 frames, 16 fps): an overhead chop for the axe, pickaxe and hammer
  pose('tool_0', { back: STAND, front: STAND, armSpec: { fwd: 4, y: 26 } })
  pose('tool_1', { head: [0, -1], body: [0, -1], back: STAND, front: STAND, armSpec: { up: 7, x: 23 } })
  pose('tool_2', { head: [-1, -1], body: [-1, -1], back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 1, knee: 0, foot: 1 }, armSpec: { up: 10, x: 22 } })
  pose('tool_3', { head: [1, 2], body: [1, 1], back: { dx: -1, knee: 0, foot: -1 }, front: { dx: 2, knee: 1, foot: 2 }, armSpec: { fwd: 6, y: 27 } })
  pose('tool_4', { head: [1, 3], body: [1, 2], back: { dx: -1, knee: 0, foot: -1, lift: 1 }, front: { dx: 2, knee: 1, foot: 2, lift: 1 }, armSpec: { fwd: 7, y: 29 }, legY: 35 })
  pose('tool_5', { back: STAND, front: STAND, armSpec: { fwd: 4, y: 26 } })

  // Row 5: wall slide (2 frames, 8 fps)
  pose('wall_0', { back: { dx: -1, knee: -1, foot: -1, lift: 2 }, front: STAND, armSpec: { up: 5, x: 23 } })
  pose('wall_1', { head: [0, 1], body: [0, 1], back: { dx: -1, knee: 0, foot: 0 }, front: { dx: 1, knee: 1, foot: 1, lift: 2 }, armSpec: { up: 5, x: 23 } })

  // Row 6: hurt (3 frames, 12 fps): hit, stagger, recover
  pose('hurt_0', { head: [-1, -1], body: [-1, 0], back: { dx: -1, knee: -1, foot: -1 }, front: { dx: 2, knee: 1, foot: 2 }, armSpec: { up: 5, x: 24 } })
  pose('hurt_1', { head: [-2, 1], body: [-2, 0], back: { dx: -3, knee: -1, foot: -2 }, front: { dx: 1, knee: 1, foot: 1, lift: 1 }, armSpec: { fwd: 6, y: 22 } })
  pose('hurt_2', { head: [-1, 1], body: [-1, 1], back: { dx: -1, knee: 0, foot: -1, lift: 1 }, front: { dx: 1, knee: 0, foot: 1, lift: 1 } })

  // Row 7: faint (6 frames, 8 fps): stagger, knees give, kneel, slump, sit, rest.
  // The body is lowered and the legs fold short so the collapse stays inside the 32x48 cell.
  pose('faint_0', { head: [-1, 0], body: [-1, 0], back: { dx: -2, knee: -1, foot: -2 }, front: { dx: 1, knee: 1, foot: 1 } })
  pose('faint_1', { head: [-1, 3], body: [-1, 3], back: { dx: -2, knee: -1, foot: -2, thigh: 3, shin: 1 }, front: { dx: 2, knee: 1, foot: 2, thigh: 3, shin: 1 }, legY: 37 })
  pose('faint_2', { head: [0, 7], body: [0, 7], back: { dx: -2, knee: -1, foot: -3, thigh: 2, shin: 0 }, front: { dx: 2, knee: 0, foot: 2, thigh: 2, shin: 0 }, legY: 41 })
  pose('faint_3', { head: [2, 11], body: [1, 9], back: { dx: -3, knee: 0, foot: -3, thigh: 1, shin: 0 }, front: { dx: 3, knee: 0, foot: 3, thigh: 1, shin: 0 }, legY: 42 })
  pose('faint_4', { head: [3, 14], body: [1, 11], back: { dx: -3, knee: 0, foot: -3, thigh: 0, shin: 0 }, front: { dx: 4, knee: 0, foot: 3, thigh: 0, shin: 0 }, legY: 43 })
  pose('faint_5', { head: [3, 15], body: [1, 11], back: { dx: -3, knee: 0, foot: -3, thigh: 0, shin: 0 }, front: { dx: 4, knee: 0, foot: 3, thigh: 0, shin: 0 }, legY: 43 })
}
