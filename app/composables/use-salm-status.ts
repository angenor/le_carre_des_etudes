import type { SalmStatus } from '#shared/types/salm'

/** Édition SALM publiée, partagée par la navbar et le pied de page (une seule requête par rendu). */
export function useSalmStatus() {
  return useFetch<SalmStatus>('/api/salm/status', {
    key: 'salm-status',
    default: () => ({ published: false, year: null }),
  })
}
