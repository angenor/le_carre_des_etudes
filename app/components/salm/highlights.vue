<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmPublicHighlight } from '#shared/types/salm'

// « Programme d'activité » : temps forts de l'édition (FR-013).
const props = defineProps<{ highlights: SalmPublicHighlight[]; dayCount: number }>()

const NUMBERS = ['UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF', 'DIX']
const eyebrow = computed(() => {
  const count = (n: number) => NUMBERS[n - 1] ?? String(n)
  const days = props.dayCount > 1 ? `${count(props.dayCount)} JOURS` : 'UNE JOURNÉE'
  const n = props.highlights.length
  return `${days}, ${n === 1 ? 'UN TEMPS FORT' : `${count(n)} TEMPS FORTS`}`
})

// Mobile : carrousel horizontal, défilement aux flèches quand il a le focus (FR-010a)
const track = ref<HTMLElement>()
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  const el = track.value
  if (!el || el.scrollWidth <= el.clientWidth) return
  event.preventDefault()
  // Carte suivante / précédente par rapport à la position courante (animation : CSS motion-safe)
  const items = [...el.querySelectorAll('li')]
  const pad = Number.parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
  const offsets = items.map((li) => li.offsetLeft - el.offsetLeft - pad)
  const current = el.scrollLeft
  const target = event.key === 'ArrowRight'
    ? offsets.find((o) => o > current + 4) ?? offsets.at(-1)!
    : [...offsets].reverse().find((o) => o < current - 4) ?? 0
  el.scrollTo({ left: Math.max(0, target) })
}
</script>

<template>
  <section id="programme" class="scroll-mt-24 px-5 py-16 md:px-12 md:py-[100px] xl:px-24">
    <div class="flex flex-col gap-8 md:gap-12">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col gap-2.5 md:gap-3.5">
          <span class="font-salm-title text-xs font-bold tracking-[0.16em] text-salm-accent-text md:text-[13px]">{{ eyebrow }}</span>
          <h2 class="font-salm-title text-[32px] font-extrabold tracking-[-0.03em] text-[#F5F3EF] md:text-5xl">Programme d'activité</h2>
        </div>
        <a href="#chronogramme" class="text-[15px] font-semibold text-salm-accent-text hover:text-orange-300 md:text-base">Voir le chronogramme détaillé →</a>
      </div>

      <div
        ref="track"
        tabindex="0"
        role="region"
        aria-label="Programme d'activité"
        class="-mx-5 snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 pb-2 motion-safe:scroll-smooth md:mx-0 md:overflow-visible md:px-0 md:pb-0"
        @keydown="onKeydown"
      >
      <ul class="flex gap-4 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-5" data-motion="deal">
        <li v-for="item in highlights" :key="item.title" class="w-[78%] shrink-0 snap-start md:w-auto">
          <figure class="m-0 flex h-[360px] flex-col overflow-hidden rounded-[18px] bg-salm-surface-2 md:h-[392px]">
            <figcaption class="flex h-[72px] shrink-0 items-center justify-center bg-salm-accent px-4 text-center font-salm-title text-[15px] font-extrabold tracking-[0.04em] text-white">
              {{ item.title }}
            </figcaption>
            <img :src="item.imagePath" :alt="item.imageAlt" loading="lazy" width="460" height="930" class="min-h-0 w-full grow object-cover object-top">
          </figure>
        </li>
      </ul>
      </div>
    </div>
  </section>
</template>
