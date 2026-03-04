<script setup lang="ts">
interface Magazine {
  id: number
  name: string
  description: string
  version: string
  slug: string
  subtitle: string | null
  pdfPath: string | null
  coverImage: string | null
  coverImageOg: string | null
  publishedAt: string
  availableAt: string | null
  isFeatured: boolean
}

const route = useRoute()
const param = route.params.id as string
const isNumeric = /^\d+$/.test(param)
const apiUrl = isNumeric ? `/api/magazines/${param}` : `/api/magazines/by-slug/${param}`

const { data: magazine, status } = useFetch<Magazine>(apiUrl)

useHead({
  title: computed(() =>
    magazine.value
      ? `${magazine.value.name} — ${magazine.value.version}`
      : 'Magazine — Le Carré des Études',
  ),
})

useSeoMeta({
  ogTitle: computed(() =>
    magazine.value
      ? `${magazine.value.name} — ${magazine.value.version}`
      : 'Magazine — Le Carré des Études',
  ),
  ogDescription: computed(() => magazine.value?.description || 'Découvrez les magazines du Carré des Études'),
  ogImage: computed(() => magazine.value?.coverImageOg || magazine.value?.coverImage || ''),
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: computed(() =>
    magazine.value
      ? `${magazine.value.name} — ${magazine.value.version}`
      : 'Magazine — Le Carré des Études',
  ),
  twitterDescription: computed(() => magazine.value?.description || 'Découvrez les magazines du Carré des Études'),
  twitterImage: computed(() => magazine.value?.coverImageOg || magazine.value?.coverImage || ''),
})

const showDownloadModal = ref(false)

// Compte à rebours
const now = useState(`countdown-detail-${route.params.id}`, () => new Date())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const countdown = computed(() => {
  if (!magazine.value?.availableAt) return null

  const diff = new Date(magazine.value.availableAt).getTime() - now.value.getTime()
  if (diff <= 0) return null

  const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
  const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secondes = Math.floor((diff % (1000 * 60)) / 1000)

  return { jours, heures, minutes, secondes }
})

const estDisponible = computed(() => {
  if (!magazine.value) return false
  if (!magazine.value.availableAt) return true
  return new Date(magazine.value.availableAt).getTime() <= now.value.getTime()
})

