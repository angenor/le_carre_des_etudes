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
    class="flex flex-col items-center gap-3 rounded-2xl border border-ink/10 bg-ink/5 p-6 backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-ink/10 hover:shadow-lg hover:shadow-gold/5"
  >
    <div class="flex h-24 w-24 items-center justify-center rounded-xl bg-white/90 p-3">
      <img
        :src="logoPath"
        :alt="`Logo ${name}`"
        class="max-h-full max-w-full object-contain"
      />
    </div>
    <p class="text-sm font-medium text-ink-soft text-center">{{ name }}</p>
  </component>
</template>
