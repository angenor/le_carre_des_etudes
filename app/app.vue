<script setup lang="ts">
const siteUrl = 'https://lecarredesetudes.com'
const title = 'Le Carré des Études — Guider, Informer, Inspirer'
const description = 'Magazine ivoirien dédié aux étudiants : orientation, parcours inspirants, opportunités et actualités de la vie estudiantine en Côte d\'Ivoire.'

useHead({
  htmlAttrs: { lang: 'fr' },
  titleTemplate: '%s',
  meta: [
    { name: 'description', content: description },
    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Le Carré des Études' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: `${siteUrl}/images/og/default.jpg` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:url', content: siteUrl },
    { property: 'og:locale', content: 'fr_CI' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: `${siteUrl}/images/og/default.jpg` },
  ],
  link: [
    { rel: 'canonical', href: siteUrl },
  ],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
