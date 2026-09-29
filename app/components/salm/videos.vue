<script setup lang="ts">
import '~/assets/css/salm.css'
import type { SalmPublicVideo } from '#shared/types/salm'

// « Le canapé du SALM <année précédente> » (FR-006, FR-016) : miniatures, puis lecture dans une fenêtre.
const props = defineProps<{ year: number; videos: SalmPublicVideo[] }>()

const current = ref<number | null>(null)
const video = computed(() => (current.value === null ? null : props.videos[current.value] ?? null))

function num(index: number) {
  return String(index + 1).padStart(2, '0')
}

function label(v: SalmPublicVideo, index: number) {
  return v.title ?? `Vidéo ${num(index)}`
}

const countWords = ['Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix']
const intro = computed(() => {
  const n = props.videos.length
  const count = countWords[n - 1] ?? String(n)
  return `${count} entretien${n > 1 ? 's' : ''} enregistré${n > 1 ? 's' : ''} pendant l'édition ${props.year}. Chaque vidéo s'ouvre dans une fenêtre, sans quitter la page.`
})
</script>

<template>
  <section id="canape" class="scroll-mt-24 px-5 py-14 md:px-12 md:py-[100px] xl:px-24">
    <div class="flex flex-col gap-6 md:gap-11">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex flex-col gap-2.5 md:gap-3.5">
          <span class="hidden font-salm-title text-[13px] font-bold tracking-[0.16em] text-salm-accent-text md:block">LES VIDÉOS</span>
          <h2 class="font-salm-title text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] text-[#F5F3EF] md:text-5xl md:tracking-[-0.03em]">Le canapé du SALM {{ year }}</h2>
        </div>
        <a href="#canape" class="text-sm font-semibold text-salm-accent-text hover:text-orange-300 md:hidden">{{ videos.length }} vidéo{{ videos.length > 1 ? 's' : '' }} →</a>
        <p class="max-w-[420px] text-[15px] leading-[1.55] text-stone-400 md:text-base">{{ intro }}</p>
      </div>

      <ul class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3" data-motion="pop">
        <li v-for="(v, i) in videos" :key="v.youtubeId + i">
          <button
            type="button"
            :aria-label="`Lire la vidéo ${num(i)} — ${label(v, i)}`"
            class="group relative block h-[180px] w-full overflow-hidden rounded-2xl border border-salm-border bg-salm-surface-2 text-left text-[#F5F3EF] md:h-[225px]"
            @click="current = i"
          >
            <img :src="v.thumbnailUrl" alt="" loading="lazy" class="absolute inset-0 size-full object-cover opacity-40 transition-opacity group-hover:opacity-55">
            <span class="absolute top-3 left-4 font-salm-title text-5xl font-extrabold tracking-[-0.04em] text-white/25 md:top-[18px] md:left-5 md:text-[64px]" aria-hidden="true">{{ num(i) }}</span>
            <span class="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-salm-accent text-white md:top-5 md:right-5 md:size-[52px]" aria-hidden="true">
              <svg class="size-4 md:size-[18px]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            </span>
            <span class="absolute right-4 bottom-3.5 left-4 flex flex-col gap-1 md:right-5 md:bottom-[18px] md:left-5">
              <span class="text-[15px] font-bold md:text-base">Vidéo {{ num(i) }}<template v-if="v.title"> — {{ v.title }}</template></span>
              <span class="text-[13px] text-stone-300">{{ [v.guest, v.institution].filter(Boolean).join(' · ') || 'Entretien' }} · YouTube</span>
            </span>
          </button>
        </li>
      </ul>
    </div>

    <SalmModalDialog
      :open="video !== null"
      :title="video ? label(video, current!) : ''"
      @close="current = null"
    >
      <template v-if="video">
        <div class="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            :key="video.youtubeId"
            :src="`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`"
            :title="label(video, current!)"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowfullscreen
            class="size-full border-0"
          />
        </div>
        <a
          :href="`https://www.youtube.com/watch?v=${video.youtubeId}`"
          target="_blank"
          rel="noopener noreferrer"
          class="self-start text-sm font-semibold text-salm-accent-text hover:text-orange-300"
        >Ouvrir sur YouTube</a>
      </template>
    </SalmModalDialog>
  </section>
</template>
