<script setup lang="ts">
const { status } = useSiteStatus()

// Pages SALM : fond sombre derrière la page, pour qu'aucun blanc n'apparaisse pendant les transitions
const route = useRoute()
const salmPage = computed(() => route.path === '/salm' || route.path.startsWith('/salm/'))
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Aperçu administrateur pendant la maintenance -->
    <div
      v-if="status?.maintenance && status.admin"
      class="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-gray-950"
      role="status"
    >
      Mode maintenance : le site n'est visible que par les administrateurs.
      <NuxtLink to="/admin" class="font-semibold underline underline-offset-2">Administration</NuxtLink>
    </div>
    <AppNavbar />
    <main class="flex-1" :class="{ 'bg-salm-bg': salmPage }">
      <slot />
    </main>
    <AppFooter />
    <ResultatsFloatingCard />
  </div>
</template>
