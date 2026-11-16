import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { applyTheme, disposeTree, glowTexture, shared } from './kit.js'
import { createSpace } from './space.js'
import { createCore } from './core.js'
import { createCrest } from './crest.js'
import { createSystem } from './system.js'
import { createGallery } from './gallery.js'
import { createJourney } from './journey.js'
import { createPortal } from './portal.js'

/* ---- world plan: where every station sits along the flight -------------- */

const PROJECT_GAP = 26
const ROLE_GAP = 20

function plan(content) {
  const nP = Math.max(1, content.projects?.length ?? 0)
  const nR = Math.max(1, content.experience?.roles?.length ?? 0)
  const projZ = (k) => -146 - k * PROJECT_GAP
  const roleZ = (i) => projZ(nP - 1) - 42 - i * ROLE_GAP
  const portalZ = roleZ(nR - 1) - 38
  return { projZ, roleZ, portalZ }
}

const V = (x, y, z) => new THREE.Vector3(x, y, z)

/* Solar system (skills): centre, disc tilt, and where a focused planet sits. */
export const SYS = { y: -1.6, z: -96, tilt: 0.42 }
export const planetRadius = (k) => 3.0 + k * 1.65
export const focusAngle = (portrait) => (portrait ? 0 : 0.55)
function planetWorld(k, portrait) {
  const r = planetRadius(k)
  const a = focusAngle(portrait)
  const px = r * Math.sin(a)
  const pz = r * Math.cos(a)
  return V(px, SYS.y - pz * Math.sin(SYS.tilt), SYS.z + pz * Math.cos(SYS.tilt))
}

/** Camera pose for a stage key, for landscape or portrait screens. */
function poseFor(key, P, portrait) {
  const [name, idx] = key.split('-')
  const i = Number(idx) || 0
  if (!portrait) {
    switch (name) {
      case 'hero': return { cam: V(0, 0, 13.5), look: V(0, 0.4, 0) }
      case 'about': return { cam: V(-0.4, 0.9, -32.5), look: V(-1.9, 0.5, -46) }
      case 'skills': return { cam: V(0, 7.5, -76), look: V(0, -2.6, -96) }
      case 'skill': {
        const w = planetWorld(i, false)
        return { cam: w.clone().add(V(-3.6, 2.2, 10.5)), look: w.clone().add(V(-3.9, -0.2, 0)) }
      }
      case 'gallery': return { cam: V(-3.5, 2.2, P.projZ(0) + 24), look: V(-5, 0.4, P.projZ(0) - 34) }
      case 'project': return { cam: V(0.2, 0.7, P.projZ(i) + 11.5), look: V(1.5, 0.35, P.projZ(i)) }
      case 'role': return { cam: V(0, 0.6, P.roleZ(i) + 8), look: V(0, 0.1, P.roleZ(i) - 14) }
      case 'contact': return { cam: V(0, 0, P.portalZ + 17), look: V(0, 0, P.portalZ) }
    }
  } else {
    switch (name) {
      case 'hero': return { cam: V(0, -0.6, 17), look: V(0, -0.4, 0) }
      case 'about': return { cam: V(-5.2, -2.6, -31), look: V(-5.2, -2.4, -46) }
      case 'skills': return { cam: V(0, 10, -71), look: V(0, -2.6, -96) }
      case 'skill': {
        const w = planetWorld(i, true)
        return { cam: w.clone().add(V(0, -1.8, 11)), look: w.clone().add(V(0, -2.2, 0)) }
      }
      case 'gallery': return { cam: V(0, 2, P.projZ(0) + 32), look: V(0, 0, P.projZ(0)) }
      case 'project': return { cam: V(0, -2.4, P.projZ(i) + 15.5), look: V(0, -2.4, P.projZ(i)) }
      case 'role': return { cam: V(0, 0.6, P.roleZ(i) + 9), look: V(0, 0.1, P.roleZ(i) - 14) }
      case 'contact': return { cam: V(0, -2, P.portalZ + 22), look: V(0, -2, P.portalZ) }
    }
  }
  return null
}

const smooth = (t) => t * t * (3 - 2 * t)

/* ---- engine ------------------------------------------------------------ */

