import { useEffect, useState } from 'react'
import { useInView } from '@/hooks/useInView.js'
import { useReducedMotion } from '@/hooks/useMediaQuery.js'

/** Counts up to `value` when scrolled into view. */
export function Counter({ value, decimals = 0, prefix = '', suffix = '', duration = 1800 }) {
  const [ref, inView] = useInView()
  const reduced = useReducedMotion()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return
    let frame
    let start
    const tick = (t) => {
      start ??= t
      const p = Math.min(1, (t - start) / duration)
      setCurrent(value * (1 - Math.pow(1 - p, 4)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, value, duration])

  const shown = reduced ? value : current
  const final = `${prefix}${value.toFixed(decimals)}${suffix}`

  return (
    <span ref={ref} className="tabular">
      <span className="sr-only">{final}</span>
      <span aria-hidden="true">
        {prefix}
        {shown.toFixed(decimals)}
        {suffix}
      </span>
    </span>
  )
}
