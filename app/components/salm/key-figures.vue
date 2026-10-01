<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmKeyFigure } from '#shared/types/salm'

// Chiffres clés du SALM, toutes éditions confondues (back-office : SALM › Chiffres clés).
const props = defineProps<{ figures: SalmKeyFigure[] }>()

const columns = computed(() => {
  if (props.figures.length === 2) return 'md:grid-cols-2'
  if (props.figures.length === 4) return 'md:grid-cols-2 xl:grid-cols-4'
  return props.figures.length > 1 ? 'md:grid-cols-3' : ''
})
</script>

<template>
  <section aria-labelledby="salm-chiffres-titre" class="salm-figures relative isolate bg-salm-bg px-5 py-16 md:px-12 md:py-[100px] xl:px-24">
    <div class="flex flex-col gap-3 md:gap-4" data-motion="rise">
      <span class="font-salm-title text-xs font-bold tracking-[0.16em] text-salm-accent-text md:text-[13px]">TOUTES ÉDITIONS CONFONDUES</span>
      <h2 id="salm-chiffres-titre" class="font-salm-title text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] text-salm-ink md:text-[44px]">Le SALM en chiffres</h2>
    </div>
    <ul class="mt-10 grid grid-cols-1 gap-6 md:mt-14 md:gap-8" :class="columns" data-motion="count">
      <li
        v-for="(figure, i) in figures"
        :key="`${i}-${figure.value}`"
        class="salm-figure flex flex-col gap-3 border-t-2 border-salm-border pt-6 md:gap-4"
      >
        <!-- Numéro d'ordre en filigrane et trait sous le nombre : mode sombre seulement (salm.css) -->
        <span class="salm-figure-index" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="salm-figure-value font-salm-title text-[48px] leading-none font-extrabold tracking-[-0.04em] whitespace-nowrap text-salm-accent-text md:text-[64px]" data-count>{{ figure.value }}</span>
        <span class="salm-figure-rule" aria-hidden="true" />
        <span class="salm-figure-label text-base leading-snug text-salm-ink-soft md:text-lg">{{ figure.label }}</span>
      </li>
    </ul>
  </section>
</template>
