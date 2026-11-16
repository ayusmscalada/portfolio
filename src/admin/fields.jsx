import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { uploadImage } from './api.js'
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
export function List({ path, label, hint, newItem, itemTitle, addLabel = 'Add item', children, defaultOpen = false }) {
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
        return (
          <div key={k} className={s.item} data-open={isOpen}>
            <div className={s.itemBar}>
              <button type="button" className={s.itemToggle} onClick={() => toggle(k)} aria-expanded={isOpen}>
                <span className={s.itemNo}>{String(i + 1).padStart(2, '0')}</span>
                <span className={s.itemTitle}>{(itemTitle ? itemTitle(item, i) : '') || 'Untitled'}</span>
                <span className={s.caret}>{Icon.down}</span>
              </button>
              <div className={s.itemTools}>
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
