<script setup lang="ts">
const props = defineProps<{
  id: number
  type: string
  title: string
  description: string
  imagePath: string
  subtitle?: string | null
  eventDate?: string | null
  eventLocation?: string | null
}>()

const typeConfig = computed(() => {
  switch (props.type) {
    case 'parcours_inspirant':
      return {
        label: 'Parcours Inspirant',
        badgeClass: 'bg-amber-900/40 text-amber-400',
        borderHover: 'hover:border-amber-500/30 hover:shadow-amber-500/5',
        accentClass: 'text-amber-400',
      }
    case 'en_vedette':
      return {
        label: 'En Vedette',
        badgeClass: 'bg-orange-100 text-orange-700',
        borderHover: 'hover:border-orange-400/30 hover:shadow-orange-400/5',
        accentClass: 'text-orange-400',
      }
    case 'agenda_et_opportunites':
      return {
        label: 'Agenda & Opportunités',
        badgeClass: 'bg-orange-500/20 text-orange-300',
        borderHover: 'hover:border-orange-500/30 hover:shadow-orange-500/5',
        accentClass: 'text-orange-400',
      }
    case 'focus':
      return {
        label: 'Focus',
        badgeClass: 'bg-blue-900/40 text-blue-400',
        borderHover: 'hover:border-blue-500/30 hover:shadow-blue-500/5',
        accentClass: 'text-blue-400',
      }
    default:
      return {
        label: props.type,
        badgeClass: 'bg-gray-800 text-gray-400',
        borderHover: 'hover:border-gray-500/30 hover:shadow-gray-500/5',
        accentClass: 'text-gray-400',
      }
  }
})

const formattedDate = computed(() => {
  if (!props.eventDate) return null
  return new Date(props.eventDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})
</script>

<template>
  <NuxtLink
    :to="`/rubriques/${id}`"
    class="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:shadow-lg"
    :class="typeConfig.borderHover"
  >
    <div class="relative aspect-4/3 overflow-hidden bg-gray-800">
      <img
        :src="imagePath"
        :alt="title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span
        class="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        :class="typeConfig.badgeClass"
      >
        {{ typeConfig.label }}
      </span>
    </div>
    <div class="p-4 sm:p-5">
      <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
      <p v-if="subtitle && type === 'parcours_inspirant'" class="mt-1 text-xs font-medium" :class="typeConfig.accentClass">
        {{ subtitle }}
      </p>
      <div v-if="type === 'agenda_et_opportunites' && (formattedDate || eventLocation)" class="mt-2 space-y-1">
        <p v-if="formattedDate" class="flex items-center gap-1.5 text-xs text-orange-300">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {{ formattedDate }}
        </p>
        <p v-if="eventLocation" class="flex items-center gap-1.5 text-xs text-orange-300">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          {{ eventLocation }}
        </p>
      </div>
      <p class="mt-2 text-sm leading-relaxed text-gray-400 line-clamp-3">{{ description }}</p>
    </div>
  </NuxtLink>
</template>
