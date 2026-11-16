import * as THREE from 'three'
import { billboardMaterial, crystalMaterial, glowMaterial, lineMaterial, monogramTexture } from './kit.js'

/* Same outline and facets as the 2D Emblem (400×400 SVG space). */
const CREST = [
  [200, 50], [234, 118], [292, 92], [274, 160], [304, 200], [262, 236], [252, 292],
  [200, 350], [148, 292], [138, 236], [96, 200], [126, 160], [108, 92], [166, 118],
]
const FACETS = [
  [[200, 50], [200, 350]],
  [[234, 118], [200, 176], [166, 118]],
  [[274, 160], [200, 176], [126, 160]],
  [[262, 236], [200, 274], [138, 236]],
  [[292, 92], [248, 150]],
  [[108, 92], [152, 150]],
]
const S = 1 / 62
const pt = ([x, y]) => new THREE.Vector2((x - 200) * S, -(y - 200) * S)

/** The emblem as a 3D glass crest with neon edges, a glowing monogram and orbits. */
export function createCrest({ glow }) {
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)

  const shape = new THREE.Shape(CREST.map(pt))
  const depth = 0.42
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 2 })
  geo.translate(0, 0, -depth / 2)
  body.add(new THREE.Mesh(geo, crystalMaterial({ deep: '#081a3a', rim: '#5ccfff', glint: '#c4b5fd', bands: 0.05 })))
  body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), lineMaterial('#7dd3fc', 0.9)))

  // Facet lines on the front face
  const zFront = depth / 2 + 0.09
  const facetPts = []
  for (const path of FACETS) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = pt(path[i])
      const b = pt(path[i + 1])
      facetPts.push(a.x, a.y, zFront, b.x, b.y, zFront)
    }
  }
  const facetGeo = new THREE.BufferGeometry()
  facetGeo.setAttribute('position', new THREE.Float32BufferAttribute(facetPts, 3))
  body.add(new THREE.LineSegments(facetGeo, lineMaterial('#a78bfa', 0.55)))

  // Monogram
  const monoMat = glowMaterial({
    uniforms: { uMap: { value: monogramTexture('·') } },
    vertex: /* glsl */ `
      varying vec2 vUv;
      varying float vFog;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFog = fade(-mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragment: /* glsl */ `
      uniform sampler2D uMap;
      varying vec2 vUv;
      varying float vFog;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        float shimmer = 0.85 + 0.15 * sin(uTime * 2.0 + vUv.x * 6.0);
        gl_FragColor = vec4(ink(t.rgb * shimmer), t.a * vFog);
      }`,
  })
  const mono = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), monoMat)
  mono.position.set(0, 0.15, zFront + 0.01)
  body.add(mono)

  // Halo, orbits and an energy trail of particles
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(glow, { color: '#2563eb', opacity: 0.5, size: [13, 13] }))
  halo.frustumCulled = false
  group.add(halo)

  const orbits = []
  for (const [r, rx, ry, color, sp] of [
    [3.5, 1.25, 0.25, '#38bdf8', 0.35],
    [4.1, 1.55, -0.5, '#a78bfa', -0.25],
  ]) {
    const g = new THREE.Group()
    g.rotation.set(rx, ry, 0)
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.01, 6, 200), lineMaterial(color, 0.45)))
    const n = 90
    const p = new Float32Array(n * 3)
    const a = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      p.set([Math.cos((i / n) * 6.283) * r, Math.sin((i / n) * 6.283) * r, 0], i * 3)
      a[i] = i / n
    }
    const tg = new THREE.BufferGeometry()
    tg.setAttribute('position', new THREE.BufferAttribute(p, 3))
    tg.setAttribute('aT', new THREE.BufferAttribute(a, 1))
    const trail = new THREE.Points(
      tg,
      glowMaterial({
        uniforms: { uSpeed: { value: sp }, uColor: { value: new THREE.Color(color) } },
        vertex: /* glsl */ `
          attribute float aT;
          uniform float uSpeed;
          varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float head = fract(uTime * uSpeed * 0.16);
            float d = fract(aT - head + 1.0);
            float tail = uSpeed > 0.0 ? 1.0 - d : d;
            vA = pow(tail, 6.0) * fade(-mv.z);
            gl_PointSize = uPixel * (1.0 + vA * 5.0) * (14.0 / -mv.z);
          }`,
        fragment: /* glsl */ `
          uniform vec3 uColor;
          varying float vA;
          void main() {
            float r = length(gl_PointCoord - 0.5);
            gl_FragColor = vec4(ink(mix(uColor, vec3(1.0), 0.4)), smoothstep(0.5, 0.0, r) * vA);
          }`,
      }),
    )
    trail.frustumCulled = false
    g.add(trail)
    orbits.push(g)
    group.add(g)
  }

  let letters = ''
  let tilt = new THREE.Vector2()

  return {
    group,
    setMonogram(text) {
      if (text === letters) return
      letters = text
      monoMat.uniforms.uMap.value.dispose()
      monoMat.uniforms.uMap.value = monogramTexture(text || '·')
    },
    update(t, dt, pointer) {
      tilt.lerp(pointer, 1 - Math.exp(-dt * 3))
      body.rotation.y = Math.sin(t * 0.4) * 0.35 + tilt.x * 0.35
      body.rotation.x = -tilt.y * 0.2
      body.position.y = Math.sin(t * 0.7) * 0.15
      orbits.forEach((g, i) => (g.rotation.z = t * (i ? -0.12 : 0.18)))
    },
  }
}
