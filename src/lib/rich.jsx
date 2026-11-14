import { Fragment } from 'react'

/**
 * Tiny markup for content files: "plain *emphasis* plain".
 * Returns [{ text, em }] segments.
 */
export function parseRich(text = '') {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.length > 2 && part.startsWith('*') && part.endsWith('*')
        ? { text: part.slice(1, -1), em: true }
        : { text: part, em: false },
    )
}

export const plainText = (text = '') => text.replace(/\*/g, '')

/** Render rich text; *emphasis* becomes <em> (serif italic). */
export function Rich({ text }) {
  return parseRich(text).map((seg, i) =>
    seg.em ? <em key={i}>{seg.text}</em> : <Fragment key={i}>{seg.text}</Fragment>,
  )
}
