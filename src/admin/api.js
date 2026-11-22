/**
 * Admin client for the backend (server/app.js): sign-in, content, and files.
 * The browser never talks to Supabase directly; the backend does, with the
 * signed-in admin's token, and Supabase row-level security still applies.
 */
import { API_BASE } from '@/lib/api.js'

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

async function call(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const h = { ...headers }
  if (auth) h.authorization = `Bearer ${await token()}`
  let payload = body
  if (body !== undefined && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    h['content-type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  let res
  try {
    res = await fetch(`${API_BASE}/api/${path}`, { method, headers: h, body: payload, cache: 'no-store' })
  } catch {
    throw new Error('Cannot reach the backend')
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty or not JSON */
  }
  if (!res.ok) {
    if (res.status === 401 && auth) keep(null)
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status })
  }
  return data
}

/** A valid access token, refreshed shortly before it expires. */
async function token() {
  if (!session) throw Object.assign(new Error('Signed out'), { status: 401 })
  if (Date.now() > session.expires - 60_000) {
    try {
      const next = await call('auth/refresh', { method: 'POST', body: { refresh: session.refresh }, auth: false })
      keep({ ...next, email: next.email || session.email })
    } catch {
      keep(null)
      throw Object.assign(new Error('Session expired. Sign in again.'), { status: 401 })
    }
  }
  return session.access
}

/** Signs in; the backend also confirms the account is a portfolio admin. */
export async function signIn(email, password) {
  keep(await call('auth/login', { method: 'POST', body: { email, password }, auth: false }))
  return session.email
}

export const checkAdmin = () => call('auth/me')

export function signOut() {
  const access = session?.access
  keep(null)
  if (access) fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${access}` } }).catch(() => {})
}

/** The stored content, or null when nothing has been saved yet. */
export async function loadContent() {
  return (await call('admin/content')).content
}

export async function saveContent(content) {
  await call('admin/content', { method: 'PUT', body: { content } })
}

/* ---- files ----------------------------------------------------------------- */

const MAX_UPLOAD = 4_000_000 // the backend runs on Vercel, which caps request bodies at 4.5 MB

function upload(folder, name, ext, blob) {
  if (blob.size > MAX_UPLOAD) throw new Error('File is larger than 4 MB')
  const q = new URLSearchParams({ folder, name, ext })
  return call(`admin/files?${q}`, { method: 'POST', body: blob, headers: { 'content-type': blob.type || 'application/octet-stream' } })
}

/** Files in projects/ or resumes/, newest first: [{ path, name, size, type, created, url }]. */
export async function listFiles(folder) {
  return (await call(`admin/files?folder=${folder}`)).files
}

/** Deletes files from storage (paths like "resumes/abc__cv.pdf"). */
export async function deleteFiles(paths) {
  if (!paths.length) return
  await call('admin/files', { method: 'DELETE', body: { paths } })
}

/** Downscale to ≤1600px and re-encode as WebP before upload (GIF kept as-is). */
async function prepare(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return { blob: file, ext: 'gif' }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.84))
  return blob ? { blob, ext: 'webp' } : { blob: file, ext: file.type === 'image/png' ? 'png' : 'jpg' }
}

/** Uploads a project image and returns its public URL. */
export async function uploadImage(file) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error('Use a PNG, JPEG, WebP or GIF image')
  const { blob, ext } = await prepare(file)
  const slug = file.name.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image'
  const { url } = await upload('projects', slug, ext, blob)
  uploadedImages.add(url)
  return url
}

const RESUME_EXT = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

/** Uploads a resume (PDF or Word, ≤4 MB) and returns its file entry. */
export async function uploadResume(file) {
  const ext = RESUME_EXT[file.type] ?? /\.(pdf|docx?)$/i.exec(file.name)?.[1].toLowerCase()
  if (!ext) throw new Error('Use a PDF or Word (.doc, .docx) file')
  return upload('resumes', file.name, ext, file)
}

/* ---- unused project images ------------------------------------------------- */

// Storage path ("projects/…") of a public URL in our bucket, else null.
const pathOf = (url) => {
  const m = typeof url === 'string' && /\/storage\/v1\/object\/public\/portfolio\/(projects\/[^?#/]+)$/.exec(url)
  return m ? decodeURIComponent(m[1]) : null
}

/* Project images uploaded in this tab: if they end up unused they are deleted on save. */
const uploadedImages = new Set()

/** Every projects/ image path referenced anywhere in the content. */
function imagePaths(content, out = new Set()) {
  if (typeof content === 'string') {
    const p = pathOf(content)
    if (p) out.add(p)
  } else if (content && typeof content === 'object') {
    for (const v of Object.values(content)) imagePaths(v, out)
  }
  return out
}

/**
 * After a save: deletes project images that were in the previous content (or
 * uploaded in this tab) but are no longer used. Returns how many were deleted.
 */
export async function cleanupImages(previous, next) {
  const keepPaths = imagePaths(next)
  const candidates = imagePaths(previous)
  for (const url of uploadedImages) {
    const p = pathOf(url)
    if (p) candidates.add(p)
  }
  const unused = [...candidates].filter((p) => !keepPaths.has(p))
  if (!unused.length) return 0
  await deleteFiles(unused)
  for (const url of [...uploadedImages]) if (unused.includes(pathOf(url))) uploadedImages.delete(url)
  return unused.length
}
