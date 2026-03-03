<script setup lang="ts">
// Données placeholder — à remplacer par un fetch API
const edition = {
  numero: 'N°01',
  titre: 'Le Carré des Études',
  sousTitre: 'Édition inaugurale',
  description:
    'Découvrez notre tout premier numéro : orientation post-bac, bourses disponibles, conseils de réussite et portraits d\'étudiants inspirants de Côte d\'Ivoire.',
  datePublication: 'Mars 2026',
  pdfUrl: '#',
}
</script>

<template>
  <section class="relative overflow-hidden bg-gray-950 py-20 sm:py-28">
    <!-- Fond subtil -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(221,132,72,0.08),transparent_60%)]" />

    <div class="relative mx-auto max-w-6xl px-6">
      <!-- Titre de section -->
      <div class="mb-14 text-center">
        <span class="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          À la une
        </span>
      </div>

      <!-- Contenu principal -->
      <div class="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
        <!-- Gauche : magazine avec electric border -->
        <div class="relative flex shrink-0 justify-center">
          <!-- SVG Filter -->
          <svg class="absolute h-0 w-0" aria-hidden="true">
            <defs>
              <filter id="turbulent-displace" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                  <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                  <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
                  <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
                  <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

                <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
              </filter>
            </defs>
          </svg>

          <!-- Card avec electric border -->
          <div class="electric-card">
            <div class="electric-inner">
              <div class="electric-border-outer">
                <div class="electric-main-border" />
              </div>
              <div class="electric-glow-1" />
              <div class="electric-glow-2" />
            </div>

            <div class="electric-overlay-1" />
            <div class="electric-overlay-2" />
            <div class="electric-bg-glow" />

            <!-- Image du magazine -->
            <div class="electric-content">
              <img
                src="/images/hero/magazine.png"
                alt="Couverture du magazine Le Carré des Études — Édition N°01"
                class="h-full w-full rounded-[22px] object-cover"
              />
            </div>
          </div>
        </div>

        <!-- Droite : infos édition -->
        <div class="flex flex-col items-center text-center lg:items-start lg:text-left">
          <!-- Badge numéro -->
          <span class="inline-block rounded-full bg-amber-500/15 px-4 py-1 text-sm font-bold tracking-wider text-amber-400">
            {{ edition.numero }}
          </span>

          <!-- Titre -->
          <h2 class="mt-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {{ edition.titre }}
          </h2>
          <p class="mt-2 text-lg font-medium text-amber-400/80">
            {{ edition.sousTitre }}
          </p>

          <!-- Description -->
          <p class="mt-6 max-w-lg text-base leading-relaxed text-gray-400">
            {{ edition.description }}
          </p>

          <!-- Date -->
          <p class="mt-4 text-sm text-gray-500">
            Publié en {{ edition.datePublication }}
          </p>

          <!-- Boutons -->
          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <!-- Bouton principal : Télécharger -->
            <a
              :href="edition.pdfUrl"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold tracking-wide text-gray-900 uppercase shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-400/30"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Télécharger
            </a>

            <!-- Bouton secondaire : Voir les détails -->
            <NuxtLink
              to="/magazine"
              class="inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-3.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Voir les détails
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Electric border variables */
:root {
  --electric-border-color: #dd8448;
}

/* Card container */
.electric-card {
  padding: 2px;
  border-radius: 24px;
  position: relative;
  background: linear-gradient(
      -30deg,
      oklch(from #dd8448 0.3 calc(c / 2) h / 0.4),
      transparent,
      oklch(from #dd8448 0.3 calc(c / 2) h / 0.4)
    ),
    linear-gradient(to bottom, oklch(0.185 0 0), oklch(0.185 0 0));
}

/* Inner container */
.electric-inner {
  position: relative;
}

/* Border layers */
.electric-border-outer {
  border: 2px solid rgba(221, 132, 72, 0.5);
  border-radius: 24px;
  padding-right: 4px;
  padding-bottom: 4px;
}

.electric-main-border {
  width: 280px;
  height: 498px;
  border-radius: 24px;
  border: 2px solid #dd8448;
  margin-top: -4px;
  margin-left: -4px;
  filter: url(#turbulent-displace);
}

@media (min-width: 640px) {
  .electric-main-border {
    width: 320px;
    height: 569px;
  }
}

/* Glow effects */
.electric-glow-1 {
  border: 2px solid rgba(221, 132, 72, 0.6);
  border-radius: 24px;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  filter: blur(1px);
}

.electric-glow-2 {
  border: 2px solid #dd8448;
  border-radius: 24px;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  filter: blur(4px);
}

/* Overlay effects */
.electric-overlay-1 {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  mix-blend-mode: overlay;
  transform: scale(1.1);
  filter: blur(16px);
  background: linear-gradient(-30deg, white, transparent 30%, transparent 70%, white);
}

.electric-overlay-2 {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  opacity: 0.5;
  mix-blend-mode: overlay;
  transform: scale(1.1);
  filter: blur(16px);
  background: linear-gradient(-30deg, white, transparent 30%, transparent 70%, white);
}

/* Background glow */
.electric-bg-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  filter: blur(32px);
  transform: scale(1.1);
  opacity: 0.3;
  z-index: -1;
  background: linear-gradient(-30deg, #dd8448, transparent, #dd8448);
}

/* Content (image) container */
.electric-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 2px;
  border-radius: 24px;
  overflow: hidden;
}
</style>
