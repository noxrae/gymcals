import { useEffect, useState, useSyncExternalStore } from 'react'
import { getState } from './store'

// Rest timer shared across screens. Ends with a vibration, a beep and,
// when the app is in the background, a system notification.

interface Timer { endAt: number; total: number; label: string }

let timer: Timer | null = null
let audio: AudioContext | null = null
let alerted = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function unlockAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}

function beep() {
  if (!audio) return
  const t = audio.currentTime
  ;[0, 0.22, 0.44].forEach((offset, i) => {
    const osc = audio!.createOscillator()
    const gain = audio!.createGain()
    osc.frequency.value = i === 2 ? 1175 : 880
    gain.gain.setValueAtTime(0.0001, t + offset)
    gain.gain.exponentialRampToValueAtTime(0.35, t + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.18)
    osc.connect(gain).connect(audio!.destination)
    osc.start(t + offset)
    osc.stop(t + offset + 0.2)
  })
}

/** Hands the alarm to the service worker, which can notify while the app is in the background. */
async function toServiceWorker(msg: { type: 'rest-start'; endAt: number; label: string } | { type: 'rest-cancel' }) {
  try {
    const reg = await navigator.serviceWorker?.ready
    reg?.active?.postMessage({ ...msg, url: location.href })
  } catch {
    // no service worker (e.g. dev server) — the in-app alert still works while the app is open
  }
}

function finish() {
  if (!timer || alerted) return
  alerted = true
  emit()
  // Clear the "Rest over" bar by itself after a few seconds.
  const ended = timer
  setTimeout(() => {
    if (timer === ended) restTimer.stop()
  }, 8000)
  // In the background the service worker shows a notification instead; vibration and
  // Web Audio only work while the app is visible.
  // Also skip when the app was frozen and only noticed late (the notification already alerted).
  if (document.hidden || Date.now() - timer.endAt > 3000) return
  const { sound, vibrate } = getState().settings
  if (vibrate && 'vibrate' in navigator) navigator.vibrate([250, 120, 250, 120, 400])
  if (sound) beep()
}

setInterval(() => {
  if (timer && Date.now() >= timer.endAt) finish()
}, 250)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && timer && Date.now() >= timer.endAt) finish()
})

export const restTimer = {
  start(seconds: number, label: string) {
    unlockAudio()
    if (seconds <= 0) return
    timer = { endAt: Date.now() + seconds * 1000, total: seconds, label }
    alerted = false
    emit()
    void toServiceWorker({ type: 'rest-start', endAt: timer.endAt, label })
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
  },
  add(seconds: number) {
    if (!timer) return
    const endAt = timer.endAt + seconds * 1000
    // Taking the rest below zero with −15 means "skip the rest" (found on the phone: the bar used to get stuck).
    if (endAt <= Date.now()) return restTimer.stop()
    timer = { ...timer, endAt, total: Math.max(timer.total + seconds, 1) }
    emit()
    void toServiceWorker({ type: 'rest-start', endAt, label: timer.label })
  },
  stop() {
    timer = null
    emit()
    void toServiceWorker({ type: 'rest-cancel' })
  },
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Live timer state; re-renders every 250 ms while running. */
export function useRestTimer() {
  const t = useSyncExternalStore(subscribe, () => timer)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!t) return
    const id = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [t])
  if (!t) return null
  const left = Math.max(0, (t.endAt - Date.now()) / 1000)
  return { left, total: t.total, label: t.label, done: left <= 0 }
}
