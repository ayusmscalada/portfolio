import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (no third-party requests).
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'

import './styles/tokens.css'
import './styles/base.css'
import App from './App.jsx'
import { ContentProvider } from './content/ContentContext.jsx'
import { hashString } from './lib/hash.js'
import { fetchContent } from './lib/supabase.js'

const root = createRoot(document.getElementById('root'))

// The admin route is matched by hash, so its path never appears in the bundle
// and nothing on the public site links to it. Saving still needs a Supabase
// sign-in by an account listed in portfolio_admins.
const path = location.pathname.replace(/\/+$/, '').toLowerCase()
const isAdmin = path.length > 1 && hashString(path).toString(36) + hashString(`${path}#`).toString(36) === 'dmitrxu2qn96'

if (isAdmin) {
  const robots = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' })
  document.head.append(robots)
  import('./admin/Admin.jsx').then(({ Admin }) => {
    root.render(
      <StrictMode>
        <Admin />
      </StrictMode>,
    )
  })
} else {
  // Content comes from Supabase. index.html starts that request before this
  // bundle even downloads; wait for it (max 2.5 s, then use the bundled copy).
  const preview = window.parent !== window && new URLSearchParams(location.search).has('preview')
  const live = preview ? Promise.resolve(null) : (window.__content ?? fetchContent())
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500, null))
  Promise.race([live, timeout]).then((initial) => renderSite(initial))
}

function renderSite(initial) {
  root.render(
    <StrictMode>
      <ContentProvider initial={initial}>
        <App />
      </ContentProvider>
    </StrictMode>,
  )
}
