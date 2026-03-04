<script setup lang="ts">
const props = defineProps<{ loading: boolean }>()
const emit = defineEmits<{ done: [] }>()

const overlayRef = ref<HTMLElement>()
let ctx: ReturnType<typeof useGsap.context> | null = null

// Bloquer le scroll au montage
onMounted(() => {
  document.body.style.overflow = 'hidden'

  if (!overlayRef.value) return

  ctx = useGsap.context(() => {
    const title = overlayRef.value!.querySelector('.loader-title')
    const subtitle = overlayRef.value!.querySelector('.loader-subtitle')
    const spinner = overlayRef.value!.querySelector('.loader-spinner')

    // Entrée du titre
    if (title) {
      useGsap.fromTo(
        title,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      )
    }

    // Entrée du spinner
    if (spinner) {
      useGsap.fromTo(
        spinner,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, delay: 0.3, ease: 'back.out(1.7)' },
      )
      // Rotation continue
      useGsap.to(spinner, {
        rotation: 360,
        duration: 1.8,
        ease: 'none',
        repeat: -1,
      })
    }

    // Entrée du sous-titre
    if (subtitle) {
      useGsap.fromTo(
        subtitle,
        { opacity: 0 },
        { opacity: 0.6, duration: 0.6, delay: 0.5, ease: 'power2.out' },
      )
      // Pulse léger
      useGsap.fromTo(
        subtitle,
        { opacity: 0.4 },
        { opacity: 0.8, duration: 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1 },
      )
    }
  }, overlayRef.value)
})

// Réagir quand le chargement est terminé
watch(() => props.loading, (isLoading) => {
  if (!isLoading) {
    animateOut()
  }
})

function animateOut() {
  if (!overlayRef.value) {
    finish()
    return
  }

  const tl = useGsap.timeline({ onComplete: finish })

  const title = overlayRef.value.querySelector('.loader-title')
  const subtitle = overlayRef.value.querySelector('.loader-subtitle')
  const spinner = overlayRef.value.querySelector('.loader-spinner')

  // Sortie du spinner et sous-titre
  tl.to([spinner, subtitle].filter(Boolean), {
    opacity: 0,
    scale: 0.8,
    duration: 0.3,
    ease: 'power2.in',
  })

  // Sortie du titre
  tl.to(title, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    ease: 'power2.in',
  }, '-=0.15')

  // Fondu de l'overlay
  tl.to(overlayRef.value, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.inOut',
  }, '-=0.1')
}

function finish() {
  document.body.style.overflow = ''
  emit('done')
}

// Sécurité : toujours restaurer le scroll
onUnmounted(() => {
  ctx?.revert()
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    ref="overlayRef"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900"
  >
    <!-- Titre -->
    <h2 class="loader-title mb-8 text-2xl font-light tracking-[0.15em] text-white md:text-3xl">
      Le Carré des Études
    </h2>

    <!-- Spinner SVG -->
    <svg
      class="loader-spinner mb-6 h-12 w-12"
      viewBox="0 0 50 50"
      fill="none"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="white"
        stroke-opacity="0.15"
        stroke-width="2.5"
      />
      <path
        d="M25 5 A20 20 0 0 1 45 25"
        stroke="white"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </svg>

    <!-- Sous-titre -->
    <span class="loader-subtitle text-[11px] font-light tracking-[0.25em] uppercase text-white/50">
      Chargement
    </span>
  </div>
</template>
