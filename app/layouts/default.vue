<script setup lang="ts">
const { status } = useSiteStatus()

// Pages SALM : fond sombre derrière la page, pour qu'aucun blanc n'apparaisse pendant les transitions
const route = useRoute()
const salmPage = computed(() => route.path === '/salm' || route.path.startsWith('/salm/'))
</script>

<template>
  <!-- Fond et `color-scheme` (champs natifs, barres de défilement) suivent le mode clair / sombre -->
  <div class="min-h-screen flex flex-col bg-page text-ink [color-scheme:var(--site-scheme)]">
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
    <!-- Carte flottante « À la une · Résultats » masquée : /resultats reste en ligne, le lien a été partagé -->
  </div>
</template>
