import { useEffect, useMemo, useRef, useState } from 'react'
import { profile } from '@/data/profile.js'
import { sections } from '@/data/sections.js'
import { useUI } from '@/context/UIContext.jsx'
import { scrollToId } from '@/lib/scrollTo.js'
import s from './CommandPalette.module.css'

function useCommands() {
  const { theme, toggleTheme, accent, cycleAccent, motion, toggleMotion, copyEmail } = useUI()

  return useMemo(
    () =>
      [
        ...sections.map((sec) => ({
          id: `go-${sec.id}`,
          group: 'Navigate',
          label: sec.label,
          hint: `#${sec.id}`,
          run: () => scrollToId(sec.id),
        })),
        { id: 'copy-email', group: 'Contact', label: 'Copy email address', hint: profile.email, run: copyEmail },
        {
          id: 'mailto',
          group: 'Contact',
          label: 'Write an email',
          hint: 'mailto:',
          run: () => {
            window.location.href = `mailto:${profile.email}`
          },
        },
        profile.resumeUrl && {
          id: 'resume',
          group: 'Contact',
          label: 'Download résumé',
          hint: 'PDF',
          run: () => window.open(profile.resumeUrl, '_blank', 'noopener'),
        },
        {
          id: 'theme',
          group: 'Preferences',
          label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
          hint: theme,
          run: () => toggleTheme(),
        },
        { id: 'motion', group: 'Preferences', label: motion === 'full' ? 'Pause animations' : 'Play animations', hint: motion, run: toggleMotion },
        { id: 'accent', group: 'Preferences', label: 'Cycle accent colour', hint: accent, run: cycleAccent },
        ...profile.socials.map((so) => ({
          id: `link-${so.label}`,
          group: 'Elsewhere',
          label: so.label,
          hint: `${so.handle} ↗`,
          run: () => window.open(so.url, '_blank', 'noopener,noreferrer'),
        })),
      ].filter(Boolean),
    [theme, toggleTheme, accent, cycleAccent, motion, toggleMotion, copyEmail],
  )
}

function matches(cmd, query) {
  const haystack = `${cmd.label} ${cmd.hint} ${cmd.group}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token))
}

export function CommandPalette() {
  const { paletteOpen, closePalette } = useUI()
  const commands = useCommands()
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const results = useMemo(() => commands.filter((c) => matches(c, query)), [commands, query])

  const groups = useMemo(() => {
    const map = new Map()
    results.forEach((cmd, i) => {
      if (!map.has(cmd.group)) map.set(cmd.group, [])
      map.get(cmd.group).push({ cmd, i })
    })
    return [...map]
  }, [results])

  // Sync React state → native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current
    if (paletteOpen && !dialog.open) {
      dialog.showModal()
      inputRef.current?.focus()
    } else if (!paletteOpen && dialog.open) {
      dialog.close()
    }
  }, [paletteOpen])

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const handleClose = () => {
    closePalette()
    setQuery('')
    setActive(0)
  }

  const run = (cmd) => {
    dialogRef.current.close()
    requestAnimationFrame(() => cmd.run())
  }

  const onKeyDown = (e) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + results.length) % results.length)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(results.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[active])
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-label="Command menu"
      onClose={handleClose}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
    >
      <div className={s.inputRow}>
        <span className={s.prompt} aria-hidden="true">
          ~/portfolio <span className={s.caret}>›</span>
        </span>
        <input
          ref={inputRef}
          className={s.input}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          placeholder="Jump to a section, copy email, change theme…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          spellCheck="false"
          autoComplete="off"
        />
        <kbd className={s.esc}>esc</kbd>
      </div>

      <ul ref={listRef} id="palette-list" role="listbox" className={s.list} aria-label="Commands">
        {groups.map(([group, items]) => (
          <li key={group} role="presentation">
            <div className={s.group} id={`grp-${group}`}>
              {group}
            </div>
            <ul role="group" aria-labelledby={`grp-${group}`}>
              {items.map(({ cmd, i }) => (
                <li
                  key={cmd.id}
                  id={`cmd-${cmd.id}`}
                  role="option"
                  aria-selected={i === active}
                  className={s.option}
                  onMouseMove={() => i !== active && setActive(i)}
                  onClick={() => run(cmd)}
                >
                  <span className={s.optLabel}>{cmd.label}</span>
                  <span className={s.optHint}>{cmd.hint}</span>
                  <span className={s.enter} aria-hidden="true">
                    ↵
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {!results.length && (
        <p className={s.empty}>
          404 — no command matches “{query}”. Try <code>projects</code> or <code>email</code>.
        </p>
      )}

      <footer className={s.footer} aria-hidden="true">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> navigate
        </span>
        <span>
          <kbd>↵</kbd> run
        </span>
        <span>
          <kbd>/</kbd> open anywhere
        </span>
      </footer>
    </dialog>
  )
}
