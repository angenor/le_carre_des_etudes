<script setup lang="ts">
interface ContentItem {
  id: number
  type: string
  title: string
  description: string
  imagePath: string
  order: number
}

type GroupedRubriques = Record<string, ContentItem[]>

const { data: rubriques, status } = useFetch<GroupedRubriques>('/api/rubriques')

const sections = [
  { key: 'portrait', label: 'Portrait' },
  { key: 'parcours_inspirant', label: 'Parcours Inspirant' },
  { key: 'en_vedette', label: 'En Vedette' },
]

const hasAnyContent = computed(() => {
  if (!rubriques.value) return false
  return Object.values(rubriques.value).some((items) => items.length > 0)
})

useHead({
  title: 'Rubriques — Le Carré des Études',
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">Nos rubriques</h1>
      <p class="mt-4 text-lg text-gray-600">
        Découvrez nos interviews, portraits et contenus éditoriaux
      </p>
    </div>

    <!-- Chargement -->
    <div v-if="status === 'pending'" class="py-16 text-center text-gray-500">
      Chargement des rubriques...
    </div>

    <!-- État vide -->
    <div v-else-if="!hasAnyContent" class="py-16 text-center">
      <p class="text-lg text-gray-500">Aucune rubrique disponible pour le moment.</p>
      <p class="mt-2 text-sm text-gray-400">Revenez bientôt pour découvrir nos contenus.</p>
    </div>

    <!-- Sections par type -->
    <div v-else class="space-y-16">
      <template v-for="section in sections" :key="section.key">
        <section v-if="rubriques?.[section.key]?.length">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-emerald-500 pb-2 inline-block">
            {{ section.label }}
          </h2>
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <RubriqueCard
              v-for="item in rubriques[section.key]"
              :key="item.id"
              :id="item.id"
              :title="item.title"
              :description="item.description"
              :image-path="item.imagePath"
            />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
