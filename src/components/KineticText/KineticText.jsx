import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/hooks/useMediaQuery.js'
import { cx } from '@/lib/cx.js'
import s from './KineticText.module.css'

const REST = 300 // resting font-weight
const PEAK = 800 // weight directly under the pointer

/**
 * Variable-font proximity effect: every letter gains weight as the pointer
 * approaches it, so the name "swells" under your cursor. Pure DOM writes in
 * a rAF loop, no React re-renders. Disabled for reduced motion.
 *
 * `lines` is an array of strings, each rendered on its own line.
 * `tail` is an optional accent character appended to the last line.
 */
export function KineticText({ lines, tail, className }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const root = ref.current
    const letters = Array.from(root.querySelectorAll('[data-char]'))
    const weights = letters.map(() => REST)
    let pointer = null
    let frame = 0
    let radius = 300

    const measure = () => {
      radius = parseFloat(getComputedStyle(root).fontSize) * 1.3
    }

    const tick = () => {
      frame = 0
      // read all, then write all: avoids layout thrashing
      const rects = letters.map((el) => el.getBoundingClientRect())
      let moving = false

      rects.forEach((r, i) => {
        let target = REST
        if (pointer) {
          const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2))
          const t = Math.max(0, 1 - d / radius)
          target = REST + (PEAK - REST) * t * t * (3 - 2 * t) // smoothstep falloff
        }
        weights[i] += (target - weights[i]) * 0.14
        if (Math.abs(target - weights[i]) > 0.5) moving = true
        else weights[i] = target
      })

      letters.forEach((el, i) => {
        el.style.fontWeight = weights[i].toFixed(1)
      })

      if (moving) frame = requestAnimationFrame(tick)
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const onMove = (e) => {
      pointer = { x: e.clientX, y: e.clientY }
      schedule()
    }
    const onLeave = (e) => {
      if (e.type === 'mouseout' && e.relatedTarget) return
      pointer = null
      schedule()
    }
    // touch: let the name relax again once the finger lifts
    const onUp = (e) => e.pointerType !== 'mouse' && onLeave(e)

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('mouseout', onLeave)
    window.addEventListener('blur', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('mouseout', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [reduced])

  let n = 0
  return (
    <span ref={ref} className={cx(s.kinetic, className)} aria-hidden="true">
      {lines.map((line, li) => (
        <span key={li} className={s.line}>
          {Array.from(line).map((ch, ci) => (
            <span key={ci} data-char="" className={s.char} style={{ '--i': n++ }}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
          {tail && li === lines.length - 1 && (
            <span data-char="" className={cx(s.char, s.tail)} style={{ '--i': n++ }}>
              {tail}
            </span>
          )}
        </span>
      ))}
    </span>
  )
}
