import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import bundled from '@/data/content.json'
import { API_BASE, fetchContent } from '@/lib/api.js'

/**
 * Site content (name, skills, projects, …) is served by the backend
 * (/api/content, stored in Vercel Blob) and edited from the admin page. main.jsx
 * fetches it before the first render (started from index.html, in parallel
 * with the JS download); src/data/content.json is only the fallback if the
 * backend is unreachable or has nothing yet. Open pages pick up saves by
 * themselves (see the refresh below), tabs in the same browser update at once
 * (BroadcastChannel), and the admin preview frame updates per keystroke.
 */
const ContentContext = createContext(null)

export const CONTENT_CHANNEL = 'portfolio-content'
export const DRAFT_MESSAGE = 'portfolio:draft'

const isPreview = () => window.parent !== window && new URLSearchParams(location.search).has('preview')

/** Fills derived values: {years} placeholders, full name, monogram. */
export function resolveContent(raw) {
  const profile = raw.profile ?? {}
  const years = Math.max(0, new Date().getFullYear() - (Number(profile.since) || new Date().getFullYear()))
  const fill = (v) => {
    // Stored files are served by the backend at /api/files/…
    if (typeof v === 'string') return v.startsWith('/api/files/') ? API_BASE + v : v.replaceAll('{years}', String(years))
    if (Array.isArray(v)) return v.map(fill)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
    return v
  }
  const c = fill(raw)
  // Projects switched off in the admin are not shown to visitors.
  c.projects = (c.projects ?? []).filter((p) => !p.hidden)
  c.about.stats = (c.about.stats ?? []).map((st) => ({ ...st, value: Number(st.value) || 0 }))
  const first = c.profile.firstName ?? ''
  const last = c.profile.lastName ?? ''
  c.fullName = `${first} ${last}`.trim()
  c.monogram = (c.profile.monogram || `${first[0] ?? ''}${last[0] ?? ''}` || '·').slice(0, 2).toUpperCase()
  return c
}

export function ContentProvider({ initial, children }) {
  const [raw, setRaw] = useState(() => (initial?.profile ? initial : bundled))

  useEffect(() => {
    // Admin preview frame: drafts arrive from the parent window.
    if (isPreview()) {
      const onMsg = (e) => {
        if (e.origin === location.origin && e.data?.type === DRAFT_MESSAGE) setRaw(e.data.content)
      }
      window.addEventListener('message', onMsg)
      window.parent.postMessage({ type: 'portfolio:ready' }, location.origin)
      return () => window.removeEventListener('message', onMsg)
    }

    let bc
    try {
      bc = new BroadcastChannel(CONTENT_CHANNEL)
      bc.onmessage = (e) => e.data?.profile && setRaw(e.data)
    } catch {
      /* unsupported: fine */
    }

    // Admin saves reach open pages by themselves: re-check the backend when the
    // tab comes back into view and once a minute while it is visible. The page
    // only re-renders when the content actually changed.
    let last = JSON.stringify(initial?.profile ? initial : null)
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      fetchContent().then((next) => {
        if (!next?.profile) return
        const text = JSON.stringify(next)
        if (text === last) return
        last = text
        setRaw(next)
      })
    }
    const timer = setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      bc?.close()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const content = useMemo(() => {
    try {
      return resolveContent(raw)
    } catch {
      return resolveContent(bundled)
    }
  }, [raw])

  useEffect(() => {
    document.title = `${content.fullName} - ${content.profile.role}`
  }, [content.fullName, content.profile.role])

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}

export const useContent = () => useContext(ContentContext)
