<script setup lang="ts">
import '~/assets/css/salm.css'
import { formatHour } from '#shared/utils/salm'

// Compte à rebours jours / heures / minutes / secondes (research R10). Rendu serveur stable
// (cases « -- » et date fixe, sans écart d'hydratation), décompte calculé côté client chaque seconde.
const props = defineProps<{
  opensAtIso: string
  endsAtIso: string
  year: number
}>()

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const now = ref<number | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
    if (now.value >= new Date(props.endsAtIso).getTime()) clearInterval(timer)
  }, SECOND)
})
onUnmounted(() => clearInterval(timer))

const opensAt = computed(() => new Date(props.opensAtIso))
const opensDate = computed(() => new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
}).format(opensAt.value))
const opensHour = computed(() => formatHour(props.opensAtIso.slice(11, 16)))

type State =
  | { kind: 'pending' }
  | { kind: 'counting'; days: number; hours: number; minutes: number; seconds: number }
  | { kind: 'running' }
  | { kind: 'ended' }

const state = computed<State>(() => {
  if (now.value === null) return { kind: 'pending' }
  const t = now.value
  if (t >= new Date(props.endsAtIso).getTime()) return { kind: 'ended' }
  const left = opensAt.value.getTime() - t
  if (left <= 0) return { kind: 'running' }
  return {
    kind: 'counting',
    days: Math.floor(left / DAY),
    hours: Math.floor((left % DAY) / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
    seconds: Math.floor((left % MINUTE) / SECOND),
  }
})

// Cases affichées ; « short » sert sous 380 px de large, où « SECONDES » ne tient pas
const cells = computed(() => {
  const s = state.value.kind === 'counting' ? state.value : null
  const cell = (n: number | undefined, one: string, many: string, short: string) => ({
    value: n === undefined ? '--' : String(n).padStart(2, '0'),
    label: n === 1 ? one : many,
    short,
  })
  return [
    cell(s?.days, 'JOUR', 'JOURS', 'JOURS'),
    cell(s?.hours, 'HEURE', 'HEURES', 'HEURES'),
    cell(s?.minutes, 'MINUTE', 'MINUTES', 'MIN'),
    cell(s?.seconds, 'SECONDE', 'SECONDES', 'SEC'),
  ]
})

// Texte lu par les lecteurs d'écran : à la minute près, pour ne pas changer à chaque seconde
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
const spoken = computed(() => {
  const s = state.value
  if (s.kind !== 'counting') return `Ouverture le ${opensDate.value} à ${opensHour.value}`
  return `Ouverture dans ${plural(s.days, 'jour')}, ${plural(s.hours, 'heure')} et ${plural(s.minutes, 'minute')}`
})
</script>

<template>
  <div class="rounded-[20px] border border-white/10 bg-salm-bg/72 p-4 min-[380px]:p-5">
    <template v-if="state.kind === 'running'">
      <p class="text-[13px] font-semibold tracking-[0.12em] text-stone-400">EN CE MOMENT</p>
      <p class="mt-1.5 font-salm-title text-3xl font-extrabold tracking-[-0.03em] text-[#F5F3EF]">Le SALM {{ year }} est en cours</p>
    </template>
    <template v-else-if="state.kind === 'ended'">
      <p class="font-salm-title text-3xl font-extrabold tracking-[-0.03em] text-[#F5F3EF]">Merci pour cette édition</p>
    </template>
    <template v-else>
      <p class="text-[13px] font-semibold tracking-[0.12em] text-stone-400">OUVERTURE DANS</p>
      <p class="sr-only">{{ spoken }}</p>
      <ol class="mt-3 grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-1.5 min-[380px]:gap-2" aria-hidden="true">
        <li
          v-for="(c, i) in cells"
          :key="c.short"
          class="flex min-w-0 flex-col items-center rounded-xl border border-white/10 bg-white/4 px-0.5 pt-2.5 pb-2"
        >
          <!-- Nouvelle clé à chaque changement de valeur : l'animation salm-tick rejoue -->
          <span class="block h-9 overflow-hidden">
            <span
              :key="c.value"
              class="salm-tick block font-salm-title text-[28px] leading-9 font-extrabold tracking-[-0.03em] tabular-nums md:text-[30px]"
              :class="i === 3 ? 'text-salm-accent-text' : 'text-[#F5F3EF]'"
            >{{ c.value }}</span>
          </span>
          <span class="mt-1 text-[10px] font-bold tracking-widest text-stone-400">
            <span class="min-[380px]:hidden">{{ c.short }}</span>
            <span class="hidden min-[380px]:inline">{{ c.label }}</span>
          </span>
        </li>
      </ol>
      <p class="mt-3 text-sm text-stone-400">Jusqu'au {{ opensDate }}, {{ opensHour }}</p>
    </template>
  </div>
</template>
