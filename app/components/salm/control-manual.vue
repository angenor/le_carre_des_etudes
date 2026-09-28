<script setup lang="ts">
import { formatEntryTime } from '#shared/utils/salm-control'
import type { ManualCard } from '~/composables/use-salm-control'

// Saisie manuelle : numéro de badge ou téléphone, puis fiche et validation (FR-218 à FR-221).
const props = defineProps<{
  card: ManualCard | null
  message: string | null
  searching?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  search: [query: string]
  validate: [card: ManualCard]
  cancel: []
  close: []
}>()

const query = ref('')
const input = ref<HTMLInputElement | null>(null)

onMounted(() => input.value?.focus())

function submit() {
  const q = query.value.trim()
  if (q) emit('search', q)
}

const entryTime = computed(() => (props.card?.entry ? formatEntryTime(props.card.entry.enteredAt) : ''))
</script>

<template>
  <section
    class="fixed inset-x-0 bottom-0 z-30 flex max-h-[88dvh] flex-col rounded-t-3xl bg-slate-900 shadow-[0_-12px_40px_rgb(0_0_0/0.5)] ring-1 ring-white/10"
    aria-labelledby="manual-title"
  >
    <div class="flex items-center justify-between gap-3 px-4 pt-4">
      <h2 id="manual-title" class="text-xl font-bold">Saisie manuelle</h2>
      <button
        type="button"
        class="flex size-12 items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 focus-visible:outline-4 focus-visible:outline-amber-400"
        aria-label="Fermer la saisie manuelle"
        @click="emit('close')"
      >
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <div class="overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <form class="mt-3 flex flex-col gap-3" @submit.prevent="submit">
        <label for="manual-query" class="text-base font-medium text-slate-300">Numéro de badge ou téléphone</label>
        <input
          id="manual-query"
          ref="input"
          v-model="query"
          type="text"
          inputmode="tel"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="40"
          placeholder="482 ou 07 12 34 56 78"
          class="h-14 w-full rounded-2xl border-2 border-slate-600 bg-slate-950 px-4 text-2xl font-semibold tracking-wide text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
        >
        <button
          type="submit"
          :disabled="searching || !query.trim()"
          class="h-14 rounded-2xl bg-white text-lg font-bold text-slate-950 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-50"
        >
          {{ searching ? 'Recherche…' : 'Rechercher' }}
        </button>
      </form>

      <div aria-live="polite" class="mt-4">
        <p v-if="message" class="rounded-2xl bg-slate-800 px-4 py-3 text-lg leading-snug text-slate-100">{{ message }}</p>

        <article v-if="card" class="rounded-2xl bg-slate-800 p-4" :class="message ? 'mt-3' : ''">
          <p class="text-2xl leading-tight font-extrabold uppercase [overflow-wrap:anywhere]">{{ card.person.fullName }}</p>
          <p class="mt-1 text-lg text-slate-300">
            {{ card.person.studyLevel }} · <span class="tabular-nums">{{ card.person.badgeNumber }}</span>
          </p>
          <p v-if="card.trial" class="mt-3 text-lg font-semibold text-amber-300">Mode essai : aucune entrée n'est enregistrée</p>
          <p v-else-if="card.entry" class="mt-3 text-lg font-semibold text-amber-300">Déjà entré·e aujourd'hui à {{ entryTime }}</p>
          <p v-else class="mt-3 text-lg font-semibold text-emerald-300">Pas encore entré·e aujourd'hui</p>

          <button
            v-if="!card.entry"
            type="button"
            :disabled="busy"
            class="mt-4 h-14 w-full rounded-2xl bg-[#14532D] text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-60"
            @click="emit('validate', card)"
          >
            Valider l'entrée
          </button>
          <button
            v-else
            type="button"
            :disabled="busy"
            class="mt-4 h-14 w-full rounded-2xl border-2 border-slate-500 text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-60"
            @click="emit('cancel')"
          >
            Annuler cette entrée
          </button>
        </article>
      </div>

      <button
        type="button"
        class="mt-4 h-14 w-full rounded-2xl bg-slate-700 text-lg font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        @click="emit('close')"
      >
        Retour au scan
      </button>
    </div>
  </section>
</template>
