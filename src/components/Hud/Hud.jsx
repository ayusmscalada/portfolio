import { List, Moon, Sun } from '@/components/ph.jsx'
import { useContent } from '@/content/ContentContext.jsx'
import { sections } from '@/data/sections.js'
import { useUI } from '@/context/UIContext.jsx'
import { useScrollSpy } from '@/lib/scrollSpy.js'
import { Emblem } from '@/components/Emblem/Emblem.jsx'
import s from './Hud.module.css'

const navSections = sections.filter((sec) => sec.nav !== false && sec.id !== 'top')

/** Simple top bar: logo + name, section links, theme toggle (menu on phones). */
export function Hud() {
  const { theme, toggleTheme, openPalette } = useUI()
  const { fullName } = useContent()
  const index = useScrollSpy((st) => st.index)
  const scrolled = useScrollSpy((st) => st.progress > 0.002)
  const active = sections[index]?.id

  return (
    <header className={s.hud} data-scrolled={scrolled}>
      <div className={`wrap ${s.bar}`}>
        <a href="#top" className={s.brand} aria-label={`${fullName}, back to top`}>
          <Emblem variant="mark" />
          <span>{fullName}</span>
        </a>

        <nav className={s.nav} aria-label="Main navigation">
          {navSections.map((sec) => (
            <a key={sec.id} href={`#${sec.id}`} aria-current={active === sec.id ? 'location' : undefined}>
              {sec.label}
            </a>
          ))}
        </nav>

        <div className={s.tools}>
          <button className={s.icon} onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className={`${s.icon} ${s.menu}`} onClick={openPalette} aria-label="Open navigation menu" aria-haspopup="dialog">
            <List size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
