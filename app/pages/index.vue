<script setup lang="ts">
useHead({
  title: 'Le Carré des Études — Guider, Informer, Inspirer',
})
</script>

<template>
  <div>
    <!-- Section Hero -->
    <section class="relative overflow-hidden bg-emerald-700">
      <div class="absolute inset-0">
        <img
          src="/images/hero/magazine-hero.svg"
          alt="Présentation du magazine Le Carré des Études — le magazine de la communauté estudiantine de Côte d'Ivoire"
          class="h-full w-full object-cover opacity-60"
        />
      </div>
      <div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div class="max-w-2xl">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Le Carré des Études
          </h1>
          <p class="mt-4 text-lg text-emerald-100 sm:text-xl lg:text-2xl">
            Guider, Informer, Inspirer
          </p>
          <p class="mt-6 max-w-xl text-base leading-relaxed text-emerald-50/90 sm:text-lg">
            Le magazine de la communauté estudiantine de Côte d'Ivoire.
            Découvrez des portraits inspirants, des parcours remarquables
            et toute l'actualité qui façonne l'avenir des étudiants ivoiriens.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <NuxtLink
              to="/magazine"
              class="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
            >
              Découvrir le magazine
            </NuxtLink>
            <NuxtLink
              to="/rubriques"
              class="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
            >
              Nos rubriques
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Section Mission -->
    <section class="bg-white py-16 sm:py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="text-2xl font-bold text-gray-900 sm:text-3xl">
            Notre mission
          </h2>
          <p class="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            Le Carré des Études est un magazine ivoirien dédié aux étudiants.
            Notre objectif : guider les jeunes dans leurs choix d'orientation,
            les informer sur les opportunités académiques et professionnelles,
            et les inspirer à travers des parcours et des témoignages
            de réussite.
          </p>
        </div>

        <div class="mt-12 grid gap-8 sm:grid-cols-3">
          <div class="text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-gray-900">Guider</h3>
            <p class="mt-2 text-sm text-gray-500">
              Accompagner les étudiants dans leurs choix d'orientation et de carrière.
            </p>
          </div>

          <div class="text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-gray-900">Informer</h3>
            <p class="mt-2 text-sm text-gray-500">
              Partager l'actualité académique et les opportunités pour les étudiants.
            </p>
          </div>

          <div class="text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-gray-900">Inspirer</h3>
            <p class="mt-2 text-sm text-gray-500">
              Mettre en lumière des parcours et des témoignages de réussite.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Section CTA -->
    <section class="bg-emerald-50 py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">
          Prêt à découvrir le magazine ?
        </h2>
        <p class="mt-3 text-base text-gray-600">
          Téléchargez gratuitement le dernier numéro du Carré des Études.
        </p>
        <div class="mt-6">
          <NuxtLink
            to="/magazine"
            class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Télécharger le magazine
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
