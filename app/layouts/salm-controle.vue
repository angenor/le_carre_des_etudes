<script setup lang="ts">
// Poste de contrôle d'entrée SALM : plein écran sombre, sans barre latérale (specs/008, R6, R8).
// La session est vérifiée avec tolérance au réseau : sans réseau, la page s'ouvre si ce téléphone
// a déjà eu une session valide (marqueur local) ; le service worker permet de la rouvrir hors ligne.
const { checkSession } = useAdmin()
const route = useRoute()
const swReady = useState<boolean>('salm-controle-sw-ready', () => false)
const blocked = ref(false)

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'theme-color', content: '#020617' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
  ],
})

function toLogin() {
  return navigateTo({ path: '/admin/login', query: { redirect: route.fullPath } })
}

// Rendu serveur et navigation en ligne : session vérifiée comme dans le reste de l'admin
if (!(await checkSession())) await toLogin()

async function verifySession() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const { admin } = await $fetch<{ admin: boolean }>('/api/auth/me', { signal: controller.signal })
    if (!admin) return toLogin()
    writeSessionMarker({ checkedAt: Date.now() })
  }
  catch {
    // Pas de réseau : la page s'ouvre seulement si une session a déjà été vérifiée sur ce téléphone
    if (!readSessionMarker()?.checkedAt) blocked.value = true
  }
  finally {
    clearTimeout(timer)
  }
}

/** Service worker de la page, puis mise en cache de ce qu'elle a chargé (dont le moteur `jsqr`). */
async function setupOffline() {
  // En développement, les modules Vite ne sont pas versionnés : pas de service worker
  if (import.meta.dev || !('serviceWorker' in navigator) || !window.isSecureContext) return
  try {
    await navigator.serviceWorker.register('/salm-controle-sw.js', { scope: '/admin/salm/controle' })
    const registration = await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
        setTimeout(resolve, 5000)
      })
    }
    const worker = navigator.serviceWorker.controller ?? registration.active
    if (!worker) return
    await preloadQrEngine().catch(() => {})
    const urls = [
      '/admin/salm/controle',
      ...performance.getEntriesByType('resource')
        .map((entry) => new URL(entry.name))
        .filter((url) => url.origin === location.origin && url.pathname.startsWith('/_nuxt/'))
        .map((url) => url.pathname + url.search),
    ]
    const channel = new MessageChannel()
    const done = new Promise<{ failed?: number }>((resolve) => {
      channel.port1.onmessage = (event) => resolve(event.data ?? {})
    })
    worker.postMessage({ type: 'precache', urls: [...new Set(urls)] }, [channel.port2])
    const { failed } = await done
    swReady.value = !failed && !!navigator.serviceWorker.controller
  }
  catch {
    swReady.value = false
  }
}

onMounted(async () => {
  await verifySession()
  if (!blocked.value) setupOffline()
})
</script>

<template>
  <div class="min-h-dvh bg-slate-950 text-white antialiased">
    <div v-if="blocked" class="flex min-h-dvh items-center justify-center px-6 text-center">
      <p class="text-xl font-semibold text-slate-200">Connexion requise : ouvrez cette page avec du réseau</p>
    </div>
    <slot v-else />
  </div>
</template>
