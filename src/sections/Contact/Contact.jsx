import { ArrowUp, Copy, EnvelopeSimple } from '@/components/ph.jsx'
import { useContent } from '@/content/ContentContext.jsx'
import { useUI } from '@/context/UIContext.jsx'
import { SectionHead } from '@/components/SectionHead/SectionHead.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import { socialIcons } from '@/components/icons.js'
import { scrollToId } from '@/lib/scrollTo.js'
import s from './Contact.module.css'

export function Contact() {
  const { copyEmail } = useUI()
  const { profile, fullName, contact } = useContent()
  const year = new Date().getFullYear()

  return (
    <section id="contact" className={s.section} aria-labelledby="contact-title">
      <div className="wrap">
        <Reveal className={`card ${s.panel}`}>
          <SectionHead id="contact" badge="Contact" title={contact.title} lede={contact.lede} align="center" />

          <div className={s.actions}>
            <a href={`mailto:${profile.email}`} className={s.email}>
              <EnvelopeSimple size={20} aria-hidden="true" />
              {profile.email}
            </a>
            <button type="button" className={s.copy} onClick={copyEmail}>
              <Copy size={16} /> Copy email
            </button>
          </div>

          <ul className={s.socials}>
            {profile.socials.map((so) => {
              const Icon = socialIcons[so.icon] ?? socialIcons.writing
              return (
                <li key={so.label}>
                  <a href={so.url} target="_blank" rel="noopener noreferrer" aria-label={`${so.label}: ${so.handle}`}>
                    <Icon size={18} />
                    <span>{so.label}</span>
                  </a>
                </li>
              )
            })}
            {profile.resumeUrl && (
              <li>
                <a href={profile.resumeUrl} target="_blank" rel="noopener">
                  <span>resume</span>
                </a>
              </li>
            )}
          </ul>
        </Reveal>
      </div>

      <footer className={`wrap ${s.footer}`}>
        <span>
          © {year} {fullName}
        </span>
        <button type="button" className={s.top} onClick={() => scrollToId('top')}>
          Back to top <ArrowUp size={14} weight="bold" />
        </button>
      </footer>
    </section>
  )
}
