import { useEffect, useMemo, useState } from 'react'

function makeFormatter(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone })
  } catch {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
}

/** Live local time in your timezone, so visitors know when you're awake. */
export function Clock({ timeZone, label, className }) {
  const [now, setNow] = useState(() => new Date())
  const fmt = useMemo(() => makeFormatter(timeZone), [timeZone])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])

  const [hh, mm] = fmt.format(now).split(':')

  return (
    <time className={className} dateTime={now.toISOString()} title={`Local time (${timeZone})`}>
      {hh}
      <span className="clock-colon">:</span>
      {mm}
      {label && <span style={{ opacity: 0.55 }}>&nbsp;{label}</span>}
    </time>
  )
}
