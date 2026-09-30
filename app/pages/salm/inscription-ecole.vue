<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmEditionResponse } from '#shared/types/salm'

// Transition entre les écrans SALM (salm.css)
definePageMeta({ pageTransition: { name: 'salm-page', mode: 'out-in', duration: { enter: 500, leave: 200 } } })

// Inscription des établissements exposants (US3). Fermée : message de fermeture (FR-051).
const { data } = await useFetch<SalmEditionResponse>('/api/salm/edition', { key: 'salm-edition' })
const edition = computed(() => data.value?.edition ?? null)
const photo = computed(() => data.value?.previous?.photos[0] ?? null)
const contacts = computed(() => edition.value?.contacts.filter((c) => c.kind !== 'address') ?? [])

useSeoMeta({
  title: () => (edition.value
    ? `Formulaire exposants — SALM ${edition.value.year} · Le Carré des Études`
    : 'Formulaire exposants — SALM · Le Carré des Études'),
  description: () => (edition.value
    ? `Universités et grandes écoles : confirmez la présence de votre établissement au SALM ${edition.value.year}.`
    : 'Salon International des Licences et Masters de Côte d\'Ivoire.'),
})
</script>

<template>
  <div class="salm-scope overflow-x-clip bg-salm-bg px-4 pt-28 pb-16 font-salm-body text-salm-ink md:px-8 md:pt-[116px]">
    <div v-if="edition && edition.registration.schools.open" class="mx-auto flex max-w-[1160px] justify-center">
      <SalmSchoolForm :edition="edition" :photo="photo" />
    </div>
    <section v-else-if="edition" class="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 text-center">
      <span class="font-salm-title text-[13px] font-bold tracking-[0.16em] text-salm-accent-text">FORMULAIRE EXPOSANTS — SALM {{ edition.year }}</span>
      <h1 class="font-salm-title text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">Inscriptions des établissements closes</h1>
      <p class="text-base leading-relaxed text-salm-ink-soft">Pour toute question, contactez l'équipe SALM<template v-if="contacts.length"> : {{ contacts.map((c) => c.value).join(' · ') }}</template>.</p>
      <NuxtLink to="/salm" class="text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft">Retour à la page SALM</NuxtLink>
    </section>
    <section v-else class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 class="max-w-2xl font-salm-title text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">La prochaine édition du SALM sera bientôt annoncée.</h1>
      <NuxtLink to="/" class="text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft">Retour à l'accueil</NuxtLink>
    </section>
  </div>
</template>
