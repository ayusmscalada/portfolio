import { useContent } from '@/content/ContentContext.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import s from './Experience.module.css'

export function Experience() {
  const { experience } = useContent()

  return (
    <section id="experience" className={s.section} aria-labelledby="experience-title">
      <div className="wrap">
        <SectionHead id="experience" badge="Experience" title={experience.title} lede={experience.lede} />

        <ol className={s.list}>
          {experience.roles.map((r, i) => (
            <Reveal as="li" key={`${r.company}-${r.role}-${i}`} className={s.item}>
              <div className={s.when}>
                <time>
                  {r.start} - {r.end ?? 'Present'}
                </time>
                {r.location && <span>{r.location}</span>}
              </div>

              <div className={s.body}>
                <h3 className={s.role}>
                  {r.role} <span>· {r.company}</span>
                </h3>
                {r.summary && <p className={s.summary}>{r.summary}</p>}

                {r.highlights?.length > 0 && (
                  <ul className={s.highlights}>
                    {r.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                )}

                {r.stack?.length > 0 && (
                  <ul className={s.stack} aria-label="Stack">
                    {r.stack.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
