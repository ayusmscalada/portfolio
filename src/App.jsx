import { useEffect } from 'react'
import { UIProvider } from '@/context/UIContext.jsx'
import { Hud } from '@/components/Hud/Hud.jsx'
import { SocialRail } from '@/components/SocialRail/SocialRail.jsx'
import { CursorFX } from '@/components/CursorFX/CursorFX.jsx'
import { CommandPalette } from '@/components/CommandPalette/CommandPalette.jsx'
import { Toast } from '@/components/Toast/Toast.jsx'
import { Hero } from '@/sections/Hero/Hero.jsx'
import { About } from '@/sections/About/About.jsx'
import { Capabilities } from '@/sections/Capabilities/Capabilities.jsx'
import { Experience } from '@/sections/Experience/Experience.jsx'
import { Projects } from '@/sections/Projects/Projects.jsx'
import { Contact } from '@/sections/Contact/Contact.jsx'

/**
 * One delegated listener powers the cursor spotlight on every [data-spot]
 * card: it only writes two CSS variables on the hovered card, once per frame.
 */
function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let frame = 0
    let last
    const onMove = (e) => {
      last = e
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const card = last.target.closest?.('[data-spot]')
        if (!card) return
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${last.clientX - r.left}px`)
        card.style.setProperty('--my', `${last.clientY - r.top}px`)
      })
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])
}

export default function App() {
  useSpotlight()
  return (
    <UIProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
      </div>
      <Hud />
      <SocialRail />
      <CursorFX />

      <main id="main" className="main">
        <Hero />
        <About />
        <Capabilities />
        <Projects />
        <Experience />
        <Contact />
      </main>

      <CommandPalette />
      <Toast />
    </UIProvider>
  )
}
