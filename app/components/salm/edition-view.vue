<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmPreviousEdition, SalmPublicEdition } from '#shared/types/salm'

// Sections de la page du SALM, partagées par /salm et l'aperçu du back-office (FR-120, research R6).
defineProps<{
  edition: SalmPublicEdition | null
  previous: SalmPreviousEdition | null
}>()

// Apparitions au défilement, déclarées par data-motion dans les sections
const root = ref<HTMLElement | null>(null)
useSalmMotion(root)
</script>

<template>
  <div ref="root" class="salm-scope overflow-x-clip bg-salm-bg font-salm-body text-[#F5F3EF]">
    <template v-if="edition">
      <SalmHero :edition="edition" :previous="previous" />
      <SalmParticipate :edition="edition" />
      <SalmWhy :edition="edition" />
      <SalmHighlights v-if="edition.highlights.length" :highlights="edition.highlights" :day-count="edition.days.length" />
      <SalmChronogram
        v-if="edition.days.length"
        :year="edition.year"
        :days="edition.days"
        :program-pdf-path="edition.programPdfPath"
        :students-open="edition.registration.students.open"
      />
      <SalmVideos v-if="previous?.videos.length" :year="previous.year" :videos="previous.videos" />
      <SalmPhotos v-if="previous?.photos.length" :year="previous.year" :photos="previous.photos" />
      <SalmFinalCta :edition="edition" />
    </template>

    <section v-else class="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 pt-32 pb-20 text-center">
      <span class="font-salm-title text-[13px] font-bold tracking-[0.16em] text-salm-accent-text">SALON INTERNATIONAL DES LICENCES ET MASTERS</span>
      <h1 class="max-w-2xl font-salm-title text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">La prochaine édition du SALM sera bientôt annoncée.</h1>
      <NuxtLink to="/" class="mt-2 text-sm font-semibold text-salm-accent-text hover:text-orange-300">Retour à l'accueil</NuxtLink>
    </section>
  </div>
</template>
