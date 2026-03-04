<template>
  <section class="relative overflow-hidden bg-gray-900 md:h-dvh md:min-h-150">
    <!-- Image desktop 16:9 -->
    <img
      src="/images/hero/hero_section.jpg"
      alt="Couverture du magazine Le Carré des Études"
      class="absolute inset-0 hidden h-full w-full object-cover md:block"
    />
    <!-- Image mobile 9:16 — taille naturelle, pas de crop -->
    <img
      src="/images/hero/magazine.png"
      alt="Couverture du magazine Le Carré des Études"
      class="block w-full md:hidden"
    />
    <!-- H1 accessible (masqué car le titre est sur l'image) -->
    <h1 class="sr-only">Le Carré des Études — Guider, Informer, Inspirer</h1>
    <!-- Dégradé bas pour les CTA -->
    <!-- <div class="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-black/80 via-black/40 to-transparent" /> -->
    <!-- CTA (commenté pour inciter au scroll) -->
    <!--
    <div class="absolute inset-x-0 bottom-0 z-10 px-6 pb-16 sm:pb-20">
      <div class="mx-auto max-w-4xl text-center">
        <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
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
    -->
    <!-- Indicateur de scroll -->
    <div class="absolute inset-x-0 bottom-4 z-10 flex animate-bounce justify-center">
      <svg class="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
      </svg>
    </div>
  </section>
</template>
