<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmEditionResponse } from '#shared/types/salm'

// Transition entre les écrans SALM (salm.css)
definePageMeta({ pageTransition: { name: 'salm-page', mode: 'out-in', duration: { enter: 500, leave: 200 } } })

// Inscription étudiante (US1). Contenu et état d'ouverture : édition publiée.
const { data } = await useFetch<SalmEditionResponse>('/api/salm/edition', { key: 'salm-edition' })
const edition = computed(() => data.value?.edition ?? null)

useSeoMeta({
  title: () => (edition.value
    ? `Inscription étudiant·e — SALM ${edition.value.year} · Le Carré des Études`
    : 'Inscription étudiant·e — SALM · Le Carré des Études'),
  description: () => (edition.value
    ? `Inscris-toi au SALM ${edition.value.year} et télécharge aussitôt ton badge d'entrée nominatif avec QR code.`
    : 'Inscription au Salon International des Licences et Masters de Côte d\'Ivoire.'),
})
</script>

<template>
  <div class="salm-scope overflow-x-clip bg-salm-bg px-4 pt-28 pb-16 font-salm-body text-salm-ink md:px-8 md:pt-[116px] md:pb-16">
    <div v-if="edition" class="mx-auto flex max-w-[1160px] justify-center">
      <SalmStudentForm :edition="edition" />
    </div>
    <section v-else class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 class="max-w-2xl font-salm-title text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">La prochaine édition du SALM sera bientôt annoncée.</h1>
      <NuxtLink to="/" class="text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft">Retour à l'accueil</NuxtLink>
    </section>
  </div>
</template>
