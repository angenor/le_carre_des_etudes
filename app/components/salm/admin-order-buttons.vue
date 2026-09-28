<script setup lang="ts">
// Boutons « Monter » / « Descendre » d'un élément de liste (research R8). Le parent déplace l'élément,
// puis replace le focus par `focus(direction)` et annonce la nouvelle position (aria-live).
const props = defineProps<{ index: number; count: number; label: string; disabled?: boolean }>()
const emit = defineEmits<{ move: [direction: -1 | 1] }>()

const up = ref<HTMLButtonElement>()
const down = ref<HTMLButtonElement>()

function focus(direction: -1 | 1) {
  // En tête ou en fin de liste, le bouton utilisé est désactivé : le focus passe sur l'autre
  const target = direction === -1 ? (props.index > 0 ? up : down) : (props.index < props.count - 1 ? down : up)
  target.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <span class="inline-flex gap-1">
    <button
      ref="up"
      type="button"
      :aria-label="`Monter « ${label} »`"
      :disabled="disabled || index === 0"
      class="rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      @click="emit('move', -1)"
    >
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
    <button
      ref="down"
      type="button"
      :aria-label="`Descendre « ${label} »`"
      :disabled="disabled || index === count - 1"
      class="rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      @click="emit('move', 1)"
    >
      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  </span>
</template>
