// Held items (weapons and tools in the hero's hand) for Knowledge Quest.
// Spec: docs/plans/2026-10-30-held-items.md: 32x32, pointing up, grip at (16, 26),
// Cyber-Village 32 palette, 1px #0f172a outline, top-left light.
// Drawn on a 30x30 canvas; `outline8` adds 1px on every side, so canvas (x, y) is final (x+1, y+1).
//
// Build:  node .claude/skills/pxl-pixel-art/bin/pxl.js build tools/art/held-items.px.js --out tools/art/out
// then copy tools/art/out/sprites/*.png to public/assets/held/ (see tools/art/README.md).

pal({
  k: "#0f172a",                                              // outline
  W: "#78350f", w: "#9a3412", o: "#b45309", O: "#d97706",    // wood
  a: "#f59e0b", y: "#fde047",                                // gold
  s: "#334155", S: "#64748b", m: "#94a3b8", M: "#e2e8f0",    // steel
  x: "#f8fafc",                                              // shine
  b: "#0369a1", B: "#0284c7",                                // cyber blue
  v: "#3b0764", p: "#6d28d9", P: "#a855f7", c: "#a5f3fc",    // crystal
  n: "#38bdf8", g: "#ec4899",
})

const OPTS = { w: 30, h: 30, outline8: "k" }

// Handle on final columns 15-16, lit from the left, with a wrap band every 3 rows.
const handle = (y0, y1, dark, light) => (c) => {
  c.rect(14, y0 - 1, 1, y1 - y0 + 1, light)
  c.rect(15, y0 - 1, 1, y1 - y0 + 1, dark)
  for (let y = y0 + 1; y <= y1; y += 3) c.rect(14, y - 1, 2, 1, dark)
}

// One slim sword shape; each sword only names its colours.
// (Not `base` + `swap`: swap recolours by colour value, which would also turn a gold pommel to steel.)
const slimSword = (name, k) => sprite(name, OPTS,
  px(14, 1, k.edge),
  rect(14, 2, 2, 1, k.light),
  rect(14, 3, 2, 16, k.dark),
  rect(14, 3, 1, 16, k.light),
  rect(14, 3, 1, 15, k.edge),
  rect(10, 19, 10, 2, k.guard),
  rect(10, 19, 10, 1, k.guardLight),
  handle(22, 28, k.grip, k.gripLight),
  rect(14, 28, 2, 1, k.pommel))

slimSword("wooden-sword", { edge: "y", light: "a", dark: "O", guard: "W", guardLight: "w", grip: "W", gripLight: "w", pommel: "a" })
slimSword("iron-sword", { edge: "x", light: "M", dark: "m", guard: "s", guardLight: "m", grip: "b", gripLight: "B", pommel: "a" })

sprite("crystal-sword", OPTS,
  px(14, 1, "x"),
  rect(14, 2, 2, 1, "c"),
  rect(13, 3, 4, 16, "P"),
  rect(13, 3, 2, 16, "c"),
  rect(13, 3, 1, 15, "x"),
  rect(15, 5, 1, 12, "c"),
  rect(10, 19, 10, 2, "p"),
  rect(10, 19, 10, 1, "P"),
  rect(14, 19, 2, 2, "g"),
  handle(22, 28, "v", "p"),
  rect(14, 28, 2, 1, "n"))

sprite("axe-t1", OPTS,
  handle(4, 29, "o", "O"),
  rect(16, 4, 2, 7, "S"),
  rect(18, 3, 5, 9, "m"),
  rect(18, 3, 5, 1, "M"),
  rect(23, 2, 1, 11, "x"),
  rect(18, 11, 4, 1, "S"))

sprite("pickaxe-t1", OPTS,
  handle(7, 29, "w", "o"),
  rect(12, 2, 6, 4, "S"),
  rect(12, 2, 6, 1, "m"),
  rect(5, 3, 7, 2, "m"),
  rect(18, 3, 7, 2, "m"),
  rect(5, 3, 7, 1, "x"),
  rect(18, 3, 7, 1, "M"),
  rect(3, 5, 3, 1, "m"),
  rect(24, 5, 3, 1, "m"),
  px(3, 6, "x"),
  px(26, 6, "x"))

sprite("hammer-t1", OPTS,
  handle(11, 29, "o", "O"),
  rect(9, 2, 12, 7, "S"),
  rect(9, 2, 12, 2, "m"),
  rect(9, 2, 1, 7, "x"),
  rect(13, 2, 4, 7, "a"),
  rect(13, 2, 4, 1, "y"))

sheet("held-items", ["*-sword", "*-t1"], { pad: 1 })
