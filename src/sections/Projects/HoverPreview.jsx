import { useEffect, useRef } from 'react'
import { Cover } from '@/components/Cover/Cover.jsx'
import s from './Projects.module.css'

/**
 * A floating cover that trails the cursor over the project list, tilting
 * with velocity. All covers are pre-rendered and cross-faded. Fine pointers only.
 */
export function HoverPreview({ projects, activeId, recordNo }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    let x = 0
    let y = 0
    let cx = 0
    let cy = 0
    let frame = 0
    let primed = false

    const tick = () => {
      cx += (x - cx) * 0.14
      cy += (y - cy) * 0.14
      const tilt = Math.max(-12, Math.min(12, (x - cx) * 0.08))
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${tilt}deg)`
      el.dataset.flip = String(cx > window.innerWidth * 0.62)
      frame = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(tick) : 0
    }

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      if (!primed) {
        cx = x
        cy = y
        primed = true
      }
      if (!frame) frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className={s.preview} data-visible={activeId != null} aria-hidden="true">
      <div className={s.previewInner}>
        {projects.map((p) => (
          <Cover
            key={p.id}
            seed={p.id}
            image={p.image}
            alt=""
            index={recordNo(p)}
            caption={p.kicker}
            className={s.previewCover}
            data-active={p.id === activeId}
          />
        ))}
      </div>
    </div>
  )
}
