/**
 * Convertit un texte en slug URL-friendly.
 * Minuscules, tirets, suppression accents et caractères spéciaux.
 * Format: [a-z0-9-]+
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Suppression des accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // Caractères spéciaux → tirets
    .replace(/^-+|-+$/g, '')        // Suppression tirets en début/fin
    .replace(/-{2,}/g, '-')         // Tirets multiples → un seul
}
