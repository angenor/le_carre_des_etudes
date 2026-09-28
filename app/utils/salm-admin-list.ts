// Ordre des listes du back-office SALM (research R8) : déplacement d'un élément et annonce accessible.

/** Copie de `list` où l'élément `index` est échangé avec son voisin (`direction` = -1 ou 1). */
export function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target]!, copy[index]!]
  return copy
}

/** « « ATELIERS CV » déplacé en position 2 sur 6 » */
export function movedAnnouncement(label: string, position: number, count: number): string {
  return `« ${label} » déplacé en position ${position} sur ${count}`
}
