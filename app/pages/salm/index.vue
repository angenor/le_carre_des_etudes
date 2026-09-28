<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmEditionResponse } from '#shared/types/salm'

// Page publique de l'édition SALM publiée (FR-010 à FR-019).
const { data } = await useFetch<SalmEditionResponse>('/api/salm/edition', { key: 'salm-edition' })

const edition = computed(() => data.value?.edition ?? null)
const previous = computed(() => data.value?.previous ?? null)

useHead({
  link: [{ rel: 'preload', href: '/fonts/salm/montserrat-latin-wght.woff2', as: 'font', type: 'font/woff2', crossorigin: '' }],
})

// SEO (T093) : métadonnées Open Graph et JSON-LD Event
const siteUrl = (useRuntimeConfig().public.siteUrl as string) || 'https://lecarredesetudes.com'
const title = computed(() => (edition.value
  ? `SALM ${edition.value.year} — Salon International des Licences et Masters · Le Carré des Études`
  : 'SALM — Salon International des Licences et Masters · Le Carré des Études'))
const description = computed(() => {
  const e = edition.value
  if (!e) return 'La prochaine édition du Salon International des Licences et Masters de Côte d\'Ivoire sera bientôt annoncée.'
  const dates = formatDateRange(e.days.map((d) => d.date))
  return `${e.salonName}${dates ? `, les ${dates}` : ''} à ${e.city}. Étudiant·e·s : obtenez votre badge d'entrée. Établissements : confirmez votre présence.`
})
const ogImage = computed(() => (edition.value?.poster ? `${siteUrl}${edition.value.poster.path}` : `${siteUrl}/images/og/default.jpg`))

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage,
  ogUrl: `${siteUrl}/salm`,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: ogImage,
})

useHead(() => {
  const e = edition.value
  if (!e || !e.timeline.opensAtIso || !e.timeline.endsAtIso) return {}
  const event = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `SALM ${e.year} — ${e.salonName}`,
    description: description.value,
    startDate: e.timeline.opensAtIso,
    endDate: e.timeline.endsAtIso,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: e.venue ?? e.city,
      address: { '@type': 'PostalAddress', addressLocality: e.city, addressCountry: 'CI' },
    },
    organizer: { '@type': 'Organization', name: e.organizerName },
    image: e.poster ? [ogImage.value] : undefined,
    url: `${siteUrl}/salm`,
  }
  return {
    link: [{ rel: 'canonical', href: `${siteUrl}/salm` }],
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(event) }],
  }
})
</script>

<template>
  <div class="salm-scope overflow-x-clip bg-salm-bg font-salm-body text-[#F5F3EF]">
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
