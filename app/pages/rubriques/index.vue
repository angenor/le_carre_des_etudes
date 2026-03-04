<script setup lang="ts">
interface ContentItemWithMagazine {
  id: number
  type: string
  title: string
  description: string
  content: string | null
  subtitle: string | null
  eventDate: string | null
  eventLocation: string | null
  imagePath: string
  order: number
  magazineId: number | null
  magazine: { id: number; slug: string; name: string } | null
  createdAt: string
  updatedAt: string
}

type GroupedRubriques = Record<string, ContentItemWithMagazine[]>

const { data: rubriques, status } = useFetch<GroupedRubriques>('/api/rubriques')

const ITEMS_PER_PAGE = 4

const sections = [
  { key: 'en_vedette', label: 'En Vedette' },
  { key: 'parcours_inspirant', label: 'Parcours Inspirant' },
  { key: 'agenda_et_opportunites', label: 'Agenda & Opportunités' },
  { key: 'focus', label: 'Focus' },
] as const

const visibleCounts = reactive<Record<string, number>>({
  en_vedette: ITEMS_PER_PAGE,
  parcours_inspirant: ITEMS_PER_PAGE,
  agenda_et_opportunites: ITEMS_PER_PAGE,
  focus: ITEMS_PER_PAGE,
})

function sectionItems(key: string) {
  return rubriques.value?.[key] ?? []
}

function visibleItems(key: string) {
  return sectionItems(key).slice(0, visibleCounts[key])
}

function hasMore(key: string): boolean {
  return sectionItems(key).length > visibleCounts[key]
}

function loadMore(key: string) {
  visibleCounts[key] += ITEMS_PER_PAGE
}

const hasAnyContent = computed(() => {
  if (!rubriques.value) return false
  return Object.values(rubriques.value).some((items) => items.length > 0)
})

useHead({
  title: 'Rubriques — Le Carré des Études',
})
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Hero section avec motifs SVG -->
    <section class="relative overflow-hidden bg-gray-950 pb-20 pt-32 sm:pb-28 sm:pt-40">
      <!-- Grille de points + radial glow -->
      <svg class="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="rubriques-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(251,191,36,0.12)" />
          </pattern>
          <radialGradient id="rubriques-fade" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stop-color="rgba(221,132,72,0.15)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#rubriques-grid)" />
        <rect width="100%" height="100%" fill="url(#rubriques-fade)" />
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
      <svg class="absolute right-10 top-32 h-20 w-20 rotate-45 text-amber-500/10 sm:right-20 sm:h-32 sm:w-32" aria-hidden="true">
        <rect width="100%" height="100%" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <svg class="absolute bottom-20 left-8 h-14 w-14 rotate-12 text-amber-400/8 sm:left-16 sm:h-20 sm:w-20" aria-hidden="true">
        <rect width="100%" height="100%" rx="4" fill="none" stroke="currentColor" stroke-width="1" />
      </svg>

      <!-- Contenu hero -->
      <div class="relative mx-auto max-w-5xl px-6 text-center">
        <span class="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          Éditorial
        </span>

        <h1 class="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Nos
          <span class="relative">
            <span class="relative z-10 bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
              rubriques
            </span>
            <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" aria-hidden="true">
              <path d="M1 5.5C40 2 80 2 100 4C120 6 160 6 199 3" stroke="#dd8448" stroke-width="2" stroke-linecap="round" opacity="0.5" />
            </svg>
          </span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
          Découvrez nos interviews, portraits et contenus éditoriaux
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

    <!-- Contenu -->
    <section class="relative pb-20 sm:pb-28">
      <div class="mx-auto max-w-6xl px-6">
        <!-- Chargement -->
        <div v-if="status === 'pending'" class="py-20 text-center">
          <div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
          <p class="mt-4 text-sm text-gray-500">Chargement des rubriques...</p>
        </div>

        <!-- État vide -->
        <div v-else-if="!hasAnyContent" class="py-20 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
            <svg class="h-8 w-8 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5" />
            </svg>
          </div>
          <h2 class="mt-5 text-lg font-semibold text-white">Aucune rubrique disponible</h2>
          <p class="mt-2 text-sm text-gray-500">Revenez bientôt pour découvrir nos contenus.</p>
        </div>

        <!-- Sections par type -->
        <div v-else class="space-y-16 md:space-y-24">
          <template v-for="section in sections" :key="section.key">
            <div v-if="sectionItems(section.key).length">
              <!-- En-tête de section -->
              <div class="mb-8">
                <h2 class="inline-block border-b-2 border-amber-500/60 pb-2 text-2xl font-bold text-white">
                  {{ section.label }}
                </h2>
              </div>

              <!-- Grille d'images A4 vertical -->
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <RubriqueCard
                  v-for="item in visibleItems(section.key)"
                  :key="item.id"
                  :image-path="item.imagePath"
                  :magazine-slug="item.magazine?.slug"
                />
              </div>

              <!-- Bouton Charger plus -->
              <div v-if="hasMore(section.key)" class="mt-8 text-center">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
                  @click="loadMore(section.key)"
                >
                  Charger plus
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>
