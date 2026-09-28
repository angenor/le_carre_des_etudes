<script setup lang="ts">
import { formatDayTab } from '#shared/utils/salm'
import { formatEntryTime } from '#shared/utils/salm-control'
import type { SalmAdminStudentsResponse } from '#shared/types/salm'

definePageMeta({
  layout: 'admin',
})

// Suivi des inscriptions étudiantes (US4, FR-062 à FR-065).
const { current, refresh: refreshEditions } = await useSalmAdminEdition()

const page = ref(1)
const limit = ref(20)
const search = ref('')
const searchInput = ref('')
const studyLevel = ref('')
const presence = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

let debounceTimer: ReturnType<typeof setTimeout>
function onSearchInput(value: string) {
  searchInput.value = value
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    search.value = value
    page.value = 1
  }, 400)
}

watch([studyLevel, presence], () => { page.value = 1 })
watch(() => current.value?.id, () => {
  page.value = 1
  presence.value = ''
})

function toggleSort(field: string) {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = field === 'createdAt' ? 'desc' : 'asc'
  }
  page.value = 1
}

function sortIcon(field: string) {
  if (sortBy.value !== field) return ''
  return sortOrder.value === 'asc' ? ' ↑' : ' ↓'
}

const editionId = computed(() => current.value?.id ?? 0)
const { data: result, refresh } = await useFetch<SalmAdminStudentsResponse>(() => `/api/admin/salm/editions/${editionId.value}/students`, {
  query: { page, limit, search, studyLevel, presence, sortBy, sortOrder },
  watch: [page, limit, search, studyLevel, presence, sortBy, sortOrder],
  immediate: !!editionId.value,
})

const totalPages = computed(() => Math.ceil((result.value?.total ?? 0) / limit.value))
// Jours de salon de l'édition : compteurs d'entrées, filtre et colonnes de présence (008, FR-225, FR-226)
const days = computed(() => result.value?.days ?? [])
const numberFormat = new Intl.NumberFormat('fr-FR')

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function exportCsv() {
  const params = new URLSearchParams({ sortBy: sortBy.value, sortOrder: sortOrder.value })
  if (search.value) params.set('search', search.value)
  if (studyLevel.value) params.set('studyLevel', studyLevel.value)
  if (presence.value) params.set('presence', presence.value)
  window.open(`/api/admin/salm/editions/${editionId.value}/students/export?${params}`, '_blank')
}

// Suppression en 2 clics (pattern newsletter.vue)
const deletingId = ref<number | null>(null)
const confirmId = ref<number | null>(null)

async function requestDelete(id: number) {
  if (confirmId.value === id) {
    deletingId.value = id
    try {
      await $fetch(`/api/admin/salm/students/${id}`, { method: 'DELETE' })
      await Promise.all([refresh(), refreshEditions()])
    } catch {
      // l'erreur laisse la ligne en place
    } finally {
      deletingId.value = null
      confirmId.value = null
    }
  } else {
    confirmId.value = id
    setTimeout(() => {
      if (confirmId.value === id) confirmId.value = null
    }, 3000)
  }
}

const columns = [
  { key: 'badgeSeq', label: 'N° de badge' },
  { key: 'fullName', label: 'Nom & prénoms' },
  { key: null, label: 'Téléphone' },
  { key: null, label: 'Niveau' },
  { key: 'createdAt', label: 'Date' },
]
</script>

<template>
  <div>
    <SalmAdminHeader />

    <template v-if="current && !current.retention.purgedAt">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-gray-600">
          <p>
            <strong class="text-lg font-semibold text-gray-900">{{ result?.grandTotal ?? 0 }}</strong>
            inscrit·e{{ (result?.grandTotal ?? 0) > 1 ? '·s' : '' }}
          </p>
          <p v-for="day in days" :key="day.id">
            {{ day.label }} · {{ formatDayTab(day.date) }} :
            <strong class="font-semibold text-gray-900">{{ numberFormat.format(day.entries) }}</strong>
            entrée{{ day.entries > 1 ? 's' : '' }}
          </p>
        </div>
        <button
          @click="exportCsv"
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exporter CSV
        </button>
      </div>

      <!-- Recherche et filtre -->
      <div class="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          :value="searchInput"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
          type="search"
          aria-label="Rechercher par nom ou téléphone"
          placeholder="Rechercher par nom ou téléphone…"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-md"
        />
        <select
          v-model="studyLevel"
          aria-label="Filtrer par niveau d'étude"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Tous les niveaux</option>
          <option v-for="level in STUDY_LEVELS" :key="level" :value="level">{{ level }}</option>
        </select>
        <select
          v-if="days.length"
          v-model="presence"
          aria-label="Filtrer par présence"
          class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Présence : tous</option>
          <template v-for="day in days" :key="day.id">
            <option :value="`present:${day.id}`">Présent·e le {{ day.label }}</option>
            <option :value="`absent:${day.id}`">Absent·e le {{ day.label }}</option>
          </template>
        </select>
      </div>

      <!-- Tableau -->
      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="col in columns"
                :key="col.label"
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                :class="col.key ? 'cursor-pointer hover:text-gray-700' : ''"
                :aria-sort="col.key && sortBy === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined"
                @click="col.key && toggleSort(col.key)"
              >
                {{ col.label }}{{ col.key ? sortIcon(col.key) : '' }}
              </th>
              <th
                v-for="day in days"
                :key="`day-${day.id}`"
                class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                :title="`Heure d'entrée · ${formatDayTab(day.date)}`"
              >
                {{ day.label }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="!result?.data?.length">
              <td :colspan="6 + days.length" class="px-4 py-8 text-center text-sm text-gray-400">
                Aucune inscription trouvée
              </td>
            </tr>
            <tr v-for="row in result?.data" :key="row.id" class="hover:bg-gray-50">
              <td class="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900">{{ row.badgeNumber }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                {{ row.fullName }}
                <span
                  v-if="row.origin === 'onsite'"
                  class="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                  title="Inscrit·e par l'équipe au salon"
                >Sur place</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ row.phone }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ row.studyLevel }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ formatDate(row.createdAt) }}</td>
              <td v-for="day in days" :key="`day-${day.id}`" class="whitespace-nowrap px-4 py-3 text-sm tabular-nums">
                <span v-if="row.entries[day.id]" class="font-medium text-emerald-700">{{ formatEntryTime(row.entries[day.id]!) }}</span>
                <span v-else class="text-gray-300" aria-label="Absent·e">—</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right">
                <a
                  :href="`/api/admin/salm/students/${row.id}/badge`"
                  download
                  class="rounded-md px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  Badge
                </a>
                <button
                  @click="requestDelete(row.id)"
                  :disabled="deletingId === row.id"
                  class="ml-1 rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                  :class="confirmId === row.id
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-red-600 hover:bg-red-50'"
                >
                  {{ deletingId === row.id ? '...' : confirmId === row.id ? 'Confirmer' : 'Supprimer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between text-sm text-gray-600">
        <p>
          Page {{ result?.page }} sur {{ totalPages }} — {{ result?.total }} résultat{{ (result?.total ?? 0) > 1 ? 's' : '' }}
        </p>
        <div class="flex gap-2">
          <button
            :disabled="page <= 1"
            @click="page--"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            :disabled="page >= totalPages"
            @click="page++"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>
      <p v-else-if="result?.total" class="mt-4 text-sm text-gray-600">
        {{ result.total }} résultat{{ result.total > 1 ? 's' : '' }}
      </p>
    </template>
  </div>
</template>
