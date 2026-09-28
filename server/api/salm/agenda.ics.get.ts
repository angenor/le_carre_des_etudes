import { defineEventHandler, setResponseHeaders } from 'h3'
import { getPublishedEdition } from '../../utils/salm-edition'
import { apiError } from '../../utils/salm-registration'
import { venueLabel } from '#shared/utils/salm'

// Fichier calendrier de l'édition publiée : un événement par jour (US3-8).

function icsDate(date: string, time: string): string {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00Z`
}

/** Échappement RFC 5545 des valeurs texte. */
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Repli des lignes à 75 octets (RFC 5545). */
function fold(line: string): string {
  const bytes = Buffer.from(line, 'utf8')
  if (bytes.length <= 75) return line
  const parts: string[] = []
  let current = ''
  for (const char of line) {
    const limit = parts.length ? 74 : 75
    if (Buffer.byteLength(current + char, 'utf8') > limit) {
      parts.push(current)
      current = char
    }
    else current += char
  }
  parts.push(current)
  return parts.join('\r\n ')
}

export default defineEventHandler(async (event) => {
  const edition = await getPublishedEdition()
  if (!edition || !edition.days.length) throw apiError(404, 'NO_EDITION')

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const location = venueLabel(edition.venue, edition.city)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Le Carré des Études//SALM//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...edition.days.flatMap((day) => [
      'BEGIN:VEVENT',
      `UID:salm-${edition.year}-${day.date}@lecarredesetudes.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(day.date, day.opensAt)}`,
      `DTEND:${icsDate(day.date, day.closesAt)}`,
      `SUMMARY:${icsText(`SALM ${edition.year} — ${day.label}`)}`,
      `LOCATION:${icsText(location)}`,
      `DESCRIPTION:${icsText(`${edition.salonName}. Organisé par ${edition.organizerName}.`)}`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]

  setResponseHeaders(event, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="salm-${edition.year}.ics"`,
  })
  return `${lines.map(fold).join('\r\n')}\r\n`
})
