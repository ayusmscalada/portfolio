import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
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
    title: `${name} — ${profile.role}`,
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

export default defineConfig({
  plugins: [react(), profileMeta()],
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
})
