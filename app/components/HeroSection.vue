<script setup lang="ts">
const emit = defineEmits<{ imageLoaded: [] }>()

const heroRef = ref<HTMLElement>()
const desktopImg = ref<HTMLImageElement>()
const mobileImg = ref<HTMLImageElement>()
const scrollIndicator = ref<HTMLElement>()

// Images dynamiques depuis le backoffice, avec fallback sur les images statiques
const { data: heroImages } = await useFetch<Record<string, string>>('/api/homepage-images')
const desktopSrc = computed(() => heroImages.value?.hero_desktop || '/images/hero/hero_section.jpg')
const mobileSrc = computed(() => heroImages.value?.hero_mobile || '/images/hero/magazine.jpg')

function onImageLoad() {
  emit('imageLoaded')
}

let ctx: ReturnType<typeof useGsap.context> | null = null

onMounted(async () => {
  await nextTick()
  if (!heroRef.value) return

  ctx = useGsap.context(() => {
    const images = [desktopImg.value, mobileImg.value].filter(Boolean)
    useGsap.fromTo(
      images,
      { scale: 1.15, opacity: 0 },
      { scale: 1, opacity: 1, duration: 2, ease: 'power3.out' },
    )

    if (desktopImg.value) {
      useGsap.to(desktopImg.value, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.value,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }

    if (scrollIndicator.value) {
      const chevrons = scrollIndicator.value.querySelectorAll('.scroll-chevron')
      const label = scrollIndicator.value.querySelector('.scroll-label')
      const line = scrollIndicator.value.querySelector('.scroll-line')

      // Entrée initiale
      useGsap.fromTo(
        scrollIndicator.value,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 1.5, ease: 'power3.out' },
      )

      // Ligne qui pulse
      if (line) {
        useGsap.fromTo(
          line,
          { scaleY: 0 },
          { scaleY: 1, duration: 1.4, delay: 1.8, ease: 'power2.out', transformOrigin: 'top center' },
        )
      }

      // Chevrons en cascade infinie
      if (chevrons.length) {
        const tl = useGsap.timeline({ repeat: -1, delay: 2.2 })
        tl.fromTo(
          chevrons,
          { y: -4, opacity: 0 },
          { y: 6, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' },
        )
        tl.to(
          chevrons,
          { y: 16, opacity: 0, duration: 0.5, stagger: 0.15, ease: 'power2.in' },
          '+=0.3',
        )
        tl.set(chevrons, { y: -4, opacity: 0 })
        tl.to({}, { duration: 0.4 }) // pause avant la boucle
      }

      // Label qui pulse doucement
      if (label) {
        useGsap.fromTo(
          label,
          { opacity: 0 },
          { opacity: 0.7, duration: 1.5, delay: 2, ease: 'power2.out' },
        )
        useGsap.fromTo(
          label,
          { opacity: 0.5 },
          { opacity: 0.9, duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 3.5 },
        )
      }

      // Disparition au scroll (fromTo pour garantir le retour à l'état visible)
      useGsap.fromTo(
        scrollIndicator.value,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -10,
          immediateRender: false,
          scrollTrigger: {
            trigger: heroRef.value,
            start: '5% top',
            end: '15% top',
            scrub: true,
          },
        },
      )
    }
  }, heroRef.value)

  useScrollTrigger.refresh()
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="heroRef" class="relative overflow-hidden bg-gray-900 h-dvh min-h-150">
    <img
      ref="desktopImg"
      :src="desktopSrc"
      alt="Couverture du magazine Le Carré des Études"
      class="absolute inset-0 hidden h-full w-full object-cover md:block will-change-transform"
      @load="onImageLoad"
    />
    <img
      ref="mobileImg"
      :src="mobileSrc"
      alt="Couverture du magazine Le Carré des Études"
      class="absolute inset-0 block h-full w-full object-cover md:hidden will-change-transform"
      @load="onImageLoad"
    />
    <h1 class="sr-only">Le Carré des Études — Guider, Informer, Inspirer</h1>
    <div ref="scrollIndicator" class="absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-5">
      <!-- Ligne verticale animée -->
      <div class="scroll-line h-20 w-0.5 bg-gradient-to-b from-transparent via-white/70 to-white/90"></div>
      <!-- Chevrons en cascade -->
      <div class="flex flex-col items-center -space-y-2">
        <svg class="scroll-chevron h-12 w-12 text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.6)]" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
        </svg>
        <svg class="scroll-chevron h-12 w-12 text-white/70 drop-shadow-[0_0_14px_rgba(255,255,255,0.5)]" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
        </svg>
        <svg class="scroll-chevron h-12 w-12 text-white/50 drop-shadow-[0_0_14px_rgba(255,255,255,0.4)]" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </div>
      <!-- Label -->
      <span class="scroll-label text-sm font-light tracking-[0.3em] uppercase text-white/80">Découvrir</span>
    </div>
  </section>
</template>
