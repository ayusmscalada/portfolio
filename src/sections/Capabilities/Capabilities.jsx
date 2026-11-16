import { useContent } from '@/content/ContentContext.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Reel } from '@/components/Reel/Reel.jsx'
import { skillIcons } from '@/components/icons.js'
import { SKILL_HUES } from '@/lib/palette.js'
import s from './Capabilities.module.css'

const TIER_DOTS = [5, 4, 3, 2]
const TIER_LABELS = ['Core', 'Fluent', 'Exploring', 'Learning']

function Dots({ n }) {
  return (
    <span className={s.dots} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((d) => (
        <i key={d} data-on={d < n} />
      ))}
    </span>
  )
}

/**
 * Skills as a solar system (src/world/system.js): one planet per skill area.
 * While you scroll, the system turns each planet to the front, the camera
 * flies in, and this panel shows that area.
 */
export function Capabilities() {
  const { capabilities } = useContent()
  const { endpoints } = capabilities
  const tierCount = Math.max(0, ...endpoints.map((ep) => ep.tiers?.length ?? 0))

  return (
    <section id="capabilities" className={s.section} aria-labelledby="capabilities-title">
      <div className="wrap" data-stage="skills">
        <SectionHead id="capabilities" badge="Tech stack" title={capabilities.title} lede={capabilities.lede} />
        <Reveal as="ul" className={s.legend} aria-label="Legend">
          {TIER_LABELS.slice(0, tierCount).map((label, i) => (
            <li key={label}>
              {label} <Dots n={TIER_DOTS[i]} />
            </li>
          ))}
        </Reveal>
      </div>

      <Reel count={endpoints.length} stage="skill" step={85} label="Jump to skill area" hint="scroll to orbit" titles={endpoints.map((ep) => ep.title)}>
        {(i, active) => {
          const ep = endpoints[i]
          const Icon = skillIcons[ep.icon] ?? skillIcons.code
          const tiers = (ep.tiers ?? []).map((t) => [t.name, t.items ?? []])
          return (
            <div className={s.card} style={{ '--c': SKILL_HUES[i % SKILL_HUES.length] }} data-in={active}>
              <div className={s.top}>
                <span className={s.icon}>
                  <Icon size={22} />
                </span>
                <div>
                  <code className={s.path}>
                    <span>{ep.method}</span> {ep.path}
                  </code>
                  <h3 className={s.title}>{ep.title}</h3>
                </div>
              </div>

              {ep.level != null && (
                <div className={s.meter}>
                  <span className={s.meterLabel}>
                    Proficiency <b>{ep.level}%</b>
                  </span>
                  <span className={s.bar} role="meter" aria-valuenow={ep.level} aria-valuemin={0} aria-valuemax={100} aria-label={`${ep.title} proficiency`}>
                    <span style={{ '--level': ep.level / 100 }} />
                  </span>
                </div>
              )}

              <ul className={s.skills}>
                {tiers.flatMap(([tier, items], t) =>
                  items.map((item) => (
                    <li key={`${tier}-${item}`} title={tier}>
                      <span>{item}</span>
                      <Dots n={TIER_DOTS[t] ?? 2} />
                      <span className="sr-only">({tier})</span>
                    </li>
                  )),
                )}
              </ul>

              {ep.description && <p className={s.desc}>{ep.description}</p>}
            </div>
          )
        }}
      </Reel>
    </section>
  )
}
