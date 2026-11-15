import { useCallback, useSyncExternalStore } from 'react'
import { isReducedMotion, subscribeMotion } from '@/lib/motion.js'

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (fn) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', fn)
      return () => mq.removeEventListener('change', fn)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** True when the site-wide motion switch is off (see lib/motion.js). */
export const useReducedMotion = () => useSyncExternalStore(subscribeMotion, isReducedMotion, () => false)
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')
