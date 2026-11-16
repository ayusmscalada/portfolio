import * as THREE from 'three'
import { billboardMaterial, coverTexture, lineMaterial, solidMaterial, textTexture } from './kit.js'
import { hashString } from '@/lib/hash.js'

export const SCREEN_W = 7.2
export const SCREEN_H = 4.5

const loader = new THREE.TextureLoader()
loader.setCrossOrigin('anonymous')

function screenMaterial(map, aspect) {
  return solidMaterial({
    uniforms: {
      uMap: { value: map },
      uImgAspect: { value: aspect },
      uActive: { value: 0 },
      uHue: { value: new THREE.Color('#38bdf8') },
    },
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
      uniform float uImgAspect;
      uniform float uActive;
      uniform vec3 uHue;
      varying vec2 vUv;
      varying float vFog;
      void main() {
        // object-fit: cover, anchored to the top (screenshots read top-down)
        float screenAspect = ${(SCREEN_W / SCREEN_H).toFixed(4)};
        vec2 uv = vUv;
        if (uImgAspect > screenAspect) {
          float s = screenAspect / uImgAspect;
          uv.x = 0.5 + (uv.x - 0.5) * s;
        } else {
          float s = uImgAspect / screenAspect;
          uv.y = 1.0 - (1.0 - uv.y) * s;
        }
        vec3 c = texture2D(uMap, uv).rgb;
        float scan = 0.96 + 0.04 * sin(vUv.y * 420.0 - uTime * 6.0);
        float edge = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x) * smoothstep(0.0, 0.07, vUv.y) * smoothstep(1.0, 0.93, vUv.y);
        float sweep = smoothstep(0.08, 0.0, abs(fract(uTime * 0.12) * 1.6 - 0.3 - vUv.x - vUv.y * 0.25));
        c *= mix(0.45, 1.0, uActive) * scan * mix(0.65, 1.0, edge);
        c += uHue * sweep * 0.12 * uActive;
        gl_FragColor = vec4(mix(uBg, c, vFog), 1.0);
      }`,
  })
}

/**
 * Projects as a gallery of floating screens along the flight path. Each
 * screen shows the project image (or a generated cover), framed in light.
 */
export function createGallery({ projects, glow, layout }) {
  const group = new THREE.Group()
  const disposers = []
  const screens = projects.map((p, k) => {
    const hue = hashString(p.id ?? p.title ?? String(k)) % 360
    const color = new THREE.Color().setHSL(hue / 360, 0.85, 0.65)
    const g = new THREE.Group()
    const at = layout(k)
    g.position.copy(at.position)
    g.rotation.y = at.rotY
    group.add(g)

    const fallback = coverTexture(p, hue)
    const mat = screenMaterial(fallback, 1.6)
    mat.uniforms.uHue.value = color
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), mat)
    g.add(screen)

    if (p.image) {
      loader.load(
        p.image,
        (tex) => {
          if (mat.userData.disposed) return tex.dispose()
          tex.colorSpace = THREE.NoColorSpace
          tex.anisotropy = 8
          mat.uniforms.uMap.value = tex
          mat.uniforms.uImgAspect.value = tex.image.width / tex.image.height
          fallback.dispose()
        },
        undefined,
        () => {},
      )
    }
    disposers.push(() => (mat.userData.disposed = true))

    // Frame: outline + corner brackets
    const w = SCREEN_W / 2 + 0.12
    const h = SCREEN_H / 2 + 0.12
    const rect = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w, -h, 0), new THREE.Vector3(w, -h, 0), new THREE.Vector3(w, h, 0), new THREE.Vector3(-w, h, 0), new THREE.Vector3(-w, -h, 0),
    ])
    const frameMat = lineMaterial(color, 0.35)
    g.add(new THREE.Line(rect, frameMat))
    const c = 0.7
    const corners = []
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = sx * (w + 0.12)
      const y = sy * (h + 0.12)
      corners.push(x, y, 0, x - sx * c, y, 0, x, y, 0, x, y - sy * c, 0)
    }
    const cg = new THREE.BufferGeometry()
    cg.setAttribute('position', new THREE.Float32BufferAttribute(corners, 3))
    const cornerMat = lineMaterial('#e0f2fe', 0.9)
    g.add(new THREE.LineSegments(cg, cornerMat))

    // Back glow
    const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(glow, { color, opacity: 0.35, size: [SCREEN_W * 2.2, SCREEN_H * 2.4] }))
    back.position.z = -0.6
    back.frustumCulled = false
    back.renderOrder = -1
    g.add(back)

    // Index label
    const { texture, aspect } = textTexture(String(k + 1).padStart(2, '0'), { mono: false, weight: 800, size: 120, color: '#f0f9ff', glow: `#${color.getHexString()}` })
    const num = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), billboardMaterial(texture, { opacity: 0.85, size: [1.1 * aspect, 1.1] }))
    num.position.set(-w + 0.5, h + 0.75, 0.2)
    num.frustumCulled = false
    g.add(num)

    return { g, mat, frameMat, cornerMat, back, active: 0, base: at.position.y }
  })

  return {
    group,
    dispose() {
      disposers.forEach((d) => d())
    },
    /** `focus`: fractional index of the project currently in view (or -1). */
    update(t, dt, focus) {
      screens.forEach((s, k) => {
        const target = focus < 0 ? 0.35 : Math.max(0.35, 1 - Math.abs(focus - k) * 1.2)
        s.active += (target - s.active) * (1 - Math.exp(-dt * 4))
        s.mat.uniforms.uActive.value = s.active
        s.frameMat.uniforms.uOpacity.value = 0.15 + s.active * 0.5
        s.cornerMat.uniforms.uOpacity.value = 0.3 + s.active * 0.7
        s.back.material.uniforms.uOpacity.value = 0.12 + s.active * 0.3
        s.g.position.y = s.base + Math.sin(t * 0.8 + k) * 0.08
      })
    },
  }
}
