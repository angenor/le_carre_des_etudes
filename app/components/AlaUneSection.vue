<script setup lang="ts">
interface FeaturedMagazine {
  id: number
  name: string
  description: string
  version: string
  subtitle: string | null
  pdfPath: string | null
  coverImage: string | null
  coverImageOg: string | null
  publishedAt: string
  availableAt: string | null
  isFeatured: boolean
}

const { data: magazine } = useFetch<FeaturedMagazine | null>('/api/magazines/featured')

// Compte à rebours
const now = useState('countdown-now', () => new Date())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const countdown = computed(() => {
  if (!magazine.value?.availableAt) return null

  const diff = new Date(magazine.value.availableAt).getTime() - now.value.getTime()
  if (diff <= 0) return null

  const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
  const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secondes = Math.floor((diff % (1000 * 60)) / 1000)

  return { jours, heures, minutes, secondes }
})

const estDisponible = computed(() => {
  if (!magazine.value) return false
  // Disponible si pas de date de disponibilité OU date passée
  if (!magazine.value.availableAt) return true
  return new Date(magazine.value.availableAt).getTime() <= now.value.getTime()
})

const dateDisponibiliteFormatee = computed(() => {
  if (!magazine.value?.availableAt) return null
  return new Date(magazine.value.availableAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const showDownloadModal = ref(false)

// Refs pour GSAP
const sectionRef = ref<HTMLElement>()
const badgeRef = ref<HTMLElement>()
const magazineCoverRef = ref<HTMLElement>()
const infosRef = ref<HTMLElement>()
const svgFilterRef = ref<SVGSVGElement>()
const { numOctaves } = useElectricBorder(svgFilterRef)

const foudreContainerRef = ref<HTMLElement>()
let foudreTimer: ReturnType<typeof setTimeout> | null = null

let gsapCtx: ReturnType<typeof useGsap.context> | null = null

function initAnimations() {
  gsapCtx?.revert()

  if (!sectionRef.value) return

  // Redémarrer les animations SVG <animate> (stoppées après navigation back)
  svgFilterRef.value?.querySelectorAll('animate').forEach((el) => {
    (el as SVGAnimateElement).beginElement()
  })

  gsapCtx = useGsap.context(() => {
    useGsap.fromTo(badgeRef.value!,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: sectionRef.value, start: 'top 80%', toggleActions: 'play none none reset' },
      },
    )

    useGsap.fromTo(magazineCoverRef.value!,
      { x: -120, rotation: -8, opacity: 0 },
      { x: 0, rotation: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.value, start: 'top 70%', toggleActions: 'play none none reset' },
      },
    )

    useGsap.fromTo(infosRef.value!.children,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.value, start: 'top 65%', toggleActions: 'play none none reset' },
      },
    )
  }, sectionRef.value)

  // Éclairs qui percutent le titre (desktop uniquement)
  if (window.matchMedia('(min-width: 1024px)').matches && foudreContainerRef.value) {
    const foudres = foudreContainerRef.value.querySelectorAll<SVGSVGElement>('.foudre')
    const titre = infosRef.value?.querySelector('h2')

    function lancerFoudre() {
      const idx = Math.floor(Math.random() * foudres.length)
      const bolt = foudres[idx]
      if (!bolt) return

      const tl = useGsap.timeline()
      tl.set(bolt, { opacity: 0, scaleX: 0.3, transformOrigin: 'left center' })
        .to(bolt, { opacity: 1, scaleX: 1, duration: 0.06, ease: 'power4.out' })
        .to(bolt, { opacity: 0.15, duration: 0.04 })
        .to(bolt, { opacity: 0.9, duration: 0.05 })
        .to(bolt, { opacity: 0, duration: 0.3 })

      // Flash ambre sur le titre au moment de l'impact
      if (titre) {
        useGsap.timeline()
          .to(titre, { textShadow: '0 0 30px rgba(221,132,72,0.7), 0 0 60px rgba(221,132,72,0.3)', duration: 0.08, delay: 0.06 })
          .to(titre, { textShadow: '0 0 0px transparent', duration: 0.5, ease: 'power2.out' })
      }

      foudreTimer = setTimeout(lancerFoudre, 2500 + Math.random() * 5000)
    }

    foudreTimer = setTimeout(lancerFoudre, 1500 + Math.random() * 2000)
  }

  useScrollTrigger.refresh()
}

