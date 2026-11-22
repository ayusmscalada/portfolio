/**
 * Portfolio backend: one request handler (Web Request → Response) used by the
 * Vercel function in api/index.js and, in development, by the Vite dev server
 * (vite.config.js), so `npm run dev` still runs everything on one port.
 *
 * Data lives in Supabase (supabase/setup.sql): the content row and the public
 * `portfolio` storage bucket. Only this backend talks to Supabase; the browser
 * talks to /api. Writes are made with the signed-in admin's own token, so
 * Supabase's row-level security still has the final say.
 *
 * Environment (server only, never sent to the browser):
 *   SUPABASE_URL        https://<ref>.supabase.co  (a /rest/v1 suffix is fine)
 *   SUPABASE_ANON_KEY   the publishable (sb_publishable_…) or legacy anon key
 *   ALLOWED_ORIGINS     optional, comma-separated: only needed when the site is
 *                       served from a different domain than this backend
 *
 * Routes:
 *   GET    /api/content                public site content (cached a few seconds)
 *   GET    /api/health                 is the backend configured?
 *   POST   /api/auth/login             { email, password } → session
 *   POST   /api/auth/refresh           { refresh } → session
 *   POST   /api/auth/logout
 *   GET    /api/auth/me                admin check
 *   GET    /api/admin/content          stored content for the editor (or null)
 *   PUT    /api/admin/content          { content } → save
 *   GET    /api/admin/files?folder=    list projects/ or resumes/
 *   POST   /api/admin/files?folder=&name=&ext=   raw body → upload (≤ 4 MB)
 *   DELETE /api/admin/files            { paths: [...] } → delete
 */

const BUCKET = 'portfolio'
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

function config() {
  const url = (process.env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
  const key = (process.env.SUPABASE_ANON_KEY ?? '').trim()
  return { url, key, ready: /^https:\/\//.test(url) && !!key }
}

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
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
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

/* ---- Supabase ------------------------------------------------------------ */

async function supabase(path, { token, headers, ...init } = {}) {
  const { url, key } = config()
  let res
  try {
    res = await fetch(`${url}${path}`, {
      ...init,
      headers: { apikey: key, ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    })
  } catch {
    throw new HttpError(502, 'The backend cannot reach Supabase.')
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const msg = data?.error_description || data?.msg || data?.message || data?.error || `Supabase request failed (${res.status})`
    if (res.status === 403 || /row-level security/i.test(msg)) throw new HttpError(403, 'This account is not allowed to edit the portfolio.')
    throw new HttpError(res.status === 400 || res.status === 401 ? res.status : 502, msg)
  }
  return data
}

const publicUrl = (path) => `${config().url}/storage/v1/object/public/${BUCKET}/${path}`

const session = (data) => ({
  access: data.access_token,
  refresh: data.refresh_token,
  expires: Date.now() + data.expires_in * 1000,
  email: data.user?.email ?? '',
})

function bearer(request) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')
  if (!m) throw new HttpError(401, 'Sign in first.')
  return m[1]
}

/** The caller's token, after checking it belongs to an account in portfolio_admins. */
async function requireAdmin(request) {
  const token = bearer(request)
  let rows
  try {
    rows = await supabase('/rest/v1/portfolio_admins?select=user_id', { token })
  } catch (err) {
    throw err.status === 401 ? new HttpError(401, 'Session expired. Sign in again.') : err
  }
  if (!rows?.length) throw new HttpError(403, 'This account is not listed in portfolio_admins (see supabase/setup.sql).')
  return token
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'Expected a JSON body.')
  }
}

/* ---- files --------------------------------------------------------------- */

const displayName = (stored) => stored.replace(/^[a-z0-9]+__/, '')

function safePath(path) {
  if (typeof path !== 'string' || path.includes('..') || path.includes('\\')) return false
  const [folder, name, ...rest] = path.split('/')
  return FOLDERS.has(folder) && !!name && !rest.length
}

