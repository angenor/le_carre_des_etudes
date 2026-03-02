<script setup lang="ts">
defineProps<{
  id: number
  title: string
  description: string
  imagePath: string
}>()
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
    <div class="aspect-[4/3] bg-gray-100">
      <img
        :src="imagePath"
        :alt="title"
        class="h-full w-full object-cover"
      />
    </div>
    <div class="p-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <p class="mt-2 text-sm leading-relaxed text-gray-600">{{ description }}</p>
    </div>
  </div>
</template>
