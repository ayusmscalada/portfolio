import { useContent } from '@/content/ContentContext.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { skillIcons } from '@/components/icons.js'
import s from './Capabilities.module.css'

/** Skills: one card per area, with proficiency and the tools used. */
export function Capabilities() {
  const { capabilities } = useContent()

  return (
    <section id="capabilities" className={s.section} aria-labelledby="capabilities-title">
      <div className="wrap">
        <SectionHead id="capabilities" badge="Skills" title={capabilities.title} lede={capabilities.lede} />

        <ul className={s.grid}>
          {capabilities.endpoints.map((ep, i) => {
            const Icon = skillIcons[ep.icon] ?? skillIcons.code
            return (
              <Reveal as="li" key={`${ep.title}-${i}`} className={`card ${s.card}`} delay={(i % 3) * 60}>
                <div className={s.top}>
                  <span className={s.icon}>
                    <Icon size={22} />
                  </span>
                  <h3>{ep.title}</h3>
                  {ep.level != null && <span className={s.level}>{ep.level}%</span>}
                </div>

                {ep.level != null && (
                  <span className={s.bar} role="meter" aria-valuenow={ep.level} aria-valuemin={0} aria-valuemax={100} aria-label={`${ep.title} proficiency`}>
                    <span style={{ width: `${ep.level}%` }} />
                  </span>
                )}

                {ep.description && <p className={s.desc}>{ep.description}</p>}

                <ul className={s.skills}>
                  {(ep.tiers ?? []).flatMap((t, k) =>
                    (t.items ?? []).map((item) => (
                      <li key={`${t.name}-${item}`} data-core={k === 0} title={t.name}>
                        {item}
                      </li>
                    )),
                  )}
                </ul>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
