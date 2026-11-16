/**
 * Admin access to Supabase over plain REST: Auth (email + password), the
 * content row, and the public `portfolio` storage bucket. Row-level security
 * (supabase/setup.sql) only lets accounts listed in portfolio_admins write.
 */
import { BUCKET, CONTENT_ROW, SB_KEY, SB_READY, SB_URL, publicUrl } from '@/lib/supabase.js'

export { SB_READY }

const SESSION = 'portfolio-admin-session'
let session = null
try {
  session = JSON.parse(sessionStorage.getItem(SESSION) ?? 'null')
} catch {
  /* ignore */
}

function keep(next) {
  session = next
  try {
    next ? sessionStorage.setItem(SESSION, JSON.stringify(next)) : sessionStorage.removeItem(SESSION)
  } catch {
    /* ignore */
  }
}

export const hasSession = () => !!session
export const sessionEmail = () => session?.email ?? ''

async function request(url, init = {}) {
  let res
  try {
    res = await fetch(url, { ...init, headers: { apikey: SB_KEY, ...init.headers }, cache: 'no-store' })
  } catch {
    throw new Error('Cannot reach Supabase')
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const msg = data?.error_description || data?.msg || data?.message || data?.error || `Request failed (${res.status})`
    const err = new Error(res.status === 403 || /row-level security/i.test(msg) ? 'This account is not allowed to edit the portfolio.' : msg)
    err.status = res.status
    throw err
  }
  return data
}

function fromAuth(data) {
  return { access: data.access_token, refresh: data.refresh_token, expires: Date.now() + data.expires_in * 1000, email: data.user?.email ?? session?.email }
}

/** A valid access token, refreshed shortly before it expires. */
async function token() {
  if (!session) throw Object.assign(new Error('Signed out'), { status: 401 })
  if (Date.now() > session.expires - 60_000) {
    try {
      const data = await request(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh }),
      })
      keep(fromAuth(data))
    } catch {
      keep(null)
      throw Object.assign(new Error('Session expired. Sign in again.'), { status: 401 })
    }
  }
  return session.access
}

const authed = async (extra = {}) => ({ authorization: `Bearer ${await token()}`, ...extra })

/** Signs in and confirms the account is a portfolio admin. */
export async function signIn(email, password) {
  const data = await request(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).catch((err) => {
    throw err.status === 400 ? new Error('Wrong email or password') : err
  })
  keep(fromAuth(data))
  try {
    await checkAdmin()
  } catch (err) {
    keep(null)
    throw err
  }
  return session.email
}

export async function checkAdmin() {
  const rows = await request(`${SB_URL}/rest/v1/portfolio_admins?select=user_id`, { headers: await authed() })
  if (!rows?.length) throw new Error('This account is not listed in portfolio_admins (see supabase/setup.sql).')
}

export function signOut() {
  const access = session?.access
  keep(null)
  if (access) fetch(`${SB_URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: SB_KEY, authorization: `Bearer ${access}` } }).catch(() => {})
}

/** The stored content, or null when the table is still empty. */
export async function loadContent() {
  const rows = await request(`${CONTENT_ROW}?id=eq.1&select=content,updated_at`, { headers: await authed() })
  return rows?.[0]?.content ?? null
}

export async function saveContent(content) {
  await request(`${CONTENT_ROW}?on_conflict=id`, {
    method: 'POST',
    headers: await authed({ 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ id: 1, content, updated_at: new Date().toISOString() }),
  })
}

/** Downscale to ≤1600px and re-encode as WebP before upload (GIF kept as-is). */
async function prepare(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return { blob: file, type: file.type, ext: 'gif' }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.84))
  return blob ? { blob, type: 'image/webp', ext: 'webp' } : { blob: file, type: file.type, ext: file.type.split('/')[1] }
}

/** Uploads to the public bucket and returns its public URL. */
export async function uploadImage(file) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('Use a PNG, JPEG, WebP or GIF image')
  const { blob, type, ext } = await prepare(file)
  if (blob.size > 5_000_000) throw new Error('Image is larger than 5 MB')
  const slug = file.name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image'
  const path = `projects/${slug}-${Date.now().toString(36)}.${ext}`
  await request(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: await authed({ 'content-type': type, 'cache-control': 'max-age=31536000' }),
    body: blob,
  })
  return publicUrl(path)
}
