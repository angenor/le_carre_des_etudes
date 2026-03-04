<script setup lang="ts">
interface ContentItem {
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
  createdAt: string
  updatedAt: string
}

const route = useRoute()

const { data: item, status, error } = useFetch<ContentItem>(`/api/rubriques/${route.params.id}`)

useHead({
  title: computed(() => item.value ? `${item.value.title} — Le Carré des Études` : 'Rubrique — Le Carré des Études'),
})
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Chargement -->
    <div v-if="status === 'pending'" class="flex items-center justify-center py-40">
      <div class="text-center">
        <div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
        <p class="mt-4 text-sm text-gray-500">Chargement...</p>
      </div>
    </div>

    <!-- Erreur 404 -->
    <div v-else-if="error" class="flex items-center justify-center py-40">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white">404</h1>
        <p class="mt-2 text-gray-400">Rubrique non trouvée</p>
        <NuxtLink
          to="/rubriques"
          class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Retour aux rubriques
        </NuxtLink>
      </div>
    </div>

    <!-- Contenu -->
    <div v-else-if="item" class="pb-20 pt-28 sm:pt-32">
      <!-- Lien retour -->
      <div class="mx-auto max-w-6xl px-6">
        <NuxtLink
          to="/rubriques"
          class="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-amber-400"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Retour aux rubriques
        </NuxtLink>
      </div>

      <!-- Layout spécialisé selon le type -->
      <div class="mx-auto max-w-6xl px-6">
        <RubriqueLayoutParcours
          v-if="item.type === 'parcours_inspirant'"
          v-bind="item"
        />
        <RubriqueLayoutVedette
          v-else-if="item.type === 'en_vedette'"
          v-bind="item"
        />
        <RubriqueLayoutAgenda
          v-else-if="item.type === 'agenda_et_opportunites'"
          v-bind="item"
        />
        <RubriqueLayoutFocus
          v-else-if="item.type === 'focus'"
          v-bind="item"
        />
      </div>
    </div>
  </div>
</template>
