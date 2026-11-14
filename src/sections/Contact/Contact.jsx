import { profile, fullName } from '@/data/profile.js'
import { useUI } from '@/context/UIContext.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { scrollToId } from '@/lib/scrollTo.js'
import { modKey } from '@/lib/platform.js'
import s from './Contact.module.css'

export function Contact() {
  const { copyEmail, openPalette } = useUI()
  const year = new Date().getFullYear()

  const headers = [
    ['content-type', 'application/collaboration'],
    ['x-availability', profile.availability.open ? profile.availability.label : 'Not available right now'],
    ['x-location', `${profile.location} (${profile.timezoneLabel})`],
    ['x-response-time', '< 24h'],
    ['cache-control', 'no-templates, handcrafted'],
  ]

  return (
    <section id="contact" className={s.section} aria-labelledby="contact-title">
      <div className="wrap">
        <SectionHead id="contact" eyebrow="HTTP/2 200 OK · request complete — your move." title="Let's build something *worth* shipping." />

        <Reveal className={s.emailRow}>
          <a href={`mailto:${profile.email}`} className={s.email}>
            {profile.email}
          </a>
          <button type="button" className={s.copy} onClick={copyEmail}>
            Copy
          </button>
        </Reveal>

        <div className={s.grid}>
          <Reveal className={s.headers} role="group" aria-label="Response headers">
            <p className={s.statusLine}>
              HTTP/2 <span className={s.ok}>200 OK</span>
            </p>
            <dl>
              {headers.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}:</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className={s.elsewhere} delay={120}>
            <p className="label">Elsewhere</p>
            <ul className={s.socials}>
              {profile.socials.map((so) => (
                <li key={so.label}>
                  <a href={so.url} target="_blank" rel="noopener noreferrer" className={s.social}>
                    <span className={s.socialLabel}>{so.label}</span>
                    <span className={s.handle}>{so.handle}</span>
                    <span className={s.arrow} aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
              {profile.resumeUrl && (
                <li>
                  <a href={profile.resumeUrl} className={s.social} target="_blank" rel="noopener">
                    <span className={s.socialLabel}>Résumé</span>
                    <span className={s.handle}>PDF</span>
                    <span className={s.arrow} aria-hidden="true">
                      ↓
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </Reveal>
        </div>
      </div>

      <footer className={s.footer}>
        <div className={`wrap ${s.footerRow}`}>
          <span>
            © {year} {fullName}
          </span>
          <span className={s.built}>Designed &amp; built by hand · React + Vite</span>
          <span className={s.footerActions}>
            <button type="button" onClick={openPalette}>
              {modKey}+K menu
            </button>
            <button type="button" onClick={() => scrollToId('top')}>
              Back to top ↑
            </button>
          </span>
        </div>
        <p className={s.wordmark} style={{ '--chars': fullName.length }} aria-hidden="true">
          {fullName}
        </p>
      </footer>
    </section>
  )
}
