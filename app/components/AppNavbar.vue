<script setup lang="ts">
const route = useRoute()

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
</script>

<template>
  <nav class="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
    <div class="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-gray-900/60 px-2 py-1.5 backdrop-blur-xl">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm"
        :class="
          isActive(link.to)
            ? 'bg-amber-400 text-gray-900'
            : 'text-white/80 hover:bg-amber-400/15 hover:text-amber-400'
        "
      >
        {{ link.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