// Watch sectionRef : gère le cas où v-if rend la section après onMounted
onMounted(() => {
  const stop = watch(
    () => sectionRef.value,
    async (el) => {
      if (!el) return
      await nextTick()
      stop()
      initAnimations()
    },
    { immediate: true },
  )

})

onUnmounted(() => {
  gsapCtx?.revert()
  if (foudreTimer) clearTimeout(foudreTimer)
})
</script>

<template>
  <section v-if="magazine" ref="sectionRef" class="relative overflow-hidden bg-gray-950 py-20 sm:py-28">
    <!-- Fond subtil -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(221,132,72,0.08),transparent_60%)]" />

    <div class="relative mx-auto max-w-6xl px-6">
      <!-- Titre de section -->
      <div ref="badgeRef" class="mb-14 text-center">
        <span class="inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-amber-400 uppercase">
          À la une
        </span>
      </div>

      <!-- Contenu principal -->
      <div class="relative flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
        <!-- Éclairs qui s'échappent vers le titre (desktop) -->
        <div ref="foudreContainerRef" class="pointer-events-none absolute inset-0 z-10 hidden lg:block" aria-hidden="true">
          <!-- Gradient pour les éclairs -->
          <svg class="absolute h-0 w-0">
            <defs>
              <linearGradient id="foudre-grad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stop-color="#dd8448" />
                <stop offset="40%" stop-color="#fbbf24" />
                <stop offset="100%" stop-color="#dd8448" stop-opacity="0.3" />
              </linearGradient>
            </defs>
          </svg>

          <!-- Éclair 1 — trajectoire haute -->
          <svg class="foudre foudre-1" viewBox="0 0 300 60" fill="none">
            <path d="M 0,35 L 45,22 L 38,30 L 90,12 L 82,24 L 140,8 L 130,20 L 185,14 L 175,26 L 235,18 L 270,28 L 300,25" stroke="url(#foudre-grad)" stroke-width="2.5" stroke-linecap="round" />
            <path d="M 0,35 L 45,22 L 38,30 L 90,12 L 82,24 L 140,8 L 130,20 L 185,14 L 175,26 L 235,18 L 270,28 L 300,25" stroke="#fbbf24" stroke-width="1" stroke-linecap="round" />
            <!-- Branche secondaire -->
            <path d="M 140,8 L 155,0 L 148,6" stroke="url(#foudre-grad)" stroke-width="1.5" stroke-linecap="round" />
          </svg>

          <!-- Éclair 2 — trajectoire médiane -->
          <svg class="foudre foudre-2" viewBox="0 0 300 60" fill="none">
            <path d="M 0,30 L 55,24 L 48,32 L 110,18 L 102,28 L 165,32 L 158,26 L 220,20 L 255,30 L 300,28" stroke="url(#foudre-grad)" stroke-width="2.5" stroke-linecap="round" />
            <path d="M 0,30 L 55,24 L 48,32 L 110,18 L 102,28 L 165,32 L 158,26 L 220,20 L 255,30 L 300,28" stroke="#fbbf24" stroke-width="1" stroke-linecap="round" />
            <path d="M 110,18 L 120,8 L 114,14" stroke="url(#foudre-grad)" stroke-width="1.5" stroke-linecap="round" />
          </svg>

          <!-- Éclair 3 — trajectoire basse -->
          <svg class="foudre foudre-3" viewBox="0 0 300 60" fill="none">
            <path d="M 0,25 L 40,38 L 35,30 L 85,45 L 78,35 L 130,48 L 122,38 L 180,44 L 230,36 L 265,42 L 300,35" stroke="url(#foudre-grad)" stroke-width="2.5" stroke-linecap="round" />
            <path d="M 0,25 L 40,38 L 35,30 L 85,45 L 78,35 L 130,48 L 122,38 L 180,44 L 230,36 L 265,42 L 300,35" stroke="#fbbf24" stroke-width="1" stroke-linecap="round" />
            <path d="M 85,45 L 92,55 L 88,48" stroke="url(#foudre-grad)" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <!-- Gauche : magazine avec electric border -->
        <div ref="magazineCoverRef" class="relative flex shrink-0 justify-center">
          <!-- SVG Filter -->
          <svg ref="svgFilterRef" class="absolute h-0 w-0" aria-hidden="true">
            <defs>
              <filter id="turbulent-displace" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="turbulence" baseFrequency="0.02" :numOctaves="numOctaves" result="noise1" seed="1" />
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                  <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" :numOctaves="numOctaves" result="noise2" seed="1" />
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                  <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" :numOctaves="numOctaves" result="noise1" seed="2" />
                <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
                  <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feTurbulence type="turbulence" baseFrequency="0.02" :numOctaves="numOctaves" result="noise2" seed="2" />
                <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
                  <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                </feOffset>

                <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

                <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="50" xChannelSelector="R" yChannelSelector="B" />
              </filter>
            </defs>
          </svg>

          <!-- Card avec electric border -->
          <div class="electric-card">
            <div class="electric-inner">
              <div class="electric-border-outer">
                <div class="electric-main-border" />
              </div>
              <div class="electric-glow-1" />
              <div class="electric-glow-2" />
            </div>

            <div class="electric-overlay-1" />
            <div class="electric-overlay-2" />
            <div class="electric-bg-glow" />

            <!-- Image du magazine -->
            <div class="electric-content">
              <img
                v-if="magazine.coverImage"
                :src="magazine.coverImage"
                :alt="`Couverture du magazine ${magazine.name} — ${magazine.version}`"
                class="h-full w-full rounded-[22px] object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center rounded-[22px] bg-linear-to-br from-gray-800 to-gray-900"
              >
                <div class="text-center">
                  <div class="text-4xl font-bold text-amber-400">{{ magazine.version }}</div>
                  <div class="mt-2 text-sm text-gray-500">{{ magazine.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Droite : infos édition -->
        <div ref="infosRef" class="flex flex-col items-center text-center lg:items-start lg:text-left">
          <!-- Badge numéro -->
          <span class="inline-block rounded-full bg-amber-500/15 px-4 py-1 text-sm font-bold tracking-wider text-amber-400">
            {{ magazine.version }}
          </span>

          <!-- Titre -->
          <h2 class="mt-5 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {{ magazine.name }}
          </h2>
          <p v-if="magazine.subtitle" class="mt-2 text-lg font-medium text-amber-400/80">
            {{ magazine.subtitle }}
          </p>

          <!-- Description -->
          <p class="mt-6 max-w-lg text-base leading-relaxed text-gray-400">
            {{ magazine.description }}
          </p>

          <!-- Compte à rebours -->
          <div v-if="countdown" class="mt-8 w-full max-w-md">
            <p class="mb-4 text-sm font-medium tracking-wide text-gray-500 uppercase">
              Disponible le {{ dateDisponibiliteFormatee }}
            </p>
            <div class="grid grid-cols-4 gap-3">
              <div v-for="bloc in [
                { valeur: countdown.jours, label: 'Jours' },
                { valeur: countdown.heures, label: 'Heures' },
                { valeur: countdown.minutes, label: 'Min' },
                { valeur: countdown.secondes, label: 'Sec' },
              ]" :key="bloc.label" class="countdown-bloc">
                <span class="countdown-valeur">
                  {{ String(bloc.valeur).padStart(2, '0') }}
                </span>
                <span class="countdown-label">{{ bloc.label }}</span>
              </div>
            </div>
          </div>

          <!-- Boutons -->
          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <!-- Bouton principal : Télécharger (actif seulement si disponible) -->
            <button
              v-if="estDisponible && magazine.pdfPath"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 text-sm font-bold tracking-wide text-gray-900 uppercase shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 hover:shadow-amber-400/30"
              @click="showDownloadModal = true"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Télécharger
            </button>

            <!-- Bouton désactivé avant la date ou sans PDF -->
            <span
              v-else
              class="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/5 px-8 py-3.5 text-sm font-bold tracking-wide text-gray-500 uppercase"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Bientôt disponible
            </span>

            <!-- Bouton secondaire : Voir les détails -->
            <NuxtLink
              :to="`/magazine/${magazine.id}`"
              class="inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-3.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Voir les détails
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de téléchargement -->
    <DownloadModal
      v-if="showDownloadModal"
      :magazine-id="magazine.id"
      :magazine-name="magazine.name"
      @close="showDownloadModal = false"
    />
  </section>
</template>

<style scoped>
/* Electric border variables */
:root {
  --electric-border-color: #dd8448;
}

/* Card container */
.electric-card {
  padding: 2px;
  border-radius: 24px;
  position: relative;
  background: linear-gradient(
      -30deg,
      oklch(from #dd8448 0.3 calc(c / 2) h / 0.4),
      transparent,
      oklch(from #dd8448 0.3 calc(c / 2) h / 0.4)
    ),
    linear-gradient(to bottom, oklch(0.185 0 0), oklch(0.185 0 0));
}

/* Inner container */
.electric-inner {
  position: relative;
}

/* Border layers */
.electric-border-outer {
  border: 2px solid rgba(221, 132, 72, 0.5);
  border-radius: 24px;
  padding-right: 4px;
  padding-bottom: 4px;
}

.electric-main-border {
  width: 280px;
  aspect-ratio: 583 / 828;
  border-radius: 24px;
  border: 2px solid #dd8448;
  margin-top: -4px;
  margin-left: -4px;
  filter: url(#turbulent-displace);
  will-change: filter;
  contain: strict;
}

@media (min-width: 640px) {
  .electric-main-border {
    width: 320px;
  }
}

/* Glow effects */
.electric-glow-1 {
  border: 2px solid rgba(221, 132, 72, 0.6);
  border-radius: 24px;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  filter: blur(1px);
}

.electric-glow-2 {
  border: 2px solid #dd8448;
  border-radius: 24px;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  filter: blur(4px);
}

/* Overlay effects */
.electric-overlay-1 {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  mix-blend-mode: overlay;
  transform: scale(1.1);
  filter: blur(16px);
  background: linear-gradient(-30deg, white, transparent 30%, transparent 70%, white);
}

.electric-overlay-2 {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  opacity: 0.5;
  mix-blend-mode: overlay;
  transform: scale(1.1);
  filter: blur(16px);
  background: linear-gradient(-30deg, white, transparent 30%, transparent 70%, white);
}

/* Background glow */
.electric-bg-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 24px;
  filter: blur(32px);
  transform: scale(1.1);
  opacity: 0.3;
  z-index: -1;
  background: linear-gradient(-30deg, #dd8448, transparent, #dd8448);
}

/* Countdown */
.countdown-bloc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(221, 132, 72, 0.15);
}

.countdown-valeur {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  background: linear-gradient(180deg, #fbbf24, #dd8448);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.countdown-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.4);
}

/* Éclairs — positionnement et glow */
.foudre {
  position: absolute;
  opacity: 0;
  width: 55%;
  height: 40px;
  left: 28%;
  filter: drop-shadow(0 0 8px rgba(221, 132, 72, 0.8))
    drop-shadow(0 0 20px rgba(251, 191, 36, 0.4));
}

.foudre-1 {
  top: 18%;
}

.foudre-2 {
  top: 42%;
}

.foudre-3 {
  top: 65%;
}

/* Content (image) container */
.electric-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 2px;
  border-radius: 24px;
  overflow: hidden;
}
</style>
