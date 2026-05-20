// SpendLens Service Worker
// Minimal SW — its presence enables Chrome's "Add to Home Screen" install prompt.
// All fetches pass through to the network; offline caching can be added later.

const VERSION = 'spendlens-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Network-first: always try the network, fall back to cache for navigations
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  // For navigation requests, serve index.html from cache as offline fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    )
    return
  }

  e.respondWith(fetch(e.request))
})
