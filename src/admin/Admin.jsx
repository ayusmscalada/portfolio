import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import bundled from '@/data/content.json'
import { CONTENT_CHANNEL, DRAFT_MESSAGE } from '@/content/ContentContext.jsx'
import { SB_READY, checkAdmin, hasSession, loadContent, saveContent, sessionEmail, signIn, signOut } from './api.js'
import { EditorContext, Icon, setIn, useEditor } from './fields.jsx'
import { AboutForm, ContactForm, ExperienceForm, HeroForm, ProfileForm, ProjectsForm, SkillsForm } from './forms.jsx'
import s from './Admin.module.css'

const TABS = [
  { id: 'profile', label: 'Profile', section: 'top', Form: ProfileForm },
  { id: 'hero', label: 'Hero', section: 'top', Form: HeroForm },
  { id: 'about', label: 'About', section: 'about', Form: AboutForm },
  { id: 'skills', label: 'Skills', section: 'capabilities', Form: SkillsForm },
  { id: 'projects', label: 'Projects', section: 'projects', Form: ProjectsForm },
  { id: 'experience', label: 'Experience', section: 'experience', Form: ExperienceForm },
  { id: 'contact', label: 'Contact & links', section: 'contact', Form: ContactForm },
  { id: 'data', label: 'Backup', section: null, Form: DataForm },
]

/* ---- login ------------------------------------------------------------- */

function Login({ onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onDone(await signIn(email.trim(), password))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className={s.loginPage}>
      <form className={s.login} onSubmit={submit}>
        <span className={s.loginIcon}>{Icon.lock}</span>
        <h1>Admin</h1>
        <p>Sign in with your Supabase admin account.</p>
        <input className={s.input} type="email" autoFocus autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={s.input} type="password" required autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className={s.error} role="alert">{error}</p>}
        <button className={s.primary} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

function NotConfigured() {
  return (
    <main className={s.loginPage}>
      <div className={s.login}>
        <span className={s.loginIcon}>{Icon.lock}</span>
        <h1>Connect Supabase</h1>
        <p>
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> (and to your host's environment variables), run{' '}
          <code>supabase/setup.sql</code> in the Supabase SQL editor, then restart the dev server.
        </p>
      </div>
    </main>
  )
}

/* ---- live preview ------------------------------------------------------ */

const DEVICES = { desktop: 1366, mobile: 390 }

function Preview({ draft, section, device, setDevice }) {
  const frameRef = useRef(null)
  const paneRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [box, setBox] = useState({ w: 800, h: 600 })
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin === location.origin && e.data?.type === 'portfolio:ready' && e.source === frameRef.current?.contentWindow) {
        // (Re)loaded frame: hand it the current draft straight away.
        e.source.postMessage({ type: DRAFT_MESSAGE, content: draftRef.current }, location.origin)
        setReady(true)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    const el = paneRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Every edit reaches the frame on the next frame: typing updates the site live.
  useEffect(() => {
    if (!ready) return
    const id = requestAnimationFrame(() => frameRef.current?.contentWindow?.postMessage({ type: DRAFT_MESSAGE, content: draft }, location.origin))
    return () => cancelAnimationFrame(id)
  }, [draft, ready])

  useEffect(() => {
    if (!ready || !section) return
    const win = frameRef.current?.contentWindow
    const el = win?.document.getElementById(section)
    if (el) win.scrollTo({ top: section === 'top' ? 0 : el.getBoundingClientRect().top + win.scrollY - 70, behavior: 'smooth' })
  }, [section, ready])

  const width = DEVICES[device]
  const scale = Math.min(1, (box.w - 32) / width)
  const height = device === 'mobile' ? Math.min(844, (box.h - 32) / scale) : (box.h - 32) / scale

  return (
    <div className={s.preview}>
      <div className={s.previewBar}>
        <span className={s.previewTitle}>{Icon.eye} Live preview</span>
        <div className={s.seg} role="group" aria-label="Preview size">
          {Object.keys(DEVICES).map((d) => (
            <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} title={d}>
              {Icon[d]}
            </button>
          ))}
        </div>
      </div>
      <div className={s.stage} ref={paneRef}>
        <div className={s.frameWrap} style={{ width: width * scale, height: height * scale }} data-device={device}>
          <iframe
            ref={frameRef}
            title="Site preview"
            src="/?preview=1"
            style={{ width, height, transform: `scale(${scale})` }}
          />
          {!ready && <div className={s.frameLoading}>Loading preview…</div>}
        </div>
      </div>
    </div>
  )
}

/* ---- backup tab -------------------------------------------------------- */

function DataForm() {
  const { draft, replace, notify } = useEditor()
  const fileRef = useRef(null)
  const download = () => {
    const blob = new Blob([`${JSON.stringify(draft, null, 2)}\n`], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `portfolio-content-${new Date().toISOString().slice(0, 10)}.json` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const onFile = async (file) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!data?.profile || !Array.isArray(data.projects)) throw new Error('This file is not a portfolio content backup')
      replace(data)
      notify('Backup loaded. Review it, then save to publish.')
    } catch (err) {
      notify(err.message, 'error')
    }
    fileRef.current.value = ''
  }
  return (
    <section className={s.group}>
      <header>
        <h2>Backup & restore</h2>
        <p>Download everything as one JSON file, or load a backup. Loading only changes the draft until you save.</p>
      </header>
      <div className={s.inline}>
        <button type="button" className={s.btn} onClick={download}>
          Download backup
        </button>
        <button type="button" className={s.btn} onClick={() => fileRef.current?.click()}>
          Load backup…
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
    </section>
  )
}

