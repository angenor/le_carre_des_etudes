<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmEditionResponse } from '#shared/types/salm'

// Transition entre les écrans SALM (salm.css)
definePageMeta({ pageTransition: { name: 'salm-page', mode: 'out-in', duration: { enter: 500, leave: 200 } } })

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
  <SalmEditionView :edition="edition" :previous="previous" />
</template>
