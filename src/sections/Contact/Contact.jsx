import { ArrowUp, Copy, EnvelopeSimple } from '@/components/ph.jsx'
import { useContent } from '@/content/ContentContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { Clock } from '@/components/Clock/Clock.jsx'
import { Emblem } from '@/components/Emblem/Emblem.jsx'
import { socialIcons } from '@/components/icons.js'
import { scrollToId } from '@/lib/scrollTo.js'
import { modKey } from '@/lib/platform.js'
import s from './Contact.module.css'

export function Contact() {
  const { copyEmail, openPalette } = useUI()
  const { profile, fullName, contact } = useContent()
  const year = new Date().getFullYear()

  return (
    <section id="contact" className={s.section} aria-labelledby="contact-title" data-stage="contact">
      <div className={s.glow} aria-hidden="true" />
      <div className="wrap">
        <SectionHead
          id="contact"
          badge="Contact"
          title={contact.title}
          lede={contact.lede}
        />

        <Reveal className={s.panel} data-spot>
          <div className={s.status}>
            <span>{profile.availability.open ? profile.availability.label : 'Not taking new work right now'}</span>
            <span className={s.localTime}>
              Local time <Clock timeZone={profile.timezone} label={profile.timezoneLabel} />
            </span>
          </div>

          <div className={s.emailRow}>
            <a href={`mailto:${profile.email}`} className={s.email}>
              <EnvelopeSimple size={26} aria-hidden="true" />
              {profile.email}
            </a>
            <button type="button" data-magnetic className={s.copy} onClick={copyEmail}>
              <Copy size={16} /> Copy
            </button>
          </div>

          <ul className={s.socials}>
            {profile.socials.map((so) => {
              const Icon = socialIcons[so.icon] ?? socialIcons.writing
              return (
                <li key={so.label}>
                  <a href={so.url} target="_blank" rel="noopener noreferrer" className={s.social} aria-label={`${so.label}: ${so.handle}`}>
                    <Icon size={20} />
                    <span>{so.label}</span>
                  </a>
                </li>
              )
            })}
            {profile.resumeUrl && (
              <li>
                <a href={profile.resumeUrl} className={s.social} target="_blank" rel="noopener">
                  <span>Résumé ↓</span>
                </a>
              </li>
            )}
          </ul>
        </Reveal>
      </div>

      <footer className={s.footer}>
        <div className={`wrap ${s.footerRow}`}>
          <span className={s.sign}>
            <Emblem variant="mark" />© {year} {fullName}
          </span>
          <span className={s.built}>Designed &amp; built by hand · React + WebGL</span>
          <button type="button" className={s.kbd} onClick={openPalette}>
            {modKey}+K
          </button>
          <button type="button" data-magnetic className={s.top} onClick={() => scrollToId('top')} aria-label="Back to top">
            <ArrowUp size={20} weight="bold" />
          </button>
        </div>
      </footer>
    </section>
  )
}
