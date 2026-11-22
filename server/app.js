/**
 * Portfolio backend: one request handler (Web Request → Response) used by the
 * Vercel function in api/index.js and, in development, by the Vite dev server
 * (vite.config.js), so `npm run dev` still runs everything on one port.
 *
 * Everything is stored in Vercel Blob:
 *   content.json        the site content edited in the admin page
 *   projects/<file>     project images
 *   resumes/<file>      resumes
 * Files are served through this backend at /api/files/<path>, so it works with
 * public and private Blob stores alike and images stay on the site's domain.
 *
 * Environment (server only, never sent to the browser):
 *   BLOB_READ_WRITE_TOKEN  added by Vercel when a Blob store is connected
 *   ADMIN_PASSWORD         the admin page password
 *   SESSION_SECRET         optional: signs admin sessions (derived from the two
 *                          values above when not set; changing the password
 *                          signs every session out)
 *   ALLOWED_ORIGINS        optional, comma-separated: only needed when the site
 *                          is served from a different domain than this backend
 *
 * Routes:
 *   GET    /api/content                public site content
 *   GET    /api/files/<folder>/<name>  a stored image or resume
 *   GET    /api/health                 is the backend configured?
 *   POST   /api/auth/login             { password } → session
 *   POST   /api/auth/refresh           { refresh } → session
 *   POST   /api/auth/logout
 *   GET    /api/auth/me                session check
 *   GET    /api/admin/content          stored content for the editor (or null)
 *   PUT    /api/admin/content          { content } → save
 *   GET    /api/admin/files?folder=    list projects/ or resumes/
 *   POST   /api/admin/files?folder=&name=&ext=   raw body → upload (≤ 4 MB)
 *   DELETE /api/admin/files            { paths: [...] } → delete
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { del, get, list, put } from '@vercel/blob'

const CONTENT = 'content.json'
const FOLDERS = new Set(['projects', 'resumes'])
const MAX_UPLOAD = 4_000_000 // Vercel functions accept request bodies up to 4.5 MB
const FILE_TYPES = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
const FOLDER_EXTS = { projects: ['webp', 'png', 'jpg', 'jpeg', 'gif'], resumes: ['pdf', 'doc', 'docx'] }
const ACCESS_HOURS = 12
const REFRESH_DAYS = 14

const env = (k) => (process.env[k] ?? '').trim()
const storageReady = () => !!env('BLOB_READ_WRITE_TOKEN')

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/* ---- responses ----------------------------------------------------------- */

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

function withCors(request, response) {
  const allowed = env('ALLOWED_ORIGINS').split(',').map((s) => s.trim()).filter(Boolean)
  const origin = request.headers.get('origin')
  if (!origin || !allowed.includes(origin)) return response
  const headers = new Headers(response.headers)
  headers.set('access-control-allow-origin', origin)
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('access-control-allow-headers', 'authorization, content-type')
  headers.set('access-control-max-age', '86400')
  headers.append('vary', 'Origin')
  return new Response(response.body, { status: response.status, headers })
}

/* ---- Vercel Blob --------------------------------------------------------- */

// A Blob store is either public or private, and every call must say which.
// Start with public and switch once if the store says otherwise.
let access = env('BLOB_ACCESS') === 'private' ? 'private' : 'public'
const isAccessError = (err) => /\b(private|public)\b/i.test(err?.message ?? '') && /access|store/i.test(err?.message ?? '')

async function blob(fn) {
  if (!storageReady()) throw new HttpError(503, 'Storage is not configured: connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN).')
  try {
    return await fn(access)
  } catch (err) {
    if (isAccessError(err)) {
      access = access === 'public' ? 'private' : 'public'
      try {
        return await fn(access)
      } catch (again) {
        err = again
      }
    }
    if (err instanceof HttpError) throw err
    console.error(err)
    throw new HttpError(502, `Storage error: ${err?.message ?? 'unknown'}`)
  }
}

async function readContent() {
  const res = await blob((a) => get(CONTENT, { access: a, useCache: false }))
  if (!res || res.statusCode !== 200) return { content: null, updatedAt: null }
  const text = await new Response(res.stream).text()
  return { content: JSON.parse(text), updatedAt: res.blob.uploadedAt }
}

