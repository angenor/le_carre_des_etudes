<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const page = ref(1)
const limit = ref(20)
const search = ref('')
const searchInput = ref('')
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

const { data: result } = await useFetch('/api/downloads', {
  query: { page, limit, search, sortBy, sortOrder },
  watch: [page, limit, search, sortBy, sortOrder],
})

const totalPages = computed(() => Math.ceil((result.value?.total ?? 0) / limit.value))

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function exportCsv() {
  window.open('/api/downloads/export', '_blank')
}

const columns = [
  { key: 'fullName', label: 'Nom' },
  { key: 'contact', label: 'Contact' },
  { key: 'age', label: 'Âge' },
  { key: 'studyLevel', label: 'Niveau d\'étude' },
  { key: 'fieldOfStudy', label: 'Filière' },
  { key: 'createdAt', label: 'Date' },
]
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-gray-800">Téléchargements</h1>
      <button
        @click="exportCsv"
        class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Exporter CSV
      </button>
    </div>

    <!-- Recherche -->
    <div class="mb-4">
      <input
        :value="searchInput"
        @input="onSearchInput(($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Rechercher par nom, contact ou filière…"
        class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-md"
      />
    </div>

    <!-- Tableau -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
              @click="toggleSort(col.key)"
            >
              {{ col.label }}{{ sortIcon(col.key) }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Magazine
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="!result?.data?.length">
            <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">
              Aucun téléchargement trouvé
            </td>
          </tr>
          <tr v-for="dl in result?.data" :key="dl.id" class="hover:bg-gray-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{{ dl.fullName }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ dl.contact }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ dl.age }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ dl.studyLevel }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ dl.fieldOfStudy }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ formatDate(dl.createdAt) }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ dl.magazine?.name ?? '—' }}</td>
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
  </div>
</template>
