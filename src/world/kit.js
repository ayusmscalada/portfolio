import * as THREE from 'three'

/**
 * Shared shader kit. Colours are authored and output "raw" (no colour-space
 * conversion), so what is written here is what ends up on screen.
 *
 * Glow materials blend additively on the dark theme and switch to darker,
 * normally-blended "ink" on the light theme (applyTheme).
 */
export const shared = {
  uTime: { value: 0 },
  uLight: { value: 0 },
  uBg: { value: new THREE.Color('#050a14') },
  uPixel: { value: 1 },
}

const glowMats = new Set()

export const GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uLight;
  uniform vec3 uBg;
  uniform float uPixel;
  float fade(float d) { return smoothstep(120.0, 34.0, d) * smoothstep(0.4, 3.0, d); }
  vec3 ink(vec3 c) { return mix(c, c * vec3(0.26, 0.36, 0.5), uLight); }
`

const sharedUniforms = () => ({ uTime: shared.uTime, uLight: shared.uLight, uBg: shared.uBg, uPixel: shared.uPixel })

/** Transparent, additive (dark) / ink (light) shader material. */
export function glowMaterial({ vertex, fragment, uniforms = {}, ...rest }) {
  const m = new THREE.ShaderMaterial({
    vertexShader: GLSL + vertex,
    fragmentShader: GLSL + fragment,
    uniforms: { ...sharedUniforms(), ...uniforms },
    transparent: true,
    depthWrite: false,
    blending: shared.uLight.value ? THREE.NormalBlending : THREE.AdditiveBlending,
    ...rest,
  })
  glowMats.add(m)
  m.addEventListener('dispose', () => glowMats.delete(m))
  return m
}

/** Opaque material with custom shaders and shared uniforms (fog to background). */
export function solidMaterial({ vertex, fragment, uniforms = {}, ...rest }) {
  return new THREE.ShaderMaterial({
    vertexShader: GLSL + vertex,
    fragmentShader: GLSL + fragment,
    uniforms: { ...sharedUniforms(), ...uniforms },
    ...rest,
  })
}

export function applyTheme(light) {
  shared.uLight.value = light ? 1 : 0
  shared.uBg.value.set(light ? '#edf5fb' : '#050a14')
  glowMats.forEach((m) => {
    m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending
    m.needsUpdate = true
  })
}

/* ---- common materials -------------------------------------------------- */

/** Flat colour for lines, rings and small glowing meshes. */
export function lineMaterial(color, opacity = 1) {
  return glowMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
    vertex: /* glsl */ `
      varying float vFog;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFog = fade(-mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragment: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vFog;
      void main() { gl_FragColor = vec4(ink(uColor), uOpacity * vFog * mix(1.0, 1.3, uLight)); }`,
  })
}

/** Camera-facing quad (PlaneGeometry 1×1) showing a texture. */
export function billboardMaterial(map, { color = '#ffffff', opacity = 1, size = [1, 1], spin = 0 } = {}) {
  return glowMaterial({
    uniforms: {
      uMap: { value: map },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uSize: { value: new THREE.Vector2(...size) },
      uSpin: { value: spin },
    },
    vertex: /* glsl */ `
      uniform vec2 uSize;
      uniform float uSpin;
      varying vec2 vUv;
      varying float vFog;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float c = cos(uSpin), s = sin(uSpin);
        mv.xy += mat2(c, -s, s, c) * position.xy * uSize;
        vFog = fade(-mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragment: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vFog;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        gl_FragColor = vec4(ink(t.rgb * uColor), t.a * uOpacity * vFog * mix(1.0, 0.7, uLight));
      }`,
  })
}

/** Dark faceted glass with a fresnel rim (crystal core, crest, planets). */
export function crystalMaterial({ deep = '#06122a', rim = '#5ccfff', glint = '#a78bfa', bands = 0.06 } = {}) {
  return solidMaterial({
    uniforms: {
      uDeep: { value: new THREE.Color(deep) },
      uRim: { value: new THREE.Color(rim) },
      uGlint: { value: new THREE.Color(glint) },
      uBands: { value: bands },
    },
    vertex: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;
      varying float vFog;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        vP = position;
        vFog = fade(-mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragment: /* glsl */ `
      uniform vec3 uDeep;
      uniform vec3 uRim;
      uniform vec3 uGlint;
      uniform float uBands;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;
      varying float vFog;
      void main() {
        float f = 1.0 - max(dot(normalize(vN), normalize(vV)), 0.0);
        vec3 c = mix(uDeep, uRim, pow(f, 2.0));
        c += uGlint * pow(f, 6.0) * 1.3;
        c += uRim * uBands * (0.5 + 0.5 * sin(vP.y * 4.0 - uTime * 1.6));
        gl_FragColor = vec4(mix(uBg, c, vFog), 1.0);
      }`,
  })
}

/* ---- canvas textures --------------------------------------------------- */

function canvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.NoColorSpace
  t.anisotropy = 4
  return t
}

/** Soft radial glow (white, alpha falloff). */
export function glowTexture(size = 128) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grad.addColorStop(0.6, 'rgba(255,255,255,0.08)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return canvasTexture(c)
}

/** Billowy cloud built from many soft blobs. */
export function cloudTexture(seed = 1, size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 46; i++) {
    const r = size * (0.08 + rnd() * 0.22)
    const a = rnd() * Math.PI * 2
    const d = rnd() * size * 0.26
    const x = size / 2 + Math.cos(a) * d
    const y = size / 2 + Math.sin(a) * d * 0.7
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(255,255,255,${0.05 + rnd() * 0.07})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
  }
  return canvasTexture(c)
}

const FONT_SANS = "'Inter Variable', Inter, system-ui, sans-serif"
const FONT_MONO = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace"

/** Text label texture; returns { texture, aspect }. */
export function textTexture(text, { mono = true, weight = 600, size = 64, color = '#e0f2fe', glow = 'rgba(56,189,248,0.8)', pad = 0.6 } = {}) {
  const font = `${weight} ${size}px ${mono ? FONT_MONO : FONT_SANS}`
  const c = document.createElement('canvas')
  const g = c.getContext('2d')
  g.font = font
  const w = Math.ceil(g.measureText(text).width + size * pad * 2)
  const h = Math.ceil(size * 1.6)
  c.width = w
  c.height = h
  g.font = font
  g.textBaseline = 'middle'
  g.fillStyle = color
  g.shadowColor = glow
  g.shadowBlur = size * 0.35
  g.fillText(text, size * pad, h / 2)
  return { texture: canvasTexture(c), aspect: w / h }
}

/** Monogram for the crest: gradient letters with a halo. */
export function monogramTexture(letters) {
  const size = 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const fs = letters.length > 1 ? 230 : 320
  g.font = `800 ${fs}px ${FONT_SANS}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const grad = g.createLinearGradient(0, size * 0.25, size, size * 0.75)
  grad.addColorStop(0, '#e0f7ff')
  grad.addColorStop(0.5, '#7dd3fc')
  grad.addColorStop(1, '#c4b5fd')
  g.shadowColor = 'rgba(125,211,252,0.9)'
  g.shadowBlur = 40
  g.fillStyle = grad
  g.fillText(letters, size / 2, size / 2 + fs * 0.04)
  g.shadowBlur = 0
  g.fillText(letters, size / 2, size / 2 + fs * 0.04)
  return canvasTexture(c)
}

