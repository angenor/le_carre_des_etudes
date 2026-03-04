<script setup lang="ts">
interface ContentItemWithMagazine {
  id: number
  type: string
  imagePath: string
  order: number
  magazine: { id: number; slug: string; name: string } | null
}

type GroupedRubriques = Record<string, ContentItemWithMagazine[]>

const { data: rubriques } = useFetch<GroupedRubriques>('/api/rubriques')

const sectionLabels: Record<string, string> = {
  en_vedette: 'En Vedette',
  parcours_inspirant: 'Parcours Inspirant',
  agenda_et_opportunites: 'Agenda & Opportunités',
  focus: 'Focus',
}

const highlights = computed(() => {
  if (!rubriques.value) return []
  const items: (ContentItemWithMagazine & { sectionLabel: string })[] = []
  for (const key of ['en_vedette', 'parcours_inspirant', 'agenda_et_opportunites', 'focus']) {
    const sectionItems = rubriques.value[key] ?? []
    for (const item of sectionItems.slice(0, 2)) {
      items.push({ ...item, sectionLabel: sectionLabels[key] ?? key })
    }
    if (items.length >= 8) break
  }
  return items.slice(0, 8)
})

const hasContent = computed(() => highlights.value.length > 0)
</script>

<template>
  <section v-if="hasContent" class="relative overflow-hidden bg-gray-950 pb-20 pt-6 sm:pb-28 sm:pt-10">
    <!-- Fond décoratif -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(221,132,72,0.06),transparent_60%)]" />
    <svg class="absolute inset-0 h-full w-full opacity-[0.03]" aria-hidden="true">
      <defs>
        <pattern id="rubriques-home-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="rgba(251,191,36,0.3)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rubriques-home-grid)" />
    </svg>

    <div class="relative mx-auto max-w-6xl px-6">
      <!-- En-tête -->
      <div class="mb-14 text-center">
        <span class="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          Éditorial
        </span>

        <h2 class="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Nos
          <span class="bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
            rubriques
          </span>
        </h2>

        <p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-400">
          Interviews, portraits et contenus éditoriaux de nos dernières éditions
        </p>

        <!-- Séparateur -->
        <div class="mx-auto mt-8 flex items-center justify-center gap-3">
          <span class="h-px w-12 bg-linear-to-r from-transparent to-amber-500/50" />
          <svg class="h-3 w-3 rotate-45 text-amber-500/40" fill="currentColor" viewBox="0 0 16 16">
            <rect width="16" height="16" rx="2" />
          </svg>
          <span class="h-px w-12 bg-linear-to-l from-transparent to-amber-500/50" />
        </div>
      </div>

      <!-- Grille d'images -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
        <div
          v-for="item in highlights"
          :key="item.id"
          class="group"
        >
          <NuxtLink
            v-if="item.magazine?.slug"
            :to="`/magazine/${item.magazine.slug}`"
            class="block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
          >
            <div class="relative aspect-210/297 overflow-hidden bg-gray-800">
              <img
                :src="item.imagePath"
                :alt="`Rubrique ${item.sectionLabel}`"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <!-- Overlay catégorie au hover -->
              <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span class="text-xs font-medium text-amber-400">{{ item.sectionLabel }}</span>
              </div>
            </div>
          </NuxtLink>
          <div
            v-else
            class="block overflow-hidden rounded-xl border border-white/10 bg-white/5"
          >
            <div class="relative aspect-210/297 overflow-hidden bg-gray-800">
              <img
                :src="item.imagePath"
                :alt="`Rubrique ${item.sectionLabel}`"
                class="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-12 text-center">
        <NuxtLink
          to="/rubriques"
          class="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-8 py-3 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5"
        >
          Voir toutes les rubriques
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
