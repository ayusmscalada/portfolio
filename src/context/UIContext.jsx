import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useContent } from '@/content/ContentContext.jsx'
import { isReducedMotion, setMotion } from '@/lib/motion.js'

const UIContext = createContext(null)

export const ACCENTS = ['signal', 'acid', 'ion', 'plasma']
const THEME_COLORS = { dark: '#050a14', light: '#edf5fb' }

const root = () => document.documentElement
const store = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode: ignore */
  }
}

export function UIProvider({ children }) {
  const [theme, setTheme] = useState(() => root().dataset.theme || 'dark')
  const [accent, setAccent] = useState(() => root().dataset.accent || ACCENTS[0])
  const [motion, setMotionState] = useState(() => (isReducedMotion() ? 'reduced' : 'full'))
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(0)
  const { profile } = useContent()

  /* ---- toast ---------------------------------------------------------- */
  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  /* ---- theme: circular reveal from the click point (View Transitions) -- */
  const toggleTheme = useCallback(
    (event) => {
      const next = theme === 'dark' ? 'light' : 'dark'
      const apply = () => {
        root().dataset.theme = next
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next])
        store('theme', next)
        flushSync(() => setTheme(next))
      }

      const reduced = document.documentElement.dataset.motion === 'reduced'
      if (!document.startViewTransition || reduced) return apply()

      const rect = event?.currentTarget?.getBoundingClientRect?.()
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40
      const y = rect ? rect.top + rect.height / 2 : 28
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

      const transition = document.startViewTransition(apply)
      transition.ready.then(() => {
        root().animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
    },
    [theme],
  )

  /* ---- motion: site-wide animation switch ---------------------------- */
  const toggleMotion = useCallback(() => {
    const next = motion === 'full' ? 'reduced' : 'full'
    setMotion(next)
    setMotionState(next)
    notify(next === 'full' ? 'Motion on' : 'Motion paused')
  }, [motion, notify])

  /* ---- accent --------------------------------------------------------- */
  const cycleAccent = useCallback(() => {
    const next = ACCENTS[(ACCENTS.indexOf(accent) + 1) % ACCENTS.length]
    root().dataset.accent = next
    store('accent', next)
    setAccent(next)
    notify(`Accent → ${next}`)
  }, [accent, notify])

  /* ---- clipboard ------------------------------------------------------ */
  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      notify('Email copied to clipboard')
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }, [notify, profile.email])

  /* ---- palette + global hotkeys (⌘K / Ctrl+K, and "/") ---------------- */
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  useEffect(() => {
    const onKey = (e) => {
      const typing = e.target.closest?.('input, textarea, [contenteditable="true"]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      accent,
      cycleAccent,
      motion,
      toggleMotion,
      paletteOpen,
      openPalette,
      closePalette,
      toast,
      notify,
      copyEmail,
    }),
    [theme, toggleTheme, accent, cycleAccent, motion, toggleMotion, paletteOpen, openPalette, closePalette, toast, notify, copyEmail],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>')
  return ctx
}
