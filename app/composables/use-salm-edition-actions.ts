// Actions de statut d'une édition SALM, partagées par la liste et la fiche (contracts/ui-routes.md).
// Chaque action confirme par `confirm()` (research R10), appelle l'API, rafraîchit la liste partagée
// `salm-admin-editions` (en-tête des inscriptions compris) et renvoie le message de succès, ou `null`
// si l'administrateur annule. Les erreurs sont relancées : l'appelant les traduit (`salmAdminErrorFrom`).

interface EditionRef {
  id: number
  year: number
  status: string
  /** Salon terminé (fin du dernier jour passée) ; sans jour, il n'y a rien à signaler. */
  ended: boolean
  dayCount: number
}

/** Pastille de statut : libellé et classes (Brouillon gris, Publiée vert, Archivée ambre). */
export function salmEditionStatus(status: string): { label: string; classes: string } {
  if (status === 'published') return { label: 'Publiée', classes: 'bg-emerald-100 text-emerald-800' }
  if (status === 'archived') return { label: 'Archivée', classes: 'bg-amber-100 text-amber-800' }
  return { label: 'Brouillon', classes: 'bg-gray-100 text-gray-700' }
}

export function useSalmEditionActions() {
  async function refreshList() {
    await refreshNuxtData('salm-admin-editions')
  }

  /** `published` : l'édition actuellement en ligne, archivée par effet de bord. */
  async function publish(e: EditionRef, published: { id: number; year: number } | null): Promise<string | null> {
    let message = published && published.id !== e.id
      ? `Publier le SALM ${e.year} archivera le SALM ${published.year}, actuellement en ligne. Continuer ?`
      : `Publier le SALM ${e.year} ?`
    if (e.status === 'draft' && e.dayCount > 0 && e.ended) {
      message += `\n\nLe SALM ${e.year} est terminé : les inscriptions resteront fermées.`
    }
    if (!confirm(message)) return null
    const result = await $fetch<{ published: { year: number }; archived: { year: number }[] }>(
      `/api/admin/salm/editions/${e.id}/publish`,
      { method: 'POST' },
    )
    await refreshList()
    const archived = result.archived.map((a) => `SALM ${a.year}`).join(', ')
    return archived ? `SALM ${e.year} publié. ${archived} archivé.` : `SALM ${e.year} publié.`
  }

  async function archive(e: EditionRef): Promise<string | null> {
    const message = e.status === 'published'
      ? `Archiver le SALM ${e.year} ? Le site n'affichera plus aucune édition et le lien SALM disparaîtra de la navigation.`
      : `Archiver le SALM ${e.year} ?`
    if (!confirm(message)) return null
    await $fetch(`/api/admin/salm/editions/${e.id}/archive`, { method: 'POST' })
    await refreshList()
    return `SALM ${e.year} archivé.`
  }

  async function remove(e: EditionRef): Promise<string | null> {
    if (!confirm(`Supprimer le brouillon SALM ${e.year} ? Son contenu (jours, créneaux, temps forts, stands, médias) sera définitivement supprimé.`)) return null
    await $fetch(`/api/admin/salm/editions/${e.id}`, { method: 'DELETE' })
    await refreshList()
    return `Brouillon SALM ${e.year} supprimé.`
  }

  /** Crée l'édition N + 1 à partir de N (FR-180), puis ouvre sa fiche avec le message de US3-1. */
  async function duplicate(e: { id: number; year: number }): Promise<string | null> {
    const target = e.year + 1
    if (!confirm(`Créer le SALM ${target} à partir du SALM ${e.year} ? Les textes, contacts, temps forts, chronogramme et types de stands seront recopiés, sans médias ni inscriptions.`)) return null
    const created = await $fetch<{ id: number; year: number }>(`/api/admin/salm/editions/${e.id}/duplicate`, { method: 'POST' })
    await refreshList()
    await navigateTo(`/admin/salm/editions/${created.id}?duplique=${e.year}`)
    return `SALM ${created.year} créé.`
  }

  return { publish, archive, remove, duplicate, refreshList }
}