const fileUrl = (path) => `/api/files/${path}`
const displayName = (stored) => stored.replace(/^[a-z0-9]+__/, '')

function safePath(path) {
  if (typeof path !== 'string' || path.includes('..') || path.includes('\\')) return false
  const [folder, name, ...rest] = path.split('/')
  return FOLDERS.has(folder) && !!name && !rest.length
}

async function listFiles(folder) {
  const blobs = []
  let cursor
  do {
    const page = await blob(() => list({ prefix: `${folder}/`, cursor, limit: 1000 }))
    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return blobs
    .filter((b) => safePath(b.pathname) && !b.pathname.split('/')[1].startsWith('.'))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .map((b) => {
      const name = b.pathname.split('/')[1]
      const ext = name.split('.').pop().toLowerCase()
      return { path: b.pathname, name: displayName(name), size: b.size, type: FILE_TYPES[ext] ?? '', created: b.uploadedAt, url: fileUrl(b.pathname) }
    })
}

async function uploadFile(request, params) {
  const folder = params.get('folder')
  const ext = (params.get('ext') ?? '').toLowerCase()
  if (!FOLDERS.has(folder) || !FOLDER_EXTS[folder].includes(ext)) throw new HttpError(400, 'Unsupported file type.')
  const body = Buffer.from(await request.arrayBuffer())
  if (!body.byteLength) throw new HttpError(400, 'The file is empty.')
  if (body.byteLength > MAX_UPLOAD) throw new HttpError(413, 'File is larger than 4 MB.')
  const base =
    (params.get('name') ?? '')
      .replace(/\.[^.]+$/, '')
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 60) || 'file'
  const stamp = Date.now().toString(36)
  // Images: "<name>-<stamp>.webp"; resumes: "<stamp>__<name>.pdf" (readable name kept).
  const stored = folder === 'resumes' ? `${stamp}__${base}.${ext}` : `${base.toLowerCase()}-${stamp}.${ext}`
  const path = `${folder}/${stored}`
  await blob((a) => put(path, body, { access: a, contentType: FILE_TYPES[ext], addRandomSuffix: false }))
  return { path, name: displayName(stored), size: body.byteLength, type: FILE_TYPES[ext], created: new Date().toISOString(), url: fileUrl(path) }
}

async function serveFile(path) {
  if (!safePath(path)) throw new HttpError(404, 'Not found')
  const res = await blob((a) => get(path, { access: a }))
  if (!res || res.statusCode !== 200) throw new HttpError(404, 'Not found')
  const resume = path.startsWith('resumes/')
  const name = displayName(path.split('/')[1])
  // Image names never change (a new upload gets a new name), so they cache for
  // a year; resumes are short-lived so a deleted one disappears quickly.
  const cache = resume ? 'public, max-age=60' : 'public, max-age=31536000, immutable'
  return new Response(res.stream, {
    headers: {
      'content-type': res.blob.contentType || 'application/octet-stream',
      'cache-control': cache,
      'cdn-cache-control': resume ? 'public, s-maxage=60' : 'public, s-maxage=31536000, immutable',
      ...(resume ? { 'content-disposition': `inline; filename="${name.replace(/[^\w.-]/g, '_')}"` } : {}),
      'x-content-type-options': 'nosniff',
    },
  })
}

/* ---- admin sessions ------------------------------------------------------- */

function secret() {
  return env('SESSION_SECRET') || createHash('sha256').update(`portfolio-admin|${env('ADMIN_PASSWORD')}|${env('BLOB_READ_WRITE_TOKEN')}`).digest('hex')
}
const b64 = (s) => Buffer.from(s).toString('base64url')
const sign = (data) => createHmac('sha256', secret()).update(data).digest('base64url')

function makeToken(type, seconds) {
  const data = b64(JSON.stringify({ t: type, exp: Date.now() + seconds * 1000 }))
  return `${data}.${sign(data)}`
}

function verifyToken(token, type) {
  const [data, sig] = String(token ?? '').split('.')
  if (!data || !sig) return false
  const expected = Buffer.from(sign(data))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString())
    return p.t === type && p.exp > Date.now()
  } catch {
    return false
  }
}

