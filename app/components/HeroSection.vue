<script setup lang="ts">
const heroRef = ref<HTMLElement>()
const desktopImg = ref<HTMLImageElement>()
const mobileImg = ref<HTMLImageElement>()
const scrollIndicator = ref<HTMLElement>()

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
      useGsap.fromTo(
        scrollIndicator.value,
        { y: 0, opacity: 0.6 },
        { y: 10, opacity: 1, duration: 1.2, ease: 'power2.inOut', repeat: -1, yoyo: true },
      )

      useGsap.to(scrollIndicator.value, {
        opacity: 0,
        scrollTrigger: {
          trigger: heroRef.value,
          start: '10% top',
          end: '20% top',
          scrub: true,
        },
      })
    }
  }, heroRef.value)

  useScrollTrigger.refresh()
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="heroRef" class="relative overflow-hidden bg-gray-900 md:h-dvh md:min-h-150">
    <img
      ref="desktopImg"
      src="/images/hero/hero_section.jpg"
      alt="Couverture du magazine Le Carré des Études"
      class="absolute inset-0 hidden h-full w-full object-cover md:block will-change-transform"
    />
    <img
      ref="mobileImg"
      src="/images/hero/magazine.png"
      alt="Couverture du magazine Le Carré des Études"
      class="block w-full md:hidden will-change-transform"
    />
    <h1 class="sr-only">Le Carré des Études — Guider, Informer, Inspirer</h1>
    <div ref="scrollIndicator" class="absolute inset-x-0 bottom-4 z-10 flex justify-center">
      <svg class="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
      </svg>
    </div>
  </section>
</template>
