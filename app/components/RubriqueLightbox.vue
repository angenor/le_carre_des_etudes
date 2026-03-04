<script setup lang="ts">
const props = defineProps<{
  imagePath: string
  magazineSlug?: string | null
  sectionLabel?: string
}>()

const emit = defineEmits<{ close: [] }>()

const overlayRef = ref<HTMLElement>()
const imageRef = ref<HTMLElement>()

onMounted(() => {
  if (overlayRef.value) {
    useGsap.fromTo(overlayRef.value,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' },
    )
  }

  if (imageRef.value) {
    useGsap.fromTo(imageRef.value,
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.4)', delay: 0.1 },
    )
  }

  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') animateClose()
}

function animateClose() {
  const tl = useGsap.timeline({ onComplete: () => emit('close') })

  if (imageRef.value) {
    tl.to(imageRef.value, {
      scale: 0.9, opacity: 0, duration: 0.25, ease: 'power3.in',
    }, 0)
  }

  if (overlayRef.value) {
    tl.to(overlayRef.value, {
      opacity: 0, duration: 0.2, ease: 'power2.in',
    }, 0.05)
  }
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) animateClose()
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="overlayRef"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      @click="handleOverlayClick"
    >
      <div ref="imageRef" class="relative flex max-h-[90dvh] max-w-3xl flex-col items-center">
        <!-- Bouton fermer -->
        <button
          type="button"
          class="absolute -right-3 -top-3 z-10 rounded-full bg-gray-900/80 p-2 text-gray-400 ring-1 ring-white/10 transition-colors hover:bg-gray-800 hover:text-white"
          aria-label="Fermer"
          @click="animateClose"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Image -->
        <img
          :src="imagePath"
          :alt="sectionLabel ? `Rubrique ${sectionLabel}` : 'Rubrique'"
          class="max-h-[80dvh] rounded-xl object-contain shadow-2xl"
        />

        <!-- Bouton vers le magazine -->
        <NuxtLink
          v-if="magazineSlug"
          :to="`/magazine/${magazineSlug}`"
          class="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-5 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/25 hover:text-amber-300"
        >
          Voir le magazine
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </Teleport>
</template>
