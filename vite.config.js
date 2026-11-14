import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { profile } from './src/data/profile.js'

/**
 * Keeps <title> and meta tags in index.html in sync with src/data/profile.js,
 * so your name and role live in exactly one place.
 */
function profileMeta() {
  const name = `${profile.firstName} ${profile.lastName}`
  const values = {
    title: `${name} — ${profile.role}`,
    description: `${name} is a ${profile.role.toLowerCase()} based in ${profile.location}. ${profile.tagline.replace(/\*/g, '')}`,
    name,
  }
  return {
    name: 'profile-meta',
    transformIndexHtml: (html) => html.replace(/%PROFILE_(\w+)%/g, (_, key) => values[key.toLowerCase()] ?? ''),
  }
}

export default defineConfig({
  plugins: [react(), profileMeta()],
  // Bind to IPv4 loopback explicitly. "localhost" can resolve to IPv6 (::1),
  // which is unreachable on some Windows setups (VPN/proxy software).
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  resolve: {
    // Root-relative on purpose: an absolute path here can differ in drive-letter
    // case on Windows (c:\ vs C:\), which makes the bundler load React twice.
    alias: [{ find: /^@\//, replacement: '/src/' }],
  },
})
