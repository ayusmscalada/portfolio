import { profile } from '@/data/profile.js'
import { socialIcons } from '@/components/icons.js'
import s from './SocialRail.module.css'

/** Fixed vertical rail of contact links (wide screens only). */
export function SocialRail() {
  const links = [
    { label: 'Email', icon: 'email', url: `mailto:${profile.email}` },
    ...profile.socials.filter((so) => socialIcons[so.icon]),
  ]
  return (
    <aside className={s.rail} aria-label="Social links">
      <ul>
        {links.map((so) => {
          const Icon = socialIcons[so.icon]
          const external = !so.url.startsWith('mailto:')
          return (
            <li key={so.label}>
              <a href={so.url} aria-label={so.label} data-tip={so.label} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                <Icon size={19} />
              </a>
            </li>
          )
        })}
      </ul>
      <span className={s.line} aria-hidden="true" />
    </aside>
  )
}
