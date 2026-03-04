<script setup lang="ts">
defineProps<{
  id: number
  title: string
  description: string
  content: string | null
  imagePath: string
}>()
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-orange-200/30 bg-orange-50">
    <!-- En-tête style journal -->
    <div class="border-b border-orange-200/50 bg-white px-6 py-3 md:px-10">
      <span class="text-xs font-black tracking-[0.3em] text-orange-600 uppercase">
        En Vedette
      </span>
      <div class="mt-1 h-0.5 w-12 bg-orange-500" />
    </div>

    <div class="grid md:grid-cols-2">
      <!-- Image -->
      <div class="relative">
        <img
          :src="imagePath"
          :alt="title"
          class="h-64 w-full object-cover md:h-full md:min-h-87.5"
        />
      </div>

      <!-- Contenu -->
      <div class="p-6 md:p-10">
        <h2 class="font-serif text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
          {{ title }}
        </h2>

        <p class="mt-4 text-base leading-relaxed text-gray-600">
          {{ description }}
        </p>

        <div v-if="content" class="mt-6 text-sm leading-relaxed text-gray-500">
          <ToastViewer :content="content" />
        </div>

        <NuxtLink
          :to="`/rubriques/${id}`"
          class="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          Lire l'article
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
