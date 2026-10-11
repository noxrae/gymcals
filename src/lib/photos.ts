import { useEffect, useState } from 'react'
import { update } from './store'

// Progress photos live in IndexedDB on this device only (too big for localStorage).
// They are not part of the JSON backup.

export type Pose = 'front' | 'side' | 'back'
export const POSES: Pose[] = ['front', 'side', 'back']

export interface Photo { id: string; date: string; pose: Pose; blob: Blob }

const DB = 'gymcals-photos'
const STORE = 'photos'
const listeners = new Set<() => void>()

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    t.oncomplete = () => {
      db.close()
      resolve(req.result)
    }
    t.onerror = () => {
      db.close()
      reject(t.error ?? req.error)
    }
  })
}

/** Downscale to at most 1280 px on the long side, as JPEG. */
async function shrink(file: Blob): Promise<Blob> {
  try {
    const img = await createImageBitmap(file)
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', 0.82))
  } catch {
    return file
  }
}

function syncDates(photos: Photo[]) {
  const dates = [...new Set(photos.map((p) => p.date))].sort()
  update((s) => ({ ...s, photoDates: dates }))
}

export async function listPhotos(): Promise<Photo[]> {
  const all = await tx<Photo[]>('readonly', (s) => s.getAll() as IDBRequest<Photo[]>)
  return all.sort((a, b) => a.date.localeCompare(b.date))
}

export async function savePhoto(date: string, pose: Pose, file: Blob) {
  const blob = await shrink(file)
  await tx('readwrite', (s) => s.put({ id: `${date}-${pose}`, date, pose, blob }))
  syncDates(await listPhotos())
  listeners.forEach((l) => l())
}

export async function deletePhoto(id: string) {
  await tx('readwrite', (s) => s.delete(id))
  syncDates(await listPhotos())
  listeners.forEach((l) => l())
}

export async function clearPhotos() {
  await tx('readwrite', (s) => s.clear())
  listeners.forEach((l) => l())
}

/** All photos with object URLs; URLs are revoked when the list changes or the screen closes. */
export function usePhotos() {
  const [photos, setPhotos] = useState<(Photo & { url: string })[] | null>(null)
  useEffect(() => {
    let urls: string[] = []
    let alive = true
    const load = async () => {
      const list = await listPhotos().catch(() => [] as Photo[])
      if (!alive) return
      urls.forEach((u) => URL.revokeObjectURL(u))
      const withUrls = list.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }))
      urls = withUrls.map((p) => p.url)
      setPhotos(withUrls)
    }
    void load()
    listeners.add(load)
    return () => {
      alive = false
      listeners.delete(load)
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [])
  return photos
}
