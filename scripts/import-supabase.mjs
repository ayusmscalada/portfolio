/**
 * One-time move from Supabase to Vercel Blob:
 *   npm run import:supabase            (add --force to replace content already in Blob)
 *
 * Needs in .env.local: BLOB_READ_WRITE_TOKEN (Vercel → Storage → your Blob store
 * → .env.local tab), SUPABASE_URL and SUPABASE_ANON_KEY.
 * Copies the saved content plus every Supabase file it links to (project
 * images, the resume) into Blob, and points the links at /api/files/….
 */
import { get, put } from '@vercel/blob'

const need = (k) => {
  const v = (process.env[k] ?? '').trim()
  if (!v) {
    console.error(`Missing ${k} in .env.local`)
    process.exit(1)
  }
  return v
}
need('BLOB_READ_WRITE_TOKEN')
const base = need('SUPABASE_URL').replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
const key = need('SUPABASE_ANON_KEY')
const force = process.argv.includes('--force')

let access = (process.env.BLOB_ACCESS ?? '').trim() === 'private' ? 'private' : 'public'
async function blob(fn) {
  try {
    return await fn(access)
  } catch (err) {
    if (!/\b(private|public)\b/i.test(err?.message ?? '')) throw err
    access = access === 'public' ? 'private' : 'public'
    return fn(access)
  }
}

const existing = await blob((a) => get('content.json', { access: a, useCache: false }))
if (existing?.statusCode === 200 && !force) {
  console.log('Blob already has content.json; nothing changed. Run with --force to replace it.')
  process.exit(0)
}

const res = await fetch(`${base}/rest/v1/portfolio_content?id=eq.1&select=content`, { headers: { apikey: key } })
if (!res.ok) throw new Error(`Supabase answered ${res.status}: ${await res.text()}`)
const content = (await res.json())?.[0]?.content
if (!content?.profile) throw new Error('Supabase has no saved content to import.')

const pattern = /\/storage\/v1\/object\/public\/portfolio\/((?:projects|resumes)\/[^?#/]+)$/
const copied = new Map()
const types = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }

async function copy(url, path) {
  if (copied.has(url)) return copied.get(url)
  const file = await fetch(url)
  if (!file.ok) {
    console.warn(`  skipped (HTTP ${file.status}): ${path}`)
    copied.set(url, url)
    return url
  }
  const body = Buffer.from(await file.arrayBuffer())
  const ext = path.split('.').pop().toLowerCase()
  await blob((a) => put(path, body, { access: a, contentType: types[ext] ?? file.headers.get('content-type') ?? undefined, addRandomSuffix: false, allowOverwrite: true }))
  console.log(`  copied ${path} (${Math.round(body.length / 1024)} KB)`)
  copied.set(url, `/api/files/${path}`)
  return `/api/files/${path}`
}

async function walk(v) {
  if (typeof v === 'string') {
    const m = v.startsWith(base) && pattern.exec(v)
    return m ? copy(v, decodeURIComponent(m[1])) : v
  }
  if (Array.isArray(v)) return Promise.all(v.map(walk))
  if (v && typeof v === 'object') return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await walk(x)])))
  return v
}

console.log('Copying files…')
const next = await walk(content)
await blob((a) => put('content.json', JSON.stringify(next), { access: a, contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 }))
console.log(`Done: content.json and ${[...copied.values()].filter((u) => u.startsWith('/api/')).length} file(s) are in Vercel Blob (${access} store).`)
