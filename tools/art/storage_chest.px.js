// Storage chest asset for Knowledge Quest
// 26x18px - Classic 16-bit RPG wooden treasure chest with reinforced iron bands, rivets, and golden lock plate

pal({
  k: '#120c08', // deepest dark outline
  d: '#241206', // dark wood shadow / crease
  b: '#451a03', // plank shadow / seam
  B: '#78350f', // deep wood body
  w: '#92400e', // rich cedar/oak
  W: '#b45309', // warm golden wood
  c: '#d97706', // bright wood plank
  C: '#f59e0b', // top plank highlight
  x: '#fde68a', // wood glint / shine

  // Iron bands & fittings
  s: '#1e293b', // dark slate iron
  i: '#334155', // iron band shadow
  I: '#475569', // mid iron band
  m: '#64748b', // light iron
  h: '#94a3b8', // iron highlight
  r: '#cbd5e1', // iron rivet highlight

  // Brass / Gold latch & keyhole
  g: '#713f12', // bronze/dark gold rim
  G: '#a16207', // gold shadow
  y: '#ca8a04', // warm gold
  Y: '#eab308', // bright gold latch
  z: '#fef08a', // gold glint
  o: '#120c08', // keyhole
})

// Symmetric chest (mx: true mirrors left 13 columns into 26 columns total)
sprite('storage_chest', { mx: true }, `
  ....kkkkkkkkk
  ..kkIhhhCCCCC
  .kIImhxCCCCcc
  .kImrIbWcWWcW
  kIImIIbWWWWWW
  kImrIwbWwwGyY
  kssiiddbbwGyY
  .kImIIwbWWGyo
  .kImrIwbWWGYz
  .kImIIwbbbbGy
  .kImrIwbCcccc
  .kImIIwbWWcWW
  .kImrIwbWWWWW
  .kImIIwbbbbbb
  .kImrIwbWcWWW
  .kImIIwbWWWWW
  ..kIIiissiiii
  ...kkkkkkkkkk
`)
