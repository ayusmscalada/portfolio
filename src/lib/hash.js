/** FNV-1a 32-bit: small, fast, deterministic string hash. */
export function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Stable 7-char "commit sha" for any string. */
export function shortSha(str) {
  const a = hashString(str).toString(16).padStart(8, '0')
  const b = hashString(`${str}::`).toString(16).padStart(8, '0')
  return (a + b).slice(0, 7)
}

/** Seeded PRNG (mulberry32), used for generative project covers. */
export function seededRandom(seed) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
