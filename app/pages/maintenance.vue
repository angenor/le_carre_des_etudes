<script setup lang="ts">
definePageMeta({
  layout: false,
})

// Page affichée aux visiteurs pendant la maintenance (statut 503 pour les moteurs de recherche).
const event = useRequestEvent()
if (event) setResponseStatus(event, 503)
useResponseHeader('Retry-After').value = '3600'

useSeoMeta({
  title: 'Site en maintenance — Le Carré des Études',
  robots: 'noindex, nofollow',
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-center">
    <div class="max-w-lg">
      <div class="mx-auto flex size-14 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400" aria-hidden="true">
        <svg class="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
        </svg>
      </div>
      <h1 class="mt-6 bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
        Le Carré des Études
      </h1>
      <p class="mt-4 text-lg font-semibold text-white">Site en maintenance</p>
      <p class="mt-2 text-sm leading-relaxed text-gray-400">
        Nous améliorons la plateforme. Le site sera de retour très bientôt, merci de votre patience.
      </p>
    </div>
  </main>
</template>
