import { useEffect } from 'react'

/** Keeps the screen awake while `active` (Screen Wake Lock API); re-acquired when the app returns. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let alive = true
    const acquire = async () => {
      try {
        if (alive && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen')
      } catch {
        // denied (e.g. battery saver) — the screen just sleeps as usual
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) void acquire()
    }
    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release().catch(() => {})
    }
  }, [active])
}
