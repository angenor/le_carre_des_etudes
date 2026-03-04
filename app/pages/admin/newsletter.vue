<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const page = ref(1)
const limit = ref(20)

const { data: result, refresh } = await useFetch('/api/newsletter', {
  query: { page, limit },
  watch: [page, limit],
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
  window.open('/api/newsletter/export', '_blank')
}

const deletingId = ref<number | null>(null)
const confirmId = ref<number | null>(null)

async function requestDelete(id: number) {
  if (confirmId.value === id) {
    deletingId.value = id
    try {
      await $fetch(`/api/newsletter/${id}`, { method: 'DELETE' })
      await refresh()
    } catch {
      // silently fail
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
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-gray-800">Newsletter</h1>
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

    <!-- Tableau -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Date d'inscription
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="!result?.data?.length">
            <td colspan="3" class="px-4 py-8 text-center text-sm text-gray-400">
              Aucun abonné trouvé
            </td>
          </tr>
          <tr v-for="sub in result?.data" :key="sub.id" class="hover:bg-gray-50">
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{{ sub.email }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ formatDate(sub.createdAt) }}</td>
            <td class="whitespace-nowrap px-4 py-3 text-right">
              <button
                @click="requestDelete(sub.id)"
                :disabled="deletingId === sub.id"
                class="rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                :class="confirmId === sub.id
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-600 hover:bg-red-50'"
              >
                {{ deletingId === sub.id ? '...' : confirmId === sub.id ? 'Confirmer' : 'Supprimer' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between text-sm text-gray-600">
      <p>
        Page {{ result?.page }} sur {{ totalPages }} — {{ result?.total }} abonné{{ (result?.total ?? 0) > 1 ? 's' : '' }}
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
