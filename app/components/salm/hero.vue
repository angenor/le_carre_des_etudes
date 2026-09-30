<script setup lang="ts">
import '~/assets/css/salm.css'
import { formatDateRange, formatDaysSentence, venueLabel } from '#shared/utils/salm'
import type { SalmPreviousEdition, SalmPublicEdition } from '#shared/types/salm'

// Hero de /salm (FR-011, FR-012) : image de secours en SSR (élément LCP), vidéo de fond injectée
// côté client sous conditions, compte à rebours, appels à l'action et ancres.
const props = defineProps<{
  edition: SalmPublicEdition
  previous: SalmPreviousEdition | null
}>()

const dates = computed(() => props.edition.days.map((d) => d.date))
const datesLong = computed(() => formatDaysSentence(dates.value))
const datesShort = computed(() => formatDateRange(dates.value, '&'))
const venue = computed(() => venueLabel(props.edition.venue, props.edition.city))
const recap = computed(() => props.previous?.recapVideo ?? null)
const fallbackImage = computed(() =>
  recap.value?.posterPath ?? props.previous?.recapPosterPath ?? props.edition.poster?.path ?? null,
)
const studentsOpen = computed(() => props.edition.registration.students.open)
const schoolsOpen = computed(() => props.edition.registration.schools.open)

const anchors = computed(() => [
  { href: '#pourquoi', label: 'Pourquoi le SALM', show: true },
  { href: '#programme', label: 'Programme', show: props.edition.highlights.length > 0 },
  { href: '#chronogramme', label: 'Chronogramme', show: props.edition.days.length > 0 },
  { href: '#canape', label: 'Le canapé du SALM', show: (props.previous?.videos.length ?? 0) > 0 },
  { href: '#photos', label: `Photos ${props.previous?.year ?? ''}`, show: (props.previous?.photos.length ?? 0) > 0 },
].filter((a) => a.show))

// ---- Fenêtre « Revivre le SALM » (avec le son) ----
const recapOpen = ref(false)

// ---- Vidéo de fond (research R9) ----
const PAUSE_KEY = 'salm-hero-video-paused'
const videoEligible = ref(false)
const videoPaused = ref(false)

