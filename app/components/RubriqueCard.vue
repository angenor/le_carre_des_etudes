<script setup lang="ts">
defineProps<{
  id: number
  title: string
  description: string
  imagePath: string
}>()
</script>

<template>
  <div class="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-amber-500/5">
    <div class="aspect-[4/3] overflow-hidden bg-gray-800">
      <img
        :src="imagePath"
        :alt="title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div class="p-5">
      <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
      <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ description }}</p>
    </div>
  </div>
</template>
