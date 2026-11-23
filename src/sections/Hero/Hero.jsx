import { ArrowUpRight } from '@/components/ph.jsx'
import { useContent } from '@/content/ContentContext.jsx'
import { Emblem } from '@/components/Emblem/Emblem.jsx'
import { socialIcons } from '@/components/icons.js'
import { Rich } from '@/lib/rich.jsx'
import s from './Hero.module.css'

export function Hero() {
  const { profile, fullName } = useContent()

  return (
    <section id="top" className={s.hero} aria-labelledby="hero-title">
      <div className={`wrap ${s.grid}`}>
        <div className={s.content}>
          <p className={s.hello}>
            Hi, I’m {fullName} - <span>{profile.role}</span>
          </p>
          <h1 id="hero-title" className={s.title}>
            <Rich text={profile.headline} />
          </h1>
          {profile.tagline && (
            <p className={s.summary}>
              <Rich text={profile.tagline} />
            </p>
          )}

          <div className={s.actions}>
            <a className={s.primary} href="#projects">
              View my work <ArrowUpRight size={16} weight="bold" />
            </a>
            <a className={s.secondary} href="#contact">
              Get in touch
            </a>
            {profile.resumeUrl && (
              <a className={s.secondary} href={profile.resumeUrl} target="_blank" rel="noopener">
                Resume
              </a>
            )}
          </div>

          {profile.socials?.length > 0 && (
            <ul className={s.socials}>
              {profile.socials.map((so) => {
                const Icon = socialIcons[so.icon] ?? socialIcons.writing
                return (
                  <li key={so.label}>
                    <a href={so.url} target="_blank" rel="noopener noreferrer" aria-label={so.label} title={so.label}>
                      <Icon size={20} />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className={s.visual}>
          <Emblem label={`${fullName} logo`} />
        </div>
      </div>
    </section>
  )
}
