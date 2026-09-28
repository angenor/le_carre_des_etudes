import { PDFDocument, rgb, setCharacterSpacing, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'
import { formatBadgeNumber, formatDayShort, formatHour, splitSalonName, venueLabel } from '#shared/utils/salm'
import type { SalmContact } from '#shared/types/salm'

// Badge PDF de l'étudiant·e : 2 pages de 100 × 150 mm (research R1, R2 ; FR-030 à FR-031).
// Gabarit : documentations/SALM/maquette/badge-etudiant.dc.html (420 × 630 px → 283,46 × 425,20 pt).

const PAGE_W = 283.46
const PAGE_H = 425.2
const PX = PAGE_W / 420 // facteur maquette (px) → PDF (pt)

const ACCENT = hex('#D5570B')
const WHITE = hex('#FFFFFF')
const SCRIPT = hex('#F1EFEC')
const INK = hex('#1C1917')
const VERSO_BG = hex('#F7F5F2')
const VERSO_TEXT = hex('#C4500A')
const VERSO_BODY = hex('#44403C')
const VERSO_MUTED = hex('#78716C')
const VERSO_RULE = hex('#E2D9CF')

// Nom : taille de la maquette (25 px ≈ 17 pt), réduite jusqu'à 14 pt pour tenir sur 2 lignes (FR-030b)
const NAME_MAX_PT = 25 * PX
const NAME_MIN_PT = 14
// QR code : carré de données visé ≈ 32 mm (≥ 25 mm exigés, FR-030a), plus 2 modules de zone de silence
const QR_DATA_PT = 90
const QR_QUIET_MODULES = 2
const MM = 72 / 25.4

function hex(value: string): RGB {
  const n = Number.parseInt(value.slice(1), 16)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

// ---- Polices (cache de module) ----

const FONT_FILES = {
  title: 'montserrat-800.ttf',
  titleLight: 'montserrat-400.ttf',
  year: 'montserrat-500.ttf',
  small: 'montserrat-600.ttf',
  black: 'montserrat-900.ttf',
  body: 'dm-sans-400.ttf',
  bodySemi: 'dm-sans-600.ttf',
  bodyBold: 'dm-sans-700.ttf',
  script: 'yellowtail-400.ttf',
} as const

type FontKey = keyof typeof FONT_FILES

interface GlyphChecker {
  hasGlyphForCodePoint(codePoint: number): boolean
}

let fontBytesCache: Promise<Record<FontKey, Uint8Array>> | null = null
const glyphCheckers = new Map<FontKey, GlyphChecker>()

async function loadFontBytes(): Promise<Record<FontKey, Uint8Array>> {
  const storage = useStorage('assets:server')
  const entries = await Promise.all(
    (Object.keys(FONT_FILES) as FontKey[]).map(async (key) => {
      const raw = await storage.getItemRaw(`fonts/salm/${FONT_FILES[key]}`)
      if (!raw) throw new Error(`Police SALM introuvable : ${FONT_FILES[key]}`)
      return [key, new Uint8Array(raw as ArrayBufferLike)] as const
    }),
  )
  const bytes = Object.fromEntries(entries) as Record<FontKey, Uint8Array>
  for (const key of Object.keys(bytes) as FontKey[]) {
    glyphCheckers.set(key, fontkit.create(bytes[key]) as unknown as GlyphChecker)
  }
  return bytes
}

function getFontBytes() {
  fontBytesCache ??= loadFontBytes().catch((error) => {
    fontBytesCache = null
    throw error
  })
  return fontBytesCache
}

/**
 * Remplace les caractères absents de la police par leur forme sans diacritiques
 * (« Ș » → « S »), en dernier recours les supprime. Seul le texte dessiné est modifié (FR-030c).
 */
function drawable(text: string, key: FontKey): string {
  const checker = glyphCheckers.get(key)
  if (!checker) return text
  let out = ''
  for (const char of text) {
    if (char === ' ' || checker.hasGlyphForCodePoint(char.codePointAt(0)!)) {
      out += char
      continue
    }
    for (const base of char.normalize('NFD').replace(/\p{M}/gu, '')) {
      if (checker.hasGlyphForCodePoint(base.codePointAt(0)!)) out += base
    }
  }
  return out
}

// ---- Texte ----

interface Fonts {
  pdf: Record<FontKey, PDFFont>
}

interface TextStyle {
  font: FontKey
  size: number
  color: RGB
  /** Espacement des lettres, en em (letter-spacing CSS). */
  tracking?: number
}

function textWidth(fonts: Fonts, text: string, style: TextStyle): number {
  const width = fonts.pdf[style.font].widthOfTextAtSize(text, style.size)
  const tracking = (style.tracking ?? 0) * style.size
  return width + tracking * Math.max(0, [...text].length - 1)
}

function drawText(page: PDFPage, fonts: Fonts, text: string, x: number, baseline: number, style: TextStyle) {
  const tracking = (style.tracking ?? 0) * style.size
  if (tracking) page.pushOperators(setCharacterSpacing(tracking))
  page.drawText(text, { x, y: PAGE_H - baseline, size: style.size, font: fonts.pdf[style.font], color: style.color })
  if (tracking) page.pushOperators(setCharacterSpacing(0))
}

function drawCentered(page: PDFPage, fonts: Fonts, text: string, baseline: number, style: TextStyle) {
  drawText(page, fonts, text, (PAGE_W - textWidth(fonts, text, style)) / 2, baseline, style)
}

/** Découpe en lignes à la largeur donnée : césure aux espaces, puis après un trait d'union. */
function wrap(fonts: Fonts, text: string, maxWidth: number, style: TextStyle): string[] {
  const fits = (s: string) => textWidth(fonts, s, style) <= maxWidth
  const words = text.split(' ').flatMap((word) => {
    if (fits(word)) return [word]
    // Mot trop long : coupure après les traits d'union (le trait reste en fin de ligne)
    return word.split(/(?<=-)/)
  })
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const joiner = line && !line.endsWith('-') ? ' ' : ''
    const candidate = line ? `${line}${joiner}${word}` : word
    if (!line || fits(candidate)) line = candidate
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Plus grande taille (pas de 0,5 pt) qui fait tenir `text` sur `maxLines` lignes au plus. */
function fitText(fonts: Fonts, text: string, maxWidth: number, style: TextStyle, minSize: number, maxLines: number) {
  for (let size = style.size; size >= minSize; size -= 0.5) {
    const lines = wrap(fonts, text, maxWidth, { ...style, size })
    if (lines.length <= maxLines) return { size, lines }
  }
  return null
}

// ---- QR code ----

/** Dessine le QR code (modules vectoriels) centré en `centerX`, fond blanc et zone de silence. Renvoie sa taille. */
function drawQr(page: PDFPage, url: string, centerX: number, bottomY: number): number {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const count = qr.modules.size
  const module = Math.max(QR_DATA_PT, 25 * MM) / count
  const total = module * (count + QR_QUIET_MODULES * 2)
  const left = centerX - total / 2
  const bottom = bottomY // repère PDF : origine en bas de page
  page.drawRectangle({ x: left, y: bottom, width: total, height: total, color: WHITE })
  const origin = left + QR_QUIET_MODULES * module
  for (let row = 0; row < count; row++) {
    let col = 0
    while (col < count) {
      if (!qr.modules.get(row, col)) {
        col++
        continue
      }
      const start = col
      while (col < count && qr.modules.get(row, col)) col++
      page.drawRectangle({
        x: origin + start * module,
        // léger recouvrement vertical pour éviter les filets blancs à l'affichage
        y: bottom + total - QR_QUIET_MODULES * module - (row + 1) * module - 0.02,
        width: (col - start) * module,
        height: module + 0.04,
        color: INK,
      })
    }
  }
  return total
}

/** Aperçu SVG du QR code pour l'écran « Félicitations » (sortie de confiance, sans donnée saisie). */
export function badgeQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1C1917', light: '#FFFFFF' } })
}

// ---- Rendu ----

export interface BadgeRegistration {
  fullName: string
  studyLevel: string
  badgeSeq: number
  verifyToken: string
}

export interface BadgeEdition {
  year: number
  salonName: string
  city: string
  venue: string | null
  organizerName: string
  contacts: SalmContact[]
  days: { date: string; label: string; opensAt: string; closesAt: string }[]
}

export function badgeVerifyUrl(siteUrl: string, verifyToken: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/salm/v/${verifyToken}`
}

export function badgeFileName(year: number, badgeSeq: number): string {
  return `badge-${formatBadgeNumber(year, badgeSeq).toLowerCase()}.pdf`
}

function drawHeader(page: PDFPage, fonts: Fonts, salonName: string, color: RGB, contentWidth: number): number {
  const { main, sub } = splitSalonName(salonName)
  const style: TextStyle = { font: 'title', size: 21 * PX, color }
  const lineHeight = style.size * 1.12
  let baseline = 40 * PX + style.size * 0.93
  for (const line of wrap(fonts, drawable(main, 'title'), contentWidth, style)) {
    drawCentered(page, fonts, line, baseline, style)
    baseline += lineHeight
  }
  if (sub) {
    const subStyle: TextStyle = { font: 'titleLight', size: 17 * PX, color }
    baseline += 2 * PX + subStyle.size * 0.1
    drawCentered(page, fonts, drawable(sub, 'titleLight'), baseline, subStyle)
  }
  return baseline
}

function drawRecto(page: PDFPage, fonts: Fonts, registration: BadgeRegistration, edition: BadgeEdition, qrUrl: string) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: ACCENT })
  const padX = 32 * PX
  const contentWidth = PAGE_W - padX * 2
  let y = drawHeader(page, fonts, edition.salonName, WHITE, contentWidth)

  // « Salm » manuscrit et l'année, décalée à droite sous le mot
  const script: TextStyle = { font: 'script', size: 138 * PX, color: SCRIPT }
  y += 44 * PX + script.size * 0.72
  drawCentered(page, fonts, 'Salm', y, script)
  const yearStyle: TextStyle = { font: 'year', size: 42 * PX, color: WHITE, tracking: -0.02 }
  const yearText = String(edition.year)
  y += 4 * PX + yearStyle.size * 0.8
  drawText(page, fonts, yearText, PAGE_W - padX - 44 * PX - textWidth(fonts, yearText, yearStyle), y, yearStyle)

  // QR code ancré en bas de page
  const qrBottom = 32 * PX
  const qrSize = drawQr(page, qrUrl, PAGE_W / 2, qrBottom)
  const qrTop = PAGE_H - qrBottom - qrSize

  // Nom : jamais tronqué (FR-030b)
  const name = drawable(registration.fullName.toLocaleUpperCase('fr-FR'), 'title')
  const nameStyle: TextStyle = { font: 'title', size: NAME_MAX_PT, color: WHITE }
  const fitted = fitText(fonts, name, contentWidth, nameStyle, NAME_MIN_PT, 2)
    ?? { size: NAME_MIN_PT, lines: wrap(fonts, name, contentWidth, { ...nameStyle, size: NAME_MIN_PT }) }
  const nameLine = fitted.size * 1.15

  // Niveau et numéro, réduits si nécessaire pour tenir sur une ligne
  const infoText = drawable(
    `${registration.studyLevel.toLocaleUpperCase('fr-FR')} · N° ${formatBadgeNumber(edition.year, registration.badgeSeq)}`,
    'bodySemi',
  )
  const infoBase: TextStyle = { font: 'bodySemi', size: 13 * PX, color: WHITE, tracking: 0.1 }
  const infoFit = fitText(fonts, infoText, contentWidth, infoBase, 6.5, 1)
    ?? fitText(fonts, infoText, contentWidth, { ...infoBase, size: 6.5 }, 6.5, 2)!
  const infoStyle = { ...infoBase, size: infoFit.size }

  // Bloc nom + infos, placé sous l'année et centré dans l'espace restant au-dessus du QR code
  const blockHeight = fitted.lines.length * nameLine + 6 * PX + infoFit.lines.length * infoStyle.size * 1.3
  const spaceTop = y + 12 * PX
  const spaceBottom = qrTop - 10 * PX
  let baseline = Math.max(spaceTop, Math.min(y + 34 * PX, spaceBottom - blockHeight)) + fitted.size * 0.93
  for (const line of fitted.lines) {
    drawCentered(page, fonts, line, baseline, { ...nameStyle, size: fitted.size })
    baseline += nameLine
  }
  baseline += 6 * PX - nameLine + fitted.size * 0.2 + infoStyle.size
  for (const line of infoFit.lines) {
    drawCentered(page, fonts, line, baseline, infoStyle)
    baseline += infoStyle.size * 1.3
  }
}

function drawVerso(page: PDFPage, fonts: Fonts, edition: BadgeEdition) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: VERSO_BG })
  const padX = 36 * PX
  const contentWidth = PAGE_W - padX * 2
  let y = drawHeader(page, fonts, edition.salonName, VERSO_TEXT, PAGE_W - 32 * PX * 2)

  const big: TextStyle = { font: 'black', size: 64 * PX, color: VERSO_TEXT, tracking: -0.03 }
  y += 48 * PX + big.size * 0.8
  const bigFit = fitText(fonts, `SALM ${edition.year}`, contentWidth, big, 20, 1)
  drawCentered(page, fonts, `SALM ${edition.year}`, y, { ...big, size: bigFit?.size ?? 20 })

  const tagline: TextStyle = { font: 'small', size: 9 * PX, color: VERSO_TEXT, tracking: 0.06 }
  const taglineText = drawable(edition.salonName.toLocaleUpperCase('fr-FR'), 'small')
  const taglineFit = fitText(fonts, taglineText, contentWidth, tagline, 4.5, 1)
  y += 6 * PX + tagline.size
  drawCentered(page, fonts, taglineText, y, { ...tagline, size: taglineFit?.size ?? 4.5 })

  const participant: TextStyle = { font: 'title', size: 26 * PX, color: VERSO_TEXT }
  y += 44 * PX + participant.size * 0.8
  drawCentered(page, fonts, 'PARTICIPANT(E)', y, participant)

  // Informations pratiques, ancrées en bas
  const body: TextStyle = { font: 'body', size: 13 * PX, color: VERSO_BODY }
  const bold: TextStyle = { ...body, font: 'bodyBold' }
  const muted: TextStyle = { ...body, color: VERSO_MUTED }
  const lineGap = 8 * PX
  const lineHeight = body.size * 1.25

  const rows: { left: string; right?: string; style: TextStyle; wrapLines?: string[] }[] = []
  for (const day of edition.days) {
    rows.push({
      left: drawable(`${day.label} · ${formatDayShort(day.date)}`, 'bodyBold'),
      right: `${formatHour(day.opensAt)} – ${formatHour(day.closesAt)}`,
      style: bold,
    })
  }
  const venue = drawable(venueLabel(edition.venue, edition.city), 'body')
  rows.push({ left: venue, style: body, wrapLines: wrap(fonts, venue, contentWidth, body) })
  // « Organisé par … · contact » sur une ligne, sinon le contact passe entier à la ligne suivante
  const badgeContact = edition.contacts.find((c) => c.onBadge)?.value
  const organizer = drawable(`Organisé par ${edition.organizerName}`, 'body')
  const contact = badgeContact ? drawable(badgeContact, 'body') : null
  const oneLine = contact ? `${organizer} · ${contact}` : organizer
  const organizerLines = textWidth(fonts, oneLine, muted) <= contentWidth
    ? [oneLine]
    : [...wrap(fonts, contact ? `${organizer} ·` : organizer, contentWidth, muted), ...(contact ? [contact] : [])]
  rows.push({ left: oneLine, style: muted, wrapLines: organizerLines })

  const lineCount = rows.reduce((n, r) => n + (r.wrapLines?.length ?? 1), 0)
  const blockHeight = lineCount * lineHeight + (rows.length - 1) * lineGap
  const bottom = PAGE_H - 32 * PX
  const ruleY = bottom - blockHeight - 20 * PX
  page.drawLine({
    start: { x: padX, y: PAGE_H - ruleY },
    end: { x: PAGE_W - padX, y: PAGE_H - ruleY },
    thickness: 0.7,
    color: VERSO_RULE,
  })

  let baseline = ruleY + 20 * PX + body.size * 0.95
  for (const row of rows) {
    for (const line of row.wrapLines ?? [row.left]) {
      drawText(page, fonts, line, padX, baseline, row.style)
      if (row.right && line === row.left) {
        drawText(page, fonts, row.right, PAGE_W - padX - textWidth(fonts, row.right, body), baseline, body)
      }
      baseline += lineHeight
    }
    baseline += lineGap
  }
}

/** PDF du badge, identique quel que soit son mode d'obtention (FR-031). */
export async function renderBadgePdf(
  { registration, edition }: { registration: BadgeRegistration; edition: BadgeEdition },
  siteUrl: string,
): Promise<Uint8Array> {
  const bytes = await getFontBytes()
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setTitle(`Badge ${formatBadgeNumber(edition.year, registration.badgeSeq)} — SALM ${edition.year}`)
  doc.setAuthor(edition.organizerName)
  doc.setCreator('Le Carré des Études')

  const pdf = {} as Record<FontKey, PDFFont>
  for (const key of Object.keys(FONT_FILES) as FontKey[]) {
    pdf[key] = await doc.embedFont(bytes[key], { subset: true })
  }
  const fonts: Fonts = { pdf }

  const qrUrl = badgeVerifyUrl(siteUrl, registration.verifyToken)
  drawRecto(doc.addPage([PAGE_W, PAGE_H]), fonts, registration, edition, qrUrl)
  drawVerso(doc.addPage([PAGE_W, PAGE_H]), fonts, edition)
  return doc.save()
}
