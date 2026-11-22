/**
 * The site's backend (server/app.js, deployed as Vercel functions under /api).
 * Same origin by default; set API_URL at build time only if the backend is
 * deployed separately (then add this site to the backend's ALLOWED_ORIGINS).
 */
export const API_BASE = (import.meta.env.API_URL ?? '').replace(/\/+$/, '')

/** Public site content from the backend. Resolves to null on any failure. */
export function fetchContent() {
  return fetch(`${API_BASE}/api/content`)
    .then(async (r) => {
      const data = await r.json().catch(() => null)
      if (!r.ok) console.warn(`[portfolio] /api/content failed (${r.status}): ${data?.error ?? 'no JSON response'}. Showing the built-in content.`)
      return r.ok ? data : null
    })
    .then((data) => data?.content ?? null)
    .catch((err) => {
      console.warn('[portfolio] cannot reach /api/content, showing the built-in content.', err)
      return null
    })
}
