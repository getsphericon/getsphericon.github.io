// Renders the hero animation of the Sphericon mark as ASCII frames, the way ghostty.org does its
// hero: the animation is drawn once at build time and the page only plays the frames back. Each
// frame is the mark from src/assets/logo.svg seen in 3D: the sphere spins about the orbit's axis
// and the contact travels the orbit, passing behind the sphere. Frame 0 is the logo as drawn.
// The output, src/generated/logo-frames.json, is an array of HTML strings: the orbit and contact are
// in <b>, the far side of the orbit, seen through the sphere, in <i>.
import { mkdir, writeFile } from 'node:fs/promises'

const COLS = 64
const ROWS = 28
const FRAMES = 96 // 4 s at 24 fps
const SAMPLES = 4 // per cell side

// Logo units, normalized: the sphere is r=30 at (32,32), so it becomes the unit circle; y points
// down as in SVG and z toward the viewer. A monospace cell is 0.6em by the 1.2em line height.
const cellW = 0.04
const cellH = cellW * 2

const ORBIT_TILT = (-28 * Math.PI) / 180 // the ellipse's rotate(-28)
const ORBIT_RY = 11 / 30 // how flat the orbit looks, so how far we see it from its plane
const ORBIT_STROKE = 3.5 / 30 / 2
const CONTACT_R = 6 / 30
const CONTACT_GAP = 1.5 / 30 // the contact's indigo outline, which parts it from the orbit
const SPIN = Math.PI / 3 // the sphere turns 60° a loop; meridians every 30° keep it seamless

const SPHERE_RAMP = ' .:-=+*#%@'
const ORBIT_RAMP = ' .-=*#'

const cos = Math.cos(ORBIT_TILT)
const sin = Math.sin(ORBIT_TILT)
const depth = Math.sqrt(1 - ORBIT_RY ** 2)

// The orbit at angle a: on screen, then its depth. The upper half (sin a < 0) is the near side,
// which is where the logo puts the contact.
const orbitAt = (a: number) => {
  const x = Math.cos(a)
  const y = Math.sin(a) * ORBIT_RY
  return { x: x * cos - y * sin, y: x * sin + y * cos, z: -Math.sin(a) * depth }
}

// The orbit's axis, and two directions in its plane, for the sphere's latitude and longitude.
const rotate = (x: number, y: number, z: number) => ({ x: x * cos - y * sin, y: x * sin + y * cos, z })
const axis = rotate(0, depth, ORBIT_RY)
const e1 = rotate(1, 0, 0)
const e2 = rotate(0, ORBIT_RY, -depth)
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z

const light = (() => {
  const l = { x: -0.55, y: -0.65, z: 0.8 }
  const n = Math.hypot(l.x, l.y, l.z)
  return { x: l.x / n, y: l.y / n, z: l.z / n }
})()

// Where the contact sits in the logo: (45.1, 15.5).
const contactStart = (() => {
  const x = (45.1 - 32) / 30
  const y = (15.5 - 32) / 30
  const ux = x * cos + y * sin
  const uy = -x * sin + y * cos
  return Math.atan2(uy / ORBIT_RY, ux)
})()

// Distance from p to the orbit on screen, and the depth of the nearest orbit point.
const ORBIT_STEPS = 720
const orbitPoints = Array.from({ length: ORBIT_STEPS }, (_, i) => orbitAt((2 * Math.PI * i) / ORBIT_STEPS))
const nearestOrbit = (x: number, y: number) => {
  let best = Infinity
  let z = 0
  for (const p of orbitPoints) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2
    if (d < best) {
      best = d
      z = p.z
    }
  }
  return { d: Math.sqrt(best), z }
}

const lineDarkening = (angle: number, step: number, width: number) => {
  const off = Math.abs(((angle % step) + step) % step - step / 2)
  return off > step / 2 - width ? 0.75 : 1
}

type Sample = { layer: 'none' | 'sphere' | 'orbit' | 'orbitBehind' | 'contact' | 'gap'; v: number }

