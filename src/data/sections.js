/**
 * Page sections, in order. `id` is the URL hash (#about), `label` shows in
 * the floating nav and command menu, `icon` picks the nav glyph
 * (home | about | skills | work | journey | contact), and `nav: false`
 * keeps a section in the command menu only.
 */
export const sections = [
  { id: 'top', index: '00', label: 'Home', icon: 'home' },
  { id: 'about', index: '01', label: 'About', icon: 'about' },
  { id: 'capabilities', index: '02', label: 'Skills', icon: 'skills' },
  { id: 'projects', index: '03', label: 'Projects', icon: 'work' },
  { id: 'experience', index: '04', label: 'Journey', icon: 'journey' },
  { id: 'contact', index: '05', label: 'Contact', icon: 'contact' },
]

export const sectionById = Object.fromEntries(sections.map((s) => [s.id, s]))
