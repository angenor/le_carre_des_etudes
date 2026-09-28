import type { Ref } from 'vue'

// Ordre d'une liste du back-office SALM par boutons « Monter » / « Descendre » (research R8) :
// déplacement optimiste, focus conservé sur le bouton utilisé, annonce de la nouvelle position,
// puis `PUT …/order` si `url` est fourni (listes en table). Sans `url` (publics cibles, contacts),
// l'ordre est enregistré avec le reste du formulaire.

interface OrderButtons {
  focus: (direction: -1 | 1) => void
}

export function useSalmOrder<T>(options: {
  items: Ref<T[]>
  key: (item: T) => string | number
  label: (item: T) => string
  url?: () => string
  /** Erreur d'enregistrement (texte traduit) : la liste est remise dans son ordre précédent. */
  onError?: (message: string) => void
}) {
  const announcement = ref('')
  const saving = ref(false)
  const buttons = new Map<string | number, OrderButtons>()

  function bindButtons(item: T) {
    return (el: unknown) => {
      if (el) buttons.set(options.key(item), el as OrderButtons)
      else buttons.delete(options.key(item))
    }
  }

  async function save(list: T[], previous: T[]) {
    if (!options.url) return
    saving.value = true
    try {
      await $fetch(options.url(), { method: 'PUT', body: { ids: list.map(options.key) } })
    }
    catch (err) {
      options.items.value = previous
      options.onError?.(salmAdminErrorFrom(err))
    }
    finally {
      saving.value = false
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const previous = options.items.value
    const item = previous[index]
    const next = moveItem(previous, index, direction)
    if (!item || next === previous) return
    options.items.value = next
    await nextTick()
    buttons.get(options.key(item))?.focus(direction)
    announcement.value = movedAnnouncement(options.label(item), next.indexOf(item) + 1, next.length)
    await save(next, previous)
  }

  /** Nouvel ordre complet (« Trier par heure »). */
  async function reorder(next: T[], message: string) {
    const previous = options.items.value
    options.items.value = next
    announcement.value = message
    await save(next, previous)
  }

  return { announcement, saving, bindButtons, move, reorder }
}
