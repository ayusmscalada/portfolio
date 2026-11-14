import { Fragment } from 'react'
import { useInView } from '@/hooks/useInView.js'
import { parseRich, plainText } from '@/lib/rich.jsx'
import { cx } from '@/lib/cx.js'

/**
 * Group rich segments into visual words. Parts with no whitespace between
 * them (e.g. "*history*" + ",") stay in one word so the line can't break
 * between an emphasised word and its punctuation.
 */
function toWords(text) {
  const words = []
  let current = null
  for (const seg of parseRich(text)) {
    for (const token of seg.text.split(/(\s+)/)) {
      if (!token) continue
      if (/^\s+$/.test(token)) {
        current = null
        continue
      }
      if (!current) {
        current = []
        words.push(current)
      }
      current.push({ text: token, em: seg.em })
    }
  }
  return words
}

/**
 * Masked word-by-word reveal for headings. Supports *emphasis* markup.
 * Screen readers get the plain sentence via aria-label.
 */
export function SplitText({ text, as: Tag = 'h2', className, delay = 0, id }) {
  const [ref, inView] = useInView({ rootMargin: '0px 0px -8% 0px' })
  const words = toWords(text)

  return (
    <Tag
      ref={ref}
      id={id}
      className={cx('split', className)}
      data-in={inView}
      aria-label={plainText(text)}
      style={{ '--delay': `${delay}ms` }}
    >
      {words.map((parts, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="split-word" aria-hidden="true">
            <span className="split-inner" style={{ '--i': i }}>
              {parts.map((p, j) => (p.em ? <em key={j}>{p.text}</em> : <Fragment key={j}>{p.text}</Fragment>))}
            </span>
          </span>
        </Fragment>
      ))}
    </Tag>
  )
}
