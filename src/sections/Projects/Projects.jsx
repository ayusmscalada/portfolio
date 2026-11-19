import { useState } from 'react'
import { ArrowUpRight, GithubLogo } from '@/components/ph.jsx'
import { useContent } from '@/content/ContentContext.jsx'
import { Cover } from '@/components/Cover/Cover.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { ProjectSheet } from './ProjectSheet.jsx'
import s from './Projects.module.css'

const pad = (n) => String(n).padStart(2, '0')

/** Projects as a plain card grid; each card opens its case study. */
export function Projects() {
  const { projects, projectsIntro } = useContent()
  const [openId, setOpenId] = useState(null)
  const recordNo = (p) => pad(projects.indexOf(p) + 1)

  return (
    <section id="projects" className={s.section} aria-labelledby="projects-title">
      <div className="wrap">
        <SectionHead id="projects" badge="Projects" title={projectsIntro.title} lede={projectsIntro.lede} />

        <ul className={s.grid}>
          {projects.map((p, i) => {
            const live = p.links?.live
            const repo = p.links?.repo
            return (
              <Reveal as="li" key={p.id} className={`card ${s.card}`} delay={(i % 2) * 80}>
                <button type="button" className={s.media} onClick={() => setOpenId(p.id)} aria-label={`Open case study: ${p.title}`} aria-haspopup="dialog">
                  <Cover seed={p.id} image={p.image} alt="" className={s.cover} />
                </button>

                <div className={s.body}>
                  <p className={s.meta}>{[p.kicker, p.year].filter(Boolean).join(' · ')}</p>
                  <h3 className={s.title}>{p.title}</h3>
                  <p className={s.summary}>{p.summary}</p>

                  {p.stack?.length > 0 && (
                    <ul className={s.tags} aria-label="Stack">
                      {p.stack.slice(0, 6).map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}

                  <div className={s.actions}>
                    <button type="button" className={s.open} onClick={() => setOpenId(p.id)} aria-haspopup="dialog">
                      Case study
                    </button>
                    {live && (
                      <a className={s.link} href={live} target="_blank" rel="noopener noreferrer">
                        Live site <ArrowUpRight size={14} weight="bold" />
                      </a>
                    )}
                    {repo && (
                      <a className={s.link} href={repo} target="_blank" rel="noopener noreferrer">
                        <GithubLogo size={15} /> Code
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>

      <ProjectSheet project={projects.find((p) => p.id === openId) ?? null} list={projects} recordNo={recordNo} onNavigate={setOpenId} onClose={() => setOpenId(null)} />
    </section>
  )
}
