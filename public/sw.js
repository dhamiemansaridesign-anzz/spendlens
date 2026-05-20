// SpendLens Service Worker v2
const CACHE = 'spendlens-v2'
const SHELL = ['/index.html', '/manifest.json']

// Install: pre-cache the app shell so offline navigation works
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  )
})

// Activate: clear old caches, take control immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch: cache-first for navigations (offline support), network for everything else
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) return

  if (e.request.mode === 'navigate') {
    // Return cached index.html for all page navigations (SPA routing + offline)
    e.respondWith(
      caches.match('/index.html').then((cached) => {
        const networkFetch = fetch(e.request).then((resp) => {
          caches.open(CACHE).then((c) => c.put('/index.html', resp.clone()))
          return resp
        })
        return cached || networkFetch
      })
    )
    return
  }

  // For assets: network-first, cache as fallback
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        if (resp.ok) {
          const clone = resp.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return resp
      })
      .catch(() => caches.match(e.request))
  )
})
