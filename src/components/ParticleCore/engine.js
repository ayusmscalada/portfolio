/**
 * ParticleCore engine: a dependency-free WebGL point cloud.
 *
 * - One draw call, one static vertex buffer: all motion runs in the vertex shader.
 * - The cloud is a breathing sphere that unfolds into a particle wave as the
 *   hero scrolls away, reacts to the pointer, and fires a shockwave on click.
 * - The render loop stops completely when the canvas is offscreen or the tab is hidden.
 *
 * Loaded lazily (dynamic import) so it never competes with first paint.
 */

const VERT = /* glsl */ `
precision highp float;
attribute vec3 aSphere;
attribute vec3 aWave;
attribute float aSeed;
attribute float aKind;   // 0 = core particle, 1 = background star

uniform float uTime;
uniform float uIntro;
uniform float uMorph;
uniform float uAspect;
uniform float uScale;
uniform float uOffsetY;
uniform float uPixel;
uniform float uSize;
uniform float uLight;
uniform vec2  uMouse;
uniform float uMouseOn;
uniform vec2  uTilt;
uniform vec4  uRipple;   // xyz = origin on the unit sphere, w = start time

varying float vAlpha;
varying vec3  vColor;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  float t = uTime;

  // Background star field: screen-space, slow upward drift, parallax, twinkle.
  if (aKind > 0.5) {
    vec2 sp = aSphere.xy;
    sp.y = fract(sp.y * 0.5 + 0.5 + t * 0.006 * (0.4 + aSeed)) * 2.0 - 1.0;
    sp -= uTilt * (0.25 + aSphere.z * 0.6);
    gl_Position = vec4(sp, 0.0, 1.0);
    gl_PointSize = (1.2 + aSeed * 2.2) * uPixel;
    float tw = 0.5 + 0.5 * sin(t * (0.7 + aSeed * 2.3) + aSeed * 80.0);
    vAlpha = (0.12 + 0.5 * tw * tw) * smoothstep(0.0, 1.0, uIntro) * (1.0 - uMorph * 0.6);
    vColor = mix(mix(vec3(0.49, 0.83, 0.99), vec3(0.66, 0.55, 0.98), step(0.7, aSeed)), vec3(0.04, 0.3, 0.5), uLight);
    return;
  }

  vec3 n = aSphere;

  // Organic breathing on the sphere surface.
  float d = sin(n.x * 3.7 + t * 0.9) * sin(n.y * 4.6 - t * 0.7) * sin(n.z * 4.1 + t * 0.55);

  // Shockwave travelling across the surface from the ripple origin.
  float age = t - uRipple.w;
  float rd = distance(n, uRipple.xyz);
  float ring = step(0.0, age) * exp(-pow((rd - age * 1.35) * 5.5, 2.0)) * exp(-age * 0.9);

  vec3 sphere = n * (1.0 + d * 0.07 + ring * 0.22);

  // The wave: a rolling particle landscape (a nod to the original hero art).
  vec3 wave = aWave;
  wave.y += sin(wave.x * 1.5 + t * 0.8) * 0.2 + sin(wave.z * 2.4 - t * 0.6 + wave.x * 0.8) * 0.12;

  // Staggered morph so the sphere peels apart instead of snapping.
  float m = smoothstep(aSeed * 0.4, aSeed * 0.4 + 0.6, uMorph);
  vec3 p = mix(sphere, wave, m);

  // Intro: particles condense from a wide scatter.
  float k = smoothstep(aSeed * 0.5, aSeed * 0.5 + 0.5, uIntro);
  p = mix(n * (2.6 + aSeed * 3.5), p, k);

  p.xz = rot(t * 0.07 * (1.0 - m) + uTilt.x) * p.xz;
  p.yz = rot(uTilt.y + m * 0.42) * p.yz;

  float cam = 3.4;
  float persp = 2.25 / (cam - p.z);
  vec2 sc = p.xy * persp;

  // Pointer repulsion in screen space.
  vec2 diff = sc - uMouse;
  float md = length(diff);
  sc += (diff / (md + 1e-4)) * uMouseOn * 0.16 * exp(-md * md * 16.0);

  gl_Position = vec4(sc.x * uScale / uAspect, sc.y * uScale + uOffsetY, 0.0, 1.0);

  float depth = clamp((p.z + 1.3) / 2.6, 0.0, 1.0);
  gl_PointSize = uSize * uPixel * persp * (0.55 + aSeed * 0.9) * (1.0 + ring * 1.6);

  float twinkle = 0.8 + 0.2 * sin(t * 1.6 + aSeed * 60.0);
  vAlpha = mix(0.3, 1.0, depth) * twinkle * k;

  // Scan band sweeping vertically: the "live" heartbeat of the core.
  float band = exp(-pow((n.y - sin(t * 0.33) * 1.15) * 8.0, 2.0)) * (1.0 - m);

  vec3 cyan   = mix(vec3(0.49, 0.83, 0.99), vec3(0.03, 0.42, 0.66), uLight);
  vec3 violet = mix(vec3(0.66, 0.55, 0.98), vec3(0.36, 0.22, 0.75), uLight);
  vec3 ice    = mix(vec3(0.92, 0.98, 1.0),  vec3(0.02, 0.2, 0.36),  uLight);
  vColor = mix(cyan, violet, smoothstep(-0.9, 1.1, p.x * 0.7 - p.y * 0.5));
  vColor = mix(vColor, ice, clamp(band * 0.85 + ring * 0.9, 0.0, 1.0));
}
`

