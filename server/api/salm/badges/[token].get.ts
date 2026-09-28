import { defineEventHandler, getRouterParam, setResponseHeaders } from 'h3'
import { renderBadgePdf, badgeFileName } from '../../../utils/salm-badge-pdf'
import { apiError, BADGE_TOKEN_REGEX, findBadgeData, getSiteUrl } from '../../../utils/salm-registration'

// PDF du badge par jeton de téléchargement (FR-030, FR-031).
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') ?? ''
  const data = BADGE_TOKEN_REGEX.test(token) ? await findBadgeData({ downloadToken: token }) : null
  if (!data) throw apiError(404, 'BADGE_NOT_FOUND')

  const pdf = await renderBadgePdf(data, getSiteUrl(event))
  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${badgeFileName(data.edition.year, data.registration.badgeSeq)}"`,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  })
  return Buffer.from(pdf)
})