const sample = (x: number, y: number, frame: number, orbit: { d: number; z: number }): Sample => {
  const t = frame / FRAMES
  const c = orbitAt(contactStart + 2 * Math.PI * t)
  const r2 = x * x + y * y
  const sz = r2 < 1 ? Math.sqrt(1 - r2) : -Infinity

  const dc = Math.hypot(x - c.x, y - c.y)
  if (c.z >= 0 || Math.hypot(c.x, c.y) > 1 || dc > CONTACT_R + CONTACT_GAP) {
    // The contact is in front of the sphere here, or beside it.
    if (dc <= CONTACT_R) return { layer: 'contact', v: 1 }
    if (dc <= CONTACT_R + CONTACT_GAP && (c.z >= 0 || r2 >= 1)) return { layer: 'gap', v: 0 }
  }

  if (orbit.d <= ORBIT_STROKE && (orbit.z >= 0 || r2 >= 1)) return { layer: 'orbit', v: 1 }

  if (r2 < 1) {
    const n = { x, y, z: sz }
    const lambert = Math.max(0, dot(n, light))
    const lat = Math.asin(dot(n, axis))
    const lon = Math.atan2(dot(n, e2), dot(n, e1)) + SPIN * t
    const grid = Math.min(lineDarkening(lon, Math.PI / 6, 0.05), lineDarkening(lat, Math.PI / 6, 0.05))
    const v = (0.4 + 0.6 * lambert) * grid
    // The far half of the orbit shows through faintly, as the logo draws the whole ellipse.
    if (orbit.d <= ORBIT_STROKE * 0.7) return { layer: 'orbitBehind', v: 0.45 }
    return { layer: 'sphere', v }
  }
  return { layer: 'none', v: 0 }
}

const frames: string[] = []
const orbitCache = new Map<string, { d: number; z: number }>()

for (let f = 0; f < FRAMES; f++) {
  const lines: string[] = []
  for (let row = 0; row < ROWS; row++) {
    let line = ''
    let open = '' // the tag the current run is in: b for the orbit and contact, i for the far orbit
    for (let col = 0; col < COLS; col++) {
      const counts = { none: 0, sphere: 0, orbit: 0, orbitBehind: 0, contact: 0, gap: 0 }
      let sphereV = 0
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = (col - COLS / 2 + (sx + 0.5) / SAMPLES) * cellW
          const y = (row - ROWS / 2 + (sy + 0.5) / SAMPLES) * cellH
          const key = `${col},${row},${sx},${sy}`
          let orbit = orbitCache.get(key)
          if (!orbit) orbitCache.set(key, (orbit = nearestOrbit(x, y)))
          const s = sample(x, y, f, orbit)
          counts[s.layer]++
          if (s.layer === 'sphere' || s.layer === 'orbitBehind') sphereV += s.v
        }
      }
      const total = SAMPLES * SAMPLES
      const pick = (ramp: string, v: number) => ramp[Math.min(ramp.length - 1, Math.round(v * (ramp.length - 1)))]
      let ch = ' '
      let tag = ''
      if (counts.contact / total >= 0.3) {
        ch = '@'
        tag = 'b'
      } else if (counts.gap / total >= 0.5) {
        ch = ' '
      } else if (counts.orbit / total >= 0.25) {
        ch = pick(ORBIT_RAMP, Math.min(1, (counts.orbit / total) * 1.6))
        tag = 'b'
      } else if (counts.orbitBehind / total >= 0.4) {
        ch = '-'
        tag = 'i'
      } else if (counts.sphere > 0) {
        ch = pick(SPHERE_RAMP, sphereV / total)
      }
      if (ch === ' ') tag = open // keep runs unbroken across blanks
      if (tag !== open) {
        if (open) line += `</${open}>`
        if (tag) line += `<${tag}>`
        open = tag
      }
      line += ch
    }
    if (open) line += `</${open}>`
    // Every line keeps its trailing blanks, so the frame never changes width as the contact moves.
    lines.push(line)
  }
  frames.push(lines.join('\n'))
}

const outDir = new URL('../src/generated/', import.meta.url)
await mkdir(outDir, { recursive: true })
await writeFile(new URL('logo-frames.json', outDir), JSON.stringify(frames))
console.log(`rendered ${FRAMES} logo frames`)