const backgroundSrc = computed(() => {
  const id = recap.value?.youtubeId
  if (!id) return null
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0&disablekb=1&iv_load_policy=3`
})

onMounted(() => {
  if (!backgroundSrc.value) return
  const wide = window.matchMedia('(min-width: 768px)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const slow = ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '')
  videoEligible.value = wide && !reducedMotion && !connection?.saveData && !slow
  try {
    videoPaused.value = sessionStorage.getItem(PAUSE_KEY) === '1'
  }
  catch {
    // stockage indisponible : lecture par défaut
  }
})

function toggleVideo() {
  videoPaused.value = !videoPaused.value
  try {
    sessionStorage.setItem(PAUSE_KEY, videoPaused.value ? '1' : '0')
  }
  catch {
    // préférence non mémorisée
  }
}
</script>

<template>
  <!-- Toujours sombre (texte clair sur image ou vidéo voilée) : la classe `dark` y fige les jetons SALM
       sur leurs valeurs sombres, quel que soit le mode ; le fond salm-bg la garde sombre sans image. -->
  <section class="dark relative isolate flex min-h-[760px] flex-col overflow-hidden bg-salm-bg text-salm-ink md:min-h-[860px]">
    <!-- Fond : image de secours (SSR, LCP), puis vidéo si les conditions le permettent -->
    <img
      v-if="fallbackImage"
      :src="fallbackImage"
      alt=""
      width="1440"
      height="860"
      fetchpriority="high"
      class="salm-kenburns absolute -inset-5 -z-20 h-[calc(100%+40px)] w-[calc(100%+40px)] max-w-none object-cover object-[center_30%] blur-[3px] brightness-[0.34] saturate-[0.9]"
    >
    <div
      v-if="videoEligible && !videoPaused && backgroundSrc"
      class="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <iframe
        :src="backgroundSrc"
        title="Vidéo de fond"
        tabindex="-1"
        allow="autoplay; encrypted-media"
        class="absolute top-1/2 left-1/2 h-[max(100%,56.25vw)] w-[max(100%,177.78vh)] -translate-x-1/2 -translate-y-1/2 border-0 brightness-[0.45]"
      />
    </div>
    <div class="absolute inset-0 -z-10 bg-[#0B0B0D]/35" />

    <div class="flex flex-1 flex-col gap-10 px-5 pt-[112px] pb-10 md:px-12 md:pt-[176px] lg:flex-row lg:items-start lg:justify-between xl:px-24">
      <!-- Colonne principale -->
      <div class="flex max-w-[820px] min-w-0 flex-col gap-5 md:gap-7">
        <div class="flex items-center gap-3.5">
          <span class="salm-intro-line hidden h-[3px] w-10 shrink-0 bg-salm-accent md:block" aria-hidden="true" />
          <span class="salm-intro font-salm-title text-[11px] leading-[1.6] font-bold tracking-[0.14em] text-salm-accent-text md:text-[13px] md:tracking-[0.16em]" style="--salm-delay: 0.1s">
            {{ edition.salonName.toLocaleUpperCase('fr-FR') }}
          </span>
        </div>

        <h1 class="flex items-end gap-0.5 leading-[0.8] md:gap-1">
          <span class="sr-only">SALM {{ edition.year }}</span>
          <span aria-hidden="true" class="salm-intro-write font-salm-script text-[min(118px,30vw)] font-normal tracking-[-0.01em] text-salm-ink md:text-[190px]" style="--salm-delay: 0.25s">Salm</span>
          <span aria-hidden="true" class="salm-intro-stamp pb-1 font-salm-title text-[min(52px,13vw)] font-extrabold tracking-[-0.03em] text-salm-accent-text md:pb-1.5 md:text-[84px]" style="--salm-delay: 1.15s">{{ edition.year }}</span>
        </h1>

        <p v-if="edition.tagline" class="salm-intro font-salm-title text-2xl leading-[1.25] font-semibold tracking-[-0.01em] text-salm-ink md:text-[34px]" style="--salm-delay: 1.3s">
          {{ edition.tagline }}
        </p>

        <!-- Informations pratiques -->
        <ul class="salm-intro flex flex-col gap-2.5 font-salm-body text-[15px] text-salm-ink-soft md:flex-row md:flex-wrap md:gap-7 md:text-[17px]" style="--salm-delay: 1.4s">
          <li class="flex items-center gap-2.5">
            <svg class="size-[18px] shrink-0 md:size-5" viewBox="0 0 24 24" fill="none" stroke="#F4792B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            <span class="md:hidden">{{ datesShort }}<template v-if="edition.timeline.hoursLabel"> · {{ edition.timeline.hoursLabel }}</template></span>
            <span class="hidden md:inline">{{ datesLong }}</span>
          </li>
          <li class="flex items-center gap-2.5">
            <svg class="size-[18px] shrink-0 md:size-5" viewBox="0 0 24 24" fill="none" stroke="#F4792B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s-8-7.5-8-13a8 8 0 0 1 16 0c0 5.5-8 13-8 13z" /><circle cx="12" cy="9" r="3" /></svg>
            {{ venue }}
          </li>
          <li v-if="edition.timeline.hoursLabel" class="hidden items-center gap-2.5 md:flex">
            <svg class="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#F4792B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            {{ edition.timeline.hoursLabel }}
          </li>
        </ul>

        <!-- Compte à rebours (mobile ; sur desktop, dans la colonne de droite) -->
        <SalmCountdown
          v-if="edition.timeline.opensAtIso && edition.timeline.endsAtIso"
          :opens-at-iso="edition.timeline.opensAtIso"
          :ends-at-iso="edition.timeline.endsAtIso"
          :year="edition.year"
          class="salm-intro md:hidden"
          style="--salm-delay: 1.5s"
        />

        <!-- Appels à l'action (FR-051) -->
        <div class="salm-intro mt-2 flex flex-col gap-3 md:mt-3 md:flex-row md:flex-wrap md:gap-4" style="--salm-delay: 1.55s">
          <NuxtLink
            v-if="studentsOpen"
            to="/salm/inscription-etudiant"
            class="salm-shine salm-btn-student flex min-h-14 items-center justify-center gap-3 rounded-[14px] bg-salm-accent px-7 py-2 text-center font-salm-title text-base font-bold text-white transition-colors hover:bg-[#9A3412] md:h-[60px] md:justify-start"
          >
            <svg class="salm-icon-dark hidden size-5 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 6h6" /><circle cx="12" cy="13" r="3" /></svg>
            <!-- Icône du mode clair « Soleil d'Abidjan » (salm.css) -->
            <svg class="salm-icon-light size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>
            Étudiant·e : obtenir mon badge
          </NuxtLink>
          <div v-else class="flex min-h-14 flex-col justify-center rounded-[14px] bg-ink/8 px-6 py-2.5 md:min-h-[60px]">
            <span class="font-salm-title text-sm font-bold text-salm-ink">Inscriptions étudiantes closes</span>
            <NuxtLink to="/salm/inscription-etudiant" class="text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft">Récupérer mon badge</NuxtLink>
          </div>

          <NuxtLink
            v-if="schoolsOpen"
            to="/salm/inscription-ecole"
            class="salm-btn-school flex min-h-14 items-center justify-center gap-3 rounded-[14px] border-[1.5px] py-2 text-center border-salm-ink/50 px-7 font-salm-title text-base font-bold text-salm-ink transition-colors hover:border-salm-ink md:h-[60px] md:justify-start"
          >
            <svg class="salm-icon-dark hidden size-5 md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>
            <svg class="salm-icon-light size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>
            École : confirmer notre présence
          </NuxtLink>
          <div v-else class="flex min-h-14 items-center rounded-[14px] border-[1.5px] border-ink/15 px-6 md:min-h-[60px]">
            <span class="font-salm-title text-sm font-bold text-salm-ink-soft">Inscriptions des établissements closes</span>
          </div>
        </div>

        <!-- Revivre (mobile) -->
        <button
          v-if="recap"
          type="button"
          class="salm-intro flex items-center gap-3 self-start text-[15px] font-semibold text-salm-ink md:hidden"
          style="--salm-delay: 1.7s"
          @click="recapOpen = true"
        >
          <span class="flex size-11 items-center justify-center rounded-full bg-salm-ink text-salm-bg">
            <svg class="size-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
          Revivre le SALM {{ previous?.year }} en vidéo
        </button>
      </div>

      <!-- Colonne de droite (desktop) : compte à rebours et vidéo -->
      <div class="salm-intro-swing hidden w-full max-w-85 shrink-0 flex-col gap-4 md:flex lg:mt-[74px]" style="--salm-delay: 1.35s">
        <SalmCountdown
          v-if="edition.timeline.opensAtIso && edition.timeline.endsAtIso"
          :opens-at-iso="edition.timeline.opensAtIso"
          :ends-at-iso="edition.timeline.endsAtIso"
          :year="edition.year"
        />
        <button
          v-if="recap"
          type="button"
          class="flex items-center gap-4 rounded-[20px] border border-ink/10 bg-[#0B0B0D]/72 py-3.5 pr-[18px] pl-3.5 text-left text-salm-ink transition-colors hover:border-ink/25"
          @click="recapOpen = true"
        >
          <span class="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-salm-ink text-salm-bg">
            <svg class="size-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
          <span class="flex flex-col gap-0.5">
            <span class="text-[15px] font-semibold">Revivre le SALM {{ previous?.year }}</span>
            <span class="text-[13px] text-salm-ink-muted">Vidéo plein écran · YouTube</span>
          </span>
        </button>
        <button
          v-if="videoEligible"
          type="button"
          class="flex items-center gap-2 self-start rounded-full border border-ink/15 bg-[#0B0B0D]/60 px-4 py-2 text-sm font-medium text-salm-ink-soft transition-colors hover:text-ink"
          @click="toggleVideo"
        >
          <svg v-if="!videoPaused" class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          <svg v-else class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          {{ videoPaused ? 'Relancer la vidéo' : 'Mettre la vidéo en pause' }}
        </button>
      </div>
    </div>

    <!-- Barre d'ancres -->
    <div class="salm-intro flex flex-col gap-3 border-t border-ink/10 bg-[#0B0B0D]/80 px-5 py-4 md:h-[68px] md:flex-row md:items-center md:justify-between md:px-12 md:py-0 xl:px-24" style="--salm-delay: 1.7s">
      <nav aria-label="Sections de la page SALM" class="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium md:gap-x-9 md:text-[15px]">
        <a v-for="anchor in anchors" :key="anchor.href" :href="anchor.href" class="text-salm-ink-soft transition-colors hover:text-salm-accent-text">{{ anchor.label }}</a>
      </nav>
    </div>

    <SalmModalDialog
      v-if="recap"
      :open="recapOpen"
      :title="`Revivre le SALM ${previous?.year}`"
      @close="recapOpen = false"
    >
      <div class="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          :src="`https://www.youtube-nocookie.com/embed/${recap.youtubeId}?autoplay=1&rel=0`"
          :title="`Revivre le SALM ${previous?.year}`"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowfullscreen
          class="size-full border-0"
        />
      </div>
      <a
        :href="`https://www.youtube.com/watch?v=${recap.youtubeId}`"
        target="_blank"
        rel="noopener noreferrer"
        class="self-start text-sm font-semibold text-salm-accent-text hover:text-salm-accent-soft"
      >Ouvrir sur YouTube</a>
    </SalmModalDialog>
  </section>
</template>
