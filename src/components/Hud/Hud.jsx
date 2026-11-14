import { profile, fullName } from '@/data/profile.js'
import { sections } from '@/data/sections.js'
import { useUI } from '@/context/UIContext.jsx'
import { useScrollSpy } from '@/lib/scrollSpy.js'
import { scrollToId } from '@/lib/scrollTo.js'
import { modKey } from '@/lib/platform.js'
import { Clock } from '@/components/Clock/Clock.jsx'
import s from './Hud.module.css'

const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()

/** Isolated so only this tiny node re-renders on every scroll frame. */
function Progress() {
  const progress = useScrollSpy((st) => st.progress)
  return <span className={s.progress} style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
}

function ThemeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className={s.themeIcon}>
      <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5Z" fill="currentColor" />
    </svg>
  )
}

export function Hud() {
  const { theme, toggleTheme, openPalette } = useUI()
  const index = useScrollSpy((st) => st.index)
  const section = sections[index]

  return (
    <header className={s.hud}>
      <a
        href="#top"
        className={s.brand}
        onClick={(e) => {
          e.preventDefault()
          scrollToId('top')
        }}
        aria-label={`${fullName}, back to top`}
      >
        <span className={s.mark}>{initials}</span>
        <span className={s.brandName}>{fullName}</span>
      </a>

      <div className={s.route} aria-hidden="true">
        <span className={s.method}>GET</span>
        <span key={section.id} className={s.routeSwap}>
          <span className={s.path}>/{section.layer}</span>
          <span className={s.sep}>→</span>
          <span className={s.routeLabel}>{section.label}</span>
        </span>
      </div>

      <div className={s.tools}>
        {profile.availability.open && (
          <span className={s.status}>
            <span className={s.pulse} aria-hidden="true" />
            {profile.availability.short}
          </span>
        )}
        <Clock className={s.clock} timeZone={profile.timezone} label={profile.timezoneLabel} />
        <button
          type="button"
          className={s.iconBtn}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          data-theme-state={theme}
        >
          <ThemeIcon />
        </button>
        <button
          type="button"
          className={s.menuBtn}
          onClick={openPalette}
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K Meta+K"
        >
          <span className={s.menuText}>Menu</span>
          <kbd className={s.kbd}>{modKey}</kbd>
          <kbd className={s.kbd}>K</kbd>
        </button>
      </div>

      <Progress />
    </header>
  )
}
