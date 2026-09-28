<script setup lang="ts">
import { formatDayShort } from '#shared/utils/salm'
import type { SalmControlCounter, SalmControlDay } from '#shared/types/salm'

// Bandeau haut du poste de contrôle : jour contrôlé, compteurs d'entrées (FR-224), états permanents.
const props = defineProps<{
  days: SalmControlDay[]
  counters: SalmControlCounter[]
  todayDayId: number | null
  offline?: boolean
  pendingCount?: number
  readyOffline?: boolean
  snapshotAt?: number | null
}>()

const numberFormat = new Intl.NumberFormat('fr-FR')

const today = computed(() => props.days.find((d) => d.id === props.todayDayId) ?? null)

function countOf(dayId: number): number {
  const base = props.counters.find((c) => c.dayId === dayId)?.entries ?? 0
  // Hors ligne : dernier total connu + entrées en attente d'envoi (R14)
  return dayId === props.todayDayId && props.offline ? base + (props.pendingCount ?? 0) : base
}

const todayCount = computed(() => (today.value ? countOf(today.value.id) : 0))
const otherDays = computed(() => props.days.filter((d) => d.id !== props.todayDayId))

const snapshotTime = computed(() => {
  if (!props.snapshotAt) return ''
  const d = new Date(props.snapshotAt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})
</script>

<template>
  <header class="bg-slate-900 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-lg leading-tight font-bold">
          <template v-if="today">{{ today.label }} · {{ formatDayShort(today.date) }}</template>
          <template v-else>MODE ESSAI</template>
        </p>
        <p v-if="today" class="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span class="text-4xl leading-none font-extrabold tabular-nums">{{ numberFormat.format(todayCount) }}</span>
          <span class="text-base text-slate-300">entrée{{ todayCount > 1 ? 's' : '' }}{{ offline ? ' (hors ligne)' : '' }}</span>
        </p>
        <p v-if="otherDays.length" class="mt-1 text-sm text-slate-400">
          <template v-for="(d, i) in otherDays" :key="d.id">
            <span v-if="i > 0"> · </span>{{ d.label }} : <span class="tabular-nums">{{ numberFormat.format(countOf(d.id)) }}</span>
          </template>
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <p v-if="!today" class="mt-3 rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-stone-950" role="note">
      Aucun jour de salon aujourd'hui : mode essai, aucune entrée n'est enregistrée
    </p>
    <p v-if="offline" class="mt-3 rounded-xl bg-amber-400 px-3 py-2 text-base font-bold text-stone-950" role="status">
      HORS LIGNE · {{ pendingCount ?? 0 }} entrée{{ (pendingCount ?? 0) > 1 ? 's' : '' }} en attente d'envoi
    </p>
    <p v-else-if="readyOffline && snapshotTime" class="mt-2 flex items-center gap-1.5 text-xs text-emerald-300">
      <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" /></svg>
      Prêt hors ligne · liste du {{ snapshotTime }}
    </p>
    <slot />
  </header>
</template>
