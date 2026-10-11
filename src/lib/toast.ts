import { useSyncExternalStore } from 'react'

// One small banner at a time, at the top of the screen (never clashes with bottom bars).

export interface Toast {
  id: number
  text: string
  tone: 'default' | 'good'
  action?: { label: string; run: () => void }
}

let current: Toast | null = null
let hideTimer: ReturnType<typeof setTimeout> | undefined
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function showToast(text: string, opts: { tone?: Toast['tone']; action?: Toast['action']; ms?: number } = {}) {
  current = { id: ++seq, text, tone: opts.tone ?? 'default', action: opts.action }
  clearTimeout(hideTimer)
  hideTimer = setTimeout(hideToast, opts.ms ?? 5000)
  emit()
}

export function hideToast() {
  current = null
  emit()
}

/** Shows "<text> · Undo"; `undo` runs only if tapped within 5 s. */
export const undoable = (text: string, undo: () => void) =>
  showToast(text, { action: { label: 'Undo', run: () => { undo(); hideToast() } } })

export function useToast() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}
