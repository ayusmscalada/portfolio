import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import bundled from '@/data/content.json'

/**
 * Site content (name, skills, projects, …) is stored in Supabase and edited
 * from the admin page. main.jsx fetches it before the first render (started
 * from index.html, in parallel with the JS download); src/data/content.json is
 * only the fallback if Supabase is unreachable or not configured yet. Open tabs
 * in the same browser update on save (BroadcastChannel), and the admin preview
 * frame updates per keystroke (postMessage).
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
    if (typeof v === 'string') return v.replaceAll('{years}', String(years))
    if (Array.isArray(v)) return v.map(fill)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
    return v
  }
  const c = fill(raw)
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
    return () => {
      bc?.close()
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
    document.title = `${content.fullName} — ${content.profile.role}`
  }, [content.fullName, content.profile.role])

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>
}

export const useContent = () => useContext(ContentContext)
