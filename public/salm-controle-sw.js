// Service worker du poste de contrôle d'entrée SALM (specs/008, R6).
// Portée limitée à /admin/salm/controle : ni le site public ni le reste de l'admin ne sont concernés.
// - page de contrôle : réseau d'abord, copie en cache si le réseau manque ;
// - fichiers versionnés /_nuxt/* : cache d'abord ;
// - /api/* : jamais intercepté (les données hors ligne sont dans le stockage local de la page).

const CACHE = 'salm-controle-v1'
const PAGE = '/admin/salm/controle'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n.startsWith('salm-controle-') && n !== CACHE).map((n) => caches.delete(n)))
    await self.clients.claim()
  })())
})

/** Clé de cache d'une page : son chemin, sans paramètres (ex. `?token=`). */
function pageKey(url) {
  return new URL(url.pathname, url.origin).href
}

async function networkFirst(request, key) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') await cache.put(key, response.clone())
    return response
  }
  catch (error) {
    const cached = await cache.match(key)
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok && response.type === 'basic') await cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate' && url.pathname.startsWith(PAGE)) {
    event.respondWith(networkFirst(request, pageKey(url)))
  }
  else if (url.pathname.startsWith('/_nuxt/builds/')) {
    // Manifeste de l'application : à jour en ligne, copie hors ligne
    event.respondWith(networkFirst(request, request))
  }
  else if (url.pathname.startsWith('/_nuxt/')) {
    event.respondWith(cacheFirst(request))
  }
})

self.addEventListener('message', (event) => {
  const data = event.data || {}
  const reply = (message) => event.ports[0]?.postMessage(message)
  if (data.type === 'precache' && Array.isArray(data.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE)
      // Un par un : une ressource disparue ne fait pas échouer les autres
      const results = await Promise.allSettled(data.urls.map(async (u) => {
        const url = new URL(u, self.location.origin)
        if (url.origin !== self.location.origin) return
        const response = await fetch(url.href, { credentials: 'same-origin' })
        if (response.ok) await cache.put(url.pathname.startsWith(PAGE) ? pageKey(url) : url.href, response)
        else throw new Error(String(response.status))
      }))
      reply({ type: 'precached', failed: results.filter((r) => r.status === 'rejected').length })
    })())
  }
  else if (data.type === 'clear') {
    event.waitUntil(caches.delete(CACHE).then(() => reply({ type: 'cleared' })))
  }
})
