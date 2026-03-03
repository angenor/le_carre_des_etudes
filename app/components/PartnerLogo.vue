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
    class="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-amber-500/5"
  >
    <div class="flex h-24 w-24 items-center justify-center rounded-xl bg-white/90 p-3">
      <img
        :src="logoPath"
        :alt="`Logo ${name}`"
        class="max-h-full max-w-full object-contain"
      />
    </div>
    <p class="text-sm font-medium text-gray-300 text-center">{{ name }}</p>
  </component>
</template>
