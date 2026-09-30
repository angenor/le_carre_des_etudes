<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmPublicPhoto } from '#shared/types/salm'

// Catalogue photos de l'édition précédente (FR-017) : aperçu de 4 photos, puis galerie dans une fenêtre.
// L'aperçu affiche la version web (`imagePath`), la galerie l'image d'origine quand elle existe (`originalPath`).
const props = defineProps<{ year: number; photos: SalmPublicPhoto[] }>()

const preview = computed(() => props.photos.slice(0, 4))
const remaining = computed(() => Math.max(0, props.photos.length - preview.value.length))

const galleryOpen = ref(false)
const index = ref(0)
// Photo suivante / précédente : elle glisse depuis le côté correspondant (aucun effet à l'ouverture)
const photoSlide = ref<'' | 'salm-slide-next' | 'salm-slide-prev'>('')
const photo = computed(() => props.photos[index.value])

function open(at = 0) {
  photoSlide.value = ''
  index.value = at
  galleryOpen.value = true
}

function go(delta: number) {
  photoSlide.value = delta > 0 ? 'salm-slide-next' : 'salm-slide-prev'
  const n = props.photos.length
  index.value = (index.value + delta + n) % n
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select')) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    go(1)
  }
  else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    go(-1)
  }
}

// Flèches ← → actives dès l'ouverture, où que soit le focus dans la fenêtre
watch(galleryOpen, (isOpen) => {
  if (isOpen) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

// Balayage tactile dans la galerie
let touchX: number | null = null
function onTouchStart(event: TouchEvent) {
  touchX = event.touches[0]?.clientX ?? null
}
function onTouchEnd(event: TouchEvent) {
  if (touchX === null) return
  const dx = (event.changedTouches[0]?.clientX ?? touchX) - touchX
  if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  touchX = null
}

// Position des 4 photos de l'aperçu (desktop) : grande photo à gauche, puis 3 petites
const cellClass = ['lg:col-span-2 lg:row-span-2', '', '', '']
const objectPosition = ['center', 'center 60%', 'center 25%', 'center 55%']
</script>

<template>
  <section id="photos" class="salm-band-mint scroll-mt-24 bg-salm-surface px-5 py-14 md:px-12 md:py-[88px] xl:px-24">
    <div class="flex flex-col gap-8 md:gap-10">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col gap-2.5 md:gap-3.5">
          <span class="font-salm-title text-xs font-bold tracking-[0.16em] text-salm-accent-text md:text-[13px]">CATALOGUE PHOTOS · ÉDITION {{ year }}</span>
          <h2 class="font-salm-title text-[32px] font-extrabold tracking-[-0.03em] text-salm-ink md:text-5xl">Les moments forts du salon</h2>
        </div>
        <button
          type="button"
          class="flex h-12 items-center gap-2.5 self-start rounded-xl border border-salm-line-strong px-5 text-[15px] font-semibold text-salm-ink-strong transition-colors hover:border-salm-ink-muted"
          @click="open(0)"
        >
          Voir tout le catalogue →
        </button>
      </div>

      <ul class="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-[230px_230px]" data-motion="toss">
        <li v-for="(p, i) in preview" :key="p.imagePath" :class="cellClass[i]">
          <button
            type="button"
            class="block size-full overflow-hidden rounded-[18px]"
            :class="`salm-frame-${i + 1}`"
            :aria-label="`Agrandir la photo : ${p.alt}`"
            @click="open(i)"
          >
            <img
              :src="p.imagePath"
              :alt="p.alt"
              loading="lazy"
              class="aspect-[4/3] size-full object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:scale-100 lg:aspect-auto"
              :style="{ objectPosition: objectPosition[i] }"
            >
          </button>
        </li>
        <li v-if="remaining > 0">
          <button
            type="button"
            class="salm-more flex size-full min-h-[120px] flex-col items-center justify-center gap-2 rounded-[18px] border-[1.5px] border-dashed border-salm-line-strong text-salm-ink-dim transition-colors hover:border-salm-ink-muted"
            @click="open(preview.length)"
          >
            <span class="font-salm-title text-[32px] font-extrabold text-salm-ink-strong">+ {{ remaining }}</span>
            <span class="text-sm">photo{{ remaining > 1 ? 's' : '' }} dans le catalogue</span>
          </button>
        </li>
      </ul>
    </div>

    <SalmModalDialog
      :open="galleryOpen"
      :title="`Catalogue photos · édition ${year}`"
      size="gallery"
      @close="galleryOpen = false"
    >
      <div
        v-if="photo"
        class="flex flex-col gap-3"
        @touchstart.passive="onTouchStart"
        @touchend="onTouchEnd"
      >
        <figure class="m-0 flex flex-col gap-2">
          <img
            :key="photo.imagePath"
            :src="photo.originalPath ?? photo.imagePath"
            :alt="photo.alt"
            class="max-h-[70dvh] w-full rounded-2xl bg-black object-contain"
            :class="photoSlide"
          >
          <figcaption class="text-sm text-stone-300">{{ photo.caption ?? photo.alt }}</figcaption>
        </figure>
        <div class="flex items-center justify-between gap-4">
          <button
            type="button"
            class="flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"
            @click="go(-1)"
          >
            <span aria-hidden="true">←</span> Photo précédente
          </button>
          <span class="text-sm tabular-nums text-stone-300" aria-live="polite">{{ index + 1 }} / {{ photos.length }}</span>
          <button
            type="button"
            class="flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"
            @click="go(1)"
          >
            Photo suivante <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </SalmModalDialog>
  </section>
</template>
