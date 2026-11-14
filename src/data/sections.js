/**
 * The page is one HTTP request travelling down the stack and back.
 * Each section is a "layer". `id` is the URL hash (#about), `layer` is the
 * technical name shown in the rail/HUD, `label` is the plain-English name.
 *
 * Reorder or rename here; the rail, header and command menu all follow.
 */
export const sections = [
  { id: 'top', index: '00', layer: 'request', label: 'Intro' },
  { id: 'about', index: '01', layer: 'client', label: 'About' },
  { id: 'capabilities', index: '02', layer: 'api', label: 'Capabilities' },
  { id: 'experience', index: '03', layer: 'services', label: 'Experience' },
  { id: 'projects', index: '04', layer: 'data', label: 'Projects' },
  { id: 'contact', index: '05', layer: 'response', label: 'Contact' },
]

export const sectionById = Object.fromEntries(sections.map((s) => [s.id, s]))
