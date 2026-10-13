import { useSyncExternalStore } from 'react'
import { getState } from '../store'
import { coachCtx, contextForModel, SYSTEM_PROMPT } from './context'
import { AiError, askGemini, askOnDevice, geminiKey, onDeviceAvailable, type Turn } from './llm'
import { localAnswer, type Answer } from './local'

// The companion: picks the best free source for each question and keeps the chat on the device.

export type Source = 'gemini' | 'device' | 'builtin'
export interface Message extends Turn {
  id: number
  source?: Source
  links?: Answer['links']
  note?: string
}

const KEY = 'gymcals:chat'
let messages: Message[] = load()
let thinking = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function load(): Message[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Message[]
  } catch {
    return []
  }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(messages.slice(-60)))
  } catch {
    // ignore
  }
}

export function clearChat() {
  messages = []
  save()
  emit()
}

/** Which engine will answer the next question. */
export async function activeSource(): Promise<Source> {
  if (geminiKey()) return 'gemini'
  if (await onDeviceAvailable()) return 'device'
  return 'builtin'
}

export async function ask(question: string) {
  const text = question.trim()
  if (!text || thinking) return
  const user: Message = { id: Date.now(), role: 'user', text }
  messages = [...messages, user]
  thinking = true
  emit()

  const ctx = coachCtx(getState())
  const local = localAnswer(text, ctx)
  const turns: Turn[] = messages.slice(-10).map(({ role, text: t }) => ({ role, text: t }))
  const system = `${SYSTEM_PROMPT}\n\nThe user's current data:\n${contextForModel(ctx)}`
  let reply: Message
  try {
    const source = await activeSource()
    if (source === 'gemini') reply = { id: Date.now() + 1, role: 'coach', text: await askGemini(geminiKey(), system, turns), source, links: local.links }
    else if (source === 'device') reply = { id: Date.now() + 1, role: 'coach', text: await askOnDevice(system, turns), source, links: local.links }
    else reply = { id: Date.now() + 1, role: 'coach', text: local.text, source, links: local.links }
  } catch (err) {
    // Any AI failure falls back to the built-in coach, with a short note why.
    reply = { id: Date.now() + 1, role: 'coach', text: local.text, source: 'builtin', links: local.links, note: err instanceof AiError ? err.message : 'AI unavailable.' }
  }
  messages = [...messages, reply]
  thinking = false
  save()
  emit()
}

const snapshot = { messages, thinking }
let last = snapshot
export function useChat() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => {
      if (last.messages !== messages || last.thinking !== thinking) last = { messages, thinking }
      return last
    },
  )
}
