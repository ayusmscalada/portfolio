import { experience } from '@/data/experience.js'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { shortSha } from '@/lib/hash.js'
import s from './Experience.module.css'

export function Experience() {
  const { roles } = experience

  return (
    <section id="experience" className={s.section} aria-labelledby="experience-title">
      <div className="wrap">
        <SectionHead id="experience" badge="Journey" title={experience.title} lede={experience.lede} />

        <div className={s.timeline}>
          <span className={s.track} aria-hidden="true">
            <span className={s.fill} />
          </span>
          <ol className={s.list}>
          {roles.map((r) => (
            <li key={`${r.company}-${r.role}`} className={s.item} data-current={r.end == null}>
              <span className={s.node} aria-hidden="true" />
              <Reveal className={s.card} delay={60} data-spot>
                <div className={s.meta}>
                  <time className={s.date}>
                    {r.start} — {r.end ?? 'Present'}
                  </time>
                  {r.end == null && (
                    <span className={s.now}>
                      Now
                    </span>
                  )}
                  {r.location && <span className={s.loc}>{r.location}</span>}
                  <code className={s.sha} title="commit">
                    {shortSha(`${r.company}/${r.role}/${r.start}`)}
                  </code>
                </div>

                <h3 className={s.role}>
                  {r.role} <span className={s.at}>@</span> <span className={s.company}>{r.company}</span>
                </h3>
                {r.summary && <p className={s.summary}>{r.summary}</p>}

                {r.highlights?.length > 0 && (
                  <ul className={s.highlights} aria-label="Highlights">
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
              </Reveal>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
