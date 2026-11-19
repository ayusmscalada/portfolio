import { UIProvider } from '@/context/UIContext.jsx'
import { Hud } from '@/components/Hud/Hud.jsx'
import { CommandPalette } from '@/components/CommandPalette/CommandPalette.jsx'
import { Toast } from '@/components/Toast/Toast.jsx'
import { Hero } from '@/sections/Hero/Hero.jsx'
import { About } from '@/sections/About/About.jsx'
import { Capabilities } from '@/sections/Capabilities/Capabilities.jsx'
import { Experience } from '@/sections/Experience/Experience.jsx'
import { Projects } from '@/sections/Projects/Projects.jsx'
import { Contact } from '@/sections/Contact/Contact.jsx'

export default function App() {
  return (
    <UIProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {/* Soft colour fields drifting behind the page (light theme, see base.css). */}
      <div className="backdrop" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <Hud />

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
