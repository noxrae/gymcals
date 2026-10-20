// Rest-timer alarm, run inside the service worker so it fires even when the app is
// in the background or the screen is off (Android freezes background pages).
// The page posts { type: 'rest-start', endAt, label, channel?, title?, body? } or { type: 'rest-cancel', channel? }.
// Channels keep the rest timer and the hold/cardio timer from cancelling each other.
const tokens = {}

self.addEventListener('message', (event) => {
  const msg = event.data || {}
  const channel = msg.channel || 'rest'
  if (msg.type === 'rest-cancel') {
    tokens[channel] = (tokens[channel] || 0) + 1
    return
  }
  if (msg.type !== 'rest-start') return
  const token = (tokens[channel] = (tokens[channel] || 0) + 1)
  const wait = Math.max(0, msg.endAt - Date.now())
  event.waitUntil(
    new Promise((resolve) => setTimeout(resolve, wait)).then(async () => {
      if (token !== tokens[channel]) return
      // If the app is on screen, it alerts itself (in-app sound + vibration).
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (windows.some((w) => w.visibilityState === 'visible')) return
      await self.registration.showNotification(msg.title || 'Rest is over', {
        body: msg.body || `Time for your next set of ${msg.label}.`,
        tag: channel,
        renotify: true,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [300, 150, 300, 150, 500],
        data: { url: msg.url },
      })
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows[0]
      return open ? open.focus() : self.clients.openWindow(event.notification.data?.url || './')
    }),
  )
})
