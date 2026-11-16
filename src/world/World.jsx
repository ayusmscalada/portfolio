import { useEffect, useRef, useState } from 'react'
import { useContent } from '@/content/ContentContext.jsx'
import { useReducedMotion } from '@/hooks/useMediaQuery.js'
import { afterFirstPaint } from '@/lib/idle.js'
import s from './World.module.css'

/**
 * The 3D world behind the whole page. three.js and the scene are a separate
 * chunk, fetched only after first paint; until then (or without WebGL) a CSS
 * nebula stands in. Sections mark their camera stops with `data-stage`.
 */
export function World() {
  const content = useContent()
  const reduced = useReducedMotion()
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const contentRef = useRef(content)
  const reducedRef = useRef(reduced)
  const [ready, setReady] = useState(false)
  contentRef.current = content
  reducedRef.current = reduced

  useEffect(() => {
    let cancelled = false
    const cancel = afterFirstPaint(() => {
      import('./engine.js')
        .then(({ createWorld }) => {
          if (cancelled || !canvasRef.current) return
          engineRef.current = createWorld(canvasRef.current, {
            content: contentRef.current,
            reduced: reducedRef.current,
            onReady: () => !cancelled && setReady(true),
          })
        })
        .catch(() => {})
    })
    return () => {
      cancelled = true
      cancel()
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [])

  // Content edits (admin preview, live saves) rebuild the content-driven scene.
  useEffect(() => {
    if (!engineRef.current) return
    const id = setTimeout(() => engineRef.current?.setContent(content), 250)
    return () => clearTimeout(id)
  }, [content])

  useEffect(() => {
    engineRef.current?.setReduced(reduced)
  }, [reduced])

  return (
    <div className={s.world} data-ready={ready} aria-hidden="true">
      <div className={s.fallback} />
      <canvas ref={canvasRef} className={s.canvas} />
      <div className={s.vignette} />
    </div>
  )
}
