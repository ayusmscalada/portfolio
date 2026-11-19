import { Reveal } from '@/components/motion/Reveal.jsx'
import { Rich } from '@/lib/rich.jsx'
import s from './SectionHead.module.css'

/** Section header: small label, title (*emphasis* in accent colour), optional lede. */
export function SectionHead({ id, title, lede, badge, align = 'start', size = 'lg' }) {
  return (
    <Reveal as="header" className={s.head} data-align={align} data-size={size}>
      {badge && <p className={s.badge}>{badge}</p>}
      <h2 className={s.title} id={`${id}-title`}>
        <Rich text={title} />
      </h2>
      {lede && <p className={s.lede}>{lede}</p>}
    </Reveal>
  )
}
