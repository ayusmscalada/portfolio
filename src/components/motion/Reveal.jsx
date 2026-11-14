import { useInView } from '@/hooks/useInView.js'
import { cx } from '@/lib/cx.js'

/** Fades + lifts its children into view once. `delay` in ms. */
export function Reveal({ as: Tag = 'div', delay = 0, className, style, children, ...rest }) {
  const [ref, inView] = useInView()
  return (
    <Tag
      ref={ref}
      className={cx('reveal', className)}
      data-in={inView}
      style={{ '--delay': `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
