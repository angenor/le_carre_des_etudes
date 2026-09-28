import type { SalmAdminEditionsResponse } from '#shared/types/salm'

/**
 * Édition consultée dans le back-office SALM, synchronisée avec `?edition=<année>` (FR-061).
 * Partagée par l'en-tête et les pages (même clé useFetch).
 */
export async function useSalmAdminEdition() {
  const route = useRoute()
  const router = useRouter()
  const { data, refresh } = await useFetch<SalmAdminEditionsResponse>('/api/admin/salm/editions', {
    key: 'salm-admin-editions',
  })

  const editions = computed(() => data.value?.data ?? [])
  const current = computed(() => {
    const year = Number(route.query.edition)
    return editions.value.find((e) => e.year === year)
      ?? editions.value.find((e) => e.id === data.value?.defaultEditionId)
      ?? null
  })

  function select(year: number) {
    router.replace({ query: { ...route.query, edition: String(year), page: undefined } })
  }

  return { editions, current, select, refresh }
}
