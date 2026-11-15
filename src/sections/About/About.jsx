import { about } from '@/data/about.js'
import { profile } from '@/data/profile.js'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Counter } from '@/components/motion/Counter.jsx'
import { Emblem } from '@/components/Emblem/Emblem.jsx'
import { Rich } from '@/lib/rich.jsx'
import s from './About.module.css'

export function About() {
  return (
    <section id="about" className={s.section} aria-labelledby="about-title">
      <div className="wrap">
        <div className={s.grid}>
          <Reveal className={s.visual}>
            <Emblem />
          </Reveal>

          <div className={s.copy}>
            <SectionHead id="about" badge="About me" title={about.title} align="start" />
            <Reveal as="p" className={s.statement}>
              <Rich text={about.statement} />
            </Reveal>
            {about.paragraphs.map((p, i) => (
              <Reveal as="p" key={i} className={s.para} delay={80 + i * 80}>
                <Rich text={p} />
              </Reveal>
            ))}

            <Reveal as="aside" className={s.now} delay={240} aria-label="Currently" data-spot>
              <p className={s.nowHead}>
                <span className={s.live} aria-hidden="true" />
                Live · currently
                <span className={s.nowAvail}>{profile.availability.label}</span>
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
        </div>

        <dl className={s.stats}>
          {about.stats.map((stat, i) => (
            <Reveal key={stat.label} className={s.stat} delay={i * 90} data-spot>
              <dd>
                <Counter value={stat.value} decimals={stat.decimals} suffix={stat.suffix} prefix={stat.prefix} />
              </dd>
              <dt>{stat.label}</dt>
            </Reveal>
          ))}
        </dl>

        <ol className={s.principles} aria-label="Operating principles">
          {about.principles.map((p, i) => (
            <Reveal as="li" key={p.title} className={s.principle} delay={i * 90} data-spot>
              <span className={s.pIndex}>0{i + 1}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
