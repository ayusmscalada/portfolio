import * as THREE from 'three'
import { billboardMaterial, glowMaterial, lineMaterial, textTexture } from './kit.js'

/**
 * Career as a light-highway: a hexagonal gate per role (the current role
 * pulses), year labels, and a scrolling grid floor running to the portal.
 */
export function createJourney({ roles, zAt, zStart, zEnd }) {
  const group = new THREE.Group()

  const gates = roles.map((r, i) => {
    const current = r.end == null
    const color = current ? '#38bdf8' : i % 2 ? '#a78bfa' : '#67e8f9'
    const g = new THREE.Group()
    g.position.set(0, 0, zAt(i))
    const gate = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.035, 6, 6), lineMaterial(color, current ? 0.95 : 0.6))
    gate.rotation.z = Math.PI / 6
    g.add(gate)
    const inner = new THREE.Mesh(new THREE.TorusGeometry(5.15, 0.012, 4, 6), lineMaterial(color, 0.3))
    inner.rotation.z = Math.PI / 6
    g.add(inner)

    const text = `${r.start ?? ''} — ${r.end ?? 'NOW'}`
    const { texture, aspect } = textTexture(text, { size: 52, color: '#f0f9ff', glow: color })
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(texture, { opacity: 0.9, size: [0.55 * aspect, 0.55] }))
    label.position.set(0, 5.1, 0)
    label.frustumCulled = false
    g.add(label)
    group.add(g)
    return { g, gate, current }
  })

  // Grid floor
  const len = Math.max(20, zStart - zEnd + 40)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, len, 1, 1),
    glowMaterial({
      vertex: /* glsl */ `
        varying vec2 vW;
        varying float vFog;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xz;
          vec4 mv = viewMatrix * w;
          vFog = fade(-mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragment: /* glsl */ `
        varying vec2 vW;
        varying float vFog;
        float line(float x, float w) { float f = abs(fract(x) - 0.5); return smoothstep(w, 0.0, 0.5 - f); }
        void main() {
          vec2 p = vW / 2.0;
          float g = max(line(p.x, 0.04), line(p.y + uTime * 0.8, 0.04));
          float lane = smoothstep(0.25, 0.0, abs(abs(vW.x) - 3.2));
          float side = smoothstep(30.0, 4.0, abs(vW.x));
          vec3 c = mix(vec3(0.15, 0.45, 1.0), vec3(0.55, 0.4, 1.0), smoothstep(-20.0, 20.0, vW.x));
          float a = (g * 0.35 + lane * 0.6) * side * vFog;
          gl_FragColor = vec4(ink(c), a);
        }`,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, -4.2, (zStart + zEnd) / 2)
  floor.frustumCulled = false
  group.add(floor)

  return {
    group,
    update(t) {
      gates.forEach((s, i) => {
        s.gate.rotation.z = Math.PI / 6 + Math.sin(t * 0.3 + i) * 0.05
        if (s.current) s.gate.material.uniforms.uOpacity.value = 0.65 + Math.sin(t * 3) * 0.3
      })
    },
  }
}
