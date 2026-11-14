import { useSyncExternalStore } from 'react'
import { sections } from '@/data/sections.js'

/**
 * One shared scroll listener for the whole app.
 *
 * - index:    which section is active (its top has crossed 40% of the viewport)
 * - pos:      0 → 1 position along the stack rail, aligned so the packet sits
 *             exactly on a node at the moment its section becomes active
 * - progress: 0 → 1 raw document scroll progress
 *
 * Components subscribe with a selector, so the header only re-renders when
 * the active section changes, while the rail updates every frame.
 */
const ids = sections.map((s) => s.id)
let state = { index: 0, pos: 0, progress: 0 }
const listeners = new Set()
let frame = 0

function measure() {
  frame = 0
  const vh = window.innerHeight
  const y = window.scrollY
  const max = Math.max(0, document.documentElement.scrollHeight - vh)
  const last = ids.length - 1

  // Scroll offset at which each section becomes active: when its top crosses
  // 40% of the viewport. Clamped to the scrollable range so short final
  // sections still activate at the very bottom of the page.
  const anchors = ids.map((id, i) => {
    const el = document.getElementById(id)
    if (!el || i === 0) return 0
    const top = el.getBoundingClientRect().top + y
    return Math.min(max, Math.max(0, top - vh * 0.4))
  })

  let index = 0
  for (let i = 0; i < anchors.length; i++) if (y >= anchors[i] - 1) index = i

  const progress = max > 0 ? Math.min(1, y / max) : 0
  const from = anchors[index]
  const to = anchors[index + 1]
  const frac = to == null ? 0 : Math.min(1, Math.max(0, (y - from) / Math.max(1, to - from)))
  const pos = index === last ? 1 : (index + frac) / last

  if (index !== state.index || Math.abs(pos - state.pos) > 0.0005 || Math.abs(progress - state.progress) > 0.0005) {
    state = { index, pos, progress }
    listeners.forEach((fn) => fn())
  }
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(measure)
}

function subscribe(fn) {
  listeners.add(fn)
  if (listeners.size === 1) {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
  }
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0) {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
      frame = 0
    }
  }
}

export function useScrollSpy(selector) {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}
