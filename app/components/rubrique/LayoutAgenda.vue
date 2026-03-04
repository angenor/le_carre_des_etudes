<script setup lang="ts">
const props = defineProps<{
  id: number
  title: string
  description: string
  content: string | null
  eventDate: string | null
  eventLocation: string | null
  imagePath: string
}>()

const formattedDate = computed(() => {
  if (!props.eventDate) return null
  return new Date(props.eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const isPast = computed(() => {
  if (!props.eventDate) return false
  return new Date(props.eventDate) < new Date()
})
</script>

<template>
  <article class="overflow-hidden rounded-2xl bg-linear-to-br from-orange-500 to-amber-600">
    <div class="grid md:grid-cols-2">
      <!-- Image grande -->
      <div class="relative">
        <img
          :src="imagePath"
          :alt="title"
          class="h-64 w-full object-cover md:h-full md:min-h-87.5"
        />
        <div class="absolute inset-0 bg-linear-to-r from-transparent to-orange-500/40 md:block hidden" />
        <!-- Badge date -->
        <div v-if="formattedDate" class="absolute left-4 top-4 rounded-lg bg-white/95 px-3 py-2 text-center shadow-lg">
          <span class="block text-2xl font-black text-orange-600">
            {{ new Date(eventDate!).getDate() }}
          </span>
          <span class="block text-xs font-semibold text-gray-600 uppercase">
            {{ new Date(eventDate!).toLocaleDateString('fr-FR', { month: 'short' }) }}
          </span>
        </div>
        <span v-if="isPast" class="absolute right-4 top-4 rounded-full bg-gray-900/70 px-3 py-1 text-xs font-medium text-white">
          Passé
        </span>
      </div>

      <!-- Contenu -->
      <div class="p-6 md:p-10">
        <span class="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-widest text-white uppercase">
          Agenda & Opportunités
        </span>

        <h2 class="mt-2 text-2xl font-bold leading-tight text-white md:text-3xl">
          {{ title }}
        </h2>

        <!-- Infos événement -->
        <div class="mt-4 space-y-2">
          <div v-if="formattedDate" class="flex items-center gap-2 text-sm text-orange-100">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {{ formattedDate }}
          </div>
          <div v-if="eventLocation" class="flex items-center gap-2 text-sm text-orange-100">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            {{ eventLocation }}
          </div>
        </div>

        <p class="mt-4 leading-relaxed text-orange-50/90">
          {{ description }}
        </p>

        <div v-if="content" class="mt-4 text-sm leading-relaxed text-orange-50/80">
          <ToastViewer :content="content" />
        </div>

        <NuxtLink
          :to="`/rubriques/${id}`"
          class="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50"
        >
          En savoir plus
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
