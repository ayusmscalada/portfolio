import { SplitText } from '@/components/motion/SplitText.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import s from './SectionHead.module.css'

/**
 * Shared section header: glowing badge, split-reveal title with a gradient
 * on *emphasis*, and an optional lede.
 */
export function SectionHead({ id, title, lede, badge, align = 'center' }) {
  return (
    <header className={s.head} data-align={align}>
      {badge && (
        <Reveal as="p" className={s.badge}>
          <span className={s.dot} aria-hidden="true" />
          {badge}
        </Reveal>
      )}
      <SplitText text={title} as="h2" className={s.title} id={`${id}-title`} />
      {lede && (
        <Reveal as="p" className={s.lede} delay={200}>
          {lede}
        </Reveal>
      )}
    </header>
  )
}
