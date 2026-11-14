const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Smooth-scroll to a section id and keep the URL hash in sync. */
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', id === 'top' ? location.pathname : `#${id}`)
}
