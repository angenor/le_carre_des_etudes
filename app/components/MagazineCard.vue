<script setup lang="ts">
defineProps<{
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
  <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
    <div class="aspect-[3/4] bg-gray-100">
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="`Couverture ${name} — ${version}`"
        class="h-full w-full object-cover"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-emerald-50"
      >
        <div class="text-center">
          <div class="text-4xl font-bold text-emerald-600">{{ version }}</div>
          <div class="mt-2 text-sm text-emerald-500">{{ name }}</div>
        </div>
      </div>
    </div>
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-lg font-semibold text-gray-900">{{ name }}</h3>
        <span class="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {{ version }}
        </span>
      </div>
      <p class="mt-2 text-sm leading-relaxed text-gray-600">{{ description }}</p>
      <p class="mt-2 text-xs text-gray-400">
        Publié le {{ formatDate(publishedAt) }}
      </p>
      <button
        type="button"
        class="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
        :class="pdfPath
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'cursor-not-allowed bg-gray-200 text-gray-400'"
        :disabled="!pdfPath"
        @click="pdfPath && $emit('download', id)"
      >
        {{ pdfPath ? 'Télécharger' : 'Bientôt disponible' }}
      </button>
    </div>
  </div>
</template>
