import { sections } from '@/data/sections.js'
import { useScrollSpy } from '@/lib/scrollSpy.js'
import { scrollToId } from '@/lib/scrollTo.js'
import s from './StackRail.module.css'

/** Total fake "round-trip" time shown in the telemetry readout. */
const ROUND_TRIP_MS = 248

/**
 * The signature element: a vertical request path down the stack.
 * A packet travels from /request to /response as you scroll; each node
 * lights up when its layer (section) is active. Desktop only.
 */
export function StackRail() {
  const pos = useScrollSpy((st) => st.pos)
  const index = useScrollSpy((st) => st.index)

  return (
    <nav className={s.rail} aria-label="Sections">
      <div className={s.track} style={{ '--pos': pos, '--count': sections.length - 1 }}>
        <span className={s.line} aria-hidden="true" />
        <span className={s.fill} aria-hidden="true" />
        <span className={s.packet} aria-hidden="true" />

        <ol className={s.nodes}>
          {sections.map((sec, i) => (
            <li key={sec.id} className={s.node} style={{ '--n': i }}>
              <a
                href={`#${sec.id}`}
                className={s.link}
                data-state={i < index ? 'past' : i === index ? 'active' : 'next'}
                aria-current={i === index ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId(sec.id)
                }}
              >
                <span className={s.index}>{sec.index}</span>
                <span className={s.dot} aria-hidden="true" />
                <span className={s.tip}>
                  <span className={s.tipLayer}>/{sec.layer}</span>
                  <span className={s.tipLabel}>{sec.label}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className={s.telemetry} aria-hidden="true">
        <span className={s.tLabel}>t+</span>
        <span className="tabular">{String(Math.round(pos * ROUND_TRIP_MS)).padStart(3, '0')}</span>
        <span className={s.tLabel}>ms</span>
      </div>
    </nav>
  )
}
