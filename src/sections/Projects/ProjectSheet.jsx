import { useEffect, useRef } from 'react'
import { Cover } from '@/components/Cover/Cover.jsx'
import s from './ProjectSheet.module.css'

/**
 * Case-study side sheet built on native <dialog> (focus trap, Esc, inert
 * background for free). ← / → step through the currently filtered records.
 */
export function ProjectSheet({ project, list, recordNo, onNavigate, onClose }) {
  const ref = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (project && !dialog.open) dialog.showModal()
    if (!project && dialog.open) dialog.close()
  }, [project])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [project?.id])

  const position = project ? list.findIndex((p) => p.id === project.id) : -1
  const step = (dir) => {
    if (position < 0 || list.length < 2) return
    onNavigate(list[(position + dir + list.length) % list.length].id)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') step(1)
    if (e.key === 'ArrowLeft') step(-1)
  }

  const p = project
  const links = p ? Object.entries(p.links ?? {}).filter(([, url]) => url) : []

  return (
    <dialog
      ref={ref}
      className={s.sheet}
      aria-labelledby="sheet-title"
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      {p && (
        <>
          <header className={s.top}>
            <span className={s.crumb}>
              <span className={s.accent}>SELECT</span> * <span className={s.accent}>WHERE</span> id = '{p.id}'
            </span>
            <div className={s.nav}>
              <button type="button" className={s.navBtn} onClick={() => step(-1)} aria-label="Previous project">
                ←
              </button>
              <span className={s.count}>
                {position + 1}/{list.length}
              </span>
              <button type="button" className={s.navBtn} onClick={() => step(1)} aria-label="Next project">
                →
              </button>
              <button type="button" className={s.closeBtn} onClick={() => ref.current.close()}>
                Close <kbd>esc</kbd>
              </button>
            </div>
          </header>

          <div ref={scrollRef} className={s.scroll}>
            <Cover
              seed={p.id}
              image={p.image}
              alt={`${p.title} cover`}
              index={recordNo(p)}
              caption={p.kicker}
              className={s.cover}
            />

            <p className={s.label}>
              Record #{recordNo(p)} · {p.year}
            </p>
            <h2 id="sheet-title" className={s.title}>
              {p.title}
            </h2>
            <p className={s.kicker}>{p.kicker}</p>

            <dl className={s.facts}>
              <div>
                <dt>Role</dt>
                <dd>{p.role}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{p.year}</dd>
              </div>
              <div>
                <dt>Stack</dt>
                <dd>{p.stack.join(', ')}</dd>
              </div>
            </dl>

            <p className={s.summary}>{p.summary}</p>

            {p.metrics?.length > 0 && (
              <dl className={s.metrics}>
                {p.metrics.map((m) => (
                  <div key={m.label} className={s.metric}>
                    <dt>{m.label}</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {(p.caseStudy ?? []).map(({ heading, body: text }, i) => (
              <section key={i} className={s.block}>
                <h3>
                  <span className={s.blockIdx}>{String(i + 1).padStart(2, '0')}</span>
                  {heading}
                </h3>
                <p>{text}</p>
              </section>
            ))}

            {links.length > 0 && (
              <div className={s.links}>
                {links.map(([kind, url], i) => (
                  <a
                    key={kind}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={i === 0 ? s.primary : s.secondary}
                  >
                    {kind === 'live' ? 'Visit live' : kind === 'repo' ? 'View source' : kind} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </dialog>
  )
}
