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
  <nav class="fixed left-0 top-4 z-50 ml-4 sm:ml-6 lg:ml-8">
    <!-- Desktop : pill compacte à gauche -->
    <div class="hidden items-center gap-1 rounded-full border border-white/15 bg-black/20 px-2 py-1.5 backdrop-blur-xl md:inline-flex">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
        :class="
          isActive(link.to)
            ? 'bg-white/20 text-white'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        "
      >
        {{ link.label }}
      </NuxtLink>
    </div>

    <!-- Mobile : bouton hamburger -->
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 backdrop-blur-xl transition-colors hover:bg-black/30 hover:text-white focus:outline-none md:hidden"
      :aria-expanded="mobileMenuOpen"
      aria-label="Ouvrir le menu de navigation"
      @click="mobileMenuOpen = !mobileMenuOpen"
    >
      <svg
        v-if="!mobileMenuOpen"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg
        v-else
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Menu mobile glassmorphism -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="mobileMenuOpen" class="mt-2 rounded-2xl border border-white/15 bg-black/30 backdrop-blur-xl md:hidden">
        <ul class="space-y-1 px-3 py-3">
          <li v-for="link in navLinks" :key="link.to">
            <NuxtLink
              :to="link.to"
              class="block rounded-lg px-4 py-2.5 text-base font-medium transition-colors"
              :class="
                isActive(link.to)
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
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
