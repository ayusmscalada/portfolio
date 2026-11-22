import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const readContent = () => JSON.parse(readFileSync(new URL('./src/data/content.json', import.meta.url), 'utf8'))

/**
 * Keeps <title>, meta tags and the favicon monogram in index.html in sync with
 * src/data/content.json, so your name and role live in exactly one place.
 */
function profileMeta() {
  const { profile } = readContent()
  const name = `${profile.firstName} ${profile.lastName}`
  const monogram = (profile.monogram || `${profile.firstName[0]}${profile.lastName[0]}`).slice(0, 2).toUpperCase()
  const favicon = readFileSync(new URL('./public/favicon.svg', import.meta.url), 'utf8')
    .replace(/>Y<\/text>/, `>${monogram.replace(/[<&>]/g, '')}</text>`)
    .replace(/font-size="22"/, `font-size="${monogram.length > 1 ? 16 : 22}"`)
  const values = {
    title: `${name} - ${profile.role}`,
    description: `${name} is a ${profile.role.toLowerCase()} based in ${profile.location}. ${profile.tagline.replace(/\*/g, '')}`,
    name,
    favicon: `data:image/svg+xml,${encodeURIComponent(favicon.trim())}`,
  }
  return {
    name: 'profile-meta',
    transformIndexHtml: (html) => html.replace(/%PROFILE_(\w+)%/g, (_, key) => values[key.toLowerCase()] ?? ''),
  }
}

/**
 * Motion is controlled by the site, not only by the OS: <html data-motion="full|reduced">
 * (default full, toggled in the nav, remembered per visitor). This PostCSS step
 * rewrites every `@media (prefers-reduced-motion: …)` block in the codebase into
 * an equivalent [data-motion] selector, so all CSS follows that single switch.
 */
const REDUCED = "[data-motion='reduced']"
function scopeSelector(sel, reduced) {
  const attr = reduced ? REDUCED : `:not(${REDUCED})`
  return sel
    .split(',')
    .map((s) => {
      s = s.trim()
      if (/^html\b/.test(s)) return s.replace(/^html/, `html${attr}`)
      if (/^:root\b/.test(s)) return s.replace(/^:root/, `:root${attr}`)
      return `:root${attr} ${s}`
    })
    .join(', ')
}
const motionAttr = {
  postcssPlugin: 'motion-attr',
  AtRule: {
    media(at) {
      const m = at.params.match(/^\(prefers-reduced-motion:\s*(reduce|no-preference)\)$/)
      if (!m) return
      const reduced = m[1] === 'reduce'
      at.walkRules((rule) => {
        if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return
        rule.selector = scopeSelector(rule.selector, reduced)
      })
      at.replaceWith(at.nodes)
    },
  },
}

/**
 * The backend (server/app.js) runs as Vercel functions under /api in
 * production. Here the same handler is mounted on the Vite server, so
 * `npm run dev` (and `npm run preview`) serve the site and the API on one port.
 * Its Supabase settings are read from .env.local and stay on the server:
 * nothing from the environment is put into the browser bundle except API_URL.
 */
function backend(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  for (const k of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'ALLOWED_ORIGINS']) if (env[k] && !process.env[k]) process.env[k] = env[k]

  const mount = (server, load) =>
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next()
      try {
        const { handle } = await load()
        const chunks = []
        for await (const c of req) chunks.push(c)
        const body = chunks.length ? Buffer.concat(chunks) : undefined
        const headers = new Headers()
        for (const [k, val] of Object.entries(req.headers)) if (typeof val === 'string') headers.set(k, val)
        const response = await handle(
          new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body: /^(GET|HEAD)$/.test(req.method) ? undefined : body }),
        )
        res.statusCode = response.status
        response.headers.forEach((val, k) => res.setHeader(k, val))
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch (err) {
        next(err)
      }
    })

  return {
    name: 'portfolio-backend',
    configureServer: (server) => {
      mount(server, () => server.ssrLoadModule('/server/app.js'))
    },
    configurePreviewServer: (server) => {
      mount(server, () => import('./server/app.js'))
    },
  }
}

export default defineConfig(({ mode }) => {
  const apiUrl = (loadEnv(mode, process.cwd(), '').API_URL ?? '').trim().replace(/\/+$/, '')
  return {
  plugins: [
    react(),
    profileMeta(),
    backend(mode),
    { name: 'api-url', transformIndexHtml: (html) => html.replaceAll('%API_URL%', apiUrl) },
  ],
  // Optional: only when the backend is deployed separately from the site.
  define: { 'import.meta.env.API_URL': JSON.stringify(apiUrl) },
  css: { postcss: { plugins: [motionAttr] } },
  // Bind to IPv4 loopback explicitly. "localhost" can resolve to IPv6 (::1),
  // which is unreachable on some Windows setups (VPN/proxy software).
  // Fixed ports: a second `npm run dev` fails ("port in use") instead of
  // silently opening another server on 5174, 5175, …
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  resolve: {
    // Root-relative on purpose: an absolute path here can differ in drive-letter
    // case on Windows (c:\ vs C:\), which makes the bundler load React twice.
    alias: [{ find: /^@\//, replacement: '/src/' }],
  },
  }
})
