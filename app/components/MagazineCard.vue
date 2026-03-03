<script setup lang="ts">
const props = defineProps<{
  id: number
  name: string
  description: string
  version: string
  coverImage?: string | null
  publishedAt: string
  pdfPath?: string | null
}>()

defineEmits<{
  download: [magazineId: number]
}>()

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="group overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5">
    <!-- Couverture -->
    <NuxtLink :to="`/magazine/${id}`" class="block">
      <div class="aspect-3/4 overflow-hidden bg-gray-800">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="`Couverture ${name} — ${version}`"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-linear-to-br from-gray-800 to-gray-900"
        >
          <div class="text-center">
            <div class="text-4xl font-bold text-amber-400">{{ version }}</div>
            <div class="mt-2 text-sm text-gray-500">{{ name }}</div>
          </div>
        </div>
      </div>
    </NuxtLink>

    <!-- Infos -->
    <div class="p-5">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-lg font-semibold text-white">{{ name }}</h3>
        <span class="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
          {{ version }}
        </span>
      </div>
      <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ description }}</p>
      <p class="mt-2 text-xs text-gray-600">
        Publié le {{ formatDate(publishedAt) }}
      </p>

      <!-- Actions -->
      <div class="mt-4 flex items-center gap-3">
        <button
          type="button"
          class="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          :class="pdfPath
            ? 'bg-amber-500 text-gray-900 hover:bg-amber-400'
            : 'cursor-not-allowed bg-white/5 text-gray-600'"
          :disabled="!pdfPath"
          @click="pdfPath && $emit('download', id)"
        >
          {{ pdfPath ? 'Télécharger' : 'Bientôt disponible' }}
        </button>
        <NuxtLink
          :to="`/magazine/${id}`"
          class="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-white"
        >
          Détails
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
