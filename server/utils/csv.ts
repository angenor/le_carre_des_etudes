// Export CSV lisible par un tableur en français (research R12) :
// BOM UTF-8, séparateur « ; », fin de ligne CRLF, champs entre guillemets, formules neutralisées.

type Cell = string | number | null | undefined

function escapeCell(value: Cell): string {
  let text = value === null || value === undefined ? '' : String(value)
  // Anti-injection de formule : une donnée saisie par le public ne doit jamais être évaluée
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function toCsv(header: string[], rows: Cell[][]): string {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(';'))
  return `﻿${lines.join('\r\n')}\r\n`
}

/** Date au format `JJ/MM/AAAA HH:MM`, heure d'Abidjan (UTC). */
export function csvDateTime(date: Date): string {
  const d = date.toISOString()
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}`
}

export function csvFileDate(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}