const FRAG = /* glsl */ `
precision mediump float;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.05, length(c)) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a, a); // premultiplied
}
`

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader')
  return sh
}

function buildGeometry(count, stars) {
  const total = count + stars
  const sphere = new Float32Array(total * 3)
  const wave = new Float32Array(total * 3)
  const seed = new Float32Array(total)
  const kind = new Float32Array(total)
  for (let i = count; i < total; i++) {
    sphere[i * 3] = Math.random() * 2 - 1
    sphere[i * 3 + 1] = Math.random() * 2 - 1
    sphere[i * 3 + 2] = Math.random()
    seed[i] = Math.random()
    kind[i] = 1
  }
  const golden = Math.PI * (3 - Math.sqrt(5))
  const cols = Math.ceil(Math.sqrt(count * 3.4))
  const rows = Math.ceil(count / cols)

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere: even coverage, no clumping at the poles.
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i
    sphere[i * 3] = Math.cos(th) * r
    sphere[i * 3 + 1] = y
    sphere[i * 3 + 2] = Math.sin(th) * r

    const c = i % cols
    const row = Math.floor(i / cols)
    wave[i * 3] = (c / (cols - 1) - 0.5) * 6.2
    wave[i * 3 + 1] = -0.55
    wave[i * 3 + 2] = (row / Math.max(1, rows - 1) - 0.5) * 2.8

    seed[i] = Math.random()
  }
  return { sphere, wave, seed, kind, total }
}

