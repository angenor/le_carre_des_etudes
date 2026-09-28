<script setup lang="ts">
import type { SalmAdminSchoolRow } from '#shared/types/salm'

definePageMeta({
  layout: 'admin',
})

// Suivi des inscriptions établissements (US4, FR-066 à FR-068a).
const { current } = await useSalmAdminEdition()

const page = ref(1)
const limit = ref(20)
const search = ref('')
const searchInput = ref('')
const status = ref('')
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

function filterStatus(value: string) {
  status.value = status.value === value ? '' : value
  page.value = 1
}

watch(() => current.value?.id, () => { page.value = 1 })

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
const { data: result } = await useFetch<{
  data: SalmAdminSchoolRow[]
  total: number
  page: number
  limit: number
  countsByStatus: Record<string, number>
}>(() => `/api/admin/salm/editions/${editionId.value}/schools`, {
  query: { page, limit, search, status, sortBy, sortOrder },
  watch: [page, limit, search, status, sortBy, sortOrder],
  immediate: !!editionId.value,
})

const totalPages = computed(() => Math.ceil((result.value?.total ?? 0) / limit.value))

const STATUS_CLASSES: Record<string, string> = {
  nouvelle: 'bg-blue-100 text-blue-700',
  contactee: 'bg-amber-100 text-amber-800',
  confirmee: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-gray-200 text-gray-600',
}

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
  if (status.value) params.set('status', status.value)
  window.open(`/api/admin/salm/editions/${editionId.value}/schools/export?${params}`, '_blank')
}

function exportExhibitors() {
  window.open(`/api/admin/salm/editions/${editionId.value}/exhibitors/export`, '_blank')
}
</script>

<template>
  <div>
    <SalmAdminHeader />

    <template v-if="current && !current.retention.purgedAt">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
        <!-- Compteurs par statut, cliquables comme filtre -->
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
          <button
            v-for="s in SCHOOL_STATUSES"
            :key="s"
            type="button"
            :aria-pressed="status === s ? 'true' : 'false'"
            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            :class="status === s ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'"
            @click="filterStatus(s)"
          >
            {{ schoolStatusLabel(s) }} · {{ result?.countsByStatus?.[s] ?? 0 }}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            @click="exportExhibitors"
            class="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
          >
            Exporter la liste des exposants
          </button>
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
      </div>

      <div class="mb-4">
        <input
          :value="searchInput"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
          type="search"
          aria-label="Rechercher par nom ou e-mail"
          placeholder="Rechercher par nom ou e-mail…"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-md"
        />
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                :aria-sort="sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined"
                @click="toggleSort('name')"
              >
                Établissement{{ sortIcon('name') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stand</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Exposants</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Note</th>
              <th
                class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                :aria-sort="sortBy === 'createdAt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined"
                @click="toggleSort('createdAt')"
              >
                Date{{ sortIcon('createdAt') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="!result?.data?.length">
              <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">
                Aucun établissement trouvé
              </td>
            </tr>
            <tr v-for="row in result?.data" :key="row.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <NuxtLink
                  :to="{ path: `/admin/salm/etablissements/${row.id}`, query: { edition: current.year } }"
                  class="font-medium text-gray-900 hover:text-emerald-700 hover:underline"
                >
                  {{ row.name }}
                </NuxtLink>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ row.standName }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ row.exhibitorCount }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="STATUS_CLASSES[row.status]">{{ schoolStatusLabel(row.status) }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ row.hasNote ? 'Oui' : '—' }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ formatDate(row.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

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
    </template>
  </div>
</template>
