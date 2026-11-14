import { experience } from '@/data/experience.js'
import { profile } from '@/data/profile.js'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { shortSha } from '@/lib/hash.js'
import s from './Experience.module.css'

export function Experience() {
  const { roles } = experience
  const years = new Date().getFullYear() - profile.since

  return (
    <section id="experience" className={s.section} aria-labelledby="experience-title">
      <div className="wrap">
        <SectionHead
          id="experience"
          eyebrow={`$ git log --graph --since=${profile.since}`}
          title={experience.title}
          lede={experience.lede}
        />

        <ol className={s.log}>
          {roles.map((r, i) => (
            <Reveal as="li" key={`${r.company}-${r.role}`} className={s.commit} data-head={i === 0}>
              <div className={s.graph} aria-hidden="true">
                <span className={s.node} />
              </div>

              <div className={s.meta}>
                <code className={s.sha}>{shortSha(`${r.company}/${r.role}/${r.start}`)}</code>
                {r.ref && <span className={s.ref}>{r.ref}</span>}
                <time className={s.date}>
                  {r.start} — {r.end ?? 'present'}
                </time>
                {r.location && <span className={s.loc}>{r.location}</span>}
              </div>

              <div className={s.body}>
                <h3 className={s.role}>
                  {r.role} <span className={s.at}>at</span> <em className={s.company}>{r.company}</em>
                </h3>
                {r.summary && <p className={s.summary}>{r.summary}</p>}

                {r.highlights?.length > 0 && (
                  <ul className={s.diff} aria-label="Highlights">
                    {r.highlights.map((h) => (
                      <li key={h}>
                        <span className={s.plus} aria-hidden="true">
                          +
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className={s.foot}>
                  <span className={s.ins}>
                    {r.highlights?.length ?? 0} insertion{r.highlights?.length === 1 ? '' : 's'}(+)
                  </span>
                  {r.stack?.length > 0 && (
                    <ul className={s.stack} aria-label="Stack">
                      {r.stack.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal as="p" className={s.tail}>
          <span className={s.dollar}>$</span> git rev-list --count main
          <span className={s.result}>
            → {roles.length} roles · {years}+ years · still shipping
          </span>
        </Reveal>
      </div>
    </section>
  )
}
