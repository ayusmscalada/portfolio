import { profile, fullName } from '@/data/profile.js'
import { KineticText } from '@/components/KineticText/KineticText.jsx'
import { TypeLine } from '@/components/motion/TypeLine.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Rich } from '@/lib/rich.jsx'
import { scrollToId } from '@/lib/scrollTo.js'
import { cx } from '@/lib/cx.js'
import s from './Hero.module.css'

function Seal() {
  const text = `open to work · ${profile.role} · est. ${profile.since} · `
  return (
    <div className={s.seal} aria-hidden="true">
      <svg viewBox="0 0 200 200" className={s.sealRing}>
        <defs>
          <path id="seal-path" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text className={s.sealText}>
          <textPath href="#seal-path" textLength="500" lengthAdjust="spacing">
            {text.toUpperCase()}
          </textPath>
        </text>
      </svg>
      <span className={s.sealCore}>↓</span>
    </div>
  )
}

export function Hero() {
  // Longest line (+ indent on line 2) drives the fit-to-width font size.
  const chars = Math.max(profile.firstName.length, profile.lastName.length + 2)

  return (
    <section id="top" className={s.hero} aria-labelledby="hero-title">
      <div className={cx('wrap', s.inner)}>
        <div className={s.request}>
          <span className={s.reqDot} aria-hidden="true" />
          <TypeLine className={s.reqText} text={`GET / HTTP/2 · host: ${profile.domain} · from: you`} />
          <span className={s.reqMeta}>v{new Date().getFullYear()}.1</span>
        </div>

        <div className={s.nameWrap}>
          <h1 id="hero-title" className={s.name} style={{ '--chars': chars }}>
            <span className="sr-only">
              {fullName}, {profile.role}
            </span>
            <KineticText lines={[profile.firstName, profile.lastName]} tail="." />
          </h1>
          {profile.availability.open && <Seal />}
        </div>

        <div className={s.bottom}>
          <Reveal className={s.intro} delay={700}>
            <p className={s.role}>
              <span className={s.roleIdx}>[{profile.role}]</span>
            </p>
            <p className={s.tagline}>
              <Rich text={profile.tagline} />
            </p>
            <a
              href="#about"
              className={s.cue}
              onClick={(e) => {
                e.preventDefault()
                scrollToId('about')
              }}
            >
              <span className={s.cueTrack} aria-hidden="true">
                <span className={s.cueDot} />
              </span>
              Scroll to send the request
            </a>
          </Reveal>

          <Reveal as="dl" className={s.meta} delay={850}>
            <div>
              <dt>Based in</dt>
              <dd>{profile.location}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={s.statusDot} data-open={profile.availability.open} aria-hidden="true" />
                {profile.availability.label}
              </dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{profile.focus.join(' · ')}</dd>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
