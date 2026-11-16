import * as THREE from 'three'
import { billboardMaterial, crystalMaterial, glowMaterial, glowTexture, lineMaterial } from './kit.js'

/**
 * Hero "core": a faceted crystal with a burning heart, a breathing particle
 * shell that parts around the pointer and ripples on click, a wire cage and
 * three tilted orbit rings with satellites.
 */
export function createCore({ mobile, glow }) {
  const group = new THREE.Group()

  // Crystal
  const crystalGeo = new THREE.IcosahedronGeometry(1.45, 0).toNonIndexed()
  crystalGeo.computeVertexNormals()
  const crystal = new THREE.Mesh(crystalGeo, crystalMaterial({ deep: '#071634', rim: '#67d4ff', glint: '#b49cff', bands: 0.1 }))
  group.add(crystal)

  // Heart + halo
  const heart = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(glow, { color: '#9be7ff', opacity: 0.95, size: [3.4, 3.4] }))
  heart.frustumCulled = false
  heart.material.depthTest = false // inner light shows through the glass
  group.add(heart)
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(glow, { color: '#3b82f6', opacity: 0.55, size: [15, 15] }))
  halo.frustumCulled = false
  halo.renderOrder = -1
  group.add(halo)

  // Wire cage
  const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.55, 1)), lineMaterial('#38bdf8', 0.28))
  group.add(cage)

  // Particle shell (Fibonacci sphere)
  const n = mobile ? 2200 : 4200
  const R = 3.4
  const pos = new Float32Array(n * 3)
  const seed = new Float32Array(n)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i
    pos.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3)
    seed[i] = Math.random()
  }
  const shellGeo = new THREE.BufferGeometry()
  shellGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  shellGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const shellMat = glowMaterial({
    uniforms: { uMouse: { value: new THREE.Vector3(99, 99, 99) }, uMouseOn: { value: 0 }, uPulse: { value: 99 }, uR: { value: R } },
    vertex: /* glsl */ `
      attribute float aSeed;
      uniform vec3 uMouse;
      uniform float uMouseOn;
      uniform float uPulse;
      uniform float uR;
      varying float vA;
      varying vec3 vC;
      void main() {
        vec3 dir = normalize(position);
        vec3 p = position;
        float n = sin(p.x * 1.4 + uTime * 0.9) * sin(p.y * 1.7 - uTime * 0.7) * sin(p.z * 1.3 + uTime * 0.6);
        p *= 1.0 + n * 0.08;
        // click ripple travelling from the front pole to the back
        float front = 1.0 - (dir.z * 0.5 + 0.5);
        float wave = exp(-pow(uPulse * 2.2 - front * 2.0, 2.0) * 6.0) * exp(-uPulse * 0.9);
        p *= 1.0 + wave * 0.3;
        // pointer parts the shell
        vec3 d = p - uMouse;
        float k = uMouseOn * exp(-dot(d, d) * 0.55);
        p += normalize(d + 1e-4) * k * 1.1;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = clamp(dir.z * 0.5 + 0.5, 0.0, 1.0);
        gl_PointSize = uPixel * (1.6 + aSeed * 2.2 + wave * 3.0) * (16.0 / -mv.z);
        float tw = 0.7 + 0.3 * sin(uTime * 2.0 + aSeed * 40.0);
        vA = (mix(0.25, 1.0, depth) * tw + wave * 1.5 + k * 0.8) * fade(-mv.z);
        vC = mix(vec3(0.35, 0.82, 1.0), vec3(0.7, 0.55, 1.0), smoothstep(-0.6, 0.9, dir.y + aSeed * 0.4));
        vC = mix(vC, vec3(1.0), wave * 0.6);
      }`,
    fragment: /* glsl */ `
      varying float vA;
      varying vec3 vC;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, r);
        gl_FragColor = vec4(ink(vC), a * vA);
      }`,
  })
  const shell = new THREE.Points(shellGeo, shellMat)
  shell.frustumCulled = false
  group.add(shell)

  // Orbit rings + satellites
  const rings = []
  const RING = [
    { r: 4.6, tilt: [1.2, 0.2, 0], color: '#38bdf8', speed: 0.5 },
    { r: 5.4, tilt: [1.45, -0.6, 0.3], color: '#a78bfa', speed: -0.35 },
    { r: 6.3, tilt: [1.05, 0.9, -0.2], color: '#67e8f9', speed: 0.25 },
  ]
  const satMat = billboardMaterial(glow, { color: '#e0f7ff', opacity: 1, size: [0.55, 0.55] })
  for (const def of RING) {
    const g = new THREE.Group()
    g.rotation.set(...def.tilt)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(def.r, 0.012, 6, 220), lineMaterial(def.color, 0.55))
    g.add(ring)
    const pivot = new THREE.Group()
    const sat = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), satMat)
    sat.position.x = def.r
    sat.frustumCulled = false
    pivot.add(sat)
    g.add(pivot)
    g.userData = { pivot, speed: def.speed }
    rings.push(g)
    group.add(g)
  }

  let pulseAt = -99
  const mouseTarget = new THREE.Vector3(99, 99, 99)
  let mouseOn = 0

  return {
    group,
    pulse(t) {
      pulseAt = t
    },
    /** Pointer position in world space (or null when away). */
    pointer(world) {
      if (world) mouseTarget.copy(shell.worldToLocal(world.clone()))
      mouseOn = world ? 1 : 0
    },
    update(t, dt) {
      crystal.rotation.y = t * 0.25
      crystal.rotation.x = Math.sin(t * 0.3) * 0.3
      cage.rotation.y = -t * 0.12
      cage.rotation.z = t * 0.05
      shell.rotation.y = t * 0.06
      for (const g of rings) g.userData.pivot.rotation.z = t * g.userData.speed
      const u = shellMat.uniforms
      u.uPulse.value = t - pulseAt
      u.uMouse.value.lerp(mouseTarget, 1 - Math.exp(-dt * 8))
      u.uMouseOn.value += (mouseOn - u.uMouseOn.value) * (1 - Math.exp(-dt * 5))
      group.position.y = 1.1 + Math.sin(t * 0.6) * 0.12
    },
  }
}
