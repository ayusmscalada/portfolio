import * as THREE from 'three'
import { billboardMaterial, lineMaterial, solidMaterial, textTexture } from './kit.js'

import { SKILL_HUES as HUES } from '@/lib/palette.js'

function planetMaterial(color) {
  const c = new THREE.Color(color)
  return solidMaterial({
    uniforms: { uColor: { value: c }, uSeed: { value: Math.random() * 10 } },
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
      uniform vec3 uColor;
      uniform float uSeed;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vP;
      varying float vFog;
      void main() {
        vec3 p = normalize(vP);
        float bands = 0.5 + 0.5 * sin(p.y * 9.0 + sin(p.x * 3.0 + uSeed + uTime * 0.2) * 1.5);
        vec3 base = mix(uColor * 0.25, uColor * 0.85, bands);
        float light = max(dot(normalize(vN), normalize(vec3(-0.6, 0.5, 0.7))), 0.0);
        float rim = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.5);
        vec3 c = base * (0.25 + light * 0.9) + uColor * rim * 1.1;
        gl_FragColor = vec4(mix(uBg, c, vFog), 1.0);
      }`,
  })
}

/**
 * Skills as a solar system: one planet per skill card (orbit radius by order,
 * size by proficiency), labelled with its path. While a skill is in focus the
 * whole system turns to bring that planet to the front, the planet swells, and
 * its core skills appear as labelled moons.
 */
export function createSystem({ endpoints, glow }) {
  const group = new THREE.Group()
  const disc = new THREE.Group()
  disc.rotation.x = 0.42
  group.add(disc)
  const spin = new THREE.Group()
  disc.add(spin)

  // Star
  const star = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 32), planetMaterial('#7dd3fc'))
  disc.add(star)
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(glow, { color: '#38bdf8', opacity: 0.9, size: [7, 7] }))
  corona.frustumCulled = false
  disc.add(corona)

  const n = Math.max(1, endpoints.length)
  const step = (Math.PI * 2) / n

  const planets = endpoints.map((ep, i) => {
    const color = HUES[i % HUES.length]
    const radius = 3.0 + i * 1.65
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008, 4, 200), lineMaterial(color, 0.22))
    orbit.rotation.x = Math.PI / 2
    disc.add(orbit)

    const pivot = new THREE.Group()
    pivot.rotation.y = i * step
    spin.add(pivot)
    const holder = new THREE.Group()
    holder.position.x = radius
    pivot.add(holder)
    const scaler = new THREE.Group()
    holder.add(scaler)

    const size = 0.22 + ((ep.level ?? 70) / 100) * 0.32
    const body = new THREE.Mesh(new THREE.SphereGeometry(size, 40, 24), planetMaterial(color))
    scaler.add(body)
    const aura = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(glow, { color, opacity: 0.5, size: [size * 6, size * 6] }))
    aura.frustumCulled = false
    scaler.add(aura)
    if (i % 2 === 0) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 1.8, 0.01, 4, 90), lineMaterial(color, 0.5))
      ring.rotation.x = 1.2
      scaler.add(ring)
    }

    const { texture, aspect } = textTexture(`${ep.path ?? ''}  ${ep.level ?? ''}%`, { size: 44, color: '#f0f9ff', glow: color })
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(texture, { opacity: 0.8, size: [0.42 * aspect, 0.42] }))
    label.frustumCulled = false
    holder.add(label)

    // Moons = first skill tier, labelled when the planet is in focus.
    const moons = (ep.tiers?.[0]?.items ?? []).slice(0, 4).map((name, k) => {
      const mp = new THREE.Group()
      mp.rotation.set(0.5 - k * 0.3, k * 1.57, 0)
      const arm = new THREE.Group()
      mp.add(arm)
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), lineMaterial('#e0f2fe', 0.95))
      moon.position.x = size * 2.3 + 0.35 + k * 0.22
      arm.add(moon)
      const t = textTexture(name, { size: 40, color: '#e0f2fe', glow: color })
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(t.texture, { opacity: 0, size: [0.3 * t.aspect, 0.3] }))
      tag.position.set(moon.position.x, 0.25, 0)
      tag.frustumCulled = false
      arm.add(tag)
      holder.add(mp)
      return { arm, tag, speed: 0.5 - k * 0.08 }
    })

    return { holder, scaler, label, size, moons, weight: 0 }
  })

  let spinNow = 0.6
  return {
    group,
    /** focus: fractional planet index in view, or -1; angle: where it should sit. */
    update(t, dt, focus = -1, angle = 0) {
      const target = focus >= 0 ? angle - Math.PI / 2 - focus * step : 0.6 + Math.sin(t * 0.08) * 0.4
      spinNow += (target - spinNow) * (1 - Math.exp(-dt * 3))
      spin.rotation.y = spinNow
      planets.forEach((p, k) => {
        const w = focus >= 0 ? Math.max(0, 1 - Math.abs(focus - k)) : 0
        p.weight += (w - p.weight) * (1 - Math.exp(-dt * 4))
        // keep the planet upright while its pivot turns
        p.holder.rotation.y = -(spinNow + k * step)
        p.scaler.scale.setScalar(1 + p.weight * 0.9)
        p.scaler.rotation.y = t * 0.3
        p.label.position.y = p.size * (1 + p.weight * 0.9) + 0.5 + p.weight * 0.5
        p.label.material.uniforms.uOpacity.value = 0.55 + p.weight * 0.45
        for (const m of p.moons) {
          m.arm.rotation.y = t * m.speed
          m.tag.material.uniforms.uOpacity.value = p.weight
        }
      })
      star.rotation.y = t * 0.1
    },
  }
}
