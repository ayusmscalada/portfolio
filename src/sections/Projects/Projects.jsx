import { useMemo, useState } from 'react'
import { projects, projectsIntro } from '@/data/projects.js'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Cover } from '@/components/Cover/Cover.jsx'
import { useFinePointer } from '@/hooks/useMediaQuery.js'
import { hashString } from '@/lib/hash.js'
import { cx } from '@/lib/cx.js'
import { HoverPreview } from './HoverPreview.jsx'
import { ProjectSheet } from './ProjectSheet.jsx'
import s from './Projects.module.css'

const recordNo = (p) => String(projects.indexOf(p) + 1).padStart(2, '0')

/** Tags shared by 2+ projects become filter chips (falls back to all tags). */
function useFilterTags() {
  return useMemo(() => {
    const counts = new Map()
    projects.forEach((p) => p.stack.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
    const sorted = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    const shared = sorted.filter(([, n]) => n > 1)
    return (shared.length ? shared : sorted).slice(0, 8).map(([t]) => t)
  }, [])
}

function Sql({ filter }) {
  return (
    <>
      <span className={s.kw}>SELECT</span> * <span className={s.kw}>FROM</span> projects{' '}
      {filter !== 'all' && (
        <span key={filter} className={s.where}>
          <span className={s.kw}>WHERE</span> <span className={s.lit}>'{filter}'</span> = <span className={s.fn}>ANY</span>
          (stack){' '}
        </span>
      )}
      <span className={s.kw}>ORDER BY</span> year <span className={s.kw}>DESC</span>;
    </>
  )
}

export function Projects() {
  const tags = useFilterTags()
  const fine = useFinePointer()
  const [filter, setFilter] = useState('all')
  const [touched, setTouched] = useState(false)
  const [hoverId, setHoverId] = useState(null)
  const [openId, setOpenId] = useState(null)

  const rows = useMemo(
    () => [...(filter === 'all' ? projects : projects.filter((p) => p.stack.includes(filter)))].sort((a, b) => b.year - a.year),
    [filter],
  )
  const queryMs = (0.18 + (hashString(filter) % 70) / 100).toFixed(2)
  const openProject = projects.find((p) => p.id === openId) ?? null

  return (
    <section id="projects" className={s.section} aria-labelledby="projects-title">
      <div className="wrap">
        <SectionHead
          id="projects"
          eyebrow="portfolio=# \d projects"
          title={projectsIntro.title}
          lede={projectsIntro.lede}
        />

        <Reveal className={s.console}>
          <div className={s.consoleBar}>
            <span>psql · portfolio@prod</span>
            <span className="tabular" aria-live="polite">
              ({rows.length} row{rows.length === 1 ? '' : 's'}) · {queryMs} ms
            </span>
          </div>
          <p className={s.sql}>
            <span className={s.prompt}>portfolio=#</span> <Sql filter={filter} />
          </p>
          <div className={s.chips} role="group" aria-label="Filter projects by technology">
            {['all', ...tags].map((t) => (
              <button
                key={t}
                type="button"
                className={s.chip}
                aria-pressed={filter === t}
                onClick={() => {
                  setFilter(t)
                  setTouched(true)
                }}
              >
                {t === 'all' ? '* all' : t}
              </button>
            ))}
          </div>
        </Reveal>

        <ol className={s.list} onMouseLeave={() => setHoverId(null)}>
          {rows.map((p, i) => (
            <li
              key={touched ? `${filter}-${p.id}` : p.id}
              className={cx(s.row, touched && s.rowEnter)}
              style={{ '--i': i }}
            >
              <button
                type="button"
                className={s.rowBtn}
                aria-haspopup="dialog"
                onClick={() => setOpenId(p.id)}
                onMouseEnter={() => setHoverId(p.id)}
              >
                <span className={s.idx}>#{recordNo(p)}</span>
                <span className={s.titleCol}>
                  <span className={s.title}>{p.title}</span>
                  <span className={s.kicker}>{p.kicker}</span>
                </span>
                <span className={s.tags}>{p.stack.slice(0, 3).join(' / ')}</span>
                <span className={s.year}>{p.year}</span>
                <span className={s.arrow} aria-hidden="true">
                  ↗
                </span>
                <Cover
                  as="span"
                  seed={p.id}
                  image={p.image}
                  alt=""
                  className={s.thumb}
                  index={recordNo(p)}
                  caption={p.year}
                  aria-hidden="true"
                />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {fine && <HoverPreview projects={projects} activeId={hoverId} recordNo={recordNo} />}

      <ProjectSheet
        project={openProject}
        list={rows}
        recordNo={recordNo}
        onNavigate={setOpenId}
        onClose={() => setOpenId(null)}
      />
    </section>
  )
}