const session = () => ({
  access: makeToken('access', ACCESS_HOURS * 3600),
  refresh: makeToken('refresh', REFRESH_DAYS * 86400),
  expires: Date.now() + ACCESS_HOURS * 3600 * 1000,
  email: 'Admin',
})

function passwordMatches(given) {
  const a = createHash('sha256').update(String(given ?? '')).digest()
  const b = createHash('sha256').update(env('ADMIN_PASSWORD')).digest()
  return timingSafeEqual(a, b)
}

function requireAdmin(request) {
  if (!env('ADMIN_PASSWORD')) throw new HttpError(503, 'Admin sign-in is not configured: set ADMIN_PASSWORD.')
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')
  if (!m) throw new HttpError(401, 'Sign in first.')
  if (!verifyToken(m[1], 'access')) throw new HttpError(401, 'Session expired. Sign in again.')
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'Expected a JSON body.')
  }
}

/* ---- routes -------------------------------------------------------------- */

async function route(request, path, params) {
  const method = request.method
  if ((method === 'GET' || method === 'HEAD') && path.startsWith('files/')) return serveFile(path.slice(6))
  const key = `${method} ${path}`

  switch (key) {
    case 'GET health':
      return json({ ok: true, storage: storageReady(), adminPassword: !!env('ADMIN_PASSWORD') })

    case 'GET content': {
      const data = await readContent()
      // Cached on Vercel's CDN for a few seconds; browsers always revalidate.
      return json(data, 200, {
        'cache-control': 'public, max-age=0, must-revalidate',
        'cdn-cache-control': 'public, s-maxage=5, stale-while-revalidate=30',
      })
    }

    case 'POST auth/login': {
      if (!env('ADMIN_PASSWORD')) throw new HttpError(503, 'Admin sign-in is not configured: set ADMIN_PASSWORD.')
      const { password } = await readJson(request)
      if (!passwordMatches(password)) {
        await new Promise((r) => setTimeout(r, 600)) // slows down password guessing
        throw new HttpError(401, 'Wrong password')
      }
      return json(session())
    }

    case 'POST auth/refresh': {
      const { refresh } = await readJson(request)
      if (!verifyToken(refresh, 'refresh')) throw new HttpError(401, 'Session expired. Sign in again.')
      return json(session())
    }

    case 'POST auth/logout':
      return json({ ok: true })

    case 'GET auth/me':
      requireAdmin(request)
      return json({ ok: true })

    case 'GET admin/content':
      requireAdmin(request)
      return json(await readContent())

    case 'PUT admin/content': {
      requireAdmin(request)
      const { content } = await readJson(request)
      if (!content?.profile || !Array.isArray(content.projects)) throw new HttpError(400, 'This is not portfolio content.')
      await blob((a) =>
        put(CONTENT, JSON.stringify(content), {
          access: a,
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60,
        }),
      )
      return json({ ok: true, updatedAt: new Date().toISOString() })
    }

    case 'GET admin/files': {
      requireAdmin(request)
      const folder = params.get('folder')
      if (!FOLDERS.has(folder)) throw new HttpError(400, 'Unknown folder.')
      return json({ files: await listFiles(folder) })
    }

    case 'POST admin/files':
      requireAdmin(request)
      return json(await uploadFile(request, params), 201)

    case 'DELETE admin/files': {
      requireAdmin(request)
      const { paths } = await readJson(request)
      if (!Array.isArray(paths) || !paths.length) return json({ deleted: 0 })
      if (paths.length > 100 || !paths.every(safePath)) throw new HttpError(400, 'Invalid file path.')
      await blob(() => del(paths))
      return json({ deleted: paths.length })
    }
  }
  throw new HttpError(404, 'Not found')
}

/** Handles one /api request. */
export async function handle(request) {
  if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }))
  const url = new URL(request.url)
  // On Vercel, vercel.json rewrites /api/<route> to /api/index?route=<route>.
  const path = (url.searchParams.get('route') ?? url.pathname.replace(/^\/api\/?/, '')).replace(/^\/+|\/+$/g, '')
  let response
  try {
    response = await route(request, path, url.searchParams)
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    if (status === 500) console.error(err)
    response = json({ error: status === 500 ? 'Something went wrong on the server.' : err.message }, status)
  }
  return withCors(request, response)
}
