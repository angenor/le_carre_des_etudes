<script setup lang="ts">
const route = useRoute()
const mobileMenuOpen = ref(false)

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Magazine', to: '/magazine' },
  { label: 'Rubriques', to: '/rubriques' },
  { label: 'Partenaires', to: '/partenaires' },
]

function isActive(to: string): boolean {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(to)
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

watch(() => route.path, () => {
  closeMobileMenu()
})
</script>

<template>
  <nav class="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Marque / Logo -->
        <NuxtLink
          to="/"
          class="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-900 transition-colors hover:text-emerald-700"
          @click="closeMobileMenu"
        >
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-sm font-black text-white">
            CÉ
          </span>
          <span class="hidden sm:inline">Le Carré des Études</span>
          <span class="sm:hidden">Le Carré</span>
        </NuxtLink>

        <!-- Liens de navigation (desktop) -->
        <ul class="hidden md:flex md:items-center md:gap-1">
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="rounded-md px-3 py-2 text-sm font-medium transition-colors"
              :class="
                isActive(link.to)
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              "
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>

        <!-- Bouton hamburger (mobile) -->
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 md:hidden"
          :aria-expanded="mobileMenuOpen"
          aria-label="Ouvrir le menu de navigation"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <!-- Icône hamburger -->
          <svg
            v-if="!mobileMenuOpen"
            class="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <!-- Icône fermeture -->
          <svg
            v-else
            class="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Menu mobile -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="mobileMenuOpen" class="border-t border-gray-100 bg-white md:hidden">
        <ul class="space-y-1 px-4 py-3">
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="block rounded-md px-3 py-2 text-base font-medium transition-colors"
              :class="
                isActive(link.to)
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              "
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </Transition>
  </nav>
</template>
