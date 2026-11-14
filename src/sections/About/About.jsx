import { about } from '@/data/about.js'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Counter } from '@/components/motion/Counter.jsx'
import { Rich } from '@/lib/rich.jsx'
import s from './About.module.css'

export function About() {
  return (
    <section id="about" className={s.section} aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead id="about" eyebrow="> whoami" title={about.title} lede={about.lede} />

        <div className={s.grid}>
          <Reveal as="p" className={s.statement}>
            <span className={s.stamp} aria-hidden="true">
              (statement)
            </span>
            <Rich text={about.statement} />
          </Reveal>

          <Reveal className={s.body} delay={100}>
            {about.paragraphs.map((p, i) => (
              <p key={i}>
                <Rich text={p} />
              </p>
            ))}
          </Reveal>

          <Reveal as="aside" className={s.now} delay={200} aria-label="Currently">
            <p className={s.nowHead}>
              <span className={s.live} aria-hidden="true" />
              Currently
            </p>
            <dl>
              {about.now.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <dl className={s.stats}>
          {about.stats.map((stat, i) => (
            <Reveal key={stat.label} className={s.stat} delay={i * 90}>
              <dt>{stat.label}</dt>
              <dd>
                <Counter value={stat.value} decimals={stat.decimals} suffix={stat.suffix} prefix={stat.prefix} />
              </dd>
            </Reveal>
          ))}
        </dl>

        <div className={s.principles}>
          <p className="label">Operating principles</p>
          <ol>
            {about.principles.map((p, i) => (
              <Reveal as="li" key={p.title} className={s.principle} delay={i * 90}>
                <span className={s.pIndex}>P/{String(i + 1).padStart(2, '0')}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
