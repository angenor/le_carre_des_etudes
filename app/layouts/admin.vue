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

interface NavItem {
  label: string
  to: string
  icon: string
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', to: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { label: 'Magazines', to: '/admin/magazines', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { label: 'Rubriques', to: '/admin/rubriques', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { label: 'Partenaires', to: '/admin/partenaires', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Téléchargements', to: '/admin/telechargements', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { label: 'Newsletter', to: '/admin/newsletter', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  {
    label: 'SALM',
    to: '/admin/salm',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm4-6h2v2H9v-2z',
    children: [
      { label: 'Inscriptions', to: '/admin/salm', match: (p) => p === '/admin/salm' || p.startsWith('/admin/salm/etablissements') },
      { label: 'Contrôle d\'entrée', to: '/admin/salm/controle', match: (p) => p.startsWith('/admin/salm/controle') },
      { label: 'Éditions', to: '/admin/salm/editions', match: (p) => p.startsWith('/admin/salm/editions') },
      { label: 'Statistiques', to: '/admin/salm/statistiques', match: (p) => p === '/admin/salm/statistiques' },
    ],
  },
  { label: 'Images accueil', to: '/admin/images-accueil', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z' },
]

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
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
      <nav class="flex-1 space-y-1 px-3 py-4">
        <template v-for="item in navItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            v-bind="item.children ? { 'aria-current': undefined } : {}"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            :class="isActive(item.to)
              ? 'bg-gray-800 text-amber-400'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
            @click="sidebarOpen = false"
          >
            <svg
              class="h-5 w-5 shrink-0"
              :class="isActive(item.to) ? 'text-amber-400' : 'text-gray-500'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            {{ item.label }}
          </NuxtLink>
          <ul v-if="item.children" class="space-y-0.5 pb-1 pl-11" :aria-label="`Rubriques ${item.label}`">
            <li v-for="child in item.children" :key="child.to">
              <NuxtLink
                :to="child.to"
                :aria-current="child.match(route.path) ? 'page' : undefined"
                class="block rounded-lg px-3 py-1.5 text-sm transition-colors"
                :class="child.match(route.path)
                  ? 'font-medium text-amber-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
                @click="sidebarOpen = false"
              >
                {{ child.label }}
              </NuxtLink>
            </li>
          </ul>
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
