import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight } from '@/components/ph.jsx'
import { profile, fullName } from '@/data/profile.js'
import { ParticleCore } from '@/components/ParticleCore/ParticleCore.jsx'
import { SplitText } from '@/components/motion/SplitText.jsx'
import { useReducedMotion } from '@/hooks/useMediaQuery.js'
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

export function Hero() {
  const hostRef = useRef(null)
  const [stats, setStats] = useState(null)
  const onStats = useCallback((st) => setStats(st), [])

  return (
    <section ref={hostRef} id="top" className={s.hero} aria-labelledby="hero-title">
      <div className={s.grid} aria-hidden="true" />
      <ParticleCore hostRef={hostRef} onStats={onStats} />

      <div className={s.content}>
        <p className={s.badge}>
          <span className={s.dot} aria-hidden="true" />
          {profile.availability.open ? profile.availability.short : 'Busy'}
          <span className={s.sep} aria-hidden="true" />
          {profile.role}
        </p>

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

      <div className={s.telemetry} aria-hidden="true">
        <span className={s.teleRow}>
          <span className={s.teleDot} data-on={!!stats && !stats.paused && !stats.fallback} />
          core {stats?.fallback ? 'static' : stats && !stats.paused ? 'online' : 'idle'}
        </span>
        <span className={s.teleRow}>{stats?.count ? stats.count.toLocaleString('en-US') : '—'} particles</span>
        <span className={s.teleRow}>{stats?.fps ? `${stats.fps} fps` : '— fps'}</span>
        <span className={s.teleHint}>move · click to pulse · scroll to unfold</span>
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
