/**
 * Site-wide motion switch: <html data-motion="full|reduced">.
 * Defaults to full; visitors can turn it off from the nav or the ⌘K menu
 * and the choice is remembered. (Many machines, e.g. Windows with
 * "Show animations" off, report prefers-reduced-motion without the person
 * asking for it, so the site does not freeze itself on that signal alone.)
 */
const root = () => document.documentElement

export const isReducedMotion = () => root().dataset.motion === 'reduced'

export function setMotion(value) {
  root().dataset.motion = value
  try {
    localStorage.setItem('motion', value)
  } catch {
    /* private mode */
  }
}

export function subscribeMotion(fn) {
  const mo = new MutationObserver(fn)
  mo.observe(root(), { attributes: true, attributeFilter: ['data-motion'] })
  return () => mo.disconnect()
}
