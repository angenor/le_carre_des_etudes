<script setup lang="ts">
const props = defineProps<{
  imagePath: string
  magazineSlug?: string | null
}>()

const linkTo = computed(() =>
  props.magazineSlug ? `/magazine/${props.magazineSlug}` : undefined,
)
</script>

<template>
  <component
    :is="linkTo ? resolveComponent('NuxtLink') : 'div'"
    :to="linkTo"
    class="group block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all"
    :class="linkTo ? 'cursor-pointer hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5' : ''"
  >
    <div class="relative aspect-210/297 overflow-hidden bg-gray-800">
      <img
        v-if="imagePath"
        :src="imagePath"
        alt="Rubrique"
        class="h-full w-full object-cover transition-transform duration-300"
        :class="linkTo ? 'group-hover:scale-105' : ''"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gray-800"
      >
        <svg class="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25a2.25 2.25 0 0 0-2.25-2.25H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      </div>
    </div>
  </component>
</template>