/** Fallback cover for projects without an image. */
export function coverTexture(project, hue) {
  const w = 1024
  const h = 640
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  const bg = g.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, `hsl(${hue} 70% 9%)`)
  bg.addColorStop(1, `hsl(${(hue + 50) % 360} 65% 16%)`)
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.strokeStyle = `hsla(${hue} 90% 70% / 0.12)`
  g.lineWidth = 1
  for (let x = 0; x <= w; x += 48) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, h)
    g.stroke()
  }
  for (let y = 0; y <= h; y += 48) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w, y)
    g.stroke()
  }
  // Concentric "signal" rings.
  for (let i = 1; i < 9; i++) {
    g.beginPath()
    g.arc(w * 0.74, h * 0.42, i * 34, 0, Math.PI * 2)
    g.strokeStyle = `hsla(${hue} 95% 72% / ${0.5 - i * 0.05})`
    g.lineWidth = 2
    g.stroke()
  }
  g.fillStyle = `hsl(${hue} 95% 78%)`
  g.font = `600 30px ${FONT_MONO}`
  g.fillText(String(project.kicker ?? '').toUpperCase().slice(0, 42), 64, h - 150)
  g.fillStyle = '#f0f9ff'
  g.font = `800 96px ${FONT_SANS}`
  g.fillText(String(project.title ?? '').slice(0, 18), 60, h - 70)
  return canvasTexture(c)
}

/** Seeded PRNG (mulberry32). */
export function rng(seed) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose()
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
    mats.forEach((m) => {
      Object.values(m.uniforms ?? {}).forEach((u) => u.value?.isTexture && !u.value.userData?.shared && u.value.dispose())
      m.dispose()
    })
  })
}
