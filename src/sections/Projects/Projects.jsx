import { useMemo, useState } from 'react'
import { ArrowUpRight, CaretDown, GithubLogo, LockSimple } from '@/components/ph.jsx'
import { projects, projectsIntro } from '@/data/projects.js'
import { ProjectSheet } from './ProjectSheet.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Cover } from '@/components/Cover/Cover.jsx'
import s from './Projects.module.css'

const INITIAL = 3
const recordNo = (p) => String(projects.indexOf(p) + 1).padStart(2, '0')
const statusOf = (p) => p.status ?? (p.links?.live ? 'live' : p.links?.repo ? 'github' : 'private')
const STATUS_LABEL = { live: 'Live', github: 'GitHub', private: 'Private' }

// Filter chips: technologies shared by at least two projects.
const chips = (() => {
  const counts = new Map()
  projects.forEach((p) => p.stack.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
  return [...counts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([t]) => t)
})()

export function Projects() {
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const rows = useMemo(() => projects.filter((p) => filter === 'all' || p.stack.includes(filter)), [filter])
  const visible = expanded || filter !== 'all' ? rows : rows.slice(0, INITIAL)

  return (
    <section id="projects" className={s.section} aria-labelledby="projects-title">
      <div className={s.bgGrid} aria-hidden="true" />
      <div className="wrap">
        <SectionHead id="projects" badge="Projects" title={projectsIntro.title} lede={projectsIntro.lede} />

        <Reveal className={s.filters} role="group" aria-label="Filter projects by technology">
          {['all', ...chips].map((t) => (
            <button key={t} type="button" aria-pressed={filter === t} onClick={() => setFilter(t)}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </Reveal>

        <ul className={s.grid}>
          {visible.map((p, i) => {
            const status = statusOf(p)
            const link = p.links?.live || p.links?.repo
            return (
              <Reveal as="li" key={p.id} className={s.card} delay={(i % 3) * 90} data-spot>
                <button type="button" className={s.media} onClick={() => setOpenId(p.id)} tabIndex={-1} aria-hidden="true">
                  <Cover seed={p.id} image={p.image} alt="" className={s.cover} />
                  <span className={s.status} data-status={status}>
                    {status === 'github' && <GithubLogo size={13} weight="bold" />}
                    {status === 'private' && <LockSimple size={12} weight="bold" />}
                    {STATUS_LABEL[status]}
                  </span>
                  <span className={s.year}>{p.year}</span>
                </button>

                <div className={s.body}>
                  <span className={s.kicker}>{p.kicker}</span>
                  <h3 className={s.title}>{p.title}</h3>
                  <p className={s.summary}>{p.summary}</p>

                  {p.metrics?.length > 0 && (
                    <dl className={s.metrics}>
                      {p.metrics.slice(0, 3).map((m) => (
                        <div key={m.label}>
                          <dd>{m.value}</dd>
                          <dt>{m.label}</dt>
                        </div>
                      ))}
                    </dl>
                  )}

                  <ul className={s.tags} aria-label="Stack">
                    {p.stack.slice(0, 5).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>

                  <div className={s.actions}>
                    <button type="button" className={s.open} onClick={() => setOpenId(p.id)} aria-haspopup="dialog">
                      Case study
                      <ArrowUpRight size={15} weight="bold" />
                    </button>
                    {link && (
                      <a className={s.ext} href={link} target="_blank" rel="noopener noreferrer" aria-label={`${status === 'live' ? 'Visit' : 'View source of'} ${p.title}`}>
                        {status === 'live' ? <ArrowUpRight size={16} weight="bold" /> : <GithubLogo size={17} />}
                        {status === 'live' ? 'Visit' : 'Code'}
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ul>

        {filter === 'all' && rows.length > INITIAL && (
          <div className={s.more}>
            <button type="button" data-magnetic onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
              {expanded ? 'Show less' : `Show more (${rows.length - INITIAL})`}
              <CaretDown size={15} weight="bold" style={{ rotate: expanded ? '180deg' : '0deg' }} />
            </button>
          </div>
        )}
      </div>
      <ProjectSheet
        project={projects.find((p) => p.id === openId) ?? null}
        list={rows}
        recordNo={recordNo}
        onNavigate={setOpenId}
        onClose={() => setOpenId(null)}
      />
    </section>
  )
}
