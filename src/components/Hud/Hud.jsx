import { useEffect, useRef, useState } from 'react'
import { List, Moon, Pause, Play, Sun } from '@/components/ph.jsx'
import { fullName, profile } from '@/data/profile.js'
import { sections } from '@/data/sections.js'
import { useUI } from '@/context/UIContext.jsx'
import { useScrollSpy } from '@/lib/scrollSpy.js'
import { navIcons } from '@/components/icons.js'
import { Emblem } from '@/components/Emblem/Emblem.jsx'
import { Clock } from '@/components/Clock/Clock.jsx'
import s from './Hud.module.css'

const navSections = sections.filter((sec) => sec.nav !== false)

export function Hud() {
  const { theme, toggleTheme, motion, toggleMotion, openPalette } = useUI()
  const index = useScrollSpy((st) => st.index)
  const scrolled = useScrollSpy((st) => st.progress > 0.002)
  const active = sections[index]?.id
  const navRef = useRef(null)
  const [pill, setPill] = useState(null)

  // Slide the glowing indicator under the active link. Measured in a frame
  // callback (not a layout effect) so it never forces layout before first paint.
  useEffect(() => {
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = navRef.current?.querySelector('[aria-current]')
        setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null)
      })
    }
    measure()
    document.fonts?.ready.then(measure) // fonts can shift link widths
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [active])

  return (
    <header className={s.hud} data-scrolled={scrolled}>
      <div className={s.bar}>
        <span className={s.progress} aria-hidden="true" />
        <a href="#top" className={s.brand} aria-label={`${fullName}, back to top`}>
          <Emblem variant="mark" />
        </a>

        <nav ref={navRef} className={s.nav} aria-label="Main navigation">
          {pill && <span className={s.pill} style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} aria-hidden="true" />}
          {navSections.map((sec) => {
            const Icon = navIcons[sec.icon]
            return (
              <a key={sec.id} href={`#${sec.id}`} aria-current={active === sec.id ? 'location' : undefined}>
                {Icon && <Icon size={15} weight={active === sec.id ? 'fill' : 'regular'} aria-hidden="true" />}
                <span>{sec.label}</span>
              </a>
            )
          })}
        </nav>

        <div className={s.tools}>
          <span className={s.live} title={profile.availability.label}>
            <span className={s.liveDot} aria-hidden="true" />
            <Clock timeZone={profile.timezone} label={profile.timezoneLabel} className={s.clock} />
          </span>
          <button className={s.icon} onClick={toggleMotion} aria-label={motion === 'full' ? 'Pause animations' : 'Play animations'} title={motion === 'full' ? 'Pause animations' : 'Play animations'}>
            {motion === 'full' ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
          </button>
          <button className={s.icon} onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className={s.menu} onClick={openPalette} aria-label="Open navigation menu" aria-haspopup="dialog">
            <List size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
