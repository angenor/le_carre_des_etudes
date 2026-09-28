<script setup lang="ts">
import type { ControlDisplay, ControlTone } from '~/composables/use-salm-control'

// Résultat plein écran d'un contrôle, lisible à bout de bras en plein soleil (FR-207, FR-208, R11).
const props = defineProps<{
  result: ControlDisplay | null
  busy?: boolean
}>()

const emit = defineEmits<{
  cancel: []
  retry: []
  relogin: []
  close: []
}>()

// Palette AAA (contraste ≥ 7:1) ; chaque état a aussi son icône et son mot
const TONES: Record<ControlTone, { bg: string; fg: string; icon: 'check' | 'bang' | 'cross' | 'question' }> = {
  entered: { bg: '#14532D', fg: '#FFFFFF', icon: 'check' },
  trial: { bg: '#14532D', fg: '#FFFFFF', icon: 'check' },
  already: { bg: '#FBBF24', fg: '#1C1917', icon: 'bang' },
  refused: { bg: '#991B1B', fg: '#FFFFFF', icon: 'cross' },
  neutral: { bg: '#334155', fg: '#FFFFFF', icon: 'question' },
}

const tone = computed(() => (props.result ? TONES[props.result.tone] : TONES.neutral))
const light = computed(() => props.result?.tone === 'already')
</script>

<template>
  <div
    v-show="result"
    class="fixed inset-0 z-40 flex flex-col"
    :style="{ backgroundColor: tone.bg, color: tone.fg }"
  >
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      class="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4 text-center"
    >
      <template v-if="result">
        <svg class="size-[72px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path v-if="tone.icon === 'check'" d="M20 6 9 17l-5-5" />
          <template v-else-if="tone.icon === 'bang'">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 7v6M12 17h.01" />
          </template>
          <path v-else-if="tone.icon === 'cross'" d="M6 18 18 6M6 6l12 12" />
          <template v-else>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
          </template>
        </svg>
        <p class="text-[2.75rem] leading-[1.05] font-extrabold tracking-tight uppercase [overflow-wrap:anywhere]">
          {{ result.title }}
        </p>
        <p v-if="result.detail" class="text-2xl leading-snug font-semibold">{{ result.detail }}</p>
        <template v-if="result.person">
          <p class="mt-3 text-3xl leading-tight font-extrabold uppercase [overflow-wrap:anywhere]">
            {{ result.person.fullName }}
          </p>
          <p class="text-[1.375rem] leading-snug font-medium">
            {{ result.person.studyLevel }} · <span class="tabular-nums">{{ result.person.badgeNumber }}</span>
          </p>
        </template>
      </template>
    </div>

    <!-- Actions dans le tiers bas, au pouce -->
    <div v-if="result" class="flex flex-col gap-3 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <button
        v-if="result.entryId !== null || result.queuedClientId !== null"
        type="button"
        :disabled="busy"
        class="h-14 rounded-2xl border-2 text-lg font-bold focus-visible:outline-4 focus-visible:outline-offset-2 disabled:opacity-60"
        :class="light ? 'border-stone-900/70 focus-visible:outline-stone-900' : 'border-white/70 focus-visible:outline-white'"
        @click="emit('cancel')"
      >
        Annuler cette entrée
      </button>
      <button
        v-if="result.action"
        type="button"
        :disabled="busy"
        class="h-14 rounded-2xl bg-white text-lg font-bold text-slate-950 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
        @click="result.action === 'relogin' ? emit('relogin') : emit('retry')"
      >
        {{ result.action === 'relogin' ? 'Se reconnecter' : 'Réessayer' }}
      </button>
      <button
        type="button"
        class="h-14 rounded-2xl text-lg font-bold focus-visible:outline-4 focus-visible:outline-offset-2"
        :class="light ? 'bg-stone-900 text-amber-300 focus-visible:outline-stone-900' : 'bg-black/35 text-white focus-visible:outline-white'"
        @click="emit('close')"
      >
        Retour au scan
      </button>
    </div>
  </div>
</template>
