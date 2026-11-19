import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { deleteFiles, listFiles, uploadImage, uploadResume } from './api.js'
import s from './Admin.module.css'

/* ---- editor state ------------------------------------------------------ */

export const EditorContext = createContext(null)
export const useEditor = () => useContext(EditorContext)

export const getIn = (obj, path) => path.reduce((o, k) => o?.[k], obj)
export function setIn(obj, [key, ...rest], value) {
  const copy = Array.isArray(obj) ? [...obj] : { ...obj }
  copy[key] = rest.length ? setIn(obj?.[key] ?? (typeof rest[0] === 'number' ? [] : {}), rest, value) : value
  return copy
}

function useField(path) {
  const { draft, set } = useEditor()
  return [getIn(draft, path), (v) => set(path, v)]
}

/* ---- icons (inline so the admin needs no icon package) ----------------- */

const svg = (d, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)
export const Icon = {
  up: svg(<path d="m18 15-6-6-6 6" />),
  down: svg(<path d="m6 9 6 6 6-6" />),
  copy: svg(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
  trash: svg(<><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></>),
  plus: svg(<path d="M12 5v14M5 12h14" />),
  x: svg(<path d="M18 6 6 18M6 6l12 12" />, 13),
  upload: svg(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>),
  external: svg(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>),
  lock: svg(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  desktop: svg(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>),
  mobile: svg(<><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>),
  eye: svg(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: svg(<><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.7 3.6M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></>),
  file: svg(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>),
}

/* ---- layout ------------------------------------------------------------ */

export function Group({ title, hint, children }) {
  return (
    <section className={s.group}>
      <header>
        <h2>{title}</h2>
        {hint && <p>{hint}</p>}
      </header>
      <div className={s.fields}>{children}</div>
    </section>
  )
}

export function Row({ children }) {
  return <div className={s.row}>{children}</div>
}

function Label({ id, label, hint, children, counter }) {
  return (
    <div className={s.field}>
      <div className={s.labelRow}>
        <label htmlFor={id}>{label}</label>
        {counter}
      </div>
      {children}
      {hint && <p className={s.hint}>{hint}</p>}
    </div>
  )
}

/* ---- inputs ------------------------------------------------------------ */

export function Text({ path, label, hint, multiline, rows = 3, placeholder, maxLength, type = 'text', list }) {
  const id = useId()
  const [value = '', setValue] = useField(path)
  const props = {
    id,
    value: value ?? '',
    placeholder,
    maxLength,
    onChange: (e) => setValue(e.target.value),
    className: s.input,
  }
  return (
    <Label id={id} label={label} hint={hint} counter={maxLength && <span className={s.count}>{String(value).length}/{maxLength}</span>}>
      {multiline ? <textarea rows={rows} {...props} /> : <input type={type} list={list} {...props} />}
    </Label>
  )
}

export function Num({ path, label, hint, min, max, step = 1, allowText }) {
  const id = useId()
  const [value, setValue] = useField(path)
  return (
    <Label id={id} label={label} hint={hint}>
      <input
        id={id}
        className={s.input}
        type={allowText ? 'text' : 'number'}
        inputMode="decimal"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const raw = e.target.value.trim()
          if (raw === '') return setValue('')
          const n = Number(raw)
          setValue(allowText && (Number.isNaN(n) || raw.endsWith('.')) ? raw : n)
        }}
      />
    </Label>
  )
}

export function Range({ path, label, hint, min = 0, max = 100 }) {
  const id = useId()
  const [value = 0, setValue] = useField(path)
  return (
    <Label id={id} label={label} hint={hint} counter={<span className={s.count}>{value}%</span>}>
      <input id={id} className={s.range} type="range" min={min} max={max} value={value ?? 0} onChange={(e) => setValue(Number(e.target.value))} style={{ '--v': `${value}%` }} />
    </Label>
  )
}

export function Toggle({ path, label, hint, invert }) {
  const id = useId()
  const [value, setValue] = useField(path)
  const on = invert ? !value : !!value
  return (
    <div className={s.field}>
      <label className={s.toggle} htmlFor={id}>
        <input id={id} type="checkbox" role="switch" checked={on} onChange={(e) => setValue(invert ? !e.target.checked : e.target.checked)} />
        <span className={s.switch} aria-hidden="true" />
        <span>{label}</span>
      </label>
      {hint && <p className={s.hint}>{hint}</p>}
    </div>
  )
}

export function Select({ path, label, hint, options }) {
  const id = useId()
  const [value, setValue] = useField(path)
  return (
    <Label id={id} label={label} hint={hint}>
      <select id={id} className={s.input} value={value ?? ''} onChange={(e) => setValue(e.target.value)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </Label>
  )
}

/** String list as removable chips. Enter or comma adds; Backspace on empty removes the last. */
export function Tags({ path, label, hint, max, placeholder = 'Type and press Enter' }) {
  const id = useId()
  const [value, setValue] = useField(path)
  const list = Array.isArray(value) ? value : []
  const [text, setText] = useState('')
  const add = (raw) => {
    const items = raw.split(',').map((t) => t.trim()).filter((t) => t && !list.includes(t))
    if (!items.length) return
    setValue([...list, ...items].slice(0, max ?? Infinity))
    setText('')
  }
  const full = max != null && list.length >= max
  return (
    <Label id={id} label={label} hint={hint} counter={max && <span className={s.count}>{list.length}/{max}</span>}>
      <div className={s.tags} onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
        {list.map((t, i) => (
          <span key={`${t}-${i}`} className={s.tag}>
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => setValue(list.filter((_, n) => n !== i))}>
              {Icon.x}
            </button>
          </span>
        ))}
        {!full && (
          <input
            id={id}
            value={text}
            placeholder={list.length ? '' : placeholder}
            onChange={(e) => (e.target.value.includes(',') ? add(e.target.value) : setText(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add(text)
              } else if (e.key === 'Backspace' && !text && list.length) {
                setValue(list.slice(0, -1))
              }
            }}
            onBlur={() => add(text)}
          />
        )}
      </div>
    </Label>
  )
}

/** String list edited as plain lines: one item per line. */
export function Lines({ path, label, hint, rows = 4 }) {
  const id = useId()
  const [value, setValue] = useField(path)
  const list = Array.isArray(value) ? value : []
  const [text, setText] = useState(list.join('\n'))
  const clean = (t) => t.split('\n').map((l) => l.trim()).filter(Boolean)
  useEffect(() => {
    if (clean(text).join('\n') !== list.join('\n')) setText(list.join('\n'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.join('\n')])
  return (
    <Label id={id} label={label} hint={hint ?? 'One item per line.'}>
      <textarea
        id={id}
        rows={rows}
        className={s.input}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setValue(clean(e.target.value))
        }}
      />
    </Label>
  )
}

/* ---- image ------------------------------------------------------------- */

export function ImageField({ path, label, hint }) {
  const id = useId()
  const [value = '', setValue] = useField(path)
  const { notify } = useEditor()
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const onFile = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      setValue(await uploadImage(file))
      notify('Image uploaded to Supabase Storage')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Label id={id} label={label} hint={hint}>
      <div className={s.image}>
        <div className={s.thumb} data-empty={!value}>
          {value ? <img src={value} alt="" /> : <span>No image: a generated cover is used</span>}
        </div>
        <div className={s.imageSide}>
          <input id={id} className={s.input} value={value} placeholder="Upload, or paste an image URL" onChange={(e) => setValue(e.target.value)} />
          <div className={s.inline}>
            <button type="button" className={s.btn} disabled={busy} onClick={() => fileRef.current?.click()}>
              {Icon.upload} {busy ? 'Uploading…' : 'Upload'}
            </button>
            {value && (
              <button type="button" className={s.btnGhost} onClick={() => setValue('')}>
                Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </div>
    </Label>
  )
}

/* ---- repeatable list --------------------------------------------------- */

let nextKey = 1
const newKey = () => nextKey++

/**
 * Collapsible, reorderable list. `children(base, index)` renders the fields
 * of one item, where `base` is the item's path.
 */
export function List({ path, label, hint, newItem, itemTitle, addLabel = 'Add item', children, defaultOpen = false, hideable = false }) {
  const [value, setValue] = useField(path)
  const items = Array.isArray(value) ? value : []
  const [keys, setKeys] = useState(() => items.map(newKey))
  const [open, setOpen] = useState(() => new Set(defaultOpen ? keys : []))
  // Keys follow items through moves; if the list is replaced from outside
  // (import, discard), resync them.
  const liveKeys = keys.length === items.length ? keys : items.map((_, i) => keys[i] ?? -(i + 1))
  useEffect(() => {
    if (keys.length !== items.length) setKeys(items.map((_, i) => keys[i] ?? newKey()))
  }, [keys, items])

  const apply = (nextItems, nextKeys) => {
    setValue(nextItems)
    setKeys(nextKeys)
  }
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const it = [...items]
    const ks = [...liveKeys]
    ;[it[i], it[j]] = [it[j], it[i]]
    ;[ks[i], ks[j]] = [ks[j], ks[i]]
    apply(it, ks)
  }
  const setHidden = (i, hidden) => setValue(items.map((it, n) => (n === i ? { ...it, hidden } : it)))
  const remove = (i) => apply(items.filter((_, n) => n !== i), liveKeys.filter((_, n) => n !== i))
  const duplicate = (i) => {
    const k = newKey()
    apply([...items.slice(0, i + 1), structuredClone(items[i]), ...items.slice(i + 1)], [...liveKeys.slice(0, i + 1), k, ...liveKeys.slice(i + 1)])
    setOpen((o) => new Set(o).add(k))
  }
  const add = () => {
    const k = newKey()
    apply([...items, typeof newItem === 'function' ? newItem(items) : structuredClone(newItem)], [...liveKeys, k])
    setOpen((o) => new Set(o).add(k))
  }
  const toggle = (k) =>
    setOpen((o) => {
      const n = new Set(o)
      n.has(k) ? n.delete(k) : n.add(k)
      return n
    })

  return (
    <div className={s.list}>
      {(label || hint) && (
        <div className={s.listHead}>
          {label && <h3>{label}</h3>}
          {hint && <p className={s.hint}>{hint}</p>}
        </div>
      )}
      {items.map((item, i) => {
        const k = liveKeys[i]
        const isOpen = open.has(k)
        const hidden = hideable && !!item?.hidden
        return (
          <div key={k} className={s.item} data-open={isOpen} data-hidden={hidden}>
            <div className={s.itemBar}>
              <button type="button" className={s.itemToggle} onClick={() => toggle(k)} aria-expanded={isOpen}>
                <span className={s.itemNo}>{String(i + 1).padStart(2, '0')}</span>
                <span className={s.itemTitle}>{(itemTitle ? itemTitle(item, i) : '') || 'Untitled'}</span>
                {hidden && <span className={s.hiddenTag}>Hidden</span>}
                <span className={s.caret}>{Icon.down}</span>
              </button>
              <div className={s.itemTools}>
                {hideable && (
                  <button
                    type="button"
                    className={hidden ? s.toolOff : s.toolOn}
                    onClick={() => setHidden(i, !hidden)}
                    aria-pressed={!hidden}
                    aria-label={hidden ? 'Hidden from visitors. Click to show' : 'Visible to visitors. Click to hide'}
                    title={hidden ? 'Hidden from visitors. Click to show' : 'Visible to visitors. Click to hide'}
                  >
                    {hidden ? Icon.eyeOff : Icon.eye}
                  </button>
                )}
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up">
                  {Icon.up}
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" title="Move down">
                  {Icon.down}
                </button>
                <button type="button" onClick={() => duplicate(i)} aria-label="Duplicate" title="Duplicate">
                  {Icon.copy}
                </button>
                <ConfirmDelete onConfirm={() => remove(i)} />
              </div>
            </div>
            {isOpen && <div className={s.itemBody}>{children([...path, i], i)}</div>}
          </div>
        )
      })}
      <button type="button" className={s.add} onClick={add}>
        {Icon.plus} {addLabel}
      </button>
    </div>
  )
}

/** Two-step delete: first click arms, second click (within 3 s) deletes. */
function ConfirmDelete({ onConfirm }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      className={armed ? s.danger : undefined}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      aria-label={armed ? 'Click again to delete' : 'Delete'}
      title={armed ? 'Click again to delete' : 'Delete'}
    >
      {armed ? 'Delete?' : Icon.trash}
    </button>
  )
}