const dateDisponibiliteFormatee = computed(() => {
  if (!magazine.value?.availableAt) return null
  return new Date(magazine.value.availableAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Chargement -->
    <div v-if="status === 'pending'" class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
        <p class="mt-4 text-sm text-gray-500">Chargement...</p>
      </div>
    </div>

    <!-- Erreur / non trouvé -->
    <div v-else-if="!magazine" class="flex min-h-screen items-center justify-center px-6">
      <div class="text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
          <svg class="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 class="mt-5 text-xl font-semibold text-white">Magazine introuvable</h1>
        <p class="mt-2 text-sm text-gray-500">Ce magazine n'existe pas ou a été retiré.</p>
        <NuxtLink
          to="/magazine"
          class="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Retour aux magazines
        </NuxtLink>
      </div>
    </div>

    <!-- Contenu magazine -->
    <template v-else>
      <!-- Hero -->
      <section class="relative overflow-hidden bg-gray-950 pb-20 pt-32 sm:pt-36">
        <!-- Motifs -->
        <svg class="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <pattern id="detail-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(251,191,36,0.08)" />
            </pattern>
            <radialGradient id="detail-fade" cx="30%" cy="40%" r="50%">
              <stop offset="0%" stop-color="rgba(221,132,72,0.12)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#detail-grid)" />
          <rect width="100%" height="100%" fill="url(#detail-fade)" />
        </svg>

        <!-- Halos -->
        <div class="absolute -left-20 top-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />

        <div class="relative mx-auto max-w-6xl px-6">
          <!-- Breadcrumb -->
          <nav class="mb-10">
            <NuxtLink
              to="/magazine"
              class="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-amber-400"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Tous les magazines
            </NuxtLink>
          </nav>

          <!-- Layout 2 colonnes -->
          <div class="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
            <!-- Couverture -->
            <div class="relative flex w-full max-w-sm shrink-0 justify-center lg:w-80">
              <!-- Electric border (si à la une) -->
              <template v-if="magazine.isFeatured">
                <svg class="absolute h-0 w-0" aria-hidden="true">
                  <defs>
                    <filter id="detail-turbulent-displace" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
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
                  <div class="electric-content">
                    <img
                      v-if="magazine.coverImage"
                      :src="magazine.coverImage"
                      :alt="`Couverture ${magazine.name} — ${magazine.version}`"
                      class="h-full w-full rounded-[22px] object-cover"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center rounded-[22px] bg-linear-to-br from-gray-800 to-gray-900"
                    >
                      <div class="text-center">
                        <div class="text-5xl font-bold text-amber-400">{{ magazine.version }}</div>
                        <div class="mt-3 text-base text-gray-500">{{ magazine.name }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Couverture normale (pas à la une) -->
              <div v-else class="w-full overflow-hidden rounded-2xl border border-gray-800 shadow-2xl shadow-black/50">
                <img
                  v-if="magazine.coverImage"
                  :src="magazine.coverImage"
                  :alt="`Couverture ${magazine.name} — ${magazine.version}`"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex aspect-3/4 w-full items-center justify-center bg-linear-to-br from-gray-800 to-gray-900"
                >
                  <div class="text-center">
                    <div class="text-5xl font-bold text-amber-400">{{ magazine.version }}</div>
                    <div class="mt-3 text-base text-gray-500">{{ magazine.name }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Détails -->
            <div class="flex-1">
              <!-- Badge version -->
              <span class="inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold tracking-wider text-amber-400">
                {{ magazine.version }}
              </span>

              <h1 class="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {{ magazine.name }}
              </h1>

              <p v-if="magazine.subtitle" class="mt-2 text-lg font-medium text-amber-400/80">
                {{ magazine.subtitle }}
              </p>

              <p class="mt-2 text-sm text-gray-500">
                Publié le {{ formatDate(magazine.publishedAt) }}
              </p>

              <!-- Séparateur -->
              <div class="my-6 h-px bg-linear-to-r from-amber-500/20 via-gray-800 to-transparent" />

              <p class="max-w-xl text-base leading-relaxed text-gray-400">
                {{ magazine.description }}
              </p>

              <!-- Compte à rebours -->
              <div v-if="countdown" class="mt-8 w-full max-w-md">
                <p class="mb-4 text-sm font-medium tracking-wide text-gray-500 uppercase">
                  Disponible le {{ dateDisponibiliteFormatee }}
                </p>
                <div class="grid grid-cols-4 gap-3">
                  <div
                    v-for="bloc in [
                      { valeur: countdown.jours, label: 'Jours' },
                      { valeur: countdown.heures, label: 'Heures' },
                      { valeur: countdown.minutes, label: 'Min' },
                      { valeur: countdown.secondes, label: 'Sec' },
                    ]"
                    :key="bloc.label"
                    class="flex flex-col items-center gap-1.5 rounded-2xl border border-amber-500/15 bg-white/4 px-2 py-3"
                  >
                    <span class="bg-linear-to-b from-amber-400 to-amber-600 bg-clip-text text-[28px] font-bold leading-none tracking-tight text-transparent">
                      {{ String(bloc.valeur).padStart(2, '0') }}
                    </span>
                    <span class="text-[11px] font-medium uppercase tracking-wider text-white/40">{{ bloc.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <!-- Télécharger -->
                <button
                  v-if="estDisponible && magazine.pdfPath"
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold tracking-wide text-gray-900 uppercase shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-400/30"
                  @click="showDownloadModal = true"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Télécharger gratuitement
                </button>

                <span
                  v-else
                  class="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-8 py-3.5 text-sm font-bold tracking-wide text-gray-500 uppercase"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Bientôt disponible
                </span>

                <!-- Retour -->
                <NuxtLink
                  to="/magazine"
                  class="inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-3.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
                >
                  Voir tous les numéros
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

    <!-- Modale de téléchargement -->
    <DownloadModal
      v-if="showDownloadModal && magazine"
      :magazine-id="magazine.id"
      :magazine-name="`${magazine.name} — ${magazine.version}`"
      @close="showDownloadModal = false"
    />
  </div>
</template>

<style scoped>
/* Electric border — identique à AlaUneSection */
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

.electric-inner {
  position: relative;
}

.electric-border-outer {
  border: 2px solid rgba(221, 132, 72, 0.5);
  border-radius: 24px;
  padding-right: 4px;
  padding-bottom: 4px;
}

.electric-main-border {
  width: 280px;
  aspect-ratio: 583 / 828;
  border-radius: 24px;
  border: 2px solid #dd8448;
  margin-top: -4px;
  margin-left: -4px;
  filter: url(#detail-turbulent-displace);
}

@media (min-width: 640px) {
  .electric-main-border {
    width: 320px;
  }
}

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
