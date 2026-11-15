import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (no third-party requests).
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'

import './styles/tokens.css'
import './styles/base.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
