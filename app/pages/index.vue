<script setup lang="ts">
useHead({
  title: 'Le Carré des Études — Guider, Informer, Inspirer',
})
</script>

<template>
  <div>
    <!-- Section Hero — Full Screen -->
    <section class="relative h-dvh min-h-150 overflow-hidden bg-gray-900">
      <!-- Image desktop 16:9 -->
      <img
        src="/images/hero/hero_section.jpg"
        alt="Couverture du magazine Le Carré des Études"
        class="absolute inset-0 hidden h-full w-full object-cover md:block"
      />
      <!-- Image mobile 9:16 -->
      <img
        src="/images/hero/magazine.png"
        alt="Couverture du magazine Le Carré des Études"
        class="absolute inset-0 block h-full w-full object-cover object-top md:hidden"
      />
      <!-- H1 accessible (masqué car le titre est sur l'image) -->
      <h1 class="sr-only">Le Carré des Études — Guider, Informer, Inspirer</h1>
      <!-- Dégradé bas pour les CTA -->
      <div class="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
      <!-- Contenu bas : tagline + CTA -->
      <div class="absolute inset-x-0 bottom-0 z-10 px-6 pb-16 sm:pb-20">
        <div class="mx-auto max-w-4xl text-center">
          <p class="text-lg font-medium tracking-wide text-amber-400 sm:text-xl md:text-2xl">
            Guider, Informer, Inspirer
          </p>
          <p class="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Le magazine de la communauté estudiantine de Côte d'Ivoire
          </p>
          <div class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <NuxtLink
              to="/magazine"
              class="inline-flex items-center justify-center rounded-full bg-amber-400 px-8 py-3 text-sm font-bold tracking-wide text-gray-900 uppercase shadow-lg transition-all hover:bg-amber-300 hover:shadow-amber-400/25 sm:text-base"
            >
              Découvrir le magazine
            </NuxtLink>
            <NuxtLink
              to="/rubriques"
              class="inline-flex items-center justify-center rounded-full border-2 border-white/40 px-8 py-3 text-sm font-bold tracking-wide text-white uppercase backdrop-blur-sm transition-all hover:border-white hover:bg-white/10 sm:text-base"
            >
              Nos rubriques
            </NuxtLink>
          </div>
        </div>
      </div>
      <!-- Indicateur de scroll -->
      <div class="absolute inset-x-0 bottom-4 z-10 flex animate-bounce justify-center">
        <svg class="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
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
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
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
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
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
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
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
