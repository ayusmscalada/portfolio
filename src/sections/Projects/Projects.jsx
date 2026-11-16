import { useState } from 'react'
import { ArrowUpRight, GithubLogo, LockSimple } from '@/components/ph.jsx'
import { useContent } from '@/content/ContentContext.jsx'
import { ProjectSheet } from './ProjectSheet.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reel } from '@/components/Reel/Reel.jsx'
import s from './Projects.module.css'

const statusOf = (p) => p.status || (p.links?.live ? 'live' : p.links?.repo ? 'github' : 'private')
const STATUS_LABEL = { live: 'Live', github: 'GitHub', private: 'Private' }
const pad = (n) => String(n).padStart(2, '0')

/**
 * Projects as a flight through a gallery: the section pins while you scroll,
 * the camera glides to each project's floating 3D screen (src/world), and the
 * panel swaps to that project.
 */
export function Projects() {
  const { projects, projectsIntro } = useContent()
  const [openId, setOpenId] = useState(null)
  const n = projects.length
  const recordNo = (p) => pad(projects.indexOf(p) + 1)

  return (
    <section id="projects" className={s.section} aria-labelledby="projects-title">
      <div className="wrap" data-stage="gallery">
        <SectionHead id="projects" badge="Projects" title={projectsIntro.title} lede={projectsIntro.lede} />
      </div>

      <Reel count={n} stage="project" label="Jump to project" titles={projects.map((p) => p.title)}>
        {(i) => {
          const p = projects[i]
          const status = statusOf(p)
          const link = p.links?.live || p.links?.repo
          return (
            <>
              <div className={s.meta}>
                <span className={s.index}>
                  <b>{pad(i + 1)}</b> / {pad(n)}
                </span>
                <span className={s.status} data-status={status}>
                  {status === 'github' && <GithubLogo size={12} weight="bold" />}
                  {status === 'private' && <LockSimple size={11} weight="bold" />}
                  {STATUS_LABEL[status]}
                </span>
                {p.year && <span className={s.year}>{p.year}</span>}
              </div>

              {p.kicker && <p className={s.kicker}>{p.kicker}</p>}
              <h3 className={s.title}>{p.title}</h3>
              {p.role && <p className={s.role}>{p.role}</p>}
              <p className={s.summary}>{p.summary}</p>

              {p.metrics?.length > 0 && (
                <dl className={s.metrics}>
                  {p.metrics.slice(0, 3).map((m, k) => (
                    <div key={`${m.label}-${k}`}>
                      <dd>{m.value}</dd>
                      <dt>{m.label}</dt>
                    </div>
                  ))}
                </dl>
              )}

              {p.stack?.length > 0 && (
                <ul className={s.tags} aria-label="Stack">
                  {p.stack.slice(0, 6).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}

              <div className={s.actions}>
                <button type="button" className={s.open} onClick={() => setOpenId(p.id)} aria-haspopup="dialog">
                  Case study <ArrowUpRight size={15} weight="bold" />
                </button>
                {link && (
                  <a className={s.ext} href={link} target="_blank" rel="noopener noreferrer" aria-label={`${status === 'live' ? 'Visit' : 'View source of'} ${p.title}`}>
                    {status === 'live' ? <ArrowUpRight size={16} weight="bold" /> : <GithubLogo size={17} />}
                    {status === 'live' ? 'Visit' : 'Code'}
                  </a>
                )}
              </div>
            </>
          )
        }}
      </Reel>

      <ProjectSheet project={projects.find((p) => p.id === openId) ?? null} list={projects} recordNo={recordNo} onNavigate={setOpenId} onClose={() => setOpenId(null)} />
    </section>
  )
}
