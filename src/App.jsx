import { UIProvider } from '@/context/UIContext.jsx'
import { Hud } from '@/components/Hud/Hud.jsx'
import { StackRail } from '@/components/StackRail/StackRail.jsx'
import { CommandPalette } from '@/components/CommandPalette/CommandPalette.jsx'
import { Toast } from '@/components/Toast/Toast.jsx'
import { Hero } from '@/sections/Hero/Hero.jsx'
import { About } from '@/sections/About/About.jsx'
import { Capabilities } from '@/sections/Capabilities/Capabilities.jsx'
import { Experience } from '@/sections/Experience/Experience.jsx'
import { Projects } from '@/sections/Projects/Projects.jsx'
import { Contact } from '@/sections/Contact/Contact.jsx'

/** Faint layout columns behind everything: the page shows its own grid. */
function GridLines() {
  return (
    <div className="gridlines" aria-hidden="true">
      <div className="wrap">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <UIProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <GridLines />
      <Hud />
      <StackRail />

      {/* Sections follow the request: request → client → api → services → data → response */}
      <main id="main" className="main">
        <Hero />
        <About />
        <Capabilities />
        <Experience />
        <Projects />
        <Contact />
      </main>

      <CommandPalette />
      <Toast />
    </UIProvider>
  )
}
