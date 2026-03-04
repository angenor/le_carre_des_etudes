<script setup lang="ts">
const props = defineProps<{
  imagePath: string
  magazineSlug?: string | null
  sectionLabel?: string
}>()

const emit = defineEmits<{ close: [] }>()

const overlayRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const imgRef = ref<HTMLImageElement>()

// Zoom
const scale = ref(1)
const MIN_SCALE = 1
const MAX_SCALE = 5
const ZOOM_STEP = 0.5

// Pan (déplacement quand zoomé)
const translateX = ref(0)
const translateY = ref(0)
const isPanning = ref(false)
let panStart = { x: 0, y: 0 }
let translateStart = { x: 0, y: 0 }

// Pinch-to-zoom
let initialPinchDistance = 0
let initialPinchScale = 1

const imageStyle = computed(() => ({
  transform: `scale(${scale.value}) translate(${translateX.value}px, ${translateY.value}px)`,
  cursor: scale.value > 1 ? (isPanning.value ? 'grabbing' : 'grab') : 'default',
}))

function zoomIn() {
  scale.value = Math.min(scale.value + ZOOM_STEP, MAX_SCALE)
  clampTranslate()
}

function zoomOut() {
  scale.value = Math.max(scale.value - ZOOM_STEP, MIN_SCALE)
  if (scale.value <= 1) resetPosition()
  else clampTranslate()
}

function resetZoom() {
  scale.value = 1
  resetPosition()
}

function resetPosition() {
  translateX.value = 0
  translateY.value = 0
}

function clampTranslate() {
  if (!imgRef.value) return
  const maxX = (imgRef.value.offsetWidth * (scale.value - 1)) / (2 * scale.value)
  const maxY = (imgRef.value.offsetHeight * (scale.value - 1)) / (2 * scale.value)
  translateX.value = Math.max(-maxX, Math.min(maxX, translateX.value))
  translateY.value = Math.max(-maxY, Math.min(maxY, translateY.value))
}

// Mouse pan
function onPointerDown(e: PointerEvent) {
  if (scale.value <= 1) return
  isPanning.value = true
  panStart = { x: e.clientX, y: e.clientY }
  translateStart = { x: translateX.value, y: translateY.value }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isPanning.value) return
  const dx = (e.clientX - panStart.x) / scale.value
  const dy = (e.clientY - panStart.y) / scale.value
  translateX.value = translateStart.x + dx
  translateY.value = translateStart.y + dy
  clampTranslate()
}

function onPointerUp() {
  isPanning.value = false
}

// Touch pinch-to-zoom
function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault()
    initialPinchDistance = getDistance(e.touches[0], e.touches[1])
    initialPinchScale = scale.value
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault()
    const dist = getDistance(e.touches[0], e.touches[1])
    const ratio = dist / initialPinchDistance
    scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, initialPinchScale * ratio))
    if (scale.value <= 1) resetPosition()
    else clampTranslate()
  }
}

function getDistance(t1: Touch, t2: Touch): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

// Double-tap to zoom/reset
let lastTap = 0
function onDoubleTap() {
  const now = Date.now()
  if (now - lastTap < 300) {
    if (scale.value > 1) resetZoom()
    else { scale.value = 2.5; clampTranslate() }
  }
  lastTap = now
}

// Wheel zoom
function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}

// Keyboard
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') animateClose()
  if (e.key === '+' || e.key === '=') zoomIn()
  if (e.key === '-') zoomOut()
  if (e.key === '0') resetZoom()
}

onMounted(() => {
  if (overlayRef.value) {
    useGsap.fromTo(overlayRef.value,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' },
    )
  }

  if (contentRef.value) {
    useGsap.fromTo(contentRef.value,
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.4)', delay: 0.1 },
    )
  }

  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

function animateClose() {
  const tl = useGsap.timeline({ onComplete: () => emit('close') })

  if (contentRef.value) {
    tl.to(contentRef.value, {
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      @click="handleOverlayClick"
    >
      <div ref="contentRef" class="relative flex max-h-[90dvh] max-w-3xl flex-col items-center">
        <!-- Barre d'outils -->
        <div class="absolute -top-12 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gray-900/90 px-2 py-1 ring-1 ring-white/10">
          <button
            type="button"
            class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Dézoomer"
            :disabled="scale <= MIN_SCALE"
            @click="zoomOut"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607zM13.5 10.5h-6" />
            </svg>
          </button>

          <button
            type="button"
            class="min-w-10 rounded-full px-2 py-1 text-center text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Réinitialiser le zoom"
            @click="resetZoom"
          >
            {{ Math.round(scale * 100) }}%
          </button>

          <button
            type="button"
            class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Zoomer"
            :disabled="scale >= MAX_SCALE"
            @click="zoomIn"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607zM10.5 7.5v6m3-3h-6" />
            </svg>
          </button>

          <div class="mx-1 h-4 w-px bg-white/15" />

          <!-- Bouton fermer -->
          <button
            type="button"
            class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
            @click="animateClose"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Image zoomable -->
        <div
          class="overflow-hidden rounded-xl"
          @wheel.prevent="onWheel"
          @touchstart.passive="onTouchStart"
          @touchmove="onTouchMove"
          @click="onDoubleTap"
        >
          <img
            ref="imgRef"
            :src="imagePath"
            :alt="sectionLabel ? `Rubrique ${sectionLabel}` : 'Rubrique'"
            :style="imageStyle"
            class="max-h-[80dvh] select-none rounded-xl object-contain shadow-2xl transition-transform duration-150 ease-out"
            draggable="false"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
          />
        </div>

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
