import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight } from '@/components/ph.jsx'
import { useContent } from '@/content/ContentContext.jsx'
import { SplitText } from '@/components/motion/SplitText.jsx'
import { useFinePointer, useReducedMotion } from '@/hooks/useMediaQuery.js'
import s from './Hero.module.css'

/** Cycles through phrases; every phrase is in the DOM so width never jumps. */
function RotatingWord({ words }) {
  const [i, setI] = useState(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (reduced || words.length < 2) return
    const id = setInterval(() => setI((n) => (n + 1) % words.length), 2600)
    return () => clearInterval(id)
  }, [reduced, words.length])
  return (
    <span className={s.rotator}>
      <span className="sr-only">{words.join(', ')}</span>
      {words.map((w, n) => (
        <span key={w} className={s.word} data-state={n === i ? 'in' : n === (i - 1 + words.length) % words.length ? 'out' : 'idle'} aria-hidden="true">
          {w}
        </span>
      ))}
    </span>
  )
}

const makeLog = (domain) => [
  ['$', 'git push origin main'],
  ['✓', 'tests passed · 412 specs'],
  ['✓', 'build · 1.8s'],
  ['→', `deploy edge · ${domain}`],
  ['✓', 'p95 latency · 182ms'],
  ['✓', 'shipped'],
]

/** Mini terminal that types a deploy log on a loop. */
function Terminal({ domain }) {
  const LOG = makeLog(domain)
  const reduced = useReducedMotion()
  const [n, setN] = useState(1)
  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setN((v) => (v >= LOG.length + 2 ? 1 : v + 1)), 900)
    return () => clearInterval(id)
  }, [reduced])
  const shown = reduced ? LOG.length : Math.min(n, LOG.length)
  return (
    <div className={`${s.panel} ${s.terminal}`}>
      <div className={s.panelBar}>
        <i />
        <i />
        <i />
        <span>deploy.log</span>
      </div>
      <ol>
        {LOG.slice(0, shown).map(([sym, text], k) => (
          <li key={k} data-sym={sym}>
            <b>{sym}</b> {text}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Hero() {
  const hostRef = useRef(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const { profile, fullName, about } = useContent()
  const tags = profile.heroTags ?? profile.focus
  const stat = about.stats[0] ?? { value: 0, label: '' }

  // Pointer parallax for the floating scene (two CSS vars, once per frame).
  useEffect(() => {
    const host = hostRef.current
    if (!fine || reduced || !host) return
    let frame = 0
    let px = 0
    let py = 0
    const onMove = (e) => {
      const r = host.getBoundingClientRect()
      px = (e.clientX - r.left) / r.width - 0.5
      py = (e.clientY - r.top) / r.height - 0.5
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          host.style.setProperty('--px', px.toFixed(3))
          host.style.setProperty('--py', py.toFixed(3))
        })
    }
    host.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      host.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [fine, reduced])

  return (
    <section ref={hostRef} id="top" className={s.hero} aria-labelledby="hero-title" data-stage="hero">
      {/* Floating scene: stack chips and glass panels */}
      <div className={s.scene} aria-hidden="true">
        {tags.slice(0, 6).map((t, i) => (
          <span key={t} className={s.chip} data-slot={i} style={{ '--d': (i % 3) + 1, '--float-delay': `${i * -1.3}s` }}>
            <i />
            {t}
          </span>
        ))}

        <div className={`${s.panel} ${s.statCard}`}>
          <span className={s.statValue}>
            {stat.value}
            {stat.suffix}
          </span>
          <span className={s.statLabel}>{stat.label}</span>
          <svg viewBox="0 0 120 34" className={s.spark}>
            <path d="M0 28 L14 24 L26 26 L38 18 L52 20 L64 12 L78 15 L92 7 L106 9 L120 3" />
          </svg>
        </div>

        <Terminal domain={profile.domain} />
      </div>

      <div className={s.content}>
        <SplitText as="h1" id="hero-title" text={profile.headline} className={s.title} delay={150} />

        <p className={s.building}>
          <span className={s.prompt} aria-hidden="true">&gt;</span> I build <RotatingWord words={profile.building} />
        </p>

        <p className={s.summary}>
          {fullName} — {profile.role.toLowerCase()} shipping fast, reliable products with {profile.focus.slice(0, -1).join(', ')} and {profile.focus.at(-1)}.
        </p>

        <div className={s.actions}>
          <a className={s.primary} href="#projects" data-magnetic>
            Explore my work <ArrowUpRight size={17} weight="bold" />
          </a>
          <a className={s.secondary} href="#contact" data-magnetic>
            Start a conversation <ArrowUpRight size={17} weight="bold" />
          </a>
        </div>
      </div>

      <a className={s.scroll} href="#about">
        <span>Scroll to explore</span>
        <span className={s.scrollTrack}>
          <ArrowDown size={14} />
        </span>
      </a>
    </section>
  )
}
