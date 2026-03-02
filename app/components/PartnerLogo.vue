<script setup lang="ts">
defineProps<{
  id: number
  name: string
  logoPath: string
  url?: string | null
}>()
</script>

<template>
  <component
    :is="url ? 'a' : 'div'"
    :href="url || undefined"
    :target="url ? '_blank' : undefined"
    :rel="url ? 'noopener noreferrer' : undefined"
    class="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
  >
    <div class="flex h-24 w-24 items-center justify-center">
      <img
        :src="logoPath"
        :alt="`Logo ${name}`"
        class="max-h-full max-w-full object-contain"
      />
    </div>
    <p class="text-sm font-medium text-gray-700 text-center">{{ name }}</p>
  </component>
</template>
