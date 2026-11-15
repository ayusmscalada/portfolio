import { useEffect, useRef } from 'react'
import { useFinePointer, useReducedMotion } from '@/hooks/useMediaQuery.js'
import s from './CursorFX.module.css'

const INTERACTIVE = 'a, button, [role="button"], input, [data-spot]'

/**
 * Glowing cursor with a trailing ring that swells over interactive elements,
 * plus a magnetic pull on [data-magnetic] buttons. Fine pointers only; the
 * frame loop runs only while something is still moving.
 */
export function CursorFX() {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (!fine || reduced) return
    const dot = dotRef.current
    const ring = ringRef.current
    const root = document.documentElement
    root.classList.add('has-cursor-fx')

    let x = -100
    let y = -100
    let rx = x
    let ry = y
    let frame = 0
    let magnet = null

    const tick = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      frame = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    const release = () => {
      if (!magnet) return
      magnet.style.transform = ''
      magnet = null
    }

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      dot.dataset.on = 'true'
      ring.dataset.on = 'true'
      const target = e.target.closest?.(INTERACTIVE)
      ring.dataset.hover = target && !target.matches('[data-spot]') ? 'link' : target ? 'card' : 'none'

      const m = e.target.closest?.('[data-magnetic]')
      if (m !== magnet) release()
      if (m) {
        magnet = m
        const r = m.getBoundingClientRect()
        const dx = x - (r.left + r.width / 2)
        const dy = y - (r.top + r.height / 2)
        m.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`
      }
      kick()
    }
    const onLeave = () => {
      dot.dataset.on = 'false'
      ring.dataset.on = 'false'
      release()
    }
    const onDown = () => (ring.dataset.down = 'true')
    const onUp = () => (ring.dataset.down = 'false')

    document.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    return () => {
      root.classList.remove('has-cursor-fx')
      cancelAnimationFrame(frame)
      release()
      document.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
    }
  }, [fine, reduced])

  if (!fine || reduced) return null
  return (
    <div className={s.layer} aria-hidden="true">
      <div ref={ringRef} className={s.ring}>
        <span />
      </div>
      <div ref={dotRef} className={s.dot}>
        <span />
      </div>
    </div>
  )
}
