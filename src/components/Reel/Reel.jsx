import { useEffect, useRef, useState } from 'react'
import s from './Reel.module.css'

/**
 * Pinned "flight" reel: the panel sticks while you scroll through `count`
 * steps; each step is a camera stop in the 3D world (`data-stage`), and the
 * panel shows the slide for the current stop. `step` is scroll length per
 * stop, in vh.
 */
export function Reel({ count, stage, step = 100, label, hint = 'scroll to fly', titles = [], children }) {
  const [active, setActive] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const i = Math.round(-el.getBoundingClientRect().top / ((window.innerHeight * step) / 100))
      setActive(Math.min(count - 1, Math.max(0, i)))
    }
    const onScroll = () => (frame ||= requestAnimationFrame(measure))
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [count, step])

  const go = (i) => {
    const el = ref.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY + (i * window.innerHeight * step) / 100
    const reduced = document.documentElement.dataset.motion === 'reduced'
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div ref={ref} className={s.reel} style={{ '--n': Math.max(1, count), '--step': `${step}vh` }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={s.step} style={{ '--i': i }} data-stage={`${stage}-${i}`} aria-hidden="true" />
      ))}
      <div className={s.sticky}>
        <div className={s.panel}>
          <div className={s.slides}>
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className={s.slide} data-state={i === active ? 'active' : i < active ? 'past' : 'next'} inert={i !== active} aria-hidden={i !== active}>
                {children(i, i === active)}
              </div>
            ))}
          </div>
          {count > 1 && (
            <nav className={s.pager} aria-label={label}>
              {Array.from({ length: count }, (_, i) => (
                <button key={i} type="button" aria-current={i === active ? 'true' : undefined} aria-label={titles[i] ?? `Item ${i + 1}`} title={titles[i]} onClick={() => go(i)}>
                  <span />
                </button>
              ))}
              <span className={s.hint}>{hint}</span>
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
