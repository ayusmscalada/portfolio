import { useId, useRef } from 'react'
import { useInView } from '@/hooks/useInView.js'
import { useContent } from '@/content/ContentContext.jsx'
import s from './Emblem.module.css'

/* Faceted crest: symmetric outline with wing spikes and a keel point. */
const CREST =
  'M200 50 L234 118 L292 92 L274 160 L304 200 L262 236 L252 292 L200 350 L148 292 L138 236 L96 200 L126 160 L108 92 L166 118 Z'
const FACETS = [
  'M200 50 L200 350',
  'M234 118 L200 176 L166 118',
  'M274 160 L200 176 L126 160',
  'M262 236 L200 274 L138 236',
  'M292 92 L248 150',
  'M108 92 L152 150',
]
const SPARKS = [
  [94, 132, 0], [318, 120, 1.2], [82, 262, 2.1], [322, 276, 0.6], [140, 66, 2.8],
  [262, 62, 1.7], [60, 196, 3.3], [344, 204, 0.9], [168, 352, 2.4], [238, 350, 3.8],
]

/**
 * Animated monogram crest. `variant="mark"` renders a compact static badge for
 * the navigation and favicon-sized spots; the full variant adds orbit rings,
 * an energy trace, flare and sparks, and tilts toward the pointer.
 */
export function Emblem({ variant = 'full', className = '', label }) {
  const uid = useId().replace(/:/g, '')
  const id = (n) => `${n}-${uid}`
  const { profile, monogram: mono } = useContent()
  const full = variant === 'full'
  const [viewRef, inView] = useInView({ once: false, rootMargin: '0px', threshold: 0 })
  const tiltRef = useRef(null)

  const onMove = (e) => {
    if (e.pointerType === 'touch' || !tiltRef.current) return
    const r = tiltRef.current.getBoundingClientRect()
    tiltRef.current.style.setProperty('--rx', `${(((e.clientY - r.top) / r.height) - 0.5) * -14}deg`)
    tiltRef.current.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width) - 0.5) * 16}deg`)
  }
  const onLeave = () => {
    tiltRef.current?.style.setProperty('--rx', '0deg')
    tiltRef.current?.style.setProperty('--ry', '0deg')
  }

  const svg = (
    <svg viewBox="0 0 400 400" className={s.svg} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <radialGradient id={id('disc')} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#0d2238" />
          <stop offset="0.65" stopColor="#060f1c" />
          <stop offset="1" stopColor="#02060c" />
        </radialGradient>
        <radialGradient id={id('core')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('steel')} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#dff3ff" />
          <stop offset="0.35" stopColor="#7d9bb8" />
          <stop offset="0.7" stopColor="#2a3f57" />
          <stop offset="1" stopColor="#9fc3e0" />
        </linearGradient>
        <linearGradient id={id('plate')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#13263b" />
          <stop offset="0.5" stopColor="#0a1524" />
          <stop offset="1" stopColor="#152c45" />
        </linearGradient>
        <linearGradient id={id('energy')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={id('letter')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e3f4ff" />
          <stop offset="1" stopColor="#9fd8ff" />
        </linearGradient>
        <linearGradient id={id('flare')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="0.5" stopColor="#e0f2fe" stopOpacity="0.95" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
        <path id={id("arc")} d="M38 200 A162 162 0 0 0 362 200" />
      </defs>

      <circle cx="200" cy="200" r="184" fill={`url(#${id('disc')})`} />
      <circle cx="200" cy="200" r="184" fill="none" stroke="#38bdf8" strokeOpacity="0.55" strokeWidth="1.5" />

      {full && (
        <>
          <circle className={s.orbitA} cx="200" cy="200" r="194" fill="none" stroke="#7dd3fc" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 9" />
          <g className={s.orbitB}>
            <circle cx="200" cy="200" r="170" fill="none" stroke={`url(#${id('energy')})`} strokeWidth="1.6" strokeDasharray="120 410" strokeLinecap="round" />
            <circle cx="370" cy="200" r="3" fill="#bae6fd" />
          </g>
          <circle className={s.core} cx="200" cy="200" r="160" fill={`url(#${id('core')})`} />
        </>
      )}

      <g className={s.crest} transform="translate(200 200) scale(0.86) translate(-200 -200)">
        <path d={CREST} fill={`url(#${id('plate')})`} stroke={`url(#${id('steel')})`} strokeWidth="5" strokeLinejoin="round" />
        <path d={CREST} fill="none" stroke="#7dd3fc" strokeOpacity="0.35" strokeWidth="1.2" transform="translate(200 200) scale(0.84) translate(-200 -200)" />
        {FACETS.map((d) => (
          <path key={d} d={d} fill="none" stroke="#9cc6e6" strokeOpacity="0.22" strokeWidth="1.2" />
        ))}
        {full && (
          <>
            <path className={s.traceGlow} d={CREST} pathLength="1000" fill="none" stroke="#38bdf8" strokeWidth="9" strokeLinejoin="round" />
            <path className={s.trace} d={CREST} pathLength="1000" fill="none" stroke="#e0f2fe" strokeWidth="2.5" strokeLinejoin="round" />
          </>
        )}
      </g>

      {full && (
        <g className={s.flare}>
          <rect x="30" y="198.5" width="340" height="3" rx="1.5" fill={`url(#${id('flare')})`} />
          <circle cx="106" cy="200" r="4.5" fill="#f0f9ff" />
          <circle cx="294" cy="200" r="4.5" fill="#f0f9ff" />
          <circle cx="106" cy="200" r="13" fill="#38bdf8" opacity="0.35" />
          <circle cx="294" cy="200" r="13" fill="#38bdf8" opacity="0.35" />
        </g>
      )}

      <text
        className={s.letterGlow}
        x="200"
        y="200"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={mono.length > 1 ? 86 : 128}
        stroke="#38bdf8"
        strokeWidth="8"
        fill="#38bdf8"
      >
        {mono}
      </text>
      <text
        className={s.letter}
        x="200"
        y="200"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={mono.length > 1 ? 86 : 128}
        fill={`url(#${id('letter')})`}
        stroke="#0b1b2d"
        strokeWidth="2"
      >
        {mono}
      </text>

      {full && (
        <>
          {SPARKS.map(([x, y, delay]) => (
            <circle key={`${x}-${y}`} className={s.spark} cx={x} cy={y} r="2" style={{ animationDelay: `${delay}s` }} />
          ))}
          <text className={s.arcLabel}>
            <textPath href={`#${id('arc')}`} startOffset="50%" textAnchor="middle">
              {profile.role.toUpperCase()}
            </textPath>
          </text>
        </>
      )}
    </svg>
  )

  if (!full) return <span className={`${s.mark} ${className}`}>{svg}</span>

  return (
    <div ref={viewRef} className={`${s.wrap} ${className}`} data-active={inView} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={tiltRef} className={s.tilt}>
        {svg}
      </div>
    </div>
  )
}
