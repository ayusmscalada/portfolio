import * as THREE from 'three'
import { billboardMaterial, glowMaterial, lineMaterial } from './kit.js'

/** The end of the journey: a swirling portal pulling particles into it. */
export function createPortal({ glow, mobile }) {
  const group = new THREE.Group()
  const R = 6.2

  const vortex = new THREE.Mesh(
    new THREE.CircleGeometry(R, 96),
    glowMaterial({
      vertex: /* glsl */ `
        varying vec2 vP;
        varying float vFog;
        void main() {
          vP = position.xy;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFog = fade(-mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragment: /* glsl */ `
        varying vec2 vP;
        varying float vFog;
        void main() {
          float r = length(vP) / ${R.toFixed(2)};
          float a = atan(vP.y, vP.x);
          float swirl = sin(a * 5.0 + log(r + 0.02) * 9.0 - uTime * 2.2);
          float swirl2 = sin(a * 3.0 - log(r + 0.02) * 6.0 + uTime * 1.3);
          float arms = smoothstep(0.2, 1.0, swirl * 0.6 + swirl2 * 0.4);
          vec3 c = mix(vec3(0.2, 0.75, 1.0), vec3(0.6, 0.4, 1.0), smoothstep(0.1, 0.9, r));
          float core = smoothstep(0.35, 0.0, r);
          float edge = smoothstep(1.0, 0.75, r);
          float alpha = (arms * 0.55 * smoothstep(0.0, 0.5, r) + core * 1.2) * edge;
          gl_FragColor = vec4(ink(c + core * 0.6), alpha * vFog);
        }`,
    }),
  )
  group.add(vortex)

  const rings = []
  for (const [r, w, color, o] of [
    [R + 0.15, 0.06, '#38bdf8', 0.95],
    [R + 0.75, 0.015, '#a78bfa', 0.5],
    [R + 1.4, 0.01, '#67e8f9', 0.3],
  ]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, w, 6, 220), lineMaterial(color, o))
    rings.push(ring)
    group.add(ring)
  }

  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(glow, { color: '#3b82f6', opacity: 0.6, size: [30, 30] }))
  halo.frustumCulled = false
  halo.renderOrder = -1
  group.add(halo)

  // Infalling particles
  const n = mobile ? 700 : 1600
  const seed = new Float32Array(n)
  for (let i = 0; i < n; i++) seed[i] = Math.random()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const dust = new THREE.Points(
    geo,
    glowMaterial({
      vertex: /* glsl */ `
        attribute float aSeed;
        varying float vA;
        void main() {
          float life = fract(aSeed * 13.7 + uTime * (0.05 + aSeed * 0.05));
          float r = (1.0 - life) * 13.0 + 0.3;
          float a = aSeed * 6.283 * 7.0 + life * 7.0;
          vec3 p = vec3(cos(a) * r, sin(a) * r, (1.0 - life) * 6.0 * (aSeed - 0.5));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPixel * (1.0 + aSeed * 2.0) * (20.0 / -mv.z);
          vA = smoothstep(0.0, 0.2, life) * smoothstep(1.0, 0.85, life) * fade(-mv.z);
        }`,
      fragment: /* glsl */ `
        varying float vA;
        void main() {
          float r = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(ink(vec3(0.7, 0.9, 1.0)), smoothstep(0.5, 0.0, r) * vA);
        }`,
    }),
  )
  dust.frustumCulled = false
  group.add(dust)

  return {
    group,
    update(t) {
      rings[1].rotation.z = t * 0.2
      rings[2].rotation.z = -t * 0.1
      rings[1].rotation.x = Math.sin(t * 0.3) * 0.15
      rings[2].rotation.y = Math.cos(t * 0.25) * 0.15
    },
  }
}