async function listFiles(token, folder) {
  const rows = await supabase(`/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    token,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prefix: folder, limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
  })
  return (rows ?? [])
    .filter((f) => f.id && !f.name.startsWith('.'))
    .map((f) => {
      const path = `${folder}/${f.name}`
      return { path, name: displayName(f.name), size: f.metadata?.size ?? 0, type: f.metadata?.mimetype ?? '', created: f.created_at, url: publicUrl(path) }
    })
}

async function uploadFile(request, token, params) {
  const folder = params.get('folder')
  const ext = (params.get('ext') ?? '').toLowerCase()
  if (!FOLDERS.has(folder) || !FOLDER_EXTS[folder].includes(ext)) throw new HttpError(400, 'Unsupported file type.')
  const body = await request.arrayBuffer()
  if (!body.byteLength) throw new HttpError(400, 'The file is empty.')
  if (body.byteLength > MAX_UPLOAD) throw new HttpError(413, 'File is larger than 4 MB.')
  const base =
    (params.get('name') ?? '')
      .replace(/\.[^.]+$/, '')
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .slice(0, 60) || 'file'
  const stamp = Date.now().toString(36)
  // Images: "<name>-<stamp>.webp"; résumés: "<stamp>__<name>.pdf" (readable name kept).
  const stored = folder === 'resumes' ? `${stamp}__${base}.${ext}` : `${base.toLowerCase()}-${stamp}.${ext}`
  const path = `${folder}/${stored}`
  await supabase(`/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    token,
    headers: { 'content-type': FILE_TYPES[ext], 'cache-control': folder === 'resumes' ? 'max-age=60' : 'max-age=31536000' },
    body,
  })
  return { path, name: displayName(stored), size: body.byteLength, type: FILE_TYPES[ext], created: new Date().toISOString(), url: publicUrl(path) }
}

async function deleteFiles(token, paths) {
  if (!Array.isArray(paths) || !paths.length) return { deleted: 0 }
  if (paths.length > 100 || !paths.every(safePath)) throw new HttpError(400, 'Invalid file path.')
  const gone = await supabase(`/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    token,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }),
  })
  if ((gone?.length ?? 0) < paths.length) throw new HttpError(502, 'Supabase did not delete the file (check the storage policies in supabase/setup.sql).')
  return { deleted: gone.length }
}

/* ---- routes -------------------------------------------------------------- */

async function route(request, path, params) {
  const method = request.method
  const key = `${method} ${path}`

  if (key === 'GET health') return json({ ok: true, configured: config().ready })
  if (!config().ready) throw new HttpError(503, 'The backend is not configured: set SUPABASE_URL and SUPABASE_ANON_KEY in its environment variables.')

  switch (key) {
    case 'GET content': {
      const rows = await supabase('/rest/v1/portfolio_content?id=eq.1&select=content,updated_at')
      // Cached on Vercel's CDN for a few seconds; browsers always revalidate.
      return json({ content: rows?.[0]?.content ?? null, updatedAt: rows?.[0]?.updated_at ?? null }, 200, {
        'cache-control': 'public, max-age=0, must-revalidate',
        'cdn-cache-control': 'public, s-maxage=5, stale-while-revalidate=30',
      })
    }

    case 'POST auth/login': {
      const { email, password } = await readJson(request)
      if (!email || !password) throw new HttpError(400, 'Enter your email and password.')
      let data
      try {
        data = await supabase('/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
      } catch (err) {
        throw err.status === 400 ? new HttpError(401, 'Wrong email or password') : err
      }
      const s = session(data)
      await requireAdmin(new Request('http://x', { headers: { authorization: `Bearer ${s.access}` } }))
      return json(s)
    }

    case 'POST auth/refresh': {
      const { refresh } = await readJson(request)
      if (!refresh) throw new HttpError(401, 'Session expired. Sign in again.')
      try {
        const data = await supabase('/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refresh_token: refresh }),
        })
        return json(session(data))
      } catch {
        throw new HttpError(401, 'Session expired. Sign in again.')
      }
    }

    case 'POST auth/logout': {
      try {
        await supabase('/auth/v1/logout', { method: 'POST', token: bearer(request) })
      } catch {
        /* already signed out */
      }
      return json({ ok: true })
    }

    case 'GET auth/me': {
      await requireAdmin(request)
      return json({ ok: true })
    }

    case 'GET admin/content': {
      const token = await requireAdmin(request)
      const rows = await supabase('/rest/v1/portfolio_content?id=eq.1&select=content,updated_at', { token })
      return json({ content: rows?.[0]?.content ?? null, updatedAt: rows?.[0]?.updated_at ?? null })
    }

    case 'PUT admin/content': {
      const token = await requireAdmin(request)
      const { content } = await readJson(request)
      if (!content?.profile || !Array.isArray(content.projects)) throw new HttpError(400, 'This is not portfolio content.')
      const updatedAt = new Date().toISOString()
      await supabase('/rest/v1/portfolio_content?on_conflict=id', {
        method: 'POST',
        token,
        headers: { 'content-type': 'application/json', prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ id: 1, content, updated_at: updatedAt }),
      })
      return json({ ok: true, updatedAt })
    }

    case 'GET admin/files': {
      const token = await requireAdmin(request)
      const folder = params.get('folder')
      if (!FOLDERS.has(folder)) throw new HttpError(400, 'Unknown folder.')
      return json({ files: await listFiles(token, folder) })
    }

    case 'POST admin/files': {
      const token = await requireAdmin(request)
      return json(await uploadFile(request, token, params), 201)
    }

    case 'DELETE admin/files': {
      const token = await requireAdmin(request)
      const { paths } = await readJson(request)
      return json(await deleteFiles(token, paths))
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
