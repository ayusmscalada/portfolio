/**
 * Minimal Supabase REST access (no SDK, so the public bundle stays small).
 * The public site only ever reads; writes happen in the admin with a signed-in
 * user and are enforced by row-level security (see supabase/setup.sql).
 */
export const SB_URL = (import.meta.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
export const SB_KEY = import.meta.env.SUPABASE_ANON_KEY ?? ''
export const SB_READY = /^https?:\/\//.test(SB_URL) && !!SB_KEY

export const BUCKET = 'portfolio'
export const CONTENT_ROW = `${SB_URL}/rest/v1/portfolio_content`

/** Public read of the content row. Resolves to null on any failure. */
export function fetchContent() {
  if (!SB_READY) return Promise.resolve(null)
  return fetch(`${CONTENT_ROW}?id=eq.1&select=content`, { headers: { apikey: SB_KEY } })
    .then((r) => (r.ok ? r.json() : null))
    .then((rows) => rows?.[0]?.content ?? null)
    .catch(() => null)
}

export const publicUrl = (path) => `${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`
