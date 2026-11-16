/**
 * Runs `fn` once the page has loaded, painted, and gone idle, so heavy work
 * (like booting WebGL) never competes with first paint. Returns a canceller.
 */
export function afterFirstPaint(fn) {
  let cancelled = false
  let idleId = 0
  const go = () =>
    requestAnimationFrame(() =>
      setTimeout(() => {
        if (cancelled) return
        idleId = 'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 100)
      }, 0),
    )
  if (document.readyState === 'complete') go()
  else window.addEventListener('load', go, { once: true })
  return () => {
    cancelled = true
    window.removeEventListener('load', go)
    if ('cancelIdleCallback' in window) cancelIdleCallback(idleId)
    else clearTimeout(idleId)
  }
}
