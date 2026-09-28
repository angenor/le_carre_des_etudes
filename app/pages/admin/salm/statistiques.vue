<script setup lang="ts">
import { Bar, Line } from 'vue-chartjs'
import type { SalmAdminEditionsResponse, SalmAdminStats, SalmPurgedStats } from '#shared/types/salm'

// Statistiques d'une édition du SALM, comparées à l'édition précédente (specs/007, FR-190 à FR-197).
// Éléments Chart.js enregistrés par app/plugins/chartjs.client.ts.
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Statistiques SALM — Administration' })

const route = useRoute()
const router = useRouter()

const { data: list } = await useFetch<SalmAdminEditionsResponse>('/api/admin/salm/editions', { key: 'salm-admin-editions' })
const editions = computed(() => list.value?.data ?? [])
const current = computed(() => {
  const year = Number(route.query.edition)
  return editions.value.find((e) => e.year === year)
    ?? editions.value.find((e) => e.id === list.value?.defaultEditionId)
    ?? null
})

function select(year: number) {
  router.replace({ query: { ...route.query, edition: String(year) } })
}

const { data: stats, error } = await useFetch<SalmAdminStats>(
  () => `/api/admin/salm/editions/${current.value?.id ?? 0}/stats`,
  { immediate: !!current.value },
)

const year = computed(() => stats.value?.edition.year ?? current.value?.year ?? 0)
const comparison = computed(() => stats.value?.comparison ?? null)
const s = computed(() => stats.value?.stats ?? null)
const empty = computed(() => !!s.value && s.value.students.total + s.value.schools.total === 0)

const EDITION_COLOR = '#059669'
const COMPARISON_COLOR = '#9ca3af'

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

function n(value: number) {
  return value.toLocaleString('fr-FR')
}

/** Écart avec l'édition de comparaison : « +12 % » (ou « — » si la référence vaut 0) et « +51 ». */
function delta(value: number, reference: number) {
  const diff = value - reference
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : ''
  return {
    percent: reference === 0 ? '—' : `${sign}${Math.round(Math.abs(diff) / reference * 100)} %`,
    count: `${sign}${n(Math.abs(diff))}`,
  }
}

// ---- Cartes de totaux ----
const cards = computed(() => {
  if (!s.value) return []
  const c = comparison.value?.stats
  return [
    { label: 'Étudiant·e·s inscrit·e·s', value: s.value.students.total, reference: c?.students.total },
    { label: 'Établissements', value: s.value.schools.total, reference: c?.schools.total },
    { label: 'Exposants (hors annulations)', value: s.value.schools.exhibitors, reference: c?.schools.exhibitors },
  ]
})