export function createWorld(canvas, { content, reduced: startReduced = false, onReady }) {
  const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches
  let portrait = window.innerWidth / window.innerHeight < 0.9
  let reduced = startReduced

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: mobile, powerPreference: 'high-performance', alpha: false })
  } catch {
    return null
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75)
  renderer.setPixelRatio(dpr)
  shared.uPixel.value = dpr

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 420)

  const composer = mobile ? null : new EffectComposer(renderer)
  let bloom = null
  if (composer) {
    composer.addPass(new RenderPass(scene, camera))
    bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.75, 0.55, 0.16)
    composer.addPass(bloom)
  }

  const glow = glowTexture()
  glow.userData.shared = true

  /* static parts */
  const space = createSpace({ length: 900, mobile })
  scene.add(space.group)
  const core = createCore({ mobile, glow })
  scene.add(core.group)
  const crest = createCrest({ glow })
  scene.add(crest.group)
  const portal = createPortal({ glow, mobile })
  scene.add(portal.group)

  /* content-driven parts */
  let P = plan(content)
  let parts = null
  let latest = content

  function build(c) {
    latest = c
    if (parts) {
      parts.gallery.dispose()
      scene.remove(parts.group)
      disposeTree(parts.group)
    }
    P = plan(c)
    const group = new THREE.Group()
    const system = createSystem({ endpoints: c.capabilities?.endpoints ?? [], glow })
    system.group.position.set(0, -1.6, -96)
    group.add(system.group)
    const gallery = createGallery({
      projects: c.projects ?? [],
      glow,
      layout: (k) => (portrait ? { position: V(0, 0.4, P.projZ(k)), rotY: 0 } : { position: V(3.7, 0.35, P.projZ(k)), rotY: -0.2 }),
    })
    group.add(gallery.group)
    const roles = c.experience?.roles ?? []
    const journey = createJourney({ roles, zAt: P.roleZ, zStart: P.projZ(Math.max(0, (c.projects?.length ?? 1) - 1)) - 20, zEnd: P.portalZ })
    group.add(journey.group)
    scene.add(group)
    parts = { group, system, gallery, journey }

    crest.setMonogram(c.monogram ?? '')
    crest.group.position.set(-5.2, 0.4, -46)
    portal.group.position.set(0, 0, P.portalZ)
    refreshAnchors()
  }

  /* ---- scroll rig ---- */
  let anchors = []
  let camCurve = null
  let lookCurve = null
  let docH = 0

  function refreshAnchors() {
    const vh = window.innerHeight
    const max = Math.max(0, document.documentElement.scrollHeight - vh)
    docH = document.documentElement.scrollHeight
    anchors = [...document.querySelectorAll('[data-stage]')]
      .map((el) => {
        const pose = poseFor(el.dataset.stage, P, portrait)
        if (!pose) return null
        const r = el.getBoundingClientRect()
        const top = r.top + window.scrollY
        const y = el.dataset.stageAlign === 'top' ? top : top + r.height / 2 - vh / 2
        return { y: Math.min(max, Math.max(0, y)), key: el.dataset.stage, ...pose }
      })
      .filter(Boolean)
      .sort((a, b) => a.y - b.y)
    if (anchors.length >= 2) {
      camCurve = new THREE.CatmullRomCurve3(anchors.map((a) => a.cam), false, 'centripetal')
      lookCurve = new THREE.CatmullRomCurve3(anchors.map((a) => a.look), false, 'centripetal')
    } else {
      camCurve = lookCurve = null
    }
  }

  const want = { cam: V(0, 0, 13.5), look: V(0, 0.4, 0) }
  const seg = { i: 0, te: 0 }

  /** Fractional index of the "prefix-k" stop in view (between two stops), or -1. */
  function focusOf(prefix) {
    const idx = (a) => (a && a.key.startsWith(`${prefix}-`) ? Number(a.key.slice(prefix.length + 1)) : null)
    const ka = idx(anchors[seg.i])
    const kb = idx(anchors[seg.i + 1])
    if (ka != null && kb != null) return ka + (kb - ka) * seg.te
    if (ka != null) return seg.te < 0.5 ? ka : -1
    if (kb != null) return seg.te > 0.5 ? kb : -1
    return -1
  }

  function desired(y) {
    if (!camCurve) {
      const p = anchors[0] ?? poseFor('hero', P, portrait)
      want.cam.copy(p.cam)
      want.look.copy(p.look)
      return
    }
    const n = anchors.length
    let u
    if (y <= anchors[0].y) {
      u = 0
      seg.i = 0
      seg.te = 0
    } else if (y >= anchors[n - 1].y) {
      u = 1
      seg.i = n - 2
      seg.te = 1
    } else {
      let i = 0
      while (i < n - 2 && anchors[i + 1].y <= y) i++
      const span = anchors[i + 1].y - anchors[i].y
      const t = span < 1 ? 1 : (y - anchors[i].y) / span
      seg.i = i
      seg.te = smooth(Math.min(1, Math.max(0, t)))
      u = (i + seg.te) / (n - 1)
    }
    camCurve.getPoint(u, want.cam)
    lookCurve.getPoint(u, want.look)
  }

  /* ---- input ---- */
  const pointer = new THREE.Vector2()
  const pointerTarget = new THREE.Vector2()
  let pointerIn = false
  const onMove = (e) => {
    pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    pointerIn = true
    if (reduced) requestRender()
  }
  const onLeave = () => (pointerIn = false)
  const onDown = (e) => {
    if (e.target.closest?.('a, button, input, textarea, select, [role="dialog"]')) return
    if (window.scrollY < window.innerHeight * 0.8) core.pulse(clock)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', onLeave)
  window.addEventListener('pointerdown', onDown, { passive: true })

  /* ---- sizing & theme ---- */
  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    composer?.setSize(w, h)
    bloom?.resolution.set(w / 2, h / 2)
    camera.aspect = w / h
    const nowPortrait = w / h < 0.9
    camera.updateProjectionMatrix()
    if (nowPortrait !== portrait) {
      portrait = nowPortrait
      build(latest)
    } else refreshAnchors()
    requestRender()
  }
  const onResize = () => resize()
  window.addEventListener('resize', onResize)

  const root = document.documentElement
  const setTheme = () => {
    const light = root.dataset.theme === 'light'
    applyTheme(light)
    renderer.setClearColor(shared.uBg.value, 1)
    if (bloom) bloom.enabled = !light
    requestRender()
  }
  const themeObs = new MutationObserver(setTheme)
  themeObs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

  /* ---- loop ---- */
  const raycaster = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hit = new THREE.Vector3()
  const ndc = new THREE.Vector2()
  const camPos = V(0, 0, 13.5)
  const camLook = V(0, 0.4, 0)
  const right = V(0, 0, 0)
  const up = V(0, 1, 0)
  let clock = 0
  let last = performance.now()
  let vel = 0
  let frame = 0
  let ready = false
  let rendering = false

  function render(now) {
    frame = 0
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!reduced) clock += dt
    shared.uTime.value = clock
    if (document.documentElement.scrollHeight !== docH) refreshAnchors()

    desired(window.scrollY)
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3.4)
    const prevZ = camPos.z
    camPos.lerp(want.cam, k)
    camLook.lerp(want.look, k)
    const v = dt > 0 ? (prevZ - camPos.z) / dt : 0
    vel += (v - vel) * Math.min(1, dt * 6)

    pointer.lerp(pointerIn ? pointerTarget : ndc.set(0, 0), 1 - Math.exp(-dt * 3))
    camera.position.copy(camPos)
    camera.lookAt(camLook)
    right.setFromMatrixColumn(camera.matrix, 0)
    camera.position.addScaledVector(right, pointer.x * 0.5).addScaledVector(up, pointer.y * 0.32 + Math.sin(clock * 0.5) * 0.06)
    camera.lookAt(camLook)
    const baseFov = portrait ? 62 : 50
    const fov = baseFov + (reduced ? 0 : Math.min(9, Math.abs(vel) * 0.07))
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    // Pointer over the core parts its particle shell.
    if (pointerIn && camPos.z > -8) {
      raycaster.setFromCamera(pointer, camera)
      plane.constant = -core.group.position.z
      if (raycaster.ray.intersectPlane(plane, hit) && hit.distanceTo(core.group.position) < 6) core.pointer(hit)
      else core.pointer(null)
    } else core.pointer(null)

    core.update(clock, dt)
    crest.update(clock, reduced ? 10 : dt, pointer)
    portal.update(clock)
    space.update(clock, reduced ? 0 : vel)
    if (parts) {
      // Paused motion renders one frame per scroll, so settle eased values at once.
      const ease = reduced ? 10 : dt
      parts.system.update(clock, ease, focusOf('skill'), focusAngle(portrait))
      parts.journey.update(clock)
      parts.gallery.update(clock, ease, focusOf('project'))
    }

    if (composer && bloom.enabled) composer.render(dt)
    else renderer.render(scene, camera)

    if (!ready) {
      ready = true
      onReady?.()
    }
    if (!reduced && rendering) frame = requestAnimationFrame(render)
  }

  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render)
  }
  const onScroll = () => reduced && requestRender()
  window.addEventListener('scroll', onScroll, { passive: true })

  function start() {
    rendering = !document.hidden
    if (rendering) requestRender()
  }
  const onVisibility = () => {
    if (document.hidden) {
      rendering = false
      cancelAnimationFrame(frame)
      frame = 0
    } else {
      last = performance.now()
      start()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  build(content)
  setTheme()
  resize()
  start()

  return {
    setContent(c) {
      build(c)
      requestRender()
    },
    refresh() {
      refreshAnchors()
      requestRender()
    },
    setReduced(r) {
      reduced = r
      last = performance.now()
      requestRender()
    },
    destroy() {
      cancelAnimationFrame(frame)
      rendering = false
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      themeObs.disconnect()
      if (parts) parts.gallery.dispose()
      disposeTree(scene)
      glow.dispose()
      space.textures.forEach((t) => t.dispose())
      composer?.dispose()
      renderer.dispose()
    },
  }
}
