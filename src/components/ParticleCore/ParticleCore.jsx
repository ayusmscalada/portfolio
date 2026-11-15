import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useMediaQuery.js'
import s from './ParticleCore.module.css'

/**
 * Run `fn` once the page has loaded, painted, and gone idle, so creating the
 * WebGL context and compiling shaders never delays first paint. Returns a cancel fn.
 */
function afterFirstPaint(fn) {
  let cancelled = false
  let idleId = 0
  const go = () =>
    requestAnimationFrame(() =>
      setTimeout(() => {
        if (cancelled) return
        idleId = 'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 100)
      }, 0),
    )
  if (document.readyState === 'complete') go()
  else window.addEventListener('load', go, { once: true })
  return () => {
    cancelled = true
    window.removeEventListener('load', go)
    if ('cancelIdleCallback' in window) cancelIdleCallback(idleId)
    else clearTimeout(idleId)
  }
}

/**
 * Interactive particle sphere behind the hero. The engine chunk is fetched
 * only after the page is idle, so text and layout paint first; until then
 * (or if WebGL is unavailable) a CSS glow stands in.
 */
export function ParticleCore({ hostRef, onStats }) {
  const canvasRef = useRef(null)
  const [ready, setReady] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let core
    let cancelled = false
    const cancel = afterFirstPaint(() => {
      import('./engine.js')
        .then(({ createParticleCore }) => {
          if (cancelled) return
          core = createParticleCore(canvasRef.current, { host: hostRef?.current ?? undefined, reducedMotion, onStats })
          requestAnimationFrame(() => !cancelled && setReady(true))
        })
        .catch(() => onStats?.({ fps: 0, count: 0, fallback: true }))
    })
    return () => {
      cancelled = true
      cancel()
      core?.destroy()
    }
    // Rebuild when the motion switch flips (live ↔ still frame).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  return (
    <div className={s.stage} data-ready={ready} aria-hidden="true">
      <div className={s.glow} />
      {/* New element per mode: a destroyed WebGL context can't be reacquired on the old canvas. */}
      <canvas key={reducedMotion ? 'still' : 'live'} ref={canvasRef} className={s.canvas} />
    </div>
  )
}