/* ---- résumé files -------------------------------------------------------- */

const fileSize = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`)
const fileDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '')

/**
 * Résumés stored in Supabase Storage (resumes/): upload, choose the one the
 * site links to (profile.resumeUrl, published with Save), open, and delete.
 * Deleting removes the file from Supabase; if the live site links to it, the
 * link is removed from the live site at once so it never points at nothing.
 */
export function ResumeManager() {
  const { draft, saved, set, notify, publishField, onError } = useEditor()
  const [files, setFiles] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const fileRef = useRef(null)
  const current = draft.profile?.resumeUrl ?? ''
  const live = saved?.profile?.resumeUrl ?? ''
  const choose = (url) => set(['profile', 'resumeUrl'], url)

  useEffect(() => {
    let off = false
    listFiles('resumes')
      .then((list) => !off && setFiles(list))
      .catch((err) => {
        if (off) return
        setFiles([])
        setLoadError(err.message)
      })
    return () => {
      off = true
    }
  }, [])

  const onFile = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const f = await uploadResume(file)
      setFiles((list) => [f, ...(list ?? [])])
      if (!current) {
        choose(f.url)
        notify('Résumé uploaded and selected. Save changes to show it on the site.')
      } else {
        notify('Résumé uploaded. Select it, then save, to show it on the site.')
      }
    } catch (err) {
      onError(err)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = async (f) => {
    try {
      await deleteFiles([f.path])
      setFiles((list) => list.filter((x) => x.path !== f.path))
      if (live === f.url) {
        await publishField(['profile', 'resumeUrl'], '')
        notify('Résumé deleted from Supabase, and the résumé button was removed from the live site.')
      } else {
        if (current === f.url) choose('')
        notify('Résumé deleted from Supabase.')
      }
    } catch (err) {
      onError(err)
    }
  }

  const external = current && !files?.some((f) => f.url === current)

  return (
    <div className={s.files}>
      <div className={s.inline}>
        <button type="button" className={s.btn} disabled={busy} onClick={() => fileRef.current?.click()}>
          {Icon.upload} {busy ? 'Uploading…' : 'Upload résumé'}
        </button>
        <span className={s.hint}>PDF or Word, up to 10 MB.</span>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      {loadError && <p className={s.error}>Could not list résumés: {loadError}</p>}

      <ul className={s.fileList} aria-busy={files == null}>
        {files == null && <li className={s.fileEmpty}>Loading…</li>}
        {files?.length === 0 && !loadError && <li className={s.fileEmpty}>No résumés uploaded yet.</li>}
        {files?.map((f) => (
          <li key={f.path} className={s.fileRow} data-selected={current === f.url}>
            <label className={s.filePick}>
              <input type="radio" name="resume" checked={current === f.url} onChange={() => choose(f.url)} />
              <span className={s.fileIcon}>{Icon.file}</span>
              <span className={s.fileMeta}>
                <strong>{f.name}</strong>
                <span>
                  {fileSize(f.size)} · {fileDate(f.created)}
                </span>
              </span>
            </label>
            {live === f.url && <span className={s.badgeLive}>On site</span>}
            {current === f.url && live !== f.url && <span className={s.badgeDraft}>Selected · save to publish</span>}
            <div className={s.itemTools}>
              <a href={f.url} target="_blank" rel="noopener" title="Open" aria-label={`Open ${f.name}`}>
                {Icon.external}
              </a>
              <ConfirmDelete onConfirm={() => remove(f)} />
            </div>
          </li>
        ))}
        {files != null && (
          <li className={s.fileRow} data-selected={!current}>
            <label className={s.filePick}>
              <input type="radio" name="resume" checked={!current} onChange={() => choose('')} />
              <span className={s.fileMeta}>
                <strong>No résumé</strong>
                <span>Hide the résumé button on the site</span>
              </span>
            </label>
          </li>
        )}
      </ul>

      {external && (
        <p className={s.hint}>
          The site currently links to <code>{current}</code>, which is not a file in this list. Pick a file above or “No résumé” to replace it.
        </p>
      )}
    </div>
  )
}