/* ---- admin ------------------------------------------------------------- */

export function Admin() {
  const [auth, setAuth] = useState(null)
  const [checking, setChecking] = useState(SB_READY && hasSession())
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [tab, setTab] = useState('profile')
  const [device, setDevice] = useState('desktop')
  const [status, setStatus] = useState('idle')
  const [toast, setToast] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [notice, setNotice] = useState('')
  const toastTimer = useRef(0)

  const notify = useCallback((message, kind = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ message, kind, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), kind === 'error' ? 6000 : 3500)
  }, [])

  useEffect(() => {
    document.title = 'Admin · Portfolio'
  }, [])

  // Resume a session from this tab.
  useEffect(() => {
    if (!checking) return
    checkAdmin()
      .then(() => setAuth(sessionEmail()))
      .catch(() => signOut())
      .finally(() => setChecking(false))
  }, [checking])

  // Load the latest content once unlocked.
  useEffect(() => {
    if (!auth) return
    loadContent()
      .then((c) => {
        if (c) {
          setSaved(c)
          setDraft(c)
        } else {
          // First run: nothing in Supabase yet. Start from the bundled content.
          setNotice('Supabase has no portfolio content yet. This is the starter content: edit it, then save to publish.')
          setSaved(null)
          setDraft(bundled)
        }
      })
      .catch((err) => {
        setNotice(`Could not load content from Supabase: ${err.message}`)
        setSaved(null)
        setDraft(bundled)
      })
  }, [auth])

  const dirty = useMemo(() => !!draft && (!saved || JSON.stringify(draft) !== JSON.stringify(saved)), [draft, saved])

  const set = useCallback((path, value) => setDraft((d) => setIn(d, path, value)), [])
  const replace = useCallback((next) => setDraft(next), [])

  const save = useCallback(async () => {
    if (!draft || status === 'saving') return
    setStatus('saving')
    try {
      await saveContent(draft)
      setSaved(draft)
      setNotice('')
      setStatus('idle')
      try {
        const bc = new BroadcastChannel(CONTENT_CHANNEL)
        bc.postMessage(draft)
        bc.close()
      } catch {
        /* ignore */
      }
      notify('Saved to Supabase. The live site shows it on the next page load.')
    } catch (err) {
      setStatus('idle')
      if (err.status === 401) {
        signOut()
        setAuth(null)
      }
      notify(err.message, 'error')
    }
  }, [draft, status, notify])

  // Ctrl/⌘ + S saves; warn before leaving with unsaved edits.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty) save()
      }
    }
    const onUnload = (e) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [dirty, save])

  const ctx = useMemo(() => ({ draft, set, replace, notify }), [draft, set, replace, notify])

  if (!SB_READY) return <NotConfigured />
  if (checking) return <main className={s.loginPage} aria-busy="true" />
  if (!auth) return <Login onDone={setAuth} />
  if (!draft) return <main className={s.loginPage}>Loading content…</main>

  const current = TABS.find((t) => t.id === tab)
  const Form = current.Form

  return (
    <EditorContext.Provider value={ctx}>
      <div className={s.app} data-preview={showPreview}>
        <header className={s.top}>
          <div className={s.brand}>
            <span className={s.logo}>{(draft.profile.monogram || `${draft.profile.firstName?.[0] ?? ''}${draft.profile.lastName?.[0] ?? ''}`).slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>Portfolio admin</strong>
              <span>Supabase · {auth}</span>
            </div>
          </div>
          <div className={s.actions}>
            <span className={s.state} data-state={status === 'saving' ? 'saving' : dirty ? 'dirty' : 'clean'}>
              {status === 'saving' ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
            <button type="button" className={`${s.btnGhost} ${s.previewToggle}`} onClick={() => setShowPreview((v) => !v)} aria-pressed={showPreview}>
              {Icon.eye} Preview
            </button>
            <a className={s.btnGhost} href="/" target="_blank" rel="noopener">
              {Icon.external} <span className={s.hideSm}>View site</span>
            </a>
            <button type="button" className={s.btnGhost} disabled={!dirty || !saved} onClick={() => setDraft(saved)}>
              Discard
            </button>
            <button type="button" className={s.primary} disabled={!dirty || status === 'saving'} onClick={save} title="Ctrl/⌘ + S">
              Save changes
            </button>
            <button
              type="button"
              className={s.iconBtn}
              title="Sign out"
              aria-label="Sign out"
              onClick={() => {
                signOut()
                setAuth(null)
              }}
            >
              {Icon.lock}
            </button>
          </div>
        </header>

        {notice && (
          <div className={s.banner} role="status">
            <p>{notice}</p>
          </div>
        )}

        <nav className={s.nav} aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-current={t.id === tab ? 'page' : undefined} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        <main className={s.editor}>
          <div className={s.editorInner} key={tab}>
            <h1 className={s.pageTitle}>{current.label}</h1>
            <Form />
          </div>
        </main>

        <aside className={s.previewPane} aria-label="Live preview">
          <Preview draft={draft} section={current.section} device={device} setDevice={setDevice} />
        </aside>

        {toast && (
          <div key={toast.id} className={s.toast} data-kind={toast.kind} role="status">
            {toast.message}
          </div>
        )}
      </div>
    </EditorContext.Provider>
  )
}
