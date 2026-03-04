<script setup lang="ts">
useHead({
  title: 'Nos magazines — Le Carré des Études',
})

interface Magazine {
  id: number
  name: string
  description: string
  version: string
  pdfPath: string | null
  coverImage: string | null
  publishedAt: string
}

const { data: magazines, status } = useFetch<Magazine[]>('/api/magazines')

const selectedMagazine = ref<Magazine | null>(null)

function openDownloadModal(magazineId: number) {
  const magazine = magazines.value?.find((m) => m.id === magazineId)
  if (magazine) {
    selectedMagazine.value = magazine
  }
}

function closeDownloadModal() {
  selectedMagazine.value = null
}

// Refs GSAP
const heroContentRef = ref<HTMLElement>()
const losange1 = ref<HTMLElement>()
const losange2 = ref<HTMLElement>()
const gridRef = ref<HTMLElement>()
const pageRef = ref<HTMLElement>()

let gsapCtx: ReturnType<typeof useGsap.context> | null = null

function initAnimations() {
  gsapCtx?.revert()
  if (!pageRef.value) return

  gsapCtx = useGsap.context(() => {
    // Hero — stagger des enfants
    if (heroContentRef.value) {
      useGsap.from(heroContentRef.value.children, {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
      })
    }

    // Losanges décoratifs — rotation flottante continue
    if (losange1.value) {
      useGsap.fromTo(losange1.value,
        { rotation: 45, y: 0 },
        { rotation: 55, y: -10, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true },
      )
    }
    if (losange2.value) {
      useGsap.fromTo(losange2.value,
        { rotation: 12, y: 0 },
        { rotation: 0, y: 10, duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true },
      )
    }

    // Grille de magazines — stagger en vague
    if (gridRef.value) {
      useGsap.from(gridRef.value.children, {
        y: 60, opacity: 0, scale: 0.9, duration: 0.6,
        stagger: { each: 0.1, from: 'start' },
        ease: 'back.out(1.4)',
        scrollTrigger: { trigger: gridRef.value, start: 'top 85%', toggleActions: 'play none none reset' },
      })
    }
  }, pageRef.value)

  useScrollTrigger.refresh()
}

onMounted(() => {
  const stop = watch(
    () => [pageRef.value, gridRef.value],
    async ([page, grid]) => {
      if (!page) return
      // Attendre que la grille soit aussi rendue (conditionnelle v-else)
      if (!grid && status.value !== 'pending') {
        await nextTick()
      }
      await nextTick()
      stop()
      initAnimations()
    },
    { immediate: true },
  )
})

onUnmounted(() => {
  gsapCtx?.revert()
})
</script>

<template>
  <div ref="pageRef" class="min-h-screen bg-gray-950">
    <!-- Hero section avec motifs SVG -->
    <section class="relative overflow-hidden bg-gray-950 pb-20 pt-32 sm:pb-28 sm:pt-40">
      <!-- Grille de points + radial glow -->
      <svg class="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(251,191,36,0.12)" />
          </pattern>
          <radialGradient id="hero-fade" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stop-color="rgba(221,132,72,0.15)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
        <rect width="100%" height="100%" fill="url(#hero-fade)" />
      </svg>

      <!-- Lignes diagonales -->
      <svg class="absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
        <line x1="0%" y1="100%" x2="60%" y2="0%" stroke="#dd8448" stroke-width="1" />
        <line x1="20%" y1="100%" x2="80%" y2="0%" stroke="#dd8448" stroke-width="1" />
        <line x1="40%" y1="100%" x2="100%" y2="0%" stroke="#dd8448" stroke-width="1" />
        <line x1="60%" y1="100%" x2="100%" y2="20%" stroke="#dd8448" stroke-width="1" />
      </svg>

      <!-- Halos lumineux -->
      <div class="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
      <div class="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-amber-400/5 blur-3xl" />

      <!-- Losanges décoratifs -->
      <svg ref="losange1" class="absolute right-10 top-32 h-20 w-20 rotate-45 text-amber-500/10 sm:right-20 sm:h-32 sm:w-32" aria-hidden="true">
        <rect width="100%" height="100%" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <svg ref="losange2" class="absolute bottom-20 left-8 h-14 w-14 rotate-12 text-amber-400/8 sm:left-16 sm:h-20 sm:w-20" aria-hidden="true">
        <rect width="100%" height="100%" rx="4" fill="none" stroke="currentColor" stroke-width="1" />
      </svg>

      <!-- Contenu hero -->
      <div ref="heroContentRef" class="relative mx-auto max-w-5xl px-6 text-center">
        <span class="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          Collection
        </span>

        <h1 class="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Nos
          <span class="relative">
            <span class="relative z-10 bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
              magazines
            </span>
            <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" aria-hidden="true">
              <path d="M1 5.5C40 2 80 2 100 4C120 6 160 6 199 3" stroke="#dd8448" stroke-width="2" stroke-linecap="round" opacity="0.5" />
            </svg>
          </span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
          Téléchargez gratuitement les numéros du Carré des Études.
          Remplissez un court formulaire pour accéder au PDF.
        </p>

        <!-- Séparateur -->
        <div class="mx-auto mt-10 flex items-center justify-center gap-3">
          <span class="h-px w-12 bg-linear-to-r from-transparent to-amber-500/50" />
          <svg class="h-4 w-4 rotate-45 text-amber-500/40" fill="currentColor" viewBox="0 0 16 16">
            <rect width="16" height="16" rx="2" />
          </svg>
          <span class="h-px w-12 bg-linear-to-l from-transparent to-amber-500/50" />
        </div>
      </div>
    </section>

    <!-- Liste des magazines -->
    <section class="relative pb-20 sm:pb-28">
      <div class="mx-auto max-w-6xl px-6">
        <!-- Chargement -->
        <div v-if="status === 'pending'" class="py-20 text-center">
          <div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
          <p class="mt-4 text-sm text-gray-500">Chargement des magazines...</p>
        </div>

        <!-- Liste vide -->
        <div v-else-if="!magazines?.length" class="py-20 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
            <svg class="h-8 w-8 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 class="mt-5 text-lg font-semibold text-white">Aucun magazine disponible</h2>
          <p class="mt-2 text-sm text-gray-500">
            Les prochains numéros du Carré des Études seront bientôt disponibles.
          </p>
        </div>

        <!-- Grille de magazines -->
        <div v-else ref="gridRef" class="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 items-start lg:gap-16">
          <MagazineCard
            v-for="magazine in magazines"
            :key="magazine.id"
            :id="magazine.id"
            :name="magazine.name"
            :description="magazine.description"
            :version="magazine.version"
            :cover-image="magazine.coverImage"
            :published-at="magazine.publishedAt"
            :pdf-path="magazine.pdfPath"
            @download="openDownloadModal"
          />
        </div>
      </div>
    </section>

    <!-- Modale de téléchargement -->
    <DownloadModal
      v-if="selectedMagazine"
      :magazine-id="selectedMagazine.id"
      :magazine-name="`${selectedMagazine.name} — ${selectedMagazine.version}`"
      @close="closeDownloadModal"
    />
  </div>
</template>
