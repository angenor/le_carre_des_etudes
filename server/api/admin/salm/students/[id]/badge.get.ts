import { defineEventHandler, setResponseHeaders } from 'h3'
import { badgeFileName, renderBadgePdf } from '../../../../../utils/salm-badge-pdf'
import { findBadgeData, getSiteUrl } from '../../../../../utils/salm-registration'
import { adminError, parseIdParam } from '../../../../../utils/salm-admin'

// Même PDF que la route publique (FR-031, FR-064).
export default defineEventHandler(async (event) => {
  const data = await findBadgeData({ id: parseIdParam(event, 'id') })
  if (!data) throw adminError(404, 'NOT_FOUND', 'Inscription introuvable.')

  const pdf = await renderBadgePdf(data, getSiteUrl(event))
  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${badgeFileName(data.edition.year, data.registration.badgeSeq)}"`,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  })
  return Buffer.from(pdf)
})
