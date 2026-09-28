<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmControlPoster } from '#shared/types/salm'

// Affiche A4 « Pas encore inscrit·e ? » à imprimer pour l'entrée du salon (FR-241).
definePageMeta({ layout: false })
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
useSeoMeta({ title: 'Affiche d\'inscription · SALM' })

const route = useRoute()
if (!(await useAdmin().checkSession())) {
  await navigateTo({ path: '/admin/login', query: { redirect: route.fullPath } })
}

const { data: poster, error } = await useFetch<SalmControlPoster>('/api/admin/salm/control/poster', { key: 'salm-controle-poster' })
const shortUrl = computed(() => poster.value?.url.replace(/^https?:\/\//, '') ?? '')

function print() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-stone-200 py-8 print:bg-white print:py-0">
    <div class="mx-auto mb-6 flex max-w-[210mm] items-center justify-between gap-4 px-4 print:hidden">
      <NuxtLink to="/admin/salm/controle" class="text-sm font-medium text-stone-700 underline underline-offset-4">Retour au contrôle</NuxtLink>
      <button
        type="button"
        class="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        :disabled="!poster"
        @click="print"
      >
        Imprimer
      </button>
    </div>

    <p v-if="error" class="mx-auto max-w-[210mm] px-4 text-center text-stone-700">
      {{ requestErrorCode(error) === 'NO_PUBLISHED_EDITION' ? 'Aucune édition SALM publiée.' : 'Affiche indisponible : réessayez.' }}
    </p>

    <article
      v-else-if="poster"
      class="poster mx-auto flex flex-col items-center justify-between bg-white px-[18mm] py-[20mm] text-center font-salm-title text-stone-900 shadow-xl print:shadow-none"
    >
      <header>
        <p class="text-[5mm] font-semibold tracking-[0.3em] text-[#C2410C] uppercase">SALM {{ poster.year }}</p>
        <h1 class="mt-[6mm] text-[17mm] leading-[1.05] font-extrabold tracking-[-0.02em]">Pas encore inscrit·e&nbsp;?</h1>
        <p class="mt-[6mm] text-[8mm] leading-snug font-semibold text-stone-700">
          Obtenez votre badge SALM&nbsp;{{ poster.year }} en 1&nbsp;minute
        </p>
      </header>

      <div class="qr w-[95mm] rounded-[4mm] border-[1.5mm] border-stone-900 p-[4mm] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full" v-html="poster.qrSvg" />

      <footer>
        <p class="text-[6mm] font-medium text-stone-600">Scannez le QR code ou rendez-vous sur</p>
        <p class="mt-[3mm] text-[8.5mm] leading-tight font-extrabold whitespace-nowrap">{{ shortUrl }}</p>
      </footer>
    </article>
  </div>
</template>

<style scoped>
@page {
  size: A4;
  margin: 15mm;
}

.poster {
  width: 210mm;
  min-height: 297mm;
}

@media print {
  .poster {
    width: auto;
    min-height: calc(297mm - 30mm);
    padding: 8mm 0;
  }
}
</style>
