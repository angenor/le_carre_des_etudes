/**
 * Gère le filtre SVG "electric border" de manière performante :
 * - Pause complète quand l'élément est hors viewport (IntersectionObserver)
 * - Pause pendant le scroll sur mobile (évite le jank)
 * - Réduit la complexité du filtre sur mobile (numOctaves)
 */
export function useElectricBorder(svgFilterRef: Ref<SVGSVGElement | undefined>) {
  const isMobile = ref(false)
  let observer: IntersectionObserver | null = null
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null
  let isVisible = true

  function pauseAnimations() {
    svgFilterRef.value?.pauseAnimations()
  }

  function unpauseAnimations() {
    if (isVisible) {
      svgFilterRef.value?.unpauseAnimations()
    }
  }

  function onScroll() {
    pauseAnimations()
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(unpauseAnimations, 150)
  }

  onMounted(() => {
    isMobile.value = window.matchMedia('(max-width: 767px)').matches

    // IntersectionObserver : pause/unpause selon la visibilité
    if (svgFilterRef.value) {
      const target = svgFilterRef.value.closest('section') || svgFilterRef.value.parentElement
      if (target) {
        observer = new IntersectionObserver(
          ([entry]) => {
            isVisible = entry.isIntersecting
            if (isVisible) {
              svgFilterRef.value?.unpauseAnimations()
            } else {
              svgFilterRef.value?.pauseAnimations()
            }
          },
          { rootMargin: '100px' },
        )
        observer.observe(target)
      }
    }

    // Pause pendant le scroll sur mobile/tablette
    if (window.matchMedia('(max-width: 1023px)').matches) {
      window.addEventListener('scroll', onScroll, { passive: true })
    }
  })

  onUnmounted(() => {
    observer?.disconnect()
    window.removeEventListener('scroll', onScroll)
    if (scrollTimeout) clearTimeout(scrollTimeout)
  })

  // Nombre d'octaves adapté à la puissance de l'appareil
  const numOctaves = computed(() => (isMobile.value ? 3 : 10))

  return { isMobile, numOctaves }
}
