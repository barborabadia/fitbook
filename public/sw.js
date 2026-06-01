const CACHE = 'fitbook-v3'

self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request))
    return
  }
  // Supabase API requesty nikdy necachovat – jsou to živá data
  if (e.request.url.includes('supabase.co')) {
    e.respondWith(fetch(e.request))
    return
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((res) => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
    })
  )
})