// ---- Inscriptions par jour et cumul ----
function dayRange(first: string, last: string) {
  const days: string[] = []
  for (let d = new Date(`${first}T00:00:00Z`); d <= new Date(`${last}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const daily = computed(() => {
  const byDay = s.value?.students.byRegistrationDay ?? {}
  const keys = Object.keys(byDay).sort()
  if (!keys.length) return []
  let total = 0
  return dayRange(keys[0]!, keys.at(-1)!).map((day) => {
    const count = byDay[day] ?? 0
    total += count
    return { day, count, total }
  })
})

const dailyChart = computed(() => ({
  labels: daily.value.map((d) => formatDay(d.day)),
  datasets: [
    { label: 'Inscriptions du jour', data: daily.value.map((d) => d.count), borderColor: EDITION_COLOR, backgroundColor: EDITION_COLOR, pointRadius: pointRadius(daily.value.length), yAxisID: 'y', tension: 0.2 },
    { label: 'Cumul', data: daily.value.map((d) => d.total), borderColor: '#d97706', backgroundColor: '#d97706', borderDash: [6, 4], pointRadius: pointRadius(daily.value.length), yAxisID: 'y1', tension: 0.2 },
  ],
}))

const dailyOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  scales: {
    y: { beginAtZero: true, position: 'left' as const, title: { display: true, text: 'Par jour' }, ticks: { precision: 0 } },
    y1: { beginAtZero: true, position: 'right' as const, title: { display: true, text: 'Cumul' }, grid: { drawOnChartArea: false }, ticks: { precision: 0 } },
  },
}

// ---- Cumuls alignés sur « J-n avant l'ouverture » (FR-194) ----
function daysBefore(day: string, opensAtIso: string) {
  const open = Date.UTC(...(opensAtIso.slice(0, 10).split('-').map(Number) as [number, number, number]))
  const at = Date.UTC(...(day.split('-').map(Number) as [number, number, number]))
  return Math.round((open - at) / 86_400_000)
}

function offsetsOf(block: { stats: SalmPurgedStats }, opensAtIso: string) {
  const byOffset = new Map<number, number>()
  for (const [day, count] of Object.entries(block.stats.students.byRegistrationDay)) {
    const offset = daysBefore(day.slice(0, 10), opensAtIso)
    byOffset.set(offset, (byOffset.get(offset) ?? 0) + count)
  }
  return byOffset
}

function offsetLabel(offset: number) {
  return offset >= 0 ? `J-${offset}` : `J+${-offset}`
}

const aligned = computed(() => {
  const st = stats.value
  const cmp = comparison.value
  if (!st || !cmp || !st.edition.opensAtIso || !cmp.opensAtIso) return null
  const mine = offsetsOf(st, st.edition.opensAtIso)
  const theirs = offsetsOf(cmp, cmp.opensAtIso)
  const all = [...new Set([...mine.keys(), ...theirs.keys()])]
  if (!all.length) return null
  const from = Math.max(...all)
  const to = Math.min(...all, 0)
  const rows: { offset: number; mine: number; theirs: number }[] = []
  let a = 0
  let b = 0
  for (let offset = from; offset >= to; offset--) {
    a += mine.get(offset) ?? 0
    b += theirs.get(offset) ?? 0
    rows.push({ offset, mine: a, theirs: b })
  }
  return rows
})

const alignedChart = computed(() => ({
  labels: (aligned.value ?? []).map((r) => offsetLabel(r.offset)),
  datasets: [
    { label: `SALM ${year.value}`, data: (aligned.value ?? []).map((r) => r.mine), borderColor: EDITION_COLOR, backgroundColor: EDITION_COLOR, pointRadius: pointRadius(aligned.value?.length ?? 0), tension: 0.2 },
    { label: `SALM ${comparison.value?.year}`, data: (aligned.value ?? []).map((r) => r.theirs), borderColor: COMPARISON_COLOR, backgroundColor: COMPARISON_COLOR, borderDash: [6, 4], pointRadius: pointRadius(aligned.value?.length ?? 0), tension: 0.2 },
  ],
}))

// Points visibles sur une série courte (un seul jour compris), masqués sur une longue série
function pointRadius(count: number) {
  return count > 45 ? 0 : 3
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}

// ---- Niveaux d'étude (6 niveaux, y compris ceux à 0) ----
const levels = computed(() => STUDY_LEVELS.map((level) => ({
  level,
  mine: s.value?.students.byStudyLevel[level] ?? 0,
  theirs: comparison.value?.stats.students.byStudyLevel[level] ?? 0,
})))

const levelsChart = computed(() => ({
  labels: levels.value.map((l) => l.level),
  datasets: [
    { label: `SALM ${year.value}`, data: levels.value.map((l) => l.mine), backgroundColor: EDITION_COLOR },
    ...(comparison.value ? [{ label: `SALM ${comparison.value.year}`, data: levels.value.map((l) => l.theirs), backgroundColor: COMPARISON_COLOR }] : []),
  ],
}))

const barOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
}

// ---- Tableaux : types de stands et statuts ----
const standRows = computed(() => {
  const mine = s.value?.schools.byStandType ?? {}
  const theirs = comparison.value?.stats.schools.byStandType ?? {}
  const known = stats.value?.standTypes ?? []
  const names = [...known.map((t) => t.name), ...Object.keys(mine), ...Object.keys(theirs)]
  return [...new Set(names)].map((name) => ({
    label: known.find((t) => t.name === name)?.isVisible === false ? `${name} (masqué)` : name,
    mine: mine[name] ?? 0,
    theirs: theirs[name] ?? 0,
  }))
})

const statusRows = computed(() => SCHOOL_STATUSES.map((status) => ({
  label: SCHOOL_STATUS_LABELS[status],
  mine: s.value?.schools.byStatus[status] ?? 0,
  theirs: comparison.value?.stats.schools.byStatus[status] ?? 0,
})))
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-gray-800">Statistiques{{ current ? ` — SALM ${current.year}` : ' SALM' }}</h1>
      <div v-if="editions.length" class="flex items-center gap-2">
        <label for="stats-edition" class="text-sm font-medium text-gray-700">Édition</label>
        <select
          id="stats-edition"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          @change="select(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="e in editions" :key="e.id" :value="e.year" :selected="e.year === current?.year">{{ e.year }} ({{ salmEditionStatus(e.status).label.toLocaleLowerCase('fr-FR') }})</option>
        </select>
      </div>
    </div>

    <p v-if="!current" class="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">Aucune édition du SALM.</p>
    <p v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{{ salmAdminErrorFrom(error) }}</p>

    <template v-else-if="stats && s">
      <!-- Mentions de conservation -->
      <p v-if="stats.source === 'purged' && stats.purgedAt" class="mb-2 text-sm text-gray-600">
        SALM {{ year }} : chiffres conservés après suppression des données personnelles le {{ formatDay(stats.purgedAt) }}.
      </p>
      <p v-if="comparison?.source === 'purged' && comparison.purgedAt" class="mb-2 text-sm text-gray-600">
        SALM {{ comparison.year }} : chiffres conservés après suppression des données personnelles le {{ formatDay(comparison.purgedAt) }}.
      </p>

      <!-- Totaux -->
      <div class="mt-4 mb-6 grid gap-4 sm:grid-cols-3">
        <div v-for="card in cards" :key="card.label" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-xs text-gray-500">{{ card.label }}</p>
          <p class="mt-1 text-2xl font-bold text-gray-900">
            {{ n(card.value) }}
            <span v-if="comparison && card.reference !== undefined" class="text-sm font-medium text-gray-600">
              · {{ delta(card.value, card.reference).percent }} par rapport à {{ comparison.year }}
            </span>
          </p>
          <p v-if="comparison && card.reference !== undefined" class="mt-1 text-xs text-gray-500">
            {{ delta(card.value, card.reference).count }} ({{ n(card.reference) }} en {{ comparison.year }})
          </p>
        </div>
      </div>

      <p v-if="empty" class="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
        Aucune inscription pour le SALM {{ year }}.
      </p>

      <template v-else>
        <!-- Inscriptions par jour -->
        <section class="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="chart-daily-title">
          <h2 id="chart-daily-title" class="mb-4 text-base font-semibold text-gray-800">Inscriptions étudiantes par jour et cumul</h2>
          <div class="h-72">
            <ClientOnly>
              <Line v-if="daily.length" :data="dailyChart" :options="dailyOptions" aria-label="Graphique des inscriptions étudiantes par jour et de leur cumul" />
              <p v-else class="flex h-full items-center justify-center text-sm text-gray-400">Aucune inscription étudiante.</p>
            </ClientOnly>
          </div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer font-medium text-gray-700">Voir les données</summary>
            <div class="mt-2 max-h-72 overflow-auto">
              <table class="min-w-full text-left">
                <caption class="sr-only">Inscriptions étudiantes par jour d'inscription, SALM {{ year }}</caption>
                <thead class="text-xs text-gray-500 uppercase"><tr><th scope="col" class="py-1 pr-4">Jour</th><th scope="col" class="py-1 pr-4">Inscriptions</th><th scope="col" class="py-1">Cumul</th></tr></thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="d in daily" :key="d.day"><th scope="row" class="py-1 pr-4 font-normal">{{ formatDay(d.day) }}</th><td class="py-1 pr-4">{{ n(d.count) }}</td><td class="py-1">{{ n(d.total) }}</td></tr>
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <!-- Cumuls alignés -->
        <section v-if="aligned" class="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="chart-aligned-title">
          <h2 id="chart-aligned-title" class="mb-4 text-base font-semibold text-gray-800">
            Cumul des inscriptions avant l'ouverture : SALM {{ year }} et SALM {{ comparison?.year }}
          </h2>
          <div class="h-72">
            <ClientOnly>
              <Line :data="alignedChart" :options="lineOptions" :aria-label="`Cumul des inscriptions alignées sur J-n avant l'ouverture, SALM ${year} et SALM ${comparison?.year}`" />
            </ClientOnly>
          </div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer font-medium text-gray-700">Voir les données</summary>
            <div class="mt-2 max-h-72 overflow-auto">
              <table class="min-w-full text-left">
                <caption class="sr-only">Cumul des inscriptions par nombre de jours avant l'ouverture</caption>
                <thead class="text-xs text-gray-500 uppercase"><tr><th scope="col" class="py-1 pr-4">Jour</th><th scope="col" class="py-1 pr-4">{{ year }}</th><th scope="col" class="py-1">{{ comparison?.year }}</th></tr></thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="r in aligned" :key="r.offset"><th scope="row" class="py-1 pr-4 font-normal">{{ offsetLabel(r.offset) }}</th><td class="py-1 pr-4">{{ n(r.mine) }}</td><td class="py-1">{{ n(r.theirs) }}</td></tr>
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <!-- Niveaux d'étude -->
        <section class="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="chart-levels-title">
          <h2 id="chart-levels-title" class="mb-4 text-base font-semibold text-gray-800">Étudiant·e·s par niveau d'étude</h2>
          <div class="h-72">
            <ClientOnly>
              <Bar :data="levelsChart" :options="barOptions" aria-label="Graphique en barres des inscriptions étudiantes par niveau d'étude" />
            </ClientOnly>
          </div>
          <details class="mt-3 text-sm">
            <summary class="cursor-pointer font-medium text-gray-700">Voir les données</summary>
            <table class="mt-2 min-w-full text-left">
              <caption class="sr-only">Étudiant·e·s par niveau d'étude</caption>
              <thead class="text-xs text-gray-500 uppercase">
                <tr>
                  <th scope="col" class="py-1 pr-4">Niveau</th>
                  <th scope="col" class="py-1 pr-4">{{ year }}</th>
                  <th v-if="comparison" scope="col" class="py-1 pr-4">{{ comparison.year }}</th>
                  <th v-if="comparison" scope="col" class="py-1">Écart</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="l in levels" :key="l.level">
                  <th scope="row" class="py-1 pr-4 font-normal">{{ l.level }}</th>
                  <td class="py-1 pr-4">{{ n(l.mine) }}</td>
                  <td v-if="comparison" class="py-1 pr-4">{{ n(l.theirs) }}</td>
                  <td v-if="comparison" class="py-1">{{ delta(l.mine, l.theirs).count }}</td>
                </tr>
              </tbody>
            </table>
          </details>
        </section>

        <!-- Stands et statuts -->
        <div class="grid gap-6 lg:grid-cols-2">
          <section
            v-for="table in [
              { id: 'stands', title: 'Établissements par type de stand', head: 'Type de stand', rows: standRows },
              { id: 'statuses', title: 'Établissements par statut', head: 'Statut', rows: statusRows },
            ]"
            :key="table.id"
            class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            :aria-labelledby="`table-${table.id}-title`"
          >
            <h2 :id="`table-${table.id}-title`" class="mb-3 text-base font-semibold text-gray-800">{{ table.title }}</h2>
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs text-gray-500 uppercase">
                <tr>
                  <th scope="col" class="py-1 pr-4">{{ table.head }}</th>
                  <th scope="col" class="py-1 pr-4">{{ year }}</th>
                  <th v-if="comparison" scope="col" class="py-1 pr-4">{{ comparison.year }}</th>
                  <th v-if="comparison" scope="col" class="py-1">Écart</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in table.rows" :key="row.label">
                  <th scope="row" class="py-1.5 pr-4 font-normal text-gray-800">{{ row.label }}</th>
                  <td class="py-1.5 pr-4">{{ n(row.mine) }}</td>
                  <td v-if="comparison" class="py-1.5 pr-4">{{ n(row.theirs) }}</td>
                  <td v-if="comparison" class="py-1.5">{{ delta(row.mine, row.theirs).count }}</td>
                </tr>
                <tr v-if="!table.rows.length"><td colspan="4" class="py-2 text-gray-500">Aucun type de stand.</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </template>
    </template>
  </div>
</template>
