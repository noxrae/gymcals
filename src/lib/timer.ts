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

async function notify(label: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    const opts = { body: `Rest is over. Time for your next set of ${label}.`, icon: 'icon-192.png', tag: 'rest', renotify: true } as NotificationOptions
    if (reg) await reg.showNotification('GymCals', opts)
    else new Notification('GymCals', opts)
  } catch {
    // notifications unavailable — the in-app alert still fires
  }
}

function finish() {
  if (!timer || alerted) return
  alerted = true
  const { sound, vibrate } = getState().settings
  if (vibrate && 'vibrate' in navigator) navigator.vibrate([250, 120, 250, 120, 400])
  if (sound) beep()
  if (document.hidden) void notify(timer.label)
  emit()
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
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
  },
  add(seconds: number) {
    if (!timer) return
    const endAt = Math.max(Date.now(), timer.endAt + seconds * 1000)
    timer = { ...timer, endAt, total: Math.max(timer.total + seconds, 1) }
    alerted = Date.now() >= endAt
    emit()
  },
  stop() {
    timer = null
    emit()
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
