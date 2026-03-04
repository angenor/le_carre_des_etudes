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
  <article class="overflow-hidden rounded-2xl border border-blue-200/30 bg-blue-50/50">
    <!-- En-tête -->
    <div class="border-b border-blue-200/50 bg-white px-6 py-3 md:px-10">
      <span class="text-xs font-black tracking-[0.3em] text-blue-700 uppercase">
        Focus
      </span>
      <div class="mt-1 h-0.5 w-8 bg-blue-600" />
    </div>

    <div class="grid md:grid-cols-5">
      <!-- Contenu texte -->
      <div class="order-2 p-6 md:order-1 md:col-span-3 md:p-10">
        <h2 class="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
          {{ title }}
        </h2>

        <p class="mt-4 text-base leading-relaxed text-gray-600">
          {{ description }}
        </p>

        <div v-if="content" class="mt-6 columns-1 gap-8 text-sm leading-relaxed text-gray-500 lg:columns-2">
          <ToastViewer :content="content" />
        </div>

        <NuxtLink
          :to="`/rubriques/${id}`"
          class="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Lire l'article
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>

      <!-- Photo -->
      <div class="relative order-1 md:order-2 md:col-span-2">
        <img
          :src="imagePath"
          :alt="title"
          class="h-64 w-full object-cover md:h-full md:min-h-87.5"
        />
      </div>
    </div>
  </article>
</template>
