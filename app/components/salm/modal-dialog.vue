<script setup lang="ts">
import '~/assets/css/salm.css'

// Fenêtre accessible sur <dialog> natif (research R9) : vidéo et galerie photo (FR-016, FR-017).
// showModal() rend la page inerte (focus piégé), Échap déclenche `cancel`, le focus revient au déclencheur.
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  /** Titre visuellement masqué (il reste le nom accessible de la fenêtre). */
  hideTitle?: boolean
  size?: 'video' | 'gallery'
}>(), { hideTitle: false, size: 'video' })

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLDialogElement>()
const closeRef = ref<HTMLButtonElement>()
const titleId = useId()
let trigger: HTMLElement | null = null

async function sync(open: boolean) {
  const dialog = dialogRef.value
  if (!dialog) return
  if (open && !dialog.open) {
    trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    await nextTick()
    closeRef.value?.focus()
  }
  else if (!open && dialog.open) {
    dialog.close()
  }
}

watch(() => props.open, sync)
onMounted(() => sync(props.open))

function onCancel(event: Event) {
  event.preventDefault()
  emit('close')
}

function onClose() {
  if (props.open) emit('close')
  // Restauration explicite du focus (navigateurs qui ne le font pas d'eux-mêmes)
  const target = trigger
  trigger = null
  if (target?.isConnected) requestAnimationFrame(() => target.focus())
}

// Clic sur le fond (hors du contenu) : fermeture
function onDialogClick(event: MouseEvent) {
  if (event.target === dialogRef.value) emit('close')
}

onBeforeUnmount(() => {
  if (dialogRef.value?.open) dialogRef.value.close()
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="salm-dialog m-auto max-h-[92dvh] w-[min(100%-2rem,72rem)] overflow-visible bg-transparent p-0 text-[#F5F3EF] backdrop:bg-black/85"
    :class="size === 'gallery' ? 'max-w-6xl' : 'max-w-5xl'"
    :aria-labelledby="titleId"
    @cancel="onCancel"
    @close="onClose"
    @click="onDialogClick"
  >
    <div class="flex flex-col gap-3 font-salm-body">
      <div class="flex items-center justify-between gap-4">
        <h2
          :id="titleId"
          class="font-salm-title text-base font-bold sm:text-lg"
          :class="{ 'sr-only': hideTitle }"
        >
          {{ title }}
        </h2>
        <button
          ref="closeRef"
          type="button"
          class="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
          @click="emit('close')"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 18 18 6M6 6l12 12" /></svg>
          Fermer
        </button>
      </div>
      <slot v-if="open" />
    </div>
  </dialog>
</template>
