<script setup lang="ts">
import '~/assets/css/salm.css'
import { formatHour } from '#shared/utils/salm'

// Compte à rebours en jours (research R10). Rendu serveur stable (date fixe), calcul relatif côté client.
const props = withDefaults(defineProps<{
  opensAtIso: string
  endsAtIso: string
  year: number
  /** Variante mobile : une ligne « Ouverture dans N jours ». */
  inline?: boolean
}>(), { inline: false })

const DAY = 24 * 60 * 60 * 1000
const now = ref<number | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => { now.value = Date.now() }, 60 * 1000)
})
onUnmounted(() => clearInterval(timer))

const opensAt = computed(() => new Date(props.opensAtIso))
const opensDate = computed(() => new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
}).format(opensAt.value))
const opensHour = computed(() => formatHour(props.opensAtIso.slice(11, 16)))

type State =
  | { kind: 'fixed' }
  | { kind: 'days'; days: number }
  | { kind: 'today' }
  | { kind: 'running' }
  | { kind: 'ended' }

const state = computed<State>(() => {
  if (now.value === null) return { kind: 'fixed' }
  const t = now.value
  const opens = opensAt.value.getTime()
  if (t >= new Date(props.endsAtIso).getTime()) return { kind: 'ended' }
  if (t >= opens) return { kind: 'running' }
  // Jours calendaires (UTC = heure d'Abidjan) entre aujourd'hui et le jour d'ouverture
  const today = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth(), new Date(t).getUTCDate())
  const openDay = Date.UTC(opensAt.value.getUTCFullYear(), opensAt.value.getUTCMonth(), opensAt.value.getUTCDate())
  const days = Math.round((openDay - today) / DAY)
  return days <= 0 ? { kind: 'today' } : { kind: 'days', days }
})

const unit = computed(() => (state.value.kind === 'days' && state.value.days === 1 ? 'jour' : 'jours'))
</script>

<template>
  <!-- Variante en ligne (mobile) -->
  <span v-if="inline">
    <template v-if="state.kind === 'days'">Ouverture dans <strong class="text-[#F5F3EF]">{{ state.days }} {{ unit }}</strong></template>
    <template v-else-if="state.kind === 'today'">Ouverture <strong class="text-[#F5F3EF]">aujourd'hui, {{ opensHour }}</strong></template>
    <template v-else-if="state.kind === 'running'"><strong class="text-[#F5F3EF]">Le SALM {{ year }} est en cours</strong></template>
    <template v-else-if="state.kind === 'ended'"><strong class="text-[#F5F3EF]">Merci pour cette édition</strong></template>
    <template v-else>Ouverture le {{ opensDate }} à {{ opensHour }}</template>
  </span>

  <!-- Carte (desktop) -->
  <div v-else class="rounded-[20px] border border-white/10 bg-[#0B0B0D]/72 p-6">
    <template v-if="state.kind === 'days'">
      <p class="text-[13px] font-semibold tracking-[0.12em] text-stone-400">OUVERTURE DANS</p>
      <p class="mt-1.5 flex items-baseline gap-2.5">
        <span class="font-salm-title text-7xl font-extrabold tracking-[-0.04em] text-[#F5F3EF]">{{ state.days }}</span>
        <span class="font-salm-title text-xl font-bold text-salm-accent-text">{{ unit }}</span>
      </p>
      <p class="mt-1 text-sm text-stone-400">Compte à rebours jusqu'au {{ opensDate }}, {{ opensHour }}</p>
    </template>
    <template v-else-if="state.kind === 'today'">
      <p class="text-[13px] font-semibold tracking-[0.12em] text-stone-400">OUVERTURE</p>
      <p class="mt-1.5 font-salm-title text-4xl font-extrabold tracking-[-0.03em] text-[#F5F3EF]">Aujourd'hui, {{ opensHour }}</p>
    </template>
    <template v-else-if="state.kind === 'running'">
      <p class="text-[13px] font-semibold tracking-[0.12em] text-stone-400">EN CE MOMENT</p>
      <p class="mt-1.5 font-salm-title text-3xl font-extrabold tracking-[-0.03em] text-[#F5F3EF]">Le SALM {{ year }} est en cours</p>
    </template>
    <template v-else-if="state.kind === 'ended'">
      <p class="font-salm-title text-3xl font-extrabold tracking-[-0.03em] text-[#F5F3EF]">Merci pour cette édition</p>
    </template>
    <template v-else>
      <p class="text-[13px] font-semibold tracking-[0.12em] text-stone-400">OUVERTURE</p>
      <p class="mt-1.5 font-salm-title text-3xl font-extrabold tracking-[-0.03em] text-[#F5F3EF]">Le {{ opensDate }} à {{ opensHour }}</p>
    </template>
  </div>
</template>
