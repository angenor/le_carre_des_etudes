<script setup lang="ts">
defineProps<{
  id: number
  title: string
  description: string
  content: string | null
  subtitle: string | null
  imagePath: string
}>()
</script>

<template>
  <article class="overflow-hidden rounded-2xl bg-stone-900">
    <div class="grid md:grid-cols-5">
      <!-- Photo portrait -->
      <div class="relative md:col-span-2">
        <img
          :src="imagePath"
          :alt="title"
          class="h-64 w-full object-cover md:h-full md:min-h-100"
        />
        <div class="absolute inset-0 bg-linear-to-t from-stone-900/80 via-transparent to-transparent md:bg-linear-to-r md:from-transparent md:to-stone-900/60" />
      </div>

      <!-- Contenu texte -->
      <div class="relative p-6 md:col-span-3 md:p-10">
        <span class="mb-3 inline-block rounded-full bg-amber-900/40 px-3 py-1 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          Parcours Inspirant
        </span>

        <h2 class="mt-2 font-serif text-2xl font-bold leading-tight text-white md:text-3xl">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="mt-2 text-sm font-medium text-amber-400/80">
          {{ subtitle }}
        </p>

        <p class="mt-4 leading-relaxed text-stone-300">
          {{ description }}
        </p>

        <div v-if="content" class="mt-6 columns-1 gap-8 text-sm leading-relaxed text-stone-400 lg:columns-2">
          <ToastViewer :content="content" />
        </div>

        <NuxtLink
          :to="`/rubriques/${id}`"
          class="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600/20 px-4 py-2 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-600/30"
        >
          Lire la suite
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