export function createParticleCore(canvas, { host = canvas.parentElement, reducedMotion = false, onStats } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' })
  if (!gl) throw new Error('webgl unavailable')

  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link')
  gl.useProgram(program)

  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const cores = navigator.hardwareConcurrency || 4
  const count = small ? 5200 : cores <= 4 ? 8000 : 11000
  const stars = small ? 220 : 520
  const geo = buildGeometry(count, stars)

  const bind = (name, data, size) => {
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0)
  }
  bind('aSphere', geo.sphere, 3)
  bind('aWave', geo.wave, 3)
  bind('aSeed', geo.seed, 1)
  bind('aKind', geo.kind, 1)

  const U = {}
  for (const name of ['uTime', 'uIntro', 'uMorph', 'uAspect', 'uScale', 'uOffsetY', 'uPixel', 'uSize', 'uLight', 'uMouse', 'uMouseOn', 'uTilt', 'uRipple']) {
    U[name] = gl.getUniformLocation(program, name)
  }

  gl.disable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.clearColor(0, 0, 0, 0)

  let light = 0
  const applyTheme = () => {
    light = document.documentElement.dataset.theme === 'light' ? 1 : 0
    // Additive glow on dark; normal "over" blending on light so dots stay visible.
    if (light) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    else gl.blendFunc(gl.ONE, gl.ONE)
  }
  applyTheme()
  const themeObserver = new MutationObserver(() => {
    applyTheme()
    if (!running) draw(performance.now()) // keep the still frame in sync
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  /* ---- sizing -------------------------------------------------------- */
  let w = 1
  let h = 1
  let dpr = 1
  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75)
    w = Math.max(1, rect.width)
    h = Math.max(1, rect.height)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()
  const ro = new ResizeObserver(() => {
    resize()
    if (!running) draw(performance.now())
  })
  ro.observe(canvas)

  // Sphere fills ~80% of the shorter side, sitting slightly above center.
  const layout = () => {
    const aspect = w / h
    const scale = Math.min(1, aspect) * (w < 700 ? 1.3 : 1.18)
    return { aspect, scale, offsetY: w < 700 ? 0.2 : 0.1 }
  }

  /* ---- input --------------------------------------------------------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 }
  let ripple = [0, 0, 1, -100]
  const start = performance.now()
  const now = () => (performance.now() - start) / 1000

  const toScene = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect()
    const { aspect, scale, offsetY } = layout()
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1)
    return [(nx * aspect) / scale, (ny - offsetY) / scale]
  }

  const onMove = (e) => {
    if (e.pointerType === 'touch') return
    const [x, y] = toScene(e.clientX, e.clientY)
    mouse.tx = x
    mouse.ty = y
    mouse.ton = 1
    wake()
  }
  const onLeave = () => {
    mouse.ton = 0
  }
  const fire = (x, y) => {
    // Map the screen point back onto the sphere, undoing the current spin.
    const len = Math.hypot(x / 0.66, y / 0.66)
    const sx = len > 1 ? x / 0.66 / len : x / 0.66
    const sy = len > 1 ? y / 0.66 / len : y / 0.66
    const sz = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy))
    const a = -(now() * 0.07 + tilt.x)
    ripple = [Math.cos(a) * sx - Math.sin(a) * sz, sy, Math.sin(a) * sx + Math.cos(a) * sz, now()]
  }
  const onClick = (e) => {
    if (e.target.closest('a, button')) return
    const [x, y] = toScene(e.clientX, e.clientY)
    fire(x, y)
    wake()
  }

  if (!reducedMotion) {
    host.addEventListener('pointermove', onMove, { passive: true })
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('click', onClick)
  }

  /* ---- scroll morph (no layout reads in the loop) ---------------------- */
  let morph = 0
  let heroH = host.offsetHeight || window.innerHeight
  const onResize = () => {
    heroH = host.offsetHeight || window.innerHeight
  }
  window.addEventListener('resize', onResize)

  /* ---- loop ---------------------------------------------------------- */
  const tilt = { x: 0, y: 0 }
  let raf = 0
  let running = false
  let visible = true
  let pageVisible = !document.hidden
  let frames = 0
  let lastStat = performance.now()
  let nextAutoRipple = 4

  function draw(ts) {
    const t = reducedMotion ? 6 : now()
    const target = Math.min(1, Math.max(0, window.scrollY / (heroH * 0.85)))
    morph += (target - morph) * (reducedMotion ? 1 : 0.08)

    mouse.x += (mouse.tx - mouse.x) * 0.12
    mouse.y += (mouse.ty - mouse.y) * 0.12
    mouse.on += (mouse.ton - mouse.on) * 0.06
    tilt.x += (mouse.x * 0.18 * mouse.on - tilt.x) * 0.05
    tilt.y += (-mouse.y * 0.14 * mouse.on - tilt.y) * 0.05

    if (!reducedMotion && t > nextAutoRipple) {
      // Ambient "data pulse" so the core feels alive even when idle.
      fire((Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.1)
      nextAutoRipple = t + 6 + Math.random() * 4
    }

    const { aspect, scale, offsetY } = layout()
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(U.uTime, t)
    gl.uniform1f(U.uIntro, reducedMotion ? 1 : Math.min(1, t / 2.4))
    gl.uniform1f(U.uMorph, morph)
    gl.uniform1f(U.uAspect, aspect)
    gl.uniform1f(U.uScale, scale)
    gl.uniform1f(U.uOffsetY, offsetY)
    gl.uniform1f(U.uPixel, dpr)
    gl.uniform1f(U.uSize, w < 700 ? 3.1 : 3.6)
    gl.uniform1f(U.uLight, light)
    gl.uniform2f(U.uMouse, mouse.x, mouse.y)
    gl.uniform1f(U.uMouseOn, mouse.on)
    gl.uniform2f(U.uTilt, tilt.x, tilt.y)
    gl.uniform4f(U.uRipple, ripple[0], ripple[1], ripple[2], ripple[3])
    gl.drawArrays(gl.POINTS, 0, geo.total)

    frames++
    if (onStats && ts - lastStat >= 1000) {
      onStats({ fps: Math.round((frames * 1000) / (ts - lastStat)), count })
      frames = 0
      lastStat = ts
    }
  }

  const loop = (ts) => {
    raf = 0
    if (!running) return
    draw(ts)
    raf = requestAnimationFrame(loop)
  }

  function sync() {
    const should = visible && pageVisible && !reducedMotion
    if (should && !running) {
      running = true
      lastStat = performance.now()
      frames = 0
      raf = requestAnimationFrame(loop)
    } else if (!should && running) {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
      onStats?.({ fps: 0, count, paused: true })
    }
  }
  function wake() {
    sync()
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  })
  io.observe(canvas)
  const onVis = () => {
    pageVisible = !document.hidden
    sync()
  }
  document.addEventListener('visibilitychange', onVis)

  // Reduced motion: one still frame, no loop.
  if (reducedMotion) {
    draw(performance.now())
    onStats?.({ fps: 0, count, paused: true })
  }
  sync()

  return {
    count,
    destroy() {
      running = false
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      themeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('click', onClick)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
