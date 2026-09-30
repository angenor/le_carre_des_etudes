<script setup lang="ts">
const { isLoggedIn, checked, logout, checkSession } = useAdmin()
const route = useRoute()

await checkSession()

watchEffect(() => {
  if (checked.value && !isLoggedIn.value) {
    navigateTo({ path: '/admin/login', query: route.path === '/admin' ? {} : { redirect: route.fullPath } })
  }
})

const sidebarOpen = ref(false)

// Téléphone de contrôle SALM rouvert seulement sur le back-office après le salon : effacement (FR-239)
onMounted(() => {
  if (isControlDataExpired()) clearControlData()
})

// Mode maintenance du site entier
const { status: siteStatus, refresh: refreshSiteStatus } = useSiteStatus()
await refreshSiteStatus()
const maintenance = computed(() => !!siteStatus.value?.maintenance)
const maintenanceSaving = ref(false)

async function toggleMaintenance() {
  const enable = !maintenance.value
  if (enable && !confirm('Activer le mode maintenance ? Les visiteurs ne verront plus que la page de maintenance ; vous gardez l\'accès au site en étant connecté.')) return
  maintenanceSaving.value = true
  try {
    const { maintenance: value } = await $fetch<{ maintenance: boolean }>('/api/admin/site/maintenance', {
      method: 'PATCH',
      body: { enabled: enable },
    })
    siteStatus.value = { maintenance: value, admin: true }
  } catch {
    alert('Erreur lors du changement du mode maintenance')
  } finally {
    maintenanceSaving.value = false
  }
}

interface NavChild {
  label: string
  to: string
  /** Sous-entrée active pour le chemin donné */
  match: (path: string) => boolean
}

/** Lien seul (tableau de bord), ou groupe d'un des volets de la plateforme : son titre n'est pas un lien. */
type NavEntry =
  | { kind: 'link'; label: string; to: string; icon: string }
  | { kind: 'group'; label: string; icon: string; children: NavChild[] }

const startsWith = (prefix: string) => (p: string) => p.startsWith(prefix)

// Deux volets, le magazine et le SALM, puis ce qui vaut pour tout le site (même découpage que le site public)
const navEntries: NavEntry[] = [
  { kind: 'link', label: 'Tableau de bord', to: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  {
    kind: 'group',
    label: 'Le magazine',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
    children: [
      { label: 'Numéros', to: '/admin/magazines', match: startsWith('/admin/magazines') },
      { label: 'Rubriques', to: '/admin/rubriques', match: startsWith('/admin/rubriques') },
      { label: 'Partenaires', to: '/admin/partenaires', match: startsWith('/admin/partenaires') },
      { label: 'Téléchargements', to: '/admin/telechargements', match: startsWith('/admin/telechargements') },
    ],
  },
  {
    kind: 'group',
    label: 'SALM',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm4-6h2v2H9v-2z',
    children: [
      { label: 'Inscriptions', to: '/admin/salm', match: (p) => p === '/admin/salm' || p.startsWith('/admin/salm/etablissements') },
      { label: 'Contrôle d\'entrée', to: '/admin/salm/controle', match: startsWith('/admin/salm/controle') },
      { label: 'Éditions', to: '/admin/salm/editions', match: startsWith('/admin/salm/editions') },
      { label: 'Statistiques', to: '/admin/salm/statistiques', match: (p) => p === '/admin/salm/statistiques' },
    ],
  },
  {
    kind: 'group',
    label: 'Site',
    icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
    children: [
      { label: 'Images d\'accueil', to: '/admin/images-accueil', match: startsWith('/admin/images-accueil') },
      { label: 'Newsletter', to: '/admin/newsletter', match: startsWith('/admin/newsletter') },
    ],
  },
]

function isEntryActive(entry: NavEntry) {
  if (entry.kind === 'link') return entry.to === '/admin' ? route.path === '/admin' : route.path.startsWith(entry.to)
  return entry.children.some((child) => child.match(route.path))
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Overlay mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-950 shadow-lg transition-transform duration-200 lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center gap-3 border-b border-gray-800 px-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-sm font-bold text-amber-400">
          CE
        </div>
        <div>
          <p class="text-sm font-bold text-white">Le Carré des Études</p>
          <p class="text-xs text-gray-500">Administration</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Administration">
        <template v-for="(entry, i) in navEntries" :key="entry.label">
          <NuxtLink
            v-if="entry.kind === 'link'"
            :to="entry.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            :class="isEntryActive(entry)
              ? 'bg-gray-800 text-amber-400'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
            @click="sidebarOpen = false"
          >
            <svg
              class="h-5 w-5 shrink-0"
              :class="isEntryActive(entry) ? 'text-amber-400' : 'text-gray-500'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" :d="entry.icon" />
            </svg>
            {{ entry.label }}
          </NuxtLink>

          <div v-else class="pt-3">
            <p
              :id="`nav-group-${i}`"
              class="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
              :class="isEntryActive(entry) ? 'text-amber-400' : 'text-gray-500'"
            >
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" :d="entry.icon" />
              </svg>
              {{ entry.label }}
            </p>
            <ul class="space-y-0.5 pl-8" :aria-labelledby="`nav-group-${i}`">
              <li v-for="child in entry.children" :key="child.to">
                <NuxtLink
                  :to="child.to"
                  :aria-current="child.match(route.path) ? 'page' : undefined"
                  class="block rounded-lg px-3 py-1.5 text-sm transition-colors"
                  :class="child.match(route.path)
                    ? 'bg-gray-800 font-medium text-amber-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
                  @click="sidebarOpen = false"
                >
                  {{ child.label }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </template>
      </nav>

      <!-- Mode maintenance -->
      <div class="border-t border-gray-800 px-3 py-4">
        <div class="flex items-center justify-between gap-3 rounded-lg px-3 py-2" :class="maintenance ? 'bg-amber-500/10' : ''">
          <div>
            <p id="maintenance-label" class="text-sm font-medium" :class="maintenance ? 'text-amber-400' : 'text-gray-300'">Mode maintenance</p>
            <p class="text-xs text-gray-500">{{ maintenance ? 'Site fermé au public' : 'Site en ligne' }}</p>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="maintenance ? 'true' : 'false'"
            aria-labelledby="maintenance-label"
            :disabled="maintenanceSaving"
            class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:outline-none disabled:opacity-50"
            :class="maintenance ? 'bg-amber-500' : 'bg-gray-700'"
            @click="toggleMaintenance"
          >
            <span class="inline-block size-5 rounded-full bg-white shadow transition-transform" :class="maintenance ? 'translate-x-5' : 'translate-x-0.5'" />
          </button>
        </div>
        <NuxtLink
          v-if="maintenance"
          to="/"
          class="mt-2 block px-3 text-xs text-gray-400 underline underline-offset-2 hover:text-white"
        >
          Voir le site (aperçu administrateur)
        </NuxtLink>
      </div>

      <!-- Déconnexion -->
      <div class="border-t border-gray-800 px-3 py-4">
        <button
          @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <svg class="h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- Contenu principal -->
    <div class="lg:pl-64">
      <!-- Header mobile -->
      <header class="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-900 px-4 lg:hidden">
        <button
          @click="sidebarOpen = true"
          class="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <p class="text-sm font-bold text-white">Administration</p>
      </header>

      <!-- Slot page -->
      <main class="px-4 py-8 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
