<script setup lang="ts">
import type { QrReaderError } from '~/composables/use-qr-reader'

// Vue caméra du poste de contrôle : lecture continue des QR codes (FR-205, FR-213, FR-214).
const props = defineProps<{
  /** Décodage suspendu (panneau ouvert) ; la vidéo continue */
  paused?: boolean
}>()

const emit = defineEmits<{
  read: [text: string]
  unavailable: [reason: QrReaderError]
}>()

const videoEl = ref<HTMLVideoElement | null>(null)
const { error, active, starting, start, setPaused } = useQrReader((text) => emit('read', text))
const secure = ref(true)

watch(() => props.paused, (value) => setPaused(!!value), { immediate: true })
watch(error, (value) => {
  if (value && value !== 'busy') emit('unavailable', value)
})

async function activate() {
  if (videoEl.value) await start(videoEl.value)
}

onMounted(async () => {
  secure.value = window.isSecureContext
  // Autorisation déjà donnée (Android) : la caméra démarre seule
  try {
    const permission = await navigator.permissions?.query({ name: 'camera' as PermissionName })
    if (permission?.state === 'granted') await activate()
  }
  catch {
    // API des autorisations absente (iOS) : attendre le geste
  }
})

const message = computed(() => {
  if (!secure.value) return 'La caméra exige une connexion sécurisée (HTTPS). Utilisez la saisie manuelle.'
  switch (error.value) {
    case 'denied':
      return 'L\'accès à l\'appareil photo est refusé. Autorisez-le dans les réglages du navigateur pour ce site, ou utilisez la saisie manuelle.'
    case 'busy':
      return 'L\'appareil photo est utilisé par une autre application. Fermez-la, puis réessayez.'
    case 'missing':
    case 'unsupported':
      return 'Aucun appareil photo utilisable. Utilisez la saisie manuelle.'
    default:
      return null
  }
})

defineExpose({ activate })
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-black">
    <video
      ref="videoEl"
      autoplay
      muted
      playsinline
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover"
    />

    <!-- Cadre de visée -->
    <div v-if="active" aria-hidden="true" class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="aspect-square w-[64%] max-w-72 rounded-3xl border-4 border-white/90 shadow-[0_0_0_100vmax_rgba(2,6,23,0.45)]" />
    </div>
    <p v-if="active" class="absolute inset-x-0 bottom-3 px-4 text-center text-lg font-semibold text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.8)]">
      Présentez le QR code du badge
    </p>

    <div v-if="!active" class="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <svg class="size-14 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
      <p v-if="message" class="max-w-sm text-lg leading-snug text-slate-200" role="alert">{{ message }}</p>
      <button
        v-if="secure && error !== 'denied' && error !== 'missing' && error !== 'unsupported'"
        type="button"
        :disabled="starting"
        class="h-14 rounded-2xl bg-white px-7 text-lg font-bold text-slate-950 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-60"
        @click="activate"
      >
        {{ starting ? 'Activation…' : error === 'busy' ? 'Réessayer' : 'Activer la caméra' }}
      </button>
    </div>
  </div>
</template>
