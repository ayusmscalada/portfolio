import * as THREE from 'three'
import { billboardMaterial, cloudTexture, glowMaterial, rng } from './kit.js'

/** Deep space along the whole flight: twinkling stars, warp streaks, nebulae. */
export function createSpace({ length, mobile }) {
  const group = new THREE.Group()
  const rand = rng(7)
  const zFront = 60
  const zBack = -length - 80

  /* ---- stars ---- */
  const count = mobile ? 2600 : 6000
  const pos = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const phase = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    // Keep a clear tube around the flight path.
    let x
    let y
    do {
      x = (rand() - 0.5) * 150
      y = (rand() - 0.5) * 100
    } while (x * x + y * y < 60)
    pos.set([x, y, zFront + rand() * (zBack - zFront)], i * 3)
    size[i] = 0.6 + Math.pow(rand(), 3) * 2.6
    phase[i] = rand()
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  const stars = new THREE.Points(
    starGeo,
    glowMaterial({
      vertex: /* glsl */ `
        attribute float aSize;
        attribute float aPhase;
        varying float vA;
        varying vec3 vC;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float d = -mv.z;
          gl_PointSize = min(aSize * uPixel * 60.0 / d, 7.0 * uPixel);
          float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase * 2.0) + aPhase * 40.0);
          vA = tw * smoothstep(190.0, 30.0, d) * smoothstep(1.0, 6.0, d);
          vC = mix(vec3(0.62, 0.86, 1.0), vec3(0.8, 0.72, 1.0), step(0.7, aPhase));
        }`,
      fragment: /* glsl */ `
        varying float vA;
        varying vec3 vC;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, r);
          gl_FragColor = vec4(ink(vC), a * a * vA);
        }`,
    }),
  )
  stars.frustumCulled = false
  group.add(stars)

  /* ---- warp streaks: lines that stretch with flight speed ---- */
  const lines = mobile ? 220 : 520
  const lp = new Float32Array(lines * 6)
  const lEnd = new Float32Array(lines * 2)
  for (let i = 0; i < lines; i++) {
    const a = rand() * Math.PI * 2
    const r = 6 + rand() * 40
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r * 0.7
    const z = zFront + rand() * (zBack - zFront)
    lp.set([x, y, z, x, y, z], i * 6)
    lEnd.set([0, 1], i * 2)
  }
  const streakGeo = new THREE.BufferGeometry()
  streakGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3))
  streakGeo.setAttribute('aEnd', new THREE.BufferAttribute(lEnd, 1))
  const streakMat = glowMaterial({
    uniforms: { uVel: { value: 0 } },
    vertex: /* glsl */ `
      attribute float aEnd;
      uniform float uVel;
      varying float vA;
      void main() {
        vec3 p = position;
        p.z += aEnd * clamp(uVel, -18.0, 18.0) * 2.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vA = (1.0 - aEnd * 0.9) * clamp(abs(uVel) * 0.12, 0.0, 0.85) * fade(-mv.z);
      }`,
    fragment: /* glsl */ `
      varying float vA;
      void main() { gl_FragColor = vec4(ink(vec3(0.6, 0.88, 1.0)), vA); }`,
  })
  const streaks = new THREE.LineSegments(streakGeo, streakMat)
  streaks.frustumCulled = false
  group.add(streaks)

  /* ---- nebulae ---- */
  const palette = ['#38bdf8', '#7c3aed', '#0ea5e9', '#a855f7', '#22d3ee', '#6366f1']
  const clouds = []
  const textures = [cloudTexture(3), cloudTexture(11), cloudTexture(29)]
  textures.forEach((t) => (t.userData.shared = true))
  const nClouds = mobile ? 12 : 20
  for (let i = 0; i < nClouds; i++) {
    const side = i % 2 ? 1 : -1
    const s = 40 + rand() * 50
    const mat = billboardMaterial(textures[i % 3], {
      color: palette[i % palette.length],
      opacity: 0.22 + rand() * 0.18,
      size: [s, s * (0.6 + rand() * 0.4)],
      spin: rand() * 6.28,
    })
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
    m.position.set(side * (18 + rand() * 30), (rand() - 0.5) * 30, 20 - (i / nClouds) * (length + 60))
    m.frustumCulled = false
    m.userData.speed = (rand() - 0.5) * 0.04
    clouds.push(m)
    group.add(m)
  }

  return {
    group,
    textures,
    update(t, vel) {
      streakMat.uniforms.uVel.value = vel
      for (const c of clouds) c.material.uniforms.uSpin.value += c.userData.speed * 0.016
    },
  }
}
