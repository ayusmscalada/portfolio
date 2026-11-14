import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useMediaQuery.js'

/** Types a line of text character by character, terminal-style. */
export function TypeLine({ text, speed = 28, delay = 300, className }) {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduced) return
    let interval
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            clearInterval(interval)
            return c
          }
          return c + 1
        })
      }, speed)
    }, delay)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [text, speed, delay, reduced])

  const shown = reduced ? text : text.slice(0, count)

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  )
}
