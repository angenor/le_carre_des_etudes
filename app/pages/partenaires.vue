<script setup lang="ts">
interface Partner {
  id: number
  name: string
  logoPath: string
  url: string | null
  order: number
}

const { data: partners, status } = useFetch<Partner[]>('/api/partenaires')

useHead({
  title: 'Partenaires — Le Carré des Études',
})

// Refs GSAP
const heroContentRef = ref<HTMLElement>()
const losange1 = ref<HTMLElement>()
const losange2 = ref<HTMLElement>()
const logosRef = ref<HTMLElement>()
const pageRef = ref<HTMLElement>()

let gsapCtx: ReturnType<typeof useGsap.context> | null = null

function initAnimations() {
  gsapCtx?.revert()
  if (!pageRef.value) return

  gsapCtx = useGsap.context(() => {
    // Hero — stagger des enfants
    if (heroContentRef.value) {
      useGsap.from(heroContentRef.value.children, {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
      })
    }

    // Losanges flottants
    if (losange1.value) {
      useGsap.fromTo(losange1.value,
        { rotation: 45, y: 0 },
        { rotation: 55, y: -10, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true },
      )
    }
    if (losange2.value) {
      useGsap.fromTo(losange2.value,
        { rotation: 12, y: 0 },
        { rotation: 0, y: 10, duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true },
      )
    }

    // Logos partenaires — elastic bounce depuis le centre
    if (logosRef.value) {
      useGsap.from(logosRef.value.children, {
        scale: 0, opacity: 0, rotation: -15, duration: 0.8,
        stagger: { each: 0.1, from: 'center' },
        ease: 'elastic.out(1, 0.5)',
        scrollTrigger: { trigger: logosRef.value, start: 'top 85%', toggleActions: 'play none none reset' },
      })
    }
  }, pageRef.value)

  useScrollTrigger.refresh()
}

onMounted(() => {
  const stop = watch(
    () => [pageRef.value, logosRef.value],
    async ([page, logos]) => {
      if (!page) return
      if (!logos && status.value !== 'pending') {
        await nextTick()
      }
      await nextTick()
      stop()
      initAnimations()
    },
    { immediate: true },
  )
})

onUnmounted(() => {
  gsapCtx?.revert()
})
</script>

<template>
  <div ref="pageRef" class="min-h-screen bg-page">
    <!-- Hero section avec motifs SVG -->
    <section class="relative overflow-hidden bg-page pb-20 pt-32 sm:pb-28 sm:pt-40">
      <!-- Grille de points + radial glow -->
      <svg class="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="partenaires-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(251,191,36,0.12)" />
          </pattern>
          <radialGradient id="partenaires-fade" cx="50%" cy="30%" r="60%">
            <stop offset="0%" style="stop-color: color-mix(in srgb, var(--site-copper) 15%, transparent)" />
            <stop offset="100%" stop-color="transparent" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#partenaires-grid)" />
        <rect width="100%" height="100%" fill="url(#partenaires-fade)" />
      </svg>

      <!-- Lignes diagonales -->
      <svg class="absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
        <line x1="0%" y1="100%" x2="60%" y2="0%" class="stroke-copper" stroke-width="1" />
        <line x1="20%" y1="100%" x2="80%" y2="0%" class="stroke-copper" stroke-width="1" />
        <line x1="40%" y1="100%" x2="100%" y2="0%" class="stroke-copper" stroke-width="1" />
        <line x1="60%" y1="100%" x2="100%" y2="20%" class="stroke-copper" stroke-width="1" />
      </svg>

      <!-- Halos lumineux -->
      <div class="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
      <div class="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-glow/5 blur-3xl" />

      <!-- Losanges décoratifs -->
      <svg ref="losange1" class="absolute right-10 top-32 h-20 w-20 rotate-45 text-gold/10 sm:right-20 sm:h-32 sm:w-32" aria-hidden="true">
        <rect width="100%" height="100%" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" />
      </svg>
      <svg ref="losange2" class="absolute bottom-20 left-8 h-14 w-14 rotate-12 text-accent/8 sm:left-16 sm:h-20 sm:w-20" aria-hidden="true">
        <rect width="100%" height="100%" rx="4" fill="none" stroke="currentColor" stroke-width="1" />
      </svg>

      <!-- Contenu hero -->
      <div ref="heroContentRef" class="relative mx-auto max-w-5xl px-6 text-center">
        <span class="inline-block rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-accent uppercase">
          Ensemble
        </span>

        <h1 class="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Nos
          <span class="relative">
            <span class="relative z-10 bg-linear-to-r from-title-from to-title-to bg-clip-text text-transparent">
              partenaires
            </span>
            <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none" aria-hidden="true">
              <path class="stroke-copper" d="M1 5.5C40 2 80 2 100 4C120 6 160 6 199 3" stroke-width="2" stroke-linecap="round" opacity="0.5" />
            </svg>
          </span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Les organisations qui soutiennent Le Carré des Études
        </p>

        <!-- Séparateur -->
        <div class="mx-auto mt-10 flex items-center justify-center gap-3">
          <span class="h-px w-12 bg-linear-to-r from-transparent to-gold/50" />
          <svg class="h-4 w-4 rotate-45 text-gold/40" fill="currentColor" viewBox="0 0 16 16">
            <rect width="16" height="16" rx="2" />
          </svg>
          <span class="h-px w-12 bg-linear-to-l from-transparent to-gold/50" />
        </div>
      </div>
    </section>

    <!-- Contenu -->
    <section class="relative pb-20 sm:pb-28">
      <div class="mx-auto max-w-6xl px-6">
        <!-- Chargement -->
        <div v-if="status === 'pending'" class="py-20 text-center">
          <div class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
          <p class="mt-4 text-sm text-ink-subtle">Chargement des partenaires...</p>
        </div>

        <!-- État vide -->
        <div v-else-if="!partners?.length" class="py-20 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface">
            <svg class="h-8 w-8 text-gold/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </div>
          <h2 class="mt-5 text-lg font-semibold text-ink">Pas encore de partenaires</h2>
          <p class="mt-2 text-sm text-ink-subtle">Revenez bientôt pour découvrir nos partenaires.</p>
        </div>

        <!-- Logos partenaires -->
        <div v-else ref="logosRef" class="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          <component
            :is="partner.url ? 'a' : 'div'"
            v-for="partner in partners"
            :key="partner.id"
            :href="partner.url || undefined"
            :target="partner.url ? '_blank' : undefined"
            :rel="partner.url ? 'noopener noreferrer' : undefined"
            class="flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div class="flex h-20 w-20 items-center justify-center rounded-xl bg-white/90 p-3 sm:h-24 sm:w-24">
              <img
                :src="partner.logoPath"
                :alt="`Logo ${partner.name}`"
                class="max-h-full max-w-full object-contain"
              />
            </div>
            <span class="text-xs font-medium text-ink-muted">{{ partner.name }}</span>
          </component>
        </div>
      </div>
    </section>
  </div>
</template>
