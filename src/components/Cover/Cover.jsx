import { useMemo } from 'react'
import { hashString, seededRandom } from '@/lib/hash.js'
import { cx } from '@/lib/cx.js'
import s from './Cover.module.css'

const W = 480
const H = 360

/* ---- Four generative motifs, each a nod to a layer of the stack ---------- */

function Orbits({ rand }) {
  const ox = 150 + rand() * 180
  const oy = 120 + rand() * 120
  const radii = Array.from({ length: 8 + Math.floor(rand() * 4) }, (_, i) => 16 + i * 26 + rand() * 8)
  const hit = 2 + Math.floor(rand() * (radii.length - 3))
  const angle = rand() * Math.PI * 2
  const px = ox + Math.cos(angle) * radii[hit]
  const py = oy + Math.sin(angle) * radii[hit]

  return (
    <>
      <line x1={ox} y1="0" x2={ox} y2={H} className={s.hair} />
      <line x1="0" y1={oy} x2={W} y2={oy} className={s.hair} />
      {radii.map((r, i) => (
        <circle key={i} cx={ox} cy={oy} r={r} className={s.stroke} strokeDasharray={i % 3 === 1 ? '2 7' : undefined} />
      ))}
      <line x1={ox} y1={oy} x2={px} y2={py} className={s.accentStroke} />
      <circle cx={ox} cy={oy} r="3" className={s.ink} />
      <circle cx={px} cy={py} r="11" className={s.accent} />
    </>
  )
}

function Bars({ rand }) {
  const n = 28
  const gap = 5
  const pad = 32
  const base = H - 48
  const bw = (W - pad * 2 - gap * (n - 1)) / n
  const peak = Math.floor(rand() * n)
  let h = 60 + rand() * 80

  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        h = Math.min(250, Math.max(16, h + (rand() - 0.47) * 70))
        return (
          <rect
            key={i}
            x={pad + i * (bw + gap)}
            y={base - h}
            width={bw}
            height={h}
            className={i === peak ? s.accent : i % 2 ? s.inkDim : s.inkSoft}
          />
        )
      })}
      <line x1={pad} y1={base + 0.5} x2={W - pad} y2={base + 0.5} className={s.stroke} />
      {[0, 1, 2, 3].map((q) => (
        <text key={q} x={pad + q * ((W - pad * 2) / 4)} y={base + 22} className={s.svgLabel}>
          Q{q + 1}
        </text>
      ))}
    </>
  )
}

function Matrix({ rand }) {
  const cols = 16
  const rows = 12
  const cw = W / cols
  const ch = H / rows
  const cells = []

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const r = rand()
      const key = `${x}-${y}`
      if (r < 0.06) {
        cells.push(<rect key={key} x={x * cw + 4} y={y * ch + 4} width={cw - 8} height={ch - 8} className={s.accent} />)
      } else if (r < 0.24) {
        cells.push(<rect key={key} x={x * cw + 4} y={y * ch + 4} width={cw - 8} height={ch - 8} className={s.inkDim} />)
      } else {
        cells.push(<circle key={key} cx={x * cw + cw / 2} cy={y * ch + ch / 2} r="1.3" className={s.ink} />)
      }
    }
  }
  return cells
}

function Waves({ rand }) {
  const count = 13
  const highlight = 3 + Math.floor(rand() * (count - 6))
  const freq = 0.011 + rand() * 0.01

  return Array.from({ length: count }, (_, j) => {
    const y0 = 36 + j * 24
    const amp = 5 + rand() * 16
    const phase = rand() * Math.PI * 2
    let d = ''
    for (let x = 0; x <= W; x += 6) {
      const y = y0 + Math.sin(x * freq + phase + j * 0.35) * amp
      d += `${x === 0 ? 'M' : 'L'}${x},${y.toFixed(1)}`
    }
    return <path key={j} d={d} className={j === highlight ? s.accentStroke : s.stroke} />
  })
}

const MOTIFS = [Orbits, Bars, Matrix, Waves]

/**
 * Project cover. Uses `image` if provided, otherwise draws a deterministic
 * generative motif seeded by `seed` (the project id).
 */
export function Cover({ as: Tag = 'div', seed, image, alt, index, caption, className, ...rest }) {
  const art = useMemo(() => {
    const h = hashString(seed)
    const Motif = MOTIFS[h % MOTIFS.length]
    return <Motif rand={seededRandom(h)} />
  }, [seed])

  return (
    <Tag className={cx(s.cover, className)} {...rest}>
      {image ? (
        <img src={image} alt={alt} loading="lazy" className={s.image} />
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt}>
          {art}
        </svg>
      )}
      {index != null && <span className={cx(s.tag, s.tl)}>REC_{index}</span>}
      {caption && <span className={cx(s.tag, s.br)}>{caption}</span>}
    </Tag>
  )
}
