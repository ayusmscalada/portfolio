import { sectionById } from '@/data/sections.js'
import { SplitText } from '@/components/motion/SplitText.jsx'
import { Reveal } from '@/components/motion/Reveal.jsx'
import s from './SectionHead.module.css'

/**
 * Shared section header:
 *   +── 02  /api ───────────────────────── Capabilities ──+
 *   $ eyebrow
 *   Big display title                          short lede
 */
export function SectionHead({ id, title, lede, eyebrow }) {
  const sec = sectionById[id]

  return (
    <header className={s.head}>
      <div className={s.meta}>
        <span className={s.index}>{sec.index}</span>
        <span className={s.layer}>/{sec.layer}</span>
        <span className={s.rule} aria-hidden="true" />
        <span className={s.label}>{sec.label}</span>
      </div>

      <div className={s.body}>
        <div className={s.titleCol}>
          {eyebrow && (
            <Reveal as="p" className={s.eyebrow}>
              {eyebrow}
            </Reveal>
          )}
          <SplitText text={title} as="h2" className={s.title} id={`${id}-title`} />
        </div>
        {lede && (
          <Reveal as="p" className={s.lede} delay={250}>
            {lede}
          </Reveal>
        )}
      </div>
    </header>
  )
}
