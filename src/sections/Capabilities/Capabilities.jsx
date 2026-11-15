import { capabilities } from '@/data/capabilities.js'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { skillIcons } from '@/components/icons.js'
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

export function Capabilities() {
  const { endpoints } = capabilities
  const tierCount = Math.max(...endpoints.map((ep) => Object.keys(ep.response).length))

  return (
    <section id="capabilities" className={s.section} aria-labelledby="capabilities-title">
      <div className="wrap">
        <SectionHead id="capabilities" badge="Tech stack" title={capabilities.title} lede={capabilities.lede} />

        <Reveal as="ul" className={s.legend} aria-label="Legend">
          {TIER_LABELS.slice(0, tierCount).map((label, i) => (
            <li key={label}>
              {label} <Dots n={TIER_DOTS[i]} />
            </li>
          ))}
        </Reveal>

        <ul className={s.grid}>
          {endpoints.map((ep, i) => {
            const Icon = skillIcons[ep.icon] ?? skillIcons.code
            const tiers = Object.entries(ep.response)
            return (
              <Reveal as="li" key={ep.path} className={s.card} delay={(i % 3) * 90} data-spot>
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
                      <li key={item} title={`${tier}`}>
                        <span>{item}</span>
                        <Dots n={TIER_DOTS[t] ?? 2} />
                        <span className="sr-only">({tier})</span>
                      </li>
                    )),
                  )}
                </ul>

                <p className={s.desc}>{ep.description}</p>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
