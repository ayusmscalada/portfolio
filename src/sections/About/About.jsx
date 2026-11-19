import { useContent } from '@/content/ContentContext.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Rich } from '@/lib/rich.jsx'
import s from './About.module.css'

const statValue = (st) => `${st.prefix ?? ''}${st.decimals ? Number(st.value).toFixed(st.decimals) : st.value}${st.suffix ?? ''}`

export function About() {
  const { about } = useContent()
  return (
    <section id="about" className={s.section} aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead id="about" badge="About" title={about.title} />

        <div className={s.grid}>
          <Reveal className={s.copy}>
            <p className={s.statement}>
              <Rich text={about.statement} />
            </p>
            {about.paragraphs.map((p, i) => (
              <p key={i}>
                <Rich text={p} />
              </p>
            ))}
          </Reveal>

          <Reveal className={s.side} delay={100}>
            {about.stats?.length > 0 && (
              <dl className={s.stats}>
                {about.stats.map((st) => (
                  <div key={st.label} className={`card ${s.stat}`}>
                    <dd>{statValue(st)}</dd>
                    <dt>{st.label}</dt>
                  </div>
                ))}
              </dl>
            )}

            {about.now?.length > 0 && (
              <div className={`card ${s.now}`}>
                <h3>Currently</h3>
                <dl>
                  {about.now.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Reveal>
        </div>

        {about.principles?.length > 0 && (
          <ol className={s.principles} aria-label="How I work">
            {about.principles.map((p, i) => (
              <Reveal as="li" key={p.title} className={s.principle} delay={i * 60}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </Reveal>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
